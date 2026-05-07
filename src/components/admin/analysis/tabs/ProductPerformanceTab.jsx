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
  Package,
  Tag,
  TrendingUp,
  Activity,
  ShieldAlert,
  EyeOff,
  Clock,
  AlertTriangle,
  DollarSign,
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

export default function ProductPerformanceTab({
  db,
  filterByDate,
  productsMap,
  variantsMap,
  searchQuery,
  applyRowFilters,
  setExportData,
  viewControls = {},
  handleViewControlChange,
}) {
  const viewData = useMemo(() => {
    const fOrders = filterByDate(db.orders || [], "created_at");

    // 1. Core Aggregations
    const prodStats = {};
    const varStats = {};
    const catStats = {};
    let totalUnits = 0;
    let accessoryOrders = new Set();
    let preorderRev = 0;
    let normalRev = 0;

    fOrders.forEach((o) => {
      const items = normalizeOrderItems(o, productsMap, variantsMap);
      let hasAccessory = false;

      items.forEach((i) => {
        if (i.category.toLowerCase().includes("accessor")) hasAccessory = true;
        totalUnits += i.quantity;
        const itemRev = i.price * i.quantity;

        if (i.is_preorder) preorderRev += itemRev;
        else normalRev += itemRev;

        // Variant Stats
        const vKey = i.variant_id || i.name;
        if (!varStats[vKey]) {
          varStats[vKey] = {
            name: i.name,
            category: i.category,
            qty: 0,
            rev: 0,
            is_preorder: i.is_preorder,
          };
        }
        varStats[vKey].qty += i.quantity;
        varStats[vKey].rev += itemRev;

        // Product Stats
        const pKey = i.name;
        if (!prodStats[pKey]) {
          prodStats[pKey] = {
            name: pKey,
            category: i.category,
            qty: 0,
            rev: 0,
          };
        }
        prodStats[pKey].qty += i.quantity;
        prodStats[pKey].rev += itemRev;

        // Category Stats
        const cKey = i.category || "Uncategorized";
        if (!catStats[cKey]) {
          catStats[cKey] = { category: cKey, qty: 0, rev: 0 };
        }
        catStats[cKey].qty += i.quantity;
        catStats[cKey].rev += itemRev;
      });
      if (hasAccessory) accessoryOrders.add(o.id);
    });

    const accAttachRate = fOrders.length
      ? (accessoryOrders.size / fOrders.length) * 100
      : 0;

    // 2. Catalog Health Metrics
    const totalProducts = (db.products || []).length;
    const totalVariants = (db.variants || []).length;

    let visibleVariants = 0;
    let hiddenVariants = 0;
    let oosVariants = 0;
    let preorderVariants = 0;
    let productCoaCount = 0;
    let variantCoaCount = 0;

    (db.products || []).forEach((p) => {
      if (hasUrl(p.lab_result_url)) productCoaCount++;
    });

    (db.variants || []).forEach((v) => {
      if (v.is_hidden) hiddenVariants++;
      else visibleVariants++;
      if (v.is_preorder) preorderVariants++;
      if (!v.in_stock && !v.is_preorder) oosVariants++;
      if (hasUrl(v.lab_result_url)) variantCoaCount++;
    });

    // 3. Charts Data
    const topN =
      viewControls.topN === "all" ? 100 : Number(viewControls.topN || 5);

    const chartTopProducts = Object.values(prodStats)
      .sort((a, b) => b.rev - a.rev)
      .slice(0, topN)
      .map((p) => ({
        ...p,
        shortName:
          p.name.length > 15 ? p.name.substring(0, 15) + "..." : p.name,
      }));

    const chartTopVariants = Object.values(varStats)
      .sort((a, b) => b.rev - a.rev)
      .slice(0, topN)
      .map((v) => ({
        ...v,
        shortName:
          v.name.length > 15 ? v.name.substring(0, 15) + "..." : v.name,
      }));

    const chartUnitsSold = Object.values(prodStats)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, topN)
      .map((p) => ({
        ...p,
        shortName:
          p.name.length > 15 ? p.name.substring(0, 15) + "..." : p.name,
      }));

    const chartCatRev = Object.values(catStats).sort((a, b) => b.rev - a.rev);

    const chartPreorderMix = [
      { name: "In-Stock Revenue", value: normalRev },
      { name: "Preorder Revenue", value: preorderRev },
    ];

    const chartCoaMix = [
      { name: "Verified Product COA", value: productCoaCount },
      { name: "Missing Product COA", value: totalProducts - productCoaCount },
    ];

    // Price Distribution
    const priceBuckets = {
      "< $50": 0,
      "$50 - $99": 0,
      "$100 - $149": 0,
      "$150 - $199": 0,
      "$200+": 0,
    };
    (db.variants || []).forEach((v) => {
      const p = Number(v.price || 0);
      if (p < 50) priceBuckets["< $50"]++;
      else if (p < 100) priceBuckets["$50 - $99"]++;
      else if (p < 150) priceBuckets["$100 - $149"]++;
      else if (p < 200) priceBuckets["$150 - $199"]++;
      else priceBuckets["$200+"]++;
    });
    const chartPrices = Object.entries(priceBuckets).map(([name, count]) => ({
      name,
      count,
    }));

    // 4. Data Table
    let table = (db.variants || []).map((v) => {
      const p = productsMap[v.product_id] || {};
      const stats = varStats[v.id] || { qty: 0, rev: 0 };

      const pCoa = hasUrl(p.lab_result_url);
      const vCoa = hasUrl(v.lab_result_url);
      const isOos = !v.in_stock && !v.is_preorder;

      return {
        // Hidden sort keys
        _revenue: stats.rev,
        _unitsSold: stats.qty,
        _price: Number(v.price || 0),
        _coaMissingScore: (pCoa ? 0 : 1) + (vCoa ? 0 : 1),
        _preorderScore: v.is_preorder ? 1 : 0,
        _hiddenScore: v.is_hidden ? 1 : 0,
        _oosScore: isOos ? 1 : 0,

        // Visible Columns
        product: p.name || "Orphan Variant",
        slug: p.slug || "N/A",
        category: p.category || "N/A",
        variant_id: v.id,
        size_label: v.size_label,
        price: Number(v.price || 0),
        units_sold: stats.qty,
        revenue: stats.rev,
        product_stock: p.in_stock ? "In Stock" : "Out of Stock",
        variant_stock: v.in_stock
          ? "In Stock"
          : v.is_preorder
            ? "Preorder"
            : "Out of Stock",
        preorder: v.is_preorder ? "Yes" : "No",
        hidden: v.is_hidden ? "Yes" : "No",
        default: v.is_default ? "Yes" : "No",
        product_coa: pCoa ? "Verified" : "Missing",
        variant_coa: vCoa ? "Verified" : "Missing",
      };
    });

    if (searchQuery)
      table = table.filter((r) => matchesRecordSearch(r, searchQuery));
    table = table.filter(applyRowFilters);

    // Apply strict requested sorting rules (Never sort by date/newest by default)
    const sortBy = viewControls.sortBy || "revenue_desc";
    const sortDir = viewControls.sortDirection || "desc";
    const dirMult = sortDir === "desc" ? 1 : -1;

    table.sort((a, b) => {
      if (sortBy === "revenue_desc") return (b._revenue - a._revenue) * dirMult;
      if (sortBy === "units_desc")
        return (b._unitsSold - a._unitsSold) * dirMult;
      if (sortBy === "price_desc") return (b._price - a._price) * dirMult;
      if (sortBy === "product_asc")
        return (
          a.product.localeCompare(b.product) * (sortDir === "asc" ? 1 : -1)
        );
      if (sortBy === "missing_coa_first")
        return (b._coaMissingScore - a._coaMissingScore) * dirMult;
      if (sortBy === "preorder_first")
        return (b._preorderScore - a._preorderScore) * dirMult;
      if (sortBy === "hidden_first")
        return (b._hiddenScore - a._hiddenScore) * dirMult;
      if (sortBy === "oos_first") return (b._oosScore - a._oosScore) * dirMult;
      return b._revenue - a._revenue; // Ultimate fallback
    });

    const topProductStr = chartTopProducts[0]
      ? `${chartTopProducts[0].name} (${formatCurrency(chartTopProducts[0].rev)})`
      : "N/A";

    return {
      metrics: [
        {
          label: "Product Revenue",
          value: formatCurrency(normalRev + preorderRev),
          icon: <DollarSign />,
        },
        {
          label: "Units Sold",
          value: formatNumber(totalUnits),
          icon: <TrendingUp />,
        },
        {
          label: "Preorder Revenue",
          value: formatCurrency(preorderRev),
          icon: <Clock />,
        },
        {
          label: "Accessory Attach Rate",
          value: formatPercent(accAttachRate),
          icon: <Activity />,
        },
        {
          label: "Visible Variants",
          value: formatNumber(visibleVariants),
          icon: <Package />,
        },
        {
          label: "Hidden Variants",
          value: formatNumber(hiddenVariants),
          icon: <EyeOff />,
          status: hiddenVariants > 0 ? "warning" : "success",
        },
        {
          label: "Out of Stock Variants",
          value: formatNumber(oosVariants),
          icon: <AlertTriangle />,
          alert: oosVariants > 0,
        },
        {
          label: "Products with COA",
          value: formatNumber(productCoaCount),
          icon: <ShieldAlert />,
        },
      ],
      insights: [
        `Top grossing product is ${topProductStr}.`,
        `Preorder variants generated ${formatPercent((preorderRev / Math.max(normalRev + preorderRev, 1)) * 100)} of product revenue.`,
      ],
      quality: [],
      charts: {
        chartTopProducts,
        chartTopVariants,
        chartUnitsSold,
        chartCatRev,
        chartPreorderMix,
        chartPrices,
        chartCoaMix,
      },
      tableCols: [
        { key: "product", label: "Product", primary: true },
        { key: "category", label: "Category" },
        { key: "size_label", label: "Variant Size" },
        {
          key: "price",
          label: "Price",
          render: (r) => formatCurrency(r.price),
        },
        {
          key: "units_sold",
          label: "Units Sold",
          render: (r) => formatNumber(r.units_sold),
        },
        {
          key: "revenue",
          label: "Revenue",
          render: (r) => formatCurrency(r.revenue),
        },
        { key: "variant_stock", label: "Stock Status", type: "badge" },
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
        { key: "product_coa", label: "Product COA", type: "badge" },
        { key: "variant_coa", label: "Variant COA", type: "badge" },
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
    viewControls,
  ]);

  useEffect(() => {
    setExportData({
      rows: viewData.tableData.map((r) => ({
        Product: r.product,
        Slug: r.slug,
        Category: r.category,
        "Variant ID": r.variant_id,
        "Size Label": r.size_label,
        Price: r.price,
        "Units Sold": r.units_sold,
        Revenue: r.revenue,
        "Product Stock": r.product_stock,
        "Variant Stock": r.variant_stock,
        Preorder: r.preorder,
        Hidden: r.hidden,
        Default: r.default,
        "Product COA": r.product_coa,
        "Variant COA": r.variant_coa,
      })),
      cols: [
        "Product",
        "Slug",
        "Category",
        "Variant ID",
        "Size Label",
        "Price",
        "Units Sold",
        "Revenue",
        "Product Stock",
        "Variant Stock",
        "Preorder",
        "Hidden",
        "Default",
        "Product COA",
        "Variant COA",
      ],
    });
  }, [viewData, setExportData]);

  const sortOptions = [
    { value: "revenue_desc", label: "Revenue (High to Low)" },
    { value: "units_desc", label: "Units Sold (High to Low)" },
    { value: "price_desc", label: "Price (High to Low)" },
    { value: "product_asc", label: "Product Name (A-Z)" },
    { value: "missing_coa_first", label: "Missing COA First" },
    { value: "preorder_first", label: "Preorders First" },
    { value: "hidden_first", label: "Hidden First" },
    { value: "oos_first", label: "Out of Stock First" },
  ];

  return (
    <div className="tab-content">
      <SectionHeader
        title="Product & Variant Performance"
        description="Track revenue, catalog mix, and availability indicators."
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
          recommendation="Migrate from boolean in_stock to numeric inventory tracking."
        />
        <MissingMetricCard
          label="Out of Stock Frequency"
          requiredData="Historical inventory availability events."
          recommendation="Implement an inventory_logs table."
        />
        <MissingMetricCard
          label="Inventory Days on Hand"
          requiredData="Current stock quantity & sales velocity."
          recommendation="Add numeric stock tracking."
        />
      </div>

      <InsightPanels insights={viewData.insights} quality={viewData.quality} />

      <SectionHeader
        title="Catalog Analytics"
        description="Visual performance across products, categories, and price ranges."
      />
      <div className="charts-grid">
        <div className="chart-card">
          <h3>Top Products by Revenue</h3>
          <div className="chart-wrapper">
            {viewData.charts.chartTopProducts.length ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={viewData.charts.chartTopProducts}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="shortName"
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
                    formatter={(value, name, props) => [
                      formatCurrency(value),
                      props.payload.name,
                    ]}
                  />
                  <Bar
                    dataKey="rev"
                    fill="#4635de"
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
          <h3>Top Variants by Revenue</h3>
          <div className="chart-wrapper">
            {viewData.charts.chartTopVariants.length ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={viewData.charts.chartTopVariants}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="shortName"
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
                    formatter={(value, name, props) => [
                      formatCurrency(value),
                      props.payload.name,
                    ]}
                  />
                  <Bar
                    dataKey="rev"
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
          <h3>Units Sold by Product</h3>
          <div className="chart-wrapper">
            {viewData.charts.chartUnitsSold.length ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={viewData.charts.chartUnitsSold}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="shortName"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    content={<CustomTooltip />}
                    formatter={(value, name, props) => [
                      formatNumber(value),
                      props.payload.name,
                    ]}
                  />
                  <Bar
                    dataKey="qty"
                    fill="#f59e0b"
                    radius={[4, 4, 0, 0]}
                    name="Units"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ChartEmptyState />
            )}
          </div>
        </div>

        <div className="chart-card">
          <h3>Revenue by Category</h3>
          <div className="chart-wrapper">
            {viewData.charts.chartCatRev.length ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={viewData.charts.chartCatRev}
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
                    dataKey="category"
                    type="category"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    width={100}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="rev"
                    fill="#e11d48"
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
          <h3>Revenue Source (In-Stock vs Preorder)</h3>
          <div className="chart-wrapper">
            {viewData.charts.chartPreorderMix.some((d) => d.value > 0) ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={viewData.charts.chartPreorderMix}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    nameKey="name"
                  >
                    {viewData.charts.chartPreorderMix.map((_, index) => (
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
          <h3>Variant Price Distribution</h3>
          <div className="chart-wrapper">
            {viewData.charts.chartPrices.some((d) => d.count > 0) ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={viewData.charts.chartPrices}>
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
                    fill="#8b5cf6"
                    radius={[4, 4, 0, 0]}
                    name="Variant Count"
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
        title="Catalog Ledger"
        description="Comprehensive performance list of all products and variants."
      />
      <DataTable
        data={viewData.tableData}
        columns={viewData.tableCols}
        resetKey="products"
        viewMode={viewControls.viewMode}
        topN={viewControls.topN}
      />
    </div>
  );
}
