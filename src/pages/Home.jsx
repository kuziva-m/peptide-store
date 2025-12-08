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
    // This query says: "Get all products, and join the variants table to them"
    const { data, error } = await supabase.from("products").select(`
        *,
        variants (*)
      `);

    if (error) {
      console.error("Error fetching products:", error);
    } else {
      setProducts(data);
    }
    setLoading(false);
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
      {/* Header Section */}
      <header style={{ marginBottom: "3rem", textAlign: "center" }}>
        <h1
          style={{
            color: "var(--primary)",
            fontSize: "2.5rem",
            marginBottom: "0.5rem",
          }}
        >
          Peptide Store
        </h1>
        <p style={{ color: "var(--text-muted)" }}>Premium Research Solutions</p>
      </header>

      {/* Loading State */}
      {loading && <p style={{ textAlign: "center" }}>Loading inventory...</p>}

      {/* Product Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "2rem",
        }}
      >
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
