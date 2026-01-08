import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Receive expanded data (items + address)
    const { orderId, email, name, trackingNumber, items, address } =
      await req.json();

    // 2. Generate Items HTML
    const itemsHtml = items
      .map(
        (item: any) => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 12px 0; color: #334155;">
                <span style="font-weight: 600; color: #0f172a;">${
                  item.name
                }</span>
                ${
                  item.size
                    ? `<br/><span style="font-size: 0.85em; color: #64748b;">Size: ${item.size}</span>`
                    : ""
                }
            </td>
            <td style="padding: 12px 0; text-align: right; color: #334155;">x${
              item.quantity
            }</td>
        </tr>
    `
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
        subject: `Your Order #${orderId.slice(0, 8)} has Shipped!`,
        html: `
          <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0f172a;">Great news, ${name || "Customer"}!</h2>
            <p>Your order <strong>#${orderId.slice(
              0,
              8
            )}</strong> has been shipped and is on its way.</p>
            
            ${
              trackingNumber
                ? `
            <div style="background: #f0fdf4; border: 1px solid #dcfce7; padding: 20px; border-radius: 8px; margin: 25px 0; text-align: center;">
                <p style="margin: 0; font-size: 0.85rem; color: #166534; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">Tracking Number</p>
                <p style="margin: 8px 0 0 0; font-size: 1.5rem; font-weight: 800; letter-spacing: 1px; color: #15803d;">${trackingNumber}</p>
                <p style="margin-top: 15px;">
                    <a href="https://auspost.com.au/mypost/track/#/details/${trackingNumber}" 
                       style="display: inline-block; background: #166534; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 0.9rem;">
                       Track Shipment &rarr;
                    </a>
                </p>
            </div>
            `
                : ""
            }

            <h3 style="border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-top: 30px; color: #0f172a;">Shipping Details</h3>
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; color: #475569; font-size: 0.95rem; line-height: 1.6;">
                <strong>${name}</strong><br/>
                ${address.line1}<br/>
                ${address.line2 ? `${address.line2}<br/>` : ""}
                ${address.city}, ${address.state} ${address.postal_code}<br/>
                ${address.country}<br/>
                ${
                  address.phone
                    ? `<br/><span style="color: #64748b;">📞 ${address.phone}</span>`
                    : ""
                }
            </div>

            <h3 style="border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-top: 30px; color: #0f172a;">Items in this Shipment</h3>
            <table style="width: 100%; border-collapse: collapse;">
                ${itemsHtml}
            </table>
            
            <p style="color: #94a3b8; font-size: 0.85rem; margin-top: 40px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px;">
                Thank you for choosing Melbourne Peptides.<br/>
                If you have any questions, simply reply to this email.
            </p>
          </div>
        `,
      }),
    });

    const data = await res.json();
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
