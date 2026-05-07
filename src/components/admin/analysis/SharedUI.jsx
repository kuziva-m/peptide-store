import React from "react";
import { formatCurrency, formatNumber } from "./utils";
import {
  Activity,
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  Database,
  Info,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart2,
  Inbox,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

// ==========================================
// 1. METRICS & KPI CARDS
// ==========================================

export const MetricCard = ({
  label,
  value,
  icon,
  subtext,
  alert,
  delta,
  deltaDirection = "neutral",
  status = "available",
  helpText,
}) => {
  const getDeltaIcon = () => {
    if (deltaDirection === "up") return <TrendingUp size={14} />;
    if (deltaDirection === "down") return <TrendingDown size={14} />;
    return <Minus size={14} />;
  };

  return (
    <div className={`metric-card ${alert ? "alert" : ""} status-${status}`}>
      <div className="metric-header">
        <span className="metric-label" title={helpText}>
          {label}
        </span>
        <div className="metric-icon">{icon}</div>
      </div>
      <div className="metric-value">{value}</div>

      <div className="metric-footer">
        {delta !== undefined && (
          <span className={`metric-delta delta-${deltaDirection}`}>
            {getDeltaIcon()} {delta}
          </span>
        )}
        {subtext && <span className="metric-subtext">{subtext}</span>}
      </div>
    </div>
  );
};

export const MissingMetricCard = ({ label, requiredData, recommendation }) => (
  <div className="metric-card missing-metric">
    <div className="metric-header">
      <span className="metric-label">{label}</span>
      <div className="metric-icon">
        <Database size={18} color="#94a3b8" />
      </div>
    </div>
    <div className="metric-value not-tracked">Not Tracked</div>
    <div className="missing-details">
      <p>
        <strong>Requires:</strong> {requiredData}
      </p>
      <p>
        <strong>Fix:</strong> {recommendation}
      </p>
    </div>
  </div>
);

export const StatusBadge = ({ text, tone = "neutral" }) => (
  <span className={`status-badge ${tone}`}>{text || "N/A"}</span>
);

// ==========================================
// 2. ANALYST CONTROLS & LAYOUT
// ==========================================

export const SectionHeader = ({ title, description, children }) => (
  <div className="section-header">
    <div className="section-title-area">
      <h3 className="section-title">{title}</h3>
      {description && <p className="section-desc">{description}</p>}
    </div>
    {children && <div className="section-controls">{children}</div>}
  </div>
);

export const AnalystToolbar = ({
  viewControls = {},
  handleViewControlChange,
  sortOptions = [],
  metricOptions = [
    { value: "revenue", label: "Revenue" },
    { value: "orders", label: "Orders" },
    { value: "units", label: "Units Sold" },
    { value: "aov", label: "Average Order Value" },
  ],
}) => {
  if (!handleViewControlChange) return null;

  return (
    <div className="analyst-toolbar">
      <div className="toolbar-group">
        <label>Metric:</label>
        <select
          value={viewControls.selectedMetric || "revenue"}
          onChange={(e) =>
            handleViewControlChange("selectedMetric", e.target.value)
          }
        >
          {metricOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="toolbar-group">
        <label>Granularity:</label>
        <select
          value={viewControls.chartGranularity || "day"}
          onChange={(e) =>
            handleViewControlChange("chartGranularity", e.target.value)
          }
        >
          <option value="day">Daily</option>
          <option value="week">Weekly</option>
          <option value="month">Monthly</option>
        </select>
      </div>

      <div className="toolbar-group">
        <label>Sort:</label>
        <select
          value={viewControls.sortBy || "default"}
          onChange={(e) => handleViewControlChange("sortBy", e.target.value)}
        >
          <option value="default">Default</option>
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <button
          className="sort-dir-btn"
          onClick={() =>
            handleViewControlChange(
              "sortDirection",
              viewControls.sortDirection === "asc" ? "desc" : "asc",
            )
          }
          title="Toggle Sort Direction"
        >
          {viewControls.sortDirection === "asc" ? "↑" : "↓"}
        </button>
      </div>

      <div className="toolbar-group">
        <label>Limit:</label>
        <select
          value={viewControls.topN || "all"}
          onChange={(e) => handleViewControlChange("topN", e.target.value)}
        >
          <option value="5">Top 5</option>
          <option value="10">Top 10</option>
          <option value="25">Top 25</option>
          <option value="50">Top 50</option>
          <option value="all">All</option>
        </select>
      </div>
    </div>
  );
};

export const QuickFilterButton = ({ active, onClick, label, icon, count }) => (
  <button
    className={`quick-filter-btn ${active ? "active" : ""}`}
    onClick={onClick}
  >
    {icon}
    <span className="qf-label">{label}</span>
    {count !== undefined && <span className="qf-count">{count}</span>}
  </button>
);

// ==========================================
// 3. INSIGHTS & DATA QUALITY
// ==========================================

export const InsightPanels = ({ insights = [], quality = [] }) => {
  if (!insights?.length && !quality?.length) return null;
  return (
    <div className="insight-panels">
      {insights.length > 0 && (
        <div className="panel info-panel">
          <h3>
            <Activity size={18} /> Business Insights
          </h3>
          <ul>
            {insights.map((ins, i) => (
              <li key={i}>{ins}</li>
            ))}
          </ul>
        </div>
      )}
      {quality.length > 0 && (
        <div className="panel quality-panel">
          <h3>
            <ShieldAlert size={18} /> Data Quality Flags
          </h3>
          <ul>
            {quality.map((q, i) => (
              <li
                key={i}
                className={q.critical && q.value > 0 ? "critical" : ""}
              >
                <span>{q.label}</span>
                <strong>{q.value}</strong>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export const DataAvailabilityPanel = ({
  dataAvailability = {},
  schemaRecommendations = [],
}) => {
  const missing = Object.entries(dataAvailability).filter(([_, v]) =>
    String(v).includes("missing"),
  );
  const partial = Object.entries(dataAvailability).filter(([_, v]) =>
    String(v).includes("partial"),
  );

  if (!missing.length && !partial.length) return null;

  return (
    <div className="data-availability-panel">
      <div className="da-header">
        <Database size={18} />
        <h3>Data Tracking Gaps Detected</h3>
      </div>
      <p className="da-desc">
        Some enterprise metrics cannot be calculated with the current database
        schema.
      </p>

      <div className="da-grid">
        {partial.length > 0 && (
          <div className="da-column warning">
            <h4>
              <AlertCircle size={14} /> Partially Tracked
            </h4>
            <ul>
              {partial.map(([key, reason]) => (
                <li key={key}>
                  <strong>{key}:</strong> {reason}
                </li>
              ))}
            </ul>
          </div>
        )}

        {missing.length > 0 && (
          <div className="da-column danger">
            <h4>
              <AlertTriangle size={14} /> Not Tracked
            </h4>
            <ul>
              {missing.map(([key, reason]) => (
                <li key={key}>
                  <strong>{key}:</strong> {reason}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {schemaRecommendations.length > 0 && (
        <div className="da-recommendations">
          <h4>Recommended Schema Expansions:</h4>
          <div className="schema-tags">
            {schemaRecommendations.map((table) => (
              <span key={table} className="schema-tag">
                {table}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 4. CHARTS, TABLES & STATES
// ==========================================

export const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="tooltip-label">{label}</p>
        {payload.map((entry, index) => {
          const isCurrency =
            entry.name.toLowerCase().includes("revenue") ||
            entry.name.toLowerCase().includes("sales");
          const isPercentage = entry.name.toLowerCase().includes("rate");
          let displayValue = entry.value;

          if (isCurrency) displayValue = formatCurrency(entry.value);
          else if (isPercentage)
            displayValue = `${Number(entry.value).toFixed(2)}%`;
          else displayValue = formatNumber(entry.value);

          return (
            <p
              key={index}
              style={{
                color: entry.color,
                margin: 0,
                fontSize: "0.9rem",
                fontWeight: 600,
              }}
            >
              {entry.name}: {displayValue}
            </p>
          );
        })}
      </div>
    );
  }
  return null;
};

export const EmptyState = ({
  title = "No Data Found",
  description = "Try adjusting your filters or date range.",
  icon,
}) => (
  <div className="empty-state">
    <div className="empty-icon">{icon || <Inbox size={32} />}</div>
    <h3>{title}</h3>
    <p>{description}</p>
  </div>
);

export const EmptyChart = ({
  message = "No chart data available for this range.",
}) => (
  <div className="empty-chart">
    <BarChart2 size={32} color="#cbd5e1" style={{ marginBottom: "12px" }} />
    <span>{message}</span>
  </div>
);

export const ChartEmptyState = EmptyChart; // Alias

export const MobileSummaryCard = ({ row, columns }) => {
  if (!row || !columns) return null;
  return (
    <div className="mobile-summary-card">
      {columns.map((col) => (
        <div className="msc-row" key={col.key || col}>
          <span className="msc-label">
            {(col.label || col).replace(/_/g, " ")}
          </span>
          <span className="msc-value">
            {col.render ? col.render(row) : row[col.key || col]}
          </span>
        </div>
      ))}
    </div>
  );
};

export const LoadingState = () => (
  <div className="board-state loading">
    <RefreshCw size={32} className="spin" />
    <h2>Syncing Enterprise Data...</h2>
  </div>
);

export const ErrorState = ({ error, onRetry }) => (
  <div className="board-state error">
    <AlertTriangle size={32} />
    <h2>Dashboard Fetch Failed</h2>
    <p>{error}</p>
    <button onClick={onRetry}>Retry Connection</button>
  </div>
);
