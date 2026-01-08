// CHANGED: Use full URL instead of "std/"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Define interface to avoid 'any' error
interface OrderItem {
  name: string;
  quantity: number;
  size?: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, name, orderId, trackingNumber, items, address, status } =
      await req.json();

    if (!RESEND_API_KEY) {
      throw new Error("Missing RESEND_API_KEY");
    }

    // 1. Determine Content based on Status
    const isShipped = status === "shipped";
    const title = isShipped
      ? "Your Order Has Shipped! 🚚"
      : "Your Order Has Been Delivered! ✅";

    const subject = isShipped
      ? `Shipping Update: Order #${orderId.slice(0, 8)}`
      : `Delivered: Order #${orderId.slice(0, 8)}`;

    const trackingHtml =
      isShipped && trackingNumber && trackingNumber !== "N/A"
        ? `
        <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <p style="margin: 0 0 10px 0; color: #64748b; font-size: 0.9rem;">TRACKING NUMBER</p>
          <p style="margin: 0; font-size: 1.25rem; font-weight: bold; letter-spacing: 1px; color: #0f172a;">${trackingNumber}</p>
          <a href="https://auspost.com.au/mypost/track/#/details/${trackingNumber}" style="display: inline-block; margin-top: 15px; background: #0f172a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Track Package</a>
        </div>
      `
        : "";

    const messageBody = isShipped
      ? "Great news! Your order has been packed and dispatched from our facility."
      : "Your package has been delivered. We hope you enjoy your products!";

    // 2. Build Item List HTML
    const itemsHtml = items
      .map(
        (item: OrderItem) =>
          `<li style="padding: 10px 0; border-bottom: 1px solid #eee;">
             <strong style="color: #333;">${item.name}</strong> 
             ${
               item.size
                 ? `<span style="color: #666; font-size: 0.9em;">(${item.size})</span>`
                 : ""
             }
             <span style="float: right; font-weight: bold;">x${
               item.quantity
             }</span>
           </li>`
      )
      .join("");

    // 3. Send Email
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Melbourne Peptides <info@melbournepeptides.com>",
        to: [email],
        subject: subject,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <h1 style="color: #0f172a; text-align: center; margin-bottom: 30px;">${title}</h1>
            
            <p style="font-size: 1.1rem; line-height: 1.6;">Hi ${
              name || "there"
            },</p>
            <p style="font-size: 1.1rem; line-height: 1.6;">${messageBody}</p>
            
            ${trackingHtml}

            <h3 style="border-bottom: 2px solid #eee; padding-bottom: 10px; margin-top: 30px;">Order Summary</h3>
            <ul style="list-style: none; padding: 0;">${itemsHtml}</ul>

            <div style="margin-top: 40px; font-size: 0.9rem; color: #64748b; border-top: 1px solid #eee; padding-top: 20px;">
              <p>Shipping to: ${address?.line1 || ""}, ${address?.city || ""} ${
          address?.postal_code || ""
        }</p>
              <p>If you have any questions, simply reply to this email.</p>
            </div>
          </div>
        `,
      }),
    });

    const data = await res.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
