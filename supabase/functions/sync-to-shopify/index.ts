import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SHOPIFY_STORE = "your-client-store.myshopify.com"; // Change this
const SHOPIFY_TOKEN = Deno.env.get("SHOPIFY_ACCESS_TOKEN");

serve(async (req) => {
  try {
    const { orderData, items, customer } = await req.json();

    // 1. Format Supabase Data into Shopify JSON
    // Shopify requires specific structure.
    const shopifyPayload = {
      order: {
        email: customer.email,
        financial_status: "paid", // Because they paid via Stripe on your site
        line_items: items.map((item: any) => ({
          title: item.product_name_snapshot,
          quantity: item.quantity,
          price: item.price_at_purchase,
          // Optional: Add SKU if you have it
        })),
        shipping_address: {
          first_name: customer.name.split(" ")[0],
          last_name: customer.name.split(" ")[1] || "",
          address1: orderData.shipping_address.line1,
          city: orderData.shipping_address.city,
          province: orderData.shipping_address.state,
          zip: orderData.shipping_address.postal_code,
          country: "Australia", // or orderData.shipping_address.country
        },
        note: `Supabase Order ID: ${orderData.id}`,
        tags: "Web Order, Supabase",
      },
    };

    // 2. Send to Shopify
    const response = await fetch(
      `https://${SHOPIFY_STORE}/admin/api/2023-10/orders.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": SHOPIFY_TOKEN!,
        },
        body: JSON.stringify(shopifyPayload),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Shopify Sync Error:", data);
      throw new Error("Failed to sync to Shopify");
    }

    return new Response(JSON.stringify({ shopifyId: data.order.id }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
    });
  }
});
