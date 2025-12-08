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
    // 1. We added 'minHeight' so the footer doesn't float up
    // 2. We kept 'margin: 0 auto' to center the whole block
    <div
      style={{
        maxWidth: "1400px",
        margin: "0 auto",
        padding: "40px 20px",
        minHeight: "100vh",
        width: "100%",
      }}
    >
      {/* Header Section */}
      <header style={{ marginBottom: "50px", textAlign: "center" }}>
        <h1
          style={{
            color: "#111",
            fontSize: "2.5rem",
            fontWeight: "800",
            textTransform: "uppercase",
            marginBottom: "10px",
          }}
        >
          Shop
        </h1>
        {/* The Blue Line Under "SHOP" */}
        <div
          style={{
            width: "80px",
            height: "4px",
            background: "#0ea5e9",
            margin: "0 auto" /* This centers the blue line */,
          }}
        ></div>
      </header>

      {/* Product Grid */}
      {/* Once you add 3 more products, this empty space will disappear! */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "30px",
          justifyContent:
            "center" /* Optional: Centers the grid items if only a few exist */,
        }}
      >
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
