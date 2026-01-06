import { useState, useEffect, useMemo } from "react";
import { supabase } from "../../lib/supabase";
import {
  Search,
  ExternalLink,
  Edit2, // Added back
  Save, // Added back
  ChevronDown,
  ChevronUp,
  CheckCircle,
  X,
  AlertTriangle,
  Truck,
  MapPin,
  Package,
} from "lucide-react";

export default function OrderManager() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Global Notification State
  const [notification, setNotification] = useState(null);

  // Global Modal State
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
    isDestructive: false,
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) console.error("Error fetching orders:", error);
    else setOrders(data || []);
    setLoading(false);
  };

  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const promptConfirm = (title, message, onConfirm, isDestructive = false) => {
    setModalConfig({
      isOpen: true,
      title,
      message,
      onConfirm: async () => {
        await onConfirm();
        setModalConfig((prev) => ({ ...prev, isOpen: false }));
      },
      isDestructive,
    });
  };

  const stats = useMemo(() => {
    const totalRevenue = orders.reduce(
      (sum, o) => sum + (o.total_amount || 0),
      0
    );
    const pendingCount = orders.filter((o) => o.status === "pending").length;
    return {
      totalRevenue,
      pendingCount,
      totalOrders: orders.length,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.id.toLowerCase().includes(search.toLowerCase()) ||
        order.customer_email?.toLowerCase().includes(search.toLowerCase()) ||
        order.customer_name?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  return (
    <div style={{ position: "relative" }}>
      {/* 1. STATS BAR */}
      <div style={styles.statsContainer}>
        <div style={styles.statItem}>
          <span style={styles.statLabel}>Revenue</span>
          <span style={styles.statValue}>${stats.totalRevenue.toFixed(2)}</span>
        </div>
        <div style={styles.statDivider} />
        <div style={styles.statItem}>
          <span style={styles.statLabel}>Total Orders</span>
          <span style={styles.statValue}>{stats.totalOrders}</span>
        </div>
        <div style={styles.statDivider} />
        <div style={styles.statItem}>
          <span style={styles.statLabel}>Pending</span>
          <span
            style={{
              ...styles.statValue,
              color: stats.pendingCount > 0 ? "#d97706" : "inherit",
            }}
          >
            {stats.pendingCount}
          </span>
        </div>
      </div>

      {/* 2. TOOLBAR */}
      <div style={styles.toolbar}>
        <div style={styles.filterGroup}>
          {["all", "pending", "shipped", "delivered"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              style={{
                ...styles.filterBtn,
                background: statusFilter === status ? "#0f172a" : "white",
                color: statusFilter === status ? "white" : "#64748b",
                borderColor: statusFilter === status ? "#0f172a" : "#e2e8f0",
              }}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        <div style={styles.searchWrapper}>
          <Search size={16} color="#94a3b8" style={{ marginRight: "8px" }} />
          <input
            placeholder="Search email, ID, or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.inputReset}
          />
        </div>
      </div>

      {/* 3. ORDER LIST */}
      <div style={styles.tableContainer}>
        {loading ? (
          <div style={styles.emptyState}>Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div style={styles.emptyState}>
            No orders found matching criteria.
          </div>
        ) : (
          filteredOrders.map((order) => (
            <OrderRow
              key={order.id}
              order={order}
              onUpdate={fetchOrders}
              promptConfirm={promptConfirm}
              showToast={showToast}
            />
          ))
        )}
      </div>

      {/* 4. COMPONENTS: Notification & Modal */}
      {notification && (
        <div style={styles.toast}>
          <CheckCircle size={16} /> {notification}
        </div>
      )}

      {modalConfig.isOpen && (
        <ConfirmationModal
          config={modalConfig}
          onClose={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
        />
      )}
    </div>
  );
}

// --- SUB-COMPONENT: Individual Order Row ---
function OrderRow({ order, onUpdate, promptConfirm, showToast }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form State for Editing
  const [formData, setFormData] = useState({
    status: order.status,
    tracking: order.tracking_number || "",
    address: { ...order.shipping_address },
  });

  // Handle Quick Status Updates (Non-Edit Mode)
  const handleQuickStatus = (newStatus) => {
    promptConfirm(
      "Update Order Status",
      `Are you sure you want to mark this order as ${newStatus.toUpperCase()}?`,
      async () => {
        const { error } = await supabase
          .from("orders")
          .update({ status: newStatus })
          .eq("id", order.id);

        if (error) alert("Error updating status");
        else {
          showToast(`Order marked as ${newStatus}`);
          onUpdate();
        }
      }
    );
  };

  // Handle Full Save (Edit Mode)
  const handleSaveEdit = async () => {
    const { error } = await supabase
      .from("orders")
      .update({
        status: formData.status,
        tracking_number: formData.tracking,
        shipping_address: formData.address,
      })
      .eq("id", order.id);

    if (error) {
      alert("Failed to save order: " + error.message);
    } else {
      showToast("Order details updated");
      setIsEditing(false);
      onUpdate();
    }
  };

  const getStatusStyle = (s) => {
    switch (s) {
      case "pending":
        return { bg: "#fff7ed", color: "#c2410c", border: "#ffedd5" };
      case "shipped":
        return { bg: "#eff6ff", color: "#1d4ed8", border: "#dbeafe" };
      case "delivered":
        return { bg: "#f0fdf4", color: "#15803d", border: "#dcfce7" };
      case "cancelled":
        return { bg: "#fef2f2", color: "#b91c1c", border: "#fecaca" };
      default:
        return { bg: "#f8fafc", color: "#64748b", border: "#e2e8f0" };
    }
  };
  const sStyle = getStatusStyle(order.status);

  return (
    <div style={styles.orderRow}>
      {/* Header */}
      <div
        style={styles.rowHeader}
        onClick={() => !isEditing && setIsExpanded(!isExpanded)}
      >
        <div style={styles.colInfo}>
          <div style={styles.primaryText}>
            {order.customer_name || "Guest"}
            <span style={styles.emailText}> ({order.customer_email})</span>
          </div>
          <div style={styles.metaText}>
            ID:{" "}
            <span style={{ fontFamily: "monospace" }}>
              {order.id.slice(0, 8)}
            </span>{" "}
            • {new Date(order.created_at).toLocaleDateString()}
          </div>
        </div>

        <div style={styles.colStatus}>
          <span
            style={{
              ...styles.badge,
              backgroundColor: sStyle.bg,
              color: sStyle.color,
              borderColor: sStyle.border,
            }}
          >
            {order.status}
          </span>
        </div>

        <div style={styles.colTotal}>${order.total_amount}</div>

        <button style={styles.iconBtn}>
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div style={styles.expandedPanel}>
          {isEditing ? (
            /* --- EDIT MODE --- */
            <div style={styles.panelGrid}>
              {/* 1. Status & Tracking Edit */}
              <div style={styles.detailCol}>
                <label style={styles.label}>Order Status</label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  style={styles.input}
                >
                  <option value="pending">Pending</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <label style={{ ...styles.label, marginTop: 12 }}>
                  Tracking Number
                </label>
                <input
                  value={formData.tracking}
                  onChange={(e) =>
                    setFormData({ ...formData, tracking: e.target.value })
                  }
                  style={styles.input}
                  placeholder="e.g. AusPost ID"
                />
              </div>

              {/* 2. Address Edit */}
              <div style={styles.detailCol}>
                <label style={styles.label}>Shipping Address</label>
                <input
                  value={formData.address?.line1 || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, line1: e.target.value },
                    })
                  }
                  style={{ ...styles.input, marginBottom: 8 }}
                  placeholder="Street Address"
                />
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <input
                    value={formData.address?.city || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, city: e.target.value },
                      })
                    }
                    style={styles.input}
                    placeholder="City"
                  />
                  <input
                    value={formData.address?.state || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, state: e.target.value },
                      })
                    }
                    style={styles.input}
                    placeholder="State"
                  />
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    value={formData.address?.postal_code || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: {
                          ...formData.address,
                          postal_code: e.target.value,
                        },
                      })
                    }
                    style={styles.input}
                    placeholder="Postcode"
                  />
                  <input
                    value={formData.address?.country || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: {
                          ...formData.address,
                          country: e.target.value,
                        },
                      })
                    }
                    style={styles.input}
                    placeholder="Country"
                  />
                </div>
              </div>

              {/* 3. Save/Cancel Actions */}
              <div style={{ ...styles.detailCol, justifyContent: "flex-end" }}>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  <button onClick={handleSaveEdit} style={styles.saveBtn}>
                    <Save size={14} /> Save Changes
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    style={styles.cancelBtn}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* --- VIEW MODE (Default) --- */
            <div style={styles.panelGrid}>
              {/* 1. Tracking */}
              <div style={styles.detailCol}>
                <label style={styles.label}>
                  <Truck size={12} /> Tracking (AusPost)
                </label>
                <div style={styles.trackingContainer}>
                  {order.tracking_number ? (
                    <a
                      href={`https://auspost.com.au/mypost/track/#/details/${order.tracking_number}`}
                      target="_blank"
                      rel="noreferrer"
                      style={styles.trackingLink}
                    >
                      {order.tracking_number} <ExternalLink size={12} />
                    </a>
                  ) : (
                    <span style={styles.mutedText}>Not shipped yet</span>
                  )}
                </div>
              </div>

              {/* 2. Address */}
              <div style={styles.detailCol}>
                <label style={styles.label}>
                  <MapPin size={12} /> Shipping Address
                </label>
                <div style={styles.addressBox}>
                  {order.shipping_address ? (
                    <>
                      {order.shipping_address.line1},{" "}
                      {order.shipping_address.city}
                      <br />
                      {order.shipping_address.state}{" "}
                      {order.shipping_address.postal_code},{" "}
                      {order.shipping_address.country}
                    </>
                  ) : (
                    <span style={styles.mutedText}>No address provided</span>
                  )}
                </div>
              </div>

              {/* 3. Actions */}
              <div
                style={{ ...styles.detailCol, justifyContent: "space-between" }}
              >
                <div>
                  <label style={styles.label}>Quick Status</label>
                  <div
                    style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}
                  >
                    {order.status === "pending" && (
                      <button
                        onClick={() => handleQuickStatus("shipped")}
                        style={styles.actionBtn}
                      >
                        Mark Shipped
                      </button>
                    )}
                    {order.status === "shipped" && (
                      <button
                        onClick={() => handleQuickStatus("delivered")}
                        style={styles.actionBtn}
                      >
                        Mark Delivered
                      </button>
                    )}
                  </div>
                </div>

                {/* THE MISSING EDIT BUTTON */}
                <button
                  onClick={() => setIsEditing(true)}
                  style={styles.secondaryBtn}
                >
                  <Edit2 size={14} /> Edit Order Details
                </button>
              </div>
            </div>
          )}

          {/* 4. Items List (With Price Fix) */}
          {order.items && order.items.length > 0 && (
            <div style={styles.itemsSection}>
              <label style={styles.label}>
                <Package size={12} /> Order Items
              </label>
              <div style={styles.itemsTable}>
                {order.items.map((item, idx) => {
                  let price = 0;
                  if (item.amount_total) price = item.amount_total / 100;
                  else price = item.total || 0;

                  return (
                    <div key={idx} style={styles.itemRow}>
                      <span style={styles.itemQty}>{item.quantity}x</span>
                      <span style={styles.itemName}>
                        {item.description || item.name}
                      </span>
                      <span style={styles.itemPrice}>${price.toFixed(2)}</span>
                    </div>
                  );
                })}
                <div style={styles.summaryRow}>
                  <span>Shipping</span>
                  <span>${order.shipping_cost || "0.00"}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- SUB-COMPONENT: Custom Modal ---
function ConfirmationModal({ config, onClose }) {
  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContent}>
        <div style={styles.modalHeader}>
          {config.isDestructive ? (
            <AlertTriangle size={20} color="#ef4444" />
          ) : (
            <div />
          )}
          <h3 style={styles.modalTitle}>{config.title}</h3>
        </div>
        <p style={styles.modalMessage}>{config.message}</p>
        <div style={styles.modalActions}>
          <button onClick={onClose} style={styles.modalCancel}>
            Cancel
          </button>
          <button
            onClick={config.onConfirm}
            style={
              config.isDestructive ? styles.modalDelete : styles.modalConfirm
            }
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

// --- STYLES ---
const styles = {
  statsContainer: {
    display: "flex",
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "16px 24px",
    marginBottom: "24px",
    alignItems: "center",
    boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
  },
  statItem: { display: "flex", flexDirection: "column", gap: "2px" },
  statDivider: {
    width: "1px",
    height: "32px",
    background: "#e2e8f0",
    margin: "0 30px",
  },
  statLabel: {
    fontSize: "0.75rem",
    color: "#64748b",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  statValue: {
    fontSize: "1.25rem",
    fontWeight: "700",
    color: "#0f172a",
    lineHeight: "1.2",
  },

  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
    flexWrap: "wrap",
    gap: "12px",
  },
  filterGroup: { display: "flex", gap: "8px" },
  filterBtn: {
    border: "1px solid",
    padding: "6px 12px",
    borderRadius: "6px",
    fontSize: "0.85rem",
    cursor: "pointer",
    transition: "all 0.2s",
    fontWeight: "500",
  },
  searchWrapper: {
    display: "flex",
    alignItems: "center",
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    padding: "6px 12px",
    width: "280px",
  },
  inputReset: {
    border: "none",
    outline: "none",
    background: "transparent",
    width: "100%",
    fontSize: "0.9rem",
    color: "#0f172a",
  },

  tableContainer: { display: "flex", flexDirection: "column", gap: "12px" },
  emptyState: { padding: "40px", textAlign: "center", color: "#64748b" },

  orderRow: {
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    overflow: "hidden",
    transition: "box-shadow 0.2s",
  },
  rowHeader: {
    padding: "16px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    cursor: "pointer",
  },
  colInfo: { flex: 1 },
  primaryText: { fontWeight: "600", color: "#0f172a", fontSize: "0.95rem" },
  emailText: { fontWeight: "400", color: "#64748b", fontSize: "0.9rem" },
  metaText: { fontSize: "0.8rem", color: "#94a3b8", marginTop: "4px" },
  colStatus: { width: "120px", textAlign: "center" },
  badge: {
    fontSize: "0.75rem",
    padding: "4px 10px",
    borderRadius: "4px",
    border: "1px solid",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  colTotal: {
    width: "100px",
    textAlign: "right",
    fontWeight: "700",
    color: "#0f172a",
  },
  iconBtn: {
    background: "transparent",
    border: "none",
    color: "#64748b",
    cursor: "pointer",
    padding: "4px",
  },

  expandedPanel: {
    background: "#f8fafc",
    borderTop: "1px solid #e2e8f0",
    padding: "24px",
  },
  panelGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "24px",
    marginBottom: "20px",
  },
  detailCol: { display: "flex", flexDirection: "column" },
  label: {
    fontSize: "0.75rem",
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: "8px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },

  trackingContainer: { display: "flex", alignItems: "center", gap: "8px" },
  input: {
    padding: "8px 10px",
    borderRadius: "4px",
    border: "1px solid #cbd5e1",
    fontSize: "0.85rem",
    width: "100%",
    background: "white",
  },
  saveBtn: {
    background: "#0f172a",
    color: "white",
    border: "none",
    borderRadius: "4px",
    padding: "8px 16px",
    fontSize: "0.85rem",
    cursor: "pointer",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  cancelBtn: {
    background: "white",
    color: "#64748b",
    border: "1px solid #cbd5e1",
    borderRadius: "4px",
    padding: "8px 16px",
    fontSize: "0.85rem",
    cursor: "pointer",
    fontWeight: "500",
  },
  trackingLink: {
    color: "#2563eb",
    textDecoration: "none",
    fontWeight: "600",
    fontSize: "0.9rem",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },

  addressBox: {
    fontSize: "0.9rem",
    color: "#334155",
    lineHeight: "1.5",
    background: "white",
    padding: "10px",
    borderRadius: "4px",
    border: "1px solid #e2e8f0",
  },
  mutedText: { fontStyle: "italic", color: "#94a3b8" },

  actionBtn: {
    background: "white",
    border: "1px solid #cbd5e1",
    color: "#0f172a",
    borderRadius: "4px",
    padding: "6px 12px",
    fontSize: "0.8rem",
    cursor: "pointer",
    fontWeight: "500",
    transition: "all 0.1s hover",
  },
  secondaryBtn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "none",
    border: "1px solid #64748b",
    color: "#64748b",
    borderRadius: "4px",
    padding: "6px 12px",
    fontSize: "0.8rem",
    cursor: "pointer",
    fontWeight: "500",
    marginTop: 8,
  },

  itemsSection: { borderTop: "1px solid #e2e8f0", paddingTop: "20px" },
  itemsTable: {
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    overflow: "hidden",
  },
  itemRow: {
    display: "flex",
    padding: "10px 16px",
    borderBottom: "1px solid #f1f5f9",
    fontSize: "0.9rem",
  },
  itemQty: { width: "40px", color: "#64748b" },
  itemName: { flex: 1, fontWeight: "500", color: "#334155" },
  itemPrice: { fontWeight: "500", color: "#0f172a" },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 16px",
    background: "#f8fafc",
    fontWeight: "600",
    fontSize: "0.9rem",
    color: "#64748b",
  },

  // Modal & Toast Styles
  toast: {
    position: "fixed",
    bottom: "24px",
    right: "24px",
    background: "#10b981",
    color: "white",
    padding: "12px 20px",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontWeight: "500",
    zIndex: 100,
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 50,
    backdropFilter: "blur(2px)",
  },
  modalContent: {
    background: "white",
    padding: "24px",
    borderRadius: "12px",
    width: "100%",
    maxWidth: "400px",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
  },
  modalHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "12px",
  },
  modalTitle: {
    fontSize: "1.1rem",
    fontWeight: "600",
    color: "#0f172a",
    margin: 0,
  },
  modalMessage: { color: "#64748b", marginBottom: "24px", lineHeight: "1.5" },
  modalActions: { display: "flex", gap: "12px", justifyContent: "flex-end" },
  modalCancel: {
    padding: "8px 16px",
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
    background: "white",
    color: "#64748b",
    cursor: "pointer",
    fontWeight: "500",
  },
  modalConfirm: {
    padding: "8px 16px",
    borderRadius: "6px",
    border: "none",
    background: "#0f172a",
    color: "white",
    cursor: "pointer",
    fontWeight: "500",
  },
  modalDelete: {
    padding: "8px 16px",
    borderRadius: "6px",
    border: "none",
    background: "#ef4444",
    color: "white",
    cursor: "pointer",
    fontWeight: "500",
  },
};
