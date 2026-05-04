import React, { useState, useEffect } from "react";
import { StatusBadge } from "./SharedUI";
import { getStatusTone } from "./utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function DataTable({ data, columns, resetKey }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Reset pagination when tab/filters change
  useEffect(() => {
    setPage(0);
  }, [resetKey, data.length]);

  const paginatedData = data.slice(
    page * rowsPerPage,
    (page + 1) * rowsPerPage,
  );
  const totalPages = Math.ceil(data.length / rowsPerPage);

  return (
    <div className="table-card">
      <div className="table-header">
        <h3>Detailed Records ({data.length})</h3>
        <select
          value={rowsPerPage}
          onChange={(e) => {
            setRowsPerPage(Number(e.target.value));
            setPage(0);
          }}
        >
          <option value={25}>25 rows</option>
          <option value={50}>50 rows</option>
          <option value={100}>100 rows</option>
        </select>
      </div>

      <div className="table-responsive">
        {paginatedData.length > 0 ? (
          <table>
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col}>{col.replace(/_/g, " ").toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={`${i}-${col}`}>
                      {[
                        "status",
                        "stock",
                        "product_coa",
                        "variant_coa",
                        "type",
                        "product_stock",
                      ].includes(col) ? (
                        <StatusBadge
                          text={row[col]}
                          tone={getStatusTone(row[col])}
                        />
                      ) : col === "risk_flags" ? (
                        <span
                          style={{
                            color: row[col] > 0 ? "#e11d48" : "#16a34a",
                            fontWeight: "bold",
                          }}
                        >
                          {row[col]} Flags
                        </span>
                      ) : (
                        row[col]
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            No records match the current filters.
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="table-footer">
          <span>
            Page {page + 1} of {totalPages}
          </span>
          <div className="pagination-controls">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
