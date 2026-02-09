import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import {
  Trash2,
  Plus,
  Save,
  X,
  Tag,
  Loader,
  Ban,
  CheckCircle,
  Edit2,
} from "lucide-react";

export default function DiscountManager() {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); // If not null, we are editing

  // Form State
  const [formData, setFormData] = useState({
    code: "",
    type: "percentage",
    value: 10,
    free_shipping: false,
    active: true,
    has_limit: false,
    max_uses: 1,
  });

  useEffect(() => {
    fetchDiscountsAndUsage();
  }, []);

  const fetchDiscountsAndUsage = async () => {
    setLoading(true);

    // 1. Fetch Discounts
    const { data: discountData, error: discountError } = await supabase
      .from("discounts")
      .select("*")
      .order("created_at", { ascending: false });

    if (discountError)
      console.error("Error fetching discounts:", discountError);

    // 2. Fetch Usage from Orders
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .select("discount_code")
      .neq("status", "cancelled")
      .neq("status", "pending");

    if (orderError) console.error("Error fetching orders:", orderError);

    // 3. Count Usage
    const usageMap = {};
    if (orderData) {
      orderData.forEach((order) => {
        if (order.discount_code) {
          const code = order.discount_code.toUpperCase();
          usageMap[code] = (usageMap[code] || 0) + 1;
        }
      });
    }

    // 4. Merge Data
    const mergedData = (discountData || []).map((d) => ({
      ...d,
      usageCount: usageMap[d.code.toUpperCase()] || 0,
    }));

    setDiscounts(mergedData);
    setLoading(false);
  };

  const handleEdit = (discount) => {
    setFormData({
      code: discount.code,
      type: discount.type,
      value: discount.value,
      free_shipping: discount.free_shipping,
      active: discount.active,
      has_limit: discount.max_uses !== null, // Check box if max_uses exists
      max_uses: discount.max_uses || 1, // Default to 1 if null
    });
    setEditingId(discount.id);
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    if (!formData.code) return alert("Code is required");

    const payload = {
      code: formData.code.toUpperCase(),
      type: formData.type,
      value: formData.value,
      free_shipping: formData.free_shipping,
      active: formData.active,
      max_uses: formData.has_limit ? formData.max_uses : null,
    };

    let error;

    if (editingId) {
      // UPDATE Existing
      const { error: updateError } = await supabase
        .from("discounts")
        .update(payload)
        .eq("id", editingId);
      error = updateError;
    } else {
      // INSERT New
      const { error: insertError } = await supabase
        .from("discounts")
        .insert([payload]);
      error = insertError;
    }

    if (error) {
      alert("Error saving code: " + error.message);
    } else {
      closeForm();
      fetchDiscountsAndUsage();
    }
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setFormData({
      code: "",
      type: "percentage",
      value: 10,
      free_shipping: false,
      active: true,
      has_limit: false,
      max_uses: 1,
    });
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this code?")) return;
    await supabase.from("discounts").delete().eq("id", id);
    fetchDiscountsAndUsage();
  };

  const toggleActive = async (id, currentStatus) => {
    await supabase
      .from("discounts")
      .update({ active: !currentStatus })
      .eq("id", id);
    fetchDiscountsAndUsage();
  };

  return (
    <div
      style={{
        padding: "24px",
        background: "white",
        borderRadius: "12px",
        border: "1px solid #e2e8f0",
      }}
    >
      {/* HEADER */}
      <div style={styles.header}>
        <h3 style={styles.title}>
          <Tag size={20} /> Discount Manager
        </h3>
        {!isFormOpen && (
          <button onClick={() => setIsFormOpen(true)} style={styles.primaryBtn}>
            <Plus size={16} /> Create Code
          </button>
        )}
      </div>

      {/* FORM (Create or Edit) */}
      {isFormOpen && (
        <div style={styles.formCard}>
          <div style={styles.formHeader}>
            <h4 style={{ margin: 0 }}>
              {editingId ? "Edit Discount Code" : "New Discount Code"}
            </h4>
            <button onClick={closeForm} style={styles.closeBtn}>
              <X size={18} />
            </button>
          </div>

          <div style={styles.formGrid}>
            <div>
              <label style={styles.label}>Code Name</label>
              <input
                placeholder="e.g. VIP20"
                value={formData.code}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    code: e.target.value.toUpperCase(),
                  })
                }
                style={styles.input}
              />
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={styles.label}>Type</label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  style={styles.input}
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount ($)</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={styles.label}>Value</label>
                <input
                  type="number"
                  value={formData.value}
                  onChange={(e) =>
                    setFormData({ ...formData, value: e.target.value })
                  }
                  style={styles.input}
                />
              </div>
            </div>

            <div
              style={{
                gridColumn: "span 2",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                marginTop: 5,
              }}
            >
              {/* Usage Limit */}
              <div style={styles.optionRow}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.has_limit}
                    onChange={(e) =>
                      setFormData({ ...formData, has_limit: e.target.checked })
                    }
                    style={{ width: 16, height: 16 }}
                  />
                  <span>Limit number of uses?</span>
                </label>

                {formData.has_limit && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginLeft: 28,
                    }}
                  >
                    <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                      Cap at:
                    </span>
                    <input
                      type="number"
                      min="1"
                      value={formData.max_uses}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          max_uses: parseInt(e.target.value),
                        })
                      }
                      style={{ ...styles.input, width: 80, padding: "4px 8px" }}
                    />
                    <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                      uses
                    </span>
                  </div>
                )}
              </div>

              {/* Free Shipping */}
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={formData.free_shipping}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      free_shipping: e.target.checked,
                    })
                  }
                  style={{ width: 16, height: 16 }}
                />
                <span>Apply Free Shipping?</span>
              </label>
            </div>
          </div>

          <div
            style={{
              marginTop: 20,
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
            }}
          >
            <button onClick={closeForm} style={styles.cancelBtn}>
              Cancel
            </button>
            <button onClick={handleSave} style={styles.saveBtn}>
              <Save size={16} /> {editingId ? "Update Code" : "Save Code"}
            </button>
          </div>
        </div>
      )}

      {/* TABLE */}
      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
          <Loader className="spin-anim" /> Loading codes...
        </div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr
              style={{ borderBottom: "2px solid #f1f5f9", textAlign: "left" }}
            >
              <th style={styles.th}>Code</th>
              <th style={styles.th}>Effect</th>
              <th style={styles.th}>Usage Limit</th>
              <th style={styles.th}>Status</th>
              <th style={{ ...styles.th, textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {discounts.map((d) => {
              const isLimitReached = d.max_uses && d.usageCount >= d.max_uses;
              return (
                <tr key={d.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={styles.td}>
                    <span
                      style={{
                        fontWeight: 700,
                        fontFamily: "monospace",
                        fontSize: "1rem",
                      }}
                    >
                      {d.code}
                    </span>
                  </td>
                  <td style={styles.td}>
                    {d.type === "percentage"
                      ? `${d.value}% Off`
                      : `$${d.value} Off`}
                    {d.free_shipping && (
                      <span style={styles.tag}>Free Ship</span>
                    )}
                  </td>
                  <td style={styles.td}>
                    {d.max_uses ? (
                      <span
                        style={{
                          ...styles.usageBadge,
                          background: isLimitReached ? "#fef2f2" : "#ecfdf5",
                          color: isLimitReached ? "#ef4444" : "#10b981",
                          border: isLimitReached
                            ? "1px solid #fecaca"
                            : "1px solid #a7f3d0",
                        }}
                      >
                        {isLimitReached ? (
                          <Ban size={12} />
                        ) : (
                          <CheckCircle size={12} />
                        )}
                        {d.usageCount} / {d.max_uses} Used
                      </span>
                    ) : (
                      <span style={styles.usageBadge}>
                        {d.usageCount} Used (∞)
                      </span>
                    )}
                  </td>
                  <td style={styles.td}>
                    <button
                      onClick={() => toggleActive(d.id, d.active)}
                      style={{
                        ...styles.statusBtn,
                        background: d.active ? "#ecfdf5" : "#f1f5f9",
                        color: d.active ? "#166534" : "#64748b",
                      }}
                    >
                      {d.active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td style={{ ...styles.td, textAlign: "right" }}>
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        justifyContent: "flex-end",
                      }}
                    >
                      <button
                        onClick={() => handleEdit(d)}
                        style={styles.editBtn}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(d.id)}
                        style={styles.deleteBtn}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {discounts.length === 0 && (
              <tr>
                <td
                  colSpan="5"
                  style={{
                    padding: "30px",
                    textAlign: "center",
                    color: "#94a3b8",
                  }}
                >
                  No discount codes found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
  },
  title: {
    margin: 0,
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "#0f172a",
  },
  primaryBtn: {
    background: "#0f172a",
    color: "white",
    padding: "8px 16px",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontWeight: 600,
    fontSize: "0.9rem",
  },
  formCard: {
    background: "#f8fafc",
    padding: "20px",
    borderRadius: "12px",
    marginBottom: "24px",
    border: "1px dashed #cbd5e1",
  },
  formHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 20,
    borderBottom: "1px solid #e2e8f0",
    paddingBottom: 10,
  },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" },
  label: {
    display: "block",
    fontSize: "0.85rem",
    marginBottom: "6px",
    fontWeight: 600,
    color: "#64748b",
  },
  input: {
    width: "100%",
    padding: "8px 12px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
    fontSize: "0.9rem",
  },
  closeBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#64748b",
  },
  saveBtn: {
    background: "#10b981",
    color: "white",
    padding: "8px 20px",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontWeight: 600,
  },
  cancelBtn: {
    background: "white",
    color: "#64748b",
    padding: "8px 20px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
    cursor: "pointer",
    fontWeight: 600,
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    cursor: "pointer",
    fontSize: "0.9rem",
    color: "#334155",
    fontWeight: 500,
  },
  optionRow: { display: "flex", flexDirection: "column", gap: 5 },
  th: {
    padding: "12px 16px",
    fontSize: "0.85rem",
    color: "#64748b",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  td: { padding: "16px", fontSize: "0.9rem", color: "#334155" },
  tag: {
    marginLeft: "8px",
    background: "#eff6ff",
    color: "#1e40af",
    padding: "2px 8px",
    borderRadius: "12px",
    fontSize: "0.75rem",
    fontWeight: 600,
  },
  usageBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "0.8rem",
    fontWeight: "600",
    background: "#f1f5f9",
    color: "#64748b",
  },
  statusBtn: {
    padding: "4px 10px",
    borderRadius: "20px",
    border: "none",
    fontSize: "0.8rem",
    cursor: "pointer",
    fontWeight: "600",
  },
  editBtn: {
    background: "#eff6ff",
    border: "1px solid #dbeafe",
    color: "#2563eb",
    cursor: "pointer",
    padding: 6,
    borderRadius: 4,
  },
  deleteBtn: {
    background: "#fef2f2",
    border: "1px solid #fee2e2",
    color: "#ef4444",
    cursor: "pointer",
    padding: 6,
    borderRadius: 4,
  },
};
