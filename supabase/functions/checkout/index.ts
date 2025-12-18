import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.44.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2022-11-15",
});

serve(async (req: Request) => {
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

    // 1. Get product prices from DB
    const variantIds = items.map((item: any) => item.variantId);
    const { data: dbVariants, error: dbError } = await supabaseClient
      .from("variants")
      .select("id, price, size_label, products(name, image_url)")
      .in("id", variantIds);

    if (dbError) throw new Error(dbError.message);

    const dbVariantMap = new Map(dbVariants.map((v: any) => [v.id, v]));
    let calculatedSubtotal = 0;

    // 2. Create the list of products
    const lineItems = items.map((item: any) => {
      const dbVariant = dbVariantMap.get(item.variantId);
      const validatedPrice = dbVariant.price;
      const quantity = item.quantity;

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

    // 3. THE "SHIPPING AS A PRODUCT" LOGIC
    // If order is under $150, we ADD a product called "Flat Rate Shipping"
    const FREE_SHIPPING_THRESHOLD_CENTS = 15000; // <--- UPDATED TO 15000 CENTS ($150)
    const isFreeShipping = calculatedSubtotal >= FREE_SHIPPING_THRESHOLD_CENTS;

    if (!isFreeShipping) {
      lineItems.push({
        price_data: {
          currency: "aud",
          product_data: {
            name: "Flat Rate Shipping",
            description: "Standard Shipping (24hr Dispatch)",
            images: ["https://cdn-icons-png.flaticon.com/512/411/411763.png"],
          },
          unit_amount: 999, // $9.99
        },
        quantity: 1,
      });
    }

    // 4. Create Session
    const session = await stripe.checkout.sessions.create({
      line_items: lineItems,
      mode: "payment",
      success_url: `${req.headers.get(
        "origin"
      )}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/?canceled=true`,

      shipping_address_collection: { allowed_countries: ["AU"] },
      phone_number_collection: { enabled: true },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: `Error: ${error.message}` }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
});
