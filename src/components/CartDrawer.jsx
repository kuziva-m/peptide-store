import { X, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "../lib/CartContext";
import "./CartDrawer.css";

export default function CartDrawer() {
  const {
    isCartOpen,
    closeCart,
    cartItems,
    updateQuantity,
    removeFromCart,
    cartTotal,
  } = useCart();

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
              onClick={() => alert("Proceeding to checkout...")}
            >
              Checkout Securely
            </button>
          </div>
        )}
      </div>
    </>
  );
}
