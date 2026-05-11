import { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { downloadAusPostCSV } from "../../utils/exportToAusPost";
import { styles } from "./OrderManagerStyles";
import { OrderRow } from "./OrderRow";
import { Search, Download, CheckCircle, AlertTriangle } from "lucide-react";

const PAID_MERGE_STATUSES = ["paid", "processing"];
const TRACKING_MERGE_STATUSES = ["label_created", "shipped", "delivered"];

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

const isPaidMergeStatus = (order) => PAID_MERGE_STATUSES.includes(order.status);

const isTrackingMergeStatus = (order) =>
  TRACKING_MERGE_STATUSES.includes(order.status);

const hasMinimumMergeData = (order) => {
  const address = getShippingAddress(order);

  return Boolean(
    order.customer_email && address.line1 && address.city && getPostcode(order),
  );
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

const getCustomerKey = (order) => normalise(order.customer_email);

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

const sortNewestFirst = (orders) =>
  [...orders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

const buildPaidMergedOrders = (sourceOrders, fusedOnly = false) => {
  const grouped = [];
  const groupMap = {};

  sourceOrders.filter(isPaidMergeStatus).forEach((order) => {
    if (order.tracking_number?.trim()) {
      if (!fusedOnly) grouped.push(order);
      return;
    }

    if (!hasMinimumMergeData(order)) {
      if (!fusedOnly) grouped.push(order);
      return;
    }

    const mergeKey = getDeliveryMergeKey(order);

    if (!groupMap[mergeKey]) groupMap[mergeKey] = [];
    groupMap[mergeKey].push(order);
  });

  Object.values(groupMap).forEach((group) => {
    if (group.length === 1) {
      if (!fusedOnly) grouped.push(group[0]);
      return;
    }

    grouped.push(createFusedOrder(group, "paid"));
  });

  return sortNewestFirst(grouped);
};

const buildTrackingMergedOrders = (sourceOrders, fusedOnly = false) => {
  const grouped = [];
  const noTrack = [];
  const trackingMap = {};

  sourceOrders.filter(isTrackingMergeStatus).forEach((order) => {
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
      if (!fusedOnly) grouped.push(group[0]);
      return;
    }

    grouped.push(createFusedOrder(group, "tracking"));
  });

  if (!fusedOnly) grouped.push(...noTrack);

  return sortNewestFirst(grouped);
};

const buildAllMergedOrders = (sourceOrders) => {
  const paidMerged = buildPaidMergedOrders(sourceOrders, true);
  const trackingMerged = buildTrackingMergedOrders(sourceOrders, true);

  return sortNewestFirst([...paidMerged, ...trackingMerged]);
};

const getMergedRealIds = (sourceOrders) => {
  const mergedIds = new Set();

  buildAllMergedOrders(sourceOrders).forEach((fusedOrder) => {
    fusedOrder.real_ids?.forEach((id) => mergedIds.add(id));
  });

  return mergedIds;
};

const buildSameCustomerUnmergedOrders = (sourceOrders) => {
  const emailMap = {};
  const mergedIds = getMergedRealIds(sourceOrders);

  sourceOrders.forEach((order) => {
    const customerKey = getCustomerKey(order);

    if (!customerKey) return;

    if (!emailMap[customerKey]) emailMap[customerKey] = [];
    emailMap[customerKey].push(order);
  });

  const sameCustomerUnmerged = [];

  Object.values(emailMap).forEach((group) => {
    if (group.length < 2) return;

    group.forEach((order) => {
      if (!mergedIds.has(order.id)) {
        sameCustomerUnmerged.push(order);
      }
    });
  });

  return sortNewestFirst(sameCustomerUnmerged);
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

  const countSourceOrders = useMemo(() => {
    if (!hidePreorders) return orders;
    return orders.filter((order) => !orderHasPreorder(order));
  }, [orders, hidePreorders]);

  const tabCounts = useMemo(() => {
    const counts = {
      pending: 0,
      paid: 0,
      merged_orders: 0,
      same_customer_unmerged: 0,
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

    counts.merged_orders = buildAllMergedOrders(countSourceOrders).length;
    counts.same_customer_unmerged =
      buildSameCustomerUnmergedOrders(countSourceOrders).length;

    return counts;
  }, [countSourceOrders]);

  const baseFilteredOrders = useMemo(() => {
    const s = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesSearch = !s || getOrderSearchText(order).includes(s);
      const hasPreorder = orderHasPreorder(order);

      if (hidePreorders && hasPreorder) return false;

      return matchesSearch;
    });
  }, [orders, search, hidePreorders]);

  const filteredOrders = useMemo(() => {
    if (
      statusFilter === "merged_orders" ||
      statusFilter === "same_customer_unmerged"
    ) {
      return baseFilteredOrders;
    }

    return baseFilteredOrders.filter((order) => {
      const hasPreorder = orderHasPreorder(order);

      if (statusFilter === "all") {
        return true;
      }

      if (statusFilter === "pending") {
        return (
          order.status === "pending" ||
          order.status === "payment_reported" ||
          order.status === "pending_contact"
        );
      }

      if (statusFilter === "paid") {
        return order.status === "paid" || order.status === "processing";
      }

      if (statusFilter === "has_notes") {
        return Boolean(order.notes && order.notes.trim().length > 0);
      }

      if (statusFilter === "has_preorder") {
        return hasPreorder;
      }

      return order.status === statusFilter;
    });
  }, [baseFilteredOrders, statusFilter]);

  const processedOrders = useMemo(() => {
    let processed = [];

    if (statusFilter === "paid") {
      processed = buildPaidMergedOrders(filteredOrders, false);
    } else if (statusFilter === "merged_orders") {
      processed = buildAllMergedOrders(filteredOrders);
    } else if (statusFilter === "same_customer_unmerged") {
      processed = buildSameCustomerUnmergedOrders(filteredOrders);
    } else if (TRACKING_MERGE_STATUSES.includes(statusFilter)) {
      processed = buildTrackingMergedOrders(filteredOrders, false);
    } else {
      processed = filteredOrders;
    }

    return sortNewestFirst(processed);
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
            id="merged_orders"
            label="Merged Orders"
            color="#0ea5e9"
            count={tabCounts.merged_orders}
          />
          <FilterTab
            id="same_customer_unmerged"
            label="Same Customer — Not Merged"
            color="#f97316"
            count={tabCounts.same_customer_unmerged}
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
