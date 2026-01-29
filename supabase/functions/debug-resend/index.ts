import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

serve(async (req) => {
  try {
    // 1. Check if Key exists
    if (!RESEND_API_KEY) throw new Error("No RESEND_API_KEY found in Secrets!");

    // 2. Print Key Prefix (Safety check)
    const keyPrefix = RESEND_API_KEY.slice(0, 5);

    // 3. Ask Resend for the list of emails this key can see
    const response = await fetch("https://api.resend.com/emails", {
      method: "GET",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}` },
    });

    const data = await response.json();

    return new Response(
      JSON.stringify(
        {
          status: "Debug Complete",
          key_used: `${keyPrefix}...`,
          can_key_see_emails: response.ok,
          emails_visible_to_this_key: data.data ? data.data.length : 0,
          recent_email_subjects: data.data
            ? data.data.map((e: any) => e.subject)
            : [],
          raw_response: data,
        },
        null,
        2,
      ),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      headers: { "Content-Type": "application/json" },
    });
  }
});
