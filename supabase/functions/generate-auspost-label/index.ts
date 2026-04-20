// deno-lint-ignore-file no-import-prefix
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

serve(async (req) => {
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  try {
    const payload = await req.json();
    const order = payload.record;

    if (order.status !== "paid")
      return new Response("Skipping", { status: 200 });

    const merchantToken = Deno.env.get("AUSPOST_MERCHANT_TOKEN") || "";
    const rawAccount = Deno.env.get("AUSPOST_ACCOUNT_NUMBER") || "";

    // 1. AusPost Contract API requires a 10-digit account number (padded with zeros)
    const accountNum = rawAccount.padStart(10, "0");

    // 2. Encode the token for Basic Auth (Token:Password format, password is blank)
    const authHeader = `Basic ${btoa(merchantToken + ":")}`;

    const addr =
      typeof order.shipping_address === "string"
        ? JSON.parse(order.shipping_address)
        : order.shipping_address;

    console.log(`--- Auth Attempt: Account ${accountNum} ---`);

    const response = await fetch(
      "https://digitalapi.auspost.com.au/shipping/v1/orders",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
          "account-number": accountNum,
        },
        body: JSON.stringify({
          from: {
            name: "MP Fulfillment",
            lines: ["123 Logistics Way"],
            suburb: "MELBOURNE",
            state: "VIC",
            postcode: "3000",
          },
          to: {
            name: order.customer_name || "Customer",
            lines: [addr?.line1 || "No Address"],
            suburb: addr?.city || "",
            state: addr?.state || "",
            postcode: addr?.postal_code || "",
          },
          items: [
            {
              weight: 0.5,
              packaging_type: "PARCEL",
              length: 22,
              width: 16,
              height: 5,
              product_id: "MPOST1",
            },
          ],
        }),
      },
    );

    const rawBody = await response.text();

    if (!response.ok) {
      console.error(`AUTH FAIL (${response.status}). Response:`, rawBody);
      throw new Error(`AusPost Auth Error: ${response.status}`);
    }

    const ausPostData = JSON.parse(rawBody);
    const trackingNumber =
      ausPostData.order.items[0].tracking_details.article_id;
    const labelUrl = ausPostData.order.payment_details.label_url;

    await supabaseAdmin
      .from("orders")
      .update({
        status: "label_created",
        tracking_number: trackingNumber,
        label_pdf_url: labelUrl,
      })
      .eq("id", order.id);

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error: any) {
    console.error("FINAL ERROR:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
});
