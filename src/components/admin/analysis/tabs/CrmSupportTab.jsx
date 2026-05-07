import React, { useMemo, useEffect } from "react";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatDate,
  matchesRecordSearch,
  calculateNewVsReturningCustomers,
  calculateRepeatPurchaseRate,
  calculateCustomerLifetimeValue,
  calculateAverageDaysBetweenOrders,
  calculateTopCustomersByRevenue,
  calculateSubscriberGrowth,
  calculateSupportVolume,
  calculateReviewDistribution,
  calculateAverageRating,
} from "../utils";
import {
  MetricCard,
  MissingMetricCard,
  DataAvailabilityPanel,
  InsightPanels,
  CustomTooltip,
  ChartEmptyState,
  SectionHeader,
  AnalystToolbar,
  StatusBadge,
} from "../SharedUI";
import DataTable from "../DataTable";
import {
  Users,
  MessageSquare,
  Star,
  Heart,
  Repeat,
  Clock,
  Mail,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  ComposedChart,
  Line,
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

export default function CrmSupportTab({
  db,
  filterByDate,
  searchQuery,
  applyRowFilters,
  setExportData,
  viewControls = {},
  handleViewControlChange,
}) {
  const viewData = useMemo(() => {
    const fOrders = filterByDate(db.orders || [], "created_at");
    const fInq = filterByDate(db.inquiries || [], "created_at");
    const fInb = filterByDate(db.inbox || [], "created_at");
    const fRev = filterByDate(db.reviews || [], "created_at");
    const fSub = filterByDate(db.subscribers || [], "created_at");

    // 1. Core CRM & Retention Calculations
    const custMix = calculateNewVsReturningCustomers(fOrders);
    const repeatRate = calculateRepeatPurchaseRate(fOrders);
    const estClv = calculateCustomerLifetimeValue(fOrders);
    const avgDaysBetween = calculateAverageDaysBetweenOrders(fOrders);
    const topCustomers = calculateTopCustomersByRevenue(fOrders);
    const avgRating = calculateAverageRating(fRev);
    const unreadInquiries = fInq.filter((i) => i.status === "unread").length;
    const unreadInbox = fInb.filter((i) => !i.is_read).length;

    // 2. Topic Classifier Logic (NLP Keyword Grouping)
    const classifyTopic = (text) => {
      if (!text) return "Other";
      const t = String(text).toLowerCase();
      if (t.match(/coa|lab|test|result|certificate|purity|hplc/))
        return "COA / Lab Reports";
      if (t.match(/ship|track|delivery|arrive|post|dispatch/))
        return "Shipping / Tracking";
      if (t.match(/pay|card|checkout|charge|stripe|bank/))
        return "Payment / Checkout";
      if (t.match(/refund|return|cancel|broken|damage/))
        return "Refunds / Returns";
      if (t.match(/legal|tga|fda|customs|prescription|seize|border/))
        return "Regulatory / Customs";
      if (
        t.match(
          /how to|mix|reconstitute|dose|water|bacteriostatic|fridge|store/,
        )
      )
        return "Product Mixing / Storage";
      return "Other";
    };

    // 3. Build Unified Ledger Table
    let table = [];

    topCustomers.forEach((c) => {
      table.push({
        _rawDate: 0,
        _revenue: c.revenue,
        _orderCount: c.orderCount,
        _rating: 0,
        _unreadScore: 0,

        type: "Customer",
        name: c.name || "Unknown",
        email: c.email,
        subject: "Purchasing Record",
        status: "Active",
        topic: "N/A",
        revenue: c.revenue,
        order_count: c.orderCount,
        rating: 0,
        date: "N/A",
      });
    });

    fInq.forEach((i) => {
      const topic = classifyTopic(`${i.subject || ""} ${i.message || ""}`);
      table.push({
        _rawDate: new Date(i.created_at).getTime(),
        _revenue: 0,
        _orderCount: 0,
        _rating: 0,
        _unreadScore: i.status === "unread" ? 1 : 0,

        type: "Inquiry",
        name: i.name,
        email: i.email,
        subject: i.subject || "N/A",
        status: i.status,
        topic: topic,
        revenue: 0,
        order_count: 0,
        rating: 0,
        date: formatDate(i.created_at),
      });
    });

    fInb.forEach((i) => {
      const topic = classifyTopic(`${i.subject || ""} ${i.body_text || ""}`);
      table.push({
        _rawDate: new Date(i.created_at).getTime(),
        _revenue: 0,
        _orderCount: 0,
        _rating: 0,
        _unreadScore: !i.is_read ? 1 : 0,

        type: "Inbox",
        name: i.sender || "System",
        email: "N/A",
        subject: i.subject || "N/A",
        status: i.is_read ? "Read" : "Unread",
        topic: topic,
        revenue: 0,
        order_count: 0,
        rating: 0,
        date: formatDate(i.created_at),
      });
    });

    fRev.forEach((r) => {
      table.push({
        _rawDate: new Date(r.created_at).getTime(),
        _revenue: 0,
        _orderCount: 0,
        _rating: r.rating || 0,
        _unreadScore: 0,

        type: "Review",
        name: r.name,
        email: r.email || "N/A",
        subject: r.title || "Review",
        status: r.is_active ? "Active" : "Hidden",
        topic: "Product Feedback",
        revenue: 0,
        order_count: 0,
        rating: r.rating || 0,
        date: formatDate(r.created_at),
      });
    });

    fSub.forEach((s) => {
      table.push({
        _rawDate: new Date(s.created_at).getTime(),
        _revenue: 0,
        _orderCount: 0,
        _rating: 0,
        _unreadScore: 0,

        type: "Subscriber",
        name: s.name,
        email: s.email,
        subject: "Newsletter",
        status: "Subscribed",
        topic: "Marketing",
        revenue: 0,
        order_count: 0,
        rating: 0,
        date: formatDate(s.created_at),
      });
    });

    // 4. Filtering & Sorting
    let fTable = table;
    if (searchQuery)
      fTable = fTable.filter((r) => matchesRecordSearch(r, searchQuery));
    fTable = fTable.filter(applyRowFilters);

    const sortBy = viewControls.sortBy || "newest";
    const sortDir = viewControls.sortDirection || "desc";
    const dirMult = sortDir === "desc" ? 1 : -1;

    fTable.sort((a, b) => {
      if (sortBy === "revenue_desc") return (b._revenue - a._revenue) * dirMult;
      if (sortBy === "order_count_desc")
        return (b._orderCount - a._orderCount) * dirMult;
      if (sortBy === "rating_asc")
        return (a._rating - b._rating) * (sortDir === "asc" ? 1 : -1);
      if (sortBy === "unread_first")
        return (b._unreadScore - a._unreadScore) * dirMult;
      if (sortBy === "type")
        return a.type.localeCompare(b.type) * (sortDir === "asc" ? 1 : -1);
      if (sortBy === "topic")
        return a.topic.localeCompare(b.topic) * (sortDir === "asc" ? 1 : -1);
      return (b._rawDate - a._rawDate) * dirMult; // Default newest
    });

    // 5. Chart Formats
    const topN =
      viewControls.topN === "all" ? 100 : Number(viewControls.topN || 5);
    const granularity = viewControls.chartGranularity || "week";

    // New vs Returning
    const chartCustMix = [
      { name: "New Customers", value: custMix.new },
      { name: "Returning", value: custMix.returning },
    ];

    // Order Frequency Distribution
    const orderFreq = {
      "1 Order": 0,
      "2 Orders": 0,
      "3 Orders": 0,
      "4+ Orders": 0,
    };
    topCustomers.forEach((c) => {
      if (c.orderCount === 1) orderFreq["1 Order"]++;
      else if (c.orderCount === 2) orderFreq["2 Orders"]++;
      else if (c.orderCount === 3) orderFreq["3 Orders"]++;
      else orderFreq["4+ Orders"]++;
    });
    const chartOrderFreq = Object.entries(orderFreq).map(([name, value]) => ({
      name,
      value,
    }));

    // Top Customers by Revenue
    const chartTopCustomers = topCustomers
      .slice(0, topN)
      .map((c) => ({ name: c.name || "Unknown", revenue: c.revenue }));

    // Subscriber Growth
    const chartSubGrowth = calculateSubscriberGrowth(fSub, granularity);

    // Support Volume
    const chartSupportVol = calculateSupportVolume(fInq, fInb, granularity);

    // Support Topics
    const topicCounts = {};
    table.forEach((r) => {
      if ((r.type === "Inquiry" || r.type === "Inbox") && r.topic !== "Other") {
        topicCounts[r.topic] = (topicCounts[r.topic] || 0) + 1;
      }
    });
    const chartTopics = Object.entries(topicCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Review Ratings
    const reviewDist = calculateReviewDistribution(fRev);
    const chartRatings = [1, 2, 3, 4, 5].map((star) => ({
      name: `${star} Star`,
      count: reviewDist[star] || 0,
    }));

    return {
      metrics: [
        { label: "Est. CLV", value: formatCurrency(estClv), icon: <Heart /> },
        {
          label: "Repeat Purchase Rate",
          value: formatPercent(repeatRate),
          icon: <Repeat />,
        },
        {
          label: "Avg Days Between Orders",
          value: formatNumber(avgDaysBetween),
          icon: <Clock />,
        },
        {
          label: "Total Subscribers",
          value: formatNumber(fSub.length),
          icon: <Mail />,
        },
        {
          label: "Unread Inquiries/Messages",
          value: formatNumber(unreadInquiries + unreadInbox),
          icon: <MessageSquare />,
          alert: unreadInquiries + unreadInbox > 0,
        },
        {
          label: "Avg Review Rating",
          value: `${avgRating.toFixed(1)} Stars`,
          icon: <Star />,
          status: avgRating > 4.5 ? "success" : "warning",
        },
      ],
      quality: [],
      insights: [
        `${fSub.length} new subscribers in this period.`,
        `Estimated returning customer ratio is ${formatPercent(custMix.ratio)}.`,
      ],
      charts: {
        chartCustMix,
        chartOrderFreq,
        chartTopCustomers,
        chartSubGrowth,
        chartSupportVol,
        chartTopics,
        chartRatings,
      },
      tableCols: [
        { key: "type", label: "Type", type: "badge" },
        { key: "name", label: "Name / Sender", primary: true },
        { key: "email", label: "Email" },
        { key: "topic", label: "Classified Topic" },
        { key: "subject", label: "Subject / Details" },
        {
          key: "revenue",
          label: "Customer Rev",
          render: (r) => (r.revenue > 0 ? formatCurrency(r.revenue) : "-"),
        },
        {
          key: "order_count",
          label: "Orders",
          render: (r) =>
            r.order_count > 0 ? formatNumber(r.order_count) : "-",
        },
        {
          key: "rating",
          label: "Rating",
          render: (r) => (r.rating > 0 ? `${r.rating} Stars` : "-"),
        },
        { key: "status", label: "Status", type: "badge" },
        { key: "date", label: "Date" },
      ],
      tableData: fTable,
    };
  }, [db, filterByDate, searchQuery, applyRowFilters, viewControls]);

  useEffect(() => {
    setExportData({
      rows: viewData.tableData.map((r) => ({
        Type: r.type,
        Name: r.name,
        Email: r.email,
        Topic: r.topic,
        Subject: r.subject,
        "Customer Revenue": r.revenue,
        "Order Count": r.order_count,
        Rating: r.rating,
        Status: r.status,
        Date: r.date,
      })),
      cols: [
        "Type",
        "Name",
        "Email",
        "Topic",
        "Subject",
        "Customer Revenue",
        "Order Count",
        "Rating",
        "Status",
        "Date",
      ],
    });
  }, [viewData, setExportData]);

  const sortOptions = [
    { value: "newest", label: "Date (Newest)" },
    { value: "unread_first", label: "Unread First" },
    { value: "revenue_desc", label: "Customer Revenue (High to Low)" },
    { value: "order_count_desc", label: "Order Count (High to Low)" },
    { value: "rating_asc", label: "Review Rating (Lowest First)" },
    { value: "topic", label: "Classified Topic" },
    { value: "type", label: "Record Type" },
  ];

  const crmDataAvailability = {
    "Email Open Rate": "missing",
    "Email Click Rate": "missing",
    "Time to Purchase": "missing",
  };

  const crmSchemaRecommendations = [
    "email_campaign_metrics",
    "sessions",
    "analytics_events",
  ];

  return (
    <div className="tab-content">
      

      <SectionHeader
        title="Retention, Loyalty & Support"
        description="Analyze customer behavior, support topic volume, and overall satisfaction."
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
          label="Time to Purchase"
          requiredData="Session / First-touch event timestamps."
          recommendation="Implement analytics_events or GA4 tracking."
        />
        <MissingMetricCard
          label="Email Open/Click Rate"
          requiredData="Email provider campaign metrics."
          recommendation="Integrate Mailchimp/Klaviyo API data."
        />
      </div>

      <InsightPanels insights={viewData.insights} quality={viewData.quality} />

      <SectionHeader
        title="Customer Insights"
        description="Visual breakdown of recurring behavior and support demands."
      />
      <div className="charts-grid">
        <div className="chart-card">
          <h3>Customer Mix (New vs Returning)</h3>
          <div className="chart-wrapper">
            {viewData.charts.chartCustMix.some((d) => d.value > 0) ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={viewData.charts.chartCustMix}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    nameKey="name"
                  >
                    {viewData.charts.chartCustMix.map((_, index) => (
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
          <h3>Order Frequency Distribution</h3>
          <div className="chart-wrapper">
            {viewData.charts.chartOrderFreq.some((d) => d.value > 0) ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={viewData.charts.chartOrderFreq}>
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
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="value"
                    fill="#0d9488"
                    radius={[4, 4, 0, 0]}
                    name="Customers"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ChartEmptyState />
            )}
          </div>
        </div>

        <div className="chart-card">
          <h3>Top Customers by Revenue</h3>
          <div className="chart-wrapper">
            {viewData.charts.chartTopCustomers.length ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={viewData.charts.chartTopCustomers}
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
                    width={80}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="revenue"
                    fill="#4635de"
                    radius={[0, 4, 4, 0]}
                    name="Lifetime Revenue"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ChartEmptyState />
            )}
          </div>
        </div>

        <div className="chart-card">
          <h3>Support Volume ({viewControls.chartGranularity || "Weekly"})</h3>
          <div className="chart-wrapper">
            {viewData.charts.chartSupportVol.length ? (
              <ResponsiveContainer width="100%" height={250}>
                <ComposedChart data={viewData.charts.chartSupportVol}>
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
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar
                    dataKey="inquiries"
                    stackId="a"
                    fill="#e11d48"
                    name="Inquiries"
                  />
                  <Bar
                    dataKey="inboxMessages"
                    stackId="a"
                    fill="#f59e0b"
                    name="Inbox Msgs"
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#0f172a"
                    strokeWidth={2}
                    dot={false}
                    name="Total Volume"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <ChartEmptyState />
            )}
          </div>
        </div>

        <div className="chart-card">
          <h3>Support Topics (NLP Grouping)</h3>
          <div className="chart-wrapper">
            {viewData.charts.chartTopics.length ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={viewData.charts.chartTopics}
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
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    width={120}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="count"
                    fill="#8b5cf6"
                    radius={[0, 4, 4, 0]}
                    name="Tickets"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ChartEmptyState message="No classified support topics found." />
            )}
          </div>
        </div>

        <div className="chart-card">
          <h3>Review Ratings Distribution</h3>
          <div className="chart-wrapper">
            {viewData.charts.chartRatings.some((d) => d.count > 0) ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={viewData.charts.chartRatings}>
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
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="count"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    name="Reviews"
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
        title="Unified CRM Ledger"
        description="Consolidated view of top customers, support tickets, reviews, and subscribers."
      />
      <DataTable
        data={viewData.tableData}
        columns={viewData.tableCols}
        resetKey="crm"
        viewMode={viewControls.viewMode}
        topN={viewControls.topN}
      />
    </div>
  );
}
