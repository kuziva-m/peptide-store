import { useState } from "react";
import {
  X,
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  Loader,
  Truck,
} from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { useCart } from "../lib/CartContext";
import { supabase } from "../lib/supabase";
import "./CartDrawer.css";

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export default function CartDrawer() {
  const {
    isCartOpen,
    closeCart,
    cartItems,
    updateQuantity,
    removeFromCart,
    cartTotal,
  } = useCart();

  const [isLoading, setIsLoading] = useState(false);

  // --- CONFIG ---
  const FLAT_RATE_SHIPPING = 9.99;
  const FREE_SHIPPING_THRESHOLD = 129.0;

  // --- LOGIC ---
  const isFreeShipping = cartTotal >= FREE_SHIPPING_THRESHOLD;
  const shippingCost = isFreeShipping ? 0 : FLAT_RATE_SHIPPING;
  const finalTotal = cartTotal + shippingCost;

  // Progress Bar Logic
  const progressPercent = Math.min(
    (cartTotal / FREE_SHIPPING_THRESHOLD) * 100,
    100
  );
  const amountLeft = FREE_SHIPPING_THRESHOLD - cartTotal;

  const handleCheckout = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("checkout", {
        body: { items: cartItems },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        alert("Error: No checkout URL returned.");
      }
    } catch (error) {
      console.error("Checkout Error:", error);
      alert("Failed to initiate checkout. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isCartOpen) return null;

  return (
    <>
      <div className="cart-backdrop" onClick={closeCart} />

      <div className={`cart-drawer ${isCartOpen ? "open" : ""}`}>
        <div className="cart-header">
          <h2>Your Cart ({cartItems.length})</h2>
          <button onClick={closeCart} className="close-btn">
            <X size={24} />
          </button>
        </div>

        <div className="cart-body">
          {cartItems.length === 0 ? (
            <div className="empty-cart">
              <ShoppingBag size={48} opacity={0.2} />
              <p>Your cart is empty.</p>
              <button onClick={closeCart} className="continue-btn">
                Start Shopping
              </button>
            </div>
          ) : (
            <>
              {/* --- FREE SHIPPING PROGRESS BAR --- */}
              <div className="shipping-progress">
                <span className="shipping-msg">
                  {isFreeShipping ? (
                    <span
                      style={{
                        color: "#10b981",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <Truck size={16} /> You've unlocked{" "}
                      <strong>Free Shipping!</strong>
                    </span>
                  ) : (
                    <span>
                      Add <strong>${amountLeft.toFixed(2)}</strong> for Free
                      Shipping
                    </span>
                  )}
                </span>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
              </div>

              <div className="cart-items">
                {cartItems.map((item) => (
                  <div key={item.variantId} className="cart-item">
                    <div className="item-img">
                      {item.image ? (
                        <img src={item.image} alt={item.name} />
                      ) : (
                        <div className="img-placeholder"></div>
                      )}
                    </div>
                    <div className="item-details">
                      <h4>{item.name}</h4>
                      <span className="item-size">{item.size}</span>
                      <div className="item-controls">
                        <div className="qty-selector">
                          <button
                            onClick={() => updateQuantity(item.variantId, -1)}
                          >
                            <Minus size={14} />
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.variantId, 1)}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <span className="item-price">
                          ${(item.price * item.quantity).toFixed(2)} AUD
                        </span>
                      </div>
                    </div>
                    <button
                      className="remove-btn"
                      onClick={() => removeFromCart(item.variantId)}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="cart-footer">
            <div
              className="total-row"
              style={{
                fontSize: "1rem",
                fontWeight: "normal",
                color: "#64748b",
              }}
            >
              <span>Subtotal</span>
              <span>${cartTotal.toFixed(2)}</span>
            </div>

            <div
              className="total-row"
              style={{
                fontSize: "1rem",
                fontWeight: "normal",
                color: "#64748b",
                marginBottom: "16px",
              }}
            >
              <span>Shipping</span>
              {isFreeShipping ? (
                <span style={{ color: "#10b981", fontWeight: "600" }}>
                  FREE
                </span>
              ) : (
                <span>${FLAT_RATE_SHIPPING.toFixed(2)}</span>
              )}
            </div>

            <div
              className="total-row"
              style={{ borderTop: "1px solid #e2e8f0", paddingTop: "16px" }}
            >
              <span>Total (AUD)</span>
              <span className="total-amount">${finalTotal.toFixed(2)}</span>
            </div>

            <button
              className="checkout-btn"
              onClick={handleCheckout}
              disabled={isLoading}
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "10px",
                opacity: isLoading ? 0.7 : 1,
                cursor: isLoading ? "not-allowed" : "pointer",
                marginTop: "20px",
              }}
            >
              {isLoading && <Loader size={20} className="spin-anim" />}
              {isLoading ? "Processing..." : "Checkout Securely"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
