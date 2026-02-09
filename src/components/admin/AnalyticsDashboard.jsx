import { useState, useEffect, useMemo } from "react";
import { supabase } from "../../lib/supabase";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Download,
  Search,
  X,
  ChevronRight,
  RefreshCw,
  Box,
  CreditCard,
  Calendar,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  ComposedChart,
  Line,
} from "recharts";
import {
  format,
  subDays,
  startOfMonth,
  endOfMonth,
  endOfDay,
  startOfDay,
  eachDayOfInterval,
  parseISO,
  isValid,
  differenceInDays,
  eachMonthOfInterval,
} from "date-fns";

// --- THEME CONFIGURATION ---
const THEME = {
  primary: "#0f172a", // Brand Navy
  secondary: "#3b82f6", // Bright Blue
  accent: "#06b6d4", // Cyan
  subtext: "#64748b", // Muted Slate
  grid: "#e2e8f0", // Light Gray Grid
  bg: "#f8fafc", // Off-white background

  // Metric Colors
  money: "#059669", // Emerald Green (Money)
  orders: "#2563eb", // Royal Blue (Orders)
  growth: "#7c3aed", // Violet (Growth)
};

// "Deep Ocean" Spectrum
const CHART_COLORS = [
  "#0f172a", // Navy
  "#3b82f6", // Blue
  "#06b6d4", // Cyan
  "#10b981", // Emerald
  "#8b5cf6", // Violet
  "#f59e0b", // Amber
  "#f43f5e", // Rose
];

export default function AnalyticsDashboard() {
  // --- STATE ---
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Filters
  const [dateRange, setDateRange] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState(
    format(new Date(), "yyyy-MM"),
  );
  const [availableMonths, setAvailableMonths] = useState([]);

  // Data
  const [rawData, setRawData] = useState({ orders: [], items: [] });

  // Modal State
  const [activeReport, setActiveReport] = useState(null);
  const [reportSearch, setReportSearch] = useState("");

  // --- INITIAL LOAD: Get Date Range ---
  useEffect(() => {
    const fetchDateRange = async () => {
      // Find the very first order to populate the Month Dropdown
      const { data } = await supabase
        .from("orders")
        .select("created_at")
        .order("created_at", { ascending: true })
        .limit(1)
        .single();

      if (data) {
        const start = new Date(data.created_at);
        const end = new Date();
        // Generate list of months from first order to now
        const months = eachMonthOfInterval({ start, end }).reverse(); // Newest first
        setAvailableMonths(months);
      } else {
        // Fallback if no orders
        setAvailableMonths([new Date()]);
      }
    };
    fetchDateRange();
  }, []);

  // --- DATA FETCHING ---
  useEffect(() => {
    fetchData();
  }, [dateRange, selectedMonth, refreshKey]);

  const fetchData = async () => {
    setLoading(true);

    try {
      let start, end;
      const now = new Date();

      switch (dateRange) {
        case "today":
          start = startOfDay(now);
          end = endOfDay(now);
          break;
        case "yesterday":
          start = startOfDay(subDays(now, 1));
          end = endOfDay(subDays(now, 1));
          break;
        case "7d":
          start = startOfDay(subDays(now, 7));
          end = endOfDay(now);
          break;
        case "30d":
          start = startOfDay(subDays(now, 30));
          end = endOfDay(now);
          break;
        case "month":
          const [year, month] = selectedMonth.split("-");
          const monthDate = new Date(parseInt(year), parseInt(month) - 1, 1);
          start = startOfMonth(monthDate);
          end = endOfDay(endOfMonth(monthDate));
          break;
        case "all":
        default:
          start = new Date("2025-01-01");
          end = endOfDay(now);
          break;
      }

      if (!isValid(start) || !isValid(end)) {
        setLoading(false);
        return;
      }

      const isoStart = start.toISOString();
      const isoEnd = end.toISOString();

      // Fetch Orders
      // FIX: Removed .neq("status", "pending") so we catch paid orders that haven't updated yet
      const { data: orders, error: orderError } = await supabase
        .from("orders")
        .select(
          `
          id, created_at, total_amount, status, customer_email, customer_name,
          shipping_address, shipping_cost, shipping_method, 
          discount_code, notes
        `,
        )
        .neq("status", "cancelled") // Only exclude explicitly cancelled
        .gte("created_at", isoStart)
        .lte("created_at", isoEnd)
        .order("created_at", { ascending: true });

      if (orderError) throw orderError;

      // Fetch Items
      let items = [];
      if (orders && orders.length > 0) {
        const orderIds = orders.map((o) => o.id);
        const { data: fetchedItems, error: itemError } = await supabase
          .from("order_items")
          .select(
            "quantity, product_name_snapshot, price_at_purchase, order_id",
          )
          .in("order_id", orderIds);

        if (itemError) throw itemError;
        items = fetchedItems;
      }

      setRawData({ orders: orders || [], items: items || [] });
    } catch (error) {
      console.error("Analytics Load Failed:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- ANALYTICS PROCESSING ENGINE ---
  const stats = useMemo(() => {
    let { orders, items } = rawData;

    // SMART FILTER: Only keep orders that are NOT "Ghost Carts"
    // We keep 'pending' ONLY if they have a customer email (meaning they tried to pay)
    orders = orders.filter((o) => {
      if (o.status === "pending" && !o.customer_email) return false;
      return true;
    });

    // Filter items to match the cleaned order list
    const validOrderIds = new Set(orders.map((o) => o.id));
    items = items.filter((i) => validOrderIds.has(i.order_id));

    if (!orders.length) return null;

    // 1. HEADLINE METRICS
    const totalRevenue = orders.reduce(
      (sum, o) => sum + (o.total_amount || 0),
      0,
    );
    const totalShippingCost = orders.reduce(
      (sum, o) => sum + (o.shipping_cost || 0),
      0,
    );
    const netRevenue = totalRevenue - totalShippingCost;
    const totalOrders = orders.length;
    const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // 2. SALES TREND
    let chartDays = [];
    const start = new Date(orders[0].created_at);
    const end = new Date(orders[orders.length - 1].created_at);
    if (isValid(start) && isValid(end) && differenceInDays(end, start) < 365) {
      chartDays = eachDayOfInterval({ start, end });
    }

    const salesMap = {};
    const volumeMap = {};

    orders.forEach((o) => {
      const dateKey = format(parseISO(o.created_at), "yyyy-MM-dd");
      salesMap[dateKey] = (salesMap[dateKey] || 0) + (o.total_amount || 0);
      volumeMap[dateKey] = (volumeMap[dateKey] || 0) + 1;
    });

    const trendData = (
      chartDays.length > 0
        ? chartDays.map((d) => format(d, "yyyy-MM-dd"))
        : Object.keys(salesMap).sort()
    ).map((dateKey) => ({
      date: format(parseISO(dateKey), "MMM dd"),
      revenue: salesMap[dateKey] || 0,
      orders: volumeMap[dateKey] || 0,
    }));

    // 3. PRODUCTS (SMART CLEANING & AGGREGATION)
    const productMap = {};
    items.forEach((i) => {
      let rawName = i.product_name_snapshot || "Unknown Product";

      // Clean name: Remove "(10% Off)", "(15% Off)", etc.
      let cleanName = rawName
        .replace(/\s*\(\s*\d+%\s*Off\s*\)/gi, "")
        .replace(/\s+/g, " ")
        .trim();

      const key = cleanName.toLowerCase();

      if (!productMap[key]) {
        productMap[key] = {
          name: cleanName,
          quantity: 0,
          revenue: 0,
        };
      }

      productMap[key].quantity += i.quantity || 0;
      productMap[key].revenue += (i.price_at_purchase || 0) * (i.quantity || 0);
    });
    const productsArray = Object.values(productMap).sort(
      (a, b) => b.quantity - a.quantity,
    );

    // 4. REGIONS
    const stateMap = {};
    orders.forEach((o) => {
      let state = "Unknown";
      if (o.shipping_address) {
        const rawState = o.shipping_address.state || "N/A";
        state = rawState.trim().toUpperCase();
        if (state.includes("VICTORIA") || state === "VIC") state = "VIC";
        else if (state.includes("WALES") || state === "NSW") state = "NSW";
        else if (state.includes("QUEEN") || state === "QLD") state = "QLD";
        else if (state.includes("WEST") || state === "WA") state = "WA";
        else if (state.includes("SOUTH") || state === "SA") state = "SA";
        else if (state.includes("TAS") || state === "TAS") state = "TAS";
        else if (state.includes("ACT")) state = "ACT";
        else if (state.includes("NORTH") || state === "NT") state = "NT";
      }
      stateMap[state] = (stateMap[state] || 0) + 1;
    });
    const geoData = Object.entries(stateMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // 5. DISCOUNT CODES
    const discountMap = {};
    let totalDiscountOrders = 0;
    orders.forEach((o) => {
      if (o.discount_code) {
        const code = o.discount_code.toUpperCase();
        discountMap[code] = (discountMap[code] || 0) + 1;
        totalDiscountOrders++;
      }
    });
    const discountData = Object.entries(discountMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // 6. SHIPPING METHODS
    const shippingMap = {};
    orders.forEach((o) => {
      const method = o.shipping_method || "Standard";
      shippingMap[method] = (shippingMap[method] || 0) + 1;
    });
    const shippingData = Object.entries(shippingMap).map(([name, value]) => ({
      name,
      value,
    }));

    // 7. TIME OF DAY
    const hourMap = new Array(24).fill(0);
    orders.forEach((o) => hourMap[parseISO(o.created_at).getHours()]++);
    const timeData = hourMap.map((count, hour) => ({
      hour: format(new Date().setHours(hour), "ha"),
      orders: count,
    }));

    // 8. DEEP DIVE METRICS
    const deepMetrics = [
      { label: "Net Product Sales", value: `$${netRevenue.toLocaleString()}` },
      {
        label: "Shipping Collected",
        value: `$${totalShippingCost.toLocaleString()}`,
      },
      { label: "Orders with Discount", value: totalDiscountOrders },
      {
        label: "Discount Usage Rate",
        value: `${((totalDiscountOrders / totalOrders) * 100).toFixed(1)}%`,
      },
      {
        label: "Total Items Sold",
        value: items.reduce((acc, i) => acc + i.quantity, 0),
      },
      {
        label: "Avg Items / Order",
        value: (
          items.reduce((acc, i) => acc + i.quantity, 0) / totalOrders
        ).toFixed(1),
      },
    ];

    return {
      totalRevenue,
      netRevenue,
      totalOrders,
      aov,
      trendData,
      productsArray,
      geoData,
      timeData,
      discountData,
      shippingData,
      deepMetrics,
    };
  }, [rawData]);

  // --- MODAL HANDLER ---
  const getModalContent = () => {
    if (!stats || !activeReport) return null;

    let title = "";
    let data = [];
    let headers = [];
    let renderRow = () => {};

    switch (activeReport) {
      case "products":
        title = "Product Performance";
        data = stats.productsArray;
        headers = ["Product", "Sold", "Revenue", "Avg Price"];
        renderRow = (item) => (
          <>
            <td style={styles.td}>
              <strong>{item.name}</strong>
            </td>
            <td style={styles.td}>{item.quantity}</td>
            <td style={styles.td}>${item.revenue.toLocaleString()}</td>
            <td style={styles.td}>
              ${(item.revenue / (item.quantity || 1)).toFixed(2)}
            </td>
          </>
        );
        break;
      case "regions":
        title = "Regional Sales";
        data = stats.geoData;
        headers = ["Region / State", "Orders", "% Share"];
        renderRow = (item) => (
          <>
            <td style={styles.td}>
              <strong>{item.name}</strong>
            </td>
            <td style={styles.td}>{item.value}</td>
            <td style={styles.td}>
              {((item.value / stats.totalOrders) * 100).toFixed(1)}%
            </td>
          </>
        );
        break;
      case "discounts":
        title = "Discount Usage";
        data = stats.discountData;
        headers = ["Code", "Uses", "Share"];
        renderRow = (item) => (
          <>
            <td style={styles.td}>
              <span style={styles.badge}>{item.name}</span>
            </td>
            <td style={styles.td}>{item.value}</td>
            <td style={styles.td}>
              {((item.value / stats.totalOrders) * 100).toFixed(1)}%
            </td>
          </>
        );
        break;
      case "shipping":
        title = "Shipping Methods";
        data = stats.shippingData;
        headers = ["Method", "Orders", "Share"];
        renderRow = (item) => (
          <>
            <td style={styles.td}>
              <strong>{item.name}</strong>
            </td>
            <td style={styles.td}>{item.value}</td>
            <td style={styles.td}>
              {((item.value / stats.totalOrders) * 100).toFixed(1)}%
            </td>
          </>
        );
        break;
      default:
        return null;
    }

    const filteredData = data.filter((item) =>
      item.name.toLowerCase().includes(reportSearch.toLowerCase()),
    );

    const handleExport = () => {
      const csvContent =
        "data:text/csv;charset=utf-8," +
        headers.join(",") +
        "\n" +
        filteredData
          .map((row) => {
            if (activeReport === "products")
              return `"${row.name}",${row.quantity},${row.revenue.toFixed(2)}`;
            return `"${row.name}",${row.value}`;
          })
          .join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute(
        "download",
        `${activeReport}_report_${format(new Date(), "yyyy-MM-dd")}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    return { title, data: filteredData, headers, renderRow, handleExport };
  };

  const modalData = getModalContent();

  // --- RENDER ---
  return (
    <div style={styles.container}>
      {/* HEADER & CONTROLS */}
      <div style={styles.header}>
        <div style={styles.titleGroup}>
          <h2 style={styles.title}>
            <BarChart3 size={28} style={{ color: THEME.primary }} />
            Sales performance and analytics.
          </h2>
        </div>

        <div style={styles.controls}>
          <div style={styles.toggleGroup}>
            {[
              { id: "today", label: "Today" },
              { id: "yesterday", label: "Yesterday" },
              { id: "7d", label: "7 Days" },
              { id: "30d", label: "30 Days" },
              { id: "month", label: "Month" },
              { id: "all", label: "All Time" },
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setDateRange(filter.id)}
                style={{
                  ...styles.toggleBtn,
                  ...(dateRange === filter.id ? styles.activeToggle : {}),
                }}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* SMART MONTH SELECTOR */}
          {dateRange === "month" && (
            <div style={styles.dateInputs}>
              <Calendar size={16} color={THEME.subtext} />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={styles.dateSelect}
              >
                {availableMonths.map((date) => (
                  <option
                    key={format(date, "yyyy-MM")}
                    value={format(date, "yyyy-MM")}
                  >
                    {format(date, "MMMM yyyy")}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            style={styles.iconBtn}
            title="Refresh Data"
          >
            <RefreshCw size={18} className={loading ? "spin-anim" : ""} />
          </button>
        </div>
      </div>

      {loading && !stats ? (
        <div style={styles.loadingState}>
          <RefreshCw
            size={40}
            className="spin-anim"
            style={{ color: THEME.secondary }}
          />
          <p>Analyzing sales data...</p>
        </div>
      ) : !stats ? (
        <div style={styles.emptyState}>
          <Box size={40} style={{ color: "#cbd5e1" }} />
          <p>No sales data found for this period.</p>
        </div>
      ) : (
        <>
          {/* KPI CARDS */}
          <div style={styles.kpiGrid}>
            <MetricCard
              label="Total Revenue"
              value={`$${stats.totalRevenue.toLocaleString()}`}
              icon={DollarSign}
              color={THEME.money}
            />
            <MetricCard
              label="Total Orders"
              value={stats.totalOrders}
              icon={ShoppingCart}
              color={THEME.orders}
            />
            <MetricCard
              label="Avg Order Value"
              value={`$${stats.aov.toFixed(2)}`}
              icon={TrendingUp}
              color={THEME.growth}
            />
            <MetricCard
              label="Net Sales (Ex Ship)"
              value={`$${stats.netRevenue.toLocaleString()}`}
              icon={CreditCard}
              color={THEME.primary}
            />
          </div>

          {/* ROW 1: Sales & Geo */}
          <div style={styles.gridRow}>
            <div style={{ ...styles.card, flex: 2 }}>
              <div style={styles.cardHeader}>
                <h3>Sales Trend</h3>
                <div style={styles.legend}>
                  <span style={{ color: THEME.primary }}>● Revenue</span>
                  <span style={{ color: THEME.subtext }}>● Orders</span>
                </div>
              </div>
              <div style={{ width: "100%", height: 350 }}>
                <ResponsiveContainer>
                  <ComposedChart data={stats.trendData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke={THEME.grid}
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: THEME.subtext, fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      yAxisId="left"
                      tick={{ fill: THEME.subtext, fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(val) => `$${val}`}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fill: THEME.subtext, fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={styles.tooltip}
                      formatter={(val, name) => [
                        name === "revenue" ? `$${val}` : val,
                        name === "revenue" ? "Revenue" : "Orders",
                      ]}
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="orders"
                      fill={THEME.subtext}
                      barSize={20}
                      radius={[4, 4, 0, 0]}
                      fillOpacity={0.2}
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="revenue"
                      stroke={THEME.primary}
                      strokeWidth={3}
                      dot={{ r: 4, fill: THEME.primary }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <ChartCard
              title="Sales by Region"
              onExpand={() => setActiveReport("regions")}
            >
              <ResponsiveContainer>
                <BarChart
                  data={stats.geoData}
                  layout="vertical"
                  margin={{ left: 10 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={true}
                    vertical={false}
                    stroke={THEME.grid}
                  />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={40}
                    tick={{
                      fill: THEME.subtext,
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "transparent" }}
                    contentStyle={styles.tooltip}
                  />
                  <Bar
                    dataKey="value"
                    fill={THEME.primary}
                    radius={[0, 4, 4, 0]}
                    barSize={20}
                  >
                    {stats.geoData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* ROW 2: Products & Time */}
          <div style={styles.gridRow}>
            <ChartCard
              title="Top Products"
              onExpand={() => setActiveReport("products")}
            >
              <ResponsiveContainer>
                <BarChart
                  data={stats.productsArray.slice(0, 5)}
                  layout="vertical"
                  margin={{ left: 0, right: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={100}
                    tick={{ fontSize: 11, fill: THEME.subtext }}
                  />
                  <Tooltip
                    cursor={{ fill: "transparent" }}
                    contentStyle={styles.tooltip}
                  />
                  <Bar
                    dataKey="quantity"
                    fill={THEME.secondary}
                    radius={[0, 4, 4, 0]}
                    barSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Peak Buying Hours" onExpand={null}>
              <ResponsiveContainer>
                <AreaChart data={stats.timeData}>
                  <defs>
                    <linearGradient id="colorTime" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor={THEME.accent}
                        stopOpacity={0.8}
                      />
                      <stop
                        offset="95%"
                        stopColor={THEME.accent}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke={THEME.grid}
                  />
                  <XAxis
                    dataKey="hour"
                    tick={{ fontSize: 10, fill: THEME.subtext }}
                    axisLine={false}
                    tickLine={false}
                    interval={3}
                  />
                  <Tooltip contentStyle={styles.tooltip} />
                  <Area
                    type="monotone"
                    dataKey="orders"
                    stroke={THEME.accent}
                    fillOpacity={1}
                    fill="url(#colorTime)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* ROW 3: Discounts & Shipping */}
          <div style={styles.gridRow}>
            <ChartCard
              title="Discount Code Usage"
              onExpand={() => setActiveReport("discounts")}
            >
              <ResponsiveContainer>
                <BarChart data={stats.discountData.slice(0, 5)}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke={THEME.grid}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: THEME.subtext }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "transparent" }}
                    contentStyle={styles.tooltip}
                  />
                  <Bar
                    dataKey="value"
                    fill={CHART_COLORS[3]}
                    radius={[4, 4, 0, 0]}
                    barSize={30}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              title="Shipping Methods"
              onExpand={() => setActiveReport("shipping")}
            >
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={stats.shippingData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.shippingData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={styles.tooltip} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* BOTTOM: Deep Dive Metrics */}
          <div style={styles.deepDiveSection}>
            <h3 style={styles.sectionTitle}>Detailed Breakdown</h3>
            <div style={styles.deepGrid}>
              {stats.deepMetrics.map((m, i) => (
                <div key={i} style={styles.deepCard}>
                  <span style={styles.deepLabel}>{m.label}</span>
                  <span style={styles.deepValue}>{m.value}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* --- UNIVERSAL REPORT MODAL --- */}
      {activeReport && modalData && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3>{modalData.title}</h3>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={modalData.handleExport}
                  style={styles.primaryBtn}
                >
                  <Download size={16} /> Export CSV
                </button>
                <button
                  onClick={() => setActiveReport(null)}
                  style={styles.iconBtn}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div style={styles.searchBar}>
              <Search size={18} color={THEME.subtext} />
              <input
                placeholder="Search report..."
                value={reportSearch}
                onChange={(e) => setReportSearch(e.target.value)}
                style={styles.searchInput}
                autoFocus
              />
            </div>

            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    {modalData.headers.map((h) => (
                      <th key={h} style={styles.th}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {modalData.data.map((item, i) => (
                    <tr key={i}>{modalData.renderRow(item)}</tr>
                  ))}
                  {modalData.data.length === 0 && (
                    <tr>
                      <td
                        colSpan={modalData.headers.length}
                        style={{
                          padding: 20,
                          textAlign: "center",
                          color: THEME.subtext,
                        }}
                      >
                        No results found for "{reportSearch}"
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- SUB-COMPONENTS ---

function MetricCard({ label, value, icon: Icon, color }) {
  return (
    <div style={styles.metricCard}>
      <div
        style={{ ...styles.iconCircle, background: `${color}15`, color: color }}
      >
        <Icon size={22} />
      </div>
      <div style={{ flex: 1 }}>
        <p style={styles.metricLabel}>{label}</p>
        <h4 style={styles.metricValue}>{value}</h4>
      </div>
    </div>
  );
}

function ChartCard({ title, children, onExpand }) {
  return (
    <div style={{ ...styles.card, flex: 1 }}>
      <div style={styles.cardHeader}>
        <h3>{title}</h3>
        {onExpand && (
          <button style={styles.linkBtn} onClick={onExpand}>
            View Report <ChevronRight size={16} />
          </button>
        )}
      </div>
      <div style={{ width: "100%", height: 250 }}>{children}</div>
    </div>
  );
}

// --- STYLES ---
const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
    paddingBottom: "60px",
    maxWidth: "1600px",
    margin: "0 auto",
    width: "100%",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    flexWrap: "wrap",
    gap: "20px",
    marginBottom: "10px",
  },
  title: {
    margin: 0,
    fontSize: "1.75rem",
    fontWeight: "700",
    color: THEME.primary,
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  subtitle: {
    margin: "4px 0 0 0",
    color: THEME.subtext,
    fontSize: "0.95rem",
  },
  controls: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
    maxWidth: "100%",
  },
  toggleGroup: {
    display: "flex",
    background: "white",
    padding: "4px",
    borderRadius: "8px",
    border: `1px solid ${THEME.grid}`,
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
    overflowX: "auto", // SCROLLABLE ON MOBILE
    maxWidth: "100%",
    flexWrap: "nowrap", // FORCE SINGLE LINE
    whiteSpace: "nowrap",
    paddingRight: "20px", // Ensures last item is clickable on mobile
  },
  toggleBtn: {
    background: "transparent",
    border: "none",
    padding: "8px 16px",
    borderRadius: "6px",
    fontSize: "0.85rem",
    fontWeight: "600",
    color: THEME.subtext,
    cursor: "pointer",
    transition: "all 0.2s",
    whiteSpace: "nowrap",
  },
  activeToggle: {
    background: THEME.primary,
    color: "white",
    boxShadow: "0 2px 4px rgba(15, 23, 42, 0.2)",
  },
  dateInputs: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "white",
    padding: "4px 10px",
    borderRadius: "8px",
    border: `1px solid ${THEME.grid}`,
  },
  dateSelect: {
    border: "none",
    fontSize: "0.9rem",
    color: THEME.primary,
    fontWeight: "600",
    outline: "none",
    cursor: "pointer",
    background: "transparent",
    paddingRight: "8px",
  },
  iconBtn: {
    background: "white",
    border: `1px solid ${THEME.grid}`,
    borderRadius: "8px",
    width: "40px",
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: THEME.subtext,
    transition: "all 0.2s",
  },
  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "20px",
  },
  metricCard: {
    background: "white",
    padding: "24px",
    borderRadius: "12px",
    border: `1px solid ${THEME.grid}`,
    display: "flex",
    alignItems: "center",
    gap: "16px",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)",
  },
  iconCircle: {
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  metricLabel: {
    margin: "0 0 4px 0",
    fontSize: "0.85rem",
    color: THEME.subtext,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  metricValue: {
    margin: 0,
    fontSize: "1.6rem",
    fontWeight: "800",
    color: THEME.primary,
  },
  gridRow: {
    display: "flex",
    gap: "20px",
    flexWrap: "wrap",
  },
  card: {
    background: "white",
    borderRadius: "12px",
    border: `1px solid ${THEME.grid}`,
    padding: "24px",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)",
    minWidth: "350px",
    display: "flex",
    flexDirection: "column",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
  },
  legend: {
    display: "flex",
    gap: "12px",
    fontSize: "0.85rem",
    fontWeight: "600",
  },
  tooltip: {
    borderRadius: "8px",
    border: "none",
    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
    padding: "12px",
    fontSize: "0.85rem",
    fontWeight: "500",
    color: THEME.primary,
  },
  linkBtn: {
    background: "none",
    border: "none",
    color: THEME.secondary,
    fontSize: "0.85rem",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  deepDiveSection: {
    marginTop: "20px",
    borderTop: `1px solid ${THEME.grid}`,
    paddingTop: "24px",
  },
  sectionTitle: {
    fontSize: "1.2rem",
    color: THEME.primary,
    marginBottom: "20px",
    fontWeight: "700",
  },
  deepGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "16px",
  },
  deepCard: {
    background: "white",
    padding: "16px",
    borderRadius: "8px",
    border: `1px solid ${THEME.grid}`,
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  deepLabel: {
    fontSize: "0.8rem",
    color: THEME.subtext,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  deepValue: {
    fontSize: "1.1rem",
    color: THEME.primary,
    fontWeight: "700",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.6)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "20px",
  },
  modalContent: {
    background: "white",
    width: "100%",
    maxWidth: "900px",
    maxHeight: "85vh",
    borderRadius: "16px",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  modalHeader: {
    padding: "20px 24px",
    borderBottom: `1px solid ${THEME.grid}`,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  primaryBtn: {
    background: THEME.primary,
    color: "white",
    border: "none",
    padding: "8px 16px",
    borderRadius: "6px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  searchBar: {
    padding: "16px 24px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    borderBottom: `1px solid ${THEME.grid}`,
    background: "#f8fafc",
  },
  searchInput: {
    border: "none",
    background: "transparent",
    outline: "none",
    fontSize: "0.95rem",
    width: "100%",
    color: THEME.text,
  },
  tableWrapper: {
    overflowY: "auto",
    padding: "0 24px 24px 24px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    padding: "16px 8px",
    fontSize: "0.85rem",
    color: THEME.subtext,
    borderBottom: `2px solid ${THEME.grid}`,
    position: "sticky",
    top: 0,
    background: "white",
  },
  td: {
    padding: "12px 8px",
    borderBottom: `1px solid ${THEME.grid}`,
    fontSize: "0.9rem",
    color: THEME.text,
  },
  badge: {
    background: "#f1f5f9",
    color: THEME.secondary,
    padding: "2px 8px",
    borderRadius: "12px",
    fontSize: "0.8rem",
    fontWeight: "600",
    border: `1px solid ${THEME.grid}`,
  },
  loadingState: {
    padding: "100px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
    color: THEME.subtext,
  },
  emptyState: {
    padding: "100px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
    color: "#cbd5e1",
    fontSize: "1.1rem",
    fontWeight: "500",
  },
};
