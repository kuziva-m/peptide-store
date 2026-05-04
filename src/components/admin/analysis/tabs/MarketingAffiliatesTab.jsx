import React, { useMemo, useEffect } from "react";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatDate,
  matchesRecordSearch,
} from "../utils";
import {
  MetricCard,
  InsightPanels,
  CustomTooltip,
  EmptyChart,
} from "../SharedUI";
import DataTable from "../DataTable";
import { Tag, Users, DollarSign } from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Line,
} from "recharts";

export default function MarketingAffiliatesTab({
  db,
  filterByDate,
  searchQuery,
  applyRowFilters,
  setExportData,
}) {
  const viewData = useMemo(() => {
    const fDiscounts = filterByDate(db.discountUsage);
    const estComm = db.affiliates.reduce(
      (acc, a) => acc + (Number(a.total_paid) || 0),
      0,
    );
    const actVouchers = db.vouchers.filter(
      (v) => v.is_active && new Date(v.expires_at) > new Date(),
    );
    const vouLiab = actVouchers.reduce(
      (acc, v) => acc + Number(v.current_balance || 0),
      0,
    );

    let table = [
      ...db.discounts.map((d) => ({
        _rawDate: d.created_at,
        code: d.code,
        source: "Discount",
        type: d.type,
        value: d.value,
        uses: d.max_uses ? `${d.max_uses} limit` : "Unlimited",
        status: d.active ? "Active" : "Inactive",
        date: formatDate(d.created_at),
      })),
      ...db.affiliates.map((a) => ({
        _rawDate: a.created_at,
        code: a.discount_code,
        source: "Affiliate",
        type: "Commission",
        value: formatPercent(Number(a.commission_rate) * 100),
        uses: "N/A",
        status: "Active",
        date: formatDate(a.created_at),
      })),
      ...db.vouchers.map((v) => ({
        _rawDate: v.created_at,
        code: v.code,
        source: "Voucher",
        type: "Credit",
        value: formatCurrency(v.current_balance),
        uses: "N/A",
        status: v.is_active ? "Active" : "Inactive",
        date: formatDate(v.created_at),
      })),
    ];

    if (searchQuery)
      table = table.filter((r) => matchesRecordSearch(r, searchQuery));
    table = table.filter(applyRowFilters);
    table.sort((a, b) => new Date(b._rawDate) - new Date(a._rawDate));

    const usageByDate = fDiscounts.reduce((acc, d) => {
      const dt = d.created_at.split("T")[0];
      acc[dt] = (acc[dt] || 0) + 1;
      return acc;
    }, {});
    const chartUsage = Object.entries(usageByDate)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      metrics: [
        {
          label: "Discounts Used",
          value: formatNumber(fDiscounts.length),
          icon: <Tag />,
        },
        {
          label: "Active Affiliates",
          value: db.affiliates.length,
          icon: <Users />,
        },
        {
          label: "Voucher Liability",
          value: formatCurrency(vouLiab),
          icon: <DollarSign />,
        },
      ],
      quality: [
        {
          label: "Discounts with no max uses",
          value: db.discounts.filter((d) => !d.max_uses).length,
          critical: false,
        },
      ],
      insights: [
        `Total estimated commission recorded: ${formatCurrency(estComm)}.`,
        `There are ${actVouchers.length} active vouchers carrying a balance.`,
      ],
      charts: [
        {
          title: "Discount Usage Over Time",
          data: chartUsage,
          type: "composed",
          x: "date",
          line: "count",
        },
      ],
      tableCols: ["code", "source", "type", "value", "uses", "status", "date"],
      tableData: table,
    };
  }, [db, filterByDate, searchQuery, applyRowFilters]);

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
              {chart.data.length ? (
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={chart.data}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />
                    <XAxis
                      dataKey={chart.x}
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey={chart.line}
                      stroke="#4635de"
                      strokeWidth={3}
                      dot={false}
                      name="Uses"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart />
              )}
            </div>
          </div>
        ))}
      </div>

      <DataTable
        data={viewData.tableData}
        columns={viewData.tableCols}
        resetKey="marketing"
      />
    </div>
  );
}
