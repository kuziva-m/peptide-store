import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import ProductCard from "../components/ProductCard";
import SEO from "../components/SEO";
import {
  LayoutGrid,
  FlaskConical,
  Layers,
  BriefcaseMedical,
} from "lucide-react";
import "./Home.css";
import "./Shop.css";

export default function Shop({ searchQuery }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Initialize category from URL or default to "All"
  const [activeCategory, setActiveCategory] = useState(
    searchParams.get("category") || "All",
  );

  const categories = [
    { name: "All", icon: <LayoutGrid size={20} /> },
    { name: "Peptides", icon: <FlaskConical size={20} /> },
    { name: "Peptide Blends", icon: <Layers size={20} /> },
    { name: "Accessories", icon: <BriefcaseMedical size={20} /> },
  ];

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
        .select(`*, variants (*)`) // This will now fetch 'slug' column automatically
        .order("name");

      if (error) throw error;

      if (data) {
        // --- FILTER OUT HIDDEN VARIANTS ---
        const visibleProducts = data
          .map((product) => {
            const visibleVariants = (product.variants || []).filter(
              (v) => v.is_hidden !== true,
            );
            return { ...product, variants: visibleVariants };
          })
          .filter((product) => product.variants.length > 0);

        setProducts(visibleProducts);
      }
    } catch (error) {
      console.error("Error fetching:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredGroupedProducts = useMemo(() => {
    let result = products;

    if (searchQuery && searchQuery.trim() !== "") {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter((product) =>
        product.name.toLowerCase().includes(lowerQuery),
      );
    }

    if (activeCategory !== "All") {
      result = result.filter((product) => product.category === activeCategory);
    }

    const grouped = result.reduce((acc, product) => {
      const cat = product.category || "Other";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(product);
      return acc;
    }, {});

    const sortOrder = ["Peptides", "Peptide Blends", "Accessories"];

    const sortedGrouped = Object.entries(grouped).sort(([catA], [catB]) => {
      const indexA = sortOrder.indexOf(catA);
      const indexB = sortOrder.indexOf(catB);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return catA.localeCompare(catB);
    });

    sortedGrouped.forEach(([category, items]) => {
      if (category === "Accessories") {
        items.sort((a, b) => {
          const nameA = a.name.toLowerCase();
          const nameB = b.name.toLowerCase();
          const isWaterA = nameA.includes("water") || nameA.includes("mixing");
          const isWaterB = nameB.includes("water") || nameB.includes("mixing");
          if (isWaterA && !isWaterB) return -1;
          if (!isWaterA && isWaterB) return 1;
          return nameA.localeCompare(nameB);
        });
      }
    });

    return sortedGrouped;
  }, [products, searchQuery, activeCategory]);

  return (
    <div className="page-wrapper">
      {/* SEO UPDATE: High-intent metadata for Shop page */}
      <SEO
        title="Shop Peptides Australia | HPLC Tested 99% Purity"
        description="Browse our range of high-purity research peptides, blends, and mixing solutions. Stocked in Melbourne for fast express dispatch across Australia."
        url="https://melbournepeptides.com.au/shop"
      />

      <div className="container" style={{ padding: "40px 24px" }}>
        <h1
          style={{
            textAlign: "center",
            marginBottom: "10px",
            color: "var(--medical-navy)",
          }}
        >
          Shop Peptides
        </h1>
        <p
          style={{
            textAlign: "center",
            marginBottom: "40px",
            color: "var(--text-muted)",
          }}
        >
          High-purity compounds for laboratory use only.
        </p>

        <div className="category-tabs-container">
          <div className="category-tabs">
            {categories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(cat.name)}
                className={`tab-btn ${
                  activeCategory === cat.name ? "active" : ""
                }`}
                title={cat.name}
              >
                <span className="tab-icon">{cat.icon}</span>
                <span className="tab-text">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

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
                style={{
                  textAlign: "center",
                  color: "var(--text-muted)",
                  padding: "40px",
                }}
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

      <style>{`
        .category-tabs-container { margin-bottom: 50px; display: flex; justify-content: center; }
        .category-tabs { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; }
        .tab-btn { display: flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 50px; border: 1px solid #e2e8f0; background: white; color: #64748b; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .tab-btn.active { background: #0f172a; color: white; border-color: #0f172a; }
        @media (max-width: 600px) {
          .category-tabs-container { overflow-x: auto; justify-content: flex-start; padding-bottom: 10px; }
          .category-tabs { flex-wrap: nowrap; padding: 0 10px; }
          .tab-btn { flex-direction: column; justify-content: center; width: 60px; height: 60px; padding: 0; border-radius: 50%; flex-shrink: 0; }
          .tab-text { display: none; }
          .tab-icon { display: flex; }
        }
        @media (min-width: 601px) { .tab-icon { display: none; } }
      `}</style>
    </div>
  );
}
