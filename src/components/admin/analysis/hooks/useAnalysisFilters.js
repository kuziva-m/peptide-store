import { useState, useMemo, useCallback } from "react";

const TAB_DEFAULT_SORTS = {
  overview: { by: "revenue", dir: "desc" },
  sales: { by: "created_at", dir: "desc" },
  products: { by: "revenue", dir: "desc" },
  inventory: { by: "availability_risk", dir: "desc" },
  compliance: { by: "risk_flags", dir: "desc" },
  marketing: { by: "revenue", dir: "desc" },
  crm: { by: "created_at", dir: "desc" },
};

export function useAnalysisFilters(db) {
  // 1. Global Filters State
  const [dateRange, setDateRange] = useState("all");
  const [customStartDate, setCustomStartDate] = useState(null);
  const [customEndDate, setCustomEndDate] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [filters, setFilters] = useState({
    category: "All",
    product: "All",
    preorder: "All",
    orderStatus: "All",
    shippingMethod: "All",
    stateRegion: "All",
    discountCode: "All",
    coaStatus: "All",
    visibility: "All",
    availability: "All",
  });

  // 2. Analyst View Controls State
  const [viewControls, setViewControls] = useState({
    viewMode: "table", // "table", "cards", "compact"
    chartGranularity: "day", // "day", "week", "month"
    selectedMetric: "revenue", // "revenue", "orders", "units", "aov", "discounts", "shipping"
    topN: 5, // 5, 10, 25, 50, "all"
    sortBy: null,
    sortDirection: "desc", // "asc", "desc"
    compareMode: "none", // "none", "previous_period"
  });

  // 3. Quick Filters State
  const [quickFilter, setQuickFilter] = useState(null);

  // --- State Updaters ---

  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleViewControlChange = useCallback((key, value) => {
    setViewControls((prev) => ({ ...prev, [key]: value }));
  }, []);

  const triggerQuickFilter = useCallback((filterKey) => {
    setQuickFilter(filterKey);
  }, []);

  const clearQuickFilter = useCallback(() => {
    setQuickFilter(null);
  }, []);

  // --- Reset Functions ---

  const resetFilters = useCallback(() => {
    setSearchQuery("");
    setDateRange("all");
    setCustomStartDate(null);
    setCustomEndDate(null);
    setFilters({
      category: "All",
      product: "All",
      preorder: "All",
      orderStatus: "All",
      shippingMethod: "All",
      stateRegion: "All",
      discountCode: "All",
      coaStatus: "All",
      visibility: "All",
      availability: "All",
    });
  }, []);

  const resetViewControls = useCallback(() => {
    setViewControls({
      viewMode: "table",
      chartGranularity: "day",
      selectedMetric: "revenue",
      topN: 5,
      sortBy: null,
      sortDirection: "desc",
      compareMode: "none",
    });
  }, []);

  const resetAllControls = useCallback(() => {
    resetFilters();
    resetViewControls();
    clearQuickFilter();
  }, [resetFilters, resetViewControls, clearQuickFilter]);

  const removeFilter = useCallback(
    (key) => {
      if (key === "searchQuery") setSearchQuery("");
      else if (key === "dateRange") {
        setDateRange("all");
        setCustomStartDate(null);
        setCustomEndDate(null);
      } else if (key === "quickFilter") setQuickFilter(null);
      else if (filters[key] !== undefined) {
        setFilters((prev) => ({ ...prev, [key]: "All" }));
      }
    },
    [filters],
  );

  // --- Derived Data ---

  const getTabDefaultSort = useCallback((tabId) => {
    return TAB_DEFAULT_SORTS[tabId] || { by: "created_at", dir: "desc" };
  }, []);

  const derivedOptions = useMemo(() => {
    if (!db) return {};
    const cats = new Set(
      (db.products || []).map((p) => p.category).filter(Boolean),
    );
    const prods = new Set(
      (db.products || []).map((p) => p.name).filter(Boolean),
    );
    const states = new Set(
      (db.orders || []).map((o) => o.shipping_address?.state).filter(Boolean),
    );
    const codes = new Set([
      ...(db.discounts || []).map((d) => d.code),
      ...(db.affiliates || []).map((a) => a.discount_code),
    ]);
    const shipMethods = new Set(
      (db.orders || []).map((o) => o.shipping_method).filter(Boolean),
    );
    const orderStatuses = new Set(
      (db.orders || []).map((o) => o.status).filter(Boolean),
    );

    return {
      categories: ["All", ...Array.from(cats).sort()],
      products: ["All", ...Array.from(prods).sort()],
      states: ["All", ...Array.from(states).sort()],
      discountCodes: ["All", ...Array.from(codes).sort()],
      shippingMethods: ["All", ...Array.from(shipMethods).sort()],
      orderStatuses: ["All", ...Array.from(orderStatuses).sort()],
      preorder: ["All", "Yes", "No"],
      coa: ["All", "Verified", "Missing"],
      visibility: ["All", "Visible", "Hidden"],
      availability: ["All", "In Stock", "Out of Stock", "Preorder"],
    };
  }, [db]);

  const activeFilterChips = useMemo(() => {
    const chips = [];

    if (searchQuery) {
      chips.push({
        key: "searchQuery",
        label: "Search",
        value: searchQuery,
        onRemoveKey: "searchQuery",
      });
    }

    if (dateRange !== "all") {
      let val = dateRange;
      if (dateRange === "custom") {
        val = `${customStartDate || "?"} to ${customEndDate || "?"}`;
      }
      chips.push({
        key: "dateRange",
        label: "Date",
        value: val,
        onRemoveKey: "dateRange",
      });
    }

    Object.entries(filters).forEach(([k, v]) => {
      if (v !== "All") {
        const formattedKey = k
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (str) => str.toUpperCase());
        chips.push({ key: k, label: formattedKey, value: v, onRemoveKey: k });
      }
    });

    if (quickFilter) {
      const formattedQF = quickFilter
        .replace(/_/g, " ")
        .replace(/^./, (str) => str.toUpperCase());
      chips.push({
        key: "quickFilter",
        label: "Quick Filter",
        value: formattedQF,
        onRemoveKey: "quickFilter",
      });
    }

    return chips;
  }, [
    searchQuery,
    dateRange,
    customStartDate,
    customEndDate,
    filters,
    quickFilter,
  ]);

  // --- Filtering Logic ---

  const filterByDate = useCallback(
    (records, dateField = "created_at") => {
      if (!records || !Array.isArray(records)) return [];
      if (dateRange === "all") return records;

      const cutoff = new Date();
      let endCutoff = new Date();

      if (dateRange === "today") cutoff.setHours(0, 0, 0, 0);
      else if (dateRange === "7d") cutoff.setDate(cutoff.getDate() - 7);
      else if (dateRange === "30d") cutoff.setDate(cutoff.getDate() - 30);
      else if (dateRange === "90d") cutoff.setDate(cutoff.getDate() - 90);
      else if (dateRange === "ytd") {
        cutoff.setMonth(0, 1);
        cutoff.setHours(0, 0, 0, 0);
      } else if (dateRange === "custom") {
        if (!customStartDate) return records;
        cutoff.setTime(new Date(customStartDate).getTime());
        if (customEndDate) {
          endCutoff.setTime(new Date(customEndDate).getTime());
          endCutoff.setHours(23, 59, 59, 999);
        }
      }

      return records.filter((r) => {
        const rDate = new Date(r[dateField]);
        if (isNaN(rDate)) return true; // Keep bad dates rather than silently dropping unless strict filtering is needed

        if (dateRange === "custom" && customEndDate) {
          return rDate >= cutoff && rDate <= endCutoff;
        }
        return rDate >= cutoff;
      });
    },
    [dateRange, customStartDate, customEndDate],
  );

  const applyRowFilters = useCallback(
    (row) => {
      if (!row) return false;

      // 1. Standard Global Filters
      if (filters.category !== "All" && row.category !== filters.category)
        return false;
      if (filters.product !== "All" && row.product !== filters.product)
        return false;
      if (filters.orderStatus !== "All" && row.status !== filters.orderStatus)
        return false;
      if (
        filters.shippingMethod !== "All" &&
        row.method !== filters.shippingMethod &&
        row.shipping_method !== filters.shippingMethod
      )
        return false;
      if (filters.stateRegion !== "All" && row.state !== filters.stateRegion)
        return false;
      if (
        filters.discountCode !== "All" &&
        row.discount_code !== filters.discountCode &&
        row.code !== filters.discountCode
      )
        return false;

      // Normalizing boolean/string combinations
      if (filters.preorder !== "All") {
        const isPreorder = row.preorder === "Yes" || row.is_preorder === true;
        if (filters.preorder === "Yes" && !isPreorder) return false;
        if (filters.preorder === "No" && isPreorder) return false;
      }

      if (filters.visibility !== "All") {
        const isHidden = row.hidden === "Yes" || row.is_hidden === true;
        if (filters.visibility === "Visible" && isHidden) return false;
        if (filters.visibility === "Hidden" && !isHidden) return false;
      }

      if (filters.coaStatus !== "All") {
        const hasCoa =
          row.product_coa === "Verified" ||
          row.variant_coa === "Verified" ||
          !!row.lab_result_url;
        if (filters.coaStatus === "Verified" && !hasCoa) return false;
        if (filters.coaStatus === "Missing" && hasCoa) return false;
      }

      if (filters.availability !== "All") {
        if (row.stock && row.stock !== filters.availability) return false;
        if (row.product_stock && row.product_stock !== filters.availability)
          return false;
      }

      // 2. Quick Filters Evaluator
      if (quickFilter) {
        switch (quickFilter) {
          case "missing_tracking":
            if (row.tracking === "Yes" || !!row.tracking_number) return false;
            break;
          case "missing_label":
            if (row.label === "Yes" || !!row.label_pdf_url) return false;
            break;
          case "has_error_notes":
            if (!row.error_notes && row.status !== "error") return false;
            break;
          case "discounted_orders":
            if (
              !row.discount_code &&
              (!row.discount || row.discount === "$0.00") &&
              !row.discount_amount
            )
              return false;
            break;
          case "preorders":
            if (row.preorder !== "Yes" && row.is_preorder !== true)
              return false;
            break;
          case "missing_coa":
            if (
              row.product_coa === "Verified" ||
              row.variant_coa === "Verified" ||
              !!row.lab_result_url
            )
              return false;
            break;
          case "hidden_variants":
            if (row.hidden !== "Yes" && row.is_hidden !== true) return false;
            break;
          case "unread_inquiries":
            if (row.status !== "unread" && row.is_read !== false) return false;
            break;
          case "unlimited_discounts":
            if (row.uses !== "Unlimited" && row.max_uses !== null) return false;
            break;
          default:
            break;
        }
      }

      return true;
    },
    [filters, quickFilter],
  );

  return {
    // Global Filters
    dateRange,
    setDateRange,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    searchQuery,
    setSearchQuery,
    filters,
    handleFilterChange,

    // Analyst View Controls
    viewControls,
    setViewControls,
    handleViewControlChange,

    // Quick Filters
    quickFilter,
    triggerQuickFilter,
    clearQuickFilter,

    // Actions & Resets
    resetFilters,
    resetViewControls,
    resetAllControls,
    removeFilter,

    // Derived Data
    derivedOptions,
    activeFilterChips,
    getTabDefaultSort,

    // Data Processing
    filterByDate,
    applyRowFilters,
  };
}
