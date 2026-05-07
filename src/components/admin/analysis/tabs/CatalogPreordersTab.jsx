import React, { useMemo, useEffect } from "react";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  hasUrl,
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
  Package,
  CheckCircle2,
  Clock,
  EyeOff,
  AlertTriangle,
  Image as ImageIcon,
  Link as LinkIcon,
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
  "#4635de",
  "#0d9488",
  "#f59e0b",
  "#e11d48",
  "#64748b",
  "#8b5cf6",
  "#10b981",
];

export default function CatalogPreordersTab({
  db,
  productsMap,
  searchQuery,
  applyRowFilters,
  setExportData,
  viewControls = {},
  handleViewControlChange,
}) {
  const viewData = useMemo(() => {
    // 1. Core Metrics Calculation
    const totalProducts = (db.products || []).length;
    const totalVariants = (db.variants || []).length;

    let inStockProducts = 0;
    let oosProducts = 0;
    (db.products || []).forEach((p) => {
      if (p.in_stock) inStockProducts++;
      else oosProducts++;
    });

    let inStockVariants = 0;
    let oosVariants = 0;
    let preorderVariants = 0;
    let hiddenVariants = 0;
    let defaultVariants = 0;
    let missingStripe = 0;
    let missingProductImage = 0;
    let missingVariantImage = 0;

    (db.products || []).forEach((p) => {
      if (!hasUrl(p.image_url)) missingProductImage++;
    });

    // Chart Aggregations
    const preorderByProduct = {};
    const missingStripeByCat = {};
    const oosByCat = {};
    const priceByCat = {}; // To calculate average price

    let table = (db.variants || []).map((v) => {
      const p = productsMap[v.product_id] || {};

      const isOos = !v.in_stock && !v.is_preorder;
      const isMissingStripe = !v.stripe_price_id;
      const hasImg = hasUrl(p.image_url) || hasUrl(v.image_url);
      const hasCoa = hasUrl(p.lab_result_url) || hasUrl(v.lab_result_url);
      const cat = p.category || "Uncategorized";

      if (v.in_stock) inStockVariants++;
      if (isOos) oosVariants++;
      if (v.is_preorder) preorderVariants++;
      if (v.is_hidden) hiddenVariants++;
      if (v.is_default) defaultVariants++;
      if (isMissingStripe) missingStripe++;
      if (!hasUrl(v.image_url)) missingVariantImage++;

      // Aggregations
      if (v.is_preorder) {
        preorderByProduct[p.name] = (preorderByProduct[p.name] || 0) + 1;
      }
      if (isMissingStripe) {
        missingStripeByCat[cat] = (missingStripeByCat[cat] || 0) + 1;
      }
      if (isOos) {
        oosByCat[cat] = (oosByCat[cat] || 0) + 1;
      }
      if (!priceByCat[cat]) priceByCat[cat] = { sum: 0, count: 0 };
      priceByCat[cat].sum += Number(v.price || 0);
      priceByCat[cat].count += 1;

      // Availability Risk Score (Heuristic: higher is worse)
      let riskScore = 0;
      if (isOos) riskScore += 3;
      if (isMissingStripe) riskScore += 2;
      if (!hasImg) riskScore += 2;
      if (!hasCoa) riskScore += 1;
      if (v.is_hidden && v.in_stock) riskScore += 1; // Hidden but taking up stock

      return {
        // Hidden sort keys
        _price: Number(v.price || 0),
        _riskScore: riskScore,
        _preorderScore: v.is_preorder ? 1 : 0,
        _hiddenScore: v.is_hidden ? 1 : 0,
        _missingStripeScore: isMissingStripe ? 1 : 0,
        _missingImageScore: !hasImg ? 1 : 0,

        product: p.name || "Orphan Variant",
        category: cat,
        product_stock: p.in_stock ? "In Stock" : "Out of Stock",
        variant: v.size_label,
        price: Number(v.price || 0),
        variant_stock: v.in_stock
          ? "In Stock"
          : v.is_preorder
            ? "Preorder"
            : "Out of Stock",
        preorder: v.is_preorder ? "Yes" : "No",
        hidden: v.is_hidden ? "Yes" : "No",
        default: v.is_default ? "Yes" : "No",
        stripe_id: v.stripe_price_id ? "Linked" : "Missing",
        image_status: hasImg ? "Yes" : "No",
        coa_status: hasCoa ? "Verified" : "Missing",
        availability_risk: riskScore,
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
      if (sortBy === "preorder_first")
        return (b._preorderScore - a._preorderScore) * dirMult;
      if (sortBy === "hidden_first")
        return (b._hiddenScore - a._hiddenScore) * dirMult;
      if (sortBy === "missing_stripe")
        return (b._missingStripeScore - a._missingStripeScore) * dirMult;
      if (sortBy === "missing_image")
        return (b._missingImageScore - a._missingImageScore) * dirMult;
      if (sortBy === "price_desc") return (b._price - a._price) * dirMult;
      if (sortBy === "product_asc")
        return (
          a.product.localeCompare(b.product) * (sortDir === "asc" ? 1 : -1)
        );
      return b._riskScore - a._riskScore; // Default fallback
    });

    // 2. Format Charts Data
    const topN =
      viewControls.topN === "all" ? 100 : Number(viewControls.topN || 5);

    const chartAvailability = [
      { name: "In Stock", value: inStockVariants },
      { name: "Out of Stock", value: oosVariants },
      { name: "Preorder", value: preorderVariants },
    ];

    const chartVisibility = [
      { name: "Visible", value: totalVariants - hiddenVariants },
      { name: "Hidden", value: hiddenVariants },
    ];

    const chartPreorderProd = Object.entries(preorderByProduct)
      .map(([name, value]) => ({
        name: name.length > 15 ? name.substring(0, 15) + "..." : name,
        value,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, topN);

    const chartMissingStripe = Object.entries(missingStripeByCat)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, topN);

    const chartOosCat = Object.entries(oosByCat)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, topN);

    const chartPriceCat = Object.entries(priceByCat)
      .map(([name, data]) => ({
        name,
        value: data.count > 0 ? data.sum / data.count : 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, topN);

    return {
      metrics: [
        {
          label: "Total Products",
          value: formatNumber(totalProducts),
          icon: <Package />,
        },
        {
          label: "Total Variants",
          value: formatNumber(totalVariants),
          icon: <Package />,
        },
        {
          label: "In Stock Variants",
          value: formatNumber(inStockVariants),
          icon: <CheckCircle2 />,
        },
        {
          label: "Out of Stock Variants",
          value: formatNumber(oosVariants),
          icon: <AlertTriangle />,
          alert: oosVariants > 0,
        },
        {
          label: "Preorder Variants",
          value: formatNumber(preorderVariants),
          icon: <Clock />,
        },
        {
          label: "Hidden Variants",
          value: formatNumber(hiddenVariants),
          icon: <EyeOff />,
          status: hiddenVariants > 0 ? "warning" : "success",
        },
        {
          label: "Missing Stripe IDs",
          value: formatNumber(missingStripe),
          icon: <LinkIcon />,
          alert: missingStripe > 0,
        },
        {
          label: "Missing Product Images",
          value: formatNumber(missingProductImage),
          icon: <ImageIcon />,
          alert: missingProductImage > 0,
        },
      ],
      quality: [
        {
          label: "Variants Missing Stripe ID",
          value: missingStripe,
          critical: missingStripe > 0,
        },
        {
          label: "Products Missing Master Image",
          value: missingProductImage,
          critical: true,
        },
        { label: "Variants Out of Stock", value: oosVariants, critical: false },
      ],
      insights: [
        `${formatPercent((inStockProducts / Math.max(totalProducts, 1)) * 100)} of master products have active inventory.`,
        `There are ${formatNumber(defaultVariants)} variants actively assigned as default selections.`,
      ],
      charts: {
        chartAvailability,
        chartVisibility,
        chartPreorderProd,
        chartMissingStripe,
        chartOosCat,
        chartPriceCat,
      },
      tableCols: [
        { key: "product", label: "Product", primary: true },
        { key: "category", label: "Category" },
        { key: "variant", label: "Variant" },
        {
          key: "price",
          label: "Price",
          render: (r) => formatCurrency(r.price),
        },
        { key: "variant_stock", label: "Variant Stock", type: "badge" },
        { key: "product_stock", label: "Product Stock", type: "badge" },
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
          key: "stripe_id",
          label: "Stripe ID",
          render: (r) => (
            <StatusBadge
              text={r.stripe_id}
              tone={r.stripe_id === "Linked" ? "success" : "danger"}
            />
          ),
        },
        {
          key: "image_status",
          label: "Image",
          render: (r) => (
            <StatusBadge
              text={r.image_status}
              tone={r.image_status === "Yes" ? "success" : "danger"}
            />
          ),
        },
        {
          key: "coa_status",
          label: "COA",
          render: (r) => (
            <StatusBadge
              text={r.coa_status}
              tone={r.coa_status === "Verified" ? "success" : "warning"}
            />
          ),
        },
        {
          key: "availability_risk",
          label: "Risk Score",
          render: (r) => (
            <span
              style={{
                color: r.availability_risk > 0 ? "#e11d48" : "#16a34a",
                fontWeight: "bold",
              }}
            >
              {r.availability_risk}
            </span>
          ),
        },
      ],
      tableData: table,
    };
  }, [db, productsMap, searchQuery, applyRowFilters, viewControls]);

  useEffect(() => {
    setExportData({
      rows: viewData.tableData.map((r) => ({
        Product: r.product,
        Category: r.category,
        Variant: r.variant,
        Price: r.price,
        "Product Stock": r.product_stock,
        "Variant Stock": r.variant_stock,
        Preorder: r.preorder,
        Hidden: r.hidden,
        Default: r.default,
        "Stripe ID": r.stripe_id,
        Image: r.image_status,
        COA: r.coa_status,
        "Risk Score": r.availability_risk,
      })),
      cols: [
        "Product",
        "Category",
        "Variant",
        "Price",
        "Product Stock",
        "Variant Stock",
        "Preorder",
        "Hidden",
        "Default",
        "Stripe ID",
        "Image",
        "COA",
        "Risk Score",
      ],
    });
  }, [viewData, setExportData]);

  const sortOptions = [
    { value: "risk_desc", label: "Availability Risk (High to Low)" },
    { value: "preorder_first", label: "Preorder Variants First" },
    { value: "hidden_first", label: "Hidden Variants First" },
    { value: "missing_stripe", label: "Missing Stripe IDs First" },
    { value: "missing_image", label: "Missing Images First" },
    { value: "price_desc", label: "Price (High to Low)" },
    { value: "product_asc", label: "Product Name (A-Z)" },
  ];

  // Schema Recommendations specific to Inventory Operations
  const inventoryDataAvailability = {
    "Stock Turnover Rate": "missing",
    "Out-of-stock Frequency": "missing",
    "Inventory Days on Hand": "missing",
    "Shelf-life Risk": "missing",
  };

  const inventorySchemaRecommendations = [
    "variants.stock_quantity",
    "variants.reorder_point",
    "inventory_batches.batch_number",
    "inventory_batches.expiry_date",
    "inventory_movements",
    "inventory_availability_snapshots",
  ];

  return (
    <div className="tab-content">
      

      <SectionHeader
        title="Catalog & Operational Inventory"
        description="Track product visibility, missing configurations, and catalog health."
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
          label="Stock Turnover Rate"
          requiredData="Exact stock quantities & historical inventory movements."
          recommendation="Migrate from boolean in_stock to numeric tracking."
        />
        <MissingMetricCard
          label="Out of Stock Frequency"
          requiredData="Historical out-of-stock status logs."
          recommendation="Implement inventory_availability_snapshots."
        />
        <MissingMetricCard
          label="Inventory Days on Hand"
          requiredData="Current stock quantity & sales velocity."
          recommendation="Add variants.stock_quantity."
        />
        <MissingMetricCard
          label="Shelf-life Risk"
          requiredData="Batch numbers & expiry dates."
          recommendation="Add inventory_batches tracking."
        />
      </div>

      <InsightPanels insights={viewData.insights} quality={viewData.quality} />

      <SectionHeader
        title="Availability & Configuration Intelligence"
        description="Visual breakdown of stock levels, preorders, and Stripe integrations."
      />
      <div className="charts-grid">
        <div className="chart-card">
          <h3>Variant Availability</h3>
          <div className="chart-wrapper">
            {viewData.charts.chartAvailability.some((d) => d.value > 0) ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={viewData.charts.chartAvailability}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    nameKey="name"
                  >
                    <Cell fill="#10b981" /> {/* In Stock */}
                    <Cell fill="#e11d48" /> {/* Out of Stock */}
                    <Cell fill="#f59e0b" /> {/* Preorder */}
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
          <h3>Catalog Visibility</h3>
          <div className="chart-wrapper">
            {viewData.charts.chartVisibility.some((d) => d.value > 0) ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={viewData.charts.chartVisibility}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    nameKey="name"
                  >
                    <Cell fill="#0d9488" /> {/* Visible */}
                    <Cell fill="#64748b" /> {/* Hidden */}
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
          <h3>Preorder Variants by Product</h3>
          <div className="chart-wrapper">
            {viewData.charts.chartPreorderProd.length ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={viewData.charts.chartPreorderProd}>
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
                    fill="#f59e0b"
                    radius={[4, 4, 0, 0]}
                    name="Preorder Variants"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ChartEmptyState message="No preorder variants found." />
            )}
          </div>
        </div>

        <div className="chart-card">
          <h3>Missing Stripe IDs by Category</h3>
          <div className="chart-wrapper">
            {viewData.charts.chartMissingStripe.length ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={viewData.charts.chartMissingStripe}
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
                    width={100}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="value"
                    fill="#e11d48"
                    radius={[0, 4, 4, 0]}
                    name="Missing Stripe IDs"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ChartEmptyState message="All variants are correctly linked to Stripe!" />
            )}
          </div>
        </div>

        <div className="chart-card">
          <h3>Out of Stock Variants by Category</h3>
          <div className="chart-wrapper">
            {viewData.charts.chartOosCat.length ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={viewData.charts.chartOosCat}>
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
                    fill="#64748b"
                    radius={[4, 4, 0, 0]}
                    name="Out of Stock Variants"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ChartEmptyState message="No variants are currently out of stock." />
            )}
          </div>
        </div>

        <div className="chart-card">
          <h3>Average Price by Category</h3>
          <div className="chart-wrapper">
            {viewData.charts.chartPriceCat.length ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={viewData.charts.chartPriceCat}>
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
                  <Tooltip
                    content={<CustomTooltip />}
                    formatter={(value) => formatCurrency(value)}
                  />
                  <Bar
                    dataKey="value"
                    fill="#4635de"
                    radius={[4, 4, 0, 0]}
                    name="Average Price"
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
        title="Operational Variant Ledger"
        description="Master configuration and status list of all variants in the catalog."
      />
      <DataTable
        data={viewData.tableData}
        columns={viewData.tableCols}
        resetKey="inventory"
        viewMode={viewControls.viewMode}
        topN={viewControls.topN}
      />
    </div>
  );
}
