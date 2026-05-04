import React, { useMemo, useEffect } from "react";
import {
  getOrderNetRevenue,
  formatCurrency,
  formatNumber,
  formatPercent,
  normalizeOrderItems,
} from "../utils";
import {
  MetricCard,
  InsightPanels,
  CustomTooltip,
  EmptyChart,
} from "../SharedUI";
import DataTable from "../DataTable";
import {
  DollarSign,
  TrendingUp,
  Package,
  Activity,
  ShieldAlert,
  AlertTriangle,
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function ExecutiveOverviewTab({
  db,
  filterByDate,
  setExportData,
}) {
  const viewData = useMemo(() => {
    const fOrders = filterByDate(db.orders);
    const calcTotalRev = fOrders.reduce(
      (acc, o) => acc + Number(o.total_amount || 0),
      0,
    );
    const calcNetRev = fOrders.reduce(
      (acc, o) => acc + getOrderNetRevenue(o),
      0,
    );
    const calcShipping = fOrders.reduce(
      (acc, o) => acc + Number(o.shipping_cost || 0),
      0,
    );
    const calcDiscounts = fOrders.reduce(
      (acc, o) => acc + Number(o.discount_amount || 0),
      0,
    );

    const problemOrders = fOrders.filter(
      (o) => o.error_notes || o.status === "error",
    ).length;
    const missingTracking = fOrders.filter(
      (o) => !o.tracking_number && o.status !== "cancelled",
    ).length;
    const missingLabel = fOrders.filter(
      (o) => !o.label_pdf_url && o.status !== "cancelled",
    ).length;

    const productCoaCount = db.products.filter(
      (p) => p.lab_result_url && p.lab_result_url.length > 5,
    ).length;
    const preorderCount = db.variants.filter((v) => v.is_preorder).length;

    const revByDate = fOrders.reduce((acc, o) => {
      const d = o.created_at.split("T")[0];
      if (!acc[d]) acc[d] = { date: d, gross: 0, orders: 0 };
      acc[d].gross += Number(o.total_amount || 0);
      acc[d].orders += 1;
      return acc;
    }, {});
    const chartRev = Object.values(revByDate).sort((a, b) =>
      a.date.localeCompare(b.date),
    );

    const catRev = {};
    fOrders.forEach((o) => {
      normalizeOrderItems(o).forEach((i) => {
        catRev[i.category] = (catRev[i.category] || 0) + i.price * i.quantity;
      });
    });
    const chartCat = Object.entries(catRev)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return {
      metrics: [
        {
          label: "Gross Revenue",
          value: formatCurrency(calcTotalRev),
          icon: <DollarSign />,
        },
        {
          label: "Net Revenue",
          value: formatCurrency(calcNetRev),
          icon: <TrendingUp />,
        },
        {
          label: "Total Orders",
          value: formatNumber(fOrders.length),
          icon: <Package />,
        },
        {
          label: "Avg Order Value",
          value: formatCurrency(
            fOrders.length ? calcTotalRev / fOrders.length : 0,
          ),
          icon: <Activity />,
        },
        {
          label: "COA Coverage",
          value: formatPercent(
            (productCoaCount / Math.max(db.products.length, 1)) * 100,
          ),
          icon: <ShieldAlert />,
        },
        {
          label: "Pending/Errors",
          value: problemOrders,
          icon: <AlertTriangle />,
          alert: problemOrders > 0,
        },
      ],
      quality: [
        {
          label: "Orders Missing Tracking",
          value: missingTracking,
          critical: true,
        },
        {
          label: "Orders Missing Label PDF",
          value: missingLabel,
          critical: true,
        },
        {
          label: "Products Missing COA",
          value: db.products.length - productCoaCount,
          critical: true,
        },
      ],
      insights: [
        `Preorder variants make up ${formatPercent((preorderCount / Math.max(db.variants.length, 1)) * 100)} of your catalog.`,
        `You have collected ${formatCurrency(calcShipping)} in shipping revenue.`,
        `${formatCurrency(calcDiscounts)} was given in discounts across ${fOrders.filter((o) => o.discount_code).length} orders.`,
      ],
      chartRev,
      chartCat,
      tableData: [],
      tableCols: [],
    };
  }, [db, filterByDate]);

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
        <div className="chart-card">
          <h3>Revenue Trend</h3>
          <div className="chart-wrapper">
            {viewData.chartRev.length ? (
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={viewData.chartRev}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="date"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    yAxisId="left"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={formatCurrency}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar
                    yAxisId="right"
                    dataKey="orders"
                    barSize={20}
                    fill="#cbd5e1"
                    name="Orders"
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="gross"
                    stroke="#4635de"
                    strokeWidth={3}
                    dot={false}
                    name="Revenue"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart />
            )}
          </div>
        </div>

        <div className="chart-card">
          <h3>Revenue by Category</h3>
          <div className="chart-wrapper">
            {viewData.chartCat.length ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={viewData.chartCat}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    nameKey="name"
                  >
                    {viewData.chartCat.map((_, index) => (
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
            ) : (
              <EmptyChart />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
