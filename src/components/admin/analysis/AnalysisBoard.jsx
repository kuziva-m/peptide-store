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
} from "lucide-react";
import { useDashboardData } from "./hooks/useDashboardData";
import { useAnalysisFilters } from "./hooks/useAnalysisFilters";
import { exportRowsToCsv } from "./utils";
import { LoadingState, ErrorState } from "./SharedUI";
import "./AnalysisBoard.css";

// Tabs
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
    label: "Executive Overview",
    icon: <Globe size={16} />,
    Component: ExecutiveOverviewTab,
  },
  {
    id: "sales",
    label: "Sales & Orders",
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
    id: "inventory",
    label: "Catalog & Preorders",
    icon: <Activity size={16} />,
    Component: CatalogPreordersTab,
  },
  {
    id: "compliance",
    label: "COA & Compliance",
    icon: <ShieldAlert size={16} />,
    Component: CoaComplianceTab,
  },
  {
    id: "marketing",
    label: "Marketing & Affiliates",
    icon: <Tag size={16} />,
    Component: MarketingAffiliatesTab,
  },
  {
    id: "crm",
    label: "CRM & Support",
    icon: <Users size={16} />,
    Component: CrmSupportTab,
  },
];

export default function AnalysisBoard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [exportData, setExportData] = useState({ rows: [], cols: [] });

  const {
    db,
    loading,
    refreshing,
    error,
    lastUpdated,
    refreshData,
    productsMap,
    variantsMap,
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
  } = useAnalysisFilters(db);

  const handleExport = () => {
    exportRowsToCsv(
      exportData.rows,
      exportData.cols,
      `mp_export_${activeTab}_${new Date().getTime()}.csv`,
    );
  };

  if (error) return <ErrorState error={error} onRetry={refreshData} />;
  if (loading) return <LoadingState />;

  const ActiveComponent = TABS.find((t) => t.id === activeTab)?.Component;

  return (
    <div className="analysis-board">
      <header className="board-header">
        <div>
          <h1>Analysis Board</h1>
          <p>
            Live Enterprise Analytics. Last synced:{" "}
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
          <button onClick={handleExport} className="btn-primary">
            <Download size={16} />{" "}
            <span className="hide-mobile">Export CSV</span>
          </button>
        </div>
      </header>

      {/* GLOBAL FILTER BAR */}
      <div className="filter-bar">
        <div className="filter-group fill-mobile">
          <Search size={18} color="#64748b" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
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

        <div className="filter-group">
          <Filter size={18} color="#64748b" />
          <select
            value={filters.orderStatus}
            onChange={(e) => handleFilterChange("orderStatus", e.target.value)}
          >
            <option value="All">Status: All</option>
            {derivedOptions.orderStatuses
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
            {derivedOptions.categories
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
            onChange={(e) => handleFilterChange("availability", e.target.value)}
          >
            <option value="All">Availability: All</option>
            <option value="In Stock">In Stock</option>
            <option value="Out of Stock">Out of Stock</option>
            <option value="Preorder">Preorder</option>
          </select>
        </div>

        <button className="reset-filters" onClick={resetFilters}>
          Reset All
        </button>
      </div>

      <div className="active-filters">
        {searchQuery && (
          <span className="chip">
            Search: {searchQuery}{" "}
            <X size={12} onClick={() => setSearchQuery("")} />
          </span>
        )}
        {dateRange !== "all" && (
          <span className="chip">
            Date: {dateRange}{" "}
            <X size={12} onClick={() => setDateRange("all")} />
          </span>
        )}
        {Object.entries(filters).map(
          ([k, v]) =>
            v !== "All" && (
              <span key={k} className="chip">
                {k}: {v}{" "}
                <X size={12} onClick={() => handleFilterChange(k, "All")} />
              </span>
            ),
        )}
      </div>

      {/* TABS */}
      <div className="board-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => {
              setActiveTab(tab.id);
              resetFilters();
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* RENDER ACTIVE TAB */}
      {ActiveComponent && (
        <ActiveComponent
          db={db}
          filterByDate={filterByDate}
          productsMap={productsMap}
          variantsMap={variantsMap}
          searchQuery={searchQuery}
          applyRowFilters={applyRowFilters}
          setExportData={setExportData}
        />
      )}
    </div>
  );
}
