import { useState } from "react";
import { useCart } from "../lib/CartContext";
import "./ProductCard.css";

export default function ProductCard({ product, loading }) {
  const { addToCart } = useCart();

  // SKELETON STATE
  if (loading) {
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

  // LOGIC
  const sortedVariants =
    product.variants?.sort((a, b) => a.price - b.price) || [];
  const [selectedVariant, setSelectedVariant] = useState(sortedVariants[0]);

  // Fallback if no variants exist
  if (!selectedVariant) return null;

  const formatPrice = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <div className="product-card">
      <div className="card-image-wrapper">
        <div className="status-badge-subtle">
          <span className="status-dot"></span> In Stock
        </div>

        {product.image_url ? (
          <img src={product.image_url} alt={product.name} loading="lazy" />
        ) : (
          <div className="no-image-placeholder">No Image</div>
        )}
      </div>

      <div className="card-content">
        <div className="card-header">
          <h3 className="product-name">{product.name}</h3>

          {/* Scientific Metadata - The "Trust" Factor */}
          <div className="science-meta">
            <span>PURITY: &gt;99%</span>
            <span>CAS: 123-45-X</span>
          </div>
        </div>

        {/* PRICE & SELECTOR ROW */}
        <div className="selector-row">
          <span className="product-price">
            {formatPrice(selectedVariant.price)}
          </span>

          <div className="variant-pills">
            {sortedVariants.map((v) => (
              <button
                key={v.id}
                className={`variant-pill ${
                  selectedVariant.id === v.id ? "active" : ""
                }`}
                onClick={() => setSelectedVariant(v)}
              >
                {v.size_label}
              </button>
            ))}
          </div>
        </div>

        <button
          className="buy-btn"
          onClick={() => addToCart(product, selectedVariant)}
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}
