import { useState, useEffect, useMemo } from "react";
import { supabase } from "../../lib/supabase";
import {
  Trash2,
  Edit2,
  Plus,
  X,
  ChevronUp,
  Search,
  Image as ImageIcon,
  Upload,
  Loader,
  Camera,
  FileText,
} from "lucide-react";

const CATEGORIES = ["Peptides", "Peptide Blends", "Mixing Solution"];
const STORAGE_BUCKET = "product-images";

export default function ProductManager() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedProductId, setExpandedProductId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  // New Product Form
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [newProductCategory, setNewProductCategory] = useState("Peptides");
  const [newProductImage, setNewProductImage] = useState("");
  const [newProductDesc, setNewProductDesc] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select(`*, variants (*)`)
      .order("id", { ascending: false });

    if (error) console.error("Error:", error);
    else setProducts(data || []);
    setLoading(false);
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { data: product, error } = await supabase
      .from("products")
      .insert([
        {
          name: newProductName,
          category: newProductCategory,
          image_url: newProductImage,
          description: newProductDesc || "No description.",
          in_stock: true,
        },
      ])
      .select()
      .single();

    if (error) {
      alert(error.message);
    } else {
      await supabase
        .from("variants")
        .insert([{ product_id: product.id, size_label: "5mg", price: 0 }]);
      setNewProductName("");
      setIsAddingNew(false);
      fetchProducts();
    }
    setLoading(false);
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    await supabase.from("products").delete().eq("id", id);
    fetchProducts();
  };

  const filteredProducts = useMemo(() => {
    let result = products;
    if (searchQuery)
      result = result.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    if (activeCategory !== "All")
      result = result.filter((p) => p.category === activeCategory);
    return result;
  }, [products, searchQuery, activeCategory]);

  return (
    <div>
      {/* HEADER ACTIONS */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <div style={{ display: "flex", gap: "10px" }}>
          {["All", ...CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: "6px 12px",
                borderRadius: "20px",
                border: "1px solid #e2e8f0",
                background:
                  activeCategory === cat ? "var(--medical-navy)" : "white",
                color: activeCategory === cat ? "white" : "#64748b",
                cursor: "pointer",
              }}
            >
              {cat}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: "8px",
              borderRadius: "6px",
              border: "1px solid #e2e8f0",
            }}
          />
          <button
            onClick={() => setIsAddingNew(!isAddingNew)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "var(--primary)",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            {isAddingNew ? <X size={16} /> : <Plus size={16} />}{" "}
            {isAddingNew ? "Cancel" : "New Item"}
          </button>
        </div>
      </div>

      {/* CREATE FORM */}
      {isAddingNew && (
        <form
          onSubmit={handleCreateProduct}
          style={{
            background: "#f8fafc",
            padding: "20px",
            borderRadius: "12px",
            marginBottom: "20px",
            border: "1px solid #e2e8f0",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
              marginBottom: "16px",
            }}
          >
            <input
              placeholder="Product Name"
              value={newProductName}
              onChange={(e) => setNewProductName(e.target.value)}
              required
              style={styles.input}
            />
            <select
              value={newProductCategory}
              onChange={(e) => setNewProductCategory(e.target.value)}
              style={styles.input}
            >
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <button style={styles.saveBtn} disabled={loading}>
            {loading ? "Saving..." : "Create Product"}
          </button>
        </form>
      )}

      {/* LIST */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {filteredProducts.map((product) => (
          <ProductRow
            key={product.id}
            product={product}
            expanded={expandedProductId === product.id}
            onToggle={() =>
              setExpandedProductId(
                expandedProductId === product.id ? null : product.id
              )
            }
            onRefresh={fetchProducts}
            onDelete={() => handleDeleteProduct(product.id)}
          />
        ))}
      </div>
    </div>
  );
}

// SUB-COMPONENT: Individual Product Row
function ProductRow({ product, expanded, onToggle, onRefresh, onDelete }) {
  const [form, setForm] = useState({ ...product });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await supabase
      .from("products")
      .update({
        name: form.name,
        category: form.category,
        description: form.description,
        in_stock: form.in_stock,
      })
      .eq("id", product.id);
    setSaving(false);
    onRefresh();
  };

  // Helper for uploading logic (Simplified for brevity, similar to original)
  const handleUpload = async (e, bucket, field) => {
    const file = e.target.files[0];
    if (!file) return;
    const path = `${product.id}_${Date.now()}`;
    const { data } = await supabase.storage.from(bucket).upload(path, file);
    if (data) {
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(data.path);
      await supabase
        .from("products")
        .update({ [field]: publicUrl })
        .eq("id", product.id);
      onRefresh();
    }
  };

  return (
    <div
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
        background: "white",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "12px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: expanded ? "#f8fafc" : "white",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <img
            src={product.image_url}
            style={{
              width: 40,
              height: 40,
              objectFit: "contain",
              borderRadius: 4,
              background: "#fff",
            }}
          />
          <div>
            <div style={{ fontWeight: "600" }}>{product.name}</div>
            <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
              {product.variants?.length} Variants •{" "}
              {product.in_stock ? "In Stock" : "OOS"}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={onToggle} style={styles.iconBtn}>
            {expanded ? <ChevronUp size={18} /> : <Edit2 size={18} />}
          </button>
          <button
            onClick={onDelete}
            style={{ ...styles.iconBtn, color: "#ef4444" }}
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: "20px", borderTop: "1px solid #e2e8f0" }}>
          {/* EDIT FIELDS */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
              marginBottom: "16px",
            }}
          >
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              style={styles.input}
            />
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              style={styles.input}
            >
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              style={{ ...styles.input, gridColumn: "1/-1" }}
              rows={3}
            />
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={form.in_stock}
                onChange={(e) =>
                  setForm({ ...form, in_stock: e.target.checked })
                }
              />
              In Stock
            </label>
            <button
              onClick={handleSave}
              disabled={saving}
              style={styles.saveBtn}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>

          {/* VARIANTS (Simplified View) */}
          <h4
            style={{
              marginBottom: "10px",
              color: "#64748b",
              fontSize: "0.9rem",
            }}
          >
            VARIANTS
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {product.variants?.map((v) => (
              <VariantRow
                key={v.id}
                variant={v}
                onDelete={() => {
                  if (confirm("Delete variant?"))
                    supabase
                      .from("variants")
                      .delete()
                      .eq("id", v.id)
                      .then(onRefresh);
                }}
              />
            ))}
            <button
              onClick={async () => {
                await supabase
                  .from("variants")
                  .insert([
                    { product_id: product.id, size_label: "New", price: 0 },
                  ]);
                onRefresh();
              }}
              style={{
                ...styles.iconBtn,
                width: "100%",
                textAlign: "center",
                background: "#f1f5f9",
              }}
            >
              + Add Variant
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function VariantRow({ variant, onDelete }) {
  const [data, setData] = useState(variant);

  const update = async (field, val) => {
    setData({ ...data, [field]: val });
    await supabase
      .from("variants")
      .update({ [field]: val })
      .eq("id", variant.id);
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "80px 80px 1fr 30px",
        gap: "10px",
        alignItems: "center",
      }}
    >
      <input
        value={data.size_label}
        onChange={(e) => update("size_label", e.target.value)}
        style={styles.inputSmall}
      />
      <input
        type="number"
        value={data.price}
        onChange={(e) => update("price", e.target.value)}
        style={styles.inputSmall}
      />
      <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Auto-saves</div>
      <button
        onClick={onDelete}
        style={{
          color: "#ef4444",
          background: "none",
          border: "none",
          cursor: "pointer",
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
}

const styles = {
  input: {
    width: "100%",
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
  },
  inputSmall: {
    width: "100%",
    padding: "6px",
    borderRadius: "4px",
    border: "1px solid #cbd5e1",
    fontSize: "0.9rem",
  },
  saveBtn: {
    background: "var(--clinical-teal)",
    color: "white",
    border: "none",
    padding: "10px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  iconBtn: {
    padding: "8px",
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
    background: "white",
    cursor: "pointer",
  },
};
