import React, { useMemo, useEffect } from "react";
import { formatNumber, formatDate, matchesRecordSearch } from "../utils";
import {
  MetricCard,
  InsightPanels,
  CustomTooltip,
  EmptyChart,
} from "../SharedUI";
import DataTable from "../DataTable";
import { Users, MessageSquare, Star } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
} from "recharts";

export default function CrmSupportTab({
  db,
  filterByDate,
  searchQuery,
  applyRowFilters,
  setExportData,
}) {
  const viewData = useMemo(() => {
    const fInq = filterByDate(db.inquiries);
    const fInb = filterByDate(db.inbox);
    const fRev = filterByDate(db.reviews);
    const fSub = filterByDate(db.subscribers);

    let table = [
      ...fInq.map((i) => ({
        _rawDate: i.created_at,
        type: "Inquiry",
        name: i.name,
        email: i.email,
        subject: i.subject || "N/A",
        status: i.status,
        date: formatDate(i.created_at),
      })),
      ...fInb.map((i) => ({
        _rawDate: i.created_at,
        type: "Inbox",
        name: i.sender || "System",
        email: "N/A",
        subject: i.subject || "N/A",
        status: i.is_read ? "Read" : "Unread",
        date: formatDate(i.created_at),
      })),
      ...fRev.map((r) => ({
        _rawDate: r.created_at,
        type: "Review",
        name: r.name,
        email: r.email || "N/A",
        subject: `${r.rating} Star - ${r.title || "Review"}`,
        status: r.is_active ? "Active" : "Hidden",
        date: formatDate(r.created_at),
      })),
      ...fSub.map((s) => ({
        _rawDate: s.created_at,
        type: "Subscriber",
        name: s.name,
        email: s.email,
        subject: "Newsletter",
        status: "Subscribed",
        date: formatDate(s.created_at),
      })),
    ];

    if (searchQuery)
      table = table.filter((r) => matchesRecordSearch(r, searchQuery));
    table = table.filter(applyRowFilters);
    table.sort((a, b) => new Date(b._rawDate) - new Date(a._rawDate));

    const ratings = fRev.reduce((acc, r) => {
      acc[r.rating] = (acc[r.rating] || 0) + 1;
      return acc;
    }, {});
    const chartRatings = [1, 2, 3, 4, 5].map((star) => ({
      name: `${star} Star`,
      count: ratings[star] || 0,
    }));
    const avgRating = fRev.length
      ? fRev.reduce((acc, r) => acc + r.rating, 0) / fRev.length
      : 0;

    return {
      metrics: [
        {
          label: "Total Subscribers",
          value: formatNumber(fSub.length),
          icon: <Users />,
        },
        {
          label: "Unread Inquiries",
          value: fInq.filter((i) => i.status === "unread").length,
          icon: <MessageSquare />,
          alert: true,
        },
        { label: "Avg Rating", value: avgRating.toFixed(1), icon: <Star /> },
      ],
      quality: [],
      insights: [
        `${fSub.length} new subscribers in this period.`,
        `There are ${fInb.filter((i) => !i.is_read).length} unread system inbox messages.`,
      ],
      charts: [
        {
          title: "Review Ratings",
          data: chartRatings,
          type: "bar",
          x: "name",
          y: "count",
        },
      ],
      tableCols: ["type", "name", "email", "subject", "status", "date"],
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
                  <BarChart data={chart.data}>
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
                    <Bar
                      dataKey={chart.y}
                      fill="#f59e0b"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
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
        resetKey="crm"
      />
    </div>
  );
}
