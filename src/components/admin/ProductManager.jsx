import { useState, useEffect } from "react";
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
} from "lucide-react";

// --- UPDATED CATEGORIES LIST ---
const CATEGORIES = ["Peptides", "Peptide Blends", "Accessories"];
const STORAGE_BUCKET = "product-images";

export default function ProductManager() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedProductId, setExpandedProductId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
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
      .order("created_at", { ascending: false });

    if (data) setProducts(data);
    setLoading(false);
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm("Are you sure? This deletes the product and all variants."))
      return;
    await supabase.from("products").delete().eq("id", id);
    setProducts(products.filter((p) => p.id !== id));
  };

  const handleCreateProduct = async () => {
    if (!newProductName) return alert("Product Name is required");

    const { data, error } = await supabase
      .from("products")
      .insert({
        name: newProductName,
        category: newProductCategory,
        image_url: newProductImage,
        description: newProductDesc,
        in_stock: true,
      })
      .select()
      .single();

    if (error) {
      alert("Error creating product: " + error.message);
    } else {
      setProducts([data, ...products]);
      setIsAddingNew(false);
      setNewProductName("");
      setNewProductImage("");
      setNewProductDesc("");
      setExpandedProductId(data.id);
    }
  };

  // --- IMAGE UPLOAD LOGIC ---
  const handleImageUpload = async (file) => {
    if (!file) return;
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file);

    if (uploadError) {
      alert("Upload failed: " + uploadError.message);
      return null;
    }

    const { data } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      activeCategory === "All" || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div>
      <div style={styles.header}>
        <h2 style={{ margin: 0, color: "var(--medical-navy)" }}>Products</h2>
        <button
          onClick={() => setIsAddingNew(!isAddingNew)}
          style={styles.addBtn}
        >
          <Plus size={18} /> Add New Product
        </button>
      </div>

      {/* FILTERS */}
      <div style={styles.controls}>
        <div style={styles.searchBox}>
          <Search size={18} color="#94a3b8" />
          <input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        <select
          value={activeCategory}
          onChange={(e) => setActiveCategory(e.target.value)}
          style={styles.categorySelect}
        >
          <option value="All">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* ADD NEW FORM */}
      {isAddingNew && (
        <div style={styles.newForm}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <h3>Create New Product</h3>
            <button
              onClick={() => setIsAddingNew(false)}
              style={styles.iconBtn}
            >
              <X size={20} />
            </button>
          </div>
          <div style={styles.formGrid}>
            <div>
              <label style={styles.label}>Product Name</label>
              <input
                style={styles.input}
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
                placeholder="e.g. BPC-157"
              />
            </div>
            <div>
              <label style={styles.label}>Category</label>
              <select
                style={styles.input}
                value={newProductCategory}
                onChange={(e) => setNewProductCategory(e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <label style={styles.label}>Description</label>
              <textarea
                style={{ ...styles.input, height: "80px" }}
                value={newProductDesc}
                onChange={(e) => setNewProductDesc(e.target.value)}
                placeholder="Short description for SEO and product page..."
              />
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <label style={styles.label}>Image</label>
              <div
                style={{ display: "flex", gap: "10px", alignItems: "center" }}
              >
                <input
                  style={{ ...styles.input, flex: 1 }}
                  value={newProductImage}
                  onChange={(e) => setNewProductImage(e.target.value)}
                  placeholder="Paste URL or upload..."
                />
                <label style={styles.uploadBtn}>
                  <Upload size={16} /> Upload
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={async (e) => {
                      const url = await handleImageUpload(e.target.files[0]);
                      if (url) setNewProductImage(url);
                    }}
                  />
                </label>
              </div>
              {newProductImage && (
                <img
                  src={newProductImage}
                  alt="Preview"
                  style={{
                    height: "60px",
                    marginTop: "10px",
                    borderRadius: "6px",
                    border: "1px solid #e2e8f0",
                  }}
                />
              )}
            </div>
          </div>
          <button onClick={handleCreateProduct} style={styles.saveBtn}>
            Create Product
          </button>
        </div>
      )}

      {/* PRODUCT LIST */}
      {loading ? (
        <div style={{ padding: "40px", textAlign: "center" }}>
          <Loader className="spin-anim" />
        </div>
      ) : (
        <div style={styles.list}>
          {filteredProducts.map((product) => (
            <ProductRow
              key={product.id}
              product={product}
              isExpanded={expandedProductId === product.id}
              onToggle={() =>
                setExpandedProductId(
                  expandedProductId === product.id ? null : product.id,
                )
              }
              onDelete={() => handleDeleteProduct(product.id)}
              handleImageUpload={handleImageUpload}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// --- SUB-COMPONENT: Product Row ---
function ProductRow({
  product,
  isExpanded,
  onToggle,
  onDelete,
  handleImageUpload,
}) {
  const [variants, setVariants] = useState(product.variants || []);

  const addVariant = async () => {
    const { data } = await supabase
      .from("variants")
      .insert({
        product_id: product.id,
        size_label: "10 Pack",
        price: 10,
      })
      .select()
      .single();
    if (data) setVariants([...variants, data]);
  };

  const updateVariant = async (id, field, value) => {
    setVariants(
      variants.map((v) => (v.id === id ? { ...v, [field]: value } : v)),
    );
    await supabase
      .from("variants")
      .update({ [field]: value })
      .eq("id", id);
  };

  const deleteVariant = async (id) => {
    setVariants(variants.filter((v) => v.id !== id));
    await supabase.from("variants").delete().eq("id", id);
  };

  const updateProduct = async (field, value) => {
    await supabase
      .from("products")
      .update({ [field]: value })
      .eq("id", product.id);
  };

  return (
    <div style={styles.productCard}>
      <div style={styles.productHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <div style={styles.imgThumbnail}>
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                style={styles.img}
              />
            ) : (
              <ImageIcon size={20} color="#cbd5e1" />
            )}
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: "1rem" }}>{product.name}</h4>
            <span style={styles.badge}>{product.category}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={onToggle} style={styles.iconBtn}>
            {isExpanded ? <ChevronUp size={20} /> : <Edit2 size={20} />}
          </button>
          <button
            onClick={onDelete}
            style={{ ...styles.iconBtn, color: "#ef4444" }}
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      {/* EXPANDED EDIT MODE */}
      {isExpanded && (
        <div style={styles.expandedPanel}>
          <div style={{ marginBottom: "20px", display: "grid", gap: "15px" }}>
            <div>
              <label style={styles.label}>Product Name</label>
              <input
                defaultValue={product.name}
                onBlur={(e) => updateProduct("name", e.target.value)}
                style={styles.input}
              />
            </div>
            <div>
              <label style={styles.label}>Main Image URL</label>
              <div style={{ display: "flex", gap: "10px" }}>
                <input
                  defaultValue={product.image_url}
                  onBlur={(e) => updateProduct("image_url", e.target.value)}
                  style={styles.input}
                />
                <label style={styles.uploadBtnSmall}>
                  Up
                  <input
                    type="file"
                    hidden
                    onChange={async (e) => {
                      const url = await handleImageUpload(e.target.files[0]);
                      if (url) {
                        updateProduct("image_url", url);
                        window.location.reload();
                      }
                    }}
                  />
                </label>
              </div>
            </div>
          </div>

          <h5 style={{ margin: "0 0 10px 0", color: "#64748b" }}>VARIANTS</h5>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "80px 80px 1fr 1fr 30px", // Adjusted columns
                gap: "10px",
                paddingLeft: "10px",
              }}
            >
              <small>Size</small>
              <small>Price ($)</small>
              <small>Image URL</small>
              <small>Upload</small>
              <small></small>
            </div>
            {variants.map((v) => (
              <VariantRow
                key={v.id}
                data={v}
                update={updateVariant}
                onDelete={() => deleteVariant(v.id)}
                handleImageUpload={handleImageUpload} // Passed function
              />
            ))}
            <button onClick={addVariant} style={styles.addVariantBtn}>
              <Plus size={16} /> Add Variant
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function VariantRow({ data, update, onDelete, handleImageUpload }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "80px 80px 1fr 1fr 30px", // Adjusted grid
        gap: "10px",
        alignItems: "center",
      }}
    >
      <input
        value={data.size_label}
        onChange={(e) => update(data.id, "size_label", e.target.value)}
        style={styles.inputSmall}
        placeholder="Size"
      />
      <input
        type="number"
        value={data.price}
        onChange={(e) => update(data.id, "price", e.target.value)}
        style={styles.inputSmall}
        placeholder="$$"
      />
      {/* Variant Image URL Input */}
      <input
        value={data.image_url || ""}
        onChange={(e) => update(data.id, "image_url", e.target.value)}
        style={styles.inputSmall}
        placeholder="Image URL"
      />
      {/* Variant Upload Button */}
      <label style={styles.uploadBtnSmall}>
        <Upload size={14} style={{ marginRight: 4 }} />
        <span style={{ fontSize: "0.75rem" }}>Upload</span>
        <input
          type="file"
          hidden
          onChange={async (e) => {
            const url = await handleImageUpload(e.target.files[0]);
            if (url) {
              update(data.id, "image_url", url);
            }
          }}
        />
      </label>

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

// --- STYLES ---
const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  addBtn: {
    background: "var(--primary)",
    color: "white",
    border: "none",
    padding: "10px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontWeight: "600",
  },
  controls: { display: "flex", gap: "15px", marginBottom: "20px" },
  searchBox: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "white",
    padding: "10px 15px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
  },
  searchInput: {
    border: "none",
    outline: "none",
    width: "100%",
    fontSize: "0.95rem",
  },
  categorySelect: {
    padding: "0 20px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    background: "white",
    cursor: "pointer",
  },
  newForm: {
    background: "white",
    padding: "20px",
    borderRadius: "12px",
    marginBottom: "30px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
    margin: "20px 0",
  },
  label: {
    display: "block",
    fontSize: "0.85rem",
    fontWeight: "600",
    color: "#64748b",
    marginBottom: "6px",
  },
  input: {
    width: "100%",
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
  },
  uploadBtn: {
    background: "#f1f5f9",
    padding: "10px 20px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "600",
    color: "#475569",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    whiteSpace: "nowrap",
  },
  saveBtn: {
    background: "var(--medical-navy)",
    color: "white",
    border: "none",
    padding: "12px 24px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    width: "100%",
  },
  list: { display: "flex", flexDirection: "column", gap: "15px" },
  productCard: {
    background: "white",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    overflow: "hidden",
  },
  productHeader: {
    padding: "15px 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  imgThumbnail: {
    width: "50px",
    height: "50px",
    background: "#f8fafc",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  img: { width: "100%", height: "100%", objectFit: "cover" },
  badge: {
    background: "#f1f5f9",
    color: "#64748b",
    padding: "2px 8px",
    borderRadius: "4px",
    fontSize: "0.75rem",
    marginTop: "4px",
    display: "inline-block",
  },
  iconBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "8px",
    color: "#64748b",
  },
  expandedPanel: {
    background: "#f8fafc",
    borderTop: "1px solid #e2e8f0",
    padding: "20px",
  },
  inputSmall: {
    width: "100%",
    padding: "8px",
    borderRadius: "4px",
    border: "1px solid #cbd5e1",
    fontSize: "0.9rem",
  },
  addVariantBtn: {
    background: "white",
    border: "1px dashed #cbd5e1",
    color: "var(--primary)",
    padding: "8px",
    borderRadius: "6px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    fontWeight: "600",
    marginTop: "10px",
  },
  uploadBtnSmall: {
    background: "#e2e8f0",
    padding: "0 12px",
    borderRadius: "6px",
    fontSize: "0.8rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    fontWeight: "600",
    height: "35px",
  },
};
