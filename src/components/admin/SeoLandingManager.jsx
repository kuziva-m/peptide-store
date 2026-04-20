import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import imageCompression from "browser-image-compression";
import {
  ChevronDown,
  ChevronUp,
  Search,
  Image as ImageIcon,
  Upload,
  Loader,
  Save,
  Globe,
} from "lucide-react";

export default function SeoLandingManager() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedSlug, setExpandedSlug] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("seo_landing_pages")
      .select("*")
      .order("slug", { ascending: true });

    if (data) setPages(data);
    if (error) console.error("Error fetching SEO pages:", error);
    setLoading(false);
  };

  const handleImageUpload = async (file) => {
    if (!file) return null;
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
        .from("product-images")
        .upload(filePath, compressedFile);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error) {
      alert("Upload failed: " + error.message);
      return null;
    }
  };

  const filteredPages = pages.filter(
    (p) =>
      p.h1_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.slug?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div>
      <div style={styles.header}>
        <h2
          style={{
            margin: 0,
            color: "var(--medical-navy)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <Globe size={24} /> SEO Landing Pages
        </h2>
      </div>

      <div style={styles.controls}>
        <div style={styles.searchBox}>
          <Search size={18} color="#94a3b8" />
          <input
            placeholder="Search by peptide name or slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ padding: "40px", textAlign: "center" }}>
          <Loader className="spin-anim" />
        </div>
      ) : (
        <div style={styles.list}>
          {filteredPages.map((page) => (
            <SeoPageRow
              key={page.slug}
              page={page}
              isExpanded={expandedSlug === page.slug}
              onToggle={() =>
                setExpandedSlug(expandedSlug === page.slug ? null : page.slug)
              }
              handleImageUpload={handleImageUpload}
            />
          ))}
          {filteredPages.length === 0 && (
            <div
              style={{ padding: "40px", textAlign: "center", color: "#64748b" }}
            >
              No landing pages found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SeoPageRow({ page, isExpanded, onToggle, handleImageUpload }) {
  const [formData, setFormData] = useState({ ...page });
  const [isSaving, setIsSaving] = useState(false);

  // Sync state if external page data changes
  useEffect(() => {
    setFormData({ ...page });
  }, [page]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    const { error } = await supabase
      .from("seo_landing_pages")
      .update({
        h1_title: formData.h1_title,
        meta_description: formData.meta_description,
        introduction: formData.introduction,
        mechanism_text: formData.mechanism_text,
        reconstitution_example: formData.reconstitution_example,
        storage_guidelines: formData.storage_guidelines,
        image_amino_sequence: formData.image_amino_sequence,
        image_molecular_structure: formData.image_molecular_structure,
        image_vial: formData.image_vial,
      })
      .eq("slug", page.slug);

    setIsSaving(false);
    if (error) {
      alert("Error saving page: " + error.message);
    } else {
      alert("Page updated successfully!");
    }
  };

  return (
    <div style={styles.card}>
      <div style={styles.rowHeader} onClick={onToggle}>
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <div>
            <h4 style={{ margin: 0, fontSize: "1.1rem", color: "#0f172a" }}>
              {formData.h1_title || formData.slug}
            </h4>
            <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
              /{formData.slug}
            </span>
          </div>
        </div>
        <button style={styles.iconBtn}>
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      {isExpanded && (
        <div style={styles.expandedPanel}>
          {/* IMAGE UPLOADERS */}
          <h5 style={styles.sectionHeading}>Page Images</h5>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "20px",
              marginBottom: "30px",
            }}
          >
            {/* Amino Sequence Image */}
            <div style={styles.imageBox}>
              <label style={styles.label}>Amino Sequence Image</label>
              {formData.image_amino_sequence ? (
                <img
                  src={formData.image_amino_sequence}
                  alt="Amino"
                  style={styles.previewImg}
                />
              ) : (
                <div style={styles.emptyImg}>
                  <ImageIcon size={32} color="#cbd5e1" />
                </div>
              )}
              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <input
                  value={formData.image_amino_sequence || ""}
                  onChange={(e) =>
                    handleChange("image_amino_sequence", e.target.value)
                  }
                  style={styles.inputSmall}
                  placeholder="Image URL"
                />
                <label style={styles.uploadBtnSmall}>
                  <Upload size={14} />
                  <input
                    type="file"
                    hidden
                    onChange={async (e) => {
                      const url = await handleImageUpload(e.target.files[0]);
                      if (url) handleChange("image_amino_sequence", url);
                    }}
                  />
                </label>
              </div>
            </div>

            {/* Molecular Structure Image */}
            <div style={styles.imageBox}>
              <label style={styles.label}>Molecular Structure</label>
              {formData.image_molecular_structure ? (
                <img
                  src={formData.image_molecular_structure}
                  alt="Molecular"
                  style={styles.previewImg}
                />
              ) : (
                <div style={styles.emptyImg}>
                  <ImageIcon size={32} color="#cbd5e1" />
                </div>
              )}
              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <input
                  value={formData.image_molecular_structure || ""}
                  onChange={(e) =>
                    handleChange("image_molecular_structure", e.target.value)
                  }
                  style={styles.inputSmall}
                  placeholder="Image URL"
                />
                <label style={styles.uploadBtnSmall}>
                  <Upload size={14} />
                  <input
                    type="file"
                    hidden
                    onChange={async (e) => {
                      const url = await handleImageUpload(e.target.files[0]);
                      if (url) handleChange("image_molecular_structure", url);
                    }}
                  />
                </label>
              </div>
            </div>

            {/* Vial Image */}
            <div style={styles.imageBox}>
              <label style={styles.label}>Storage Vial Image</label>
              {formData.image_vial ? (
                <img
                  src={formData.image_vial}
                  alt="Vial"
                  style={styles.previewImg}
                />
              ) : (
                <div style={styles.emptyImg}>
                  <ImageIcon size={32} color="#cbd5e1" />
                </div>
              )}
              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <input
                  value={formData.image_vial || ""}
                  onChange={(e) => handleChange("image_vial", e.target.value)}
                  style={styles.inputSmall}
                  placeholder="Image URL"
                />
                <label style={styles.uploadBtnSmall}>
                  <Upload size={14} />
                  <input
                    type="file"
                    hidden
                    onChange={async (e) => {
                      const url = await handleImageUpload(e.target.files[0]);
                      if (url) handleChange("image_vial", url);
                    }}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* TEXT CONTENT */}
          <h5 style={styles.sectionHeading}>Page Content & Text</h5>
          <div style={{ display: "grid", gap: "15px" }}>
            <div>
              <label style={styles.label}>H1 Title</label>
              <input
                value={formData.h1_title || ""}
                onChange={(e) => handleChange("h1_title", e.target.value)}
                style={styles.input}
              />
            </div>

            <div>
              <label style={styles.label}>Meta Description (SEO)</label>
              <textarea
                value={formData.meta_description || ""}
                onChange={(e) =>
                  handleChange("meta_description", e.target.value)
                }
                style={{ ...styles.input, height: "60px" }}
              />
            </div>

            <div>
              <label style={styles.label}>Introduction Text</label>
              <textarea
                value={formData.introduction || ""}
                onChange={(e) => handleChange("introduction", e.target.value)}
                style={{ ...styles.input, height: "120px" }}
              />
            </div>

            <div>
              <label style={styles.label}>Mechanism of Action</label>
              <textarea
                value={formData.mechanism_text || ""}
                onChange={(e) => handleChange("mechanism_text", e.target.value)}
                style={{ ...styles.input, height: "120px" }}
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "15px",
              }}
            >
              <div>
                <label style={styles.label}>Reconstitution Example</label>
                <textarea
                  value={formData.reconstitution_example || ""}
                  onChange={(e) =>
                    handleChange("reconstitution_example", e.target.value)
                  }
                  style={{
                    ...styles.input,
                    height: "100px",
                    fontFamily: "monospace",
                  }}
                />
              </div>
              <div>
                <label style={styles.label}>Storage Guidelines</label>
                <textarea
                  value={formData.storage_guidelines || ""}
                  onChange={(e) =>
                    handleChange("storage_guidelines", e.target.value)
                  }
                  style={{ ...styles.input, height: "100px" }}
                />
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: "20px",
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <button
              onClick={handleSave}
              disabled={isSaving}
              style={{ ...styles.saveBtn, opacity: isSaving ? 0.7 : 1 }}
            >
              {isSaving ? (
                "Saving..."
              ) : (
                <>
                  <Save size={18} /> Save Landing Page
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
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
  list: { display: "flex", flexDirection: "column", gap: "12px" },
  card: {
    background: "white",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    overflow: "hidden",
    transition: "all 0.2s",
  },
  rowHeader: {
    padding: "16px 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    cursor: "pointer",
    background: "white",
  },
  iconBtn: {
    background: "none",
    border: "none",
    color: "#64748b",
    cursor: "pointer",
    display: "flex",
  },
  expandedPanel: {
    background: "#f8fafc",
    padding: "24px",
    borderTop: "1px solid #e2e8f0",
  },
  sectionHeading: {
    margin: "0 0 16px 0",
    color: "#0f172a",
    fontSize: "1.1rem",
    borderBottom: "2px solid #e2e8f0",
    paddingBottom: "8px",
  },
  imageBox: {
    background: "white",
    padding: "16px",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    display: "flex",
    flexDirection: "column",
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
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "0.95rem",
    outline: "none",
    fontFamily: "inherit",
  },
  inputSmall: {
    flex: 1,
    padding: "8px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
    fontSize: "0.85rem",
    outline: "none",
  },
  uploadBtnSmall: {
    background: "#f1f5f9",
    border: "1px solid #cbd5e1",
    color: "#475569",
    padding: "0 12px",
    borderRadius: "6px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "35px",
  },
  previewImg: {
    width: "100%",
    height: "140px",
    objectFit: "contain",
    borderRadius: "6px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
  },
  emptyImg: {
    width: "100%",
    height: "140px",
    background: "#f1f5f9",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px dashed #cbd5e1",
  },
  saveBtn: {
    background: "var(--medical-navy)",
    color: "white",
    border: "none",
    padding: "12px 24px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
};
