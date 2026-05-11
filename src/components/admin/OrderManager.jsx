import { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { downloadAusPostCSV } from "../../utils/exportToAusPost";
import { styles } from "./OrderManagerStyles";
import { OrderRow } from "./OrderRow";
import { Search, Download, CheckCircle, AlertTriangle } from "lucide-react";

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

const getDeliveryMergeKey = (order) => {
  const address = getShippingAddress(order);

  return [
    normalise(order.customer_email),
    normalise(order.customer_name),
    normalise(address.phone),
    normalise(address.line1),
    normalise(address.line2),
    normalise(address.city),
    normalise(address.state),
    normalise(getPostcode(order)),
    normalise(address.country || "AU"),
  ].join("|");
};

const getTrackingMergeKey = (order) => {
  const tracking = normalise(order.tracking_number);
  if (!tracking) return "";

  return `${tracking}|${getDeliveryMergeKey(order)}`;
};

const createFusedOrder = (group, type = "paid") => {
  const sortedGroup = [...group].sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at),
  );

  const oldest = sortedGroup[0];
  const realIds = sortedGroup.map((order) => order.id);
  const shortIds = realIds.map((id) => String(id).slice(0, 8));

  const hasExpress = sortedGroup.some(
    (order) => order.shipping_method?.toLowerCase() === "express",
  );

  const totalAmount = sortedGroup.reduce(
    (sum, order) => sum + Number(order.total_amount || 0),
    0,
  );

  const shippingCost = sortedGroup.reduce(
    (sum, order) => sum + Number(order.shipping_cost || 0),
    0,
  );

  const mergedNotes = sortedGroup
    .map((order) => order.notes?.trim())
    .filter(Boolean)
    .join("\n\n---\n\n");

  const discountCodes = [
    ...new Set(
      sortedGroup.map((order) => order.discount_code?.trim()).filter(Boolean),
    ),
  ];

  const receiptUrls = sortedGroup
    .map((order) => order.receipt_url)
    .filter(Boolean);

  const trackingNumbers = [
    ...new Set(
      sortedGroup.map((order) => order.tracking_number?.trim()).filter(Boolean),
    ),
  ];

  const statusSet = new Set(sortedGroup.map((order) => order.status));
  const status =
    statusSet.size === 1
      ? oldest.status
      : type === "tracking"
        ? oldest.status
        : "paid";

  const fusedPrefix = type === "tracking" ? "TRK" : "FUSED";

  return {
    isFused: true,
    id: `${fusedPrefix}-${shortIds.join("-")}`,
    real_ids: realIds,
    customer_name: oldest.customer_name,
    customer_email: oldest.customer_email,
    shipping_address: oldest.shipping_address,
    shipping_method: hasExpress ? "express" : "standard",
    shipping_cost: shippingCost,
    total_amount: totalAmount,
    status,
    created_at: oldest.created_at,
    notes: mergedNotes,
    receipt_url: receiptUrls[0] || null,
    receipt_urls: receiptUrls,
    discount_code: discountCodes.join(", "),
    tracking_number: trackingNumbers[0] || "",
    tracking_numbers: trackingNumbers,
    orders: sortedGroup,
  };
};

const getOrderRowKey = (order) => {
  if (!order.isFused) return order.id;

  return [
    order.id,
    order.status,
    order.tracking_number || "no-tracking",
    order.real_ids?.join("-") || "",
  ].join("|");
};

export default function OrderManager() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const searchInputRef = useRef(null);

  const [statusFilter, setStatusFilter] = useState("pending");
  const [notification, setNotification] = useState(null);

  const [hidePreorders, setHidePreorders] = useState(false);

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

  const tabCounts = useMemo(() => {
    const counts = {
      pending: 0,
      paid: 0,
      label_created: 0,
      shipped: 0,
      cancelled: 0,
      has_preorder: 0,
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

      if (orderHasPreorder(order)) counts.has_preorder++;
    });

    return counts;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const s = search.trim().toLowerCase();

    return orders.filter((order) => {
      const address = getShippingAddress(order);
      const productSearchText = getOrderProductSearchText(order);

      const searchableText = [
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

      const matchesSearch = !s || searchableText.includes(s);

      const hasPreorder = orderHasPreorder(order);

      if (hidePreorders && hasPreorder) {
        return false;
      }

      let matchesStatus = false;

      if (statusFilter === "all") {
        matchesStatus = true;
      } else if (statusFilter === "pending") {
        matchesStatus =
          order.status === "pending" ||
          order.status === "payment_reported" ||
          order.status === "pending_contact";
      } else if (statusFilter === "paid") {
        matchesStatus =
          order.status === "paid" || order.status === "processing";
      } else if (statusFilter === "has_notes") {
        matchesStatus = Boolean(order.notes && order.notes.trim().length > 0);
      } else if (statusFilter === "has_preorder") {
        matchesStatus = hasPreorder;
      } else {
        matchesStatus = order.status === statusFilter;
      }

      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter, hidePreorders]);

  const processedOrders = useMemo(() => {
    let grouped = [];

    if (statusFilter === "paid") {
      const groupMap = {};

      filteredOrders.forEach((order) => {
        if (order.tracking_number?.trim()) {
          grouped.push(order);
          return;
        }

        const mergeKey = getDeliveryMergeKey(order);

        const address = getShippingAddress(order);
        const hasMinimumMergeData =
          order.customer_email &&
          address.line1 &&
          address.city &&
          getPostcode(order);

        if (!hasMinimumMergeData) {
          grouped.push(order);
          return;
        }

        if (!groupMap[mergeKey]) groupMap[mergeKey] = [];
        groupMap[mergeKey].push(order);
      });

      Object.values(groupMap).forEach((group) => {
        if (group.length === 1) {
          grouped.push(group[0]);
          return;
        }

        grouped.push(createFusedOrder(group, "paid"));
      });
    } else if (
      ["label_created", "shipped", "delivered"].includes(statusFilter)
    ) {
      const trackingMap = {};
      const noTrack = [];

      filteredOrders.forEach((order) => {
        const mergeKey = getTrackingMergeKey(order);

        if (!mergeKey) {
          noTrack.push(order);
          return;
        }

        if (!trackingMap[mergeKey]) trackingMap[mergeKey] = [];
        trackingMap[mergeKey].push(order);
      });

      Object.values(trackingMap).forEach((group) => {
        if (group.length === 1) {
          grouped.push(group[0]);
          return;
        }

        grouped.push(createFusedOrder(group, "tracking"));
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
    if (processedOrders.length === 0) {
      showToast("No orders to export");
      return;
    }

    downloadAusPostCSV(processedOrders);
    showToast(`Exported ${processedOrders.length} order rows`);
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
          processedOrders.map((order) => (
            <OrderRow
              key={getOrderRowKey(order)}
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
