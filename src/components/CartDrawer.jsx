import { useState, useEffect } from "react";
import {
  X,
  Minus,
  Plus,
  ShoppingBag,
  ArrowRight,
  Check,
  Loader,
  Trash2,
  Truck,
  Zap,
  AlertCircle,
} from "lucide-react";
import { useCart } from "../lib/CartContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "./CartDrawer.css";

export default function CartDrawer() {
  const {
    cart = [],
    isCartOpen,
    toggleCart,
    updateQuantity,
    removeFromCart,
    cartTotal = 0,
  } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Shipping State
  const [shippingMethod, setShippingMethod] = useState(null);
  const [shippingError, setShippingError] = useState(false);

  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [discountError, setDiscountError] = useState("");

  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isCartOpen]);

  // --- 1. Calculate Discount ---
  let discountAmount = 0;
  if (appliedDiscount) {
    if (appliedDiscount.type === "percentage") {
      discountAmount = cartTotal * (appliedDiscount.value / 100);
    } else if (appliedDiscount.type === "fixed") {
      discountAmount = appliedDiscount.value;
    }
  }

  const subtotalAfterDiscount = Math.max(0, cartTotal - discountAmount);

  // --- 2. Shipping Threshold Logic ---
  // Rules:
  // > $250: BOTH Free (User chooses)
  // > $150: Standard Free, Express Paid
  // < $150: Both Paid

  const codeGrantsFreeShip = appliedDiscount?.free_shipping === true;

  const isStandardFree = subtotalAfterDiscount >= 150 || codeGrantsFreeShip;
  const isExpressFree = subtotalAfterDiscount >= 250 || codeGrantsFreeShip;

  const shippingCost = (() => {
    if (!shippingMethod) return 0; // No cost displayed if nothing selected yet

    if (shippingMethod === "express") {
      return isExpressFree ? 0 : 14.99;
    }
    // Standard
    return isStandardFree ? 0 : 9.99;
  })();

  const grandTotal = subtotalAfterDiscount + shippingCost;

  // --- Helpers ---
  const getVariantLabel = (v) => {
    if (!v) return "";
    if (typeof v === "string") return v;
    if (typeof v === "object") return v.size_label || "Option";
    return String(v);
  };

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    setDiscountError("");

    if (!discountCode.trim()) return;

    try {
      // UPDATED: Use .ilike() for case-insensitive matching
      const { data, error } = await supabase
        .from("discounts")
        .select("*")
        .ilike("code", discountCode.trim())
        .eq("active", true)
        .maybeSingle(); // Use maybeSingle to avoid 406 error if multiple matches (though code should be unique)

      if (error || !data) {
        setDiscountError("Invalid or expired coupon code");
        setAppliedDiscount(null);
      } else {
        setAppliedDiscount(data);
        setDiscountError("");
      }
    } catch (err) {
      console.error(err);
      setDiscountError("Error verifying code");
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedDiscount(null);
    setDiscountCode("");
    setDiscountError("");
  };

  const handleCheckout = async () => {
    // Validation
    if (!shippingMethod) {
      setShippingError(true);
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("checkout", {
        body: {
          items: cart,
          discountCode: appliedDiscount?.code,
          shippingMethod: shippingMethod,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.url) window.location.href = data.url;
    } catch (error) {
      console.error(error);
      alert(error.message || "Checkout error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const selectShipping = (method) => {
    setShippingMethod(method);
    setShippingError(false);
  };

  if (!isCartOpen) return null;
  const itemCount = cart ? cart.length : 0;

  return (
    <>
      <div className="cart-overlay" onClick={toggleCart}></div>
      <div className="cart-drawer">
        <div className="cart-header">
          <h3>Your Cart ({itemCount})</h3>
          <button onClick={toggleCart} className="close-cart-btn">
            <X size={24} />
          </button>
        </div>

        {itemCount === 0 ? (
          <div className="empty-cart">
            <ShoppingBag size={48} color="#e2e8f0" />
            <p>Your cart is empty.</p>
            <button
              onClick={() => {
                toggleCart();
                navigate("/shop");
              }}
              className="continue-shopping-btn"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <>
            <div className="cart-scroll-area">
              <div className="cart-items-list">
                {cart.map((item, index) => {
                  const safeVariant = getVariantLabel(item.variant);
                  const itemKey = `${item.id}-${safeVariant}-${index}`;
                  return (
                    <div key={itemKey} className="cart-item">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="cart-item-img"
                      />
                      <div className="cart-item-details">
                        <div>
                          <h4>{item.name}</h4>
                          <p className="cart-item-variant">{safeVariant}</p>
                        </div>
                        <div className="cart-item-controls">
                          <div className="qty-selector">
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.id,
                                  item.quantity - 1,
                                  item.variant
                                )
                              }
                            >
                              <Minus size={14} />
                            </button>
                            <span>{item.quantity}</span>
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.id,
                                  item.quantity + 1,
                                  item.variant
                                )
                              }
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <p className="cart-item-price">
                              ${(item.price * item.quantity).toFixed(2)}
                            </p>
                            <button
                              onClick={() =>
                                removeFromCart(item.id, item.variant)
                              }
                              className="remove-btn"
                            >
                              <Trash2 size={12} /> Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="cart-options-section">
                {/* Discount Code */}
                <div className="discount-block">
                  {!appliedDiscount ? (
                    <form
                      onSubmit={handleApplyCoupon}
                      className="discount-form"
                    >
                      <div className="input-wrapper">
                        <input
                          type="text"
                          placeholder="Promo Code"
                          value={discountCode}
                          onChange={(e) => setDiscountCode(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "12px",
                            border: "1px solid #e2e8f0",
                            borderRadius: "8px",
                            fontSize: "0.95rem",
                            outline: "none",
                          }}
                        />
                      </div>
                      <button type="submit">Apply</button>
                    </form>
                  ) : (
                    <div className="discount-applied">
                      <span>
                        <Check size={16} /> Code {appliedDiscount.code} applied!
                      </span>
                      <button onClick={handleRemoveCoupon}>
                        <X size={16} />
                      </button>
                    </div>
                  )}
                  {discountError && (
                    <p className="discount-error">{discountError}</p>
                  )}
                </div>

                {/* Shipping Selection */}
                <div
                  className={`shipping-block ${
                    shippingError ? "shake-error" : ""
                  }`}
                >
                  <h4 className="section-label">
                    Shipping Method <span style={{ color: "red" }}>*</span>
                  </h4>

                  {/* Standard Option */}
                  <div
                    className={`shipping-option ${
                      shippingMethod === "standard" ? "active" : ""
                    }`}
                    onClick={() => selectShipping("standard")}
                  >
                    <div className="option-left">
                      <Truck size={20} />
                      <div>
                        <span className="opt-name">Standard</span>
                        <span className="opt-time">2-6 Days</span>
                      </div>
                    </div>
                    <span className="opt-price">
                      {isStandardFree ? (
                        <span className="text-green">FREE</span>
                      ) : (
                        "$9.99"
                      )}
                    </span>
                  </div>

                  {/* Express Option */}
                  <div
                    className={`shipping-option ${
                      shippingMethod === "express" ? "active" : ""
                    }`}
                    onClick={() => selectShipping("express")}
                  >
                    <div className="option-left">
                      <Zap
                        size={20}
                        className={
                          shippingMethod === "express" ? "text-dark" : ""
                        }
                      />
                      <div>
                        <span className="opt-name">Express</span>
                        <span className="opt-time">1-3 Days</span>
                      </div>
                    </div>
                    <span className="opt-price">
                      {isExpressFree ? (
                        <span className="text-green">FREE</span>
                      ) : (
                        "$14.99"
                      )}
                    </span>
                  </div>

                  {/* Warning Message */}
                  {shippingError && (
                    <div className="shipping-warning">
                      <AlertCircle size={14} /> Please select a shipping method
                    </div>
                  )}
                </div>

                {/* Cost Breakdown */}
                <div className="cost-breakdown">
                  <div className="row">
                    <span>Subtotal</span>
                    <span>${cartTotal.toFixed(2)}</span>
                  </div>
                  {appliedDiscount && (
                    <div className="row text-green">
                      <span>Discount ({appliedDiscount.code})</span>
                      <span>-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="row">
                    <span>Shipping</span>
                    <span>
                      {shippingMethod
                        ? shippingCost === 0
                          ? "Free"
                          : `$${shippingCost.toFixed(2)}`
                        : "--"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="cart-sticky-footer">
              <div className="footer-total">
                <span>Total</span>
                <span className="big-price">${grandTotal.toFixed(2)}</span>
              </div>
              <button
                onClick={handleCheckout}
                disabled={loading}
                className="checkout-btn"
              >
                {loading ? (
                  <Loader className="spin-anim" />
                ) : (
                  <>
                    Checkout <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
