import { useEffect, useMemo, useState } from "react";
import { X, Minus, Plus, ShoppingBag, ArrowRight, Trash2 } from "lucide-react";
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
  const [selectedSuggestedVariants, setSelectedSuggestedVariants] = useState(
    {},
  );

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

  const isVariantPurchasable = (variant) => {
    if (!variant) return false;
    const inStock = variant.in_stock !== false && variant.in_stock !== "false";
    const preorder =
      variant.is_preorder === true || variant.is_preorder === "true";
    return inStock || preorder;
  };

  const getPurchasableVariants = (product) => {
    const visibleVariants = (product.variants || []).filter(
      (v) => v.is_hidden !== true && v.is_hidden !== "true",
    );

    return visibleVariants.filter(isVariantPurchasable).sort((a, b) => {
      if (a.is_default && !b.is_default) return -1;
      if (!a.is_default && b.is_default) return 1;
      return (a.price || 0) - (b.price || 0);
    });
  };

  const getDefaultVariant = (product) => {
    const purchasableVariants = getPurchasableVariants(product);
    if (!purchasableVariants.length) return null;
    return (
      purchasableVariants.find((v) => v.is_default === true) ||
      purchasableVariants[0]
    );
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
        setSelectedSuggestedVariants({});
        return;
      }

      setLoadingSuggestions(true);

      const { data, error } = await supabase
        .from("products")
        .select("*, variants (*)")
        .in("slug", suggestedSlugs);

      if (error || !data) {
        setSuggestedProducts([]);
        setSelectedSuggestedVariants({});
        setLoadingSuggestions(false);
        return;
      }

      const hydrated = suggestedSlugs
        .map((slug) => data.find((item) => item.slug === slug))
        .filter(Boolean)
        .map((product) => {
          const purchasableVariants = getPurchasableVariants(product);
          const defaultVariant =
            purchasableVariants.find((v) => v.is_default === true) ||
            purchasableVariants[0] ||
            null;

          return {
            ...product,
            purchasableVariants,
            defaultVariant,
          };
        })
        .filter((product) => product.defaultVariant);

      const nextSelectedVariants = {};
      hydrated.forEach((product) => {
        nextSelectedVariants[product.id] = product.defaultVariant.id;
      });

      setSuggestedProducts(hydrated);
      setSelectedSuggestedVariants(nextSelectedVariants);
      setLoadingSuggestions(false);
    }

    fetchSuggestedProducts();
  }, [isCartOpen, suggestedSlugs]);

  const handleCheckoutClick = () => {
    toggleCart();
    navigate("/checkout");
  };

  const handleAddSuggested = (product) => {
    if (!product?.purchasableVariants?.length) return;

    const selectedVariantId = selectedSuggestedVariants[product.id];
    const selectedVariant =
      product.purchasableVariants.find((v) => v.id === selectedVariantId) ||
      product.defaultVariant;

    if (!selectedVariant) return;

    addToCart(
      {
        ...product,
        id: product.id,
        price: selectedVariant.price,
        image: selectedVariant.image_url || product.image_url,
        variantId: selectedVariant.id,
      },
      1,
      selectedVariant.size_label,
    );
  };

  const handleSuggestedVariantChange = (productId, variantId) => {
    setSelectedSuggestedVariants((prev) => ({
      ...prev,
      [productId]: variantId,
    }));
  };

  const getSelectedSuggestedVariant = (product) => {
    const selectedVariantId = selectedSuggestedVariants[product.id];
    return (
      product.purchasableVariants.find((v) => v.id === selectedVariantId) ||
      product.defaultVariant
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

                          <div className="cart-item-price-col">
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
                <section className="cart-suggestions-section">
                  <div className="cart-suggestions-header">
                    <ShoppingBag size={15} />
                    <h4>Suggested for your order</h4>
                  </div>

                  {loadingSuggestions ? (
                    <p className="cart-suggestions-loading">
                      Loading suggestions...
                    </p>
                  ) : (
                    <div className="cart-suggestions-list">
                      {suggestedProducts.slice(0, 4).map((product) => {
                        const selectedVariant =
                          getSelectedSuggestedVariant(product);

                        return (
                          <div
                            key={product.id}
                            className="cart-suggestion-card"
                          >
                            <Link
                              to={`/product/${product.slug}`}
                              onClick={toggleCart}
                              className="cart-suggestion-image-link"
                            >
                              <img
                                src={
                                  selectedVariant?.image_url ||
                                  product.image_url
                                }
                                alt={product.name}
                                className="cart-suggestion-image"
                              />
                            </Link>

                            <div className="cart-suggestion-content">
                              <Link
                                to={`/product/${product.slug}`}
                                onClick={toggleCart}
                                className="cart-suggestion-name"
                              >
                                {product.name}
                              </Link>

                              {product.purchasableVariants.length > 1 ? (
                                <select
                                  className="cart-suggestion-variant-select"
                                  value={selectedVariant?.id || ""}
                                  onChange={(e) =>
                                    handleSuggestedVariantChange(
                                      product.id,
                                      e.target.value,
                                    )
                                  }
                                >
                                  {product.purchasableVariants.map(
                                    (variant) => (
                                      <option
                                        key={variant.id}
                                        value={variant.id}
                                      >
                                        {variant.size_label} · $
                                        {Number(variant.price || 0).toFixed(2)}
                                      </option>
                                    ),
                                  )}
                                </select>
                              ) : (
                                <p className="cart-suggestion-meta">
                                  {selectedVariant?.size_label} · $
                                  {Number(selectedVariant?.price || 0).toFixed(
                                    2,
                                  )}
                                </p>
                              )}
                            </div>

                            <button
                              onClick={() => handleAddSuggested(product)}
                              className="cart-suggestion-add-btn"
                              disabled={!selectedVariant}
                            >
                              Add
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
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
