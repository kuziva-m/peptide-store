import { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { downloadAusPostCSV } from "../../utils/exportToAusPost";
import { styles } from "./OrderManagerStyles";
import { OrderRow } from "./OrderRow";
import { Search, Download, CheckCircle, AlertTriangle } from "lucide-react";

export default function OrderManager() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const searchInputRef = useRef(null);

  const [statusFilter, setStatusFilter] = useState("pending");
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

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      const activeTag = document.activeElement.tagName.toLowerCase();
      if (
        activeTag === "input" ||
        activeTag === "textarea" ||
        activeTag === "select"
      ) {
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey || e.key.length > 1) return;
      if (searchInputRef.current) searchInputRef.current.focus();
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select(
        `*, order_items (quantity, price_at_purchase, product_name_snapshot, variants (size_label, products (name, image_url)))`,
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

  // --- 🚨 UPDATED TAB COUNTERS ---
  const tabCounts = useMemo(() => {
    const counts = {
      pending: 0,
      paid: 0,
      label_created: 0,
      shipped: 0,
      cancelled: 0,
      has_preorder: 0,
      no_preorder: 0, // NEW COUNTER
      has_notes: 0,
      all: orders.length,
    };

    orders.forEach((order) => {
      if (
        order.status === "pending" ||
        order.status === "payment_reported" ||
        order.status === "pending_contact"
      ) {
        counts.pending++;
      } else if (order.status === "paid" || order.status === "processing") {
        counts.paid++;
      } else if (order.status === "label_created") {
        counts.label_created++;
      } else if (order.status === "shipped") {
        counts.shipped++;
      } else if (order.status === "cancelled") {
        counts.cancelled++;
      }

      if (order.notes && order.notes.trim().length > 0) counts.has_notes++;

      try {
        let items = [];
        if (order.items) {
          items =
            typeof order.items === "string"
              ? JSON.parse(order.items)
              : order.items;
        }

        const containsPreorder = items.some(
          (item) => item.is_preorder === true || item.is_preorder === "true",
        );

        if (containsPreorder) {
          counts.has_preorder++;
        } else if (order.status === "paid" || order.status === "processing") {
          // 🚨 IF fully paid AND no preorders, it is ready to ship
          counts.no_preorder++;
        }
      } catch (e) {}
    });

    return counts;
  }, [orders]);

  // --- 🚨 UPDATED FILTER ENGINE ---
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const s = search.toLowerCase();
      const matchesSearch =
        order.id.toLowerCase().includes(s) ||
        order.customer_email?.toLowerCase().includes(s) ||
        order.customer_name?.toLowerCase().includes(s) ||
        order.tracking_number?.toLowerCase().includes(s);

      let matchesStatus = false;

      if (statusFilter === "all") matchesStatus = true;
      else if (statusFilter === "pending") {
        matchesStatus =
          order.status === "pending" ||
          order.status === "payment_reported" ||
          order.status === "pending_contact";
      } else if (statusFilter === "paid") {
        matchesStatus =
          order.status === "paid" || order.status === "processing";
      } else if (statusFilter === "has_notes") {
        matchesStatus = order.notes && order.notes.trim().length > 0;
      } else if (statusFilter === "has_preorder") {
        try {
          let items = [];
          if (order.items) {
            items =
              typeof order.items === "string"
                ? JSON.parse(order.items)
                : order.items;
          }
          matchesStatus = items.some(
            (item) => item.is_preorder === true || item.is_preorder === "true",
          );
        } catch (e) {
          matchesStatus = false;
        }
      }
      // 🚨 NEW FILTER LOGIC
      else if (statusFilter === "no_preorder") {
        try {
          let items = [];
          if (order.items) {
            items =
              typeof order.items === "string"
                ? JSON.parse(order.items)
                : order.items;
          }
          const hasPreorder = items.some(
            (item) => item.is_preorder === true || item.is_preorder === "true",
          );

          matchesStatus =
            (order.status === "paid" || order.status === "processing") &&
            !hasPreorder;
        } catch (e) {
          matchesStatus = false;
        }
      } else {
        matchesStatus = order.status === statusFilter;
      }

      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  const processedOrders = useMemo(() => {
    let grouped = [];

    // Apply fusing to "paid" AND our new "no_preorder" tab
    if (statusFilter === "paid" || statusFilter === "no_preorder") {
      const emailMap = {};
      filteredOrders.forEach((o) => {
        const email = (o.customer_email || `unknown-${o.id}`).toLowerCase();
        if (!emailMap[email]) emailMap[email] = [];
        emailMap[email].push(o);
      });

      Object.values(emailMap).forEach((group) => {
        if (group.length === 1) {
          grouped.push(group[0]);
        } else {
          group.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
          const oldest = group[0];
          const hasExpress = group.some(
            (o) => o.shipping_method?.toLowerCase() === "express",
          );
          const totalAmt = group.reduce(
            (sum, o) => sum + Number(o.total_amount || 0),
            0,
          );

          grouped.push({
            isFused: true,
            id: `FUSED-${oldest.id.slice(0, 5)}`,
            real_ids: group.map((o) => o.id),
            customer_name: oldest.customer_name,
            customer_email: oldest.customer_email,
            shipping_address: oldest.shipping_address,
            shipping_method: hasExpress ? "express" : "standard",
            total_amount: totalAmt,
            status: oldest.status,
            created_at: oldest.created_at,
            orders: group,
          });
        }
      });
    } else if (
      ["label_created", "shipped", "delivered"].includes(statusFilter)
    ) {
      const trackMap = {};
      const noTrack = [];

      filteredOrders.forEach((o) => {
        const t = o.tracking_number?.trim();
        if (t) {
          if (!trackMap[t]) trackMap[t] = [];
          trackMap[t].push(o);
        } else {
          noTrack.push(o);
        }
      });

      Object.values(trackMap).forEach((group) => {
        if (group.length === 1) grouped.push(group[0]);
        else {
          group.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
          const oldest = group[0];
          const hasExpress = group.some(
            (o) => o.shipping_method?.toLowerCase() === "express",
          );
          const totalAmt = group.reduce(
            (sum, o) => sum + Number(o.total_amount || 0),
            0,
          );

          grouped.push({
            isFused: true,
            id: `TRK-${oldest.tracking_number.slice(-5)}`,
            real_ids: group.map((o) => o.id),
            customer_name: oldest.customer_name,
            customer_email: oldest.customer_email,
            shipping_address: oldest.shipping_address,
            shipping_method: hasExpress ? "express" : "standard",
            tracking_number: oldest.tracking_number,
            total_amount: totalAmt,
            status: oldest.status,
            created_at: oldest.created_at,
            orders: group,
          });
        }
      });
      grouped = [...grouped, ...noTrack];
    } else {
      grouped = filteredOrders;
    }

    grouped.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return grouped;
  }, [filteredOrders, statusFilter]);

  const stats = useMemo(() => {
    const confirmedPaidOrders = orders.filter(
      (o) =>
        o.status === "paid" ||
        o.status === "processing" ||
        o.status === "label_created" ||
        o.status === "shipped" ||
        o.status === "delivered",
    );

    const totalRevenue = confirmedPaidOrders.reduce(
      (sum, o) => sum + Number(o.total_amount || 0),
      0,
    );

    return {
      totalRevenue,
      totalOrders: confirmedPaidOrders.length,
    };
  }, [orders]);

  const handleBulkExport = () => {
    if (processedOrders.length === 0) return showToast("No orders to export");
    downloadAusPostCSV(processedOrders);
    showToast(`Exported ${processedOrders.length} orders`);
  };

  const FilterTab = ({ id, label, color, count }) => {
    const isActive = statusFilter === id;
    return (
      <button
        onClick={() => setStatusFilter(id)}
        style={{
          ...styles.filterBtn,
          background: isActive ? color || "#0f172a" : "white",
          color: isActive ? "white" : "#64748b",
          borderColor: isActive ? color || "#0f172a" : "#e2e8f0",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <span>{label}</span>
        <span
          style={{
            background: isActive ? "rgba(255, 255, 255, 0.25)" : "#f1f5f9",
            color: isActive ? "white" : "#475569",
            padding: "2px 8px",
            borderRadius: "12px",
            fontSize: "0.75rem",
            fontWeight: "bold",
            flexShrink: 0,
          }}
        >
          {count}
        </span>
      </button>
    );
  };

  return (
    <div style={{ position: "relative" }}>
      <div style={styles.statsContainer}>
        <div style={styles.statItem}>
          <span style={styles.statLabel}>Total Paid Orders</span>
          <span style={styles.statValue}>{stats.totalOrders}</span>
        </div>
        <div style={styles.statDivider} />
        <div style={styles.statItem}>
          <span style={styles.statLabel}>Total Revenue</span>
          <span style={styles.statValue}>${stats.totalRevenue.toFixed(2)}</span>
        </div>
      </div>

      <div style={styles.toolbar}>
        <div style={styles.filterGroup}>
          <FilterTab
            id="pending"
            label="Action Required (New)"
            color="#d97706"
            count={tabCounts.pending}
          />
          <FilterTab
            id="paid"
            label="Approved (Paid)"
            color="#16a34a"
            count={tabCounts.paid}
          />
          {/* 🚨 NEW TAB ADDED HERE */}
          <FilterTab
            id="no_preorder"
            label="Ready to Ship (In Stock)"
            color="#2563eb"
            count={tabCounts.no_preorder}
          />
          <FilterTab
            id="label_created"
            label="Label Created"
            count={tabCounts.label_created}
          />
          <FilterTab id="shipped" label="Shipped" count={tabCounts.shipped} />
          <FilterTab
            id="cancelled"
            label="Canceled"
            color="#ef4444"
            count={tabCounts.cancelled}
          />
          <FilterTab
            id="has_preorder"
            label="Contains Pre-order"
            color="#ea580c"
            count={tabCounts.has_preorder}
          />
          <FilterTab
            id="has_notes"
            label="With Notes"
            color="#8b5cf6"
            count={tabCounts.has_notes}
          />
          <FilterTab id="all" label="All" count={tabCounts.all} />
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button onClick={handleBulkExport} style={styles.exportBtn}>
            <Download size={16} /> Export
          </button>
          <div style={styles.searchWrapper}>
            <Search size={16} color="#94a3b8" style={{ marginRight: "8px" }} />
            <input
              ref={searchInputRef}
              placeholder="Search or scan barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={styles.inputReset}
            />
          </div>
        </div>
      </div>

      <div style={styles.tableContainer}>
        {loading ? (
          <div style={styles.emptyState}>Loading...</div>
        ) : processedOrders.length === 0 ? (
          <div style={styles.emptyState}>No orders found.</div>
        ) : (
          processedOrders.map((order) => (
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
