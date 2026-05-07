import React, { useState, useEffect, useMemo } from "react";
import { StatusBadge, EmptyState } from "./SharedUI";
import { getStatusTone } from "./utils";
import {
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Inbox,
} from "lucide-react";

export default function DataTable({
  data = [],
  columns = [],
  resetKey,
  viewMode = "table", // "table", "cards", "compact"
  topN = "all",
  sortBy: externalSortBy,
  sortDirection: externalSortDir,
  onSortChange,
  defaultSortBy,
  defaultSortDirection = "desc",
  onVisibleDataChange, // Allows parent to grab exactly what is shown for exports
}) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Local sort state fallback if parent doesn't provide external sorting
  const [localSortBy, setLocalSortBy] = useState(defaultSortBy || null);
  const [localSortDir, setLocalSortDir] = useState(defaultSortDirection);

  // Responsive listener
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Reset pagination when tab, data length, or sorting changes
  useEffect(() => {
    setPage(0);
  }, [resetKey, data.length, topN, externalSortBy, localSortBy]);

  // Normalize column definitions
  const normalizedColumns = useMemo(() => {
    return columns.map((col) => {
      if (typeof col === "string") {
        return {
          key: col,
          label: col.replace(/_/g, " ").toUpperCase(),
          sortable: true, // Assume string cols are sortable for backward compatibility
        };
      }
      return col;
    });
  }, [columns]);

  // Determine active sorting
  const activeSortBy =
    externalSortBy !== undefined ? externalSortBy : localSortBy;
  const activeSortDir =
    externalSortDir !== undefined ? externalSortDir : localSortDir;

  const handleHeaderClick = (col) => {
    if (col.sortable === false) return;
    const newDir =
      activeSortBy === col.key && activeSortDir === "desc" ? "asc" : "desc";

    if (onSortChange) {
      onSortChange(col.key, newDir);
    } else {
      setLocalSortBy(col.key);
      setLocalSortDir(newDir);
    }
  };

  // Process data (Sort -> Limit -> Paginate)
  const processedData = useMemo(() => {
    let result = [...data];

    // Apply local sort if parent isn't driving it
    if (!onSortChange && activeSortBy) {
      result.sort((a, b) => {
        let valA = a[activeSortBy];
        let valB = b[activeSortBy];

        // Handle numeric strings safely
        if (typeof valA === "string" && valA.startsWith("$"))
          valA = Number(valA.replace(/[^0-9.-]+/g, ""));
        if (typeof valB === "string" && valB.startsWith("$"))
          valB = Number(valB.replace(/[^0-9.-]+/g, ""));

        if (valA < valB) return activeSortDir === "asc" ? -1 : 1;
        if (valA > valB) return activeSortDir === "asc" ? 1 : -1;
        return 0;
      });
    }

    // Apply Top N limit
    if (topN !== "all") {
      result = result.slice(0, Number(topN));
    }

    return result;
  }, [data, topN, activeSortBy, activeSortDir, onSortChange]);

  // Pass visible processed data upward for exporting if requested
  useEffect(() => {
    if (onVisibleDataChange) onVisibleDataChange(processedData);
  }, [processedData, onVisibleDataChange]);

  const isAll = rowsPerPage === "All";
  const totalPages = isAll ? 1 : Math.ceil(processedData.length / rowsPerPage);
  const paginatedData = isAll
    ? processedData
    : processedData.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  // Cell Renderer
  const renderCellContent = (row, col) => {
    const val = row[col.key];
    if (col.render) return col.render(row);

    // Auto-badges for known statuses to maintain backward compatibility
    if (
      col.type === "badge" ||
      [
        "status",
        "stock",
        "product_coa",
        "variant_coa",
        "type",
        "product_stock",
      ].includes(col.key)
    ) {
      return <StatusBadge text={val} tone={getStatusTone(val)} />;
    }
    if (col.key === "risk_flags") {
      return (
        <span
          style={{ color: val > 0 ? "#e11d48" : "#16a34a", fontWeight: "bold" }}
        >
          {val} Flags
        </span>
      );
    }

    return val !== undefined && val !== null ? String(val) : "-";
  };

  // Determine Effective View Mode
  let effectiveViewMode = viewMode;
  if (viewMode === "table" && isMobile) effectiveViewMode = "cards"; // Mobile default

  if (data.length === 0) {
    return (
      <div className="table-card" style={{ padding: "40px 20px" }}>
        <EmptyState
          title="No Records Found"
          description="There is no data matching your current filters."
          icon={<Inbox size={48} color="#cbd5e1" />}
        />
      </div>
    );
  }

  return (
    <div className="table-card">
      <div className="table-header">
        <h3>Detailed Records ({processedData.length})</h3>
        <div className="table-controls">
          <label htmlFor="rowsPerPage" className="visually-hidden">
            Rows per page
          </label>
          <select
            id="rowsPerPage"
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(
                e.target.value === "All" ? "All" : Number(e.target.value),
              );
              setPage(0);
            }}
          >
            <option value={25}>25 rows</option>
            <option value={50}>50 rows</option>
            <option value={100}>100 rows</option>
            <option value="All">All rows</option>
          </select>
        </div>
      </div>

      {effectiveViewMode === "table" && (
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                {normalizedColumns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleHeaderClick(col)}
                    className={col.sortable !== false ? "sortable-header" : ""}
                    title={col.sortable !== false ? "Click to sort" : ""}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      {col.label}
                      {activeSortBy === col.key &&
                        (activeSortDir === "asc" ? (
                          <ArrowUp size={12} />
                        ) : (
                          <ArrowDown size={12} />
                        ))}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row, i) => (
                <tr key={i}>
                  {normalizedColumns.map((col) => (
                    <td key={`${i}-${col.key}`}>
                      {renderCellContent(row, col)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {effectiveViewMode === "cards" && (
        <div className="view-cards-grid">
          {paginatedData.map((row, i) => {
            const primaryCol =
              normalizedColumns.find((c) => c.primary) || normalizedColumns[0];
            const secondaryCols = normalizedColumns.filter(
              (c) => c.key !== primaryCol.key,
            );
            return (
              <div className="mobile-row-card" key={i}>
                <div className="card-primary">
                  {renderCellContent(row, primaryCol)}
                </div>
                <div className="card-details">
                  {secondaryCols.map((col) => (
                    <div className="card-kv" key={col.key}>
                      <span className="card-k">{col.label}</span>
                      <span className="card-v">
                        {renderCellContent(row, col)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {effectiveViewMode === "compact" && (
        <div className="view-compact-list">
          {paginatedData.map((row, i) => {
            const primaryCol =
              normalizedColumns.find((c) => c.primary) || normalizedColumns[0];
            const metricCols = normalizedColumns
              .filter((c) => c.key !== primaryCol.key)
              .slice(0, 3); // Show max 3 metrics inline
            return (
              <div className="compact-row" key={i}>
                <span className="compact-rank">
                  #{page * (rowsPerPage === "All" ? 1 : rowsPerPage) + i + 1}
                </span>
                <span
                  className="compact-primary"
                  title={String(row[primaryCol.key] || "")}
                >
                  {renderCellContent(row, primaryCol)}
                </span>
                <div className="compact-metrics">
                  {metricCols.map((col) => (
                    <span className="compact-metric" key={col.key}>
                      {renderCellContent(row, col)}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="table-footer">
          <span>
            Page {page + 1} of {totalPages}
          </span>
          <div className="pagination-controls">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              aria-label="Previous Page"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              aria-label="Next Page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
