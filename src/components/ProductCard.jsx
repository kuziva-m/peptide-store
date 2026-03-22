import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../lib/CartContext";
import "./ProductCard.css";

export default function ProductCard({ product, loading }) {
  const { addToCart } = useCart();

  // FIXED: Safely copy and memoize the array to prevent React infinite loop crashes!
  // Sort variants: Default always first, then by price low-to-high
  const sortedVariants = useMemo(() => {
    return [...(product?.variants || [])].sort((a, b) => {
      if (a.is_default && !b.is_default) return -1;
      if (!a.is_default && b.is_default) return 1;
      return (a.price || 0) - (b.price || 0);
    });
  }, [product?.variants]);

  const [selectedVariant, setSelectedVariant] = useState(null);

  // Initialize selected variant
  useEffect(() => {
    if (sortedVariants.length > 0) {
      // Check if the admin manually starred a variant as the default
      const defaultVariant = sortedVariants.find((v) => v.is_default === true);

      // Default to the first IN STOCK variant if no default is set
      const firstInStock = sortedVariants.find((v) => v.in_stock !== false);

      // Prioritize: 1. Default Starred -> 2. Cheapest In Stock -> 3. Cheapest overall
      setSelectedVariant(defaultVariant || firstInStock || sortedVariants[0]);
    }
  }, [sortedVariants]);

  // SKELETON LOADING STATE
  if (loading || !product) {
    return (
      <div className="product-card skeleton-card">
        <div className="skeleton skeleton-img"></div>
        <div className="card-content">
          <div className="skeleton skeleton-text width-80"></div>
          <div className="skeleton skeleton-text width-40"></div>
          <div className="skeleton skeleton-btn"></div>
        </div>
      </div>
    );
  }

  // --- NEW: Stock, Preorder, and Availability Logic ---
  const isProductActive = product.in_stock !== false;
  const isVariantInStock = selectedVariant?.in_stock !== false;
  const isPreorder = selectedVariant?.is_preorder === true;

  // Allow buying if product is active AND (it's in stock OR it's a preorder)
  const canBuy = isProductActive && (isVariantInStock || isPreorder);

  let badgeStatus = "in-stock";
  let badgeText = "In Stock";
  let btnText = "Add to Cart";

  if (isPreorder) {
    badgeStatus = "preorder";
    badgeText = "Pre-Order";
    btnText = "Pre-Order";
  } else if (!isProductActive) {
    badgeStatus = "unavailable";
    badgeText = "Unavailable";
  } else if (!isVariantInStock) {
    badgeStatus = "out-of-stock";
    badgeText = "Sold Out";
  }

  const displayImage =
    selectedVariant?.image_url ||
    product.image_url ||
    "https://via.placeholder.com/400";

  const formatPrice = (amount) => {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
    }).format(amount);
  };

  const isAccessory =
    product.category === "Accessories" ||
    product.category === "Syringes" ||
    product.category === "Prep Pads";

  // FIXED ROUTING: All shop clicks now go directly to the Product storefront page!
  const detailHref = `/product/${product.slug}`;

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (canBuy && selectedVariant) {
      addToCart(
        {
          ...product,
          price: selectedVariant.price,
          image: selectedVariant.image_url || product.image_url,
          variantId: selectedVariant.id,
        },
        1,
        selectedVariant.size_label,
      );
    }
  };

  return (
    <>
      {/* Dynamic CSS injection for the Preorder badge style */}
      <style>{`
        .status-badge-subtle.preorder { background-color: #fff7ed; color: #ea580c; border-color: #ffedd5; }
        .status-badge-subtle.preorder .status-dot { background-color: #ea580c; }
      `}</style>

      <div className="product-card">
        {/* SEO FIX: Use product.slug for semantic URL discovery */}
        <Link to={detailHref} className="card-image-wrapper">
          <div className={`status-badge-subtle ${badgeStatus}`}>
            <span className="status-dot"></span> {badgeText}
          </div>

          <img
            src={displayImage}
            alt={`${product.name} research peptide vial`} // SEO FIX: Descriptive alt text
            loading="lazy"
            style={{ opacity: canBuy ? 1 : 0.6, transition: "opacity 0.3s" }}
          />
        </Link>

        <div className="card-content">
          <div className="card-header">
            <Link
              to={detailHref} // SEO FIX: Use product.slug
              style={{ textDecoration: "none" }}
            >
              <h3 className="product-name">{product.name}</h3>
            </Link>

            {!isAccessory && (
              <div className="science-meta">
                {/* SEO FIX: Use dynamic purity and CAS numbers from DB */}
                <span>PURITY: {product.purity || ">99%"}</span>
                <span>CAS: {product.cas_number || "Verified"}</span>
              </div>
            )}
          </div>

          <div className="selector-row">
            <div className="price-container">
              <span className="product-price">
                {selectedVariant
                  ? formatPrice(selectedVariant.price)
                  : "Unavailable"}
              </span>
            </div>

            <div className="variant-pills">
              {sortedVariants.map((v) => (
                <button
                  key={v.id}
                  className={`variant-pill ${
                    selectedVariant?.id === v.id ? "active" : ""
                  } ${v.in_stock === false && !v.is_preorder ? "pill-disabled" : ""}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedVariant(v);
                  }}
                >
                  {v.size_label}
                </button>
              ))}
            </div>
          </div>

          <button
            className="buy-btn"
            disabled={!canBuy}
            onClick={handleAddToCart}
            style={{
              backgroundColor: canBuy ? "var(--primary)" : "#94a3b8",
              cursor: canBuy ? "pointer" : "not-allowed",
            }}
          >
            {canBuy ? btnText : "Out of Stock"}
          </button>
        </div>
      </div>
    </>
  );
}
