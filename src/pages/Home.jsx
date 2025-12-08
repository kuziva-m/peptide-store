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
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "40px 20px" }}>
      {/* 1. Header Section - Matches "SHOP" style */}
      <header style={{ marginBottom: "60px", textAlign: "center" }}>
        <h1
          style={{
            color: "#111",
            fontSize: "2.5rem",
            fontWeight: "900",
            textTransform: "uppercase",
            letterSpacing: "2px",
            margin: "0",
          }}
        >
          Shop
        </h1>
        {/* Blue Underline */}
        <div
          style={{
            width: "60px",
            height: "4px",
            background: "#0ea5e9",
            margin: "20px auto",
          }}
        ></div>
      </header>

      {loading && <p style={{ textAlign: "center" }}>Loading inventory...</p>}

      {/* 2. Grid - Centers items even if there is only one */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "40px",
          justifyContent: "center",
        }}
      >
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
