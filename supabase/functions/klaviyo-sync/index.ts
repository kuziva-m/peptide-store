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
        throw new Error(`Klaviyo rejected subscriber: ${errText}`);
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
    // SCENARIO 2: NEW PLACED ORDER
    // ==========================================
    if (table === "orders" && type === "INSERT") {
      
      const klaviyoEventPayload = {
        data: {
          type: "event",
          attributes: {
            // KLAVIYO FIX: Wrapped profile in data > type > attributes
            profile: {
              data: {
                type: "profile",
                attributes: {
                  email: record.customer_email,
                  first_name: record.customer_name?.split(" ")[0] || "",
                  last_name: record.customer_name?.split(" ").slice(1).join(" ") || "",
                }
              }
            },
            // KLAVIYO FIX: Wrapped metric in data > type > attributes
            metric: {
              data: {
                type: "metric",
                attributes: {
                  name: "Placed Order"
                }
              }
            },
            properties: {
              OrderId: record.id,
              Value: record.total_amount,
              Items: record.items, 
              ShippingMethod: record.shipping_method || "Standard",
              PaymentMethod: "Bank Transfer",
              OrderStatus: record.status
            },
            time: record.created_at || new Date().toISOString(),
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
        throw new Error(`Klaviyo rejected order event: ${errText}`);
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
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";

    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});