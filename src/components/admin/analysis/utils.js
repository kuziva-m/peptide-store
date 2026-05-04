// Data formatters and utilities
export const formatCurrency = (value) =>
  new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(
    Number(value || 0),
  );

export const formatNumber = (value) =>
  new Intl.NumberFormat("en-AU").format(Number(value || 0));

export const formatPercent = (value) => `${Number(value || 0).toFixed(1)}%`;

export const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  return new Intl.DateTimeFormat("en-AU", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(dateStr));
};

export const shortId = (id) =>
  id ? String(id).split("-")[0].substring(0, 8) : "N/A";

export const safeJsonParse = (value, fallback = []) => {
  if (!value) return fallback;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch (e) {
    return fallback;
  }
};

export const hasUrl = (value) =>
  typeof value === "string" && value.trim().length > 5;

// Safely normalize both Stripe Line Items and Custom Snapshots
export const normalizeOrderItems = (
  order,
  productsMap = {},
  variantsMap = {},
) => {
  const items = safeJsonParse(order.items, []);
  if (!Array.isArray(items)) return [];

  return items.map((item) => {
    let id, name, variant_id, quantity, price, category, is_preorder;

    if (item?.price?.product) {
      id = item.id;
      name = item.price.product.name;
      variant_id = item.price.product.metadata?.variantId;
      quantity = item.quantity || 1;
      price = (item.price.unit_amount || 0) / 100;
      category = item.price.product.metadata?.category;
    } else {
      id = item?.id;
      name = item?.name || item?.product_name_snapshot;
      variant_id = item?.variantId || item?.variant_id;
      quantity = item?.quantity || 1;
      price = item?.price || item?.price_at_purchase || 0;
      category = item?.category;
      is_preorder = item?.is_preorder;
    }

    const variantFallback = variant_id ? variantsMap[variant_id] : null;
    const productFallback = variantFallback
      ? productsMap[variantFallback.product_id]
      : null;

    return {
      id: id || shortId(variant_id) || "unknown",
      name: name || productFallback?.name || "Unknown Product",
      variant_id: variant_id || null,
      quantity: Number(quantity) || 1,
      price: Number(price) || 0,
      category: category || productFallback?.category || "Unknown",
      is_preorder: is_preorder ?? (variantFallback?.is_preorder || false),
    };
  });
};

export const getOrderNetRevenue = (order) =>
  Number(order.total_amount || 0) - Number(order.discount_amount || 0);

export const getStatusTone = (status) => {
  const s = String(status).toLowerCase();
  if (
    [
      "delivered",
      "shipped",
      "resolved",
      "published",
      "active",
      "in stock",
      "visible",
      "verified",
    ].includes(s)
  )
    return "success";
  if (["pending", "unread", "processing", "preorder", "hidden"].includes(s))
    return "warning";
  if (["error", "cancelled", "refunded", "out of stock", "missing"].includes(s))
    return "danger";
  return "neutral";
};

// Deep stringifier for robust search
export const matchesRecordSearch = (record, searchTerm) => {
  if (!searchTerm) return true;
  const lowerTerm = searchTerm.toLowerCase();
  const searchValues = (obj) => {
    for (const key in obj) {
      if (obj[key] === null || obj[key] === undefined) continue;
      if (typeof obj[key] === "object") {
        if (searchValues(obj[key])) return true;
      } else if (String(obj[key]).toLowerCase().includes(lowerTerm)) {
        return true;
      }
    }
    return false;
  };
  return searchValues(record);
};

// Compliance Risk Scanner
const RISKY_TERMS = [
  "healing",
  "treat",
  "cure",
  "administer",
  "dose",
  "injection",
  "patient",
  "weight loss",
  "fat loss",
  "burn",
  "libido",
  "recovery",
  "anti-aging",
  "safe",
  "guaranteed",
];
export const scanForRisk = (text) => {
  if (!text) return 0;
  const lowerText = text.toLowerCase();
  return RISKY_TERMS.reduce(
    (count, term) => count + (lowerText.includes(term) ? 1 : 0),
    0,
  );
};

export const exportRowsToCsv = (tableData, tableCols, filename) => {
  if (!tableData || !tableData.length) return alert("No data to export.");
  const csvContent = [
    tableCols.join(","),
    ...tableData.map((row) =>
      tableCols
        .map((k) => `"${String(row[k] || "").replace(/"/g, '""')}"`)
        .join(","),
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
};
