import { serve } from "std/http/server.ts";
import { Stripe } from "stripe";
import { createClient } from "@supabase/supabase-js";

// Initialize Stripe
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

// Initialize Resend API Key (for emails)
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ADMIN_EMAIL = "Melbournepeptides1@gmail.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// --- Types ---
interface CartItem {
  id: string;
  variantId?: string;
  quantity: number;
}

interface VariantData {
  id: string;
  price: number;
  size_label: string;
  products: {
    name: string;
    image_url: string | null;
  };
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const {
      items,
      session_id,
      action,
      discountCode,
      customerEmail,
      shippingMethod,
    } = await req.json();

    // ---------------------------------------------------------
    // PART A: Success Page - Retrieve Session, SAVE ORDER, & Notify
    // ---------------------------------------------------------
    if (action === "retrieve" && session_id) {
      const session = await stripe.checkout.sessions.retrieve(session_id, {
        expand: ["line_items.data.price.product", "total_details.breakdown"],
      });

      if (
        session.payment_status === "paid" ||
        session.payment_status === "no_payment_required"
      ) {
        // 1. Prepare Address & Phone
        const shippingAddress = {
          ...session.shipping_details?.address,
          phone: session.customer_details?.phone || "N/A",
        };

        // 2. Save Order to Database
        const { data: orderData, error: orderError } = await supabaseClient
          .from("orders")
          .upsert(
            {
              stripe_session_id: session.id,
              customer_email: session.customer_details?.email,
              customer_name: session.customer_details?.name,
              total_amount: (session.amount_total || 0) / 100,
              shipping_cost:
                (session.total_details?.amount_shipping || 0) / 100,
              status: "pending",
              shipping_address: shippingAddress,
              items: session.line_items?.data || [],
              created_at: new Date().toISOString(),
              // CHANGED: Save shipping method from metadata
              shipping_method: session.metadata?.shippingMethod || "Standard",
            },
            { onConflict: "stripe_session_id" }
          )
          .select()
          .single();

        if (orderError) {
          console.error("FAILED TO SAVE ORDER:", orderError);
        } else if (orderData) {
          // 3. Update order_items table (Inventory Linking)
          await supabaseClient
            .from("order_items")
            .delete()
            .eq("order_id", orderData.id);

          const orderItemsToInsert = session.line_items?.data
            .filter((item: Stripe.LineItem) => item.price?.product)
            .map((item: Stripe.LineItem) => {
              const product = item.price?.product as Stripe.Product;
              const variantId = product.metadata?.variantId;

              // Ensure we don't accidentally save shipping as a product
              if (item.description?.includes("Shipping")) return null;

              return {
                order_id: orderData.id,
                variant_id: variantId ? parseInt(variantId) : null,
                quantity: item.quantity,
                price_at_purchase: (item.price?.unit_amount || 0) / 100,
                product_name_snapshot: item.description,
              };
            })
            .filter(Boolean);

          if (orderItemsToInsert && orderItemsToInsert.length > 0) {
            const { error: itemsError } = await supabaseClient
              .from("order_items")
              .insert(orderItemsToInsert);

            if (itemsError) console.error("Failed to save items:", itemsError);
          }
        }

        // 4. Record Discount Usage
        if (session.metadata?.discountCode) {
          const usedEmail =
            session.customer_details?.email || session.metadata.customerEmail;
          const usedCode = session.metadata.discountCode;

          if (usedEmail && usedCode) {
            await supabaseClient
              .from("discount_usage")
              .upsert(
                { email: usedEmail, coupon_code: usedCode },
                { onConflict: "email, coupon_code" }
              );
          }
        }

        // 5. Admin Notification
        if (!session.metadata?.admin_notified) {
          console.log("Sending admin notification...");

          const customerInfo = session.customer_details;
          const lineItems = session.line_items?.data || [];
          const totalAmount = (session.amount_total || 0) / 100;

          const itemsHtml = lineItems
            .map(
              (item: Stripe.LineItem) =>
                `<li style="margin-bottom: 8px;">
                  <strong>${item.description || "Product"}</strong> 
                  x ${item.quantity} - $${(
                  (item.amount_total || 0) / 100
                ).toFixed(2)}
                 </li>`
            )
            .join("");

          if (RESEND_API_KEY) {
            await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${RESEND_API_KEY}`,
              },
              body: JSON.stringify({
                from: "Melbourne Peptides <info@melbournepeptides.com>",
                to: [ADMIN_EMAIL],
                subject: `New Order Received! ($${totalAmount.toFixed(2)})`,
                html: `
                  <div style="font-family: sans-serif; color: #333;">
                    <h2>New Order Alert 🚀</h2>
                    <p><strong>Customer:</strong> ${
                      customerInfo?.name || "Guest"
                    }</p>
                    <p><strong>Email:</strong> ${
                      customerInfo?.email || "N/A"
                    }</p>
                    <p><strong>Phone:</strong> ${
                      customerInfo?.phone || "N/A"
                    }</p>
                    <p><strong>Total:</strong> $${totalAmount.toFixed(
                      2
                    )} AUD</p>
                    
                    <h3>Order Items:</h3>
                    <ul>${itemsHtml}</ul>
                    
                    <h3>Shipping Details:</h3>
                    <p>
                      ${customerInfo?.address?.line1 || ""}<br>
                      ${customerInfo?.address?.line2 || ""}<br>
                      ${customerInfo?.address?.city || ""}, ${
                  customerInfo?.address?.state || ""
                } ${customerInfo?.address?.postal_code || ""}<br>
                      ${customerInfo?.address?.country || ""}
                    </p>
                  </div>
                `,
              }),
            });
          }

          await stripe.checkout.sessions.update(session_id, {
            metadata: {
              ...session.metadata,
              admin_notified: "true",
            },
          });
        }
      }

      return new Response(JSON.stringify({ session }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // ---------------------------------------------------------
    // PART B: Create Checkout Session
    // ---------------------------------------------------------

    // 1. FETCH DISCOUNT FROM DB (CASE INSENSITIVE)
    let validDiscount = null;
    if (discountCode) {
      const { data } = await supabaseClient
        .from("discounts")
        .select("*")
        .ilike("code", discountCode.trim()) // UPDATED: ilike for case-insensitive match
        .eq("active", true)
        .maybeSingle();

      if (data) {
        validDiscount = data;
      }
    }

    const cartItems = items as CartItem[];
    const variantIds = cartItems.map((item) => item.variantId || item.id);

    const { data: dbVariants, error: dbError } = await supabaseClient
      .from("variants")
      .select("id, price, size_label, products(name, image_url)")
      .in("id", variantIds);

    if (dbError) throw new Error(dbError.message);

    const dbVariantMap = new Map<string, VariantData>();
    if (dbVariants) {
      dbVariants.forEach((v) => {
        dbVariantMap.set(v.id.toString(), v as unknown as VariantData);
      });
    }

    let calculatedSubtotal = 0;

    // 2. BUILD LINE ITEMS (Applying Percentage Discounts)
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      cartItems.map((item) => {
        const vId = item.variantId || item.id;
        const dbVariant = dbVariantMap.get(vId.toString());
        if (!dbVariant) throw new Error("Product variant not found");

        let unitPrice = dbVariant.price;
        let itemName = dbVariant.products.name;

        // Apply Percentage Discount Logic
        if (validDiscount && validDiscount.type === "percentage") {
          const multiplier = 1 - validDiscount.value / 100;
          unitPrice = unitPrice * multiplier;
          // Update name to reflect discount (e.g. "BPC-157 (10% Off)")
          itemName = `${itemName} (${validDiscount.value}% Off)`;
        }

        const finalUnitAmount = Math.round(unitPrice * 100);
        const quantity = item.quantity;

        calculatedSubtotal += finalUnitAmount * quantity;

        return {
          price_data: {
            currency: "aud",
            product_data: {
              name: itemName,
              description: dbVariant.size_label,
              images: dbVariant.products.image_url
                ? [dbVariant.products.image_url]
                : [],
              metadata: {
                variantId: vId,
              },
            },
            unit_amount: finalUnitAmount,
          },
          quantity: quantity,
        };
      });

    // ---------------------------------------------------------
    // SHIPPING LOGIC
    // ---------------------------------------------------------
    const FREE_STD_THRESHOLD_CENTS = 15000; // $150.00
    const FREE_EXP_THRESHOLD_CENTS = 25000; // $250.00

    let shippingCost = 0;
    let shippingName = "";
    let minDays = 2,
      maxDays = 6;

    // Check if the discount explicitly grants free shipping (e.g. Test Code)
    const couponGrantsFreeShip = validDiscount?.free_shipping === true;

    if (shippingMethod === "express") {
      // Express is free if total >= $250 OR coupon grants it
      const isFree =
        calculatedSubtotal >= FREE_EXP_THRESHOLD_CENTS || couponGrantsFreeShip;
      shippingCost = isFree ? 0 : 1499;
      shippingName = isFree
        ? "🚀 Free Express Shipping"
        : "🚀 Express Shipping";
      minDays = 1;
      maxDays = 3;
    } else {
      // Standard is free if total >= $150 OR coupon grants it
      const isFree =
        calculatedSubtotal >= FREE_STD_THRESHOLD_CENTS || couponGrantsFreeShip;
      shippingCost = isFree ? 0 : 999;
      shippingName = isFree ? "🚚 Free Shipping" : "🚚 Standard Shipping";
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

    // Determine clean name for DB saving
    const shippingMethodName =
      shippingMethod === "express" ? "Express" : "Standard";

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      line_items: lineItems,
      mode: "payment",
      success_url: `${req.headers.get(
        "origin"
      )}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/shop`,
      shipping_address_collection: { allowed_countries: ["AU"] },
      shipping_options: shippingOptions, // Only contains the selected option
      phone_number_collection: { enabled: true },
      metadata: {
        discountCode: validDiscount ? validDiscount.code : null,
        customerEmail: customerEmail,
        admin_notified: null,
        shippingMethod: shippingMethodName, // <--- SAVED FOR DB RETRIEVAL
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
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
