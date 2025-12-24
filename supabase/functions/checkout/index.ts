import { serve } from "std/http/server.ts";
import { Stripe } from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Define Types to stop 'no-explicit-any' warnings
interface CartItem {
  id: string;
  variantId?: string;
  quantity: number;
}

interface VariantData {
  id: string;
  price: number;
  size_label: string;
  products: {
    name: string;
    image_url: string | null;
  };
}

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
    const { items, session_id, action, discountCode, customerEmail } =
      await req.json();

    // ---------------------------------------------------------
    // PART A: Success Page - Retrieve Session & Record Usage
    // ---------------------------------------------------------
    if (action === "retrieve" && session_id) {
      const session = await stripe.checkout.sessions.retrieve(session_id, {
        expand: ["line_items", "total_details.breakdown"],
      });

      if (session.payment_status === "paid" && session.metadata?.discountCode) {
        const usedEmail =
          session.customer_details?.email || session.metadata.customerEmail;
        const usedCode = session.metadata.discountCode;

        if (usedEmail && usedCode) {
          await supabaseClient
            .from("discount_usage")
            .upsert(
              { email: usedEmail, coupon_code: usedCode },
              { onConflict: "email, coupon_code" }
            );
        }
      }

      return new Response(JSON.stringify({ session }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // ---------------------------------------------------------
    // PART B: Create Checkout Session
    // ---------------------------------------------------------

    // 1. SECURITY: Check if code is already used
    if (discountCode === "WELCOME10" && customerEmail) {
      const { data: usage } = await supabaseClient
        .from("discount_usage")
        .select("*")
        .eq("email", customerEmail)
        .eq("coupon_code", discountCode)
        .single();

      if (usage) {
        return new Response(
          JSON.stringify({
            error: "You have already used the WELCOME10 discount code.",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          }
        );
      }
    }

    // 2. Validate Products
    // Cast items to our interface
    const cartItems = items as CartItem[];
    const variantIds = cartItems.map((item) => item.variantId || item.id);

    const { data: dbVariants, error: dbError } = await supabaseClient
      .from("variants")
      .select("id, price, size_label, products(name, image_url)")
      .in("id", variantIds);

    if (dbError) throw new Error(dbError.message);

    // Create a map for easy lookup
    const dbVariantMap = new Map<string, VariantData>();
    if (dbVariants) {
      dbVariants.forEach((v) => {
        // Force cast the Supabase response to our interface
        dbVariantMap.set(v.id, v as unknown as VariantData);
      });
    }

    let calculatedSubtotal = 0;
    const hasValidDiscount = discountCode === "WELCOME10";
    const discountMultiplier = hasValidDiscount ? 0.9 : 1.0;

    // 3. Build Line Items
    const lineItems = cartItems.map((item) => {
      const dbVariant = dbVariantMap.get(item.variantId || item.id);
      if (!dbVariant) throw new Error("Product variant not found");

      const originalPrice = dbVariant.price;
      const finalUnitAmount = Math.round(
        originalPrice * discountMultiplier * 100
      );
      const quantity = item.quantity;

      calculatedSubtotal += finalUnitAmount * quantity;

      return {
        price_data: {
          currency: "aud",
          product_data: {
            name: hasValidDiscount
              ? `${dbVariant.products.name} (10% Off)`
              : dbVariant.products.name,
            description: dbVariant.size_label,
            images: dbVariant.products.image_url
              ? [dbVariant.products.image_url]
              : [],
          },
          unit_amount: finalUnitAmount,
        },
        quantity: quantity,
      };
    });

    // 4. Shipping
    const FREE_SHIPPING_THRESHOLD_CENTS = 15000;
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
          unit_amount: 999,
        },
        quantity: 1,
      });
    }

    // 5. Create Session
    // Use Stripe's explicit type for params
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      line_items: lineItems,
      mode: "payment",
      success_url: `${req.headers.get(
        "origin"
      )}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/shop`,
      shipping_address_collection: { allowed_countries: ["AU"] },
      phone_number_collection: { enabled: true },
      metadata: {
        discountCode: hasValidDiscount ? "WELCOME10" : null,
        customerEmail: customerEmail,
      },
    };

    if (customerEmail) {
      sessionParams.customer_email = customerEmail;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    // Handle error safely
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
