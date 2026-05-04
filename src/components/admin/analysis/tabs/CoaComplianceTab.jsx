import React, { useMemo, useEffect } from "react";
import {
  formatPercent,
  hasUrl,
  scanForRisk,
  matchesRecordSearch,
} from "../utils";
import {
  MetricCard,
  InsightPanels,
  CustomTooltip,
  EmptyChart,
} from "../SharedUI";
import DataTable from "../DataTable";
import { FileText, ShieldAlert } from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

export default function CoaComplianceTab({
  db,
  searchQuery,
  applyRowFilters,
  setExportData,
}) {
  const viewData = useMemo(() => {
    let table = db.products.map((p) => {
      const descRisk = scanForRisk(p.description);
      const calcRisk =
        scanForRisk(p.calc_description) + scanForRisk(p.calc_example);
      return {
        _rawDate: p.created_at,
        product: p.name,
        slug: p.slug,
        category: p.category || "N/A",
        product_coa: hasUrl(p.lab_result_url) ? "Verified" : "Missing",
        variants_total: p.variants?.length || 0,
        variants_coa_missing:
          p.variants?.filter((v) => !hasUrl(v.lab_result_url)).length || 0,
        risk_flags: descRisk + calcRisk,
      };
    });

    if (searchQuery)
      table = table.filter((r) => matchesRecordSearch(r, searchQuery));
    table = table.filter(applyRowFilters);
    // Sort high-risk compliance rows first
    table.sort(
      (a, b) =>
        b.risk_flags - a.risk_flags || (b.product_coa === "Missing" ? 1 : -1),
    );

    const pCoa = db.products.filter((p) => hasUrl(p.lab_result_url)).length;
    const vCoa = db.variants.filter((v) => hasUrl(v.lab_result_url)).length;

    const chartProd = [
      { name: "Verified", value: pCoa },
      { name: "Missing", value: db.products.length - pCoa },
    ];

    const chartVar = [
      { name: "Verified", value: vCoa },
      { name: "Missing", value: db.variants.length - vCoa },
    ];

    return {
      metrics: [
        {
          label: "Product COA Coverage",
          value: formatPercent((pCoa / Math.max(db.products.length, 1)) * 100),
          icon: <FileText />,
        },
        {
          label: "Variant COA Coverage",
          value: formatPercent((vCoa / Math.max(db.variants.length, 1)) * 100),
          icon: <FileText />,
        },
        {
          label: "Total Compliance Flags",
          value: table.reduce((acc, r) => acc + r.risk_flags, 0),
          icon: <ShieldAlert />,
          alert: true,
        },
      ],
      quality: [
        {
          label: "Active Products Missing COA",
          value: db.products.filter(
            (p) => p.in_stock && !hasUrl(p.lab_result_url),
          ).length,
          critical: true,
        },
        {
          label: "Preorders Missing COA",
          value: db.variants.filter(
            (v) => v.is_preorder && !hasUrl(v.lab_result_url),
          ).length,
          critical: false,
        },
      ],
      insights: [
        `Scanned product descriptions and calculator fields for therapeutic claims (e.g. heal, cure, weight loss).`,
        `Ensure missing COAs are updated to maintain TGA/ACCC compliance posture.`,
      ],
      charts: [
        {
          title: "Product COA Status",
          data: chartProd,
          type: "pie",
          nameKey: "name",
          dataKey: "value",
        },
        {
          title: "Variant COA Status",
          data: chartVar,
          type: "pie",
          nameKey: "name",
          dataKey: "value",
        },
      ],
      tableCols: [
        "product",
        "category",
        "product_coa",
        "variants_total",
        "variants_coa_missing",
        "risk_flags",
      ],
      tableData: table,
    };
  }, [db, searchQuery, applyRowFilters]);

  useEffect(() => {
    setExportData({ rows: viewData.tableData, cols: viewData.tableCols });
  }, [viewData, setExportData]);

  return (
    <div className="tab-content">
      <div className="metrics-grid">
        {viewData.metrics.map((m, i) => (
          <MetricCard key={i} {...m} />
        ))}
      </div>
      <InsightPanels insights={viewData.insights} quality={viewData.quality} />

      <div className="charts-grid">
        {viewData.charts.map((chart, i) => (
          <div key={i} className="chart-card">
            <h3>{chart.title}</h3>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chart.data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    nameKey="name"
                  >
                    {chart.data.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          [
                            "#0d9488",
                            "#e11d48",
                            "#f59e0b",
                            "#4635de",
                            "#64748b",
                          ][index % 5]
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>

      <DataTable
        data={viewData.tableData}
        columns={viewData.tableCols}
        resetKey="compliance"
      />
    </div>
  );
}
