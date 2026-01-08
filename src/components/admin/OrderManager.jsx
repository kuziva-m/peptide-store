import { useState, useEffect, useMemo } from "react";
import { supabase } from "../../lib/supabase";
import {
  Search,
  ExternalLink,
  Edit2,
  Save,
  ChevronDown,
  ChevronUp,
  Truck,
  MapPin,
  Package,
  Phone,
  Mail,
  User,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

export default function OrderManager() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [notification, setNotification] = useState(null);

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
      .select(
        `
        *,
        order_items (
          quantity,
          price_at_purchase,
          product_name_snapshot,
          variants (
            size_label,
            products (
              name,
              image_url
            )
          )
        )
      `
      )
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
    return { totalRevenue, pendingCount, totalOrders: orders.length };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const s = search.toLowerCase();
      const matchesSearch =
        order.id.toLowerCase().includes(s) ||
        order.customer_email?.toLowerCase().includes(s) ||
        order.customer_name?.toLowerCase().includes(s);

      const matchesStatus =
        statusFilter === "all" || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  return (
    <div style={{ position: "relative" }}>
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
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.inputReset}
          />
        </div>
      </div>

      <div style={styles.tableContainer}>
        {loading ? (
          <div style={styles.emptyState}>Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div style={styles.emptyState}>No orders found.</div>
        ) : (
          filteredOrders.map((order) => (
            <OrderRow
              key={order.id}
              order={order}
              onUpdate={fetchOrders}
              showToast={showToast}
              promptConfirm={promptConfirm}
            />
          ))
        )}
      </div>

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

function OrderRow({ order, onUpdate, showToast, promptConfirm }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    status: order.status,
    tracking: order.tracking_number || "",
    address: { ...order.shipping_address },
  });

  // --- Send Status Email ---
  const sendStatusEmail = async (tracking, statusType) => {
    try {
      const rawItems =
        order.order_items && order.order_items.length > 0
          ? order.order_items
          : order.items;

      const emailItems = rawItems.map((item) => {
        let name =
          item.product_name_snapshot ||
          item.description ||
          item.name ||
          "Unknown Product";
        let size = "";
        if (item.variants && item.variants.products) {
          name = item.variants.products.name;
          size = item.variants.size_label;
        }
        return { name, quantity: item.quantity, size };
      });

      const emailAddress = {
        ...order.shipping_address,
        phone: order.shipping_address?.phone || "N/A",
      };

      // DYNAMICALLY CHOOSE THE FUNCTION
      const functionName =
        statusType === "delivered"
          ? "send-delivered-update"
          : "send-order-update";

      await supabase.functions.invoke(functionName, {
        body: {
          orderId: order.id,
          email: order.customer_email,
          name: order.customer_name,
          trackingNumber: tracking,
          items: emailItems,
          address: emailAddress,
          status: statusType,
        },
      });
      showToast(
        `${statusType === "delivered" ? "Delivery" : "Shipping"} email sent!`
      );
    } catch (err) {
      console.error("Failed to send email", err);
      showToast("Error sending email, check console");
    }
  };

  // --- SAVE BUTTON (Edit Mode) ---
  const handleSave = async () => {
    const newStatus = formData.status;
    const isMarkingShipped =
      newStatus === "shipped" && order.status !== "shipped";
    const isMarkingDelivered =
      newStatus === "delivered" && order.status !== "delivered";

    if (isMarkingShipped || isMarkingDelivered) {
      const actionType = isMarkingShipped ? "SHIPPED" : "DELIVERED";
      promptConfirm(
        `Confirm ${actionType}`,
        `You are marking this order as ${actionType}. This will automatically send an email notification to ${order.customer_email}. Proceed?`,
        async () => {
          await executeUpdate(true, newStatus);
        }
      );
    } else {
      await executeUpdate(false, newStatus);
    }
  };

  const executeUpdate = async (shouldSendEmail, statusType) => {
    const { error } = await supabase
      .from("orders")
      .update({
        status: formData.status,
        tracking_number: formData.tracking,
        shipping_address: formData.address,
      })
      .eq("id", order.id);

    if (error) {
      alert(error.message);
    } else {
      showToast("Order updated");
      if (shouldSendEmail) {
        await sendStatusEmail(formData.tracking, statusType);
      }
      setIsEditing(false);
      onUpdate();
    }
  };

  // --- QUICK BUTTONS (View Mode) ---
  const handleQuickStatus = (newStatus) => {
    const isMarkingShipped = newStatus === "shipped";
    const isMarkingDelivered = newStatus === "delivered";

    let message = `Are you sure you want to mark this order as ${newStatus.toUpperCase()}?`;

    if (isMarkingShipped) {
      message = `Mark as SHIPPED? ⚠️ This will send a 'Shipped' email to ${order.customer_email}. Ensure tracking is correct.`;
    } else if (isMarkingDelivered) {
      message = `Mark as DELIVERED? ⚠️ This will send a 'Delivered' email to ${order.customer_email}.`;
    }

    promptConfirm("Update Order Status", message, async () => {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", order.id);
      if (error) alert("Error updating status");
      else {
        showToast(`Order marked as ${newStatus}`);
        if (isMarkingShipped || isMarkingDelivered) {
          await sendStatusEmail(order.tracking_number, newStatus);
        }
        onUpdate();
      }
    });
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
      {/* HEADER */}
      <div
        style={styles.rowHeader}
        onClick={() => !isEditing && setIsExpanded(!isExpanded)}
      >
        <div style={styles.colInfo}>
          <div style={styles.primaryText}>{order.customer_name || "Guest"}</div>
          <div style={styles.metaText}>
            #{order.id.slice(0, 8)} •{" "}
            {new Date(order.created_at).toLocaleDateString()}
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

      {/* EXPANDED DETAILS */}
      {isExpanded && (
        <div style={styles.expandedPanel}>
          <div style={styles.sectionTitle}>
            <User size={14} /> Customer Details
          </div>
          <div style={styles.customerGrid}>
            <div style={styles.customerItem}>
              <Mail size={14} color="#64748b" />
              <span style={{ fontWeight: 500 }}>{order.customer_email}</span>
            </div>
            <div style={styles.customerItem}>
              <Phone size={14} color="#64748b" />
              <span>
                {order.shipping_address?.phone || "No phone provided"}
              </span>
            </div>
            <div style={{ ...styles.customerItem, gridColumn: "span 2" }}>
              <MapPin size={14} color="#64748b" />
              <span>
                {order.shipping_address
                  ? `${order.shipping_address.line1}, ${order.shipping_address.city} ${order.shipping_address.postal_code}, ${order.shipping_address.state}`
                  : "No address provided"}
              </span>
            </div>
          </div>

          <div
            style={{ margin: "20px 0", borderTop: "1px solid #e2e8f0" }}
          ></div>

          <div style={styles.panelGrid}>
            {/* ITEMS LIST */}
            <div style={{ gridColumn: "span 2" }}>
              <div style={styles.sectionTitle}>
                <Package size={14} /> Items Ordered
              </div>
              <div style={styles.itemsTable}>
                <div style={styles.tableHeader}>
                  <span style={{ width: 50 }}>Qty</span>
                  <span style={{ flex: 1 }}>Product</span>
                  <span style={{ width: 80, textAlign: "right" }}>Price</span>
                </div>
                {(order.order_items && order.order_items.length > 0
                  ? order.order_items
                  : order.items
                ).map((item, i) => {
                  let name =
                    item.product_name_snapshot ||
                    item.description ||
                    item.name ||
                    "Unknown Product";
                  let size = "";
                  if (item.variants && item.variants.products) {
                    name = item.variants.products.name;
                    size = item.variants.size_label;
                  }

                  return (
                    <div key={i} style={styles.itemRow}>
                      <span style={styles.itemQty}>{item.quantity}x</span>
                      <div style={styles.itemInfo}>
                        <span style={styles.itemName}>{name}</span>
                        {size && (
                          <span style={styles.variantLabel}>{size}</span>
                        )}
                      </div>
                      <span style={styles.itemPrice}>
                        $
                        {(
                          item.price_at_purchase ||
                          item.unit_price ||
                          item.amount_total / 100 ||
                          0
                        ).toFixed(2)}
                      </span>
                    </div>
                  );
                })}
                <div style={styles.summaryRow}>
                  <span>Shipping</span>
                  <span>${order.shipping_cost || "0.00"}</span>
                </div>
              </div>
            </div>

            {/* ACTIONS */}
            <div style={styles.detailCol}>
              <div style={styles.sectionTitle}>
                <Edit2 size={14} /> Manage
              </div>
              {isEditing ? (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
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
                  <input
                    placeholder="Tracking #"
                    value={formData.tracking}
                    onChange={(e) =>
                      setFormData({ ...formData, tracking: e.target.value })
                    }
                    style={styles.input}
                  />
                  <div style={{ display: "flex", gap: 5 }}>
                    <button onClick={handleSave} style={styles.saveBtn}>
                      <Save size={14} /> Save
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      style={styles.cancelBtn}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    height: "100%",
                  }}
                >
                  <div style={styles.trackingBox}>
                    {order.tracking_number ? (
                      <a
                        href={`https://auspost.com.au/mypost/track/#/details/${order.tracking_number}`}
                        target="_blank"
                        style={styles.trackingLink}
                      >
                        {order.tracking_number} <ExternalLink size={12} />
                      </a>
                    ) : (
                      <span style={{ color: "#94a3b8", fontStyle: "italic" }}>
                        No Tracking
                      </span>
                    )}
                  </div>

                  <div style={{ marginTop: "auto" }}>
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
                    <button
                      onClick={() => setIsEditing(true)}
                      style={styles.secondaryBtn}
                    >
                      Edit Details
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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

const styles = {
  statsContainer: {
    display: "flex",
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "16px 24px",
    marginBottom: "24px",
    alignItems: "center",
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
  },
  statValue: { fontSize: "1.25rem", fontWeight: "700", color: "#0f172a" },
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
  },
  tableContainer: { display: "flex", flexDirection: "column", gap: "12px" },
  emptyState: { padding: "40px", textAlign: "center", color: "#64748b" },
  orderRow: {
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    overflow: "hidden",
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
  metaText: { fontSize: "0.8rem", color: "#94a3b8", marginTop: "4px" },
  colStatus: { width: "120px", textAlign: "center" },
  badge: {
    fontSize: "0.75rem",
    padding: "4px 10px",
    borderRadius: "4px",
    border: "1px solid",
    fontWeight: "600",
    textTransform: "uppercase",
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
  panelGrid: { display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" },
  customerGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "15px",
    background: "white",
    padding: "15px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
  },
  customerItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "0.9rem",
    color: "#334155",
  },
  sectionTitle: {
    fontSize: "0.75rem",
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: "10px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },

  itemsTable: {
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    overflow: "hidden",
  },
  tableHeader: {
    display: "flex",
    padding: "8px 16px",
    background: "#f1f5f9",
    fontSize: "0.75rem",
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },

  itemRow: {
    display: "grid",
    gridTemplateColumns: "50px 1fr 80px",
    padding: "12px 16px",
    borderBottom: "1px solid #f1f5f9",
    fontSize: "0.9rem",
    alignItems: "center",
  },

  itemQty: { color: "#64748b", fontWeight: "500" },
  itemInfo: { display: "flex", flexDirection: "column" },
  itemName: { fontWeight: "500", color: "#334155" },
  variantLabel: {
    fontSize: "0.75rem",
    color: "#64748b",
    fontWeight: 600,
    marginTop: 2,
  },
  itemPrice: { fontWeight: "600", color: "#0f172a", textAlign: "right" },

  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 16px",
    background: "#f8fafc",
    fontWeight: "600",
    fontSize: "0.9rem",
    color: "#64748b",
  },
  input: {
    padding: "8px",
    borderRadius: "4px",
    border: "1px solid #cbd5e1",
    fontSize: "0.85rem",
    width: "100%",
  },
  saveBtn: {
    background: "#0f172a",
    color: "white",
    border: "none",
    borderRadius: "4px",
    padding: "8px 12px",
    fontSize: "0.85rem",
    cursor: "pointer",
    fontWeight: "600",
    flex: 1,
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
    padding: "8px 12px",
    fontSize: "0.85rem",
    cursor: "pointer",
    flex: 1,
  },
  secondaryBtn: {
    width: "100%",
    padding: "8px",
    background: "white",
    border: "1px solid #cbd5e1",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.85rem",
    marginTop: 8,
  },
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
  trackingBox: {
    padding: "10px",
    background: "#f1f5f9",
    borderRadius: "4px",
    textAlign: "center",
    fontSize: "0.9rem",
  },
  trackingLink: {
    color: "#2563eb",
    textDecoration: "none",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "4px",
  },
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
  detailCol: { display: "flex", flexDirection: "column" },
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
