import { useState, useEffect, useMemo } from "react";
import { supabase } from "../../lib/supabase";
import { downloadAusPostCSV } from "../../utils/exportToAusPost";
import { styles } from "./OrderManagerStyles";
// FIXED: Removed ConfirmationModal from import
import { OrderRow } from "./OrderRow";
import {
  Search,
  Download,
  CheckCircle,
  Package,
  AlertTriangle,
} from "lucide-react";

export default function OrderManager() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("live");
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
        `*, order_items (quantity, price_at_purchase, product_name_snapshot, variants (size_label, products (name, image_url)))`
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
      isDestructive,
      onConfirm: async () => {
        await onConfirm();
        setModalConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // --- FILTERING LOGIC ---
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // 1. Identify "Ghost" (Abandoned) Orders
      const isGhost = order.status === "pending" && !order.customer_name;

      // 2. Tab Logic
      if (activeTab === "abandoned") {
        if (!isGhost) return false;
      } else {
        if (isGhost) return false;
      }

      // 3. Search Logic
      const s = search.toLowerCase();
      const matchesSearch =
        order.id.toLowerCase().includes(s) ||
        order.customer_email?.toLowerCase().includes(s) ||
        order.customer_name?.toLowerCase().includes(s);

      // 4. Status Logic
      const matchesStatus =
        statusFilter === "all" || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter, activeTab]);

  // --- STATS LOGIC ---
  const stats = useMemo(() => {
    const liveOrders = orders.filter(
      (o) => !(o.status === "pending" && !o.customer_name)
    );

    const totalRevenue = liveOrders.reduce(
      (sum, o) => sum + (o.total_amount || 0),
      0
    );
    const pendingCount = liveOrders.filter(
      (o) => o.status === "pending"
    ).length;
    const abandonedCount = orders.filter(
      (o) => o.status === "pending" && !o.customer_name
    ).length;

    return {
      totalRevenue,
      pendingCount,
      totalOrders: liveOrders.length,
      abandonedCount,
    };
  }, [orders]);

  const handleBulkExport = () => {
    if (filteredOrders.length === 0) return showToast("No orders to export");
    downloadAusPostCSV(filteredOrders);
    showToast(`Exported ${filteredOrders.length} orders`);
  };

  return (
    <div style={{ position: "relative" }}>
      {/* STATS BAR */}
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
          <span style={styles.statLabel}>Pending Actions</span>
          <span
            style={{
              ...styles.statValue,
              color: stats.pendingCount > 0 ? "#d97706" : "inherit",
            }}
          >
            {stats.pendingCount}
          </span>
        </div>
        <div style={styles.statDivider} />
        <div style={styles.statItem}>
          <span style={styles.statLabel}>Abandoned</span>
          <span style={{ ...styles.statValue, color: "#64748b" }}>
            {stats.abandonedCount}
          </span>
        </div>
      </div>

      {/* TAB SWITCHER */}
      <div style={styles.tabContainer}>
        <button
          onClick={() => setActiveTab("live")}
          style={{
            ...styles.tabBtn,
            ...(activeTab === "live" ? styles.activeTab : styles.inactiveTab),
          }}
        >
          <Package size={16} />
          Live Orders
        </button>
        <button
          onClick={() => setActiveTab("abandoned")}
          style={{
            ...styles.tabBtn,
            ...(activeTab === "abandoned"
              ? styles.activeTab
              : styles.inactiveTab),
          }}
        >
          <AlertTriangle size={16} />
          Abandoned Checkouts
        </button>
      </div>

      <div style={styles.toolbar}>
        <div style={styles.filterGroup}>
          {activeTab === "live" &&
            ["all", "pending", "label_created", "shipped", "delivered"].map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  style={{
                    ...styles.filterBtn,
                    background: statusFilter === status ? "#0f172a" : "white",
                    color: statusFilter === status ? "white" : "#64748b",
                    borderColor:
                      statusFilter === status ? "#0f172a" : "#e2e8f0",
                  }}
                >
                  {status === "label_created"
                    ? "Label Created"
                    : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              )
            )}
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button onClick={handleBulkExport} style={styles.exportBtn}>
            <Download size={16} /> Export View
          </button>
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
      </div>

      <div style={styles.tableContainer}>
        {loading ? (
          <div style={styles.emptyState}>Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div style={styles.emptyState}>
            {activeTab === "live"
              ? "No live orders found."
              : "No abandoned checkouts found."}
          </div>
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

// FIXED: Moved Component Definition HERE
function ConfirmationModal({ config, onClose }) {
  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContent}>
        <div style={styles.modalHeader}>
          {config.isDestructive && <AlertTriangle size={20} color="#ef4444" />}
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
