import React, { useMemo, useEffect } from "react";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatDate,
  shortId,
  matchesRecordSearch,
  hasUrl,
  calculateTotalRevenue,
  calculateNetRevenue,
  calculateAov,
  calculateDiscountTotal,
  calculateDiscountRate,
  calculateShippingRevenue,
  calculateOrderStatusBreakdown,
  calculateRevenueByState,
  calculateRevenueByShippingMethod,
  calculateRevenueByCategory,
  groupByPeriod,
  getOrderNetRevenue,
} from "../utils";
import {
  MetricCard,
  MissingMetricCard,
  InsightPanels,
  CustomTooltip,
  ChartEmptyState,
  SectionHeader,
  AnalystToolbar,
  StatusBadge,
} from "../SharedUI";
import DataTable from "../DataTable";
import {
  DollarSign,
  Package,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Tag,
  Truck,
  RefreshCcw,
  Activity,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  ComposedChart,
  Line,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = [
  "#4635de",
  "#0d9488",
  "#f59e0b",
  "#e11d48",
  "#64748b",
  "#8b5cf6",
  "#10b981",
];

export default function SalesOrdersTab({
  db,
  filterByDate,
  searchQuery,
  applyRowFilters,
  setExportData,
  productsMap,
  variantsMap,
  viewControls = {},
  handleViewControlChange,
}) {
  const viewData = useMemo(() => {
    // 1. Core Data Filtering
    const fOrders = filterByDate(db.orders || [], "created_at");

    // 2. Metrics Calculation
    const grossRev = calculateTotalRevenue(fOrders);
    const netRev = calculateNetRevenue(fOrders);
    const aov = calculateAov(fOrders);
    const discountTotal = calculateDiscountTotal(fOrders);
    const discountRate = calculateDiscountRate(fOrders);
    const shippingRev = calculateShippingRevenue(fOrders);

    const missingTracking = fOrders.filter(
      (o) => !o.tracking_number && o.status !== "cancelled",
    ).length;
    const missingLabel = fOrders.filter(
      (o) => !o.label_pdf_url && o.status !== "cancelled",
    ).length;
    const problemOrders = fOrders.filter(
      (o) => o.error_notes || o.status === "error",
    ).length;
    const ordersWithDiscount = fOrders.filter(
      (o) => Number(o.discount_amount || 0) > 0,
    ).length;
    const ordersWithReceipt = fOrders.filter((o) =>
      hasUrl(o.receipt_url),
    ).length;

    const statusCounts = calculateOrderStatusBreakdown(fOrders);
    const shippedOrders = statusCounts["shipped"] || 0;
    const shippedRate = fOrders.length
      ? (shippedOrders / fOrders.length) * 100
      : 0;

    // Refund / Return Rate Estimate
    const refundCount = fOrders.filter((o) =>
      ["refunded", "returned", "cancelled"].includes(
        String(o.status).toLowerCase(),
      ),
    ).length;
    const refundRate = fOrders.length
      ? (refundCount / fOrders.length) * 100
      : 0;

    // 3. Charts Data
    const granularity = viewControls.chartGranularity || "day";
    const trendGroups = groupByPeriod(fOrders, "created_at", granularity);
    const chartTrend = Object.keys(trendGroups)
      .sort()
      .map((period) => {
        const group = trendGroups[period];
        return {
          period,
          gross: calculateTotalRevenue(group),
          net: calculateNetRevenue(group),
          orders: group.length,
        };
      });

    const chartStatus = Object.entries(statusCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const stateRev = calculateRevenueByState(fOrders);
    const chartState = Object.entries(stateRev)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10 States

    const shipRev = calculateRevenueByShippingMethod(fOrders);
    const chartShipping = Object.entries(shipRev)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const catRev = calculateRevenueByCategory(
      fOrders,
      productsMap,
      variantsMap,
    );
    const chartCat = catRev
      .map((c) => ({ name: c.category, value: c.revenue }))
      .sort((a, b) => b.value - a.value);

    const discountRevMap = fOrders.reduce((acc, o) => {
      const code = o.discount_code
        ? String(o.discount_code).toUpperCase()
        : "NO CODE";
      acc[code] = (acc[code] || 0) + Number(o.total_amount || 0);
      return acc;
    }, {});
    const chartDiscount = Object.entries(discountRevMap)
      .filter(([name]) => name !== "NO CODE")
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // 4. Table Construction with hidden sort values
    let table = fOrders.map((o) => ({
      _createdAt: new Date(o.created_at).getTime(),
      _total: Number(o.total_amount || 0),
      _discount: Number(o.discount_amount || 0),
      _shipping: Number(o.shipping_cost || 0),
      _netRevenue: getOrderNetRevenue(o),

      id: shortId(o.id),
      date: formatDate(o.created_at),
      customer: o.customer_name || "Unknown",
      email: o.customer_email || "Unknown",
      total: Number(o.total_amount || 0),
      net_revenue: getOrderNetRevenue(o),
      discount: Number(o.discount_amount || 0),
      shipping: Number(o.shipping_cost || 0),
      status: o.status || "pending",
      shipping_method: o.shipping_method || "Standard",
      state: o.shipping_address?.state || "N/A",
      tracking: o.tracking_number ? "Yes" : "No",
      label: o.label_pdf_url ? "Yes" : "No",
      receipt: hasUrl(o.receipt_url) ? "Yes" : "No",
      error_notes: o.error_notes || "-",
    }));

    if (searchQuery)
      table = table.filter((r) => matchesRecordSearch(r, searchQuery));
    table = table.filter(applyRowFilters);

    // Analyst Toolbar Sorting Logic
    const sortBy = viewControls.sortBy || "newest";
    const sortDir = viewControls.sortDirection || "desc";
    const dirMult = sortDir === "desc" ? -1 : 1;

    table.sort((a, b) => {
      if (sortBy === "total_desc") return (a._total - b._total) * dirMult;
      if (sortBy === "net_desc")
        return (a._netRevenue - b._netRevenue) * dirMult;
      if (sortBy === "discount_desc")
        return (a._discount - b._discount) * dirMult;
      if (sortBy === "state") return a.state.localeCompare(b.state) * dirMult;
      if (sortBy === "status")
        return a.status.localeCompare(b.status) * dirMult;
      if (sortBy === "missing_tracking")
        return (a.tracking === "No" ? -1 : 1) * dirMult;
      if (sortBy === "missing_label")
        return (a.label === "No" ? -1 : 1) * dirMult;
      return (a._createdAt - b._createdAt) * dirMult; // Default "newest"
    });

    return {
      metrics: [
        {
          label: "Gross Revenue",
          value: formatCurrency(grossRev),
          icon: <DollarSign />,
        },
        {
          label: "Net Revenue",
          value: formatCurrency(netRev),
          icon: <TrendingUp />,
        },
        {
          label: "Total Orders",
          value: formatNumber(fOrders.length),
          icon: <Package />,
        },
        {
          label: "Average Order Value",
          value: formatCurrency(aov),
          icon: <Activity />,
        },
        {
          label: "Discount Given",
          value: formatCurrency(discountTotal),
          icon: <Tag />,
          subtext: `${formatPercent(discountRate)} Rate`,
        },
        {
          label: "Shipping Revenue",
          value: formatCurrency(shippingRev),
          icon: <Truck />,
        },
        {
          label: "Cancellation / Refund Rate",
          value: formatPercent(refundRate),
          icon: <RefreshCcw />,
          status: refundRate > 5 ? "warning" : "success",
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
          value: fOrders.length - ordersWithReceipt,
          critical: false,
        },
        {
          label: "Orders Missing Label PDF",
          value: missingLabel,
          critical: true,
        },
      ],
      insights: [
        `${formatPercent(shippedRate)} of all orders in this period have been successfully shipped.`,
        `${formatNumber(ordersWithDiscount)} orders utilized a discount code or automatic discount.`,
      ],
      charts: {
        chartTrend,
        chartStatus,
        chartState,
        chartShipping,
        chartCat,
        chartDiscount,
      },
      tableData: table,
      tableCols: [
        { key: "id", label: "Order ID", primary: true },
        { key: "date", label: "Date" },
        { key: "customer", label: "Customer" },
        { key: "email", label: "Email" },
        {
          key: "total",
          label: "Total",
          render: (r) => formatCurrency(r.total),
        },
        {
          key: "net_revenue",
          label: "Net Rev",
          render: (r) => formatCurrency(r.net_revenue),
        },
        {
          key: "discount",
          label: "Discount",
          render: (r) => formatCurrency(r.discount),
        },
        {
          key: "shipping",
          label: "Shipping",
          render: (r) => formatCurrency(r.shipping),
        },
        { key: "status", label: "Status", type: "badge" },
        { key: "shipping_method", label: "Shipping Method" },
        { key: "state", label: "State" },
        {
          key: "tracking",
          label: "Tracking",
          render: (r) => (
            <StatusBadge
              text={r.tracking}
              tone={r.tracking === "Yes" ? "success" : "danger"}
            />
          ),
        },
        {
          key: "label",
          label: "Label PDF",
          render: (r) => (
            <StatusBadge
              text={r.label}
              tone={r.label === "Yes" ? "success" : "danger"}
            />
          ),
        },
        { key: "error_notes", label: "Error Notes" },
      ],
    };
  }, [
    db,
    filterByDate,
    searchQuery,
    applyRowFilters,
    viewControls,
    productsMap,
    variantsMap,
  ]);

  useEffect(() => {
    setExportData({
      rows: viewData.tableData.map((r) => ({
        "Order ID": r.id,
        Date: r.date,
        Customer: r.customer,
        Email: r.email,
        Total: r.total,
        "Net Revenue": r.net_revenue,
        Discount: r.discount,
        Shipping: r.shipping,
        Status: r.status,
        "Shipping Method": r.shipping_method,
        State: r.state,
        Tracking: r.tracking,
        Label: r.label,
        "Error Notes": r.error_notes,
      })),
      cols: [
        "Order ID",
        "Date",
        "Customer",
        "Email",
        "Total",
        "Net Revenue",
        "Discount",
        "Shipping",
        "Status",
        "Shipping Method",
        "State",
        "Tracking",
        "Label",
        "Error Notes",
      ],
    });
  }, [viewData, setExportData]);

  const sortOptions = [
    { value: "newest", label: "Date (Newest First)" },
    { value: "total_desc", label: "Gross Total" },
    { value: "net_desc", label: "Net Revenue" },
    { value: "discount_desc", label: "Discount Amount" },
    { value: "state", label: "State/Region" },
    { value: "status", label: "Order Status" },
    { value: "missing_tracking", label: "Missing Tracking First" },
    { value: "missing_label", label: "Missing Label First" },
  ];

  return (
    <div className="tab-content">
      <SectionHeader
        title="Sales & Revenue Metrics"
        description="In-depth analysis of financial performance and fulfillment efficiency."
      >
        <AnalystToolbar
          viewControls={viewControls}
          handleViewControlChange={handleViewControlChange}
          sortOptions={sortOptions}
        />
      </SectionHeader>

      <div className="metrics-grid">
        {viewData.metrics.map((m, i) => (
          <MetricCard key={i} {...m} />
        ))}
        <MissingMetricCard
          label="Conversion Rate"
          requiredData="Visitor sessions and purchase events."
          recommendation="Add analytics_events table or connect GA4."
        />
      </div>

      <InsightPanels insights={viewData.insights} quality={viewData.quality} />

      <SectionHeader
        title="Revenue Analysis"
        description="Visual breakdowns of orders, states, and product categories."
      />
      <div className="charts-grid">
        <div className="chart-card" style={{ gridColumn: "1 / -1" }}>
          <h3>
            Gross vs Net Revenue ({viewControls.chartGranularity || "Daily"})
          </h3>
          <div className="chart-wrapper">
            {viewData.charts.chartTrend.length ? (
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={viewData.charts.chartTrend}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="period"
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
                    name="Gross Revenue"
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="net"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={false}
                    name="Net Revenue"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <ChartEmptyState />
            )}
          </div>
        </div>

        <div className="chart-card">
          <h3>Orders by Status</h3>
          <div className="chart-wrapper">
            {viewData.charts.chartStatus.length ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={viewData.charts.chartStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    nameKey="name"
                  >
                    {viewData.charts.chartStatus.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <ChartEmptyState />
            )}
          </div>
        </div>

        <div className="chart-card">
          <h3>Revenue by Category</h3>
          <div className="chart-wrapper">
            {viewData.charts.chartCat.length ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={viewData.charts.chartCat}
                  layout="vertical"
                  margin={{ left: 20 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={true}
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    type="number"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={formatCurrency}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    width={100}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="value"
                    fill="#0d9488"
                    radius={[0, 4, 4, 0]}
                    name="Revenue"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ChartEmptyState />
            )}
          </div>
        </div>

        <div className="chart-card">
          <h3>Top 10 States by Revenue</h3>
          <div className="chart-wrapper">
            {viewData.charts.chartState.length ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={viewData.charts.chartState}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="name"
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
                    dataKey="value"
                    fill="#f59e0b"
                    radius={[4, 4, 0, 0]}
                    name="Revenue"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ChartEmptyState />
            )}
          </div>
        </div>

        <div className="chart-card">
          <h3>Top 10 Discount Codes Impact</h3>
          <div className="chart-wrapper">
            {viewData.charts.chartDiscount.length ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={viewData.charts.chartDiscount}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="name"
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
                    dataKey="value"
                    fill="#e11d48"
                    radius={[4, 4, 0, 0]}
                    name="Revenue"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ChartEmptyState />
            )}
          </div>
        </div>
      </div>

      <SectionHeader
        title="Sales Ledger"
        description="Comprehensive list of orders matching the active filters."
      />
      <DataTable
        data={viewData.tableData}
        columns={viewData.tableCols}
        resetKey="sales"
        viewMode={viewControls.viewMode}
        topN={viewControls.topN}
      />
    </div>
  );
}
