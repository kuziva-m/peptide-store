import { useState, useMemo, useCallback } from "react";

export function useAnalysisFilters(db) {
  const [dateRange, setDateRange] = useState("all");
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

  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setSearchQuery("");
    setDateRange("all");
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

  const filterByDate = useCallback(
    (records, dateField = "created_at") => {
      if (dateRange === "all" || !records) return records;
      const cutoff = new Date();
      if (dateRange === "today") cutoff.setHours(0, 0, 0, 0);
      else if (dateRange === "7d") cutoff.setDate(cutoff.getDate() - 7);
      else if (dateRange === "30d") cutoff.setDate(cutoff.getDate() - 30);
      else if (dateRange === "90d") cutoff.setDate(cutoff.getDate() - 90);
      else if (dateRange === "ytd") {
        cutoff.setMonth(0, 1);
        cutoff.setHours(0, 0, 0, 0);
      }
      return records.filter((r) => new Date(r[dateField]) >= cutoff);
    },
    [dateRange],
  );

  const applyRowFilters = useCallback(
    (row) => {
      if (
        filters.category !== "All" &&
        row.category &&
        row.category !== filters.category
      )
        return false;
      if (
        filters.product !== "All" &&
        row.product &&
        row.product !== filters.product
      )
        return false;
      if (
        filters.orderStatus !== "All" &&
        row.status &&
        row.status !== filters.orderStatus
      )
        return false;
      if (
        filters.shippingMethod !== "All" &&
        row.method &&
        row.method !== filters.shippingMethod
      )
        return false;
      if (
        filters.stateRegion !== "All" &&
        row.state &&
        row.state !== filters.stateRegion
      )
        return false;
      if (
        filters.discountCode !== "All" &&
        row.discount_code &&
        row.discount_code !== filters.discountCode
      )
        return false;
      if (
        filters.preorder !== "All" &&
        row.preorder !== undefined &&
        row.preorder !== (filters.preorder === "Yes" ? "Yes" : "No")
      )
        return false;
      if (
        filters.visibility !== "All" &&
        row.hidden !== undefined &&
        row.hidden !== (filters.visibility === "Visible" ? "No" : "Yes")
      )
        return false;
      if (
        filters.coaStatus !== "All" &&
        row.product_coa &&
        row.product_coa !== filters.coaStatus
      )
        return false;
      if (
        filters.availability !== "All" &&
        row.stock &&
        row.stock !== filters.availability
      )
        return false;
      return true;
    },
    [filters],
  );

  return {
    dateRange,
    setDateRange,
    searchQuery,
    setSearchQuery,
    filters,
    handleFilterChange,
    resetFilters,
    derivedOptions,
    filterByDate,
    applyRowFilters,
  };
}
