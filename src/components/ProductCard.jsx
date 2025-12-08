import { useState } from "react";
import "./ProductCard.css";

export default function ProductCard({ product }) {
  const sortedVariants =
    product.variants?.sort((a, b) => a.price - b.price) || [];
  const [selectedVariant, setSelectedVariant] = useState(sortedVariants[0]);

  const formatPrice = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  if (!selectedVariant) return null;

  return (
    <div className="product-card">
      <div className="card-image">
        <span className="status-badge">In Stock</span>
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} />
        ) : (
          <span style={{ color: "#cbd5e1", fontWeight: 800 }}>NO IMAGE</span>
        )}
      </div>

      <div className="card-content">
        <div className="card-header">
          <h3 className="product-name">{product.name}</h3>
          <span className="product-price">
            {formatPrice(selectedVariant.price)}
          </span>
        </div>

        <select
          className="variant-select"
          value={selectedVariant.id}
          onChange={(e) => {
            const v = sortedVariants.find((item) => item.id == e.target.value);
            setSelectedVariant(v);
          }}
        >
          {sortedVariants.map((v) => (
            <option key={v.id} value={v.id}>
              {v.size_label}
            </option>
          ))}
        </select>

        <button
          className="buy-btn"
          onClick={() => alert(`Added ${product.name} to cart!`)}
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}
