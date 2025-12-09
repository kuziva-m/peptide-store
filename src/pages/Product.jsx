import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useCart } from "../lib/CartContext";
import { ChevronLeft, ShieldCheck, Truck, AlertTriangle } from "lucide-react";
import "./Product.css";

export default function Product() {
  const { id } = useParams(); // Get the ID from the URL
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProduct() {
      const { data, error } = await supabase
        .from("products")
        .select(`*, variants (*)`)
        .eq("id", id)
        .single();

      if (data) {
        setProduct(data);
        // Default to the first (usually cheapest/smallest) variant
        if (data.variants && data.variants.length > 0) {
          // Sort variants by price
          const sorted = data.variants.sort((a, b) => a.price - b.price);
          setSelectedVariant(sorted[0]);
        }
      }
      setLoading(false);
    }
    fetchProduct();
  }, [id]);

  if (loading)
    return (
      <div className="container" style={{ padding: "80px" }}>
        Loading Product Details...
      </div>
    );
  if (!product)
    return (
      <div className="container" style={{ padding: "80px" }}>
        Product not found.
      </div>
    );

  const formatPrice = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <div className="container product-page">
      <Link to="/" className="back-link">
        <ChevronLeft size={16} /> Back to Catalog
      </Link>

      <div className="product-layout">
        {/* LEFT: IMAGE */}
        <div className="product-gallery">
          <div className="main-image-frame">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} />
            ) : (
              <div className="no-image-box">No Image Available</div>
            )}
          </div>
        </div>

        {/* RIGHT: DETAILS */}
        <div className="product-info">
          <h1 className="p-title">{product.name}</h1>

          <div className="p-meta">
            <span className="p-badge">Research Grade</span>
            <span className="p-cas">CAS: 123-45-X</span>
            <span className="p-purity">Purity: &gt;99% (HPLC)</span>
          </div>

          <div className="p-price-box">
            <span className="p-price">
              {selectedVariant
                ? formatPrice(selectedVariant.price)
                : "Unavailable"}
            </span>
          </div>

          {/* VARIANT SELECTOR */}
          <div className="p-variants">
            <label>Select Size:</label>
            <div className="variant-grid">
              {product.variants
                ?.sort((a, b) => a.price - b.price)
                .map((v) => (
                  <button
                    key={v.id}
                    className={`p-variant-btn ${
                      selectedVariant?.id === v.id ? "active" : ""
                    }`}
                    onClick={() => setSelectedVariant(v)}
                  >
                    {v.size_label}
                  </button>
                ))}
            </div>
          </div>

          <button
            className="p-add-btn"
            onClick={() =>
              selectedVariant && addToCart(product, selectedVariant)
            }
            disabled={!selectedVariant}
          >
            {selectedVariant ? "Add to Cart" : "Out of Stock"}
          </button>

          {/* SCIENTIFIC DESCRIPTION */}
          <div className="p-description">
            <h3>Product Description</h3>
            <p>{product.description}</p>
          </div>

          {/* TRUST BADGES */}
          <div className="p-trust">
            <div className="trust-item">
              <ShieldCheck size={20} />
              <span>Third-party Tested</span>
            </div>
            <div className="trust-item">
              <Truck size={20} />
              <span>Same-day Shipping</span>
            </div>
            <div className="trust-item warning">
              <AlertTriangle size={20} />
              <span>Research Use Only</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
