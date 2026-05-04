import React from "react";
import { formatCurrency, formatNumber } from "./utils";
import { Activity, ShieldAlert, AlertTriangle, RefreshCw } from "lucide-react";

export const MetricCard = ({ label, value, icon, subtext, alert }) => (
  <div className={`metric-card ${alert ? "alert" : ""}`}>
    <div className="metric-header">
      <span className="metric-label">{label}</span>
      <div className="metric-icon">{icon}</div>
    </div>
    <div className="metric-value">{value}</div>
    {subtext && <div className="metric-subtext">{subtext}</div>}
  </div>
);

export const StatusBadge = ({ text, tone = "neutral" }) => (
  <span className={`status-badge ${tone}`}>{text || "N/A"}</span>
);

export const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="tooltip-label">{label}</p>
        {payload.map((entry, index) => (
          <p
            key={index}
            style={{
              color: entry.color,
              margin: 0,
              fontSize: "0.9rem",
              fontWeight: 600,
            }}
          >
            {entry.name}:{" "}
            {entry.name.toLowerCase().includes("revenue") ||
            entry.name.toLowerCase().includes("sales")
              ? formatCurrency(entry.value)
              : formatNumber(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const InsightPanels = ({ insights = [], quality = [] }) => {
  if (!insights.length && !quality.length) return null;
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

export const EmptyChart = () => (
  <div className="empty-chart">No data available for this range.</div>
);

export const LoadingState = () => (
  <div className="board-state loading">
    <RefreshCw size={32} className="spin" />
    <h2>Syncing Database...</h2>
  </div>
);

export const ErrorState = ({ error, onRetry }) => (
  <div className="board-state error">
    <AlertTriangle size={32} />
    <h2>Error Loading Dashboard</h2>
    <p>{error}</p>
    <button onClick={onRetry}>Retry</button>
  </div>
);
