// Use the full URL import to avoid "Relative import" errors
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

    // --- CONFIGURATION ---
    const LOGO_URL = "https://melbournepeptides.com.au/logo.png";

    // 1. Determine Content based on Status
    let title = "";
    let subject = "";
    let messageBody = "";

    // LOGIC UPDATE: Handle "Label Created" vs "Shipped" vs "Delivered"
    if (status === "label_created") {
      title = "Shipping Label Created";
      subject = `Update: Label Created for Order #${orderId.slice(0, 8)}`;
      messageBody =
        "Your shipping label has been created. Your package is being prepared and will be dispatched the next business day.";
    } else if (status === "shipped") {
      title = "Your Order Is On The Way";
      subject = `Shipping Update: Order #${orderId.slice(0, 8)}`;
      messageBody =
        "Great news. Your order has been packed and dispatched from our facility.";
    } else if (status === "delivered") {
      title = "Your Order Has Been Delivered";
      subject = `Delivered: Order #${orderId.slice(0, 8)}`;
      messageBody =
        "Your package has been delivered. We hope you are satisfied with your products.";
    } else {
      // Fallback for generic updates
      title = "Order Update";
      subject = `Update: Order #${orderId.slice(0, 8)}`;
      messageBody = `Your order status has been updated to: ${status}`;
    }

    // 2. Build Tracking Section (Only show if tracking number exists)
    const trackingHtml =
      trackingNumber && trackingNumber !== "N/A"
        ? `
        <div style="margin: 32px 0; padding: 24px; background-color: #f8fafc; border-radius: 8px; text-align: center; border: 1px solid #e2e8f0;">
          <p style="margin: 0 0 8px 0; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Tracking Number</p>
          <p style="margin: 0 0 20px 0; font-family: monospace; font-size: 16px; color: #334155; font-weight: 600; letter-spacing: 0.5px;">${trackingNumber}</p>
          <a href="https://auspost.com.au/mypost/track/#/details/${trackingNumber}" 
             style="display: inline-block; background-color: #0f172a; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; font-size: 14px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
             Track Package
          </a>
        </div>
      `
        : "";

    // 3. Build Item List HTML
    const itemsHtml = items
      .map(
        (item: OrderItem) =>
          `<tr style="border-bottom: 1px solid #f1f5f9;">
             <td style="padding: 12px 0; color: #334155; font-weight: 500;">
               ${item.name} 
               ${
                 item.size
                   ? `<span style="color: #94a3b8; font-weight: 400; font-size: 13px;"> (${item.size})</span>`
                   : ""
               }
             </td>
             <td style="padding: 12px 0; text-align: right; color: #0f172a; font-weight: 600;">
               x${item.quantity}
             </td>
           </tr>`
      )
      .join("");

    // 4. Send Email
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Melbourne Peptides <support@melbournepeptides.com.au>",
        to: [email],
        subject: subject,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td align="center" style="padding: 40px 0;">
        
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); overflow: hidden;">
          
          <tr>
            <td align="center" style="padding: 40px 0 20px 0; background-color: #ffffff; border-bottom: 1px solid #f1f5f9;">
              <img src="${LOGO_URL}" alt="Melbourne Peptides" height="50" style="display: block; border: 0; outline: none; text-decoration: none;" />
            </td>
          </tr>

          <tr>
            <td style="padding: 40px;">
              <h1 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 700; color: #0f172a; text-align: center;">${title}</h1>
              
              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #475569;">Hi ${
                name || "there"
              },</p>
              
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #475569;">${messageBody}</p>

              ${trackingHtml}

              <div style="margin-top: 40px;">
                <h3 style="margin: 0 0 16px 0; font-size: 14px; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 0.5px;">Order Summary</h3>
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse: collapse;">
                  ${itemsHtml}
                </table>
              </div>

              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #f1f5f9;">
                <p style="margin: 0; font-size: 14px; color: #94a3b8; line-height: 1.5;">
                  <strong>Shipping to:</strong><br/>
                  ${address?.line1 || ""}<br/>
                  ${address?.city || ""}, ${address?.postal_code || ""}
                </p>
              </div>

            </td>
          </tr>

          <tr>
            <td style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #f1f5f9;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                Melbourne Peptides<br/>
                If you have any questions, simply reply to this email.
              </p>
            </td>
          </tr>
        </table>

        <p style="margin-top: 24px; font-size: 12px; color: #cbd5e1; text-align: center;">
          Peptides. Not for human consumption.
        </p>

      </td>
    </tr>
  </table>

</body>
</html>
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
