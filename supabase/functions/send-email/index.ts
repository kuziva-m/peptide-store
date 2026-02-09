import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// --- INTERFACES ---
interface OrderItem {
  name: string;
  quantity: number;
  size?: string;
}

// --- CONFIGURATION ---
const LOGO_URL = "https://melbournepeptides.com.au/logo.png";

// --- TEMPLATE ENGINE ---
// This function wraps ANY content in your professional branding
const renderEmailTemplate = (title: string, contentHtml: string) => `
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
              
              <div style="font-size: 16px; line-height: 1.6; color: #475569;">
                ${contentHtml}
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
`;

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();

    if (!RESEND_API_KEY) {
      throw new Error("Missing RESEND_API_KEY");
    }

    let toAddress: string[] = [];
    let finalSubject = "";
    let finalHtml = "";

    // ========================================================================
    // SCENARIO A: GENERIC EMAIL (From Admin Panel)
    // ========================================================================
    if (payload.html && payload.to) {
      toAddress = Array.isArray(payload.to) ? payload.to : [payload.to];
      finalSubject = payload.subject || "Message from Melbourne Peptides";

      // We wrap your raw text in the nice template.
      // We use the Subject Line as the main Title inside the email too.
      finalHtml = renderEmailTemplate(finalSubject, payload.html);
    }

    // ========================================================================
    // SCENARIO B: TRANSACTIONAL EMAIL (Shipping Updates)
    // ========================================================================
    else {
      const {
        email,
        name,
        orderId,
        trackingNumber,
        items,
        address,
        status,
        message,
      } = payload;

      if (!email || !orderId) {
        throw new Error("Missing required fields: email or orderId");
      }

      toAddress = [email];

      // 1. Determine Content based on Status
      let title = "";
      let messageBody = "";

      if (status === "custom") {
        title = "Update Regarding Your Order";
        finalSubject = `Message regarding Order #${orderId.slice(0, 8)}`;
        messageBody = message
          ? message.replace(/\n/g, "<br>")
          : "Please check your order details.";
      } else if (status === "label_created") {
        title = "Shipping Label Created";
        finalSubject = `Update: Label Created for Order #${orderId.slice(0, 8)}`;
        messageBody =
          "Your shipping label has been created. Your package is being prepared and will be dispatched the next business day.";
      } else if (status === "shipped") {
        title = "Your Order Is On The Way";
        finalSubject = `Shipping Update: Order #${orderId.slice(0, 8)}`;
        messageBody =
          "Great news. Your order has been packed and dispatched from our facility.";
      } else if (status === "delivered") {
        title = "Your Order Has Been Delivered";
        finalSubject = `Delivered: Order #${orderId.slice(0, 8)}`;
        messageBody =
          "Your package has been delivered. We hope you are satisfied with your products.";
      } else {
        title = "Order Update";
        finalSubject = `Update: Order #${orderId.slice(0, 8)}`;
        messageBody = `Your order status has been updated to: ${status}`;
      }

      // 2. Build Components
      const greetingHtml = `<p style="margin: 0 0 16px 0;">Hi ${name || "there"},</p>`;
      const mainMessageHtml = `<p style="margin: 0 0 24px 0;">${messageBody}</p>`;

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
          </div>`
          : "";

      const itemsListHtml = (items || [])
        .map(
          (item: OrderItem) =>
            `<tr style="border-bottom: 1px solid #f1f5f9;">
               <td style="padding: 12px 0; color: #334155; font-weight: 500;">
                 ${item.name} 
                 ${item.size ? `<span style="color: #94a3b8; font-weight: 400; font-size: 13px;"> (${item.size})</span>` : ""}
               </td>
               <td style="padding: 12px 0; text-align: right; color: #0f172a; font-weight: 600;">
                 x${item.quantity}
               </td>
             </tr>`,
        )
        .join("");

      const itemsHtml = itemsListHtml
        ? `
        <div style="margin-top: 40px;">
          <h3 style="margin: 0 0 16px 0; font-size: 14px; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 0.5px;">Order Summary</h3>
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse: collapse;">
            ${itemsListHtml}
          </table>
        </div>`
        : "";

      const addressHtml = address
        ? `
        <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #f1f5f9;">
          <p style="margin: 0; font-size: 14px; color: #94a3b8; line-height: 1.5;">
            <strong>Shipping to:</strong><br/>
            ${address.line1 || ""}<br/>
            ${address.city || ""}, ${address.postal_code || ""}
          </p>
        </div>`
        : "";

      // 3. Combine Components
      const combinedContent =
        greetingHtml + mainMessageHtml + trackingHtml + itemsHtml + addressHtml;

      // 4. Wrap in Template
      finalHtml = renderEmailTemplate(title, combinedContent);
    }

    // ========================================================================
    // FINAL STEP: SEND TO RESEND
    // ========================================================================
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Melbourne Peptides <info@melbournepeptides.com.au>",
        to: toAddress,
        subject: finalSubject,
        html: finalHtml,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

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
