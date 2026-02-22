import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../lib/CartContext";
import "./ProductCard.css";

export default function ProductCard({ product, loading }) {
  const { addToCart } = useCart();

  // Sort variants by price low-to-high
  const sortedVariants =
    product?.variants?.sort((a, b) => a.price - b.price) || [];

  const [selectedVariant, setSelectedVariant] = useState(null);

  // Initialize selected variant
  useEffect(() => {
    if (sortedVariants.length > 0) {
      // Try to find the first IN STOCK variant to select by default
      const firstInStock = sortedVariants.find((v) => v.in_stock !== false);
      setSelectedVariant(firstInStock || sortedVariants[0]);
    }
  }, [product]);

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

  // --- STOCK LOGIC ---
  const isProductActive = product.in_stock !== false;
  const isVariantInStock = selectedVariant?.in_stock !== false;
  const canBuy = isProductActive && isVariantInStock;

  // Determine Badge State
  let badgeStatus = "in-stock";
  let badgeText = "In Stock";

  if (!isProductActive) {
    badgeStatus = "unavailable";
    badgeText = "Unavailable";
  } else if (!isVariantInStock) {
    badgeStatus = "out-of-stock";
    badgeText = "Sold Out";
  }

  // Determine Image
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

  const isAccessory = product.category === "Accessories";

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (canBuy && selectedVariant) {
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
    }
  };

  return (
    <div className="product-card">
      <Link to={`/product/${product.id}`} className="card-image-wrapper">
        {/* DYNAMIC BADGE */}
        <div className={`status-badge-subtle ${badgeStatus}`}>
          <span className="status-dot"></span> {badgeText}
        </div>

        <img
          src={displayImage}
          alt={`${product.name} - ${selectedVariant?.size_label || ""}`}
          loading="lazy"
          style={{ opacity: canBuy ? 1 : 0.6, transition: "opacity 0.3s" }}
        />
      </Link>

      <div className="card-content">
        <div className="card-header">
          <Link
            to={`/product/${product.id}`}
            style={{ textDecoration: "none" }}
          >
            <h3 className="product-name">{product.name}</h3>
          </Link>

          {!isAccessory && (
            <div className="science-meta">
              <span>PURITY: &gt;99%</span>
              <span>CAS: 123-45-X</span>
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
            {sortedVariants.map((v) => {
              const isVStock = v.in_stock !== false;
              return (
                <button
                  key={v.id}
                  className={`variant-pill ${
                    selectedVariant?.id === v.id ? "active" : ""
                  } ${!isVStock ? "pill-disabled" : ""}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedVariant(v);
                  }}
                  title={!isVStock ? "Out of Stock" : ""}
                >
                  {v.size_label}
                </button>
              );
            })}
          </div>
        </div>

        <button
          className="buy-btn"
          disabled={!canBuy}
          onClick={handleAddToCart}
          style={{
            backgroundColor: canBuy ? "var(--primary)" : "#94a3b8",
            cursor: canBuy ? "pointer" : "not-allowed",
            opacity: canBuy ? 1 : 0.7,
          }}
        >
          {canBuy ? "Add to Cart" : "Out of Stock"}
        </button>
      </div>
    </div>
  );
}
