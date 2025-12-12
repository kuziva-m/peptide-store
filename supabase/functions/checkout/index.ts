import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.44.0"; // Import Supabase Client

// Initialize Stripe Client
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2022-11-15",
});

serve(async (req: Request) => {
  // CORS Headers
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  // Initialize Supabase Client for database access (crucial for security)
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", // Use Service Role Key for Admin access
    {
      auth: {
        persistSession: false,
      },
    }
  );

  try {
    const { action, items, session_id } = await req.json();

    // 1. RETRIEVE ORDER (For the Success Page receipt)
    if (action === "retrieve" && session_id) {
      const session = await stripe.checkout.sessions.retrieve(session_id, {
        expand: ["line_items"],
      });
      return new Response(JSON.stringify({ session }), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // 2. CREATE CHECKOUT SESSION (Default)

    // --- SECURITY FIX: VALIDATE PRICES AGAINST THE DATABASE ---
    const variantIds = items.map((item: any) => item.variantId);

    const { data: dbVariants, error: dbError } = await supabaseClient
      .from("variants")
      .select("id, price, size_label, products(name, image_url)")
      .in("id", variantIds);

    if (dbError) throw new Error(dbError.message);
    if (!dbVariants || dbVariants.length !== variantIds.length) {
      throw new Error("One or more cart items were not found in the database.");
    }

    const dbVariantMap = new Map(dbVariants.map((v: any) => [v.id, v]));

    const lineItems = items.map((item: any) => {
      const dbVariant = dbVariantMap.get(item.variantId);
      const product = dbVariant.products;

      // CRITICAL: Use the price from the database, NOT the price from the client.
      const validatedPrice = dbVariant.price;
      const quantity = item.quantity;

      // Ensure the validated price is valid before proceeding
      if (typeof validatedPrice !== "number" || validatedPrice <= 0) {
        throw new Error(
          `Invalid price found for variant ID: ${item.variantId}`
        );
      }

      return {
        price_data: {
          currency: "aud",
          product_data: {
            name: product.name,
            description: dbVariant.size_label,
            // Use the image URL from the product data
            images: product.image_url ? [product.image_url] : [],
          },
          // Convert dollars to cents and round
          unit_amount: Math.round(validatedPrice * 100),
        },
        quantity: quantity,
      };
    });
    // --- END SECURITY FIX ---

    const session = await stripe.checkout.sessions.create({
      line_items: lineItems,
      mode: "payment",
      // IMPORTANT: Pass the session ID to the success page so we can generate the receipt
      success_url: `${req.headers.get(
        "origin"
      )}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/?canceled=true`,

      // THIS IS THE MISSING PIECE FOR ADDRESSES:
      shipping_address_collection: {
        allowed_countries: ["AU"], // Restrict to Australia
      },
      phone_number_collection: {
        enabled: true, // Collect phone for delivery updates
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: `Payment Processing Error: ${errorMessage}` }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
