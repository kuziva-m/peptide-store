import { useEffect, useState, useMemo } from "react";
import { supabase } from "../lib/supabase";
import ProductCard from "../components/ProductCard";
import "./Home.css";

// Note: searchQuery and setSearchQuery are now received from App.jsx
export default function Home({ searchQuery, setSearchQuery }) {
  // --- STATE ---
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Only category filter remains local
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = ["All", "Peptides", "Peptide Blends", "Mixing Solution"];

  // --- FETCH DATA ---
  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const { data, error } = await supabase
        .from("products")
        .select(`*, variants (*)`)
        .order("name");

      if (error) throw error;
      if (data) setProducts(data);
    } catch (error) {
      console.error("Error fetching:", error);
    } finally {
      setLoading(false);
    }
  }

  // --- MEMOIZED FILTERING (Now uses passed searchQuery) ---
  const filteredGroupedProducts = useMemo(() => {
    // 1. Filter
    let result = products;

    if (searchQuery.trim() !== "") {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter((product) =>
        product.name.toLowerCase().includes(lowerQuery)
      );
    }

    if (activeCategory !== "All") {
      result = result.filter((product) => product.category === activeCategory);
    }

    // 2. Group
    const grouped = result.reduce((acc, product) => {
      const cat = product.category || "Other";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(product);
      return acc;
    }, {});

    // 3. Sort Keys
    const orderedGrouped = {};
    const order = ["Peptides", "Peptide Blends", "Mixing Solution"];

    // Add known categories first
    order.forEach((cat) => {
      if (grouped[cat]) orderedGrouped[cat] = grouped[cat];
    });

    // Add any others found
    Object.keys(grouped).forEach((cat) => {
      if (!order.includes(cat)) orderedGrouped[cat] = grouped[cat];
    });

    return orderedGrouped;
  }, [products, searchQuery, activeCategory]); // Dependency on searchQuery is essential

  return (
    <div className="page-wrapper">
      {/* HERO SECTION */}
      <section className="hero-section">
        <div className="container">
          <h1 className="hero-title">Research Grade Peptides</h1>
          <p className="hero-subtitle">
            Verified purity. Third-party tested. Secure shipping.
          </p>
        </div>
      </section>

      {/* CATEGORY FILTER BAR (Removed Search Input) */}
      <div
        className="container search-container"
        style={{ paddingTop: "0", marginBottom: "70px" }}
      >
        {/* Category Tabs */}
        <div className="category-tabs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`tab-btn ${activeCategory === cat ? "active" : ""}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* RESULTS GRID */}
      <div className="container content-grid">
        {loading ? (
          // SKELETON LOADER
          <div className="products-grid">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <ProductCard key={n} loading={true} />
            ))}
          </div>
        ) : (
          <>
            {Object.keys(filteredGroupedProducts).length === 0 && (
              <div className="empty-state">
                <p>No products found matching "{searchQuery}"</p>
              </div>
            )}

            {Object.entries(filteredGroupedProducts).map(
              ([category, items]) => (
                <section key={category} className="category-section">
                  <h2 className="category-title">{category}</h2>
                  <div className="products-grid">
                    {items.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        loading={false}
                      />
                    ))}
                  </div>
                </section>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}
