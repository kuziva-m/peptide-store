import { useState, useEffect, useRef } from "react";
import { useCart } from "../lib/CartContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  ArrowLeft,
  Loader,
  Truck,
  Copy,
  Upload,
  CheckCircle,
  Landmark,
  Tag,
  AlertTriangle,
} from "lucide-react";
import "../components/CartDrawer.css";

export default function Checkout() {
  const { cart, cartTotal } = useCart();
  const navigate = useNavigate();

  // --- 🚨 FIXED: STABILIZED ORDER ID 🚨 ---
  // We use React's initializer function to generate a fresh UUID once per checkout visit.
  // This keeps the ID perfectly stable while they type or upload files,
  // but prevents duplicate key errors if they come back to place a 2nd order!
  const [orderId] = useState(() => crypto.randomUUID());

  const shortRef = orderId.slice(0, 8).toUpperCase();

  // --- STATE ---
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState("");

  const [receiptFile, setReceiptFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [liveVariants, setLiveVariants] = useState({});

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    line1: "",
    city: "",
    state: "",
    postcode: "",
  });

  const [shippingMethod, setShippingMethod] = useState("standard");

  // --- DISCOUNT & VOUCHER STATE ---
  const [discountCode, setDiscountCode] = useState("");
  const [appliedCodeType, setAppliedCodeType] = useState(null); // 'promo' | 'voucher' | null

  // Promo State
  const [discountAmount, setDiscountAmount] = useState(0);
  const [promoFreeShipping, setPromoFreeShipping] = useState(false);

  // Voucher State
  const [voucherData, setVoucherData] = useState(null);

  const [discountError, setDiscountError] = useState("");
  const [discountSuccess, setDiscountSuccess] = useState("");
  const [isVerifyingDiscount, setIsVerifyingDiscount] = useState(false);

  // --- ADDRESSFINDER REF ---
  const addressInputRef = useRef(null);

  // Redirect if cart is empty
  useEffect(() => {
    if (!cart || cart.length === 0) {
      navigate("/shop");
    }
  }, [cart, navigate]);

  // Fetch Live Preorder Status
  useEffect(() => {
    async function fetchLiveVariants() {
      if (!cart || cart.length === 0) return;
      const variantIds = cart.map((item) => item.variantId || item.id);
      const { data } = await supabase
        .from("variants")
        .select("id, is_preorder")
        .in("id", variantIds);
      if (data) {
        const map = {};
        data.forEach((v) => {
          map[v.id] = v.is_preorder === true || v.is_preorder === "true";
        });
        setLiveVariants(map);
      }
    }
    fetchLiveVariants();
  }, [cart]);

  // =========================================================================
  // 📮 ADDRESSFINDER (AUSPOST) AUTOCOMPLETE INJECTION
  // =========================================================================
  useEffect(() => {
    if (document.getElementById("addressfinder-script")) return;

    const script = document.createElement("script");
    script.id = "addressfinder-script";
    script.src = "https://api.addressfinder.io/assets/v3/widget.js";
    script.async = true;

    script.onload = () => {
      if (!addressInputRef.current || !window.AddressFinder) return;

      const widget = new window.AddressFinder.Widget(
        addressInputRef.current,
        "M64FCTH9LBRYUNQ38J7W", // Your Live Licence Key
        "AU",
        {
          address_params: {
            source: "gnaf,paf",
          },
        },
      );

      widget.on("address:select", (fullAddress, metaData) => {
        setFormData((prev) => ({
          ...prev,
          line1: metaData.address_line_1 || fullAddress,
          city: metaData.locality_name || prev.city,
          state: metaData.state_territory || prev.state,
          postcode: metaData.postcode || prev.postcode,
        }));
      });
    };

    document.body.appendChild(script);

    return () => {
      const scriptEl = document.getElementById("addressfinder-script");
      if (scriptEl) scriptEl.remove();
    };
  }, []);
  // =========================================================================

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setReceiptFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
    }
  };

  const getVariantLabel = (v) => {
    if (!v) return "";
    if (typeof v === "string") return v;
    if (typeof v === "object") return v.size_label || "Option";
    return String(v);
  };

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(""), 2000);
  };

  // --- "SMART" DISCOUNT VERIFIER ---
  const handleApplyDiscount = async () => {
    setDiscountError("");
    setDiscountSuccess("");
    const code = discountCode.trim().toUpperCase();

    if (!code) {
      setDiscountError("Please enter a code.");
      return;
    }

    setIsVerifyingDiscount(true);

    try {
      // 1. FIRST, CHECK IF IT'S A STORE CREDIT VOUCHER
      const { data: voucher } = await supabase
        .from("vouchers")
        .select("*")
        .ilike("code", code)
        .maybeSingle();

      if (voucher) {
        if (!voucher.is_active) {
          setDiscountError("This voucher has been deactivated.");
          return;
        }
        if (new Date(voucher.expires_at) < new Date()) {
          setDiscountError("This voucher has expired.");
          return;
        }
        if (Number(voucher.current_balance) <= 0) {
          setDiscountError("This voucher has a $0 balance.");
          return;
        }

        setAppliedCodeType("voucher");
        setVoucherData(voucher);
        setDiscountSuccess(
          `Store Credit Applied! Balance: $${Number(voucher.current_balance).toFixed(2)}`,
        );

        // If voucher includes free shipping, apply it
        if (voucher.includes_free_shipping) {
          setPromoFreeShipping(true);
        }
        return;
      }

      // 2. IF NOT A VOUCHER, CHECK IF IT'S A PROMO CODE
      const { data: discount, error } = await supabase
        .from("discounts")
        .select("*")
        .ilike("code", code)
        .maybeSingle();

      if (
        error ||
        !discount ||
        discount.active === false ||
        discount.active === "false"
      ) {
        setDiscountError("Invalid code.");
        setDiscountAmount(0);
        setPromoFreeShipping(false);
        return;
      }

      if (
        discount.max_uses !== null &&
        (discount.used_count || 0) >= parseInt(discount.max_uses)
      ) {
        setDiscountError("This code has reached its usage limit.");
        setDiscountAmount(0);
        setPromoFreeShipping(false);
        return;
      }

      let calculatedAmount = 0;
      let successMessages = [];

      if (discount.type === "percentage" && discount.value > 0) {
        calculatedAmount = cartTotal * (parseFloat(discount.value) / 100);
        successMessages.push(`${discount.value}% Off`);
      }

      if (
        discount.free_shipping === true ||
        discount.free_shipping === "true"
      ) {
        setPromoFreeShipping(true);
        successMessages.push("Free Shipping");
      }

      setAppliedCodeType("promo");
      setDiscountAmount(calculatedAmount);
      setDiscountSuccess(successMessages.join(" + ") + " Applied!");
    } catch (err) {
      console.error("Discount Verify Error:", err);
      setDiscountError("Could not verify code.");
    } finally {
      setIsVerifyingDiscount(false);
    }
  };

  const removeDiscount = () => {
    setDiscountCode("");
    setAppliedCodeType(null);
    setDiscountAmount(0);
    setPromoFreeShipping(false);
    setVoucherData(null);
    setDiscountSuccess("");
    setDiscountError("");
  };

  // --- 🚨 FIXED: CART MATH WITH SHIPPING COLORS 🚨 ---
  // 1. Calculate Base Shipping
  const isStandardFree = cartTotal >= 150 || promoFreeShipping;
  const isExpressFree = cartTotal >= 250 || promoFreeShipping;

  let shippingCost = 0;
  let shippingLabel = "Free";
  let shippingMessage = "";
  let shippingColor = "#d97706";

  if (shippingMethod === "express") {
    shippingCost = isExpressFree ? 0 : 14.99;
    shippingLabel = isExpressFree ? "Free" : "$14.99";
    shippingMessage = isExpressFree
      ? "Free Express Shipping!"
      : "Express Shipping Selected";
    shippingColor = isExpressFree ? "#16a34a" : "#475569";
  } else {
    shippingCost = isStandardFree ? 0 : 9.99;
    shippingLabel = isStandardFree ? "Free" : "$9.99";
    if (isStandardFree) {
      shippingMessage = "Free Standard Shipping!";
      shippingColor = "#16a34a";
    } else {
      shippingMessage = `Add $${(150 - cartTotal).toFixed(2)} more to unlock Free Shipping.`;
      shippingColor = "#d97706";
    }
  }

  // 2. Calculate Subtotal with Promo (if any)
  let finalPromoAmount = appliedCodeType === "promo" ? discountAmount : 0;
  let totalBeforeVoucher =
    Math.max(0, cartTotal - finalPromoAmount) + shippingCost;

  // 3. Calculate Voucher Deduction (if any)
  let voucherDeduction = 0;
  if (appliedCodeType === "voucher" && voucherData) {
    voucherDeduction = Math.min(
      totalBeforeVoucher,
      Number(voucherData.current_balance),
    );
  }

  // 4. Final amount customer actually owes
  const estimatedTotal = totalBeforeVoucher - voucherDeduction;

  const submitOrder = async (e) => {
    e.preventDefault();

    // Only require receipt if they actually owe money!
    if (estimatedTotal > 0 && !receiptFile) {
      setError(
        "Please upload a screenshot of your payment receipt to complete your order.",
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const variantIds = cart.map((item) => item.variantId || item.id);

      const { data: liveStock, error: stockError } = await supabase
        .from("variants")
        .select("id, in_stock, is_preorder")
        .in("id", variantIds);

      if (stockError)
        throw new Error("Could not verify live inventory. Please try again.");

      const outOfStockItems = [];
      for (const cartItem of cart) {
        const vId = cartItem.variantId || cartItem.id;
        const liveVariant = liveStock?.find(
          (v) => String(v.id) === String(vId),
        );

        const isStockFalse =
          liveVariant?.in_stock === false || liveVariant?.in_stock === "false";
        const isPreorderTrue =
          liveVariant?.is_preorder === true ||
          liveVariant?.is_preorder === "true";

        if (!liveVariant || (isStockFalse && !isPreorderTrue)) {
          const variantLabel = getVariantLabel(cartItem.variant);
          outOfStockItems.push(
            `${cartItem.name}${variantLabel ? ` (${variantLabel})` : ""}`,
          );
        }
      }

      if (outOfStockItems.length > 0) {
        throw new Error(
          `Checkout blocked! The following items just sold out: ${outOfStockItems.join(", ")}. Please return to the shop and remove them from your cart.`,
        );
      }

      const itemsToSave = cart.map((item) => ({
        ...item,
        is_preorder:
          item.is_preorder || liveVariants[item.variantId || item.id] || false,
      }));

      // Only upload if a receipt exists
      let receiptUrl = null;
      if (receiptFile) {
        const fileExt = receiptFile.name.split(".").pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("payment-proofs")
          .upload(fileName, receiptFile);

        if (uploadError)
          throw new Error("Failed to upload receipt. Please try again.");

        const { data: publicUrlData } = supabase.storage
          .from("payment-proofs")
          .getPublicUrl(fileName);

        receiptUrl = publicUrlData.publicUrl;
      }

      // --- CRITICAL: DEDUCT VOUCHER BALANCE ---
      if (appliedCodeType === "voucher" && voucherData) {
        const newBalance =
          Number(voucherData.current_balance) - voucherDeduction;
        const { error: vErr } = await supabase
          .from("vouchers")
          .update({ current_balance: newBalance })
          .eq("id", voucherData.id);

        if (vErr)
          throw new Error("Failed to secure voucher funds. Please try again.");
      }

      const orderPayload = {
        id: orderId,
        customer_name: formData.name,
        customer_email: formData.email,
        total_amount: estimatedTotal,
        shipping_cost: shippingCost,
        shipping_method: shippingMethod === "express" ? "Express" : "Standard",
        shipping_address: formData,
        items: itemsToSave,
        receipt_url: receiptUrl,
        // If order was $0, automatically push it straight to paid status!
        status: estimatedTotal === 0 ? "paid" : "pending",
        discount_code: appliedCodeType ? discountCode.toUpperCase() : null,
        // Save either the promo amount or the voucher amount so Admin panel math adds up
        discount_amount:
          appliedCodeType === "promo" ? finalPromoAmount : voucherDeduction,
      };

      const { error: orderError } = await supabase
        .from("orders")
        .insert(orderPayload);

      if (orderError) throw orderError;

      // Update Promo count
      if (appliedCodeType === "promo" && discountCode) {
        try {
          const { data: dData } = await supabase
            .from("discounts")
            .select("used_count")
            .ilike("code", discountCode)
            .single();
          if (dData) {
            await supabase
              .from("discounts")
              .update({ used_count: (dData.used_count || 0) + 1 })
              .ilike("code", discountCode);
          }
        } catch (dbErr) {
          console.error("Failed to increment discount count:", dbErr);
        }
      }

      try {
        const emailItems = itemsToSave.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          size: getVariantLabel(item.variant),
        }));

        await supabase.functions.invoke("send-email", {
          body: {
            email: formData.email,
            name: formData.name,
            orderId: orderId,
            status: "custom",
            message:
              estimatedTotal === 0
                ? "Thank you for your order! Your store credit covered the full balance. Your order is now processing and we will notify you when it ships."
                : "Thank you for your order! We have received your payment proof. Your order is currently under review and we will notify you as soon as your payment is confirmed and your package is ready to ship.",
            items: emailItems,
            address: formData,
          },
        });

        const adminItemsHtml = itemsToSave
          .map((item) => {
            const safeVariant = getVariantLabel(item.variant);
            const isPre = item.is_preorder;
            const variantText = safeVariant
              ? `(${safeVariant}${isPre ? " - Preorder" : ""})`
              : isPre
                ? "(Preorder)"
                : "";

            return `<li style="margin-bottom: 6px; font-size: 14px; color: #334155;">
            <strong>${item.quantity}x</strong> ${item.name} ${variantText ? `<span style="color: ${isPre ? "#ea580c" : "#64748b"}; font-weight: ${isPre ? "bold" : "normal"};">${variantText}</span>` : ""}
          </li>`;
          })
          .join("");

        const adminHtml = `
          <div style="text-align: left; font-family: sans-serif;">
            <h2 style="color: #0f172a; margin-top: 0;">🚨 New Order Received!</h2>
            <p style="margin-bottom: 5px;"><strong>Order ID:</strong> #${shortRef}</p>
            <p style="margin-bottom: 5px;"><strong>Customer:</strong> ${formData.name} (<a href="mailto:${formData.email}">${formData.email}</a>)</p>
            <p style="margin-bottom: 20px;"><strong>Shipping Speed:</strong> ${shippingMethod === "express" ? "⚡ Express" : "🚚 Standard"}</p>
            
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e2e8f0;">
              <h3 style="margin-top: 0; margin-bottom: 10px; color: #0f172a; font-size: 15px; text-transform: uppercase; letter-spacing: 0.5px;">Items Ordered:</h3>
              <ul style="list-style-type: none; padding: 0; margin: 0;">
                ${adminItemsHtml}
              </ul>
            </div>

            <p style="margin-bottom: 5px;"><strong>Subtotal:</strong> $${cartTotal.toFixed(2)}</p>
            ${appliedCodeType === "promo" ? `<p style="margin-bottom: 5px; color: #16a34a;"><strong>Promo (${discountCode.toUpperCase()}):</strong> -$${finalPromoAmount.toFixed(2)}</p>` : ""}
            ${appliedCodeType === "voucher" ? `<p style="margin-bottom: 5px; color: #16a34a;"><strong>Store Credit (${discountCode.toUpperCase()}):</strong> -$${voucherDeduction.toFixed(2)}</p>` : ""}
            
            <p style="margin-bottom: 20px; font-size: 18px;"><strong>Total Paid:</strong> $${estimatedTotal.toFixed(2)}</p>
            
            ${
              estimatedTotal > 0
                ? `
            <div style="margin-top: 20px;">
              <p><strong>Payment Screenshot:</strong></p>
              <a href="${receiptUrl}" target="_blank" style="display: inline-block; background: #16a34a; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Receipt</a>
            </div>
            `
                : `
            <div style="margin-top: 20px; padding: 15px; background: #dcfce7; border-radius: 8px; color: #166534; font-weight: bold;">
              ✅ Fully Paid via Store Credit
            </div>
            `
            }
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
            <p style="font-size: 12px; color: #64748b;">Log in to your admin panel to review and approve this order.</p>
          </div>
        `;

        await supabase.functions.invoke("send-email", {
          body: {
            to: "info@melbournepeptides.com.au",
            subject: `🚨 New Order #${shortRef} - $${estimatedTotal.toFixed(2)}`,
            html: adminHtml,
          },
        });
      } catch (emailErr) {
        console.error("Failed to send notification emails:", emailErr);
      }

      navigate(`/success?order_id=${orderId}`);
    } catch (err) {
      console.error("Checkout Error:", err);
      setError(err.message || "Failed to submit order. Please try again.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsLoading(false);
    }
  };

  if (!cart || cart.length === 0) return null;

  return (
    <>
      <style>{`
        .checkout-wrapper {
          max-width: 1000px;
          margin: 40px auto;
          padding: 0 20px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
        }
        @media (max-width: 768px) {
          .checkout-wrapper {
            grid-template-columns: 1fr;
            margin: 20px auto;
            gap: 24px;
          }
          .checkout-summary { order: -1; }
        }
      `}</style>

      <div className="checkout-wrapper">
        <div>
          <button onClick={() => navigate("/shop")} style={backBtnStyle}>
            <ArrowLeft size={16} /> Back to Shop
          </button>

          <h2 style={{ marginBottom: "15px", fontSize: "24px" }}>
            Secure Checkout
          </h2>
          <p
            style={{
              color: "#64748b",
              marginBottom: "24px",
              lineHeight: "1.5",
            }}
          >
            Please fill out your shipping details, complete the bank transfer,
            and upload your payment proof to submit your order.
          </p>

          {error && (
            <div
              style={{
                background: "#fee2e2",
                color: "#b91c1c",
                padding: "12px",
                borderRadius: "8px",
                marginBottom: "20px",
              }}
            >
              {error}
            </div>
          )}

          <form
            onSubmit={submitOrder}
            style={{ display: "flex", flexDirection: "column", gap: "24px" }}
          >
            <div>
              <h3
                style={{
                  fontSize: "18px",
                  marginBottom: "12px",
                  color: "#0f172a",
                }}
              >
                1. Shipping Details
              </h3>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px",
                  }}
                >
                  <input
                    required
                    type="text"
                    name="name"
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={handleChange}
                    style={inputStyle}
                  />
                  <input
                    required
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={handleChange}
                    style={inputStyle}
                  />
                </div>
                <input
                  required
                  type="tel"
                  name="phone"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={handleChange}
                  style={inputStyle}
                />

                {/* 📮 ADDRESSFINDER INPUT */}
                <input
                  required
                  type="text"
                  name="line1"
                  id="address"
                  ref={addressInputRef}
                  placeholder="Start typing your Street Address..."
                  value={formData.line1}
                  onChange={handleChange}
                  style={{
                    ...inputStyle,
                    borderColor: "#3b82f6",
                  }}
                />

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: "16px",
                  }}
                >
                  <input
                    required
                    type="text"
                    name="city"
                    placeholder="Suburb / City"
                    value={formData.city}
                    onChange={handleChange}
                    style={inputStyle}
                  />
                  <input
                    required
                    type="text"
                    name="state"
                    placeholder="State (e.g. VIC)"
                    value={formData.state}
                    onChange={handleChange}
                    style={inputStyle}
                  />
                  <input
                    required
                    type="text"
                    name="postcode"
                    placeholder="Postcode"
                    value={formData.postcode}
                    onChange={handleChange}
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: SHIPPING SPEED */}
            <div
              style={{
                padding: "20px",
                background: "#f8fafc",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
              }}
            >
              <h3
                style={{
                  fontSize: "16px",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  color: "#0f172a",
                }}
              >
                <Truck size={18} color="#0f172a" /> Select Shipping Speed
              </h3>
              <div style={{ display: "flex", gap: "10px" }}>
                <div
                  onClick={() => setShippingMethod("standard")}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    border:
                      shippingMethod === "standard"
                        ? "2px solid #3b82f6"
                        : "1px solid #cbd5e1",
                    background:
                      shippingMethod === "standard" ? "#eff6ff" : "white",
                  }}
                >
                  <span
                    style={{
                      display: "block",
                      fontWeight: "600",
                      color: "#0f172a",
                      marginBottom: "4px",
                    }}
                  >
                    Standard
                  </span>
                  <span
                    style={{
                      fontSize: "13px",
                      color: isStandardFree ? "#16a34a" : "#64748b",
                      fontWeight: isStandardFree ? "bold" : "normal",
                    }}
                  >
                    {isStandardFree ? "Free (Orders over $150)" : "$9.99"}
                  </span>
                </div>
                <div
                  onClick={() => setShippingMethod("express")}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    border:
                      shippingMethod === "express"
                        ? "2px solid #3b82f6"
                        : "1px solid #cbd5e1",
                    background:
                      shippingMethod === "express" ? "#eff6ff" : "white",
                  }}
                >
                  <span
                    style={{
                      display: "block",
                      fontWeight: "600",
                      color: "#0f172a",
                      marginBottom: "4px",
                    }}
                  >
                    Express
                  </span>
                  <span
                    style={{
                      fontSize: "13px",
                      color: isExpressFree ? "#16a34a" : "#64748b",
                      fontWeight: isExpressFree ? "bold" : "normal",
                    }}
                  >
                    {isExpressFree ? "Free (Orders over $250)" : "$14.99"}
                  </span>
                </div>
              </div>

              <div
                style={{
                  marginTop: "16px",
                  paddingTop: "16px",
                  borderTop: "1px solid #cbd5e1",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: shippingColor,
                  textAlign: "center",
                }}
              >
                {shippingMessage}
              </div>
            </div>

            <hr style={{ border: "none", borderTop: "1px solid #e2e8f0" }} />

            {/* --- 🚨 DYNAMIC PAYMENT SECTIONS 🚨 --- */}
            {estimatedTotal > 0 ? (
              <>
                {/* SECTION 3: BANK DETAILS */}
                <div>
                  <h3
                    style={{
                      fontSize: "18px",
                      marginBottom: "12px",
                      color: "#0f172a",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <Landmark size={20} /> 2. Complete Payment
                  </h3>
                  <p
                    style={{
                      color: "#475569",
                      marginBottom: "16px",
                      fontSize: "14px",
                    }}
                  >
                    Transfer exactly{" "}
                    <strong style={{ color: "#0f172a" }}>
                      ${estimatedTotal.toFixed(2)}
                    </strong>{" "}
                    to the account below.
                  </p>

                  <div
                    style={{
                      background: "white",
                      padding: "20px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        borderBottom: "1px solid #e2e8f0",
                        paddingBottom: "12px",
                        marginBottom: "12px",
                      }}
                    >
                      <span style={{ fontSize: "13px", color: "#64748b" }}>
                        Account Name
                      </span>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: "600",
                            color: "#0f172a",
                            fontSize: "15px",
                          }}
                        >
                          Melbourne Peptides
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy("Melbourne Peptides", "name")
                          }
                          style={copyBtnStyle}
                        >
                          {copied === "name" ? "Copied!" : <Copy size={14} />}
                        </button>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        borderBottom: "1px solid #e2e8f0",
                        paddingBottom: "12px",
                        marginBottom: "12px",
                      }}
                    >
                      <span style={{ fontSize: "13px", color: "#64748b" }}>
                        BSB
                      </span>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: "600",
                            color: "#0f172a",
                            fontSize: "16px",
                          }}
                        >
                          013 226
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy("013226", "bsb")}
                          style={copyBtnStyle}
                        >
                          {copied === "bsb" ? "Copied!" : <Copy size={14} />}
                        </button>
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        borderBottom: "1px solid #e2e8f0",
                        paddingBottom: "12px",
                        marginBottom: "12px",
                      }}
                    >
                      <span style={{ fontSize: "13px", color: "#64748b" }}>
                        Account Number
                      </span>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: "600",
                            color: "#0f172a",
                            fontSize: "16px",
                          }}
                        >
                          806 890 436
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy("806890436", "acc")}
                          style={copyBtnStyle}
                        >
                          {copied === "acc" ? "Copied!" : <Copy size={14} />}
                        </button>
                      </div>
                    </div>

                    <div
                      style={{
                        padding: "12px",
                        background: "#eff6ff",
                        borderRadius: "6px",
                        fontSize: "14px",
                        color: "#1e3a8a",
                        border: "1px solid #bfdbfe",
                        textAlign: "center",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <span>
                        <strong>Reference:</strong> Please use{" "}
                        <strong>#{shortRef}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(shortRef, "ref")}
                        style={{
                          ...copyBtnStyle,
                          background: "white",
                          padding: "4px 8px",
                        }}
                      >
                        {copied === "ref" ? "Copied!" : <Copy size={14} />}
                      </button>
                    </div>

                    <div
                      style={{
                        marginTop: "12px",
                        padding: "12px",
                        background: "#fef2f2",
                        border: "1px solid #fecaca",
                        borderRadius: "6px",
                        color: "#b91c1c",
                        fontSize: "13px",
                        lineHeight: "1.5",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "8px",
                      }}
                    >
                      <AlertTriangle
                        size={16}
                        style={{ flexShrink: 0, marginTop: "2px" }}
                      />
                      <div>
                        <strong>CRITICAL:</strong> Please{" "}
                        <strong>DO NOT</strong> put words like "peptide" or
                        product names in the bank transfer
                        description/reference. <strong>ONLY</strong> use the
                        exact Reference Number above.
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 4: FILE UPLOAD */}
                <div>
                  <h3
                    style={{
                      fontSize: "18px",
                      marginBottom: "12px",
                      color: "#0f172a",
                    }}
                  >
                    3. Upload Proof
                  </h3>
                  <div
                    style={{
                      border: previewUrl
                        ? "2px solid #16a34a"
                        : "2px dashed #cbd5e1",
                      borderRadius: "12px",
                      padding: "30px 20px",
                      textAlign: "center",
                      cursor: "pointer",
                      position: "relative",
                      backgroundColor: previewUrl ? "#f0fdf4" : "#f8fafc",
                      transition: "all 0.2s",
                    }}
                  >
                    <input
                      type="file"
                      required
                      accept="image/*"
                      onChange={handleFileChange}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        opacity: 0,
                        cursor: "pointer",
                        zIndex: 10,
                      }}
                    />
                    {previewUrl ? (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                        }}
                      >
                        <CheckCircle
                          size={32}
                          color="#16a34a"
                          style={{ marginBottom: "10px" }}
                        />
                        <p
                          style={{
                            margin: "0 0 10px 0",
                            fontWeight: "600",
                            color: "#16a34a",
                          }}
                        >
                          Receipt Attached!
                        </p>
                        <img
                          src={previewUrl}
                          alt="Preview"
                          style={{
                            maxHeight: "120px",
                            borderRadius: "8px",
                            border: "1px solid #bbf7d0",
                          }}
                        />
                        <p
                          style={{
                            margin: "10px 0 0 0",
                            fontSize: "12px",
                            color: "#64748b",
                          }}
                        >
                          Click or drag to replace
                        </p>
                      </div>
                    ) : (
                      <div>
                        <Upload
                          size={32}
                          color="#64748b"
                          style={{ margin: "0 auto 10px auto" }}
                        />
                        <p
                          style={{
                            margin: 0,
                            color: "#0f172a",
                            fontWeight: "600",
                            fontSize: "16px",
                          }}
                        >
                          Upload Payment Screenshot
                        </p>
                        <p
                          style={{
                            margin: "5px 0 0 0",
                            color: "#64748b",
                            fontSize: "13px",
                          }}
                        >
                          We need this to verify and ship your order
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              // VOUCHER $0 CHECKOUT STATE
              <div
                style={{
                  padding: "24px",
                  background: "#f0fdf4",
                  borderRadius: "12px",
                  border: "2px solid #bbf7d0",
                  color: "#166534",
                  textAlign: "center",
                }}
              >
                <CheckCircle
                  size={32}
                  color="#16a34a"
                  style={{ margin: "0 auto 12px auto" }}
                />
                <h3 style={{ margin: "0 0 8px 0", fontSize: "20px" }}>
                  Order Fully Covered!
                </h3>
                <p style={{ margin: 0, color: "#15803d" }}>
                  Your store credit covers the entire balance of this order. No
                  bank transfer or receipt required.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || (estimatedTotal > 0 && !receiptFile)}
              className="checkout-btn"
              style={{
                marginTop: "10px",
                padding: "18px",
                fontSize: "18px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "10px",
                opacity:
                  (estimatedTotal > 0 && !receiptFile) || isLoading ? 0.7 : 1,
              }}
            >
              {isLoading ? (
                <>
                  <Loader className="spin-anim" size={20} /> Processing...
                </>
              ) : (
                "Submit Order"
              )}
            </button>
          </form>
        </div>

        {/* RIGHT SIDE: ORDER SUMMARY */}
        <div className="checkout-summary">
          <div
            style={{
              background: "#f8fafc",
              padding: "30px",
              borderRadius: "12px",
              height: "fit-content",
              border: "1px solid #e2e8f0",
              position: "sticky",
              top: "20px",
            }}
          >
            <h3 style={{ marginBottom: "20px", fontSize: "18px" }}>
              Order Summary
            </h3>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                marginBottom: "20px",
              }}
            >
              {cart.map((item, i) => {
                const safeVariant = getVariantLabel(item.variant);
                const isItemPreorder =
                  item.is_preorder || liveVariants[item.variantId || item.id];

                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        style={{
                          width: "50px",
                          height: "50px",
                          objectFit: "cover",
                          borderRadius: "8px",
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ minWidth: 0 }}>
                        <p
                          style={{
                            fontWeight: "600",
                            fontSize: "14px",
                            margin: 0,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {item.name}
                          {safeVariant && (
                            <span
                              style={{
                                fontWeight: isItemPreorder ? "700" : "normal",
                                color: isItemPreorder ? "#ea580c" : "#64748b",
                              }}
                            >
                              ({safeVariant}
                              {isItemPreorder ? " - Preorder" : ""})
                            </span>
                          )}
                          {!safeVariant && isItemPreorder && (
                            <span
                              style={{ fontWeight: "700", color: "#ea580c" }}
                            >
                              (Preorder)
                            </span>
                          )}
                        </p>
                        <p
                          style={{
                            color: "#64748b",
                            fontSize: "12px",
                            margin: 0,
                          }}
                        >
                          Qty: {item.quantity}
                        </p>
                      </div>
                    </div>
                    <p style={{ fontWeight: "600", flexShrink: 0, margin: 0 }}>
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* --- LIVE SUPABASE DISCOUNT CODE SECTION --- */}
            <div style={{ marginBottom: "20px" }}>
              <div style={{ display: "flex", gap: "10px" }}>
                <div style={{ position: "relative", flex: 1 }}>
                  <Tag
                    size={16}
                    color="#94a3b8"
                    style={{
                      position: "absolute",
                      left: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Discount or Voucher code"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    disabled={appliedCodeType !== null}
                    style={{
                      ...inputStyle,
                      paddingLeft: "36px",
                      paddingTop: "10px",
                      paddingBottom: "10px",
                      background:
                        appliedCodeType !== null ? "#f1f5f9" : "white",
                    }}
                  />
                </div>
                {appliedCodeType !== null ? (
                  <button
                    type="button"
                    onClick={removeDiscount}
                    style={{
                      background: "#ef4444",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      padding: "0 16px",
                      fontWeight: "600",
                      cursor: "pointer",
                    }}
                  >
                    Remove
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleApplyDiscount}
                    disabled={isVerifyingDiscount}
                    style={{
                      background: "#0f172a",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      padding: "0 16px",
                      fontWeight: "600",
                      cursor: "pointer",
                    }}
                  >
                    {isVerifyingDiscount ? "..." : "Apply"}
                  </button>
                )}
              </div>
              {discountError && (
                <p
                  style={{
                    color: "#ef4444",
                    fontSize: "12px",
                    marginTop: "8px",
                    marginBottom: 0,
                  }}
                >
                  {discountError}
                </p>
              )}
              {discountSuccess && (
                <p
                  style={{
                    color: "#16a34a",
                    fontSize: "12px",
                    marginTop: "8px",
                    marginBottom: 0,
                  }}
                >
                  {discountSuccess}
                </p>
              )}
            </div>

            <hr
              style={{
                border: "none",
                borderTop: "1px solid #e2e8f0",
                margin: "20px 0",
              }}
            />

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "12px",
                color: "#64748b",
              }}
            >
              <span>Subtotal</span>
              <span>${cartTotal.toFixed(2)}</span>
            </div>

            {appliedCodeType === "promo" && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "12px",
                  color: "#16a34a",
                  fontWeight: "500",
                }}
              >
                <span>Promo ({discountCode.toUpperCase()})</span>
                <span>-${finalPromoAmount.toFixed(2)}</span>
              </div>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "20px",
                color: "#64748b",
              }}
            >
              <span>
                Shipping (
                {shippingMethod === "express" ? "Express" : "Standard"})
              </span>
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: shippingCost === 0 ? "600" : "500",
                  color: shippingCost === 0 ? "#16a34a" : "inherit",
                }}
              >
                {shippingLabel}
              </span>
            </div>

            {/* VOUCHER CREDIT LINE */}
            {appliedCodeType === "voucher" && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "16px",
                  color: "#16a34a",
                  fontWeight: "600",
                  paddingTop: "12px",
                  borderTop: "1px dashed #cbd5e1",
                }}
              >
                <span>Store Credit Used</span>
                <span>-${voucherDeduction.toFixed(2)}</span>
              </div>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "20px",
                fontWeight: "bold",
                color: "#0f172a",
                paddingTop: appliedCodeType === "voucher" ? "0" : "12px",
                borderTop:
                  appliedCodeType === "voucher" ? "none" : "1px solid #e2e8f0",
              }}
            >
              <span>Total to Pay</span>
              <span>${estimatedTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const inputStyle = {
  padding: "14px 16px",
  borderRadius: "8px",
  border: "1px solid #cbd5e1",
  fontSize: "15px",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

const backBtnStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  background: "none",
  border: "none",
  color: "#64748b",
  cursor: "pointer",
  marginBottom: "20px",
  padding: 0,
  fontWeight: "500",
};

const copyBtnStyle = {
  background: "#f1f5f9",
  border: "1px solid #cbd5e1",
  color: "#334155",
  fontSize: "12px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "4px",
  fontWeight: "600",
  padding: "6px 10px",
  borderRadius: "6px",
  transition: "all 0.2s",
};
