// Now we can use clean imports because deno.json handles the URLs
import { serve } from "std/http/server.ts";
import { createClient } from "@supabase/supabase-js";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  try {
    const payload = await req.json();
    console.log("Webhook Received:", JSON.stringify(payload, null, 2));

    // 1. Handle Resend Verification Event
    if (payload.type === "webhook.verification") {
      return new Response("Verified", { status: 200 });
    }

    const emailId = payload.data?.email_id || payload.email_id;

    if (!emailId) {
      console.error("No email_id found");
      return new Response("No email_id found", { status: 400 });
    }

    console.log(`Fetching full content for ID: ${emailId}`);

    // 2. Fetch the actual email content from Resend
    const resendResponse = await fetch(
      `https://api.resend.com/emails/${emailId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!resendResponse.ok) {
      const err = await resendResponse.text();
      console.error("Resend API Error:", err);
      return new Response("Failed to fetch from Resend", { status: 500 });
    }

    const emailData = await resendResponse.json();

    // 3. Extract Data
    const sender =
      typeof emailData.from === "object"
        ? emailData.from.email
        : emailData.from;
    const subject = emailData.subject || "(No Subject)";
    const html = emailData.html || "";
    const text = emailData.text || "";

    // Fallback: If text is empty, strip HTML tags for a preview
    let bodyText = text;
    if (!bodyText && html) {
      bodyText = html
        .replace(/<[^>]*>?/gm, " ")
        .replace(/\s+/g, " ")
        .trim();
    }

    console.log(`Saving email from: ${sender}`);

    // 4. Insert into Supabase
    const { error: dbError } = await supabase.from("inbox_messages").insert({
      sender: sender,
      subject: subject,
      body_text: bodyText,
      body_html: html,
      is_read: false,
    });

    if (dbError) {
      console.error("Database Insert Error:", dbError);
      return new Response("Database Error", { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Function Error:", msg);
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
});
