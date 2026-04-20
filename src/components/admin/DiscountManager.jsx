import { useState, useEffect, useMemo } from "react";
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
  Star,
  Ticket,
  BarChart2,
  DollarSign,
  Package,
  TrendingUp,
  User,
} from "lucide-react";

export default function DiscountManager() {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI State
  const [activeTab, setActiveTab] = useState("standard");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Stats Modal State
  const [statsModalOpen, setStatsModalOpen] = useState(false);
  const [selectedStats, setSelectedStats] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    code: "",
    type: "percentage",
    value: 10,
    free_shipping: false,
    active: true,
    has_limit: false,
    max_uses: 1,
    is_creator_code: false,
  });

  useEffect(() => {
    fetchDiscountsAndUsage();
  }, []);

  const fetchDiscountsAndUsage = async () => {
    setLoading(true);

    const { data: discountData, error: discountError } = await supabase
      .from("discounts")
      .select("*")
      .order("created_at", { ascending: false });

    if (discountError)
      console.error("Error fetching discounts:", discountError);

    // FIXED: Changed total_price to total_amount based on your database schema
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .select("discount_code, total_amount, created_at, customer_name")
      .neq("status", "cancelled")
      .neq("status", "pending");

    if (orderError) console.error("Error fetching orders:", orderError);

    const usageMap = {};
    if (orderData) {
      orderData.forEach((order) => {
        if (order.discount_code) {
          // Added .trim() to ensure spaces don't break the match
          const code = order.discount_code.trim().toUpperCase();
          if (!usageMap[code]) {
            usageMap[code] = { count: 0, revenue: 0, orders: [] };
          }
          usageMap[code].count += 1;
          // FIXED: Now accurately reads total_amount
          usageMap[code].revenue += Number(order.total_amount || 0);
          usageMap[code].orders.push(order);
        }
      });
    }

    const mergedData = (discountData || []).map((d) => {
      const codeUpper = d.code.trim().toUpperCase();
      const codeStats = usageMap[codeUpper] || {
        count: 0,
        revenue: 0,
        orders: [],
      };

      // Sort orders newest first
      codeStats.orders.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at),
      );

      return {
        ...d,
        usageCount: codeStats.count,
        totalRevenue: codeStats.revenue,
        orderHistory: codeStats.orders,
      };
    });

    setDiscounts(mergedData);
    setLoading(false);
  };

  // --- TAB COUNTER LOGIC ---
  const tabCounts = useMemo(() => {
    let standard = 0;
    let creator = 0;
    discounts.forEach((d) => {
      if (d.is_creator_code) creator++;
      else standard++;
    });
    return { standard, creator };
  }, [discounts]);

  const handleOpenForm = () => {
    setFormData({
      code: "",
      type: "percentage",
      value: 10,
      free_shipping: false,
      active: true,
      has_limit: false,
      max_uses: 1,
      is_creator_code: activeTab === "creator",
    });
    setEditingId(null);
    setIsFormOpen(true);
  };

  const handleEdit = (discount) => {
    setFormData({
      code: discount.code,
      type: discount.type,
      value: discount.value,
      free_shipping: discount.free_shipping,
      active: discount.active,
      has_limit: discount.max_uses !== null,
      max_uses: discount.max_uses || 1,
      is_creator_code: discount.is_creator_code || false,
    });
    setEditingId(discount.id);
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    if (!formData.code) return alert("Code is required");

    const payload = {
      code: formData.code.trim().toUpperCase(),
      type: formData.type,
      value: formData.value,
      free_shipping: formData.free_shipping,
      active: formData.active,
      max_uses: formData.has_limit ? formData.max_uses : null,
      is_creator_code: formData.is_creator_code,
    };

    let error;

    if (editingId) {
      const { error: updateError } = await supabase
        .from("discounts")
        .update(payload)
        .eq("id", editingId);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from("discounts")
        .insert([payload]);
      error = insertError;
    }

    if (error) {
      alert("Error saving code: " + error.message);
    } else {
      setIsFormOpen(false);
      fetchDiscountsAndUsage();
    }
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this code?")) return;
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

  const openStatsModal = (discount) => {
    setSelectedStats(discount);
    setStatsModalOpen(true);
  };

  const displayedDiscounts = discounts.filter((d) =>
    activeTab === "creator" ? d.is_creator_code : !d.is_creator_code,
  );

  return (
    <div
      style={{
        padding: "24px",
        background: "white",
        borderRadius: "12px",
        border: "1px solid #e2e8f0",
        position: "relative",
      }}
    >
      {/* --- STATS MODAL OVERLAY --- */}
      {statsModalOpen && selectedStats && (
        <div style={styles.modalOverlay}>
          <div className="fade-in-ui" style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "1.2rem",
                    fontWeight: 800,
                    color: "#0f172a",
                  }}
                >
                  Code Performance
                </h3>
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: "0.9rem",
                    color: "#4635de",
                    fontWeight: 700,
                    background: "#f0f4ff",
                    display: "inline-block",
                    padding: "2px 8px",
                    borderRadius: "6px",
                  }}
                >
                  {selectedStats.code}
                </p>
              </div>
              <button
                onClick={() => setStatsModalOpen(false)}
                style={styles.closeBtn}
              >
                <X size={24} />
              </button>
            </div>

            {/* Metrics Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "16px",
                padding: "24px",
                background: "#f8fafc",
                borderBottom: "1px solid #e2e8f0",
              }}
            >
              <div style={styles.statBox}>
                <Package
                  size={20}
                  color="#3b82f6"
                  style={{ marginBottom: 8 }}
                />
                <p style={styles.statLabel}>Total Uses</p>
                <h2 style={styles.statValue}>{selectedStats.usageCount}</h2>
              </div>
              <div style={styles.statBox}>
                <DollarSign
                  size={20}
                  color="#10b981"
                  style={{ marginBottom: 8 }}
                />
                <p style={styles.statLabel}>Revenue Generated</p>
                <h2 style={styles.statValue}>
                  ${selectedStats.totalRevenue.toFixed(2)}
                </h2>
              </div>
              <div style={styles.statBox}>
                <TrendingUp
                  size={20}
                  color="#8b5cf6"
                  style={{ marginBottom: 8 }}
                />
                <p style={styles.statLabel}>Avg. Order Value</p>
                <h2 style={styles.statValue}>
                  $
                  {selectedStats.usageCount > 0
                    ? (
                        selectedStats.totalRevenue / selectedStats.usageCount
                      ).toFixed(2)
                    : "0.00"}
                </h2>
              </div>
            </div>

            {/* Orders Table */}
            <div
              style={{ padding: "24px", maxHeight: "400px", overflowY: "auto" }}
            >
              <h4
                style={{
                  margin: "0 0 16px 0",
                  fontSize: "1rem",
                  color: "#0f172a",
                }}
              >
                Recent Orders
              </h4>
              {selectedStats.orderHistory.length === 0 ? (
                <p
                  style={{
                    color: "#64748b",
                    textAlign: "center",
                    padding: "20px 0",
                  }}
                >
                  No orders have used this code yet.
                </p>
              ) : (
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    textAlign: "left",
                  }}
                >
                  <thead>
                    <tr style={{ borderBottom: "2px solid #f1f5f9" }}>
                      <th style={styles.thSmall}>Date</th>
                      <th style={styles.thSmall}>Customer</th>
                      <th style={{ ...styles.thSmall, textAlign: "right" }}>
                        Order Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedStats.orderHistory.map((order, idx) => (
                      <tr
                        key={idx}
                        style={{ borderBottom: "1px solid #f1f5f9" }}
                      >
                        <td style={styles.tdSmall}>
                          {new Date(order.created_at).toLocaleDateString(
                            "en-AU",
                            { month: "short", day: "numeric", year: "numeric" },
                          )}
                        </td>
                        <td style={styles.tdSmall}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <User size={12} color="#94a3b8" />
                            <span style={{ fontWeight: 600, color: "#334155" }}>
                              {order.customer_name || "Guest"}
                            </span>
                          </div>
                        </td>
                        <td
                          style={{
                            ...styles.tdSmall,
                            textAlign: "right",
                            fontWeight: 700,
                            color: "#059669",
                          }}
                        >
                          ${Number(order.total_amount || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- MAIN HEADER --- */}
      <div style={styles.header}>
        <h3 style={styles.title}>
          <Tag size={20} /> Discount Manager
        </h3>
        {!isFormOpen && (
          <button onClick={handleOpenForm} style={styles.primaryBtn}>
            <Plus size={16} /> Create Code
          </button>
        )}
      </div>

      {/* TAB SYSTEM WITH DYNAMIC COUNTERS */}
      {!isFormOpen && (
        <div style={styles.tabContainer}>
          <button
            onClick={() => setActiveTab("standard")}
            style={{
              ...styles.tabBtn,
              ...(activeTab === "standard"
                ? styles.activeTabBtn
                : styles.inactiveTabBtn),
            }}
          >
            <Ticket size={16} />
            <span>Standard Promo Codes</span>
            <span
              style={{
                background: activeTab === "standard" ? "#dbeafe" : "#f1f5f9",
                color: activeTab === "standard" ? "#1d4ed8" : "#475569",
                padding: "2px 8px",
                borderRadius: "12px",
                fontSize: "0.75rem",
                fontWeight: "bold",
                flexShrink: 0,
              }}
            >
              {tabCounts.standard}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("creator")}
            style={{
              ...styles.tabBtn,
              ...(activeTab === "creator"
                ? styles.activeTabBtn
                : styles.inactiveTabBtn),
            }}
          >
            <Star size={16} />
            <span>Creator / Affiliate Codes</span>
            <span
              style={{
                background: activeTab === "creator" ? "#dbeafe" : "#f1f5f9",
                color: activeTab === "creator" ? "#1d4ed8" : "#475569",
                padding: "2px 8px",
                borderRadius: "12px",
                fontSize: "0.75rem",
                fontWeight: "bold",
                flexShrink: 0,
              }}
            >
              {tabCounts.creator}
            </span>
          </button>
        </div>
      )}

      {/* FORM */}
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
              <div
                style={{
                  padding: "12px",
                  background: formData.is_creator_code ? "#f0fdf4" : "#f8fafc",
                  border: formData.is_creator_code
                    ? "1px solid #bbf7d0"
                    : "1px solid #e2e8f0",
                  borderRadius: "8px",
                  transition: "all 0.2s",
                }}
              >
                <label
                  style={{
                    ...styles.checkboxLabel,
                    color: formData.is_creator_code ? "#166534" : "#475569",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formData.is_creator_code}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        is_creator_code: e.target.checked,
                      })
                    }
                    style={{ width: 16, height: 16 }}
                  />
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontWeight: 700,
                    }}
                  >
                    <Star
                      size={16}
                      className={
                        formData.is_creator_code
                          ? "text-green-600"
                          : "text-gray-400"
                      }
                    />{" "}
                    Mark as Creator/Affiliate Code
                  </span>
                </label>
              </div>

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
              <th style={styles.th}>Usage</th>
              <th style={styles.th}>Status</th>
              <th style={{ ...styles.th, textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayedDiscounts.map((d) => {
              const isLimitReached = d.max_uses && d.usageCount >= d.max_uses;
              return (
                <tr key={d.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={styles.td}>
                    <span
                      style={{
                        fontWeight: 700,
                        fontFamily: "monospace",
                        fontSize: "1.05rem",
                        color: "#0f172a",
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
                      {/* View Stats Button */}
                      <button
                        onClick={() => openStatsModal(d)}
                        style={styles.statsBtn}
                        title="View Performance Stats"
                      >
                        <BarChart2 size={16} />
                      </button>
                      <button
                        onClick={() => handleEdit(d)}
                        style={styles.editBtn}
                        title="Edit Code"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(d.id)}
                        style={styles.deleteBtn}
                        title="Delete Code"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {displayedDiscounts.length === 0 && (
              <tr>
                <td
                  colSpan="5"
                  style={{
                    padding: "40px",
                    textAlign: "center",
                    color: "#94a3b8",
                  }}
                >
                  {activeTab === "creator"
                    ? "No creator codes found. Click 'Create Code' to make one."
                    : "No standard discount codes found. Click 'Create Code' to make one."}
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
    marginBottom: "16px",
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

  tabContainer: {
    display: "flex",
    gap: "8px",
    borderBottom: "2px solid #f1f5f9",
    paddingBottom: "16px",
    marginBottom: "24px",
    flexWrap: "wrap",
  },
  tabBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 16px",
    borderRadius: "8px",
    fontSize: "0.9rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s",
    border: "none",
  },
  activeTabBtn: { background: "#eff6ff", color: "#2563eb" },
  inactiveTabBtn: { background: "transparent", color: "#64748b" },

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

  // Action Buttons
  statsBtn: {
    background: "#f3e8ff",
    border: "1px solid #e9d5ff",
    color: "#9333ea",
    cursor: "pointer",
    padding: 6,
    borderRadius: 4,
    transition: "all 0.2s",
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

  // Modal Styles
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(15, 23, 42, 0.6)",
    backdropFilter: "blur(4px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    padding: "20px",
  },
  modalContent: {
    background: "white",
    borderRadius: "16px",
    width: "100%",
    maxWidth: "700px",
    overflow: "hidden",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "24px",
    borderBottom: "1px solid #e2e8f0",
  },
  statBox: {
    background: "white",
    padding: "16px",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
  statLabel: {
    fontSize: "0.75rem",
    fontWeight: 800,
    color: "#64748b",
    textTransform: "uppercase",
    margin: "0 0 4px 0",
  },
  statValue: {
    fontSize: "1.6rem",
    fontWeight: 900,
    color: "#0f172a",
    margin: 0,
    letterSpacing: "-0.5px",
  },
  thSmall: {
    padding: "12px 16px",
    fontSize: "0.75rem",
    color: "#64748b",
    fontWeight: "800",
    textTransform: "uppercase",
    background: "#f8fafc",
  },
  tdSmall: { padding: "12px 16px", fontSize: "0.85rem", color: "#334155" },
};

// CSS Injection for modal animation
const styleTag = document.createElement("style");
styleTag.innerHTML = `
  .fade-in-ui { opacity: 0; animation: popInUI 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  @keyframes popInUI { 
    0% { opacity: 0; transform: scale(0.98) translateY(10px); } 
    100% { opacity: 1; transform: scale(1) translateY(0); } 
  }
`;
document.head.appendChild(styleTag);
