import { useState } from "react";
import {
  X,
  Minus,
  Plus,
  ShoppingBag,
  ArrowRight,
  Tag,
  Check,
  Loader,
} from "lucide-react";
import { useCart } from "../lib/CartContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "./CartDrawer.css";

export default function CartDrawer() {
  const {
    cart,
    isCartOpen,
    toggleCart,
    updateQuantity,
    removeFromCart,
    cartTotal,
  } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // --- NEW: DISCOUNT STATE ---
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(null); // 'WELCOME10' or null
  const [discountError, setDiscountError] = useState("");

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    setDiscountError("");

    // Check if code matches WELCOME10 (Case insensitive)
    if (discountCode.trim().toUpperCase() === "WELCOME10") {
      setAppliedDiscount("WELCOME10");
      setDiscountError("");
    } else {
      setDiscountError("Invalid coupon code");
      setAppliedDiscount(null);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedDiscount(null);
    setDiscountCode("");
    setDiscountError("");
  };

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("checkout", {
        body: {
          items: cart,
          discountCode: appliedDiscount, // <--- Sends code to backend
        },
      });

      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (error) {
      console.error(error);
      alert("Checkout error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isCartOpen) return null;

  return (
    <>
      <div className="cart-overlay" onClick={toggleCart}></div>
      <div className="cart-drawer">
        <div className="cart-header">
          <h3>Your Cart ({cart.length})</h3>
          <button onClick={toggleCart} className="close-cart-btn">
            <X size={24} />
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="empty-cart">
            <ShoppingBag size={48} color="#e2e8f0" />
            <p>Your cart is currently empty.</p>
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
            <div className="cart-items">
              {cart.map((item) => (
                <div key={item.id} className="cart-item">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="cart-item-img"
                  />
                  <div className="cart-item-details">
                    <h4>{item.name}</h4>
                    <p className="cart-item-variant">{item.variant}</p>
                    <div className="cart-item-controls">
                      <div className="qty-selector">
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                        >
                          <Minus size={14} />
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <p className="cart-item-price">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-footer">
              {/* --- DISCOUNT INPUT SECTION --- */}
              <div style={{ marginBottom: "20px" }}>
                {!appliedDiscount ? (
                  <form
                    onSubmit={handleApplyCoupon}
                    style={{ display: "flex", gap: "8px" }}
                  >
                    <div style={{ position: "relative", flex: 1 }}>
                      <Tag
                        size={16}
                        style={{
                          position: "absolute",
                          left: "12px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "#94a3b8",
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Discount code"
                        value={discountCode}
                        onChange={(e) => setDiscountCode(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px 10px 10px 36px",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                          fontSize: "0.9rem",
                          outline: "none",
                        }}
                      />
                    </div>
                    <button
                      type="submit"
                      style={{
                        background: "#f1f5f9",
                        border: "1px solid #e2e8f0",
                        padding: "0 16px",
                        borderRadius: "8px",
                        fontWeight: "600",
                        color: "#475569",
                        cursor: "pointer",
                      }}
                    >
                      Apply
                    </button>
                  </form>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: "#ecfdf5",
                      padding: "10px 16px",
                      borderRadius: "8px",
                      border: "1px solid #a7f3d0",
                    }}
                  >
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        color: "#059669",
                        fontWeight: "600",
                        fontSize: "0.9rem",
                      }}
                    >
                      <Check size={16} /> Code WELCOME10 applied!
                    </span>
                    <button
                      onClick={handleRemoveCoupon}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#059669",
                        cursor: "pointer",
                        padding: "4px",
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
                {discountError && (
                  <p
                    style={{
                      color: "#ef4444",
                      fontSize: "0.85rem",
                      marginTop: "6px",
                      marginLeft: "4px",
                    }}
                  >
                    {discountError}
                  </p>
                )}
              </div>

              {/* --- TOTALS --- */}
              <div className="cart-total-row">
                <span>Subtotal</span>
                <span>${cartTotal.toFixed(2)} AUD</span>
              </div>

              {appliedDiscount && (
                <div className="cart-total-row" style={{ color: "#059669" }}>
                  <span>Discount (10%)</span>
                  <span>-${(cartTotal * 0.1).toFixed(2)} AUD</span>
                </div>
              )}

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
              <p className="shipping-note">Shipping calculated at checkout</p>
            </div>
          </>
        )}
      </div>
    </>
  );
}
