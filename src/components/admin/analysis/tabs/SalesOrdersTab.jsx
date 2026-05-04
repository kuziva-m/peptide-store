import React, { useMemo, useEffect } from "react";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatDate,
  shortId,
  matchesRecordSearch,
  hasUrl,
} from "../utils";
import {
  MetricCard,
  InsightPanels,
  CustomTooltip,
  EmptyChart,
} from "../SharedUI";
import DataTable from "../DataTable";
import { DollarSign, Package, CheckCircle2, AlertCircle } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
} from "recharts";

export default function SalesOrdersTab({
  db,
  filterByDate,
  searchQuery,
  applyRowFilters,
  setExportData,
}) {
  const viewData = useMemo(() => {
    const fOrders = filterByDate(db.orders);
    const calcTotalRev = fOrders.reduce(
      (acc, o) => acc + Number(o.total_amount || 0),
      0,
    );

    let table = fOrders.map((o) => ({
      _rawDate: o.created_at,
      id: shortId(o.id),
      date: formatDate(o.created_at),
      customer: o.customer_name || "Unknown",
      email: o.customer_email || "Unknown",
      total: formatCurrency(o.total_amount),
      discount: formatCurrency(o.discount_amount),
      status: o.status,
      method: o.shipping_method || "Standard",
      state: o.shipping_address?.state || "N/A",
      discount_code: o.discount_code || "",
      tracking: o.tracking_number ? "Yes" : "No",
      label: o.label_pdf_url ? "Yes" : "No",
    }));

    if (searchQuery)
      table = table.filter((r) => matchesRecordSearch(r, searchQuery));
    table = table.filter(applyRowFilters);
    table.sort((a, b) => new Date(b._rawDate) - new Date(a._rawDate)); // Newest first

    const statusCounts = fOrders.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {});
    const chartStatus = Object.entries(statusCounts).map(([name, count]) => ({
      name,
      count,
    }));

    const missingTracking = fOrders.filter(
      (o) => !o.tracking_number && o.status !== "cancelled",
    ).length;
    const problemOrders = fOrders.filter(
      (o) => o.error_notes || o.status === "error",
    ).length;

    return {
      metrics: [
        {
          label: "Gross Sales",
          value: formatCurrency(calcTotalRev),
          icon: <DollarSign />,
        },
        {
          label: "Orders",
          value: formatNumber(fOrders.length),
          icon: <Package />,
        },
        {
          label: "Shipped",
          value: formatNumber(statusCounts["shipped"] || 0),
          icon: <CheckCircle2 />,
        },
        {
          label: "Missing Tracking",
          value: missingTracking,
          icon: <AlertCircle />,
          alert: missingTracking > 0,
        },
      ],
      quality: [
        {
          label: "Orders with Error Notes",
          value: problemOrders,
          critical: true,
        },
        {
          label: "Orders Missing Receipt URL",
          value: fOrders.filter((o) => !hasUrl(o.receipt_url)).length,
          critical: false,
        },
      ],
      insights: [
        `Average order value is ${formatCurrency(fOrders.length ? calcTotalRev / fOrders.length : 0)}.`,
        `Discount usage rate is ${formatPercent((fOrders.filter((o) => o.discount_amount > 0).length / Math.max(fOrders.length, 1)) * 100)}.`,
      ],
      charts: [
        {
          title: "Orders by Status",
          data: chartStatus,
          type: "bar",
          x: "name",
          y: "count",
        },
      ],
      tableCols: [
        "id",
        "date",
        "customer",
        "email",
        "total",
        "discount",
        "status",
        "method",
        "state",
        "tracking",
        "label",
      ],
      tableData: table,
    };
  }, [db, filterByDate, searchQuery, applyRowFilters]);

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
                  <BarChart data={chart.data}>
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
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
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
        resetKey="sales"
      />
    </div>
  );
}
