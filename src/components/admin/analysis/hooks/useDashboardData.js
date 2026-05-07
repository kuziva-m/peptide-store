import { useState, useEffect, useMemo } from "react";
import { supabase } from "../../../../lib/supabase";

async function fetchAllRows(buildQuery, pageSize = 1000) {
  let allRows = [];
  let from = 0;
  while (true) {
    const to = from + pageSize - 1;
    const { data, error } = await buildQuery().range(from, to);
    if (error) throw error;
    const rows = data || [];
    allRows = [...allRows, ...rows];
    if (rows.length < pageSize) break;
    from += pageSize;
  }
  return allRows;
}

// Defensive fetch wrapper to prevent non-critical missing tables from crashing the dashboard
async function safeFetch(tableName, fetcher, isRequired = false) {
  try {
    return await fetcher();
  } catch (error) {
    console.warn(`[Analytics] Error fetching table '${tableName}':`, error);
    if (isRequired) {
      throw new Error(
        `Critical data fetch failed for ${tableName}: ${error.message}`,
      );
    }
    return []; // Graceful degradation for optional/missing tables
  }
}

// Analytics gap analysis map
const DATA_AVAILABILITY = {
  totalRevenue: "available",
  aov: "available",
  revenueByProduct: "available",
  conversionRate: "missing, needs visitor/session tracking",
  refundRate: "partial/missing unless order statuses include refunded",
  cartAbandonmentRate: "missing, needs cart/checkout events",
  trafficSources: "missing, needs GA4/UTM/session tracking",
  cpaByChannel: "missing, needs ad spend data",
  bounceRateByLandingPage: "missing, needs analytics events",
  stockTurnoverRate: "missing, needs stock_quantity/inventory_movements",
  outOfStockFrequency:
    "partial, can read current variant in_stock but not historical frequency",
  fulfillmentTime:
    "partial/missing, needs fulfilled_at/shipped_at or fulfillment events",
  chargebackRate: "missing unless chargebacks table/order status exists",
};

// Database expansion recommendations for missing metrics
const SCHEMA_RECOMMENDATIONS = [
  "analytics_events",
  "sessions",
  "carts",
  "checkout_events",
  "traffic_sources",
  "ad_spend",
  "refunds",
  "chargebacks",
  "fulfillment_events",
  "inventory_batches",
  "inventory_movements",
  "email_campaign_metrics",
  "coa_requests",
  "subscriptions",
];

export function useDashboardData() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [db, setDb] = useState({
    orders: [],
    orderItems: [],
    products: [],
    variants: [],
    discounts: [],
    discountUsage: [],
    affiliates: [],
    vouchers: [],
    inquiries: [],
    inbox: [],
    reviews: [],
    subscribers: [],
  });

  const fetchData = async () => {
    try {
      setRefreshing(true);
      setError(null);
      const now = new Date().toISOString();

      const [
        ordersData,
        orderItemsData,
        productsData,
        variantsData,
        discountsData,
        discountUsageData,
        affiliatesData,
        vouchersData,
        inquiriesData,
        inboxData,
        reviewsData,
        subscribersData,
      ] = await Promise.all([
        safeFetch(
          "orders",
          () =>
            fetchAllRows(() =>
              supabase
                .from("orders")
                .select("*")
                .lte("created_at", now)
                .order("created_at", { ascending: false }),
            ),
          true,
        ), // Required table

        safeFetch(
          "order_items",
          () =>
            fetchAllRows(() =>
              supabase
                .from("order_items")
                .select(
                  `*, variants(id, size_label, price, in_stock, lab_result_url, is_hidden, is_default, is_preorder, products(id, name, category, slug, image_url, in_stock, lab_result_url))`,
                ),
            ),
          true,
        ), // Required table

        safeFetch(
          "products",
          () =>
            fetchAllRows(() =>
              supabase
                .from("products")
                .select("*, variants(*)")
                .order("created_at", { ascending: false }),
            ),
          true,
        ), // Required table

        safeFetch(
          "variants",
          () =>
            fetchAllRows(() =>
              supabase
                .from("variants")
                .select(
                  `*, products(id, name, category, slug, image_url, in_stock, lab_result_url)`,
                ),
            ),
          true,
        ), // Required table

        safeFetch(
          "discounts",
          () =>
            supabase
              .from("discounts")
              .select("*")
              .then((res) => {
                if (res.error) throw res.error;
                return res.data;
              }),
          false,
        ), // Optional

        safeFetch(
          "discount_usage",
          () =>
            fetchAllRows(() =>
              supabase
                .from("discount_usage")
                .select("*")
                .order("created_at", { ascending: false }),
            ),
          false,
        ), // Optional

        safeFetch(
          "affiliates",
          () =>
            supabase
              .from("affiliates")
              .select(
                "id, name, discount_code, commission_rate, created_at, profile_image_url, total_paid",
              )
              .then((res) => {
                if (res.error) throw res.error;
                return res.data;
              }),
          false,
        ), // Optional, explicitly restricted to safe fields only

        safeFetch(
          "vouchers",
          () =>
            supabase
              .from("vouchers")
              .select("*")
              .then((res) => {
                if (res.error) throw res.error;
                return res.data;
              }),
          false,
        ), // Optional

        safeFetch(
          "inquiries",
          () =>
            fetchAllRows(() =>
              supabase
                .from("inquiries")
                .select("*")
                .order("created_at", { ascending: false }),
            ),
          false,
        ), // Optional

        safeFetch(
          "inbox_messages",
          () =>
            fetchAllRows(() =>
              supabase
                .from("inbox_messages")
                .select("id, created_at, sender, subject, body_text, is_read")
                .order("created_at", { ascending: false }),
            ),
          false,
        ), // Optional

        safeFetch(
          "reviews",
          () =>
            fetchAllRows(() =>
              supabase
                .from("reviews")
                .select("*")
                .order("created_at", { ascending: false }),
            ),
          false,
        ), // Optional

        safeFetch(
          "subscribers",
          () =>
            fetchAllRows(() =>
              supabase
                .from("subscribers")
                .select("*")
                .order("created_at", { ascending: false }),
            ),
          false,
        ), // Optional
      ]);

      setDb({
        orders: ordersData,
        orderItems: orderItemsData,
        products: productsData,
        variants: variantsData,
        discounts: discountsData,
        discountUsage: discountUsageData,
        affiliates: affiliatesData,
        vouchers: vouchersData,
        inquiries: inquiriesData,
        inbox: inboxData,
        reviews: reviewsData,
        subscribers: subscribersData,
      });

      setLastUpdated(new Date());
    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute Lookups once
  const productsMap = useMemo(
    () => Object.fromEntries(db.products.map((p) => [p.id, p])),
    [db.products],
  );

  const variantsMap = useMemo(
    () => Object.fromEntries(db.variants.map((v) => [v.id, v])),
    [db.variants],
  );

  return {
    db,
    loading,
    refreshing,
    error,
    lastUpdated,
    refreshData: fetchData,
    productsMap,
    variantsMap,
    dataAvailability: DATA_AVAILABILITY,
    schemaRecommendations: SCHEMA_RECOMMENDATIONS,
  };
}
