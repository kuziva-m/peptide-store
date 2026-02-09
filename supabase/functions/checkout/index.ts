import { serve } from "std/http/server.ts";
import { Stripe } from "stripe";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Initialize Stripe
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

// Environment Variables
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");
const ADMIN_EMAIL = "Melbournepeptides1@gmail.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature",
};

// --- Types ---
interface CartItem {
  id: string;
  variantId?: string;
  quantity: number;
}

interface ProductData {
  name: string;
  image_url: string | null;
}

interface VariantData {
  id: number;
  price: number;
  size_label: string;
  products: ProductData;
}

interface OrderItemInsert {
  variant_id: number;
  quantity: number;
  price_at_purchase: number;
  product_name_snapshot: string;
  order_id?: string;
}

interface AdminEmailItem {
  quantity: number;
  product_name_snapshot: string;
  price_at_purchase: number;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  try {
    // =========================================================================
    // PART 1: WEBHOOK HANDLER
    // =========================================================================
    const signature = req.headers.get("Stripe-Signature");

    if (signature && STRIPE_WEBHOOK_SECRET) {
      const body = await req.text();
      let event;

      try {
        event = await stripe.webhooks.constructEventAsync(
          body,
          signature,
          STRIPE_WEBHOOK_SECRET,
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown webhook error";
        console.error(`Webhook signature verification failed: ${errorMessage}`);
        return new Response(`Webhook Error: ${errorMessage}`, { status: 400 });
      }

      if (event.type === "checkout.session.completed") {
        const eventSession = event.data.object as Stripe.Checkout.Session;

        // --- FIX: FORCE REFRESH FROM STRIPE ---
        console.log(`Refreshing session data for: ${eventSession.id}`);

        // CORRECTED LINE: Removed "shipping_details" from expand array
        const session = await stripe.checkout.sessions.retrieve(
          eventSession.id,
          { expand: ["line_items"] },
        );

        let orderId = session.metadata?.supabase_order_id;

        console.log(
          `Webhook processing. Session ID: ${session.id}, Order ID: ${orderId || "N/A"}`,
        );

        // --- ADDRESS EXTRACTION LOGIC ---
        const shippingObj = session.shipping_details;
        const customerObj = session.customer_details;

        const rawAddress = shippingObj?.address || customerObj?.address;
        const phone = shippingObj?.phone || customerObj?.phone || "N/A";
        const name = shippingObj?.name || customerObj?.name || "Guest";

        const cleanAddress = {
          line1: rawAddress?.line1 || "",
          line2: rawAddress?.line2 || "",
          city: rawAddress?.city || "",
          state: rawAddress?.state || "",
          postal_code: rawAddress?.postal_code || "",
          country: rawAddress?.country || "AU",
          phone: phone,
          name: name,
        };

        if (orderId) {
          // --- SCENARIO A: UPDATE EXISTING ORDER ---
          console.log(`Updating existing Order ID: ${orderId}`);
          const { error: updateError } = await supabaseClient
            .from("orders")
            .update({
              status: "paid",
              stripe_session_id: session.id,
              customer_name: name,
              customer_email: session.customer_details?.email,
              shipping_address: cleanAddress,
              updated_at: new Date().toISOString(),
              total_amount: (session.amount_total || 0) / 100,
              shipping_cost:
                (session.total_details?.amount_shipping || 0) / 100,
              discount_code: session.metadata?.discountCode || null,
            })
            .eq("id", orderId);

          if (updateError) {
            console.error("Failed to update order in webhook:", updateError);
          }
        } else {
          // --- SCENARIO B: HANDLE "ORPHAN" PAYMENT LINKS ---
          console.log(
            "No Order ID found. Creating new order from Stripe data...",
          );

          const lineItems = session.line_items?.data || [];

          // 1. Prepare Items JSON for the 'orders' table
          // deno-lint-ignore no-explicit-any
          const itemsJson = lineItems.map((item: any) => ({
            name: item.description || "Unknown Item",
            quantity: item.quantity,
            unit_price: (item.price?.unit_amount || 0) / 100,
            description: item.description,
          }));

          // 2. Create the Order in Supabase
          const { data: newOrder, error: createError } = await supabaseClient
            .from("orders")
            .insert({
              customer_email: session.customer_details?.email,
              customer_name: name,
              status: "paid",
              total_amount: (session.amount_total || 0) / 100,
              shipping_cost:
                (session.total_details?.amount_shipping || 0) / 100,
              shipping_address: cleanAddress,
              stripe_session_id: session.id,
              shipping_method: "Standard",
              created_at: new Date().toISOString(),
              notes: "Created via Direct Payment Link",
              items: itemsJson,
            })
            .select("id")
            .single();

          if (createError) {
            console.error("Failed to create orphan order:", createError);
          } else {
            orderId = newOrder.id;

            // 3. Create Order Items (Table rows)
            // deno-lint-ignore no-explicit-any
            const itemsToInsert = lineItems.map((item: any) => ({
              order_id: newOrder.id,
              quantity: item.quantity,
              price_at_purchase: (item.price?.unit_amount || 0) / 100,
              product_name_snapshot: item.description || "Unknown Item",
              variant_id: null,
            }));

            if (itemsToInsert.length > 0) {
              await supabaseClient.from("order_items").insert(itemsToInsert);
            }
          }
        }

        // --- COMMON: SAVE DISCOUNT & SEND EMAIL ---
        if (session.metadata?.discountCode && session.customer_details?.email) {
          await supabaseClient.from("discount_usage").upsert(
            {
              email: session.customer_details.email,
              coupon_code: session.metadata.discountCode,
            },
            { onConflict: "email, coupon_code" },
          );
        }

        // Pass the REFRESHED session (with correct address) to the email function
        if (orderId && session.metadata?.admin_notified !== "true") {
          if (!session.metadata) session.metadata = {};
          session.metadata.supabase_order_id = orderId;

          // We pass the clean address explicitly to helper so we don't have to re-parse
          await sendAdminEmail(session, supabaseClient, cleanAddress);
        }
      }

      return new Response(JSON.stringify({ received: true }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    // =========================================================================
    // PART 2: REGULAR API REQUESTS (Checkout Initialization)
    // =========================================================================
    const {
      items,
      action,
      discountCode,
      customerEmail,
      shippingMethod,
      session_id,
    } = await req.json();

    if (action === "retrieve" && session_id) {
      const session = await stripe.checkout.sessions.retrieve(session_id);
      return new Response(JSON.stringify({ session }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // 1. Fetch & Validate Discount
    let validDiscount = null;
    if (discountCode) {
      const { data } = await supabaseClient
        .from("discounts")
        .select("*")
        .ilike("code", discountCode.trim())
        .eq("active", true)
        .maybeSingle();

      if (data) validDiscount = data;
    }

    const cartItems = items as CartItem[];
    const variantIds = cartItems.map((item) => item.variantId || item.id);

    // 2. Fetch Product Data
    const { data: dbVariants, error: dbError } = await supabaseClient
      .from("variants")
      .select("id, price, size_label, products(name, image_url)")
      .in("id", variantIds);

    if (dbError) throw new Error(dbError.message);

    const dbVariantMap = new Map<string, VariantData>();
    if (dbVariants) {
      const variants = dbVariants as unknown as VariantData[];
      variants.forEach((v) => dbVariantMap.set(v.id.toString(), v));
    }

    let calculatedSubtotal = 0;
    const orderItemsToInsert: OrderItemInsert[] = [];

    // 3. Build Line Items
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      cartItems.map((item) => {
        const vId = item.variantId || item.id;
        const dbVariant = dbVariantMap.get(vId.toString());
        if (!dbVariant) throw new Error(`Product variant ${vId} not found`);

        let unitPrice = dbVariant.price;
        let itemName = dbVariant.products.name;

        // Apply Discount
        if (validDiscount && validDiscount.type === "percentage") {
          const multiplier = 1 - validDiscount.value / 100;
          unitPrice = unitPrice * multiplier;
          itemName = `${itemName} (${validDiscount.value}% Off)`;
        }

        const finalUnitAmount = Math.round(unitPrice * 100);
        calculatedSubtotal += finalUnitAmount * item.quantity;

        orderItemsToInsert.push({
          variant_id: parseInt(vId),
          quantity: item.quantity,
          price_at_purchase: finalUnitAmount / 100,
          product_name_snapshot: itemName,
        });

        return {
          price_data: {
            currency: "aud",
            product_data: {
              name: itemName,
              description: dbVariant.size_label,
              images: dbVariant.products.image_url
                ? [dbVariant.products.image_url]
                : [],
              metadata: { variantId: vId },
            },
            unit_amount: finalUnitAmount,
          },
          quantity: item.quantity,
        };
      });

    // 4. Calculate Shipping
    const FREE_STD_THRESHOLD_CENTS = 15000;
    const FREE_EXP_THRESHOLD_CENTS = 25000;
    const couponGrantsFreeShip = validDiscount?.free_shipping === true;

    let shippingCost = 0;
    let shippingName = "";
    let minDays = 2,
      maxDays = 6;

    if (shippingMethod === "express") {
      const isFree =
        calculatedSubtotal >= FREE_EXP_THRESHOLD_CENTS || couponGrantsFreeShip;
      shippingCost = isFree ? 0 : 1499;
      shippingName = isFree ? "Free Express Shipping" : "Express Shipping";
      minDays = 1;
      maxDays = 3;
    } else {
      const isFree =
        calculatedSubtotal >= FREE_STD_THRESHOLD_CENTS || couponGrantsFreeShip;
      shippingCost = isFree ? 0 : 999;
      shippingName = isFree ? "Free Shipping" : "Standard Shipping";
    }

    const shippingOptions: Stripe.Checkout.SessionCreateParams.ShippingOption[] =
      [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: shippingCost, currency: "aud" },
            display_name: shippingName,
            delivery_estimate: {
              minimum: { unit: "business_day", value: minDays },
              maximum: { unit: "business_day", value: maxDays },
            },
          },
        },
      ];

    // 5. CREATE PENDING ORDER
    const { data: pendingOrder, error: insertError } = await supabaseClient
      .from("orders")
      .insert({
        customer_email: customerEmail,
        status: "pending",
        total_amount: (calculatedSubtotal + shippingCost) / 100,
        shipping_cost: shippingCost / 100,
        shipping_method: shippingMethod === "express" ? "Express" : "Standard",
        discount_code: validDiscount ? validDiscount.code : null,
        created_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (insertError)
      throw new Error(`Failed to init order: ${insertError.message}`);

    // 6. Insert Items
    if (orderItemsToInsert.length > 0) {
      const itemsWithOrderId = orderItemsToInsert.map((i) => ({
        ...i,
        order_id: pendingOrder.id,
      }));
      await supabaseClient.from("order_items").insert(itemsWithOrderId);
    }

    // 7. Create Stripe Session
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      line_items: lineItems,
      mode: "payment",
      success_url: `${req.headers.get(
        "origin",
      )}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/shop`,
      shipping_address_collection: { allowed_countries: ["AU"] },
      shipping_options: shippingOptions,
      phone_number_collection: { enabled: true },
      metadata: {
        supabase_order_id: pendingOrder.id,
        discountCode: validDiscount ? validDiscount.code : null,
        shippingMethod: shippingMethod === "express" ? "Express" : "Standard",
      },
    };

    if (customerEmail) {
      sessionParams.customer_email = customerEmail;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

// --- HELPER: Send Admin Email ---
async function sendAdminEmail(
  session: Stripe.Checkout.Session,
  supabaseClient: SupabaseClient,
  cleanAddress: any, // Receive clean address directly
) {
  if (!RESEND_API_KEY) return;

  const totalAmount = (session.amount_total || 0) / 100;
  const customerInfo = session.customer_details;
  const discountUsed = session.metadata?.discountCode || "None";
  const orderId = session.metadata?.supabase_order_id;

  // Use the clean address passed from the main handler
  const addressData = cleanAddress || {
    line1: "N/A",
    line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "AU",
  };

  const { data: dbItems } = await supabaseClient
    .from("order_items")
    .select("quantity, product_name_snapshot, price_at_purchase")
    .eq("order_id", orderId);

  const items = (dbItems as unknown as AdminEmailItem[]) || [];

  const itemsHtml =
    items
      .map(
        (item) =>
          `<li style="margin-bottom: 8px;">
       <strong>${item.product_name_snapshot}</strong> 
       x ${item.quantity} - $${item.price_at_purchase.toFixed(2)}
     </li>`,
      )
      .join("") || "<li>Items listed in dashboard</li>";

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "Melbourne Peptides <info@melbournepeptides.com.au>",
      to: [ADMIN_EMAIL],
      subject: `New Order Received! ($${totalAmount.toFixed(2)})`,
      html: `
        <div style="font-family: sans-serif; color: #333;">
          <h2>New Order Alert</h2>
          <p><strong>Customer:</strong> ${cleanAddress.name || "Guest"}</p>
          <p><strong>Discount Code:</strong> <strong>${discountUsed}</strong></p> 
          <p><strong>Email:</strong> ${customerInfo?.email || "N/A"}</p>
          <p><strong>Phone:</strong> ${cleanAddress.phone || "N/A"}</p>
          <p><strong>Total:</strong> $${totalAmount.toFixed(2)} AUD</p>
          
          <h3>Order Items:</h3>
          <ul>${itemsHtml}</ul>
          
          <h3>Shipping Details:</h3>
          <p>
            ${addressData.line1}<br>
            ${addressData.line2 ? addressData.line2 + "<br>" : ""}
            ${addressData.city}, ${addressData.state} ${addressData.postal_code}<br>
            ${addressData.country}
          </p>
        </div>
      `,
    }),
  });
}
