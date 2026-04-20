import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useCart } from "../lib/CartContext";
import SEO from "../components/SEO";
import {
  Droplets,
  ShieldCheck,
  Calculator,
  ThermometerSnowflake,
  AlertTriangle,
  ArrowRight,
  ShoppingCart,
} from "lucide-react";

export default function ReconstitutionGuide() {
  const { addToCart } = useCart();
  const [supplies, setSupplies] = useState([]);
  const [loadingSupplies, setLoadingSupplies] = useState(true);

  // Fetch the actual supply products from Supabase
  useEffect(() => {
    async function fetchSupplies() {
      // The exact slugs for your required supplies
      const supplySlugs = [
        "bacteriostatic-water",
        "peptide-syringes-1ml",
        "peptide-prep-pads",
      ];

      const { data, error } = await supabase
        .from("products")
        .select("*, variants (*)")
        .in("slug", supplySlugs);

      if (!error && data) {
        // Map and format the data
        const formattedSupplies = data.map((product) => {
          const visibleVariants = (product.variants || []).filter(
            (v) => v.is_hidden !== true && v.is_hidden !== "true",
          );

          // Sort variants (default first, then by price)
          const sortedVariants = [...visibleVariants].sort((a, b) => {
            if (a.is_default && !b.is_default) return -1;
            if (!a.is_default && b.is_default) return 1;
            return (a.price || 0) - (b.price || 0);
          });

          return {
            ...product,
            variants: sortedVariants,
            selectedVariant:
              sortedVariants.find((v) => v.is_default) ||
              sortedVariants[0] ||
              null,
          };
        });

        // Ensure they render in the preferred order
        const orderedSupplies = supplySlugs
          .map((slug) => formattedSupplies.find((s) => s.slug === slug))
          .filter(Boolean);

        setSupplies(orderedSupplies);
      }
      setLoadingSupplies(false);
    }

    fetchSupplies();
  }, []);

  // FIX: Force both IDs to be strings so the dropdown matches the database accurately
  const handleVariantChange = (productId, variantId) => {
    setSupplies((currentSupplies) =>
      currentSupplies.map((product) => {
        if (product.id === productId) {
          return {
            ...product,
            selectedVariant: product.variants.find(
              (v) => String(v.id) === String(variantId),
            ),
          };
        }
        return product;
      }),
    );
  };

  const handleAddToCart = (product) => {
    if (!product.selectedVariant) return;

    addToCart(
      {
        ...product,
        id: product.id,
        price: product.selectedVariant.price,
        image: product.selectedVariant.image_url || product.image_url,
        variantId: product.selectedVariant.id,
      },
      1,
      product.selectedVariant.size_label,
    );
  };

  const formatPrice = (amount) => {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
    }).format(amount);
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How much bacteriostatic water do I mix with a 10mg peptide vial?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "A standard laboratory protocol is to mix 2ml of bacteriostatic water with a 10mg peptide vial. This yields a concentration of 5mg/ml.",
        },
      },
      {
        "@type": "Question",
        name: "Do I shake the peptide vial to mix it?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. Peptides are fragile amino acid chains. You should gently roll or swirl the vial, never vigorously shake it, as this can damage the molecular structure.",
        },
      },
      {
        "@type": "Question",
        name: "How long do reconstituted peptides last?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Once reconstituted with bacteriostatic water and stored in a refrigerator (2°C to 8°C), research peptides generally remain stable for 3 to 4 weeks.",
        },
      },
    ],
  };

  return (
    <div style={styles.pageContainer}>
      <SEO
        title="How to Reconstitute Peptides | Step-by-Step Guide"
        description="Learn exactly how to reconstitute research peptides with bacteriostatic water. Step-by-step instructions, dilution ratios, and storage best practices."
        url="https://melbournepeptides.com.au/peptide-reconstitution-guide"
      />
      <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>

      {/* Hero Section */}
      <div style={styles.heroSection}>
        <div style={styles.heroContent}>
          <span style={styles.heroBadge}>Laboratory Resources</span>
          <h1 style={styles.heroTitle}>Peptide Reconstitution Guide</h1>
          <p style={styles.heroSubtitle}>
            A comprehensive, step-by-step visual guide on how to properly mix
            lyophilized research peptides with bacteriostatic water for accurate
            laboratory studies.
          </p>

          {/* Hero Image */}
          <div style={styles.heroImageContainer}>
            <img
              src="/images/guide/hero-reconstitution.jpg"
              alt="Peptide Reconstitution Process"
              style={styles.heroImage}
            />
          </div>
        </div>
      </div>

      <div className="guide-main-grid" style={styles.mainGrid}>
        {/* Main Content Column */}
        <div style={styles.contentColumn}>
          {/* STEP 1 */}
          <section className="guide-card" style={styles.card}>
            <h2 style={styles.cardTitle}>
              <ShieldCheck color="#4635de" size={28} className="guide-icon" />{" "}
              Step 1: Preparation & Sterilization
            </h2>
            <p style={styles.textBody}>
              Before beginning the reconstitution process, ensure your workspace
              is completely sterile. Peptides are highly sensitive to
              contamination.
            </p>
            <ul style={styles.list}>
              <li style={styles.listItem}>
                Wash hands thoroughly and wear laboratory gloves.
              </li>
              <li style={styles.listItem}>
                Wipe down your workspace with an alcohol-based cleaner.
              </li>
              <li style={styles.listItem}>
                Pop the plastic caps off both the peptide vial and the
                Bacteriostatic Water vial.
              </li>
              <li style={styles.listItem}>
                Use a fresh alcohol prep pad to wipe the rubber stoppers on both
                vials. Let them air dry.
              </li>
            </ul>

            {/* Step 1 Image Grid */}
            <div className="step-image-grid" style={styles.stepImageGrid}>
              <div style={styles.stepImageCard}>
                <img
                  src="/images/guide/step1a-sterile-workspace.jpg"
                  alt="Sterile Workspace"
                  style={styles.stepImage}
                />
                <p style={styles.stepImageCaption}>1A. Sterilize Workspace</p>
              </div>
              <div style={styles.stepImageCard}>
                <img
                  src="/images/guide/step1b-remove-caps.jpg"
                  alt="Remove Caps"
                  style={styles.stepImage}
                />
                <p style={styles.stepImageCaption}>1B. Remove Plastic Caps</p>
              </div>
              <div style={styles.stepImageCard}>
                <img
                  src="/images/guide/step1c-wipe-stoppers.jpg"
                  alt="Wipe Stoppers"
                  style={styles.stepImage}
                />
                <p style={styles.stepImageCaption}>1C. Wipe with Alcohol</p>
              </div>
            </div>
          </section>

          {/* STEP 2 */}
          <section className="guide-card" style={styles.card}>
            <h2 style={styles.cardTitle}>
              <Droplets color="#4635de" size={28} className="guide-icon" /> Step
              2: Mixing the Solution
            </h2>
            <p style={styles.textBody}>
              Using a sterile syringe, draw the required amount of air into the
              syringe, push the air into the Bacteriostatic Water vial (to
              prevent a vacuum), and draw your desired amount of water.
            </p>

            <div style={styles.warningBox}>
              <h3 style={styles.warningTitle}>
                <AlertTriangle
                  color="#f59e0b"
                  size={24}
                  style={{ flexShrink: 0 }}
                />{" "}
                Crucial Rule: Do Not Shake
              </h3>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <p style={styles.warningText}>
                  Peptide amino acid chains are incredibly fragile. When
                  injecting the water into the peptide vial, aim the needle at
                  the glass wall of the vial, allowing the water to drip down
                  the side gently.{" "}
                  <strong
                    style={{
                      color: "#b45309",
                      fontFamily: "Poppins, sans-serif",
                      fontWeight: "600",
                    }}
                  >
                    Never spray water directly onto the powder, and never
                    vigorously shake the vial.
                  </strong>{" "}
                  Gently roll or swirl the vial between your fingers until the
                  powder dissolves and the liquid is perfectly clear.
                </p>
                {/* Do Not Shake Comparison Graphic */}
                <img
                  src="/images/guide/do-not-shake-comparison.jpg"
                  alt="Swirl gently, do not shake comparison"
                  style={styles.comparisonImage}
                />
              </div>
            </div>

            {/* Step 2 Image Grid */}
            <div className="step-image-grid" style={styles.stepImageGrid}>
              <div style={styles.stepImageCard}>
                <img
                  src="/images/guide/step2a-draw-water.jpg"
                  alt="Draw Bacteriostatic Water"
                  style={styles.stepImage}
                />
                <p style={styles.stepImageCaption}>2A. Draw Bac Water</p>
              </div>
              <div style={styles.stepImageCard}>
                <img
                  src="/images/guide/step2b-inject-water.jpg"
                  alt="Inject Water Slowly"
                  style={styles.stepImage}
                />
                <p style={styles.stepImageCaption}>2B. Inject Slowly on Wall</p>
              </div>
              <div style={styles.stepImageCard}>
                <img
                  src="/images/guide/step2c-swirl-vial.jpg"
                  alt="Swirl Vial gently"
                  style={styles.stepImage}
                />
                <p style={styles.stepImageCaption}>2C. Swirl, Do Not Shake</p>
              </div>
            </div>
          </section>

          <section className="guide-card" style={styles.card}>
            <h2 style={styles.cardTitle}>
              <Calculator color="#4635de" size={28} className="guide-icon" />{" "}
              Understanding Dilution Ratios
            </h2>
            <p style={styles.textBody}>
              The amount of bacteriostatic water you add determines the
              concentration of your solution. Here is a standard example used in
              research settings:
            </p>
            <div style={styles.codeBox}>
              <p
                style={{
                  color: "#60a5fa",
                  marginBottom: "12px",
                  fontFamily: "monospace",
                }}
              >
                // STANDARD 10MG MIXTURE
              </p>
              <p style={{ fontFamily: "monospace" }}>Peptide Vial Size: 10mg</p>
              <p style={{ fontFamily: "monospace" }}>
                Bacteriostatic Water Added: 2ml
              </p>
              <p
                style={{
                  color: "#34d399",
                  marginTop: "12px",
                  fontWeight: "bold",
                  fontFamily: "monospace",
                }}
              >
                Resulting Concentration: 5mg per 1ml
              </p>
              <p
                style={{
                  color: "#94a3b8",
                  marginTop: "12px",
                  fontFamily: "monospace",
                }}
              >
                Drawing 0.1ml (10 units on an insulin syringe) = 500mcg dose.
              </p>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="guide-card" style={styles.card}>
            <h2 style={styles.cardTitle}>Frequently Asked Questions</h2>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              <div style={styles.faqBox}>
                <h3 style={styles.faqQuestion}>
                  Can I use sterile water instead of bacteriostatic water?
                </h3>
                <p style={styles.textBody}>
                  Sterile water is only for single-use injections.
                  Bacteriostatic water contains 0.9% benzyl alcohol, which
                  prevents bacterial growth and allows the multi-use vial to
                  remain stable in the fridge for up to 4 weeks.
                </p>
              </div>
              <div style={styles.faqBox}>
                <h3 style={styles.faqQuestion}>Why is the vial pressurized?</h3>
                <p style={styles.textBody}>
                  Lyophilized peptide vials are packed in a vacuum. When you
                  insert the needle to add water, the vacuum will pull the water
                  in automatically. If the vacuum is too strong, you can safely
                  inject a small amount of air to equalize the pressure.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar Column */}
        <div style={styles.sidebarColumn}>
          {/* CTA Box */}
          <div className="cta-box" style={styles.ctaBox}>
            <Calculator
              size={42}
              color="#e0e7ff"
              style={{ margin: "0 auto 16px auto", display: "block" }}
            />
            <h3
              style={{
                fontFamily: "Poppins, sans-serif",
                fontSize: "1.4rem",
                fontWeight: "600",
                marginBottom: "12px",
                lineHeight: "1.4",
              }}
            >
              Don't guess the math.
            </h3>
            <p
              style={{
                fontFamily: "Poppins, sans-serif",
                fontSize: "0.95rem",
                color: "#e0e7ff",
                lineHeight: "1.6",
                marginBottom: "24px",
                fontWeight: "400",
              }}
            >
              Use our free interactive tool to calculate exact tick marks, water
              ratios, and mcg concentrations instantly.
            </p>
            <Link
              to="/peptide-calculator"
              className="cta-btn"
              style={styles.ctaButton}
            >
              Open Peptide Calculator <ArrowRight size={18} />
            </Link>
          </div>

          {/* Storage Box */}
          <div style={styles.sideCard}>
            <div style={styles.sideCardImageWrapper}>
              <img
                src="/images/guide/storage-guidelines.jpg"
                alt="Storage Guidelines"
                style={styles.sideCardImage}
              />
            </div>
            <div className="sidecard-content" style={styles.sideCardContent}>
              <h3 style={styles.sideCardTitle}>
                <ThermometerSnowflake color="#38bdf8" /> Storage Guidelines
              </h3>
              <ul style={styles.sideList}>
                <li style={{ marginBottom: "12px" }}>
                  <strong
                    style={{
                      color: "#0f172a",
                      fontFamily: "Poppins, sans-serif",
                      fontWeight: "600",
                    }}
                  >
                    Unmixed (Powder):
                  </strong>{" "}
                  Store in the freezer (-20°C) for long-term stability up to 2
                  years. Keep away from light.
                </li>
                <li>
                  <strong
                    style={{
                      color: "#0f172a",
                      fontFamily: "Poppins, sans-serif",
                      fontWeight: "600",
                    }}
                  >
                    Mixed (Liquid):
                  </strong>{" "}
                  Must be stored in the refrigerator (2°C to 8°C). Discard after
                  4 weeks.
                </li>
              </ul>
            </div>
          </div>

          {/* SHOPPABLE SUPPLIES BOX */}
          <div style={styles.sideCard}>
            <div className="sidecard-content" style={styles.sideCardContent}>
              <h3 style={styles.sideCardTitle}>Required Supplies</h3>
              <p
                style={{
                  fontFamily: "Poppins, sans-serif",
                  fontSize: "0.9rem",
                  color: "#64748b",
                  marginBottom: "20px",
                }}
              >
                Everything you need for safe, sterile reconstitution.
              </p>

              {loadingSupplies ? (
                <p
                  style={{
                    fontFamily: "Poppins, sans-serif",
                    fontSize: "0.9rem",
                    color: "#94a3b8",
                    textAlign: "center",
                    padding: "20px",
                  }}
                >
                  Loading supplies...
                </p>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "20px",
                  }}
                >
                  {supplies.map((product, index) => (
                    <div
                      key={product.id}
                      style={{
                        borderBottom:
                          index !== supplies.length - 1
                            ? "1px solid #f1f5f9"
                            : "none",
                        paddingBottom:
                          index !== supplies.length - 1 ? "20px" : "0",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          gap: "12px",
                          marginBottom: "12px",
                        }}
                      >
                        {/* Supply Image */}
                        <div
                          style={{
                            width: "64px",
                            height: "64px",
                            borderRadius: "8px",
                            background: "#f8fafc",
                            border: "1px solid #e2e8f0",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            overflow: "hidden",
                          }}
                        >
                          <img
                            src={
                              product.selectedVariant?.image_url ||
                              product.image_url
                            }
                            alt={product.name}
                            style={{
                              maxWidth: "100%",
                              maxHeight: "100%",
                              objectFit: "contain",
                            }}
                          />
                        </div>

                        {/* Supply Details */}
                        <div style={{ flex: 1 }}>
                          <Link
                            to={`/product/${product.slug}`}
                            style={{
                              fontFamily: "Poppins, sans-serif",
                              color: "#0f172a",
                              fontWeight: "600",
                              fontSize: "0.95rem",
                              textDecoration: "none",
                              display: "block",
                              lineHeight: "1.3",
                              marginBottom: "4px",
                            }}
                          >
                            {product.name}
                          </Link>
                          <span
                            style={{
                              fontFamily: "Poppins, sans-serif",
                              fontWeight: "600",
                              color: "#4635de",
                              fontSize: "0.95rem",
                            }}
                          >
                            {product.selectedVariant
                              ? formatPrice(product.selectedVariant.price)
                              : "Unavailable"}
                          </span>
                        </div>
                      </div>

                      {/* Variant Selector */}
                      {product.variants && product.variants.length > 1 && (
                        <select
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            borderRadius: "8px",
                            border: "1px solid #cbd5e1",
                            fontFamily: "Poppins, sans-serif",
                            fontSize: "0.85rem",
                            color: "#334155",
                            marginBottom: "10px",
                            backgroundColor: "#f8fafc",
                            outline: "none",
                          }}
                          value={product.selectedVariant?.id || ""}
                          onChange={(e) =>
                            handleVariantChange(product.id, e.target.value)
                          }
                        >
                          {product.variants.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.size_label} - {formatPrice(v.price)}
                            </option>
                          ))}
                        </select>
                      )}

                      {/* Add to Cart Button */}
                      <button
                        onClick={() => handleAddToCart(product)}
                        disabled={
                          !product.selectedVariant ||
                          product.selectedVariant.in_stock === false
                        }
                        style={{
                          width: "100%",
                          padding: "10px",
                          backgroundColor:
                            product.selectedVariant?.in_stock !== false
                              ? "#f1f5f9"
                              : "#e2e8f0",
                          color:
                            product.selectedVariant?.in_stock !== false
                              ? "#4635de"
                              : "#94a3b8",
                          border:
                            product.selectedVariant?.in_stock !== false
                              ? "1px solid #cbd5e1"
                              : "none",
                          borderRadius: "8px",
                          fontFamily: "Poppins, sans-serif",
                          fontWeight: "600",
                          fontSize: "0.9rem",
                          cursor:
                            product.selectedVariant?.in_stock !== false
                              ? "pointer"
                              : "not-allowed",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                          transition: "background-color 0.2s",
                        }}
                        onMouseOver={(e) => {
                          if (product.selectedVariant?.in_stock !== false) {
                            e.currentTarget.style.backgroundColor = "#e2e8f0";
                          }
                        }}
                        onMouseOut={(e) => {
                          if (product.selectedVariant?.in_stock !== false) {
                            e.currentTarget.style.backgroundColor = "#f1f5f9";
                          }
                        }}
                      >
                        <ShoppingCart size={16} />
                        {product.selectedVariant?.in_stock !== false
                          ? "Add to Cart"
                          : "Out of Stock"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  pageContainer: {
    backgroundColor: "#f8fafc",
    minHeight: "100vh",
    paddingBottom: "80px",
    fontFamily: "Poppins, sans-serif",
  },
  heroSection: {
    backgroundColor: "white",
    borderBottom: "1px solid #e2e8f0",
    padding: "48px 5vw",
    textAlign: "center",
    marginBottom: "48px",
    boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
  },
  heroContent: {
    maxWidth: "900px",
    margin: "0 auto",
  },
  heroBadge: {
    color: "#4635de",
    fontFamily: "Poppins, sans-serif",
    fontWeight: "600",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    fontSize: "0.85rem",
    marginBottom: "16px",
    display: "block",
  },
  heroTitle: {
    fontFamily: "Poppins, sans-serif",
    fontSize: "clamp(2rem, 5vw, 3.25rem)",
    fontWeight: "600",
    color: "#0f172a",
    letterSpacing: "-0.02em",
    marginBottom: "20px",
    lineHeight: "1.15",
  },
  heroSubtitle: {
    fontFamily: "Poppins, sans-serif",
    fontSize: "1.1rem",
    color: "#475569",
    fontWeight: "400",
    lineHeight: "1.6",
    maxWidth: "700px",
    margin: "0 auto 32px auto",
  },
  heroImageContainer: {
    width: "100%",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow:
      "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    border: "1px solid #e2e8f0",
    lineHeight: 0,
  },
  heroImage: {
    width: "100%",
    height: "auto",
    maxHeight: "400px",
    objectFit: "cover",
  },
  mainGrid: {
    maxWidth: "1280px",
    margin: "0 auto",
    padding: "0 5vw",
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "32px",
  },
  contentColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "32px",
  },
  sidebarColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  card: {
    backgroundColor: "white",
    borderRadius: "16px",
    boxShadow:
      "0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05)",
    border: "1px solid #f1f5f9",
  },
  cardTitle: {
    fontFamily: "Poppins, sans-serif",
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: "20px",
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    letterSpacing: "-0.01em",
    lineHeight: "1.3",
  },
  textBody: {
    fontFamily: "Poppins, sans-serif",
    color: "#475569",
    fontSize: "1.05rem",
    lineHeight: "1.6",
    marginBottom: "16px",
    fontWeight: "400",
    margin: 0,
  },
  list: {
    listStyleType: "disc",
    paddingLeft: "24px",
    fontFamily: "Poppins, sans-serif",
    color: "#475569",
    fontSize: "1.05rem",
    lineHeight: "1.6",
    marginTop: "16px",
    fontWeight: "400",
  },
  listItem: {
    marginBottom: "8px",
  },
  stepImageGrid: {
    display: "grid",
    gap: "16px",
    marginTop: "24px",
  },
  stepImageCard: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  stepImage: {
    width: "100%",
    aspectRatio: "4/3",
    objectFit: "cover",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    backgroundColor: "#f8fafc",
  },
  stepImageCaption: {
    fontFamily: "Poppins, sans-serif",
    fontSize: "0.9rem",
    fontWeight: "600",
    color: "#334155",
    textAlign: "center",
    margin: 0,
  },
  warningBox: {
    backgroundColor: "#fffbeb",
    border: "1px solid #fde68a",
    borderLeft: "4px solid #f59e0b",
    padding: "20px",
    borderRadius: "12px",
    marginTop: "20px",
  },
  warningTitle: {
    fontFamily: "Poppins, sans-serif",
    fontWeight: "600",
    color: "#92400e",
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    marginBottom: "10px",
    fontSize: "1.05rem",
    lineHeight: "1.3",
  },
  warningText: {
    fontFamily: "Poppins, sans-serif",
    fontWeight: "400",
    color: "#92400e",
    fontSize: "0.95rem",
    lineHeight: "1.5",
    margin: 0,
  },
  comparisonImage: {
    width: "100%",
    height: "auto",
    borderRadius: "8px",
    border: "1px solid #fcd34d",
  },
  codeBox: {
    backgroundColor: "#0f172a",
    color: "#f8fafc",
    padding: "20px",
    borderRadius: "12px",
    fontFamily: "monospace",
    fontSize: "0.9rem",
    lineHeight: "1.5",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
    overflowX: "auto",
  },
  faqBox: {
    backgroundColor: "#f8fafc",
    padding: "20px",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
  },
  faqQuestion: {
    fontFamily: "Poppins, sans-serif",
    fontWeight: "600",
    color: "#0f172a",
    fontSize: "1.05rem",
    marginBottom: "10px",
    lineHeight: "1.4",
  },
  ctaBox: {
    backgroundColor: "#1e3a8a",
    color: "white",
    padding: "32px 24px",
    borderRadius: "16px",
    textAlign: "center",
    boxShadow: "0 10px 25px -5px rgba(30, 58, 138, 0.4)",
  },
  ctaButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    backgroundColor: "white",
    color: "#1e3a8a",
    padding: "14px 20px",
    borderRadius: "10px",
    fontFamily: "Poppins, sans-serif",
    fontWeight: "600",
    fontSize: "1rem",
    textDecoration: "none",
    transition: "background-color 0.2s",
    width: "100%",
  },
  sideCard: {
    backgroundColor: "white",
    borderRadius: "16px",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
    border: "1px solid #f1f5f9",
    overflow: "hidden",
  },
  sideCardImageWrapper: {
    width: "100%",
    aspectRatio: "16/9",
    borderBottom: "1px solid #f1f5f9",
    backgroundColor: "#f8fafc",
  },
  sideCardImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  sideCardContent: {
    padding: "24px",
  },
  sideCardTitle: {
    fontFamily: "Poppins, sans-serif",
    fontSize: "1.15rem",
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: "16px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  sideList: {
    listStyle: "none",
    fontFamily: "Poppins, sans-serif",
    color: "#475569",
    fontSize: "0.95rem",
    lineHeight: "1.5",
    fontWeight: "400",
    margin: 0,
  },
};

// CSS Injection for Responsive Design
const styleTag = document.createElement("style");
styleTag.innerHTML = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap');
  
  .guide-card {
    padding: 24px;
  }
  .card-title-icon {
    flex-shrink: 0;
  }
  @media (min-width: 768px) {
    .guide-card {
      padding: 32px;
    }
  }
  @media (min-width: 1024px) {
    .guide-main-grid {
      grid-template-columns: 2fr 1fr !important;
    }
    .step-image-grid {
      grid-template-columns: repeat(3, 1fr) !important;
    }
    .guide-card {
      padding: 40px;
    }
    div[style*="cardTitle"] {
      font-size: 1.5rem !important;
    }
  }
  @media (max-width: 1023px) {
    .step-image-grid {
      grid-template-columns: 1fr !important;
    }
    div[style*="cardTitle"] {
      font-size: 1.35rem !important;
    }
  }
  @media (max-width: 480px) {
    div[style*="heroTitle"] {
      font-size: 2rem !important;
    }
    .guide-card {
      padding: 20px;
    }
    div[style*="cardTitle"] {
      font-size: 1.2rem !important;
    }
  }
`;
document.head.appendChild(styleTag);
