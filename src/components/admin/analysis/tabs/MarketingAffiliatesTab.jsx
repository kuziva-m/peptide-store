import React, { useMemo, useEffect } from "react";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatDate,
  matchesRecordSearch,
  calculateVoucherLiability,
  groupByPeriod,
  shortId,
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
  Tag,
  Users,
  DollarSign,
  Mail,
  ArrowUpRight,
  TrendingUp,
  Percent,
  Gift,
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Line,
  BarChart,
  Bar,
  Legend,
} from "recharts";

export default function MarketingAffiliatesTab({
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
    const fDiscounts = filterByDate(db.discountUsage || [], "created_at");
    const fSubscribers = filterByDate(db.subscribers || [], "created_at");

    // 1. Core Metric Aggregations
    let ordersWithDiscount = 0;
    let revFromDiscounts = 0;
    let totalDiscountAmount = 0;

    const codeStats = {};
    fOrders.forEach((o) => {
      const discAmt = Number(o.discount_amount || 0);
      if (o.discount_code || discAmt > 0) {
        ordersWithDiscount++;
        revFromDiscounts += Number(o.total_amount || 0);
        totalDiscountAmount += discAmt;
      }

      if (o.discount_code) {
        const code = String(o.discount_code).toUpperCase();
        if (!codeStats[code]) codeStats[code] = { rev: 0, uses: 0, disc: 0 };
        codeStats[code].rev += Number(o.total_amount || 0);
        codeStats[code].uses += 1;
        codeStats[code].disc += discAmt;
      }
    });

    const activeDiscounts = (db.discounts || []).filter((d) => d.active).length;
    const creatorCodes = (db.discounts || []).filter(
      (d) => d.is_creator_code || d.type === "creator",
    ).length;
    const vouLiab = calculateVoucherLiability(db.vouchers);

    let affiliateRevEstimate = 0;
    let commissionLiability = 0;

    // 2. Build the Marketing Ledger (Combining Discounts, Affiliates, Vouchers)
    const table = [];

    (db.discounts || []).forEach((d) => {
      const stats = codeStats[String(d.code).toUpperCase()] || {
        rev: 0,
        uses: 0,
        disc: 0,
      };
      table.push({
        _rawDate: new Date(d.created_at).getTime(),
        _revenue: stats.rev,
        _uses: stats.uses,
        _discount: stats.disc,
        _commission: 0,
        _activeScore: d.active ? 1 : 0,
        _unlimitedScore: !d.max_uses ? 1 : 0,

        code: d.code,
        source: "Discount",
        type: d.type || "Standard",
        uses: stats.uses,
        revenue: stats.rev,
        discount_amount: stats.disc,
        commission_rate: 0,
        estimated_commission: 0,
        current_balance: 0,
        active_status: d.active ? "Active" : "Inactive",
        max_uses: d.max_uses ? String(d.max_uses) : "Unlimited",
        created_date: formatDate(d.created_at),
      });
    });

    (db.affiliates || []).forEach((a) => {
      const stats = codeStats[String(a.discount_code).toUpperCase()] || {
        rev: 0,
        uses: 0,
        disc: 0,
      };
      const rate = Number(a.commission_rate || 0);
      const estComm = stats.rev * rate;

      affiliateRevEstimate += stats.rev;
      commissionLiability += estComm;

      table.push({
        _rawDate: new Date(a.created_at).getTime(),
        _revenue: stats.rev,
        _uses: stats.uses,
        _discount: stats.disc,
        _commission: estComm,
        _activeScore: 1, // Affiliates assumed active unless tracked otherwise
        _unlimitedScore: 1,

        code: a.discount_code,
        source: "Affiliate",
        type: "Commission",
        uses: stats.uses,
        revenue: stats.rev,
        discount_amount: stats.disc,
        commission_rate: rate,
        estimated_commission: estComm,
        current_balance: 0,
        active_status: "Active",
        max_uses: "Unlimited",
        created_date: formatDate(a.created_at),
      });
    });

    (db.vouchers || []).forEach((v) => {
      const isActive = v.is_active && new Date(v.expires_at) > new Date();
      table.push({
        _rawDate: new Date(v.created_at).getTime(),
        _revenue: 0,
        _uses: 0,
        _discount: 0,
        _commission: 0,
        _activeScore: isActive ? 1 : 0,
        _unlimitedScore: 0,

        code: v.code,
        source: "Voucher",
        type: "Credit",
        uses: 0,
        revenue: 0,
        discount_amount: 0,
        commission_rate: 0,
        estimated_commission: 0,
        current_balance: Number(v.current_balance || 0),
        active_status: isActive ? "Active" : "Inactive",
        max_uses: "N/A",
        created_date: formatDate(v.created_at),
      });
    });

    // 3. Search and Sort Table
    let fTable = table;
    if (searchQuery)
      fTable = fTable.filter((r) => matchesRecordSearch(r, searchQuery));
    fTable = fTable.filter(applyRowFilters);

    const sortBy = viewControls.sortBy || "revenue_desc";
    const sortDir = viewControls.sortDirection || "desc";
    const dirMult = sortDir === "desc" ? 1 : -1;

    fTable.sort((a, b) => {
      if (sortBy === "revenue_desc") return (b._revenue - a._revenue) * dirMult;
      if (sortBy === "uses_desc") return (b._uses - a._uses) * dirMult;
      if (sortBy === "commission_desc")
        return (b._commission - a._commission) * dirMult;
      if (sortBy === "discount_desc")
        return (b._discount - a._discount) * dirMult;
      if (sortBy === "active_first")
        return (b._activeScore - a._activeScore) * dirMult;
      if (sortBy === "unlimited_first")
        return (b._unlimitedScore - a._unlimitedScore) * dirMult;
      if (sortBy === "newest") return (b._rawDate - a._rawDate) * dirMult;
      return b._revenue - a._revenue;
    });

    // 4. Charts Formats
    const topN =
      viewControls.topN === "all" ? 100 : Number(viewControls.topN || 5);
    const granularity = viewControls.chartGranularity || "week";

    // Discount Usage Trend
    const usageGroups = groupByPeriod(fDiscounts, "created_at", granularity);
    const chartUsage = Object.keys(usageGroups)
      .sort()
      .map((period) => ({
        period,
        count: usageGroups[period].length,
      }));

    // Subscriber Trend
    const subGroups = groupByPeriod(fSubscribers, "created_at", granularity);
    const chartSubs = Object.keys(subGroups)
      .sort()
      .map((period) => ({
        period,
        subscribers: subGroups[period].length,
      }));

    // Top Codes by Revenue
    const chartTopCodesRev = Object.entries(codeStats)
      .map(([name, stats]) => ({ name, revenue: stats.rev }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, topN);

    // Top Codes by Uses
    const chartTopCodesUses = Object.entries(codeStats)
      .map(([name, stats]) => ({ name, uses: stats.uses }))
      .sort((a, b) => b.uses - a.uses)
      .slice(0, topN);

    // Affiliate Leaderboard
    const chartAffiliates = (db.affiliates || [])
      .map((a) => {
        const rev = codeStats[String(a.discount_code).toUpperCase()]?.rev || 0;
        return {
          name: a.name || shortId(a.id),
          revenue: rev,
          commission: rev * (Number(a.commission_rate) || 0),
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, topN);

    return {
      metrics: [
        {
          label: "Active Discounts",
          value: formatNumber(activeDiscounts),
          icon: <Tag />,
        },
        {
          label: "Discounted Orders",
          value: formatNumber(ordersWithDiscount),
          icon: <Percent />,
        },
        {
          label: "Rev using Discounts",
          value: formatCurrency(revFromDiscounts),
          icon: <TrendingUp />,
        },
        {
          label: "Total Discount Given",
          value: formatCurrency(totalDiscountAmount),
          icon: <DollarSign />,
        },
        {
          label: "Creator Codes",
          value: formatNumber(creatorCodes),
          icon: <Users />,
        },
        {
          label: "Affiliate Rev Estimate",
          value: formatCurrency(affiliateRevEstimate),
          icon: <ArrowUpRight />,
        },
        {
          label: "Est. Commission Liability",
          value: formatCurrency(commissionLiability),
          icon: <DollarSign />,
        },
        {
          label: "Voucher Liability",
          value: formatCurrency(vouLiab),
          icon: <Gift />,
        },
      ],
      quality: [
        {
          label: "Discounts with no max uses limit",
          value: db.discounts.filter((d) => !d.max_uses).length,
          critical: false,
        },
      ],
      insights: [
        `Average discount per discounted order is ${formatCurrency(ordersWithDiscount > 0 ? totalDiscountAmount / ordersWithDiscount : 0)}.`,
        `${formatNumber(fSubscribers.length)} new subscribers joined during this period.`,
      ],
      charts: {
        chartUsage,
        chartSubs,
        chartTopCodesRev,
        chartTopCodesUses,
        chartAffiliates,
      },
      tableCols: [
        { key: "code", label: "Code", primary: true },
        { key: "source", label: "Source" },
        { key: "type", label: "Type" },
        { key: "uses", label: "Uses", render: (r) => formatNumber(r.uses) },
        {
          key: "revenue",
          label: "Revenue",
          render: (r) => formatCurrency(r.revenue),
        },
        {
          key: "discount_amount",
          label: "Discount Amt",
          render: (r) => formatCurrency(r.discount_amount),
        },
        {
          key: "commission_rate",
          label: "Comm. Rate",
          render: (r) => formatPercent(r.commission_rate * 100),
        },
        {
          key: "estimated_commission",
          label: "Est. Commission",
          render: (r) => formatCurrency(r.estimated_commission),
        },
        {
          key: "current_balance",
          label: "Current Balance",
          render: (r) => formatCurrency(r.current_balance),
        },
        { key: "max_uses", label: "Max Uses" },
        { key: "active_status", label: "Status", type: "badge" },
        { key: "created_date", label: "Created Date" },
      ],
      tableData: fTable,
    };
  }, [db, filterByDate, searchQuery, applyRowFilters, viewControls]);

  useEffect(() => {
    setExportData({
      rows: viewData.tableData.map((r) => ({
        Code: r.code,
        Source: r.source,
        Type: r.type,
        Uses: r.uses,
        Revenue: r.revenue,
        "Discount Amount": r.discount_amount,
        "Commission Rate": r.commission_rate,
        "Est Commission": r.estimated_commission,
        "Current Balance": r.current_balance,
        "Max Uses": r.max_uses,
        Status: r.active_status,
        "Created Date": r.created_date,
      })),
      cols: [
        "Code",
        "Source",
        "Type",
        "Uses",
        "Revenue",
        "Discount Amount",
        "Commission Rate",
        "Est Commission",
        "Current Balance",
        "Max Uses",
        "Status",
        "Created Date",
      ],
    });
  }, [viewData, setExportData]);

  const sortOptions = [
    { value: "revenue_desc", label: "Revenue (High to Low)" },
    { value: "uses_desc", label: "Total Uses (High to Low)" },
    { value: "commission_desc", label: "Est. Commission (High to Low)" },
    { value: "discount_desc", label: "Discount Amount (High to Low)" },
    { value: "active_first", label: "Active First" },
    { value: "unlimited_first", label: "Unlimited Uses First" },
    { value: "newest", label: "Created Date (Newest)" },
  ];

  const marketingDataAvailability = {
    "Traffic source split": "missing",
    "CPA by channel": "missing",
    "Bounce rate by landing page": "missing",
    "Email open/click rate": "missing",
  };

  const marketingSchemaRecommendations = [
    "analytics_events",
    "traffic_sources",
    "ad_spend",
    "email_campaign_metrics",
  ];

  return (
    <div className="tab-content">
      <DataAvailabilityPanel
        dataAvailability={marketingDataAvailability}
        schemaRecommendations={marketingSchemaRecommendations}
      />

      <SectionHeader
        title="Traffic, Acquisition & Retention"
        description="Monitor promotional campaign performance, subscriber growth, and affiliate liabilities."
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
          label="Traffic Source Split"
          requiredData="Analytics events & UTM capture."
          recommendation="Implement GA4 or internal traffic_sources table."
        />
        <MissingMetricCard
          label="CPA by Channel"
          requiredData="Ad spend mapping to conversion sources."
          recommendation="Integrate platform spend APIs."
        />
        <MissingMetricCard
          label="Email Campaign CTR"
          requiredData="Email platform open & click webhooks."
          recommendation="Add email_campaign_metrics table."
        />
        <MissingMetricCard
          label="Landing Page Bounce Rate"
          requiredData="Session and pageview duration logs."
          recommendation="Requires external analytics tooling."
        />
      </div>

      <InsightPanels insights={viewData.insights} quality={viewData.quality} />

      <SectionHeader
        title="Acquisition Performance"
        description="Visual breakdown of code usage, affiliate impact, and list growth."
      />
      <div className="charts-grid">
        <div className="chart-card" style={{ gridColumn: "1 / -1" }}>
          <h3>
            Code Redemptions Over Time (
            {viewControls.chartGranularity || "Weekly"})
          </h3>
          <div className="chart-wrapper">
            {viewData.charts.chartUsage.length ? (
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={viewData.charts.chartUsage}>
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
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#e11d48"
                    strokeWidth={3}
                    dot={false}
                    name="Redemptions"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <ChartEmptyState />
            )}
          </div>
        </div>

        <div className="chart-card">
          <h3>Top Codes by Revenue</h3>
          <div className="chart-wrapper">
            {viewData.charts.chartTopCodesRev.length ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={viewData.charts.chartTopCodesRev}>
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
                    dataKey="revenue"
                    fill="#0d9488"
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
          <h3>Top Codes by Redemptions</h3>
          <div className="chart-wrapper">
            {viewData.charts.chartTopCodesUses.length ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={viewData.charts.chartTopCodesUses}>
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
                    dataKey="uses"
                    fill="#f59e0b"
                    radius={[4, 4, 0, 0]}
                    name="Uses"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ChartEmptyState />
            )}
          </div>
        </div>

        <div className="chart-card">
          <h3>Affiliate Revenue Leaderboard</h3>
          <div className="chart-wrapper">
            {viewData.charts.chartAffiliates.length ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={viewData.charts.chartAffiliates}
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
                  <Legend />
                  <Bar
                    dataKey="revenue"
                    fill="#4635de"
                    radius={[0, 4, 4, 0]}
                    name="Generated Revenue"
                  />
                  <Bar
                    dataKey="commission"
                    fill="#10b981"
                    radius={[0, 4, 4, 0]}
                    name="Est. Commission"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ChartEmptyState />
            )}
          </div>
        </div>

        <div className="chart-card">
          <h3>
            Subscriber Growth ({viewControls.chartGranularity || "Weekly"})
          </h3>
          <div className="chart-wrapper">
            {viewData.charts.chartSubs.length ? (
              <ResponsiveContainer width="100%" height={250}>
                <ComposedChart data={viewData.charts.chartSubs}>
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
                  <Bar
                    dataKey="subscribers"
                    fill="#8b5cf6"
                    radius={[4, 4, 0, 0]}
                    name="New Subscribers"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <ChartEmptyState />
            )}
          </div>
        </div>
      </div>

      <SectionHeader
        title="Marketing Ledger"
        description="Consolidated view of all active discounts, affiliates, and vouchers."
      />
      <DataTable
        data={viewData.tableData}
        columns={viewData.tableCols}
        resetKey="marketing"
        viewMode={viewControls.viewMode}
        topN={viewControls.topN}
      />
    </div>
  );
}
