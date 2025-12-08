import { useState } from "react";
import "./ProductCard.css";

export default function ProductCard({ product }) {
  // 1. Sort variants by price so they appear in order (Low to High)
  const sortedVariants =
    product.variants?.sort((a, b) => a.price - b.price) || [];

  // 2. Select the first variant by default
  const [selectedVariant, setSelectedVariant] = useState(sortedVariants[0]);

  // Helper to format money (e.g. $80.00)
  const formatPrice = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // If a product has no variants for some reason, don't crash
  if (!selectedVariant) return null;

  return (
    <div className="product-card">
      <div className="image-placeholder">
        {/* Placeholder image logic */}
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} />
        ) : (
          <span>{product.name}</span>
        )}
      </div>

      <div className="card-details">
        <h3 className="product-title">{product.name}</h3>
        <p className="price">{formatPrice(selectedVariant.price)}</p>

        {/* Dropdown for Size Selection */}
        <div className="variant-selector">
          <label>Size:</label>
          <select
            value={selectedVariant.id}
            onChange={(e) => {
              const v = sortedVariants.find(
                (item) => item.id == e.target.value
              );
              setSelectedVariant(v);
            }}
          >
            {sortedVariants.map((v) => (
              <option key={v.id} value={v.id}>
                {v.size_label}
              </option>
            ))}
          </select>
        </div>

        {/* The Buy Button */}
        <button
          className="add-btn"
          onClick={() =>
            alert(
              `Added ${product.name} (${selectedVariant.size_label}) to cart!`
            )
          }
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}
