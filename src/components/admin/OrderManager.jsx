import { useState, useEffect, useMemo } from "react";
import { supabase } from "../../lib/supabase";
import {
  Search,
  ExternalLink,
  Save,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Package,
} from "lucide-react";

export default function OrderManager() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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

  const stats = useMemo(() => {
    const totalRevenue = orders.reduce(
      (sum, o) => sum + (o.total_amount || 0),
      0
    );
    const pendingCount = orders.filter((o) => o.status === "pending").length;
    const shippedCount = orders.filter((o) => o.status === "shipped").length;
    return {
      totalRevenue,
      pendingCount,
      shippedCount,
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
    <div>
      {/* 1. CLEAN STATS BAR (Matches ProductManager style) */}
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

      {/* 2. FILTERS & SEARCH */}
      <div style={styles.toolbar}>
        <div style={styles.filterGroup}>
          {["all", "pending", "shipped", "delivered"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              style={{
                ...styles.filterBtn,
                background:
                  statusFilter === status ? "var(--medical-navy)" : "white",
                color: statusFilter === status ? "white" : "#64748b",
                borderColor:
                  statusFilter === status ? "var(--medical-navy)" : "#e2e8f0",
              }}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        <div style={styles.searchWrapper}>
          <Search size={16} color="#64748b" style={{ marginRight: "8px" }} />
          <input
            placeholder="Search email, ID, or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.inputReset}
          />
        </div>
      </div>

      {/* 3. DATA TABLE LIST */}
      <div style={styles.tableContainer}>
        {loading ? (
          <div
            style={{ padding: "40px", textAlign: "center", color: "#64748b" }}
          >
            Loading orders...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div
            style={{ padding: "40px", textAlign: "center", color: "#64748b" }}
          >
            No orders found matching criteria.
          </div>
        ) : (
          filteredOrders.map((order) => (
            <OrderRow key={order.id} order={order} onUpdate={fetchOrders} />
          ))
        )}
      </div>
    </div>
  );
}

function OrderRow({ order, onUpdate }) {
  const [tracking, setTracking] = useState(order.tracking_number || "");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleUpdateStatus = async (newStatus) => {
    if (!confirm(`Mark order as ${newStatus}?`)) return;
    await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", order.id);
    onUpdate();
  };

  const handleSaveTracking = async () => {
    await supabase
      .from("orders")
      .update({
        tracking_number: tracking,
        status: "shipped",
      })
      .eq("id", order.id);
    setIsEditing(false);
    onUpdate();
  };

  // Status Badge Logic
  const getStatusStyle = (s) => {
    switch (s) {
      case "pending":
        return { bg: "#fff7ed", color: "#c2410c", border: "#ffedd5" };
      case "shipped":
        return { bg: "#eff6ff", color: "#1d4ed8", border: "#dbeafe" };
      case "delivered":
        return { bg: "#f0fdf4", color: "#15803d", border: "#dcfce7" };
      default:
        return { bg: "#f8fafc", color: "#64748b", border: "#e2e8f0" };
    }
  };
  const sStyle = getStatusStyle(order.status);

  return (
    <div style={styles.orderRow}>
      {/* HEADER ROW (Always Visible) */}
      <div style={styles.rowHeader}>
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
              fontSize: "0.75rem",
              padding: "4px 10px",
              borderRadius: "4px",
              backgroundColor: sStyle.bg,
              color: sStyle.color,
              border: `1px solid ${sStyle.border}`,
              fontWeight: "600",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            {order.status}
          </span>
        </div>

        <div style={styles.colTotal}>${order.total_amount}</div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={styles.iconBtn}
        >
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {/* EXPANDED DETAILS */}
      {isExpanded && (
        <div style={styles.expandedPanel}>
          <div style={styles.panelGrid}>
            {/* Tracking Column */}
            <div>
              <label style={styles.label}>Tracking (Australia Post)</label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginTop: "4px",
                }}
              >
                {isEditing || !order.tracking_number ? (
                  <>
                    <input
                      placeholder="Enter Tracking #"
                      value={tracking}
                      onChange={(e) => setTracking(e.target.value)}
                      style={styles.inputSmall}
                    />
                    <button onClick={handleSaveTracking} style={styles.saveBtn}>
                      Save
                    </button>
                  </>
                ) : (
                  <>
                    <a
                      href={`https://auspost.com.au/mypost/track/#/details/${order.tracking_number}`}
                      target="_blank"
                      rel="noreferrer"
                      style={styles.trackingLink}
                    >
                      {order.tracking_number} <ExternalLink size={12} />
                    </a>
                    <button
                      onClick={() => setIsEditing(true)}
                      style={styles.textBtn}
                    >
                      Change
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Address Column */}
            <div>
              <label style={styles.label}>Shipping Address</label>
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
                  <span style={{ fontStyle: "italic", color: "#94a3b8" }}>
                    No address data
                  </span>
                )}
              </div>
            </div>

            {/* Actions Column */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                gap: "8px",
              }}
            >
              <label style={styles.label}>Move Status</label>
              <div style={{ display: "flex", gap: "8px" }}>
                {order.status === "pending" && (
                  <button
                    onClick={() => handleUpdateStatus("shipped")}
                    style={styles.actionBtn}
                  >
                    Mark Shipped
                  </button>
                )}
                {order.status === "shipped" && (
                  <button
                    onClick={() => handleUpdateStatus("delivered")}
                    style={styles.actionBtn}
                  >
                    Mark Delivered
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Items List (Optional if stored) */}
          {order.items && order.items.length > 0 && (
            <div
              style={{
                marginTop: "16px",
                paddingTop: "16px",
                borderTop: "1px solid #f1f5f9",
              }}
            >
              <label style={styles.label}>Items Ordered</label>
              <ul
                style={{
                  margin: "4px 0 0 20px",
                  padding: 0,
                  fontSize: "0.9rem",
                  color: "#334155",
                }}
              >
                {order.items.map((item, idx) => (
                  <li key={idx}>
                    {item.quantity}x <strong>{item.description}</strong>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
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
    boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
  },
  statItem: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
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
  filterGroup: {
    display: "flex",
    gap: "8px",
  },
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
  tableContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
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
  },
  colInfo: { flex: 1 },
  primaryText: { fontWeight: "600", color: "#0f172a", fontSize: "0.95rem" },
  emailText: { fontWeight: "400", color: "#64748b", fontSize: "0.9rem" },
  metaText: { fontSize: "0.8rem", color: "#94a3b8", marginTop: "4px" },
  colStatus: { width: "120px", textAlign: "center" },
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
    display: "flex",
    alignItems: "center",
  },
  expandedPanel: {
    background: "#f8fafc",
    borderTop: "1px solid #e2e8f0",
    padding: "20px",
  },
  panelGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "24px",
  },
  label: {
    fontSize: "0.75rem",
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: "6px",
    display: "block",
  },
  inputSmall: {
    padding: "6px 10px",
    borderRadius: "4px",
    border: "1px solid #cbd5e1",
    fontSize: "0.85rem",
    flex: 1,
  },
  saveBtn: {
    background: "var(--medical-navy)",
    color: "white",
    border: "none",
    borderRadius: "4px",
    padding: "6px 12px",
    fontSize: "0.85rem",
    cursor: "pointer",
    fontWeight: "600",
  },
  trackingLink: {
    color: "var(--primary)",
    textDecoration: "none",
    fontWeight: "600",
    fontSize: "0.9rem",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  textBtn: {
    background: "none",
    border: "none",
    color: "#64748b",
    fontSize: "0.8rem",
    cursor: "pointer",
    textDecoration: "underline",
  },
  addressBox: {
    fontSize: "0.9rem",
    color: "#334155",
    lineHeight: "1.5",
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
  },
};
