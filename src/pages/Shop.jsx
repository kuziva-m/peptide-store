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
import "./Shop.css"; // Removed Home.css to prevent style bleeding/duplication

export default function Shop({ searchQuery }) {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

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
    if (catFromUrl) setActiveCategory(catFromUrl);
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

      if (data) {
        const visibleProducts = data
          .map((product) => ({
            ...product,
            variants: (product.variants || []).filter(
              (v) => v.is_hidden !== true,
            ),
          }))
          .filter((product) => product.variants.length > 0);

        setProducts(visibleProducts);
      }
    } catch (err) {
      console.error("Error fetching shop products:", err);
    } finally {
      setLoading(false);
    }
  }

  const filteredGroupedProducts = useMemo(() => {
    let result = products;
    if (searchQuery?.trim()) {
      result = result.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }
    if (activeCategory !== "All") {
      result = result.filter((p) => p.category === activeCategory);
    }

    const grouped = result.reduce((acc, p) => {
      const cat = p.category || "Other";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(p);
      return acc;
    }, {});

    const sortOrder = ["Peptides", "Peptide Blends", "Accessories"];
    return Object.entries(grouped).sort(([catA], [catB]) => {
      const idxA = sortOrder.indexOf(catA);
      const idxB = sortOrder.indexOf(catB);
      return (idxA !== -1 ? idxA : 99) - (idxB !== -1 ? idxB : 99);
    });
  }, [products, searchQuery, activeCategory]);

  return (
    <div className="page-wrapper">
      {/* SEO FIX: Unique title and description specific to the Shop page */}
      <SEO
        title="Shop Peptides Australia | HPLC Tested 99% Purity"
        description="Browse our full catalog of research peptides including BPC-157, Semaglutide, and customized blends. All compounds are HPLC verified for identity and purity. Fast Australia-wide dispatch."
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
          Research Peptide Catalog
        </h1>

        {/* SEO FIX: Unique intro text to avoid "Duplicate Content" with Home page */}
        <div
          style={{
            textAlign: "center",
            maxWidth: "800px",
            margin: "0 auto 40px",
            color: "var(--text-muted)",
            lineHeight: "1.6",
          }}
        >
          <p>
            Welcome to the Melbourne Peptides laboratory supply shop. We provide
            the highest-grade research compounds for scientific investigation.
            Each vial in our catalog undergoes stringent HPLC testing to ensure
            a minimum purity of 99%. Explore our peptides, optimized blends, and
            essential research accessories.
          </p>
        </div>

        <div className="category-tabs-container">
          <div className="category-tabs">
            {categories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(cat.name)}
                className={`tab-btn ${activeCategory === cat.name ? "active" : ""}`}
              >
                <span className="tab-icon">{cat.icon}</span>
                <span className="tab-text">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="products-grid">
            {[1, 2, 3, 4].map((n) => (
              <ProductCard key={n} loading={true} />
            ))}
          </div>
        ) : (
          <div className="content-grid">
            {filteredGroupedProducts.length === 0 ? (
              <div
                className="empty-state"
                style={{ textAlign: "center", padding: "40px" }}
              >
                <p>No products found matching your criteria.</p>
              </div>
            ) : (
              filteredGroupedProducts.map(([category, items]) => (
                <section
                  key={category}
                  className="category-section"
                  style={{ marginBottom: "40px" }}
                >
                  <h2
                    className="category-title"
                    style={{
                      color: "var(--primary)",
                      borderBottom: "1px solid var(--border)",
                      paddingBottom: "10px",
                      marginBottom: "20px",
                    }}
                  >
                    {category}
                  </h2>
                  <div className="products-grid">
                    {items.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </section>
              ))
            )}
          </div>
        )}
      </div>

      <style>{`
        .category-tabs-container { margin-bottom: 50px; display: flex; justify-content: center; }
        .category-tabs { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; }
        .tab-btn { display: flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 50px; border: 1px solid #e2e8f0; background: white; color: #64748b; font-weight: 600; cursor: pointer; transition: 0.2s; }
        .tab-btn.active { background: #0f172a; color: white; border-color: #0f172a; }
        @media (max-width: 600px) {
          .category-tabs-container { overflow-x: auto; justify-content: flex-start; padding-bottom: 10px; }
          .category-tabs { flex-wrap: nowrap; padding: 0 10px; }
          .tab-btn { flex-direction: column; justify-content: center; width: 60px; height: 60px; border-radius: 50%; padding: 0; }
          .tab-text { display: none; }
        }
      `}</style>
    </div>
  );
}
