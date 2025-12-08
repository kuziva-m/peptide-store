import { useState } from "react";
import { useCart } from "../lib/CartContext"; // Import cart hook
import "./ProductCard.css";

export default function ProductCard({ product }) {
  const { addToCart } = useCart(); // Get add function
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
        {/* Redesigned Subtle Badge */}
        <div className="status-badge-subtle">
          <span className="status-dot"></span> In Stock
        </div>

        {product.image_url ? (
          <img src={product.image_url} alt={product.name} />
        ) : (
          <span className="no-image">No Image</span>
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

        {/* Updated Button to use Context */}
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
