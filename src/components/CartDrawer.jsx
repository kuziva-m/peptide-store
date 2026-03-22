import { useEffect, useMemo, useState } from "react";
import {
  X,
  Minus,
  Plus,
  ShoppingBag,
  ArrowRight,
  Trash2,
  Sparkles,
} from "lucide-react";
import { useCart } from "../lib/CartContext";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { getSuggestedProductSlugsForCart } from "../lib/productRelationships";
import "./CartDrawer.css";

export default function CartDrawer() {
  const {
    cart = [],
    isCartOpen,
    toggleCart,
    updateQuantity,
    removeFromCart,
    cartTotal = 0,
    addToCart,
  } = useCart();

  const navigate = useNavigate();
  const [suggestedProducts, setSuggestedProducts] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const suggestedSlugs = useMemo(
    () => getSuggestedProductSlugsForCart(cart),
    [cart],
  );

  const getVariantLabel = (v) => {
    if (!v) return "";
    if (typeof v === "string") return v;
    if (typeof v === "object") return v.size_label || "Option";
    return String(v);
  };

  const getDefaultVariant = (product) => {
    const visibleVariants = (product.variants || []).filter(
      (v) => v.is_hidden !== true && v.is_hidden !== "true",
    );

    if (!visibleVariants.length) return null;

    const sorted = [...visibleVariants].sort((a, b) => {
      if (a.is_default && !b.is_default) return -1;
      if (!a.is_default && b.is_default) return 1;
      return (a.price || 0) - (b.price || 0);
    });

    return sorted.find((v) => v.is_default === true) || sorted[0];
  };

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

  useEffect(() => {
    async function fetchSuggestedProducts() {
      if (!isCartOpen || suggestedSlugs.length === 0) {
        setSuggestedProducts([]);
        return;
      }

      setLoadingSuggestions(true);

      const { data, error } = await supabase
        .from("products")
        .select("*, variants (*)")
        .in("slug", suggestedSlugs);

      if (error || !data) {
        setSuggestedProducts([]);
        setLoadingSuggestions(false);
        return;
      }

      const hydrated = suggestedSlugs
        .map((slug) => data.find((item) => item.slug === slug))
        .filter(Boolean)
        .map((product) => {
          const defaultVariant = getDefaultVariant(product);
          return {
            ...product,
            defaultVariant,
          };
        })
        .filter((product) => product.defaultVariant);

      setSuggestedProducts(hydrated);
      setLoadingSuggestions(false);
    }

    fetchSuggestedProducts();
  }, [isCartOpen, suggestedSlugs]);

  const handleCheckoutClick = () => {
    toggleCart();
    navigate("/checkout");
  };

  const handleAddSuggested = (product) => {
    if (!product?.defaultVariant) return;

    addToCart(
      {
        ...product,
        id: product.id,
        price: product.defaultVariant.price,
        image: product.defaultVariant.image_url || product.image_url,
        variantId: product.defaultVariant.id,
      },
      1,
      product.defaultVariant.size_label,
    );
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
                                  item.variant,
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
                                  item.variant,
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

              {(loadingSuggestions || suggestedProducts.length > 0) && (
                <div
                  style={{
                    marginTop: "20px",
                    paddingTop: "20px",
                    borderTop: "1px solid #e2e8f0",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "14px",
                    }}
                  >
                    <Sparkles size={16} color="#4635de" />
                    <h4
                      style={{
                        margin: 0,
                        fontSize: "14px",
                        fontWeight: "800",
                        color: "#0f172a",
                        letterSpacing: "0.2px",
                      }}
                    >
                      Suggested for your order
                    </h4>
                  </div>

                  {loadingSuggestions ? (
                    <p
                      style={{
                        margin: 0,
                        color: "#64748b",
                        fontSize: "13px",
                      }}
                    >
                      Loading suggestions...
                    </p>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                      }}
                    >
                      {suggestedProducts.slice(0, 4).map((product) => (
                        <div
                          key={product.id}
                          style={{
                            display: "flex",
                            gap: "10px",
                            alignItems: "center",
                            border: "1px solid #e2e8f0",
                            borderRadius: "12px",
                            padding: "10px",
                            background: "#fff",
                          }}
                        >
                          <Link
                            to={`/product/${product.slug}`}
                            onClick={toggleCart}
                            style={{ flexShrink: 0 }}
                          >
                            <img
                              src={
                                product.defaultVariant?.image_url ||
                                product.image_url
                              }
                              alt={product.name}
                              style={{
                                width: "54px",
                                height: "54px",
                                objectFit: "cover",
                                borderRadius: "10px",
                              }}
                            />
                          </Link>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <Link
                              to={`/product/${product.slug}`}
                              onClick={toggleCart}
                              style={{
                                display: "block",
                                color: "#0f172a",
                                textDecoration: "none",
                                fontWeight: "700",
                                fontSize: "13px",
                                lineHeight: "1.35",
                                marginBottom: "4px",
                              }}
                            >
                              {product.name}
                            </Link>

                            <p
                              style={{
                                margin: 0,
                                color: "#64748b",
                                fontSize: "12px",
                              }}
                            >
                              {product.defaultVariant?.size_label} · $
                              {Number(
                                product.defaultVariant?.price || 0,
                              ).toFixed(2)}
                            </p>
                          </div>

                          <button
                            onClick={() => handleAddSuggested(product)}
                            style={{
                              border: "none",
                              background: "#4635de",
                              color: "white",
                              borderRadius: "8px",
                              padding: "8px 10px",
                              fontSize: "12px",
                              fontWeight: "700",
                              cursor: "pointer",
                              flexShrink: 0,
                            }}
                          >
                            Add
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="cart-sticky-footer">
              <div className="footer-total">
                <span>Subtotal</span>
                <span className="big-price">${cartTotal.toFixed(2)}</span>
              </div>
              <p className="shipping-note">Shipping calculated at checkout.</p>

              <button onClick={handleCheckoutClick} className="checkout-btn">
                Checkout <ArrowRight size={18} />
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
