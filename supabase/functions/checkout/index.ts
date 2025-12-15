import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.44.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2022-11-15",
});

serve(async (req: Request) => {
  // CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const { action, items, session_id } = await req.json();

    if (action === "retrieve" && session_id) {
      const session = await stripe.checkout.sessions.retrieve(session_id, {
        expand: ["line_items", "total_details.breakdown"],
      });
      return new Response(JSON.stringify({ session }), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

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
    let calculatedSubtotal = 0; // In Cents

    const lineItems = items.map((item: any) => {
      const dbVariant = dbVariantMap.get(item.variantId);
      const validatedPrice = dbVariant.price;
      const quantity = item.quantity;

      if (typeof validatedPrice !== "number" || validatedPrice < 0) {
        throw new Error(
          `Invalid price found for variant ID: ${item.variantId}`
        );
      }

      // Add to running subtotal (Dollars * 100 * Quantity)
      calculatedSubtotal += Math.round(validatedPrice * 100) * quantity;

      return {
        price_data: {
          currency: "aud",
          product_data: {
            name: dbVariant.products.name,
            description: dbVariant.size_label,
            images: dbVariant.products.image_url
              ? [dbVariant.products.image_url]
              : [],
          },
          unit_amount: Math.round(validatedPrice * 100),
        },
        quantity: quantity,
      };
    });

    // --- FREE SHIPPING LOGIC ---
    // Threshold is $129.00 AUD (12900 cents)
    const FREE_SHIPPING_THRESHOLD_CENTS = 12900;
    const isFreeShipping = calculatedSubtotal >= FREE_SHIPPING_THRESHOLD_CENTS;
    const shippingAmount = isFreeShipping ? 0 : 999; // 0 or 999 cents ($9.99)

    const session = await stripe.checkout.sessions.create({
      line_items: lineItems,
      mode: "payment",
      success_url: `${req.headers.get(
        "origin"
      )}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/?canceled=true`,

      shipping_address_collection: { allowed_countries: ["AU"] },
      phone_number_collection: { enabled: true },

      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: {
              amount: shippingAmount,
              currency: "aud",
            },
            // Dynamic Label
            display_name: isFreeShipping
              ? "Free Express Shipping"
              : "Standard Shipping (24hr Dispatch)",
            delivery_estimate: {
              minimum: { unit: "business_day", value: 1 },
              maximum: { unit: "business_day", value: 3 },
            },
          },
        },
      ],
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
