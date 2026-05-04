import React, { useMemo, useEffect } from "react";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  normalizeOrderItems,
  hasUrl,
  matchesRecordSearch,
} from "../utils";
import {
  MetricCard,
  InsightPanels,
  CustomTooltip,
  EmptyChart,
} from "../SharedUI";
import DataTable from "../DataTable";
import { Package, Tag, TrendingUp, Activity } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
} from "recharts";

export default function ProductPerformanceTab({
  db,
  filterByDate,
  productsMap,
  variantsMap,
  searchQuery,
  applyRowFilters,
  setExportData,
}) {
  const viewData = useMemo(() => {
    const fOrders = filterByDate(db.orders);

    const prodStats = {};
    const varStats = {};
    let totalUnits = 0;
    let accessoryOrders = new Set();

    fOrders.forEach((o) => {
      const items = normalizeOrderItems(o, productsMap, variantsMap);
      let hasAccessory = false;
      items.forEach((i) => {
        if (i.category.toLowerCase().includes("accessor")) hasAccessory = true;
        totalUnits += i.quantity;

        const vKey = i.variant_id || i.name;
        if (!varStats[vKey])
          varStats[vKey] = {
            name: i.name,
            category: i.category,
            qty: 0,
            rev: 0,
            is_preorder: i.is_preorder,
          };
        varStats[vKey].qty += i.quantity;
        varStats[vKey].rev += i.price * i.quantity;

        const pKey = i.name;
        if (!prodStats[pKey])
          prodStats[pKey] = {
            name: pKey,
            category: i.category,
            qty: 0,
            rev: 0,
          };
        prodStats[pKey].qty += i.quantity;
        prodStats[pKey].rev += i.price * i.quantity;
      });
      if (hasAccessory) accessoryOrders.add(o.id);
    });

    const topProducts = Object.values(prodStats)
      .sort((a, b) => b.rev - a.rev)
      .slice(0, 5);
    const topVariants = Object.values(varStats)
      .sort((a, b) => b.rev - a.rev)
      .slice(0, 5);
    const preorderRev = Object.values(varStats)
      .filter((v) => v.is_preorder)
      .reduce((acc, v) => acc + v.rev, 0);
    const accAttachRate = fOrders.length
      ? (accessoryOrders.size / fOrders.length) * 100
      : 0;

    let table = db.variants.map((v) => {
      const p = productsMap[v.product_id];
      const stats = varStats[v.id] || { qty: 0, rev: 0 };
      return {
        _revenue: stats.rev, // Hidden sort key
        product: p?.name || "Orphan",
        slug: p?.slug || "N/A",
        category: p?.category || "N/A",
        variant_id: v.id,
        size_label: v.size_label,
        price: formatCurrency(v.price),
        units_sold: stats.qty,
        revenue: formatCurrency(stats.rev),
        product_stock: p?.in_stock ? "In Stock" : "Out of Stock",
        stock: v.in_stock ? "In Stock" : "Out of Stock",
        preorder: v.is_preorder ? "Yes" : "No",
        hidden: v.is_hidden ? "Yes" : "No",
        default: v.is_default ? "Yes" : "No",
        product_coa: hasUrl(p?.lab_result_url) ? "Verified" : "Missing",
        variant_coa: hasUrl(v.lab_result_url) ? "Verified" : "Missing",
      };
    });

    if (searchQuery)
      table = table.filter((r) => matchesRecordSearch(r, searchQuery));
    table = table.filter(applyRowFilters);
    table.sort((a, b) => b._revenue - a._revenue); // Default sort

    return {
      metrics: [
        {
          label: "Total Products",
          value: db.products.length,
          icon: <Package />,
        },
        { label: "Total Variants", value: db.variants.length, icon: <Tag /> },
        {
          label: "Units Sold",
          value: formatNumber(totalUnits),
          icon: <TrendingUp />,
        },
        {
          label: "Accessory Attach Rate",
          value: formatPercent(accAttachRate),
          icon: <Activity />,
        },
      ],
      insights: [
        `Top product is ${topProducts[0]?.name || "N/A"} with ${formatCurrency(topProducts[0]?.rev || 0)} in revenue.`,
        `Preorder variants generated ${formatCurrency(preorderRev)} in revenue.`,
      ],
      quality: [],
      charts: [
        {
          title: "Top 5 Products by Revenue",
          data: topProducts,
          type: "bar",
          x: "name",
          y: "rev",
        },
        {
          title: "Top 5 Variants by Revenue",
          data: topVariants.map((v) => ({
            ...v,
            name: `${v.name.substring(0, 15)}...`,
          })),
          type: "bar",
          x: "name",
          y: "rev",
        },
      ],
      tableCols: [
        "product",
        "category",
        "size_label",
        "price",
        "units_sold",
        "revenue",
        "stock",
        "preorder",
        "hidden",
      ],
      tableData: table,
    };
  }, [
    db,
    filterByDate,
    productsMap,
    variantsMap,
    searchQuery,
    applyRowFilters,
  ]);

  useEffect(() => {
    setExportData({ rows: viewData.tableData, cols: viewData.tableCols });
  }, [viewData, setExportData]);

  return (
    <div className="tab-content">
      <div className="metrics-grid">
        {viewData.metrics.map((m, i) => (
          <MetricCard key={i} {...m} />
        ))}
      </div>
      <InsightPanels insights={viewData.insights} quality={viewData.quality} />

      <div className="charts-grid">
        {viewData.charts.map((chart, i) => (
          <div key={i} className="chart-card">
            <h3>{chart.title}</h3>
            <div className="chart-wrapper">
              {chart.data.length ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={chart.data}
                    layout={chart.layout || "horizontal"}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />
                    <XAxis
                      dataKey={chart.x}
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={formatCurrency}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey={chart.y}
                      fill="#0d9488"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart />
              )}
            </div>
          </div>
        ))}
      </div>

      <DataTable
        data={viewData.tableData}
        columns={viewData.tableCols}
        resetKey="products"
      />
    </div>
  );
}
