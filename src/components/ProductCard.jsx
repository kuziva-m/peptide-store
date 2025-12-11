import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../lib/CartContext";
import "./ProductCard.css";

export default function ProductCard({ product, loading }) {
  const { addToCart } = useCart();

  // Logic to handle variants
  const sortedVariants =
    product?.variants?.sort((a, b) => a.price - b.price) || [];
  const [selectedVariant, setSelectedVariant] = useState(null);

  // Initialize selected variant when product loads
  useEffect(() => {
    if (sortedVariants.length > 0) {
      setSelectedVariant(sortedVariants[0]);
    }
  }, [product]);

  // SKELETON STATE
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

  // Determine Image to Show: Variant Image > Product Default > Fallback
  const displayImage =
    selectedVariant?.image_url ||
    product.image_url ||
    "https://via.placeholder.com/400";

  // Find the formatPrice function and update:
  const formatPrice = (amount) => {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
    }).format(amount);
  };

  const isInStock = product.in_stock !== false; // Default to true if undefined

  return (
    <div className="product-card">
      {/* LINK WRAPPER */}
      <Link to={`/product/${product.id}`} className="card-image-wrapper">
        {isInStock ? (
          <div className="status-badge-subtle">
            <span className="status-dot"></span> In Stock
          </div>
        ) : (
          <div className="status-badge-subtle out-of-stock">
            <span className="status-dot"></span> Out of Stock
          </div>
        )}

        <img
          src={displayImage}
          alt={`${product.name} - ${selectedVariant?.size_label || ""}`}
          loading="lazy"
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

          <div className="science-meta">
            <span>PURITY: &gt;99%</span>
            <span>CAS: 123-45-X</span>
          </div>
        </div>

        {/* PRICE & SELECTOR ROW */}
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
                }`}
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
          disabled={!isInStock}
          onClick={(e) => {
            e.preventDefault();
            if (isInStock && selectedVariant)
              addToCart(product, selectedVariant);
          }}
        >
          {isInStock ? "Add to Cart" : "Out of Stock"}
        </button>
      </div>
    </div>
  );
}
