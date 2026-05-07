import React, { useState } from "react";
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  X,
  Globe,
  TrendingUp,
  Package,
  Activity,
  ShieldAlert,
  Tag,
  Users,
  Database,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
} from "lucide-react";
import { useDashboardData } from "./hooks/useDashboardData";
import { useAnalysisFilters } from "./hooks/useAnalysisFilters";
import { exportRowsToCsv } from "./utils";
import { LoadingState, ErrorState } from "./SharedUI";
import "./AnalysisBoard.css";

// Existing Tab Imports mapped to new Client-Requested Taxonomy
import ExecutiveOverviewTab from "./tabs/ExecutiveOverviewTab";
import SalesOrdersTab from "./tabs/SalesOrdersTab";
import ProductPerformanceTab from "./tabs/ProductPerformanceTab";
import CatalogPreordersTab from "./tabs/CatalogPreordersTab";
import CoaComplianceTab from "./tabs/CoaComplianceTab";
import MarketingAffiliatesTab from "./tabs/MarketingAffiliatesTab";
import CrmSupportTab from "./tabs/CrmSupportTab";

const TABS = [
  {
    id: "overview",
    label: "Overview",
    icon: <Globe size={16} />,
    Component: ExecutiveOverviewTab,
  },
  {
    id: "sales",
    label: "Sales & Revenue",
    icon: <TrendingUp size={16} />,
    Component: SalesOrdersTab,
  },
  {
    id: "products",
    label: "Product Performance",
    icon: <Package size={16} />,
    Component: ProductPerformanceTab,
  },
  {
    id: "acquisition",
    label: "Traffic & Acquisition",
    icon: <Tag size={16} />,
    Component: MarketingAffiliatesTab, // Mapped to existing file
  },
  {
    id: "retention",
    label: "Retention & Loyalty",
    icon: <Users size={16} />,
    Component: CrmSupportTab, // Mapped to existing file
  },
  {
    id: "operations",
    label: "Operations",
    icon: <Activity size={16} />,
    Component: CatalogPreordersTab, // Mapped to existing file
  },
  {
    id: "compliance",
    label: "Compliance & Trust",
    icon: <ShieldAlert size={16} />,
    Component: CoaComplianceTab, // Mapped to existing file
  },
];

export default function AnalysisBoard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [exportData, setExportData] = useState({ rows: [], cols: [] });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const {
    db,
    loading,
    refreshing,
    error,
    lastUpdated,
    refreshData,
    productsMap,
    variantsMap,
    dataAvailability = {},
    schemaRecommendations = [],
  } = useDashboardData();

  const {
    dateRange,
    setDateRange,
    searchQuery,
    setSearchQuery,
    filters,
    handleFilterChange,
    resetFilters,
    derivedOptions,
    filterByDate,
    applyRowFilters,
    viewControls = {},
    handleViewControlChange,
    activeFilterChips = [],
    removeFilter,
  } = useAnalysisFilters(db);

  const handleExport = () => {
    if (!exportData.rows || exportData.rows.length === 0) return;
    exportRowsToCsv(
      exportData.rows,
      exportData.cols,
      `mp_export_${activeTab}_${new Date().getTime()}.csv`,
    );
  };

  if (error) return <ErrorState error={error} onRetry={refreshData} />;
  if (loading) return <LoadingState />;

  const ActiveComponent = TABS.find((t) => t.id === activeTab)?.Component;

  // Calculate live core metrics for the data indicator
  const liveMetricsCount = Object.values(dataAvailability).filter(
    (v) => v === "available",
  ).length;
  const totalMetricsCount = Object.keys(dataAvailability).length;

  return (
    <div className="analysis-board">
      {/* 1. TOP DASHBOARD HEADER */}
      <header className="board-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <h1>Analysis Board</h1>
            {totalMetricsCount > 0 && (
              <span className="data-indicator" title="Available Core Metrics">
                <Database size={14} />
                {liveMetricsCount}/{totalMetricsCount} Live
              </span>
            )}
          </div>
          <p>
            Enterprise Intelligence & Reporting. Last synced:{" "}
            {lastUpdated?.toLocaleTimeString()}
          </p>
        </div>
        <div className="header-actions">
          <button
            onClick={refreshData}
            className="btn-secondary"
            disabled={refreshing}
          >
            <RefreshCw size={16} className={refreshing ? "spin" : ""} />{" "}
            <span className="hide-mobile">Refresh</span>
          </button>
          <button
            onClick={handleExport}
            className="btn-primary"
            disabled={!exportData.rows || exportData.rows.length === 0}
            style={{
              opacity:
                !exportData.rows || exportData.rows.length === 0 ? 0.5 : 1,
            }}
          >
            <Download size={16} />{" "}
            <span className="hide-mobile">Export CSV</span>
          </button>
        </div>
      </header>

      {/* 2. PRIMARY FILTER BAR (Analyst Controls) */}
      <div className="filter-bar primary-filters">
        <div className="filter-group fill-mobile">
          <Search size={18} color="#64748b" />
          <input
            type="text"
            placeholder={`Search ${TABS.find((t) => t.id === activeTab)?.label}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Date:</label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="ytd">Year to Date</option>
          </select>
        </div>

        <div className="filter-group hide-mobile">
          <label>Metric:</label>
          <select
            value={viewControls.selectedMetric || "revenue"}
            onChange={(e) =>
              handleViewControlChange("selectedMetric", e.target.value)
            }
          >
            <option value="revenue">Revenue</option>
            <option value="orders">Orders</option>
            <option value="units">Units Sold</option>
            <option value="aov">AOV</option>
          </select>
        </div>

        <div className="filter-group hide-mobile">
          <label>View:</label>
          <select
            value={viewControls.viewMode || "table"}
            onChange={(e) =>
              handleViewControlChange("viewMode", e.target.value)
            }
          >
            <option value="table">Table View</option>
            <option value="cards">Card View</option>
            <option value="compact">Compact</option>
          </select>
        </div>

        <button
          className={`btn-toggle-filters ${showAdvancedFilters ? "active" : ""}`}
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
        >
          <SlidersHorizontal size={16} />
          <span className="hide-mobile">More Filters</span>
          {showAdvancedFilters ? (
            <ChevronUp size={16} />
          ) : (
            <ChevronDown size={16} />
          )}
        </button>
      </div>

      {/* 3. ADVANCED FILTERS (Collapsible) */}
      {showAdvancedFilters && (
        <div className="filter-bar advanced-filters">
          <div className="filter-group">
            <Filter size={14} color="#64748b" />
            <select
              value={filters.orderStatus}
              onChange={(e) =>
                handleFilterChange("orderStatus", e.target.value)
              }
            >
              <option value="All">Status: All</option>
              {derivedOptions?.orderStatuses
                ?.filter((o) => o !== "All")
                .map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
            </select>
          </div>

          <div className="filter-group">
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange("category", e.target.value)}
            >
              <option value="All">Category: All</option>
              {derivedOptions?.categories
                ?.filter((o) => o !== "All")
                .map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
            </select>
          </div>

          <div className="filter-group">
            <select
              value={filters.availability}
              onChange={(e) =>
                handleFilterChange("availability", e.target.value)
              }
            >
              <option value="All">Availability: All</option>
              <option value="In Stock">In Stock</option>
              <option value="Out of Stock">Out of Stock</option>
              <option value="Preorder">Preorder</option>
            </select>
          </div>

          <div className="filter-group">
            <select
              value={filters.coaStatus}
              onChange={(e) => handleFilterChange("coaStatus", e.target.value)}
            >
              <option value="All">COA: All</option>
              <option value="Verified">Verified</option>
              <option value="Missing">Missing</option>
            </select>
          </div>

          <div className="filter-group">
            <select
              value={filters.visibility}
              onChange={(e) => handleFilterChange("visibility", e.target.value)}
            >
              <option value="All">Visibility: All</option>
              <option value="Visible">Visible</option>
              <option value="Hidden">Hidden</option>
            </select>
          </div>

          <button className="reset-filters" onClick={resetFilters}>
            Reset Filters
          </button>
        </div>
      )}

      {/* 4. ACTIVE FILTER CHIPS */}
      {activeFilterChips.length > 0 && (
        <div className="active-filters">
          {activeFilterChips.map((chip) => (
            <span key={chip.key} className="chip">
              {chip.label}: {chip.value}{" "}
              <X
                size={12}
                onClick={() => removeFilter && removeFilter(chip.onRemoveKey)}
              />
            </span>
          ))}
        </div>
      )}

      {/* 5. TAB NAVIGATION (Desktop Buttons & Mobile Select) */}
      <div className="board-tabs-container">
        {/* Mobile View */}
        <div className="mobile-tab-selector hide-desktop">
          <select
            value={activeTab}
            onChange={(e) => {
              setActiveTab(e.target.value);
              if (resetFilters) resetFilters();
            }}
          >
            {TABS.map((tab) => (
              <option key={tab.id} value={tab.id}>
                {tab.label}
              </option>
            ))}
          </select>
        </div>

        {/* Desktop View */}
        <div className="board-tabs hide-mobile">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => {
                setActiveTab(tab.id);
                if (resetFilters) resetFilters();
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 6. RENDER ACTIVE TAB */}
      {ActiveComponent && (
        <ActiveComponent
          db={db}
          filterByDate={filterByDate}
          productsMap={productsMap}
          variantsMap={variantsMap}
          searchQuery={searchQuery}
          applyRowFilters={applyRowFilters}
          setExportData={setExportData}
          viewControls={viewControls}
          dataAvailability={dataAvailability}
          schemaRecommendations={schemaRecommendations}
        />
      )}
    </div>
  );
}
