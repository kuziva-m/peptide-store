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
        fetchAllRows(() =>
          supabase
            .from("orders")
            .select("*")
            .lte("created_at", now)
            .order("created_at", { ascending: false }),
        ),
        fetchAllRows(() =>
          supabase
            .from("order_items")
            .select(
              `*, variants(id, size_label, price, in_stock, lab_result_url, is_hidden, is_default, is_preorder, products(id, name, category, slug, image_url, in_stock, lab_result_url))`,
            ),
        ),
        fetchAllRows(() =>
          supabase
            .from("products")
            .select("*, variants(*)")
            .order("created_at", { ascending: false }),
        ),
        fetchAllRows(() =>
          supabase
            .from("variants")
            .select(
              `*, products(id, name, category, slug, image_url, in_stock, lab_result_url)`,
            ),
        ),
        supabase
          .from("discounts")
          .select("*")
          .then((res) => {
            if (res.error) throw res.error;
            return res.data;
          }),
        fetchAllRows(() =>
          supabase
            .from("discount_usage")
            .select("*")
            .order("created_at", { ascending: false }),
        ),
        // Exclude sensitive affiliate fields
        supabase
          .from("affiliates")
          .select(
            "id, name, discount_code, commission_rate, created_at, profile_image_url, total_paid",
          )
          .then((res) => {
            if (res.error) throw res.error;
            return res.data;
          }),
        supabase
          .from("vouchers")
          .select("*")
          .then((res) => {
            if (res.error) throw res.error;
            return res.data;
          }),
        fetchAllRows(() =>
          supabase
            .from("inquiries")
            .select("*")
            .order("created_at", { ascending: false }),
        ),
        fetchAllRows(() =>
          supabase
            .from("inbox_messages")
            .select("id, created_at, sender, subject, body_text, is_read")
            .order("created_at", { ascending: false }),
        ),
        fetchAllRows(() =>
          supabase
            .from("reviews")
            .select("*")
            .order("created_at", { ascending: false }),
        ),
        fetchAllRows(() =>
          supabase
            .from("subscribers")
            .select("*")
            .order("created_at", { ascending: false }),
        ),
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
  };
}
