import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Admin() {
  const [pin, setPin] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Peptides");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    if (pin === "1234") {
      // CHANGE THIS PIN!
      setIsAuthenticated(true);
    } else {
      alert("Wrong PIN");
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setLoading(true);

    // 1. Insert Product
    const { data: product, error } = await supabase
      .from("products")
      .insert([{ name, category, image_url: imageUrl }])
      .select()
      .single();

    if (error) {
      alert("Error adding product: " + error.message);
    } else {
      // 2. Insert Default Variant (Example)
      await supabase
        .from("variants")
        .insert([{ product_id: product.id, size_label: "10mg", price: 0 }]);

      alert("Product added! Now go to Supabase to add more sizes/prices.");
      setName("");
      setImageUrl("");
    }
    setLoading(false);
  };

  if (!isAuthenticated) {
    return (
      <div style={{ padding: "50px", textAlign: "center" }}>
        <h2>Admin Access</h2>
        <form onSubmit={handleLogin}>
          <input
            type="password"
            placeholder="Enter PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            style={{ padding: "10px", fontSize: "1rem" }}
          />
          <button style={{ padding: "10px 20px", marginLeft: "10px" }}>
            Login
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: "50px 0", maxWidth: "600px" }}>
      <h1>Add New Product</h1>

      <form
        onSubmit={handleAddProduct}
        style={{ display: "flex", flexDirection: "column", gap: "15px" }}
      >
        <div>
          <label style={{ display: "block", marginBottom: "5px" }}>
            Product Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{ width: "100%", padding: "10px" }}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "5px" }}>
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{ width: "100%", padding: "10px" }}
          >
            <option>Peptides</option>
            <option>Peptide Blends</option>
            <option>Mixing Solution</option>
          </select>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "5px" }}>
            Image URL
          </label>
          <input
            type="text"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://..."
            style={{ width: "100%", padding: "10px" }}
          />
        </div>

        <button
          disabled={loading}
          style={{
            padding: "15px",
            background: "var(--primary)",
            color: "white",
            border: "none",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          {loading ? "Adding..." : "Add Product"}
        </button>
      </form>

      <div
        style={{
          marginTop: "50px",
          padding: "20px",
          background: "#f1f5f9",
          borderRadius: "8px",
        }}
      >
        <h3>💡 Pro Tip</h3>
        <p>
          For full control (Deleting items, changing prices, adding multiple
          sizes), it is actually easier to use the{" "}
          <strong>Supabase Dashboard</strong> directly.
        </p>
        <a
          href="https://supabase.com/dashboard"
          target="_blank"
          style={{ color: "var(--primary)" }}
        >
          Go to Supabase &rarr;
        </a>
      </div>
    </div>
  );
}
