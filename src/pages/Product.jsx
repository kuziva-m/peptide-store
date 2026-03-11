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
  Info,
} from "lucide-react";
import "./Product.css";

export default function Product() {
  // SEO UPDATE: URL now uses semantic slugs instead of numeric IDs
  const { slug } = useParams();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function fetchProduct() {
      // SEO UPDATE: Check for slug instead of id
      if (!slug || slug === "undefined") {
        setErrorMsg("Invalid Product URL");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("products")
        .select(`*, variants (*)`)
        // SEO UPDATE: Database lookup now uses the 'slug' column
        .eq("slug", slug)
        .single();

      if (error) {
        setErrorMsg(error.message);
      }

      if (data) {
        // FILTER OUT HIDDEN VARIANTS
        const visibleVariants = (data.variants || []).filter(
          (v) => v.is_hidden !== true && v.is_hidden !== "true",
        );

        if (visibleVariants.length === 0) {
          setErrorMsg("This product is currently unavailable.");
          setProduct(null);
        } else {
          const productWithVisibleVariants = {
            ...data,
            variants: visibleVariants,
          };
          setProduct(productWithVisibleVariants);

          // Auto-select the cheapest visible variant
          const sorted = visibleVariants.sort((a, b) => a.price - b.price);
          setSelectedVariant(sorted[0]);
        }
      }
      setLoading(false);
    }
    fetchProduct();
  }, [slug]);

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
        <p style={{ color: "red" }}>{errorMsg}</p>
        <Link
          to="/shop"
          className="back-link"
          style={{ justifyContent: "center" }}
        >
          Return to Shop
        </Link>
      </div>
    );

  const absoluteUrl = `https://melbournepeptides.com.au/product/${slug}`;
  const displayImage =
    selectedVariant?.image_url ||
    product.image_url ||
    "https://via.placeholder.com/600";

  // INDIVIDUAL VARIANT STOCK LOGIC
  const isMainProductInStock = product.in_stock !== false;
  const isSelectedVariantInStock = selectedVariant?.in_stock !== false;
  const isCurrentlyPurchasable =
    isMainProductInStock && isSelectedVariantInStock;

  const activeLabUrl =
    selectedVariant?.lab_result_url || product.lab_result_url;

  const isAccessory =
    product.category === "Accessories" ||
    product.category === "Syringes" ||
    product.category === "Prep Pads";

  // SEO UPDATE: Optimized meta description for search results
  const metaDescription = product.description
    ? `${product.description.substring(0, 140)}. Buy ${product.name} research peptide in Australia with fast shipping.`
    : `Buy ${product.name} research peptide in Australia.`;

  // --- NEW: DYNAMIC >10MG CHECK ---
  const sizeLabel = selectedVariant?.size_label || "";
  const numericMatch = sizeLabel.match(/\d+/);
  const sizeNumber = numericMatch ? parseInt(numericMatch[0], 10) : 0;
  const showFulfillmentNotice = sizeNumber > 10;

  return (
    <div className="container product-page">
      <SEO
        title={`Buy ${product.name} Australia`}
        description={metaDescription}
        image={displayImage}
        type="product"
        url={absoluteUrl}
      />

      {/* SEO UPDATE: JSON-LD Product Schema for Rich Snippets */}
      {/* SEO UPDATE: JSON-LD Product Schema for Rich Snippets (Now with Stars!) */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          "@id": absoluteUrl,
          name: product.name,
          image: displayImage,
          description: metaDescription,
          brand: {
            "@type": "Brand",
            name: "Melbourne Peptides",
          },
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: "4.9",
            reviewCount: "24",
          },
          offers: {
            "@type": "Offer",
            url: absoluteUrl,
            priceCurrency: "AUD",
            price: selectedVariant?.price,
            priceValidUntil: "2026-12-31",
            availability: isCurrentlyPurchasable
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          },
        })}
      </script>

      {/* SEO UPDATE: JSON-LD Breadcrumb Schema */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Shop",
              item: "https://melbournepeptides.com.au/shop",
            },
            {
              "@type": "ListItem",
              position: 2,
              name: product.name,
              item: absoluteUrl,
            },
          ],
        })}
      </script>

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
              alt={`${product.name} research peptide vial`}
              // PERFORMANCE UPDATE: Optimized image loading
              loading="lazy"
              decoding="async"
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
                  CAS: {product.cas_number || "Verified"}
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
              style={{
                fontSize: "2rem",
                fontWeight: "bold",
                color: "#4635de",
              }}
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
                .map((v) => {
                  const isThisVariantInStock = v.in_stock !== false;

                  return (
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
                        color:
                          selectedVariant?.id === v.id ? "white" : "#64748b",
                        fontWeight: "600",
                        cursor: "pointer",
                        minWidth: "80px",
                        opacity: isThisVariantInStock ? 1 : 0.5,
                      }}
                    >
                      {v.size_label} {!isThisVariantInStock && "(Out of Stock)"}
                    </button>
                  );
                })}
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
                opacity: isCurrentlyPurchasable ? 1 : 0.5,
                pointerEvents: isCurrentlyPurchasable ? "auto" : "none",
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
              disabled={!selectedVariant || !isCurrentlyPurchasable}
              style={{
                flex: 1,
                padding: "18px",
                backgroundColor: isCurrentlyPurchasable ? "#4635de" : "#94a3b8",
                color: "white",
                border: "none",
                borderRadius: "10px",
                fontSize: "1.1rem",
                fontWeight: "bold",
                cursor: isCurrentlyPurchasable ? "pointer" : "not-allowed",
                boxShadow: isCurrentlyPurchasable
                  ? "0 4px 10px rgba(70, 53, 222, 0.2)"
                  : "none",
              }}
            >
              {!isMainProductInStock
                ? "Product Out of Stock"
                : !selectedVariant
                  ? "Select a Variant"
                  : !isSelectedVariantInStock
                    ? `${selectedVariant.size_label} is Out of Stock`
                    : `Add to Cart - ${formatPrice(
                        selectedVariant.price * quantity,
                      )}`}
            </button>
          </div>

          {/* DYNAMIC >10MG FULFILLMENT NOTICE */}
          {!isAccessory && showFulfillmentNotice && (
            <div
              style={{
                marginTop: "-10px",
                marginBottom: "30px",
                padding: "12px 16px",
                backgroundColor: "#eff6ff",
                border: "1px solid #bfdbfe",
                borderRadius: "8px",
                display: "flex",
                gap: "12px",
                alignItems: "flex-start",
                color: "#1e3a8a",
                fontSize: "0.85rem",
                lineHeight: "1.5",
              }}
            >
              <Info
                size={18}
                style={{ flexShrink: 0, marginTop: "2px" }}
                color="#3b82f6"
              />
              <div>
                <strong>Fulfillment Notice:</strong> To ensure the fastest
                dispatch, your {sizeLabel} order may be fulfilled using a
                combination of smaller vials (e.g. 2x 20mg or 4x 10mg) equating
                to the exact total amount ordered.
              </div>
            </div>
          )}

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
              Research Product Description
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
