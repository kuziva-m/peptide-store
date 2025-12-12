import { useState, useEffect, useMemo } from "react";
import { supabase } from "../../lib/supabase";
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  Search,
  ExternalLink,
  Save,
  TrendingUp,
  DollarSign,
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
    // Fetch orders sorted by newest first
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) console.error("Error fetching orders:", error);
    else setOrders(data || []);
    setLoading(false);
  };

  // --- ANALYTICS CALCULATIONS ---
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

  // --- FILTERING ---
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
      {/* 1. ANALYTICS DASHBOARD */}
      <div style={styles.statsGrid}>
        <StatCard
          icon={<DollarSign />}
          label="Total Revenue"
          value={`$${stats.totalRevenue.toFixed(2)}`}
          color="#10b981"
        />
        <StatCard
          icon={<Package />}
          label="Total Orders"
          value={stats.totalOrders}
          color="#6366f1"
        />
        <StatCard
          icon={<Clock />}
          label="Pending"
          value={stats.pendingCount}
          color="#f59e0b"
        />
        <StatCard
          icon={<Truck />}
          label="Shipped"
          value={stats.shippedCount}
          color="#3b82f6"
        />
      </div>

      {/* 2. TOOLBAR */}
      <div style={styles.toolbar}>
        <div style={styles.searchWrapper}>
          <Search size={18} color="#64748b" />
          <input
            placeholder="Search Order ID, Email or Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          {["all", "pending", "shipped", "delivered"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              style={{
                ...styles.filterBtn,
                background:
                  statusFilter === status ? "var(--medical-navy)" : "white",
                color: statusFilter === status ? "white" : "#64748b",
              }}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* 3. ORDER LIST */}
      <div style={styles.orderList}>
        {loading ? (
          <p>Loading orders...</p>
        ) : (
          filteredOrders.map((order) => (
            <OrderRow key={order.id} order={order} onUpdate={fetchOrders} />
          ))
        )}
        {!loading && filteredOrders.length === 0 && (
          <div
            style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}
          >
            No orders found.
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div style={styles.statCard}>
      <div
        style={{ ...styles.iconBox, background: `${color}20`, color: color }}
      >
        {icon}
      </div>
      <div>
        <div style={{ fontSize: "0.85rem", color: "#64748b" }}>{label}</div>
        <div
          style={{ fontSize: "1.5rem", fontWeight: "700", color: "#0f172a" }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

function OrderRow({ order, onUpdate }) {
  const [tracking, setTracking] = useState(order.tracking_number || "");
  const [isEditing, setIsEditing] = useState(false);

  const handleUpdateStatus = async (newStatus) => {
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
        status: "shipped", // Auto-move to shipped when tracking added
      })
      .eq("id", order.id);
    setIsEditing(false);
    onUpdate();
  };

  const statusColors = {
    pending: { bg: "#fef3c7", text: "#d97706" },
    shipped: { bg: "#dbeafe", text: "#2563eb" },
    delivered: { bg: "#dcfce7", text: "#16a34a" },
  };

  return (
    <div style={styles.orderCard}>
      <div style={styles.orderHeader}>
        <div>
          <h4 style={{ margin: 0 }}>
            {order.customer_name || "Guest Customer"}
          </h4>
          <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
            {order.customer_email}
          </span>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontWeight: "bold" }}>${order.total_amount}</div>
          <span
            style={{
              fontSize: "0.75rem",
              padding: "4px 8px",
              borderRadius: "4px",
              fontWeight: "600",
              backgroundColor: statusColors[order.status]?.bg,
              color: statusColors[order.status]?.text,
            }}
          >
            {order.status.toUpperCase()}
          </span>
        </div>
      </div>

      <div style={{ margin: "15px 0", fontSize: "0.9rem", color: "#334155" }}>
        <strong>Order ID:</strong>{" "}
        <span style={{ fontFamily: "monospace" }}>{order.id}</span>
        <br />
        <strong>Date:</strong> {new Date(order.created_at).toLocaleDateString()}
      </div>

      {/* TRACKING SECTION */}
      <div style={styles.trackingSection}>
        {isEditing || !order.tracking_number ? (
          <div style={{ display: "flex", gap: "10px", width: "100%" }}>
            <input
              placeholder="AusPost Tracking Number"
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
              style={styles.input}
            />
            <button onClick={handleSaveTracking} style={styles.saveBtn}>
              <Save size={16} /> Save & Ship
            </button>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
            }}
          >
            <div>
              <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                Tracking Number:
              </span>
              <div
                style={{
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                {order.tracking_number}
                <a
                  href={`https://auspost.com.au/mypost/track/#/details/${order.tracking_number}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "var(--primary)" }}
                >
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
            <button
              onClick={() => setIsEditing(true)}
              style={{
                fontSize: "0.8rem",
                color: "#64748b",
                background: "none",
                border: "none",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Edit
            </button>
          </div>
        )}
      </div>

      {/* ACTIONS */}
      <div
        style={{
          marginTop: "15px",
          paddingTop: "15px",
          borderTop: "1px solid #f1f5f9",
          display: "flex",
          gap: "10px",
        }}
      >
        {order.status === "pending" && (
          <button
            onClick={() => handleUpdateStatus("shipped")}
            style={styles.actionBtn}
          >
            Mark Sent
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
  );
}

const styles = {
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "20px",
    marginBottom: "30px",
  },
  statCard: {
    background: "white",
    padding: "20px",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  iconBox: {
    width: "48px",
    height: "48px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "20px",
    flexWrap: "wrap",
    gap: "15px",
  },
  searchWrapper: {
    display: "flex",
    alignItems: "center",
    background: "white",
    padding: "0 12px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    flex: 1,
    minWidth: "250px",
  },
  searchInput: {
    border: "none",
    padding: "10px",
    outline: "none",
    width: "100%",
  },
  filterBtn: {
    padding: "8px 16px",
    borderRadius: "20px",
    border: "1px solid #e2e8f0",
    cursor: "pointer",
    fontSize: "0.9rem",
  },
  orderList: { display: "grid", gap: "20px" },
  orderCard: {
    background: "white",
    padding: "24px",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
  },
  orderHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  trackingSection: {
    background: "#f8fafc",
    padding: "15px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
  },
  input: {
    flex: 1,
    padding: "8px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
  },
  saveBtn: {
    display: "flex",
    gap: "6px",
    alignItems: "center",
    background: "var(--primary)",
    color: "white",
    border: "none",
    padding: "8px 16px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "600",
  },
  actionBtn: {
    padding: "8px 12px",
    background: "white",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.85rem",
  },
};
