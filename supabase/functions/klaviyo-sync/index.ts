// No need to import 'serve' from a URL anymore, we use the built-in Deno.serve!

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const { table, type, record } = payload;

    // Grab the keys we will set later
    const KLAVIYO_API_KEY = Deno.env.get("KLAVIYO_API_KEY");
    const KLAVIYO_LIST_ID = Deno.env.get("KLAVIYO_LIST_ID");

    if (!KLAVIYO_API_KEY) {
      throw new Error("Missing Klaviyo API Key");
    }

    const KLAVIYO_REVISION = "2024-02-15"; // Klaviyo's required API version header

    // ==========================================
    // SCENARIO 1: NEW SUBSCRIBER OPT-IN
    // ==========================================
    if (table === "subscribers" && type === "INSERT") {
      const email = record.email;

      if (!KLAVIYO_LIST_ID)
        throw new Error("Missing Klaviyo List ID for Subscribers");

      const klaviyoPayload = {
        data: {
          type: "profile-subscription-bulk-create-job",
          attributes: {
            custom_source: "Website Footer Opt-in",
            profiles: {
              data: [
                {
                  type: "profile",
                  attributes: {
                    email: email,
                    subscriptions: {
                      email: { marketing: { consent: "SUBSCRIBED" } },
                    },
                  },
                },
              ],
            },
          },
          relationships: {
            list: {
              data: {
                type: "list",
                id: KLAVIYO_LIST_ID,
              },
            },
          },
        },
      };

      const response = await fetch(
        "https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs/",
        {
          method: "POST",
          headers: {
            Authorization: `Klaviyo-API-Key ${KLAVIYO_API_KEY}`,
            accept: "application/vnd.api+json",
            "content-type": "application/vnd.api+json",
            revision: KLAVIYO_REVISION,
          },
          body: JSON.stringify(klaviyoPayload),
        },
      );

      if (!response.ok) {
        const errText = await response.text();
        console.error("Klaviyo Subscriber Error:", errText);
        throw new Error("Failed to push subscriber to Klaviyo");
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Subscriber synced to Klaviyo",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        },
      );
    }

    // ==========================================
    // SCENARIO 2: NEW PAID ORDER
    // ==========================================
    if (table === "orders" && (type === "INSERT" || type === "UPDATE")) {
      // Only fire if the order status is paid
      if (record.status !== "paid") {
        return new Response(
          JSON.stringify({ message: "Order not paid, ignoring." }),
          { headers: corsHeaders, status: 200 },
        );
      }

      const klaviyoEventPayload = {
        data: {
          type: "event",
          attributes: {
            profile: {
              email: record.customer_email,
              first_name: record.customer_name?.split(" ")[0] || "",
              last_name:
                record.customer_name?.split(" ").slice(1).join(" ") || "",
            },
            metric: {
              name: "Placed Order",
            },
            properties: {
              OrderId: record.id,
              Value: record.total_amount,
              Items: record.items, // Passes the JSON array of products purchased
              ShippingMethod: record.shipping_method,
              PaymentMethod: record.payment_method,
            },
            time: record.created_at,
            value: record.total_amount,
          },
        },
      };

      const response = await fetch("https://a.klaviyo.com/api/events/", {
        method: "POST",
        headers: {
          Authorization: `Klaviyo-API-Key ${KLAVIYO_API_KEY}`,
          accept: "application/vnd.api+json",
          "content-type": "application/vnd.api+json",
          revision: KLAVIYO_REVISION,
        },
        body: JSON.stringify(klaviyoEventPayload),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("Klaviyo Order Event Error:", errText);
        throw new Error("Failed to push order event to Klaviyo");
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Order event synced to Klaviyo",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        },
      );
    }

    // Fallback for unhandled tables
    return new Response(
      JSON.stringify({ message: "Webhook received but no action required." }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    // FIX: Check if the error is a standard Error object to satisfy TypeScript strict mode
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";

    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
