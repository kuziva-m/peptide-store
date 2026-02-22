import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useCart } from "../lib/CartContext";
import SEO from "../components/SEO";
import {
  ChevronLeft,
  ShieldCheck,
  Truck,
  AlertTriangle,
  ChevronDown,
  FileText,
  ExternalLink,
  Plus,
  Minus,
} from "lucide-react";
import "./Product.css";

export default function Product() {
  const { id } = useParams();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function fetchProduct() {
      if (!id || id === "undefined") {
        setErrorMsg("Invalid Product ID");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("products")
        .select(`*, variants (*)`)
        .eq("id", id)
        .single();

      if (error) {
        setErrorMsg(error.message);
      }

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

  const handleAddToCart = () => {
    if (!product || !selectedVariant) return;

    addToCart(
      {
        ...product,
        id: product.id,
        price: selectedVariant.price,
        image: selectedVariant.image_url || product.image_url,
        variantId: selectedVariant.id,
      },
      quantity,
      selectedVariant.size_label,
    );
  };

  const formatPrice = (amount) => {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
    }).format(amount);
  };

  if (loading)
    return (
      <div
        className="container"
        style={{ padding: "80px", textAlign: "center" }}
      >
        Loading Data...
      </div>
    );

  if (!product)
    return (
      <div
        className="container"
        style={{ padding: "80px", textAlign: "center" }}
      >
        <h2>Product Not Found</h2>
        <p style={{ color: "red" }}>Debug Error: {errorMsg}</p>
        <Link
          to="/shop"
          className="back-link"
          style={{ justifyContent: "center" }}
        >
          Return to Shop
        </Link>
      </div>
    );

  const displayImage =
    selectedVariant?.image_url ||
    product.image_url ||
    "https://via.placeholder.com/600";

  const isInStock = product.in_stock !== false;
  const activeLabUrl =
    selectedVariant?.lab_result_url || product.lab_result_url;

  const isAccessory =
    product.category === "Accessories" ||
    product.category === "Syringes" ||
    product.category === "Prep Pads";

  const metaDescription = product.description
    ? `${product.description.substring(0, 150)}... Buy ${product.name} online.`
    : `Buy ${product.name} research supplies in Australia.`;

  return (
    <div className="container product-page">
      <SEO
        title={`Buy ${product.name} Australia`}
        description={metaDescription}
        image={displayImage}
        type="product"
      />

      <Link to="/shop" className="back-link">
        <ChevronLeft size={16} /> Back to Catalog
      </Link>

      <div className="product-layout">
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
              {product.category || "Product"}
            </span>

            {/* HIDE CAS & PURITY IF ACCESSORY */}
            {!isAccessory && (
              <>
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
              </>
            )}
          </div>

          <div className="p-price-box" style={{ marginBottom: "25px" }}>
            <span
              style={{
                display: "block",
                fontSize: "0.9rem",
                color: "#64748b",
                marginBottom: "4px",
                fontWeight: "600",
              }}
            >
              Price
            </span>
            <span
              className="p-price"
              style={{ fontSize: "2rem", fontWeight: "bold", color: "#4635de" }}
            >
              {selectedVariant
                ? formatPrice(selectedVariant.price)
                : "Unavailable"}
            </span>
          </div>

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

          <div style={{ display: "flex", gap: "15px", marginBottom: "30px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: "#f1f5f9",
                borderRadius: "10px",
                padding: "0 10px",
              }}
            >
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "10px",
                }}
              >
                <Minus size={16} />
              </button>
              <span
                style={{
                  fontWeight: "700",
                  minWidth: "20px",
                  textAlign: "center",
                }}
              >
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "10px",
                }}
              >
                <Plus size={16} />
              </button>
            </div>

            <button
              className="p-add-btn"
              onClick={handleAddToCart}
              disabled={!selectedVariant || !isInStock}
              style={{
                flex: 1,
                padding: "18px",
                backgroundColor: isInStock ? "#4635de" : "#94a3b8",
                color: "white",
                border: "none",
                borderRadius: "10px",
                fontSize: "1.1rem",
                fontWeight: "bold",
                cursor: isInStock ? "pointer" : "not-allowed",
                boxShadow: isInStock
                  ? "0 4px 10px rgba(70, 53, 222, 0.2)"
                  : "none",
              }}
            >
              {isInStock
                ? selectedVariant
                  ? `Add to Cart - ${formatPrice(selectedVariant.price * quantity)}`
                  : "Select a Variant"
                : "Out of Stock"}
            </button>
          </div>

          {/* HIDE LAB RESULTS FOR ACCESSORIES */}
          {activeLabUrl && !isAccessory && (
            <details className="lab-accordion" open={false}>
              <summary className="lab-summary">
                Lab Results & COA{" "}
                {selectedVariant?.lab_result_url
                  ? `(${selectedVariant.size_label} Specific)`
                  : ""}
                <ChevronDown size={20} />
              </summary>
              <div className="lab-content">
                {activeLabUrl.toLowerCase().endsWith(".pdf") ? (
                  <a
                    href={activeLabUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="view-pdf-btn"
                  >
                    <FileText size={18} /> View PDF Report
                  </a>
                ) : (
                  <div
                    className="lab-preview-container"
                    onClick={() => window.open(activeLabUrl, "_blank")}
                  >
                    <img
                      src={activeLabUrl}
                      alt="Lab Result"
                      className="lab-preview-img"
                    />
                    <div
                      style={{
                        position: "absolute",
                        bottom: "10px",
                        right: "10px",
                        background: "rgba(0,0,0,0.6)",
                        padding: "6px",
                        borderRadius: "6px",
                        color: "white",
                        display: "flex",
                        gap: "6px",
                        alignItems: "center",
                        fontSize: "0.8rem",
                        pointerEvents: "none",
                      }}
                    >
                      <ExternalLink size={14} /> Tap to zoom
                    </div>
                  </div>
                )}
              </div>
            </details>
          )}

          <div
            className="p-description"
            style={{ lineHeight: "1.7", color: "#334155" }}
          >
            <h3 style={{ marginBottom: "10px", color: "#0f172a" }}>
              Product Description
            </h3>
            <p>{product.description}</p>
          </div>

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
              <span>Verified Quality</span>
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

            {/* HIDE PEPTIDE WARNING FOR ACCESSORIES */}
            {!isAccessory && (
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
                <span>Research Only</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
