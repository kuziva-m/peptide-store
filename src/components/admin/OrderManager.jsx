import { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { downloadAusPostCSV } from "../../utils/exportToAusPost";
import { styles } from "./OrderManagerStyles";
import { OrderRow } from "./OrderRow";
import {
  Search,
  Download,
  CheckCircle,
  AlertTriangle,
  Crown,
} from "lucide-react";

const normalise = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const getShippingAddress = (order) => order?.shipping_address || {};

const getPostcode = (order) => {
  const address = getShippingAddress(order);
  return address.postal_code || address.postcode || address.zip || "";
};

const safeParseItems = (order) => {
  try {
    if (Array.isArray(order?.order_items) && order.order_items.length > 0) {
      return order.order_items;
    }

    if (!order?.items) return [];

    return typeof order.items === "string"
      ? JSON.parse(order.items)
      : order.items;
  } catch (error) {
    console.error("Failed to parse order items:", error);
    return [];
  }
};

const orderHasPreorder = (order) => {
  const items = safeParseItems(order);

  return items.some(
    (item) => item.is_preorder === true || item.is_preorder === "true",
  );
};

const getItemSearchText = (item) => {
  if (!item) return "";

  const variant =
    typeof item.variant === "object" && item.variant !== null
      ? item.variant
      : null;

  const variantAsString = typeof item.variant === "string" ? item.variant : "";

  const nestedVariant =
    typeof item.variants === "object" && item.variants !== null
      ? item.variants
      : null;

  const nestedProduct =
    typeof nestedVariant?.products === "object" &&
    nestedVariant.products !== null
      ? nestedVariant.products
      : null;

  const searchableFields = [
    item.product_name_snapshot,
    item.productName,
    item.product_name,
    item.name,
    item.title,
    item.sku,
    item.size,
    item.size_label,
    item.variant_name,
    item.variantName,
    variantAsString,
    variant?.name,
    variant?.title,
    variant?.sku,
    variant?.size,
    variant?.size_label,
    nestedVariant?.name,
    nestedVariant?.title,
    nestedVariant?.sku,
    nestedVariant?.size,
    nestedVariant?.size_label,
    nestedProduct?.name,
    nestedProduct?.title,
    nestedProduct?.slug,
  ];

  return searchableFields.filter(Boolean).join(" ");
};

const getOrderProductSearchText = (order) => {
  const items = safeParseItems(order);
  return items.map(getItemSearchText).filter(Boolean).join(" ");
};

const getOrderSearchText = (order) => {
  const address = getShippingAddress(order);
  const productSearchText = getOrderProductSearchText(order);

  return [
    order.id,
    order.customer_email,
    order.customer_name,
    order.tracking_number,
    order.discount_code,
    order.notes,
    address.phone,
    address.line1,
    address.line2,
    address.city,
    address.state,
    getPostcode(order),
    productSearchText,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
};

export default function OrderManager() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const searchInputRef = useRef(null);

  const [statusFilter, setStatusFilter] = useState("pending");
  const [notification, setNotification] = useState(null);

  const [hidePreorders, setHidePreorders] = useState(false);

  // NEW: State to control sorting (defaults to recently updated for shipped tab)
  const [sortBy, setSortBy] = useState("updated_desc");

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
      const activeElement = document.activeElement;
      const activeTag = activeElement?.tagName?.toLowerCase();

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

    if (error) {
      console.error("Error fetching orders:", error);
      setOrders([]);
    } else {
      setOrders(data || []);
    }

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

  const repeatCustomerEmailSet = useMemo(() => {
    const emailCounts = {};

    orders.forEach((order) => {
      const email = normalise(order.customer_email);
      if (!email) return;

      emailCounts[email] = (emailCounts[email] || 0) + 1;
    });

    return new Set(
      Object.entries(emailCounts)
        .filter(([, count]) => count > 1)
        .map(([email]) => email),
    );
  }, [orders]);

  const countSourceOrders = useMemo(() => {
    if (!hidePreorders) return orders;
    return orders.filter((order) => !orderHasPreorder(order));
  }, [orders, hidePreorders]);

  const tabCounts = useMemo(() => {
    const counts = {
      pending: 0,
      paid: 0,
      label_created: 0,
      shipped: 0,
      cancelled: 0,
      has_preorder: 0,
      has_notes: 0,
      all: countSourceOrders.length,
    };

    countSourceOrders.forEach((order) => {
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

      if (orderHasPreorder(order)) counts.has_preorder++;
    });

    return counts;
  }, [countSourceOrders]);

  const filteredOrders = useMemo(() => {
    const s = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesSearch = !s || getOrderSearchText(order).includes(s);
      const hasPreorder = orderHasPreorder(order);

      if (hidePreorders && hasPreorder) return false;

      if (statusFilter === "all") {
        return matchesSearch;
      }

      if (statusFilter === "pending") {
        return (
          matchesSearch &&
          (order.status === "pending" ||
            order.status === "payment_reported" ||
            order.status === "pending_contact")
        );
      }

      if (statusFilter === "paid") {
        return (
          matchesSearch &&
          (order.status === "paid" || order.status === "processing")
        );
      }

      if (statusFilter === "has_notes") {
        return (
          matchesSearch && Boolean(order.notes && order.notes.trim().length > 0)
        );
      }

      if (statusFilter === "has_preorder") {
        return matchesSearch && hasPreorder;
      }

      return matchesSearch && order.status === statusFilter;
    });
  }, [orders, search, statusFilter, hidePreorders]);

  const processedOrders = useMemo(() => {
    let sorted = [...filteredOrders];

    sorted.sort((a, b) => {
      // Specifically for the "Shipped" tab: sort by when it was marked shipped
      if (statusFilter === "shipped" && sortBy === "updated_desc") {
        // Fallback to created_at just in case updated_at is null
        const dateA = new Date(a.updated_at || a.created_at).getTime() || 0;
        const dateB = new Date(b.updated_at || b.created_at).getTime() || 0;
        return dateB - dateA;
      }

      if (sortBy === "created_asc") {
        const dateA = new Date(a.created_at).getTime() || 0;
        const dateB = new Date(b.created_at).getTime() || 0;
        return dateA - dateB;
      }

      // Default fallback: Order Date (Newest)
      const dateA = new Date(a.created_at).getTime() || 0;
      const dateB = new Date(b.created_at).getTime() || 0;
      return dateB - dateA;
    });

    return sorted;
  }, [filteredOrders, statusFilter, sortBy]);

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
    if (processedOrders.length === 0) {
      showToast("No orders to export");
      return;
    }

    downloadAusPostCSV(processedOrders);
    showToast(`Exported ${processedOrders.length} order rows`);
  };

  const isRepeatCustomer = (order) => {
    const email = normalise(order.customer_email);
    return Boolean(email && repeatCustomerEmailSet.has(email));
  };

  const FilterTab = ({ id, label, color, count }) => {
    const isActive = statusFilter === id;

    return (
      <button
        type="button"
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

          <button
            type="button"
            onClick={() => setHidePreorders((prev) => !prev)}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              border: "2px solid",
              background: hidePreorders ? "#000000" : "#ef4444",
              color: hidePreorders ? "#ef4444" : "#ffffff",
              borderColor: hidePreorders ? "#000000" : "#ef4444",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontWeight: "900",
              letterSpacing: "0.5px",
              cursor: "pointer",
              marginLeft: "10px",
              transition: "all 0.2s ease-in-out",
              textShadow: hidePreorders
                ? "-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff"
                : "none",
            }}
          >
            {hidePreorders ? "PRE-ORDERS HIDDEN" : "Hide Pre-orders"}
          </button>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {/* HADY'S CUSTOM SORT DROPDOWN (ONLY SHOWS ON SHIPPED TAB) */}
          {statusFilter === "shipped" && (
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "13px",
                fontWeight: "600",
                color: "#334155",
                outline: "none",
                cursor: "pointer",
                background: "white",
              }}
            >
              <option value="updated_desc">Recently Shipped</option>
              <option value="created_desc">Order Date (Newest)</option>
              <option value="created_asc">Order Date (Oldest)</option>
            </select>
          )}

          <button
            type="button"
            onClick={handleBulkExport}
            style={styles.exportBtn}
          >
            <Download size={16} /> Export
          </button>

          <div style={styles.searchWrapper}>
            <Search size={16} color="#94a3b8" style={{ marginRight: "8px" }} />
            <input
              ref={searchInputRef}
              placeholder="Search customer, tracking, product..."
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
          processedOrders.map((order) => {
            const repeatCustomer = isRepeatCustomer(order);

            return (
              <div
                key={order.id}
                style={repeatCustomerStyles.rowShell}
                aria-label={
                  repeatCustomer ? "Repeat customer order" : undefined
                }
              >
                {repeatCustomer && (
                  <div
                    style={repeatCustomerStyles.crownBadge}
                    title="Repeat customer"
                    aria-label="Repeat customer"
                  >
                    <Crown size={15} strokeWidth={2.5} />
                  </div>
                )}

                <OrderRow
                  order={order}
                  onUpdate={fetchOrders}
                  showToast={showToast}
                  promptConfirm={promptConfirm}
                />
              </div>
            );
          })
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
          <button type="button" onClick={onClose} style={styles.modalCancel}>
            Cancel
          </button>
          <button
            type="button"
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

const repeatCustomerStyles = {
  rowShell: {
    position: "relative",
    width: "100%",
  },
  crownBadge: {
    position: "absolute",
    top: "-8px",
    right: "14px",
    zIndex: 5,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "30px",
    height: "30px",
    borderRadius: "999px",
    background: "#fef3c7",
    color: "#92400e",
    border: "1px solid #f59e0b",
    boxShadow: "0 6px 16px rgba(146, 64, 14, 0.16)",
    pointerEvents: "none",
  },
};
