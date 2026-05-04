import React, { useMemo, useEffect } from "react";
import {
  formatCurrency,
  formatPercent,
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
import { Package, CheckCircle2, Clock, EyeOff } from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

export default function CatalogPreordersTab({
  db,
  productsMap,
  searchQuery,
  applyRowFilters,
  setExportData,
}) {
  const viewData = useMemo(() => {
    let table = db.variants.map((v) => {
      const p = productsMap[v.product_id];
      return {
        _rawDate: p?.created_at || "",
        product: p?.name || "Orphan Variant",
        category: p?.category || "N/A",
        product_stock: p?.in_stock ? "In Stock" : "Out of Stock",
        variant: v.size_label,
        price: formatCurrency(v.price),
        stock: v.in_stock
          ? "In Stock"
          : v.is_preorder
            ? "Preorder"
            : "Out of Stock",
        preorder: v.is_preorder ? "Yes" : "No",
        hidden: v.is_hidden ? "Yes" : "No",
        default: v.is_default ? "Yes" : "No",
        stripe_id: v.stripe_price_id ? "Linked" : "Missing",
        image_status:
          hasUrl(p?.image_url) || hasUrl(v.image_url) ? "Yes" : "No",
      };
    });

    if (searchQuery)
      table = table.filter((r) => matchesRecordSearch(r, searchQuery));
    table = table.filter(applyRowFilters);
    table.sort((a, b) => new Date(b._rawDate) - new Date(a._rawDate));

    const inStockCount = db.products.filter((p) => p.in_stock).length;
    const preorderCount = db.variants.filter((v) => v.is_preorder).length;
    const hiddenCount = db.variants.filter((v) => v.is_hidden).length;
    const missingStripe = db.variants.filter((v) => !v.stripe_price_id).length;

    const chartData = [
      { name: "In Stock", value: db.variants.filter((v) => v.in_stock).length },
      {
        name: "Out of Stock",
        value: db.variants.filter((v) => !v.in_stock && !v.is_preorder).length,
      },
      { name: "Preorder", value: preorderCount },
    ];

    return {
      metrics: [
        {
          label: "Active Products",
          value: db.products.length,
          icon: <Package />,
        },
        {
          label: "In Stock Products",
          value: inStockCount,
          icon: <CheckCircle2 />,
        },
        { label: "Preorder Variants", value: preorderCount, icon: <Clock /> },
        { label: "Hidden Variants", value: hiddenCount, icon: <EyeOff /> },
      ],
      quality: [
        {
          label: "Variants Missing Stripe ID",
          value: missingStripe,
          critical: missingStripe > 0,
        },
        {
          label: "Products Missing Images",
          value: db.products.filter((p) => !hasUrl(p.image_url)).length,
          critical: true,
        },
      ],
      insights: [
        `${formatPercent((inStockCount / Math.max(db.products.length, 1)) * 100)} of your master products are marked in-stock.`,
        `There are ${db.variants.filter((v) => v.is_default).length} variants assigned as defaults.`,
      ],
      charts: [
        {
          title: "Variant Availability",
          data: chartData,
          type: "pie",
          nameKey: "name",
          dataKey: "value",
        },
      ],
      tableCols: [
        "product",
        "category",
        "product_stock",
        "variant",
        "price",
        "stock",
        "preorder",
        "hidden",
        "default",
        "stripe_id",
      ],
      tableData: table,
    };
  }, [db, productsMap, searchQuery, applyRowFilters]);

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
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chart.data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    nameKey="name"
                  >
                    {chart.data.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          [
                            "#4635de",
                            "#0d9488",
                            "#f59e0b",
                            "#e11d48",
                            "#64748b",
                          ][index % 5]
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>

      <DataTable
        data={viewData.tableData}
        columns={viewData.tableCols}
        resetKey="inventory"
      />
    </div>
  );
}
