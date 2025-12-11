import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno";

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
    const lineItems = items.map((item: any) => ({
      price_data: {
        currency: "aud", // <--- CHANGED TO AUD
        product_data: {
          name: item.name,
          description: item.size,
          // Add images if they exist
          images: item.image ? [item.image] : [],
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

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
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
});
