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
  CheckCircle2,
  Beaker,
  Calculator,
  ArrowRight,
} from "lucide-react";
import { getRelatedProductSlugsForProduct } from "../lib/productRelationships";
import "./Product.css";

// --- PRE-DEFINED PEPTIDE RESEARCH PROFILES ---
const PEPTIDE_PROFILES = {
  retatrutide: {
    overview:
      "Retatrutide is a triple-agonist peptide commonly researched for its role in profound weight loss and metabolic regulation. It targets GLP-1, GIP, and Glucagon receptors, making it one of the most advanced compounds for studying appetite control, fat reduction, and energy balance.",
    dosage: {
      phases: [
        {
          phase: "Week 1–4",
          dose: "0.5mg once per week (or 0.25mg twice per week)",
        },
        {
          phase: "Week 5–8",
          dose: "1.0mg once per week (or 0.5mg twice per week)",
        },
        {
          phase: "Week 9–12",
          dose: "2.0mg once per week (or 1.0mg twice per week)",
        },
      ],
      rules: [
        "Inject once per week only",
        "Increase dose every 4 weeks",
        "Stay at the lowest effective dose",
        "If side effects occur → stay at current dose longer",
      ],
    },
    combos: ["Cagrilintide", "MOTS-c", "AOD-9604"],
  },
  tirzepatide: {
    overview:
      "Tirzepatide is a dual-agonist (GIP and GLP-1) commonly researched for significant weight loss and glycemic control. It is highly studied for its ability to delay gastric emptying, reduce appetite, and improve metabolic markers.",
    dosage: {
      phases: [
        { phase: "Week 1–4", dose: "2.5mg once per week" },
        { phase: "Week 5–8", dose: "5.0mg once per week" },
        { phase: "Week 9–12", dose: "7.5mg once per week" },
      ],
      rules: [
        "Administer once every 7 days",
        "Wait at least 4 weeks before titrating up",
        "Do not skip steps in the titration schedule",
        "Maintain current dose if gastrointestinal distress occurs",
      ],
    },
    combos: ["Cagrilintide", "Tesofensine", "MOTS-c"],
  },
  semaglutide: {
    overview:
      "Semaglutide is a potent GLP-1 receptor agonist primarily researched for appetite suppression, delayed gastric emptying, and steady weight loss. It is a foundational compound in modern metabolic and obesity studies.",
    dosage: {
      phases: [
        { phase: "Week 1–4", dose: "0.25mg once per week" },
        { phase: "Week 5–8", dose: "0.50mg once per week" },
        { phase: "Week 9–12", dose: "1.00mg once per week" },
      ],
      rules: [
        "Administer strictly once per week",
        "Must complete full 4 weeks before increasing",
        "Maximum recommended research dose is 2.4mg",
        "Monitor hydration levels closely",
      ],
    },
    combos: ["BPC-157", "AOD-9604", "MOTS-c"],
  },
  "bpc-157": {
    overview:
      "BPC-157 (Body Protection Compound) is renowned for its rapid regenerative properties. Research focuses heavily on its ability to accelerate the healing of tendons, ligaments, and muscle tissue, while also offering significant gastroprotective and anti-inflammatory benefits.",
    dosage: {
      phases: [
        { phase: "Standard Protocol", dose: "250mcg once or twice daily" },
        {
          phase: "Acute Protocol",
          dose: "500mcg twice daily (morning & night)",
        },
      ],
      rules: [
        "Administer daily for optimal systemic effects",
        "Standard cycle length is 4 to 6 weeks",
        "Allow 2 to 4 weeks off between cycles",
        "Local administration near study site is common but not required",
      ],
    },
    combos: ["TB-500", "GHK-Cu", "CJC-1295"],
  },
  "tb-500": {
    overview:
      "TB-500 is a synthetic version of Thymosin Beta-4. It is widely researched for its role in upregulating actin, promoting cell migration, and accelerating muscle recovery, wound healing, and reducing systemic inflammation.",
    dosage: {
      phases: [
        {
          phase: "Loading Phase (Wk 1-4)",
          dose: "2.5mg twice per week (5mg total)",
        },
        { phase: "Maintenance (Wk 5+)", dose: "2.5mg once per week" },
      ],
      rules: [
        "Best administered systematically (sub-q)",
        "Typically run in 4-6 week cycles",
        "Highly synergistic when researched alongside BPC-157",
      ],
    },
    combos: ["BPC-157", "Ipamorelin", "GHK-Cu"],
  },
  "melanotan-2": {
    overview:
      "Melanotan 2 (MT2) is a synthetic analog of alpha-melanocyte-stimulating hormone (α-MSH). It is heavily researched for its ability to stimulate melanogenesis (skin pigmentation) and its secondary effects on libido and appetite suppression.",
    dosage: {
      phases: [
        { phase: "Loading Phase", dose: "250mcg daily (prior to UV exposure)" },
        { phase: "Maintenance Phase", dose: "250mcg to 500mcg 1-2x per week" },
      ],
      rules: [
        "Start extremely low (100mcg) to assess nausea tolerance",
        "Requires UV exposure to trigger pigmentation process",
        "Do not exceed 500mcg per administration",
        "Dose at night to mitigate transient flushing/nausea",
      ],
    },
    combos: ["PT-141", "BPC-157"],
  },
  "ghk-cu": {
    overview:
      "GHK-Cu (Copper Peptide) is a naturally occurring copper complex. It is actively researched for its profound anti-aging properties, ability to improve skin elasticity, stimulate blood vessel growth, and accelerate wound healing.",
    dosage: {
      phases: [
        { phase: "Standard Protocol", dose: "1.5mg to 2mg once daily" },
        { phase: "Alternative Protocol", dose: "5mg twice per week" },
      ],
      rules: [
        "Cycle for 30 days, followed by 30 days off",
        "Can cause injection site pip (stinging) - dilute with extra Bac water",
        "Monitor zinc levels during extended research periods",
      ],
    },
    combos: ["BPC-157", "Epitalon", "CJC-1295"],
  },
  cagrilintide: {
    overview:
      "Cagrilintide is an amylin analog primarily researched as a combination therapy alongside GLP-1 agonists. It targets amylin receptors to significantly delay gastric emptying and enhance feelings of satiety.",
    dosage: {
      phases: [
        { phase: "Week 1–4", dose: "0.25mg once per week" },
        { phase: "Week 5–8", dose: "0.50mg once per week" },
        { phase: "Week 9–12", dose: "1.00mg once per week" },
      ],
      rules: [
        "Administer once weekly",
        "If stacking with Tirzepatide/Semaglutide, dose on a different day",
        "Titrate slowly to avoid severe nausea",
        "Do not exceed 2.4mg per week",
      ],
    },
    combos: ["Retatrutide", "Tirzepatide", "Semaglutide"],
  },
};

export default function Product() {
  const { slug } = useParams();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [errorMsg, setErrorMsg] = useState("");
  const [relatedProducts, setRelatedProducts] = useState([]);

  useEffect(() => {
    async function fetchProduct() {
      if (!slug || slug === "undefined") {
        setErrorMsg("Invalid Product URL");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("products")
        .select(`*, variants (*)`)
        .eq("slug", slug)
        .single();

      if (error) {
        setErrorMsg(error.message);
      }

      if (data) {
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

          const sorted = [...visibleVariants].sort((a, b) => {
            if (a.is_default && !b.is_default) return -1;
            if (!a.is_default && b.is_default) return 1;
            return (a.price || 0) - (b.price || 0);
          });

          const defaultVariant = sorted.find((v) => v.is_default === true);
          setSelectedVariant(defaultVariant || sorted[0]);
        }
      }
      setLoading(false);
    }
    fetchProduct();
  }, [slug]);

  useEffect(() => {
    async function fetchRelatedProducts() {
      if (!product?.slug) return;
      const relatedSlugs = getRelatedProductSlugsForProduct(product.slug);
      if (!relatedSlugs.length) return;

      const { data, error } = await supabase
        .from("products")
        .select("*, variants (*)")
        .in("slug", relatedSlugs);

      if (!error && data) {
        const ordered = relatedSlugs
          .map((relatedSlug) => data.find((item) => item.slug === relatedSlug))
          .filter(Boolean)
          .map((item) => {
            const visibleVariants = (item.variants || []).filter(
              (v) => v.is_hidden !== true && v.is_hidden !== "true",
            );
            const sortedVariants = [...visibleVariants].sort((a, b) => {
              if (a.is_default && !b.is_default) return -1;
              if (!a.is_default && b.is_default) return 1;
              return (a.price || 0) - (b.price || 0);
            });
            return {
              ...item,
              variants: visibleVariants,
              defaultVariant:
                sortedVariants.find((v) => v.is_default) ||
                sortedVariants[0] ||
                null,
            };
          })
          .filter((item) => item.slug !== product.slug && item.defaultVariant);
        setRelatedProducts(ordered.slice(0, 6));
      }
    }
    fetchRelatedProducts();
  }, [product]);

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

  const handleAddSuggestedProduct = (suggestedProduct) => {
    if (!suggestedProduct?.defaultVariant) return;
    addToCart(
      {
        ...suggestedProduct,
        id: suggestedProduct.id,
        price: suggestedProduct.defaultVariant.price,
        image:
          suggestedProduct.defaultVariant.image_url ||
          suggestedProduct.image_url,
        variantId: suggestedProduct.defaultVariant.id,
      },
      1,
      suggestedProduct.defaultVariant.size_label,
    );
  };

  const formatPrice = (amount) => {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
    }).format(amount);
  };

  if (loading) {
    return (
      <div
        className="container"
        style={{ padding: "80px", textAlign: "center" }}
      >
        Loading Data...
      </div>
    );
  }

  if (!product) {
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
  }

  const absoluteUrl = `https://melbournepeptides.com.au/product/${slug}`;
  const displayImage =
    selectedVariant?.image_url ||
    product.image_url ||
    "https://via.placeholder.com/600";
  const isMainProductInStock = product.in_stock !== false;
  const isSelectedVariantInStock = selectedVariant?.in_stock !== false;
  const isPreorder = selectedVariant?.is_preorder === true;
  const isCurrentlyPurchasable =
    isMainProductInStock && (isSelectedVariantInStock || isPreorder);
  const activeLabUrl =
    selectedVariant?.lab_result_url || product.lab_result_url;

  const isAccessory =
    product.category === "Accessories" ||
    product.category === "Syringes" ||
    product.category === "Prep Pads";
  const seoCanonicalUrl = isAccessory
    ? absoluteUrl
    : `https://melbournepeptides.com.au/${slug}`;
  const sizeLabel = selectedVariant?.size_label || "";
  const numericMatch = sizeLabel.match(/\d+/);
  const sizeNumber = numericMatch ? parseInt(numericMatch[0], 10) : 0;
  const showFulfillmentNotice = sizeNumber > 10;

  // Retrieve Profile if available
  const profile =
    PEPTIDE_PROFILES[slug] ||
    PEPTIDE_PROFILES[product.name.toLowerCase().replace(/\s+/g, "-")];

  const metaDescription = product.description
    ? `${product.description.substring(0, 140)}. Buy ${product.name} research peptide in Australia with fast shipping.`
    : `Buy ${product.name} research peptide in Australia.`;

  return (
    <div className="container product-page">
      <SEO
        title={`Buy ${product.name} Australia`}
        description={metaDescription}
        image={displayImage}
        type="product"
        url={seoCanonicalUrl}
        noindex={!isAccessory}
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
              alt={`${product.name} research peptide vial`}
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
              {[...(product.variants || [])]
                .sort((a, b) => {
                  if (a.is_default && !b.is_default) return -1;
                  if (!a.is_default && b.is_default) return 1;
                  return (a.price || 0) - (b.price || 0);
                })
                .map((v) => {
                  const isThisVariantInStock = v.in_stock !== false;
                  const isThisVariantPreorder = v.is_preorder === true;

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
                        opacity:
                          isThisVariantInStock || isThisVariantPreorder
                            ? 1
                            : 0.5,
                      }}
                    >
                      {v.size_label}
                      {isThisVariantPreorder
                        ? " (Preorder)"
                        : !isThisVariantInStock && " (Out of Stock)"}
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
                  : isPreorder
                    ? `Pre-order - ${formatPrice(selectedVariant.price * quantity)}`
                    : !isSelectedVariantInStock
                      ? `${selectedVariant.size_label} is Out of Stock`
                      : `Add to Cart - ${formatPrice(selectedVariant.price * quantity)}`}
            </button>
          </div>

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

          {/* --- NEW: STRUCTURED RESEARCH PROFILE OR FALLBACK --- */}
          {!isAccessory && (
            <div
              className="p-profile-section"
              style={{ display: "flex", flexDirection: "column", gap: "24px" }}
            >
              {/* Overview */}
              <div>
                <h3
                  style={{
                    fontSize: "1.1rem",
                    color: "#0f172a",
                    marginBottom: "8px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <FileText size={18} color="#4635de" /> Overview
                </h3>
                <p
                  style={{
                    color: "#475569",
                    lineHeight: "1.6",
                    fontSize: "0.95rem",
                    margin: 0,
                  }}
                >
                  {profile ? profile.overview : product.description}
                </p>
              </div>

              {/* Dosage Protocol (Only if profile exists) */}
              {profile && profile.dosage && (
                <div
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    overflow: "hidden",
                  }}
                >
                  <div style={{ background: "#e2e8f0", padding: "12px 16px" }}>
                    <h3
                      style={{
                        fontSize: "1rem",
                        color: "#0f172a",
                        margin: 0,
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <AlertTriangle size={16} color="#0f172a" /> Dosage
                      Protocol (Research Only)
                    </h3>
                  </div>
                  <div style={{ padding: "16px" }}>
                    {profile.dosage.phases.map((phase, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          paddingBottom: "12px",
                          marginBottom: "12px",
                          borderBottom:
                            idx !== profile.dosage.phases.length - 1
                              ? "1px dashed #cbd5e1"
                              : "none",
                        }}
                      >
                        <span style={{ fontWeight: "700", color: "#334155" }}>
                          {phase.phase}
                        </span>
                        <span
                          style={{
                            color: "#4635de",
                            fontWeight: "600",
                            textAlign: "right",
                          }}
                        >
                          {phase.dose}
                        </span>
                      </div>
                    ))}
                    <div
                      style={{
                        marginTop: "16px",
                        paddingTop: "16px",
                        borderTop: "2px solid #e2e8f0",
                      }}
                    >
                      <h4
                        style={{
                          fontSize: "0.9rem",
                          color: "#0f172a",
                          marginBottom: "10px",
                        }}
                      >
                        Protocol Rules
                      </h4>
                      {profile.dosage.rules.map((rule, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "8px",
                            marginBottom: "6px",
                          }}
                        >
                          <CheckCircle2
                            size={14}
                            color="#10b981"
                            style={{ marginTop: "3px", flexShrink: 0 }}
                          />
                          <span
                            style={{ fontSize: "0.9rem", color: "#475569" }}
                          >
                            {rule}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Reconstitution */}
              <div
                style={{
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  borderRadius: "12px",
                  padding: "16px",
                }}
              >
                <h3
                  style={{
                    fontSize: "1rem",
                    color: "#166534",
                    margin: "0 0 10px 0",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <Beaker size={18} /> Reconstitution
                </h3>
                <p
                  style={{
                    color: "#15803d",
                    fontSize: "0.9rem",
                    lineHeight: "1.5",
                    margin: "0 0 12px 0",
                  }}
                >
                  Reconstitute using bacteriostatic water. The amount of water
                  added will depend on your target dosage and study
                  requirements.
                </p>
                <Link
                  to={`/peptide-calculator/${slug}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "#16a34a",
                    color: "white",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    fontSize: "0.9rem",
                    fontWeight: "600",
                    textDecoration: "none",
                  }}
                >
                  <Calculator size={16} /> Open Peptide Calculator
                </Link>
              </div>

              {/* Combos */}
              {profile && profile.combos && (
                <div>
                  <h3
                    style={{
                      fontSize: "1rem",
                      color: "#0f172a",
                      marginBottom: "12px",
                    }}
                  >
                    Common Research Combinations
                  </h3>
                  <div
                    style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}
                  >
                    {profile.combos.map((combo, idx) => (
                      <Link
                        key={idx}
                        to={`/product/${combo.toLowerCase().replace(/\s+/g, "-")}`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          background: "#f1f5f9",
                          color: "#334155",
                          padding: "6px 12px",
                          borderRadius: "20px",
                          fontSize: "0.85rem",
                          fontWeight: "600",
                          textDecoration: "none",
                          border: "1px solid #cbd5e1",
                        }}
                      >
                        {combo} <ArrowRight size={12} />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Trust Badges */}
          <div
            className="p-trust"
            style={{
              marginTop: "40px",
              display: "flex",
              gap: "20px",
              padding: "20px",
              background: "#f8fafc",
              borderRadius: "12px",
            }}
          >
            <div
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
            {!isAccessory && (
              <div
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

      {/* RELATED PRODUCTS */}
      {relatedProducts.length > 0 && (
        <div style={{ marginTop: "60px" }}>
          <h3
            style={{
              margin: "0 0 24px 0",
              color: "#0f172a",
              fontSize: "1.5rem",
              fontWeight: "800",
            }}
          >
            Frequently Researched Together
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "20px",
            }}
          >
            {relatedProducts.map((related) => (
              <div
                key={related.id}
                style={{
                  background: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <Link
                  to={`/product/${related.slug}`}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <div
                    style={{
                      background:
                        "radial-gradient(circle at center, #ffffff 50%, #f1f5f9 100%)",
                      borderRadius: "10px",
                      padding: "14px",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      minHeight: "140px",
                    }}
                  >
                    <img
                      src={
                        related.defaultVariant?.image_url ||
                        related.image_url ||
                        "https://via.placeholder.com/300"
                      }
                      alt={related.name}
                      loading="lazy"
                      style={{
                        maxWidth: "100%",
                        maxHeight: "110px",
                        objectFit: "contain",
                      }}
                    />
                  </div>
                </Link>
                <div>
                  <Link
                    to={`/product/${related.slug}`}
                    style={{
                      color: "#0f172a",
                      textDecoration: "none",
                      fontWeight: "700",
                      lineHeight: "1.4",
                    }}
                  >
                    {related.name}
                  </Link>
                  <p
                    style={{
                      margin: "6px 0 0 0",
                      color: "#64748b",
                      fontSize: "0.9rem",
                    }}
                  >
                    {related.defaultVariant?.size_label} ·{" "}
                    {formatPrice(related.defaultVariant?.price || 0)}
                  </p>
                </div>
                <button
                  onClick={() => handleAddSuggestedProduct(related)}
                  style={{
                    border: "none",
                    background: "#4635de",
                    color: "white",
                    borderRadius: "10px",
                    padding: "12px",
                    fontWeight: "700",
                    cursor: "pointer",
                    marginTop: "auto",
                  }}
                >
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
