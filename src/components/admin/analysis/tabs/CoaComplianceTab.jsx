import React, { useMemo, useEffect } from "react";
import {
  formatPercent,
  formatNumber,
  hasUrl,
  scanForRisk,
  matchesRecordSearch,
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
  FileText,
  ShieldAlert,
  AlertTriangle,
  Users,
  Info,
  MessageSquare,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const COLORS = [
  "#10b981",
  "#ef4444",
  "#f59e0b",
  "#4635de",
  "#64748b",
  "#0d9488",
  "#8b5cf6",
];

export default function CoaComplianceTab({
  db,
  searchQuery,
  applyRowFilters,
  setExportData,
  viewControls = {},
  handleViewControlChange,
}) {
  const viewData = useMemo(() => {
    // 1. Core Calculations
    const totalProducts = (db.products || []).length;
    const totalVariants = (db.variants || []).length;

    let pCoaCount = 0;
    let vCoaCount = 0;
    let activeMissingCoa = 0;
    let preorderMissingCoa = 0;
    let totalRiskFlags = 0;

    // Track missing COAs by category
    const missingCoaByCat = {};
    const riskByProduct = [];

    // Pre-calculate Product Risk to attach to variants
    const productRiskMap = {};
    (db.products || []).forEach((p) => {
      const pHasCoa = hasUrl(p.lab_result_url);
      if (pHasCoa) pCoaCount++;
      if (p.in_stock && !pHasCoa) activeMissingCoa++;

      const descRisk = scanForRisk(p.description);
      const calcRisk =
        scanForRisk(p.calc_description) + scanForRisk(p.calc_example);
      const totalRisk = descRisk + calcRisk;
      productRiskMap[p.id] = totalRisk;
      totalRiskFlags += totalRisk;

      if (totalRisk > 0) {
        riskByProduct.push({ name: p.name, flags: totalRisk });
      }

      if (!pHasCoa) {
        const cat = p.category || "Uncategorized";
        missingCoaByCat[cat] = (missingCoaByCat[cat] || 0) + 1;
      }
    });

    // 2. Build Table & Variant-Level Metrics
    let preorderVariants = 0;
    let preorderWithCoa = 0;

    let table = (db.variants || []).map((v) => {
      const p =
        (db.products || []).find((prod) => prod.id === v.product_id) || {};
      const pHasCoa = hasUrl(p.lab_result_url);
      const vHasCoa = hasUrl(v.lab_result_url);

      if (vHasCoa) vCoaCount++;
      if (v.is_preorder) {
        preorderVariants++;
        if (vHasCoa) preorderWithCoa++;
        else preorderMissingCoa++;
      }

      const pRisk = productRiskMap[p.id] || 0;

      // Calculate a combined compliance risk score for sorting
      let riskScore = pRisk * 2; // Text risk is weighted higher
      if (!pHasCoa) riskScore += 5;
      if (!vHasCoa) riskScore += 3;
      if (v.is_preorder && !vHasCoa) riskScore += 2; // Extra risk for selling unseen batches

      return {
        _rawDate: p.created_at || v.created_at,
        _riskScore: riskScore,
        _flags: pRisk,
        _missingCoaScore: !pHasCoa || !vHasCoa ? 1 : 0,
        _preorderMissingScore: v.is_preorder && (!pHasCoa || !vHasCoa) ? 1 : 0,

        product: p.name || "Orphan",
        slug: p.slug || "N/A",
        category: p.category || "N/A",
        variant: v.size_label || "Unknown",
        product_coa: pHasCoa ? "Verified" : "Missing",
        variant_coa: vHasCoa ? "Verified" : "Missing",
        preorder: v.is_preorder ? "Yes" : "No",
        hidden: v.is_hidden ? "Yes" : "No",
        risk_flags: pRisk,
        risk_score: riskScore,
      };
    });

    if (searchQuery)
      table = table.filter((r) => matchesRecordSearch(r, searchQuery));
    table = table.filter(applyRowFilters);

    // Apply Sorting
    const sortBy = viewControls.sortBy || "risk_desc";
    const sortDir = viewControls.sortDirection || "desc";
    const dirMult = sortDir === "desc" ? 1 : -1;

    table.sort((a, b) => {
      if (sortBy === "risk_desc")
        return (b._riskScore - a._riskScore) * dirMult;
      if (sortBy === "flags_desc") return (b._flags - a._flags) * dirMult;
      if (sortBy === "missing_coa_first")
        return (b._missingCoaScore - a._missingCoaScore) * dirMult;
      if (sortBy === "preorder_missing_first")
        return (b._preorderMissingScore - a._preorderMissingScore) * dirMult;
      if (sortBy === "product_asc")
        return (
          a.product.localeCompare(b.product) * (sortDir === "asc" ? 1 : -1)
        );
      return b._riskScore - a._riskScore;
    });

    // 3. Topic Classifier (NLP Keyword Grouping)
    const topics = {
      "COA / Lab Reports": 0,
      "Shipping / Tracking": 0,
      "Payment / Checkout": 0,
      "Regulatory / Customs": 0,
      "Refunds / Returns": 0,
      "Product Mixing / Storage": 0,
      Other: 0,
    };

    const classifyTopic = (text) => {
      if (!text) return "Other";
      const t = String(text).toLowerCase();
      if (t.match(/coa|lab|test|result|certificate|purity|hplc/))
        return "COA / Lab Reports";
      if (t.match(/ship|track|delivery|arrive|post|dispatch/))
        return "Shipping / Tracking";
      if (t.match(/pay|card|checkout|charge|stripe|bank/))
        return "Payment / Checkout";
      if (t.match(/legal|tga|fda|customs|prescription|seize|border/))
        return "Regulatory / Customs";
      if (t.match(/refund|return|cancel|broken|damage/))
        return "Refunds / Returns";
      if (
        t.match(
          /how to|mix|reconstitute|dose|water|bacteriostatic|fridge|store/,
        )
      )
        return "Product Mixing / Storage";
      return "Other";
    };

    const allMessages = [...(db.inquiries || []), ...(db.inbox || [])];
    allMessages.forEach((msg) => {
      const combinedText = `${msg.subject || ""} ${msg.message || msg.body_text || ""}`;
      const topic = classifyTopic(combinedText);
      topics[topic]++;
    });

    // 4. Chart Formats
    const topN =
      viewControls.topN === "all" ? 100 : Number(viewControls.topN || 5);

    const chartProdCoa = [
      { name: "Verified", value: pCoaCount },
      { name: "Missing", value: totalProducts - pCoaCount },
    ];

    const chartVarCoa = [
      { name: "Verified", value: vCoaCount },
      { name: "Missing", value: totalVariants - vCoaCount },
    ];

    const chartPreorderCoa = [
      { name: "Verified Preorders", value: preorderWithCoa },
      { name: "Missing COA Preorders", value: preorderMissingCoa },
    ];

    const chartMissingCoaCat = Object.entries(missingCoaByCat)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, topN);

    const chartTopics = Object.entries(topics)
      .filter(([_, val]) => val > 0)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const chartRiskProd = riskByProduct
      .sort((a, b) => b.flags - a.flags)
      .slice(0, topN)
      .map((p) => ({
        ...p,
        name: p.name.length > 15 ? p.name.substring(0, 15) + "..." : p.name,
      }));

    return {
      metrics: [
        {
          label: "Product COA Coverage",
          value: formatPercent((pCoaCount / Math.max(totalProducts, 1)) * 100),
          icon: <FileText />,
          status: pCoaCount < totalProducts ? "warning" : "success",
        },
        {
          label: "Variant COA Coverage",
          value: formatPercent((vCoaCount / Math.max(totalVariants, 1)) * 100),
          icon: <FileText />,
          status: vCoaCount < totalVariants ? "warning" : "success",
        },
        {
          label: "Products Missing COA",
          value: formatNumber(totalProducts - pCoaCount),
          icon: <ShieldAlert />,
          alert: totalProducts - pCoaCount > 0,
        },
        {
          label: "Variants Missing COA",
          value: formatNumber(totalVariants - vCoaCount),
          icon: <ShieldAlert />,
          alert: totalVariants - vCoaCount > 0,
        },
        {
          label: "Preorders Missing COA",
          value: formatNumber(preorderMissingCoa),
          icon: <AlertTriangle />,
          alert: preorderMissingCoa > 0,
        },
        {
          label: "Text Compliance Flags",
          value: formatNumber(totalRiskFlags),
          icon: <ShieldAlert />,
          alert: totalRiskFlags > 0,
        },
        {
          label: "Total Support Volume",
          value: formatNumber(allMessages.length),
          icon: <MessageSquare />,
        },
        {
          label: "COA-Related Inquiries",
          value: formatNumber(topics["COA / Lab Reports"]),
          icon: <FileText />,
        },
      ],
      quality: [
        {
          label: "Active In-Stock Products Missing COA",
          value: activeMissingCoa,
          critical: true,
        },
        {
          label: "Preorder Variants Missing COA",
          value: preorderMissingCoa,
          critical: true,
        },
        {
          label: "Products with Identified Text Risk Flags",
          value: riskByProduct.length,
          critical: false,
        },
      ],
      insights: [
        `Approximately ${formatPercent((topics["Shipping / Tracking"] / Math.max(allMessages.length, 1)) * 100)} of inquiries are related to shipping and tracking.`,
        `Scanned product descriptions and calculator fields for operational and regulatory risk terms.`,
      ],
      charts: {
        chartProdCoa,
        chartVarCoa,
        chartPreorderCoa,
        chartMissingCoaCat,
        chartTopics,
        chartRiskProd,
      },
      tableCols: [
        { key: "product", label: "Product", primary: true },
        { key: "category", label: "Category" },
        { key: "variant", label: "Variant" },
        { key: "product_coa", label: "Product COA", type: "badge" },
        { key: "variant_coa", label: "Variant COA", type: "badge" },
        {
          key: "preorder",
          label: "Preorder",
          render: (r) => (
            <StatusBadge
              text={r.preorder}
              tone={r.preorder === "Yes" ? "warning" : "neutral"}
            />
          ),
        },
        {
          key: "hidden",
          label: "Hidden",
          render: (r) => (
            <StatusBadge
              text={r.hidden}
              tone={r.hidden === "Yes" ? "warning" : "success"}
            />
          ),
        },
        {
          key: "risk_flags",
          label: "Text Risk Flags",
          render: (r) => (
            <span
              style={{
                color: r.risk_flags > 0 ? "#e11d48" : "#16a34a",
                fontWeight: "bold",
              }}
            >
              {r.risk_flags} Flags
            </span>
          ),
        },
        {
          key: "risk_score",
          label: "Overall Risk Score",
          render: (r) => (
            <span
              style={{
                color: r.risk_score > 0 ? "#e11d48" : "#16a34a",
                fontWeight: "bold",
              }}
            >
              {r.risk_score}
            </span>
          ),
        },
      ],
      tableData: table,
    };
  }, [db, searchQuery, applyRowFilters, viewControls]);

  useEffect(() => {
    setExportData({
      rows: viewData.tableData.map((r) => ({
        Product: r.product,
        Slug: r.slug,
        Category: r.category,
        Variant: r.variant,
        "Product COA": r.product_coa,
        "Variant COA": r.variant_coa,
        Preorder: r.preorder,
        Hidden: r.hidden,
        "Text Risk Flags": r.risk_flags,
        "Overall Risk Score": r.risk_score,
      })),
      cols: [
        "Product",
        "Slug",
        "Category",
        "Variant",
        "Product COA",
        "Variant COA",
        "Preorder",
        "Hidden",
        "Text Risk Flags",
        "Overall Risk Score",
      ],
    });
  }, [viewData, setExportData]);

  const sortOptions = [
    { value: "risk_desc", label: "Overall Risk Score (High to Low)" },
    { value: "missing_coa_first", label: "Missing COA First" },
    { value: "preorder_missing_first", label: "Preorders Missing COA First" },
    { value: "flags_desc", label: "Text Risk Flags (High to Low)" },
    { value: "product_asc", label: "Product Name (A-Z)" },
  ];

  const complianceDataAvailability = {
    "Orders with COA requests": "missing",
    "Checkout drop-off points": "missing",
    "Customer Support Topics": "partial (estimated via keyword grouping)",
  };

  const complianceSchemaRecommendations = [
    "checkout_events",
    "coa_requests",
    "support_ticket_tags",
  ];

  return (
    <div className="tab-content">
      <DataAvailabilityPanel
        dataAvailability={complianceDataAvailability}
        schemaRecommendations={complianceSchemaRecommendations}
      />

      <SectionHeader
        title="Compliance & Trust Signals"
        description="Monitor laboratory verification, regulatory text risks, and customer trust inquiries."
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
          label="% Orders Requesting COA"
          requiredData="Specific checkout toggles or tags for printed COAs."
          recommendation="Add 'requires_printed_coa' boolean to orders."
        />
        <MissingMetricCard
          label="Checkout Drop-offs"
          requiredData="Funnel step events (cart -> shipping -> payment)."
          recommendation="Implement a checkout_events tracking table."
        />
      </div>

      <InsightPanels insights={viewData.insights} quality={viewData.quality} />

      <SectionHeader
        title="Compliance Visualization"
        description="Breakdown of laboratory coverage, content risk, and customer concerns."
      />
      <div className="charts-grid">
        <div className="chart-card">
          <h3>Product COA Coverage</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={viewData.charts.chartProdCoa}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  nameKey="name"
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#ef4444" />
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <h3>Variant COA Coverage</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={viewData.charts.chartVarCoa}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  nameKey="name"
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#ef4444" />
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <h3>Preorder COA Status</h3>
          <div className="chart-wrapper">
            {viewData.charts.chartPreorderCoa.some((d) => d.value > 0) ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={viewData.charts.chartPreorderCoa}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    nameKey="name"
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#f59e0b" />
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <ChartEmptyState message="No preorder variants found." />
            )}
          </div>
        </div>

        <div className="chart-card">
          <h3>Missing COAs by Category</h3>
          <div className="chart-wrapper">
            {viewData.charts.chartMissingCoaCat.length ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={viewData.charts.chartMissingCoaCat}>
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
                    fill="#ef4444"
                    radius={[4, 4, 0, 0]}
                    name="Missing COAs"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ChartEmptyState message="All products have verified COAs!" />
            )}
          </div>
        </div>

        <div className="chart-card">
          <h3>Support Ticket Topics (Estimated)</h3>
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
                    dataKey="value"
                    fill="#4635de"
                    radius={[0, 4, 4, 0]}
                    name="Inquiries"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ChartEmptyState />
            )}
          </div>
        </div>

        <div className="chart-card">
          <h3>Products with Text Risk Flags</h3>
          <div className="chart-wrapper">
            {viewData.charts.chartRiskProd.length ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={viewData.charts.chartRiskProd}>
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
                    dataKey="flags"
                    fill="#e11d48"
                    radius={[4, 4, 0, 0]}
                    name="Risk Flags"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ChartEmptyState message="No text compliance risks found." />
            )}
          </div>
        </div>
      </div>

      <SectionHeader
        title="Compliance Ledger"
        description="Granular risk and verification status for all catalog variants."
      />
      <DataTable
        data={viewData.tableData}
        columns={viewData.tableCols}
        resetKey="compliance"
        viewMode={viewControls.viewMode}
        topN={viewControls.topN}
      />
    </div>
  );
}
