import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import ProductCard from "../components/ProductCard";
import { Search } from "lucide-react"; // Make sure to npm install lucide-react

export default function Home() {
  // --- STATE ---
  const [products, setProducts] = useState([]); // Raw product list
  const [filteredProducts, setFilteredProducts] = useState({}); // Categorized & Filtered list
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = ["All", "Peptides", "Peptide Blends", "Mixing Solution"];

  // --- FETCH DATA ---
  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    const { data, error } = await supabase
      .from("products")
      .select(`*, variants (*)`)
      .order("name");

    if (!error && data) {
      setProducts(data);
    }
    setLoading(false);
  }

  // --- FILTERING LOGIC ---
  useEffect(() => {
    // 1. Filter by Search Query
    let result = products;

    if (searchQuery.trim() !== "") {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter((product) =>
        product.name.toLowerCase().includes(lowerQuery)
      );
    }

    // 2. Filter by Category Tab (if not "All")
    if (activeCategory !== "All") {
      result = result.filter((product) => product.category === activeCategory);
    }

    // 3. Group the results for display
    const grouped = result.reduce((acc, product) => {
      const cat = product.category || "Other";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(product);
      return acc;
    }, {});

    // Ensure specific order of categories
    const orderedGrouped = {};
    const order = ["Peptides", "Peptide Blends", "Mixing Solution"];

    order.forEach((cat) => {
      if (grouped[cat]) orderedGrouped[cat] = grouped[cat];
    });

    setFilteredProducts(orderedGrouped);
  }, [products, searchQuery, activeCategory]);

  // --- RENDER ---
  return (
    <div className="page-wrapper">
      {/* HERO SECTION */}
      <div
        style={{
          backgroundColor: "#0f172a",
          color: "white",
          padding: "80px 20px",
          textAlign: "center",
          marginBottom: "40px",
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
            Verified purity. Third-party tested. Secure shipping.
          </p>
        </div>
      </div>

      {/* SEARCH & FILTER BAR */}
      <div className="container" style={{ marginBottom: "60px" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            alignItems: "center",
            maxWidth: "800px",
            margin: "0 auto",
          }}
        >
          {/* Search Input */}
          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "500px",
            }}
          >
            <Search
              size={20}
              color="#64748b"
              style={{
                position: "absolute",
                left: "16px",
                top: "50%",
                transform: "translateY(-50%)",
              }}
            />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "16px 16px 16px 48px",
                borderRadius: "50px",
                border: "1px solid #e2e8f0",
                fontSize: "1rem",
                outline: "none",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
              }}
            />
          </div>

          {/* Category Tabs */}
          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: "8px 24px",
                  borderRadius: "50px",
                  border:
                    activeCategory === cat
                      ? "2px solid var(--primary)"
                      : "1px solid #e2e8f0",
                  backgroundColor:
                    activeCategory === cat ? "var(--primary-light)" : "white",
                  color:
                    activeCategory === cat
                      ? "var(--primary)"
                      : "var(--text-muted)",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* RESULTS GRID */}
      <div className="container" style={{ paddingBottom: "80px" }}>
        {loading && (
          <p style={{ textAlign: "center", fontSize: "1.2rem" }}>
            Loading inventory...
          </p>
        )}

        {/* Empty State */}
        {!loading && Object.keys(filteredProducts).length === 0 && (
          <p
            style={{
              textAlign: "center",
              color: "var(--text-muted)",
              fontSize: "1.2rem",
            }}
          >
            No products found matching "{searchQuery}"
          </p>
        )}

        {/* Categories */}
        {!loading &&
          Object.keys(filteredProducts).map((categoryName) => (
            <section key={categoryName} style={{ marginBottom: "80px" }}>
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

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: "32px",
                }}
              >
                {filteredProducts[categoryName].map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          ))}
      </div>
    </div>
  );
}
