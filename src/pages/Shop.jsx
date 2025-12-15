import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom"; // <-- Import this
import { supabase } from "../lib/supabase";
import ProductCard from "../components/ProductCard";
import "./Home.css";
import "./Shop.css";

export default function Shop({ searchQuery }) {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Initialize category from URL or default to "All"
  const [activeCategory, setActiveCategory] = useState(
    searchParams.get("category") || "All"
  );

  const categories = ["All", "Peptides", "Peptide Blends", "Mixing Solution"];

  // Update active category if URL changes (e.g. clicking links in Navbar/Home while already on Shop)
  useEffect(() => {
    const catFromUrl = searchParams.get("category");
    if (catFromUrl) {
      setActiveCategory(catFromUrl);
    }
  }, [searchParams]);

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

  const filteredGroupedProducts = useMemo(() => {
    let result = products;

    // 1. Filter by Search
    if (searchQuery.trim() !== "") {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter((product) =>
        product.name.toLowerCase().includes(lowerQuery)
      );
    }

    // 2. Filter by Category Tab
    if (activeCategory !== "All") {
      result = result.filter((product) => product.category === activeCategory);
    }

    // 3. Group Items by Category
    const grouped = result.reduce((acc, product) => {
      const cat = product.category || "Other";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(product);
      return acc;
    }, {});

    // 4. Sort the Categories
    const sortOrder = ["Peptides", "Peptide Blends", "Mixing Solution"];

    const sortedGrouped = Object.entries(grouped).sort(([catA], [catB]) => {
      const indexA = sortOrder.indexOf(catA);
      const indexB = sortOrder.indexOf(catB);

      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return catA.localeCompare(catB);
    });

    return sortedGrouped;
  }, [products, searchQuery, activeCategory]);

  return (
    <div className="page-wrapper">
      <div className="container" style={{ padding: "40px 24px" }}>
        <h1
          style={{
            textAlign: "center",
            marginBottom: "10px",
            color: "var(--medical-navy)",
          }}
        >
          Shop Research Peptides
        </h1>
        <p
          style={{
            textAlign: "center",
            marginBottom: "40px",
            color: "var(--text-muted)",
          }}
        >
          High-purity compounds for laboratory research use only.
        </p>

        {/* CATEGORY TABS */}
        <div className="category-tabs" style={{ marginBottom: "50px" }}>
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

        {/* RESULTS */}
        {loading ? (
          <div className="products-grid">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <ProductCard key={n} loading={true} />
            ))}
          </div>
        ) : (
          <div className="content-grid">
            {filteredGroupedProducts.length === 0 && (
              <div
                className="empty-state"
                style={{ textAlign: "center", color: "var(--text-muted)" }}
              >
                <p>No products found matching "{searchQuery}"</p>
              </div>
            )}

            {filteredGroupedProducts.map(([category, items]) => (
              <section
                key={category}
                className="category-section"
                style={{ marginBottom: "40px" }}
              >
                <h2
                  className="category-title"
                  style={{
                    borderBottom: "1px solid var(--border)",
                    paddingBottom: "10px",
                    marginBottom: "20px",
                    color: "var(--primary)",
                  }}
                >
                  {category}
                </h2>
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
