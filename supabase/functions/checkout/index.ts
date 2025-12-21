import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.44.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2022-11-15",
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    // 1. Receive inputs (including discountCode)
    const { items, session_id, action, discountCode } = await req.json();

    if (action === "retrieve" && session_id) {
      const session = await stripe.checkout.sessions.retrieve(session_id, {
        expand: ["line_items", "total_details.breakdown"],
      });
      return new Response(JSON.stringify({ session }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Validate Products with Database
    const variantIds = items.map((item: any) => item.variantId || item.id);
    const { data: dbVariants, error: dbError } = await supabaseClient
      .from("variants")
      .select("id, price, size_label, products(name, image_url)")
      .in("id", variantIds);

    if (dbError) throw new Error(dbError.message);

    const dbVariantMap = new Map(dbVariants.map((v: any) => [v.id, v]));
    let calculatedSubtotal = 0;

    const lineItems = items.map((item: any) => {
      const dbVariant = dbVariantMap.get(item.variantId || item.id);

      if (!dbVariant) throw new Error("Product variant not found");

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

    // 3. Shipping Logic
    const FREE_SHIPPING_THRESHOLD_CENTS = 15000; // $150
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

    // 4. Session Config
    const sessionParams: any = {
      line_items: lineItems,
      mode: "payment",
      success_url: `${req.headers.get(
        "origin"
      )}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/?canceled=true`,
      shipping_address_collection: { allowed_countries: ["AU"] },
      phone_number_collection: { enabled: true },
    };

    // 5. APPLY COUPON (This adds the deduction to Stripe)
    // Make sure you created the coupon "WELCOME10" in your Stripe Dashboard!
    if (discountCode === "WELCOME10") {
      sessionParams.discounts = [
        {
          coupon: "WELCOME10",
        },
      ];
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: `Error: ${error.message}` }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
