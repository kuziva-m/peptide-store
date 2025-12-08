import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import ProductCard from "../components/ProductCard";

export default function Home() {
  // State now holds grouped products
  const [categorizedProducts, setCategorizedProducts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    const { data, error } = await supabase
      .from("products")
      .select(`*, variants (*)`)
      .order("name"); // Order products alphabetically

    if (!error && data) {
      // Group the flat list of products by their category name
      const grouped = data.reduce((acc, product) => {
        const cat = product.category || "Other"; // Fallback if category is missing
        if (!acc[cat]) {
          acc[cat] = [];
        }
        acc[cat].push(product);
        return acc;
      }, {});

      // Define custom order for categories
      const orderedGrouped = {};
      const categoryOrder = ["Peptides", "Peptide Blends", "Mixing Solution"];

      categoryOrder.forEach((cat) => {
        if (grouped[cat]) orderedGrouped[cat] = grouped[cat];
      });
      // Add any remaining categories that weren't in the preferred order list
      Object.keys(grouped).forEach((cat) => {
        if (!categoryOrder.includes(cat)) orderedGrouped[cat] = grouped[cat];
      });

      setCategorizedProducts(orderedGrouped);
    }
    setLoading(false);
  }

  return (
    <div className="page-wrapper">
      {/* Hero Section */}
      <div
        style={{
          backgroundColor: "#0f172a", // Dark navy background
          color: "white",
          padding: "100px 20px",
          textAlign: "center",
          marginBottom: "60px",
        }}
      >
        <div className="container">
          <h1
            style={{
              fontSize: "3.5rem",
              fontWeight: "900",
              margin: "0 0 16px 0",
              letterSpacing: "-2px",
            }}
          >
            Research Grade Peptides
          </h1>
          <p
            style={{
              color: "#cbd5e1",
              fontSize: "1.25rem",
              margin: 0,
              maxWidth: "600px",
              marginInline: "auto",
            }}
          >
            Premium laboratory solutions. Verified purity. Secure shipping.
          </p>
        </div>
      </div>

      <div className="container" style={{ paddingBottom: "80px" }}>
        {loading && (
          <p style={{ textAlign: "center", fontSize: "1.2rem" }}>
            Loading inventory...
          </p>
        )}

        {/* Iterate through categories */}
        {!loading &&
          Object.keys(categorizedProducts).map((categoryName) => (
            <section key={categoryName} style={{ marginBottom: "80px" }}>
              {/* Category Header */}
              <h2
                style={{
                  fontSize: "2rem",
                  fontWeight: "800",
                  marginBottom: "32px",
                  borderBottom: "2px solid var(--border)",
                  paddingBottom: "16px",
                  color: "var(--text-main)",
                }}
              >
                {categoryName}
              </h2>

              {/* Category Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: "32px",
                }}
              >
                {categorizedProducts[categoryName].map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          ))}
      </div>
    </div>
  );
}
