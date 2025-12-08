import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import ProductCard from "../components/ProductCard";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    const { data, error } = await supabase
      .from("products")
      .select(`*, variants (*)`);
    if (!error) setProducts(data);
    setLoading(false);
  }

  return (
    <div className="page-wrapper">
      {/* HERO SECTION */}
      <div
        style={{
          backgroundColor: "var(--text-main)",
          color: "white",
          padding: "80px 20px",
          textAlign: "center",
          marginBottom: "60px",
        }}
      >
        <div className="container">
          <h1
            style={{
              fontSize: "3rem",
              fontWeight: "800",
              margin: "0 0 10px 0",
              letterSpacing: "-1px",
            }}
          >
            Research Grade Peptides
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "1.2rem", margin: 0 }}>
            Verified purity. Fast shipping. Laboratory tested.
          </p>
        </div>
      </div>

      {/* GRID SECTION */}
      <div className="container" style={{ paddingBottom: "80px" }}>
        {loading && <p style={{ textAlign: "center" }}>Loading inventory...</p>}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "30px",
          }}
        >
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}
