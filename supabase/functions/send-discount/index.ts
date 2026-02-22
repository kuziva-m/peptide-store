import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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
    const { name, email } = await req.json();

    const SENDER_NAME = "Melbourne Peptides";
    const SENDER_EMAIL = "support@melbournepeptides.com.au";

    console.log(`Sending email to ${email} from ${SENDER_NAME}`);

    const { data, error } = await resend.emails.send({
      from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
      to: [email],
      reply_to: "melbournepeptides1@gmail.com",
      subject: "Welcome to Melbourne Peptides",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #334155;">
          <h1 style="color: #0f172a; text-align: center;">Welcome to Melbourne Peptides</h1>
          <p>Hi ${name},</p>
          <p>Thank you for joining our community. As a welcome gift, we have a special discount for you.</p>
          
          <div style="background: #f1f5f9; padding: 20px; text-align: center; border-radius: 8px; margin: 30px 0;">
            <p style="margin: 0 0 10px 0; font-size: 0.9rem; color: #64748b;">YOUR EXCLUSIVE CODE:</p>
            <span style="font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: 2px;">WELCOME10</span>
          </div>

          <p>Apply this code at checkout to receive <strong>10% OFF</strong> your first order.</p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://melbournepeptides.com.au/shop" style="background: #0f172a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">Shop Now</a>
          </div>
          
           <p style="margin-top: 40px; font-size: 0.8rem; color: #94a3b8; text-align: center;">
            Peptides. Not for human consumption.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend Error:", error);
      throw error;
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
