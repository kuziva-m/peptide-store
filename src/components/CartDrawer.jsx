import { useState } from "react";
import { X, Minus, Plus, Trash2, ShoppingBag, Loader } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { useCart } from "../lib/CartContext";
import { supabase } from "../lib/supabase";
import "./CartDrawer.css";

// Initialize Stripe (Ensure you added VITE_STRIPE_PUBLISHABLE_KEY to .env)
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

  const handleCheckout = async () => {
    setIsLoading(true);
    try {
      // 1. Call your Supabase Edge Function
      const { data, error } = await supabase.functions.invoke("checkout", {
        body: { items: cartItems },
      });

      if (error) throw error;

      // 2. Redirect to the Stripe Checkout URL returned by the server
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
      {/* Backdrop overlay */}
      <div className="cart-backdrop" onClick={closeCart} />

      {/* Drawer Panel */}
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
                        ${(item.price * item.quantity).toFixed(2)}
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
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="cart-footer">
            <div className="total-row">
              <span>Subtotal</span>
              <span className="total-amount">${cartTotal.toFixed(2)}</span>
            </div>
            <p className="shipping-note">Shipping calculated at checkout.</p>
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
