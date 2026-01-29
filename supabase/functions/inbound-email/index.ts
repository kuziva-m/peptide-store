// deno-lint-ignore-file no-import-prefix
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FORWARD_TO_EMAIL = "Hadyc10@yahoo.com";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

serve(async (req) => {
  try {
    const payload = await req.json();
    console.log("Webhook Received:", JSON.stringify(payload, null, 2));

    const data = payload.data || payload;
    const emailId = data.email_id || data.id;

    if (!emailId) throw new Error("No email_id found in payload");

    console.log(`Fetching email ID: ${emailId}`);

    // 1. Fetch Email Content using CORRECT endpoint for INBOUND emails
    const resendResponse = await fetch(
      `https://api.resend.com/emails/receiving/${emailId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error(`Resend API Failed (${resendResponse.status}):`, errorText);
      throw new Error(`Resend API Error: ${errorText}`);
    }

    const emailData = await resendResponse.json();
    console.log("Email content fetched successfully");

    // 2. Extract Data
    const html = emailData.html || "";
    const text = emailData.text || "";
    let bodyText = text;
    if (!bodyText && html) {
      bodyText = html
        .replace(/<[^>]*>?/gm, " ")
        .replace(/\s+/g, " ")
        .trim();
    }
    const sender = emailData.from || data.from || "(Unknown)";
    const subject = emailData.subject || data.subject || "(No Subject)";

    console.log("Extracted:", {
      sender,
      subject,
      hasHtml: !!html,
      hasText: !!bodyText,
    });

    // 3. Save to Admin Panel
    const { error: dbError } = await supabase.from("inbox_messages").insert({
      sender: sender,
      subject: subject,
      body_text: bodyText || "(No content)",
      body_html: html || bodyText,
      is_read: false,
    });

    if (dbError) throw dbError;
    console.log("Saved to Database");

    // 4. FORWARD to Yahoo
    if (FORWARD_TO_EMAIL) {
      const forwardResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Melbourne Peptides <info@melbournepeptides.com.au>",
          to: FORWARD_TO_EMAIL,
          subject: `[New Inquiry] ${subject}`,
          html: `
              <div style="background: #f4f4f5; padding: 20px; font-family: sans-serif;">
                <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
                  <p style="color: #666; font-size: 12px;"><strong>From:</strong> ${sender}</p>
                  <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                  ${html || bodyText.replace(/\n/g, "<br>")}
                </div>
                <p style="text-align: center; color: #999; font-size: 11px; margin-top: 20px;">
                  Reply to this email to answer the customer.
                </p>
              </div>
            `,
          reply_to: sender,
        }),
      });

      if (!forwardResponse.ok) {
        const errorText = await forwardResponse.text();
        console.error("Forward failed:", errorText);
      } else {
        console.log(`Forwarded to ${FORWARD_TO_EMAIL}`);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Critical Error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
