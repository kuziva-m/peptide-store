import { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabase";
import {
  Trash2,
  Edit2,
  Plus,
  Save,
  X,
  ChevronUp,
  Search,
  Image as ImageIcon,
  Upload,
  Loader,
} from "lucide-react";

const CATEGORIES = ["Peptides", "Peptide Blends", "Mixing Solution"];
// NOTE: Set your Supabase Storage Bucket name here
const STORAGE_BUCKET = "product-images";

export default function Admin() {
  // --- AUTH STATE ---
  const [pin, setPin] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // --- DATA STATE ---
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedProductId, setExpandedProductId] = useState(null);

  // --- FILTERING STATE ---
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  // --- NEW PRODUCT FORM STATE ---
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [newProductCategory, setNewProductCategory] = useState("Peptides");
  const [newProductImage, setNewProductImage] = useState("");

  // --- INITIAL LOAD ---
  useEffect(() => {
    if (isAuthenticated) {
      fetchProducts();
    }
  }, [isAuthenticated]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (pin === "1234") {
      // CHANGE THIS FOR PRODUCTION
      setIsAuthenticated(true);
    } else {
      alert("Invalid PIN");
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select(`*, variants (*)`)
      .order("id", { ascending: false });

    if (error) console.error("Error fetching products:", error);
    else setProducts(data || []);
    setLoading(false);
  };

  // --- FILTERING LOGIC ---
  const filteredProducts = useMemo(() => {
    let result = products;

    if (searchQuery.trim() !== "") {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(lowerQuery));
    }

    if (activeCategory !== "All") {
      result = result.filter((p) => p.category === activeCategory);
    }

    return result;
  }, [products, searchQuery, activeCategory]);

  // --- ACTIONS: PRODUCT ---

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setLoading(true);

    // If using the manual URL field
    let finalImageUrl = newProductImage;

    // 1. Create Product
    const { data: product, error } = await supabase
      .from("products")
      .insert([
        {
          name: newProductName,
          category: newProductCategory,
          image_url: finalImageUrl,
        },
      ])
      .select()
      .single();

    if (error) {
      alert("Error adding product: " + error.message);
    } else {
      // 2. Create Default Variant
      await supabase
        .from("variants")
        .insert([{ product_id: product.id, size_label: "5mg", price: 0 }]);

      // Reset & Refresh
      setNewProductName("");
      setNewProductImage("");
      setIsAddingNew(false);
      fetchProducts();
    }
    setLoading(false);
  };

  const handleDeleteProduct = async (id) => {
    if (
      !window.confirm(
        "Are you sure? This will delete the product and ALL variants."
      )
    )
      return;

    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) alert(error.message);
    else fetchProducts();
  };

  // --- SUB-COMPONENT: SIDEBAR ---
  const Sidebar = () => (
    <div style={styles.sidebar}>
      <h3 style={styles.sidebarTitle}>Admin Filters</h3>

      {/* Category Pills */}
      <div style={styles.filterGroup}>
        <h4>Category</h4>
        <div style={styles.filterList}>
          {["All", ...CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                ...styles.filterPill,
                ...(activeCategory === cat ? styles.filterPillActive : {}),
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Placeholder for future filters (as seen in mockup) */}
      <div style={styles.filterGroup}>
        <h4>Status</h4>
        <div style={styles.filterList}>
          <button style={styles.filterPill}>In Stock</button>
          <button style={styles.filterPill}>Low Stock</button>
        </div>
      </div>
    </div>
  );

  // --- RENDER ---

  if (!isAuthenticated) {
    return (
      <div style={styles.authContainer}>
        <div style={styles.authBox}>
          <h2 style={{ marginBottom: "20px", color: "var(--medical-navy)" }}>
            Admin Access
          </h2>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              placeholder="Enter PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              style={styles.input}
              autoFocus
            />
            <button style={styles.primaryBtn}>Enter Dashboard</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={styles.dashboardLayout}>
      <Sidebar />

      {/* MAIN CONTENT AREA */}
      <div style={styles.mainContent}>
        {/* DASHBOARD HEADER & SEARCH */}
        <div style={styles.contentHeader}>
          <h1>Inventory Manager</h1>
          <div style={styles.searchContainer}>
            <Search size={18} style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search products by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
          </div>
          <button
            style={isAddingNew ? styles.cancelBtn : styles.primaryBtn}
            onClick={() => {
              setIsAddingNew(!isAddingNew);
              setExpandedProductId(null);
            }}
          >
            {isAddingNew ? (
              <>
                <X size={18} /> Cancel
              </>
            ) : (
              <>
                <Plus size={18} /> Add Product
              </>
            )}
          </button>
        </div>

        {/* ADD NEW FORM */}
        {isAddingNew && (
          <div style={styles.addFormCard}>
            <h3>New Product Details</h3>
            <form onSubmit={handleCreateProduct} style={styles.formGrid}>
              <div>
                <label style={styles.label}>Product Name</label>
                <input
                  style={styles.input}
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  placeholder="e.g. BPC-157"
                  required
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
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={styles.label}>Image URL (Manual)</label>
                <input
                  style={styles.input}
                  value={newProductImage}
                  onChange={(e) => setNewProductImage(e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <button
                style={{ ...styles.saveBtn, gridColumn: "1 / -1" }}
                disabled={loading}
              >
                {loading ? "Creating..." : "Create Product"}
              </button>
            </form>
          </div>
        )}

        {/* PRODUCT LIST */}
        {loading && !isAddingNew ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <p>Loading Inventory...</p>
          </div>
        ) : (
          <div style={styles.listContainer}>
            {filteredProducts.length === 0 ? (
              <p style={{ padding: "20px", color: "var(--text-muted)" }}>
                No products match your criteria. Try adjusting the filter or
                search term.
              </p>
            ) : (
              filteredProducts.map((product) => (
                <ProductEditor
                  key={product.id}
                  product={product}
                  isExpanded={expandedProductId === product.id}
                  onToggle={() =>
                    setExpandedProductId(
                      expandedProductId === product.id ? null : product.id
                    )
                  }
                  onRefresh={fetchProducts}
                  onDelete={() => handleDeleteProduct(product.id)}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// --- SUB-COMPONENT: INDIVIDUAL PRODUCT EDITOR ---

function ProductEditor({ product, isExpanded, onToggle, onRefresh, onDelete }) {
  const [name, setName] = useState(product.name);
  const [category, setCategory] = useState(product.category);
  const [image, setImage] = useState(product.image_url);
  const [variants, setVariants] = useState(product.variants || []);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Sync local state when the product prop changes
  useEffect(() => {
    // Only re-sync if the component is NOT currently in an editing/uploading state
    // and if the prop data is different.
    if (!isUploading && !isSaving) {
      setName(product.name);
      setCategory(product.category);
      setImage(product.image_url);
      setVariants(product.variants || []);
    }
  }, [product, isUploading, isSaving]);

  // --- CORE UPDATE FUNCTION (Auto-Save on Blur) ---
  const handleUpdateProduct = async () => {
    // Check if any fields were actually changed
    if (
      name === product.name &&
      category === product.category &&
      image === product.image_url
    ) {
      return;
    }

    setIsSaving(true);

    const { error } = await supabase
      .from("products")
      .update({ name, category, image_url: image })
      .eq("id", product.id);

    if (error) alert("Failed to update product details: " + error.message);
    else onRefresh(); // Force refresh the main list to update state globally

    setIsSaving(false);
  };

  // --- FIXED: HANDLE FILE UPLOAD (Automatic Save) ---
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const fileName = `${product.id}_${Date.now()}_${file.name}`;

    try {
      // 1. Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true, // Use upsert to handle case where we might upload an image with the same name
        });

      if (uploadError) throw uploadError;

      // 2. Get the public URL
      const { data: publicUrlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(uploadData.path);

      const newImageUrl = publicUrlData.publicUrl;

      // 3. Update the database record with the new URL (Automatic Save)
      const { error: dbError } = await supabase
        .from("products")
        .update({ image_url: newImageUrl }) // <-- This now passes RLS
        .eq("id", product.id);

      if (dbError) throw dbError;

      // 4. Update local state for immediate preview/feedback (This should stop the visual flicker)
      setImage(newImageUrl);

      // 5. Force parent Admin component to refetch and re-render everything
      onRefresh();
    } catch (error) {
      alert("Image update failed: " + error.message);
      console.error("Image Upload/DB Update Error:", error);
    } finally {
      setIsUploading(false);
      // Clear the file input element
      event.target.value = null;
    }
  };

  const handleUpdateVariant = async (variantId, field, value) => {
    // Optimistic UI update
    const updatedVariants = variants.map((v) =>
      v.id === variantId ? { ...v, [field]: value } : v
    );
    setVariants(updatedVariants);

    // DB Update
    await supabase
      .from("variants")
      .update({ [field]: value })
      .eq("id", variantId);
    onRefresh();
  };

  const handleAddVariant = async () => {
    const { data, error } = await supabase
      .from("variants")
      .insert([{ product_id: product.id, size_label: "New Size", price: 0 }])
      .select()
      .single();

    if (data) setVariants([...variants, data]);
  };

  const handleDeleteVariant = async (variantId) => {
    if (!window.confirm("Delete this variant?")) return;

    setVariants(variants.filter((v) => v.id !== variantId));
    await supabase.from("variants").delete().eq("id", variantId);
    onRefresh();
  };

  return (
    <div style={styles.itemCard}>
      {/* CARD HEADER (Always Visible) */}
      <div style={styles.itemHeader}>
        <div style={styles.itemInfo}>
          <div style={styles.imgThumb}>
            {product.image_url ? (
              <img src={product.image_url} alt="" style={styles.thumbImage} />
            ) : (
              <ImageIcon size={20} color="#ccc" />
            )}
          </div>
          <div>
            <h3 style={styles.itemName}>{product.name}</h3>
            <span style={styles.itemCategory}>{product.category}</span>
          </div>
        </div>

        <div style={styles.actions}>
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

      {/* EXPANDED EDITING AREA */}
      {isExpanded && (
        <div style={styles.editorBody}>
          <div style={styles.formGrid}>
            <div>
              <label style={styles.label}>Product Name</label>
              <input
                style={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={handleUpdateProduct}
                disabled={isSaving}
              />
            </div>
            <div>
              <label style={styles.label}>Category</label>
              <select
                style={styles.input}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                onBlur={handleUpdateProduct}
                disabled={isSaving}
              >
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* IMAGE UPLOAD & URL SECTION */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={styles.label}>Image Source</label>
              <div style={styles.imageSourceRow}>
                {/* File Upload Button (Auto-Saves) */}
                <label
                  htmlFor={`file-upload-${product.id}`}
                  style={styles.uploadBtn}
                >
                  {isUploading ? (
                    <Loader size={18} style={styles.loaderIcon} />
                  ) : (
                    <Upload size={18} />
                  )}
                  {isUploading ? "Uploading..." : "Upload New Image"}
                  <input
                    id={`file-upload-${product.id}`}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    style={{ display: "none" }}
                    disabled={isUploading}
                  />
                </label>

                {/* Manual URL Input (Auto-Saves on Blur) */}
                <input
                  style={styles.input}
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  onBlur={handleUpdateProduct}
                  placeholder="...or paste URL"
                  disabled={isUploading || isSaving}
                />
              </div>
            </div>

            {/* Preview image when editing */}
            {image && (
              <div style={{ gridColumn: "1 / -1", marginTop: "12px" }}>
                <p style={{ fontSize: "0.8rem", color: "#64748b" }}>
                  Current Image Preview:
                </p>
                <img
                  src={image}
                  alt="Preview"
                  style={styles.imagePreview}
                  onError={(e) => (e.target.style.display = "none")}
                />
              </div>
            )}
          </div>

          <h4 style={styles.variantsTitle}>VARIANTS (Size & Price)</h4>

          {/* VARIANTS LIST */}
          <div style={styles.variantList}>
            {variants.map((v) => (
              <div key={v.id} style={styles.variantRow}>
                <input
                  style={styles.variantInput}
                  value={v.size_label}
                  onChange={(e) =>
                    handleUpdateVariant(v.id, "size_label", e.target.value)
                  }
                />
                <input
                  type="number"
                  style={{ ...styles.variantInput, width: "100px" }}
                  value={v.price}
                  onChange={(e) =>
                    handleUpdateVariant(v.id, "price", e.target.value)
                  }
                />
                <button
                  onClick={() => handleDeleteVariant(v.id)}
                  style={styles.variantDeleteBtn}
                >
                  <X size={16} />
                </button>
              </div>
            ))}

            <button onClick={handleAddVariant} style={styles.addVariantBtn}>
              <Plus size={16} /> Add Size
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- STYLES OBJECT (New Modern CSS-in-JS) ---
const styles = {
  // --- LAYOUT ---
  dashboardLayout: {
    display: "grid",
    gridTemplateColumns: "250px 1fr",
    gap: "32px",
    padding: "40px 24px",
    minHeight: "80vh",
  },
  sidebar: {
    padding: "24px",
    background: "var(--bg-surface)",
    borderRadius: "16px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
    border: "1px solid var(--border)",
    alignSelf: "start",
  },
  mainContent: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },

  // --- ADMIN AUTH ---
  authContainer: {
    display: "flex",
    justifyContent: "center",
    marginTop: "100px",
  },
  authBox: {
    padding: "40px",
    background: "white",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
    textAlign: "center",
  },

  // --- HEADER & SEARCH ---
  contentHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 0",
    borderBottom: "1px solid var(--border)",
    gap: "20px",
  },
  searchContainer: {
    position: "relative",
    flexGrow: 1,
    maxWidth: "400px",
  },
  searchIcon: {
    position: "absolute",
    left: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "var(--text-muted)",
    pointerEvents: "none",
  },
  searchInput: {
    width: "100%",
    padding: "10px 12px 10px 40px",
    borderRadius: "8px",
    border: "1px solid var(--border)",
    fontSize: "0.95rem",
    fontFamily: "inherit",
  },

  // --- BUTTONS ---
  primaryBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "var(--primary)",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    transition: "background 0.2s",
  },
  cancelBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "#f1f5f9",
    color: "#64748b",
    border: "none",
    padding: "10px 20px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    transition: "background 0.2s",
  },
  saveBtn: {
    background: "var(--clinical-teal)",
    color: "white",
    border: "none",
    padding: "12px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "background 0.2s",
  },
  saveSmallBtn: {
    background: "var(--medical-navy)",
    color: "white",
    border: "none",
    padding: "0 16px",
    borderRadius: "8px",
    cursor: "pointer",
    flexShrink: 0,
  },
  uploadBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "#e0e7ff",
    color: "var(--primary)",
    border: "1px solid var(--primary)",
    padding: "10px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "0.9rem",
    flexShrink: 0,
    transition: "all 0.2s",
  },
  loaderIcon: {
    animation: "spin 1s linear infinite",
    display: "inline-block",
  },
  imageSourceRow: { display: "flex", gap: "10px", alignItems: "center" },

  // --- SIDEBAR FILTERS ---
  sidebarTitle: {
    color: "var(--medical-navy)",
    marginBottom: "30px",
    fontSize: "1.2rem",
    borderBottom: "1px solid var(--border)",
    paddingBottom: "10px",
  },
  filterGroup: { marginBottom: "24px" },
  filterList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginTop: "10px",
  },
  filterPill: {
    background: "#f8fafc",
    color: "var(--text-muted)",
    border: "1px solid var(--border)",
    padding: "8px 12px",
    borderRadius: "8px",
    cursor: "pointer",
    textAlign: "left",
    transition: "all 0.2s",
    fontWeight: "500",
    fontSize: "0.9rem",
  },
  filterPillActive: {
    background: "var(--primary)",
    color: "white",
    borderColor: "var(--primary)",
  },

  // --- FORMS & LISTS ---
  addFormCard: {
    background: "white",
    padding: "24px",
    borderRadius: "12px",
    border: "1px solid var(--border)",
    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)",
  },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" },
  label: {
    display: "block",
    marginBottom: "6px",
    fontSize: "0.85rem",
    fontWeight: "600",
    color: "#64748b",
  },
  input: {
    width: "100%",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    fontFamily: "inherit",
    transition: "border-color 0.2s",
  },

  listContainer: { display: "flex", flexDirection: "column", gap: "16px" },
  itemCard: {
    background: "white",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    overflow: "hidden",
  },
  itemHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 20px",
  },
  itemInfo: { display: "flex", alignItems: "center", gap: "16px" },
  imgThumb: {
    width: "48px",
    height: "48px",
    background: "#f8fafc",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  thumbImage: { width: "100%", height: "100%", objectFit: "contain" },
  itemName: {
    fontSize: "1rem",
    fontWeight: "700",
    margin: 0,
    color: "var(--medical-navy)",
  },
  itemCategory: { fontSize: "0.85rem", color: "#64748b" },

  actions: { display: "flex", gap: "8px" },
  iconBtn: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    padding: "8px",
    borderRadius: "6px",
    color: "#64748b",
    transition: "background 0.2s",
  },

  editorBody: { background: "#f8fafc", padding: "24px" },
  variantsTitle: {
    marginTop: "24px",
    marginBottom: "12px",
    fontSize: "0.9rem",
    color: "#64748b",
    borderTop: "1px solid #e2e8f0",
    paddingTop: "20px",
  },

  variantList: { display: "flex", flexDirection: "column", gap: "10px" },
  variantRow: {
    display: "grid",
    gridTemplateColumns: "1fr 100px 40px",
    gap: "10px",
    alignItems: "center",
  },
  variantInput: {
    padding: "8px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
    fontSize: "0.9rem",
    width: "100%",
    fontFamily: "inherit",
  },
  addVariantBtn: {
    background: "white",
    border: "1px dashed #cbd5e1",
    color: "#64748b",
    padding: "8px",
    borderRadius: "6px",
    cursor: "pointer",
    marginTop: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    fontSize: "0.85rem",
  },
  variantDeleteBtn: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    padding: "4px",
    color: "#ef4444",
  },
  imagePreview: {
    maxWidth: "100%",
    maxHeight: "150px",
    objectFit: "contain",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    padding: "8px",
    marginTop: "8px",
  },
};
