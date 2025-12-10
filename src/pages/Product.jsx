import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useCart } from "../lib/CartContext";
import { ChevronLeft, ShieldCheck, Truck, AlertTriangle } from "lucide-react";
import "./Product.css"; // Ensure you have this file created

export default function Product() {
  const { id } = useParams();
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
        if (data.variants && data.variants.length > 0) {
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
        Loading Product...
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

  // IMAGE LOGIC: Variant > Product > Placeholder
  const displayImage =
    selectedVariant?.image_url ||
    product.image_url ||
    "https://via.placeholder.com/600";

  const isInStock = product.in_stock !== false; // Default to true if undefined

  return (
    <div className="container product-page">
      <Link to="/" className="back-link">
        <ChevronLeft size={16} /> Back to Catalog
      </Link>

      <div className="product-layout">
        {/* LEFT: IMAGE */}
        <div className="product-gallery">
          <div
            className="main-image-frame"
            style={{
              background:
                "radial-gradient(circle at center, #ffffff 50%, #f1f5f9 100%)",
              borderRadius: "16px",
              padding: "40px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <img
              src={displayImage}
              alt={product.name}
              style={{
                maxWidth: "100%",
                maxHeight: "400px",
                objectFit: "contain",
                filter: "drop-shadow(0 15px 25px rgba(0,0,0,0.15))",
              }}
            />
          </div>
        </div>

        {/* RIGHT: DETAILS */}
        <div className="product-info">
          <h1
            className="p-title"
            style={{
              fontSize: "2.5rem",
              color: "#0f172a",
              marginBottom: "10px",
            }}
          >
            {product.name}
          </h1>

          <div
            className="p-meta"
            style={{ display: "flex", gap: "15px", marginBottom: "20px" }}
          >
            <span
              className="p-badge"
              style={{
                background: "#0d9488",
                color: "white",
                padding: "4px 10px",
                borderRadius: "4px",
                fontSize: "0.8rem",
                fontWeight: "bold",
              }}
            >
              Research Grade
            </span>
            <span
              className="p-cas"
              style={{
                background: "#f1f5f9",
                padding: "4px 10px",
                borderRadius: "4px",
                fontSize: "0.8rem",
                color: "#64748b",
              }}
            >
              CAS: 123-45-X
            </span>
            <span
              className="p-purity"
              style={{
                background: "#f1f5f9",
                padding: "4px 10px",
                borderRadius: "4px",
                fontSize: "0.8rem",
                color: "#64748b",
              }}
            >
              Purity: &gt;99% (HPLC)
            </span>
          </div>

          <div className="p-price-box" style={{ marginBottom: "25px" }}>
            <span
              className="p-price"
              style={{ fontSize: "2rem", fontWeight: "bold", color: "#4635de" }}
            >
              {selectedVariant
                ? formatPrice(selectedVariant.price)
                : "Unavailable"}
            </span>
          </div>

          {/* VARIANT SELECTOR */}
          <div className="p-variants" style={{ marginBottom: "25px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "10px",
                fontWeight: "600",
                color: "#334155",
              }}
            >
              Select Size:
            </label>
            <div
              className="variant-grid"
              style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}
            >
              {product.variants
                ?.sort((a, b) => a.price - b.price)
                .map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    style={{
                      padding: "12px 20px",
                      borderRadius: "8px",
                      border:
                        selectedVariant?.id === v.id
                          ? "2px solid #0f172a"
                          : "1px solid #cbd5e1",
                      background:
                        selectedVariant?.id === v.id ? "#0f172a" : "white",
                      color: selectedVariant?.id === v.id ? "white" : "#64748b",
                      fontWeight: "600",
                      cursor: "pointer",
                      minWidth: "80px",
                    }}
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
            disabled={!selectedVariant || !isInStock}
            style={{
              width: "100%",
              padding: "18px",
              backgroundColor: isInStock ? "#4635de" : "#94a3b8",
              color: "white",
              border: "none",
              borderRadius: "10px",
              fontSize: "1.1rem",
              fontWeight: "bold",
              cursor: isInStock ? "pointer" : "not-allowed",
              marginBottom: "30px",
              boxShadow: isInStock
                ? "0 4px 10px rgba(70, 53, 222, 0.2)"
                : "none",
            }}
          >
            {isInStock
              ? selectedVariant
                ? "Add to Cart"
                : "Select a Variant"
              : "Out of Stock"}
          </button>

          {/* SCIENTIFIC DESCRIPTION */}
          <div
            className="p-description"
            style={{ lineHeight: "1.7", color: "#334155" }}
          >
            <h3 style={{ marginBottom: "10px", color: "#0f172a" }}>
              Product Description
            </h3>
            <p>{product.description}</p>
          </div>

          {/* TRUST BADGES */}
          <div
            className="p-trust"
            style={{
              marginTop: "30px",
              display: "flex",
              gap: "20px",
              padding: "20px",
              background: "#f8fafc",
              borderRadius: "12px",
            }}
          >
            <div
              className="trust-item"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                fontSize: "0.9rem",
                color: "#475569",
              }}
            >
              <ShieldCheck size={20} color="#0d9488" />
              <span>Third-party Tested</span>
            </div>
            <div
              className="trust-item"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                fontSize: "0.9rem",
                color: "#475569",
              }}
            >
              <Truck size={20} color="#0d9488" />
              <span>Same-day Shipping</span>
            </div>
            <div
              className="trust-item warning"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                fontSize: "0.9rem",
                color: "#b91c1c",
              }}
            >
              <AlertTriangle size={20} color="#b91c1c" />
              <span>Research Use Only</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
