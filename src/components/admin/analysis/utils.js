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
  const items = safeJsonParse(order?.items, []);
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
  Number(order?.total_amount || 0) - Number(order?.discount_amount || 0);

export const getStatusTone = (status) => {
  const s = String(status || "").toLowerCase();
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

// ==========================================
// NEW ANALYTICS HELPER FUNCTIONS
// ==========================================

export const parseCurrencyValue = (value) => {
  if (!value) return 0;
  if (typeof value === "number") return value;
  const parsed = parseFloat(String(value).replace(/[^0-9.-]+/g, ""));
  return isNaN(parsed) ? 0 : parsed;
};

export const sortByMetric = (arr = [], metricKey, direction = "desc") => {
  if (!Array.isArray(arr)) return [];
  return [...arr].sort((a, b) => {
    const valA = Number(a[metricKey] || 0);
    const valB = Number(b[metricKey] || 0);
    return direction === "desc" ? valB - valA : valA - valB;
  });
};

export const getTopN = (arr = [], n = 5) => {
  if (!Array.isArray(arr)) return [];
  return arr.slice(0, n);
};

export const groupByDay = (records = [], dateField = "created_at") => {
  if (!Array.isArray(records)) return {};
  return records.reduce((acc, record) => {
    if (!record[dateField]) return acc;
    const day = record[dateField].split("T")[0];
    acc[day] = acc[day] || [];
    acc[day].push(record);
    return acc;
  }, {});
};

export const groupByWeek = (records = [], dateField = "created_at") => {
  if (!Array.isArray(records)) return {};
  return records.reduce((acc, record) => {
    if (!record[dateField]) return acc;
    const date = new Date(record[dateField]);
    if (isNaN(date.getTime())) return acc;
    const firstDay = new Date(date.setDate(date.getDate() - date.getDay()));
    const week = firstDay.toISOString().split("T")[0];
    acc[week] = acc[week] || [];
    acc[week].push(record);
    return acc;
  }, {});
};

export const groupByMonth = (records = [], dateField = "created_at") => {
  if (!Array.isArray(records)) return {};
  return records.reduce((acc, record) => {
    if (!record[dateField]) return acc;
    const month = record[dateField].substring(0, 7); // YYYY-MM
    acc[month] = acc[month] || [];
    acc[month].push(record);
    return acc;
  }, {});
};

export const groupByPeriod = (
  records = [],
  dateField = "created_at",
  granularity = "day",
) => {
  if (granularity === "week") return groupByWeek(records, dateField);
  if (granularity === "month") return groupByMonth(records, dateField);
  return groupByDay(records, dateField);
};

export const calculatePeriodComparison = (currentMetric, previousMetric) => {
  if (!previousMetric || previousMetric === 0)
    return { delta: 0, percentage: 0 };
  const delta = currentMetric - previousMetric;
  const percentage = (delta / previousMetric) * 100;
  return { delta, percentage };
};

export const getMetricStatus = (
  value,
  thresholds = { warning: 0, danger: -10 },
) => {
  if (value <= thresholds.danger) return "danger";
  if (value <= thresholds.warning) return "warning";
  return "success";
};

export const notTrackedMetric = (label, requiredData, recommendation) => ({
  label,
  value: "Not tracked",
  status: "missing_data",
  requiredData,
  recommendation,
});

// ==========================================
// CALCULATIONS: ORDERS & REVENUE
// ==========================================

export const calculateTotalRevenue = (orders = []) =>
  (orders || []).reduce(
    (sum, order) => sum + Number(order?.total_amount || 0),
    0,
  );

export const calculateNetRevenue = (orders = []) =>
  (orders || []).reduce((sum, order) => sum + getOrderNetRevenue(order), 0);

export const calculateAov = (orders = []) => {
  if (!Array.isArray(orders) || orders.length === 0) return 0;
  return calculateTotalRevenue(orders) / orders.length;
};

export const calculateDiscountTotal = (orders = []) =>
  (orders || []).reduce(
    (sum, order) => sum + Number(order?.discount_amount || 0),
    0,
  );

export const calculateDiscountRate = (orders = []) => {
  if (!Array.isArray(orders) || orders.length === 0) return 0;
  const totalRev = calculateTotalRevenue(orders);
  if (totalRev === 0) return 0;
  return (calculateDiscountTotal(orders) / totalRev) * 100;
};

export const calculateShippingRevenue = (orders = []) =>
  (orders || []).reduce(
    (sum, order) => sum + Number(order?.shipping_cost || 0),
    0,
  );

export const calculateOrderStatusBreakdown = (orders = []) => {
  return (orders || []).reduce((acc, order) => {
    const status = order?.status || "unknown";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
};

export const calculateRevenueByState = (orders = []) => {
  return (orders || []).reduce((acc, order) => {
    const state = order?.shipping_address?.state || "Unknown";
    acc[state] = (acc[state] || 0) + Number(order?.total_amount || 0);
    return acc;
  }, {});
};

export const calculateRevenueByShippingMethod = (orders = []) => {
  return (orders || []).reduce((acc, order) => {
    const method = order?.shipping_method || "Unknown";
    acc[method] = (acc[method] || 0) + Number(order?.total_amount || 0);
    return acc;
  }, {});
};

// ==========================================
// CALCULATIONS: CUSTOMERS & RETENTION
// ==========================================

export const calculateNewVsReturningCustomers = (orders = []) => {
  if (!Array.isArray(orders)) return { new: 0, returning: 0, ratio: 0 };
  const customerCounts = {};

  // Need chronological orders to accurately identify "new" vs "returning" in this period
  const sortedOrders = [...orders].sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at),
  );

  let newCustomers = 0;
  let returningCustomers = 0;

  sortedOrders.forEach((order) => {
    const email = order?.customer_email?.trim().toLowerCase();
    if (!email) return;

    if (!customerCounts[email]) {
      customerCounts[email] = 1;
      newCustomers++;
    } else {
      customerCounts[email]++;
      returningCustomers++;
    }
  });

  const total = newCustomers + returningCustomers;
  const ratio = total > 0 ? (returningCustomers / total) * 100 : 0;

  return { new: newCustomers, returning: returningCustomers, ratio };
};

export const calculateRepeatPurchaseRate = (orders = []) => {
  if (!Array.isArray(orders) || orders.length === 0) return 0;
  const customerCounts = orders.reduce((acc, order) => {
    const email = order?.customer_email?.trim().toLowerCase();
    if (email) acc[email] = (acc[email] || 0) + 1;
    return acc;
  }, {});

  const totalCustomers = Object.keys(customerCounts).length;
  if (totalCustomers === 0) return 0;

  const repeatCustomers = Object.values(customerCounts).filter(
    (count) => count > 1,
  ).length;
  return (repeatCustomers / totalCustomers) * 100;
};

export const calculateAverageDaysBetweenOrders = (orders = []) => {
  if (!Array.isArray(orders) || orders.length === 0) return 0;
  const customerHistory = {};

  orders.forEach((order) => {
    const email = order?.customer_email?.trim().toLowerCase();
    if (!email || !order.created_at) return;

    if (!customerHistory[email]) customerHistory[email] = [];
    customerHistory[email].push(new Date(order.created_at).getTime());
  });

  let totalDiffs = 0;
  let diffCount = 0;

  Object.values(customerHistory).forEach((dates) => {
    if (dates.length < 2) return;
    dates.sort((a, b) => a - b);
    for (let i = 1; i < dates.length; i++) {
      totalDiffs += dates[i] - dates[i - 1];
      diffCount++;
    }
  });

  if (diffCount === 0) return 0;
  const msInDay = 1000 * 60 * 60 * 24;
  return totalDiffs / diffCount / msInDay;
};

export const calculateCustomerLifetimeValue = (orders = []) => {
  if (!Array.isArray(orders) || orders.length === 0) return 0;
  const totalRev = calculateTotalRevenue(orders);

  const uniqueEmails = new Set();
  orders.forEach((o) => {
    const email = o?.customer_email?.trim().toLowerCase();
    if (email) uniqueEmails.add(email);
  });

  const uniqueCount = uniqueEmails.size;
  if (uniqueCount === 0) return 0;
  return totalRev / uniqueCount;
};

export const calculateTopCustomersByRevenue = (orders = []) => {
  if (!Array.isArray(orders)) return [];
  const customerData = orders.reduce((acc, order) => {
    const email = order?.customer_email?.trim().toLowerCase();
    if (!email) return acc;
    if (!acc[email]) {
      acc[email] = {
        email,
        name: order.customer_name,
        revenue: 0,
        orderCount: 0,
      };
    }
    acc[email].revenue += Number(order.total_amount || 0);
    acc[email].orderCount += 1;
    return acc;
  }, {});

  return sortByMetric(Object.values(customerData), "revenue", "desc");
};

// ==========================================
// CALCULATIONS: PRODUCTS & CATALOG
// ==========================================

export const calculateProductRevenue = (
  orders = [],
  productsMap = {},
  variantsMap = {},
) => {
  const prodStats = {};
  (orders || []).forEach((order) => {
    normalizeOrderItems(order, productsMap, variantsMap).forEach((item) => {
      const name = item.name;
      if (!prodStats[name]) prodStats[name] = { name, revenue: 0, units: 0 };
      prodStats[name].revenue += item.price * item.quantity;
      prodStats[name].units += item.quantity;
    });
  });
  return Object.values(prodStats);
};

export const calculateVariantRevenue = (
  orders = [],
  productsMap = {},
  variantsMap = {},
) => {
  const varStats = {};
  (orders || []).forEach((order) => {
    normalizeOrderItems(order, productsMap, variantsMap).forEach((item) => {
      const vKey = item.variant_id || item.name;
      if (!varStats[vKey]) {
        varStats[vKey] = {
          id: item.variant_id,
          name: item.name,
          revenue: 0,
          units: 0,
          is_preorder: item.is_preorder,
        };
      }
      varStats[vKey].revenue += item.price * item.quantity;
      varStats[vKey].units += item.quantity;
    });
  });
  return Object.values(varStats);
};

export const calculateRevenueByCategory = (
  orders = [],
  productsMap = {},
  variantsMap = {},
) => {
  const catStats = {};
  (orders || []).forEach((order) => {
    normalizeOrderItems(order, productsMap, variantsMap).forEach((item) => {
      const cat = item.category || "Uncategorized";
      if (!catStats[cat])
        catStats[cat] = { category: cat, revenue: 0, units: 0 };
      catStats[cat].revenue += item.price * item.quantity;
      catStats[cat].units += item.quantity;
    });
  });
  return Object.values(catStats);
};

export const calculateAccessoryAttachRate = (
  orders = [],
  productsMap = {},
  variantsMap = {},
) => {
  if (!Array.isArray(orders) || orders.length === 0) return 0;
  let accessoryOrders = 0;

  orders.forEach((order) => {
    const items = normalizeOrderItems(order, productsMap, variantsMap);
    const hasAccessory = items.some((i) =>
      String(i.category).toLowerCase().includes("accessor"),
    );
    if (hasAccessory) accessoryOrders++;
  });

  return (accessoryOrders / orders.length) * 100;
};

export const calculatePreorderRevenue = (
  orders = [],
  productsMap = {},
  variantsMap = {},
) => {
  let preorderRev = 0;
  (orders || []).forEach((order) => {
    normalizeOrderItems(order, productsMap, variantsMap).forEach((item) => {
      if (item.is_preorder) {
        preorderRev += item.price * item.quantity;
      }
    });
  });
  return preorderRev;
};

export const calculateCoaCoverage = (products = [], variants = []) => {
  const pCount = Array.isArray(products) ? products.length : 0;
  const vCount = Array.isArray(variants) ? variants.length : 0;

  const pCoa = (products || []).filter((p) => hasUrl(p?.lab_result_url)).length;
  const vCoa = (variants || []).filter((v) => hasUrl(v?.lab_result_url)).length;

  return {
    productCoverageRate: pCount ? (pCoa / pCount) * 100 : 0,
    variantCoverageRate: vCount ? (vCoa / vCount) * 100 : 0,
    productCoaCount: pCoa,
    variantCoaCount: vCoa,
  };
};

export const calculateMissingCoaRows = (products = [], variants = []) => {
  const missingProducts = (products || []).filter(
    (p) => p.in_stock && !hasUrl(p.lab_result_url),
  );
  const missingVariants = (variants || []).filter(
    (v) => !v.is_hidden && !hasUrl(v.lab_result_url),
  );
  return { missingProducts, missingVariants };
};

// ==========================================
// CALCULATIONS: MARKETING & CRM
// ==========================================

export const calculateDiscountCodePerformance = (
  orders = [],
  discounts = [],
  discountUsage = [],
  affiliates = [],
) => {
  const performance = {};

  // Build lookup maps to classify codes
  const affiliateMap = new Set(
    (affiliates || []).map((a) => String(a?.discount_code).toLowerCase()),
  );
  const masterDiscountMap = new Map(
    (discounts || []).map((d) => [String(d?.code).toLowerCase(), d]),
  );

  (orders || []).forEach((order) => {
    if (!order.discount_code) return;
    const code = String(order.discount_code).toLowerCase();

    if (!performance[code]) {
      let type = "Standard";
      if (affiliateMap.has(code)) type = "Affiliate";
      else if (masterDiscountMap.has(code))
        type = masterDiscountMap.get(code).type || "Standard";

      performance[code] = {
        code: order.discount_code, // Preserving original case
        type,
        uses: 0,
        revenueGenerated: 0,
        totalDiscountGiven: 0,
      };
    }

    performance[code].uses += 1;
    performance[code].revenueGenerated += Number(order.total_amount || 0);
    performance[code].totalDiscountGiven += Number(order.discount_amount || 0);
  });

  return sortByMetric(Object.values(performance), "revenueGenerated", "desc");
};

export const calculateAffiliatePerformance = (orders = [], affiliates = []) => {
  if (!Array.isArray(affiliates) || !Array.isArray(orders)) return [];

  return affiliates.map((affiliate) => {
    const code = String(affiliate.discount_code).toLowerCase();
    const relatedOrders = orders.filter(
      (o) => String(o.discount_code).toLowerCase() === code,
    );

    const revenue = calculateTotalRevenue(relatedOrders);
    const estimatedCommission =
      revenue * (Number(affiliate.commission_rate) || 0);

    return {
      id: affiliate.id,
      name: affiliate.name,
      code: affiliate.discount_code,
      ordersReferred: relatedOrders.length,
      revenueGenerated: revenue,
      estimatedCommission,
      totalPaid: Number(affiliate.total_paid || 0),
    };
  });
};

export const calculateVoucherLiability = (vouchers = []) => {
  const activeVouchers = (vouchers || []).filter(
    (v) => v.is_active && new Date(v.expires_at) > new Date(),
  );
  return activeVouchers.reduce(
    (sum, v) => sum + Number(v.current_balance || 0),
    0,
  );
};

export const calculateSubscriberGrowth = (
  subscribers = [],
  granularity = "month",
) => {
  const groups = groupByPeriod(subscribers, "created_at", granularity);
  return Object.entries(groups)
    .map(([period, subs]) => ({
      period,
      count: subs.length,
    }))
    .sort((a, b) => a.period.localeCompare(b.period));
};

export const calculateSupportVolume = (
  inquiries = [],
  inbox = [],
  granularity = "week",
) => {
  const inqGroups = groupByPeriod(inquiries, "created_at", granularity);
  const inboxGroups = groupByPeriod(inbox, "created_at", granularity);

  const allPeriods = new Set([
    ...Object.keys(inqGroups),
    ...Object.keys(inboxGroups),
  ]);

  return Array.from(allPeriods)
    .sort()
    .map((period) => ({
      period,
      inquiries: inqGroups[period]?.length || 0,
      inboxMessages: inboxGroups[period]?.length || 0,
      total:
        (inqGroups[period]?.length || 0) + (inboxGroups[period]?.length || 0),
    }));
};

export const calculateReviewDistribution = (reviews = []) => {
  const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  (reviews || []).forEach((r) => {
    if (dist[r.rating] !== undefined) dist[r.rating]++;
  });
  return dist;
};

export const calculateAverageRating = (reviews = []) => {
  if (!Array.isArray(reviews) || reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, r) => acc + Number(r.rating || 0), 0);
  return sum / reviews.length;
};

// ==========================================
// CALCULATIONS: FULFILLMENT & OPERATIONS
// ==========================================

export const calculateFulfillmentHealth = (orders = []) => {
  if (!Array.isArray(orders))
    return { missingTracking: 0, problemOrders: 0, missingLabels: 0 };

  const activeOrders = orders.filter(
    (o) => o.status !== "cancelled" && o.status !== "refunded",
  );

  return {
    missingTracking: activeOrders.filter((o) => !o.tracking_number).length,
    problemOrders: orders.filter((o) => o.error_notes || o.status === "error")
      .length,
    missingLabels: activeOrders.filter((o) => !o.label_pdf_url).length,
  };
};

export const calculateDataAvailability = (db) => {
  return {
    ordersReady: !!db?.orders?.length,
    productsReady: !!db?.products?.length,
    customersReady: !!db?.orders?.length, // derived from orders
    marketingReady: !!db?.discounts?.length || !!db?.affiliates?.length,
  };
};

// ==========================================
// UNTRACKED / UNAVAILABLE METRICS
// ==========================================
// Fallbacks for requested metrics that cannot be calculated with current DB schema.

export const calculateConversionRate = () =>
  notTrackedMetric(
    "Conversion Rate",
    "Visitor sessions and purchase events",
    "Add analytics_events table or connect GA4",
  );

export const calculateCartAbandonmentRate = () =>
  notTrackedMetric(
    "Cart Abandonment Rate",
    "Checkout initiation logs and abandoned cart records",
    "Implement cart tracking table",
  );

export const calculateTimeToPurchase = () =>
  notTrackedMetric(
    "Time to Purchase",
    "Session start timestamps mapped to order execution",
    "Requires deeper tracking pixel integration",
  );

export const calculateTrafficSources = () =>
  notTrackedMetric(
    "Traffic Sources",
    "UTM parameters and referrers mapped to orders",
    "Log UTM data in order metadata",
  );

export const calculateCpaByChannel = () =>
  notTrackedMetric(
    "CPA by Channel",
    "Ad spend data and attribution logs",
    "Requires marketing API integrations (Meta/Google Ads)",
  );

export const calculateBounceRateByLandingPage = () =>
  notTrackedMetric(
    "Bounce Rate by Landing Page",
    "Pageview and session duration logs",
    "Refer to Google Analytics for this metric",
  );

export const calculateStockTurnoverRate = () =>
  notTrackedMetric(
    "Stock Turnover Rate",
    "Historical exact inventory quantities and COGS",
    "Requires strict inventory quantity tracking, currently using boolean in_stock",
  );

export const calculateOutOfStockFrequency = () =>
  notTrackedMetric(
    "Out of Stock Frequency",
    "Historical logs of inventory state changes",
    "Add inventory_logs table",
  );

export const calculateCoaRequestRate = () =>
  notTrackedMetric(
    "Orders with COA Requests",
    "Specific customer request flags for printed COAs",
    "Add 'requires_printed_coa' boolean to orders",
  );

export const calculateCheckoutDropOffs = () =>
  notTrackedMetric(
    "Checkout Drop-off Points",
    "Funnel step events (cart -> shipping -> payment)",
    "Implement checkout funnel tracking",
  );

export const calculateSubscriptionEnrollment = () =>
  notTrackedMetric(
    "Subscription / Auto-ship Enrollment",
    "Subscriptions table mapping recurring Stripe profiles",
    "Implement subscription tracking schema",
  );

export const calculateFulfillmentTime = () =>
  notTrackedMetric(
    "Fulfillment Time",
    "shipped_at or dispatched_at timestamps",
    "Add dispatched_at column to orders table",
  );

export const calculateShippingSpeed = () =>
  notTrackedMetric(
    "Shipping Speed",
    "Carrier delivery confirmation timestamps",
    "Integrate with AusPost/Startrack Webhooks",
  );

export const calculateChargebackRate = () =>
  notTrackedMetric(
    "Chargeback Rate",
    "Stripe dispute logs",
    "Sync Stripe disputes to a local table",
  );

export const calculateInventoryDaysOnHand = () =>
  notTrackedMetric(
    "Inventory Days on Hand",
    "Exact current stock quantities",
    "Requires migrating from boolean in_stock to numeric quantities",
  );
