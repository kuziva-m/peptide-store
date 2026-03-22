import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import imageCompression from "browser-image-compression";
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
  Save,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Star,
  Clock, // Imported Clock for Preorder toggle
} from "lucide-react";

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

  const handleImageUpload = async (file) => {
    if (!file) return;
    const options = {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1200,
      useWebWorker: true,
    };
    try {
      const compressedFile = await imageCompression(file, options);
      const fileExt = compressedFile.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, compressedFile);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error) {
      alert("Upload failed: " + error.message);
      return null;
    }
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
                placeholder="Short description..."
              />
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <label style={styles.label}>Image</label>
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <input
                  style={{ ...styles.input, flex: "1 1 250px" }}
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

function ProductRow({
  product,
  isExpanded,
  onToggle,
  onDelete,
  handleImageUpload,
}) {
  const [variants, setVariants] = useState(product.variants || []);
  const [name, setName] = useState(product.name);
  const [image, setImage] = useState(product.image_url);
  const [isSaving, setIsSaving] = useState(false);
  const [inStock, setInStock] = useState(product.in_stock);

  useEffect(() => {
    setName(product.name);
    setImage(product.image_url);
    setInStock(product.in_stock);
  }, [product]);

  const handleToggleStock = async (e) => {
    e.stopPropagation();
    const newStatus = !inStock;
    setInStock(newStatus);
    const { error } = await supabase
      .from("products")
      .update({ in_stock: newStatus })
      .eq("id", product.id);
    if (error) {
      setInStock(!newStatus);
      alert("Failed to update stock status");
    }
  };

  const handleSaveDetails = async () => {
    setIsSaving(true);
    const { error: productError } = await supabase
      .from("products")
      .update({ name: name, image_url: image })
      .eq("id", product.id);
    if (productError) {
      alert("Failed to save product: " + productError.message);
      setIsSaving(false);
      return;
    }

    const variantPromises = variants.map((v) =>
      supabase
        .from("variants")
        .update({
          size_label: v.size_label,
          price: v.price,
          image_url: v.image_url,
          in_stock: v.in_stock,
          is_hidden: v.is_hidden,
          is_default: v.is_default || false,
          is_preorder: v.is_preorder || false,
        })
        .eq("id", v.id),
    );

    const results = await Promise.all(variantPromises);
    const failedVariant = results.find((r) => r.error);
    setIsSaving(false);
    if (failedVariant) {
      alert(
        "Product saved, but failed to save some variants: " +
          failedVariant.error.message,
      );
    } else {
      alert("All changes saved successfully!");
    }
  };

  const addVariant = async () => {
    const { data } = await supabase
      .from("variants")
      .insert({
        product_id: product.id,
        size_label: "10 Pack",
        price: 10,
        in_stock: true,
        is_hidden: false,
        is_default: false,
        is_preorder: false,
      })
      .select()
      .single();
    if (data) setVariants([...variants, data]);
  };

  const updateVariantLocal = (id, field, value) => {
    if (field === "is_default" && value === true) {
      setVariants(
        variants.map((v) =>
          v.id === id
            ? { ...v, is_default: true }
            : { ...v, is_default: false },
        ),
      );
    } else {
      setVariants(
        variants.map((v) => (v.id === id ? { ...v, [field]: value } : v)),
      );
    }
  };

  const deleteVariant = async (id) => {
    if (!confirm("Are you sure you want to permanently delete this variant?"))
      return;
    setVariants(variants.filter((v) => v.id !== id));
    await supabase.from("variants").delete().eq("id", id);
  };

  return (
    <div style={styles.productCard}>
      <div style={styles.productHeader} onClick={onToggle}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "15px",
            flexWrap: "wrap",
          }}
        >
          <div style={styles.imgThumbnail}>
            {image ? (
              <img src={image} alt={name} style={styles.img} />
            ) : (
              <ImageIcon size={20} color="#cbd5e1" />
            )}
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: "1rem" }}>{name}</h4>
            <span style={styles.badge}>{product.category}</span>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={handleToggleStock}
            style={{
              ...styles.stockBtn,
              backgroundColor: inStock ? "#dcfce7" : "#fee2e2",
              color: inStock ? "#166534" : "#991b1b",
              border: inStock ? "1px solid #bbf7d0" : "1px solid #fecaca",
            }}
            title={
              inStock ? "Mark Product Out of Stock" : "Mark Product In Stock"
            }
          >
            {inStock ? (
              <>
                <CheckCircle size={14} /> Product Active
              </>
            ) : (
              <>
                <XCircle size={14} /> Product Inactive
              </>
            )}
          </button>
          <button style={styles.iconBtn}>
            {isExpanded ? <ChevronUp size={20} /> : <Edit2 size={20} />}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            style={{ ...styles.iconBtn, color: "#ef4444" }}
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div style={styles.expandedPanel}>
          {/* PRODUCT DETAILS */}
          <div style={{ marginBottom: "20px", display: "grid", gap: "15px" }}>
            <div>
              <label style={styles.label}>Product Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={styles.input}
              />
            </div>
            <div>
              <label style={styles.label}>Main Image URL</label>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <input
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  style={{ ...styles.input, flex: "1 1 200px" }}
                />
                <label style={styles.uploadBtnSmall}>
                  <Upload size={14} style={{ marginRight: 6 }} /> Upload
                  <input
                    type="file"
                    hidden
                    onChange={async (e) => {
                      const url = await handleImageUpload(e.target.files[0]);
                      if (url) setImage(url);
                    }}
                  />
                </label>
              </div>
            </div>
            <button
              onClick={handleSaveDetails}
              style={{
                ...styles.saveBtn,
                width: "fit-content",
                padding: "10px 24px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                opacity: isSaving ? 0.7 : 1,
                marginTop: "10px",
              }}
              disabled={isSaving}
            >
              {isSaving ? (
                "Saving..."
              ) : (
                <>
                  <Save size={18} /> Save All Changes (Product & Variants)
                </>
              )}
            </button>
          </div>

          <h5
            style={{
              margin: "20px 0 10px 0",
              color: "#0f172a",
              borderTop: "1px solid #e2e8f0",
              paddingTop: "20px",
              fontSize: "1.1rem",
            }}
          >
            PRODUCT VARIANTS
          </h5>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "15px" }}
          >
            {variants.map((v) => (
              <VariantRow
                key={v.id}
                data={v}
                updateLocal={updateVariantLocal}
                onDelete={() => deleteVariant(v.id)}
                handleImageUpload={handleImageUpload}
              />
            ))}
            <button onClick={addVariant} style={styles.addVariantBtn}>
              <Plus size={16} /> Add New Variant Option
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// 📱 FULLY RESPONSIVE & EXPLICIT VARIANT CARD
function VariantRow({ data, updateLocal, onDelete, handleImageUpload }) {
  const isInStock = data.in_stock !== false;
  const isHidden = data.is_hidden === true;
  const isDefault = data.is_default === true;
  const isPreorder = data.is_preorder === true;

  // Dynamic style helper for the new toggle pills
  const getToggleStyle = (
    isActive,
    activeText,
    activeBg,
    activeBorder,
    inactiveText,
    inactiveBg,
    inactiveBorder,
  ) => ({
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "0.8rem",
    fontWeight: "600",
    cursor: "pointer",
    border: `1px solid ${isActive ? activeBorder : inactiveBorder}`,
    background: isActive ? activeBg : inactiveBg,
    color: isActive ? activeText : inactiveText,
    transition: "all 0.2s ease",
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        padding: "16px",
        backgroundColor: isHidden
          ? "#f8fafc"
          : isDefault
            ? "#fefce8"
            : isPreorder
              ? "#fff7ed"
              : "white",
        opacity: isHidden ? 0.7 : 1,
        borderRadius: "8px",
        border: isDefault
          ? "2px solid #fde047"
          : isPreorder
            ? "2px solid #fdba74"
            : "1px solid #e2e8f0",
        transition: "all 0.2s ease",
      }}
    >
      {/* ROW 1: INPUTS (Wraps on mobile) */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <input
          value={data.size_label}
          onChange={(e) => updateLocal(data.id, "size_label", e.target.value)}
          style={{ ...styles.inputSmall, flex: "1 1 120px" }}
          placeholder="Size (e.g. 10mg)"
        />
        <input
          type="number"
          value={data.price}
          onChange={(e) => updateLocal(data.id, "price", e.target.value)}
          style={{ ...styles.inputSmall, flex: "1 1 80px" }}
          placeholder="Price ($)"
        />
        <input
          value={data.image_url || ""}
          onChange={(e) => updateLocal(data.id, "image_url", e.target.value)}
          style={{ ...styles.inputSmall, flex: "2 1 200px" }}
          placeholder="Variant Image URL"
        />
        <label style={{ ...styles.uploadBtnSmall, flex: "0 1 auto" }}>
          <Upload size={14} style={{ marginRight: 6 }} /> <span>Upload</span>
          <input
            type="file"
            hidden
            onChange={async (e) => {
              const url = await handleImageUpload(e.target.files[0]);
              if (url) updateLocal(data.id, "image_url", url);
            }}
          />
        </label>
      </div>

      {/* ROW 2: EXPLICIT TOGGLE ACTION BUTTONS (Wraps on mobile) */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {/* 1. STOCK TOGGLE */}
        <button
          onClick={() => updateLocal(data.id, "in_stock", !isInStock)}
          style={getToggleStyle(
            isInStock,
            "#166534",
            "#dcfce7",
            "#bbf7d0",
            "#991b1b",
            "#fee2e2",
            "#fecaca",
          )}
        >
          {isInStock ? (
            <>
              <CheckCircle size={14} /> In Stock
            </>
          ) : (
            <>
              <XCircle size={14} /> Out of Stock
            </>
          )}
        </button>

        {/* 2. PREORDER TOGGLE */}
        <button
          onClick={() => updateLocal(data.id, "is_preorder", !isPreorder)}
          style={getToggleStyle(
            isPreorder,
            "#ea580c",
            "#ffedd5",
            "#fed7aa",
            "#64748b",
            "#f1f5f9",
            "#e2e8f0",
          )}
        >
          <Clock size={14} /> {isPreorder ? "Preorder: ON" : "Preorder: OFF"}
        </button>

        {/* 3. DEFAULT TOGGLE */}
        <button
          onClick={() => updateLocal(data.id, "is_default", true)}
          style={getToggleStyle(
            isDefault,
            "#ca8a04",
            "#fef9c3",
            "#fde047",
            "#64748b",
            "#f1f5f9",
            "#e2e8f0",
          )}
        >
          <Star size={14} fill={isDefault ? "#ca8a04" : "none"} />{" "}
          {isDefault ? "Default Size" : "Set Default"}
        </button>

        {/* 4. VISIBILITY TOGGLE */}
        <button
          onClick={() => updateLocal(data.id, "is_hidden", !isHidden)}
          style={getToggleStyle(
            !isHidden,
            "#0369a1",
            "#e0f2fe",
            "#bae6fd",
            "#64748b",
            "#f1f5f9",
            "#e2e8f0",
          )}
        >
          {isHidden ? (
            <>
              <EyeOff size={14} /> Hidden
            </>
          ) : (
            <>
              <Eye size={14} /> Visible
            </>
          )}
        </button>

        {/* 5. DELETE BUTTON */}
        <button
          onClick={onDelete}
          title="Permanently Delete"
          style={{
            ...getToggleStyle(
              true,
              "#ef4444",
              "#fef2f2",
              "#fecaca",
              "#ef4444",
              "#fef2f2",
              "#fecaca",
            ),
            marginLeft: "auto", // Pushes the delete button to the far right on desktop
          }}
        >
          <Trash2 size={14} /> Delete
        </button>
      </div>
    </div>
  );
}

const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    flexWrap: "wrap",
    gap: "10px",
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
  controls: {
    display: "flex",
    gap: "15px",
    marginBottom: "20px",
    flexWrap: "wrap",
  },
  searchBox: {
    flex: "1 1 250px",
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
    flex: "0 1 auto",
    padding: "0 20px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    background: "white",
    cursor: "pointer",
    height: "40px",
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
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
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
    boxSizing: "border-box",
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
    cursor: "pointer",
    flexWrap: "wrap",
    gap: "15px",
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
    flexShrink: 0,
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
  stockBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "0.8rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  expandedPanel: {
    background: "#f8fafc",
    borderTop: "1px solid #e2e8f0",
    padding: "20px",
  },
  inputSmall: {
    padding: "8px",
    borderRadius: "4px",
    border: "1px solid #cbd5e1",
    fontSize: "0.9rem",
    boxSizing: "border-box",
  },
  addVariantBtn: {
    background: "white",
    border: "2px dashed #cbd5e1",
    color: "var(--primary)",
    padding: "12px",
    borderRadius: "8px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    fontWeight: "bold",
    marginTop: "10px",
    transition: "all 0.2s",
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
    whiteSpace: "nowrap",
  },
};
