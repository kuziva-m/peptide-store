import React, { useMemo, useEffect } from "react";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatDate,
  shortId,
  calculateTotalRevenue,
  calculateNetRevenue,
  calculateAov,
  calculateDiscountRate,
  calculateNewVsReturningCustomers,
  calculateRepeatPurchaseRate,
  calculateCustomerLifetimeValue,
  calculateAverageDaysBetweenOrders,
  calculateCoaCoverage,
  calculateFulfillmentHealth,
  calculateAverageRating,
  calculateRevenueByCategory,
  groupByPeriod
} from "../utils";
import {
  MetricCard,
  MissingMetricCard,
  DataAvailabilityPanel,
  SectionHeader,
  CustomTooltip,
  ChartEmptyState,
} from "../SharedUI";
import DataTable from "../DataTable";
import {
  DollarSign,
  TrendingUp,
  Package,
  Activity,
  ShieldAlert,
  AlertTriangle,
  Users,
  Repeat,
  Heart,
  Tag,
  Clock,
  CheckCircle2,
  Mail
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
  BarChart
} from "recharts";

export default function ExecutiveOverviewTab({
  db,
  filterByDate,
  productsMap,
  variantsMap,
  setExportData,
  viewControls = {},
  dataAvailability = {},
  schemaRecommendations = []
}) {
  const viewData = useMemo(() => {
    // 1. Apply Date Filters to Global Entities
    const fOrders = filterByDate(db.orders || [], "created_at");
    const fInquiries = filterByDate(db.inquiries || [], "created_at");
    const fInbox = filterByDate(db.inbox || [], "created_at");
    const fReviews = filterByDate(db.reviews || [], "created_at");
    const fSubscribers = filterByDate(db.subscribers || [], "created_at");

    // 2. Compute Core Metrics
    const grossRev = calculateTotalRevenue(fOrders);
    const netRev = calculateNetRevenue(fOrders);
    const aov = calculateAov(fOrders);
    const discountRate = calculateDiscountRate(fOrders);
    
    const customerStats = calculateNewVsReturningCustomers(fOrders);
    const repeatRate = calculateRepeatPurchaseRate(fOrders);
    const clv = calculateCustomerLifetimeValue(fOrders);
    const avgDaysBetween = calculateAverageDaysBetweenOrders(fOrders);
    const avgRating = calculateAverageRating(fReviews);

    const fulfillment = calculateFulfillmentHealth(fOrders);
    const coa = calculateCoaCoverage(db.products, db.variants);
    
    const totalSupport = fInquiries.length + fInbox.length;
    const activePreorders = (db.variants || []).filter(v => v.is_preorder).length;
    const totalVariants = Math.max((db.variants || []).length, 1);
    const preorderShare = (activePreorders / totalVariants) * 100;

    // 3. Compute Charts Data
    // Trend Chart
    const granularity = viewControls.chartGranularity || "day";
    const trendGroups = groupByPeriod(fOrders, "created_at", granularity);
    const chartTrend = Object.keys(trendGroups).sort().map(period => {
      const groupOrders = trendGroups[period];
      return {
        period,
        revenue: calculateTotalRevenue(groupOrders),
        orders: groupOrders.length
      };
    });

    // Customer Mix Chart
    const chartCustomerMix = [
      { name: "New Customers", value: customerStats.new },
      { name: "Returning Customers", value: customerStats.returning }
    ];

    // Category Mix Chart
    const catRev = calculateRevenueByCategory(fOrders, productsMap, variantsMap);
    const chartCat = catRev
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, viewControls.topN === "all" ? undefined : Number(viewControls.topN || 5))
      .map(c => ({ name: c.category, value: c.revenue }));

    // COA Compliance Chart
    const chartCoa = [
      { name: "Verified COA", value: coa.productCoaCount },
      { name: "Missing COA", value: (db.products || []).length - coa.productCoaCount }
    ];

    // 4. Build Executive Exceptions Table
    const exceptions = [];
    
    fOrders.forEach(o => {
      if (!o.tracking_number && o.status !== "cancelled" && o.status !== "refunded") {
        exceptions.push({ type: "Order", identifier: shortId(o.id), issue: "Missing Tracking", date: formatDate(o.created_at) });
      }
      if (!o.label_pdf_url && o.status !== "cancelled" && o.status !== "refunded") {
        exceptions.push({ type: "Order", identifier: shortId(o.id), issue: "Missing Label", date: formatDate(o.created_at) });
      }
      if (o.error_notes || o.status === "error") {
        exceptions.push({ type: "Order", identifier: shortId(o.id), issue: "Error Status / Notes", date: formatDate(o.created_at) });
      }
    });

    (db.products || []).forEach(p => {
      if (p.in_stock && (!p.lab_result_url || p.lab_result_url.length < 5)) {
        exceptions.push({ type: "Product", identifier: p.name, issue: "Active Product Missing COA", date: formatDate(p.created_at) });
      }
    });

    fInquiries.forEach(i => {
      if (i.status === "unread") {
        exceptions.push({ type: "Inquiry", identifier: i.email, issue: "Unread Support Ticket", date: formatDate(i.created_at) });
      }
    });

    return {
      sales: { grossRev, netRev, aov, orders: fOrders.length, discountRate },
      retention: { repeatRate, clv, avgDaysBetween, rating: avgRating, subs: fSubscribers.length },
      operations: { ...fulfillment, coa, support: totalSupport, preorderShare },
      charts: { chartTrend, chartCustomerMix, chartCat, chartCoa },
      exceptions: {
        data: exceptions,
        cols: [
          { key: "type", label: "Record Type", primary: true },
          { key: "identifier", label: "Identifier" },
          { key: "issue", label: "Action Required" },
          { key: "date", label: "Created Date" }
        ]
      }
    };
  }, [db, filterByDate, viewControls.chartGranularity, viewControls.topN, productsMap, variantsMap]);

  // Sync export data on load
  useEffect(() => {
    setExportData({ 
      rows: viewData.exceptions.data.map(r => ({
        "Record Type": r.type,
        "Identifier": r.identifier,
        "Action Required": r.issue,
        "Created Date": r.date
      })), 
      cols: ["Record Type", "Identifier", "Action Required", "Created Date"] 
    });
  }, [viewData, setExportData]);

  // Chart Colors
  const COLORS = ["#4635de", "#0d9488", "#f59e0b", "#e11d48", "#64748b"];

  return (
    <div className="tab-content">
    

      {/* 1. SALES HEALTH */}
      <SectionHeader title="Sales & Revenue Health" description="Core top-line financial performance." />
      <div className="metrics-grid">
        <MetricCard label="Gross Revenue" value={formatCurrency(viewData.sales.grossRev)} icon={<DollarSign/>} helpText="Total revenue including shipping and before discounts." />
        <MetricCard label="Net Revenue" value={formatCurrency(viewData.sales.netRev)} icon={<TrendingUp/>} helpText="Total revenue minus discounts." />
        <MetricCard label="Total Orders" value={formatNumber(viewData.sales.orders)} icon={<Package/>} />
        <MetricCard label="Average Order Value" value={formatCurrency(viewData.sales.aov)} icon={<Activity/>} />
        <MetricCard label="Discount Rate" value={formatPercent(viewData.sales.discountRate)} icon={<Tag/>} helpText="Percentage of total revenue given away as discounts." />
        <MissingMetricCard 
          label="Conversion Rate" 
          requiredData="Visitor sessions mapped to purchase events." 
          recommendation="Implement analytics_events schema." 
        />
        <MissingMetricCard 
          label="Cart Abandonment" 
          requiredData="Checkout initiation logs." 
          recommendation="Add cart_events tracking." 
        />
      </div>

      {/* 2. CUSTOMER & RETENTION HEALTH */}
      <SectionHeader title="Customer Behavior & Retention" description="Customer loyalty and lifetime value metrics." />
      <div className="metrics-grid">
        <MetricCard label="Repeat Purchase Rate" value={formatPercent(viewData.retention.repeatRate)} icon={<Repeat/>} helpText="Percentage of customers with more than one order." />
        <MetricCard label="Est. Lifetime Value (CLV)" value={formatCurrency(viewData.retention.clv)} icon={<Heart/>} helpText="Average total revenue per unique customer email." />
        <MetricCard label="Avg Days Between Orders" value={formatNumber(viewData.retention.avgDaysBetween)} icon={<Clock/>} helpText="Average time elapsed before a customer orders again." />
        <MetricCard label="Average Review Rating" value={`${viewData.retention.rating.toFixed(1)} Stars`} icon={<CheckCircle2/>} />
        <MetricCard label="New Subscribers" value={formatNumber(viewData.retention.subs)} icon={<Mail/>} />
        <MissingMetricCard 
          label="Traffic Sources" 
          requiredData="UTM parameters & referrers." 
          recommendation="Log UTM data in order metadata." 
        />
        <MissingMetricCard 
          label="CPA / Acquisition Cost" 
          requiredData="Ad spend data." 
          recommendation="Integrate Meta/Google Ads APIs." 
        />
      </div>

      {/* 3. OPERATIONS & COMPLIANCE HEALTH */}
      <SectionHeader title="Operations & Compliance" description="Fulfillment tracking and catalog safety signals." />
      <div className="metrics-grid">
        <MetricCard 
          label="Missing Tracking" 
          value={formatNumber(viewData.operations.missingTracking)} 
          icon={<AlertTriangle/>} 
          alert={viewData.operations.missingTracking > 0} 
          status={viewData.operations.missingTracking > 0 ? "danger" : "success"}
        />
        <MetricCard 
          label="Product COA Coverage" 
          value={formatPercent(viewData.operations.coa.productCoverageRate)} 
          icon={<ShieldAlert/>} 
          status={viewData.operations.coa.productCoverageRate < 100 ? "warning" : "success"}
        />
        <MetricCard label="Support Volume" value={formatNumber(viewData.operations.support)} icon={<Users/>} />
        <MetricCard label="Preorder Catalog Share" value={formatPercent(viewData.operations.preorderShare)} icon={<Activity/>} />
        <MissingMetricCard 
          label="Inventory Days on Hand" 
          requiredData="Exact stock quantities & historical COGS." 
          recommendation="Migrate from boolean in_stock to numeric quantities." 
        />
        <MissingMetricCard 
          label="Chargeback Rate" 
          requiredData="Dispute logs." 
          recommendation="Sync Stripe disputes to local table." 
        />
      </div>

      {/* 4. CHARTS */}
      <SectionHeader title="Visual Intelligence" description="Visual breakdown of revenue, customers, and operations." />
      <div className="charts-grid">
        
        {/* Trend Chart */}
        <div className="chart-card" style={{ gridColumn: "1 / -1" }}>
          <h3>Revenue & Order Trend ({viewControls.chartGranularity || "Daily"})</h3>
          <div className="chart-wrapper">
            {viewData.charts.chartTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={viewData.charts.chartTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="period" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" fontSize={12} tickLine={false} axisLine={false} tickFormatter={formatCurrency} />
                  <YAxis yAxisId="right" orientation="right" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar yAxisId="right" dataKey="orders" barSize={20} fill="#cbd5e1" name="Orders" />
                  <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#4635de" strokeWidth={3} dot={false} name="Revenue" />
                </ComposedChart>
              </ResponsiveContainer>
            ) : <ChartEmptyState />}
          </div>
        </div>

        {/* Customer Mix */}
        <div className="chart-card">
          <h3>Customer Mix (New vs Returning)</h3>
          <div className="chart-wrapper">
            {viewData.charts.chartCustomerMix.some(c => c.value > 0) ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={viewData.charts.chartCustomerMix} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" nameKey="name">
                    {viewData.charts.chartCustomerMix.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            ) : <ChartEmptyState />}
          </div>
        </div>

        {/* Top Categories */}
        <div className="chart-card">
          <h3>Top Categories by Revenue</h3>
          <div className="chart-wrapper">
            {viewData.charts.chartCat.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={viewData.charts.chartCat} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                  <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} tickFormatter={formatCurrency} />
                  <YAxis dataKey="name" type="category" fontSize={12} tickLine={false} axisLine={false} width={100} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="#0d9488" radius={[0, 4, 4, 0]} name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            ) : <ChartEmptyState />}
          </div>
        </div>
        
        {/* Compliance Mix */}
        <div className="chart-card">
          <h3>Master Product COA Status</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={viewData.charts.chartCoa} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" nameKey="name">
                  <Cell fill="#10b981" />
                  <Cell fill="#ef4444" />
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* 5. EXCEPTIONS DATA TABLE */}
      <SectionHeader title="Executive Action Items" description="Operational exceptions requiring manual review." />
      <DataTable 
        data={viewData.exceptions.data} 
        columns={viewData.exceptions.cols} 
        resetKey="exceptions" 
        viewMode={viewControls.viewMode}
      />
    </div>
  );
}