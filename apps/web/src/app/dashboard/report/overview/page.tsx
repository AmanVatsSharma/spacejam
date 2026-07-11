"use client";

/**
 * File:        apps/web/src/app/dashboard/report/overview/page.tsx
 * Module:      Web · Dashboard · Report · Overview
 * Purpose:     Reports Overview dashboard with live revenue metrics and insights
 *
 * Exports:
 *   - OverviewPage — reports overview with revenue cards and charts
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-09
 */



import { useState } from "react";
import { useQuery } from "@apollo/client";
import {
  GET_DASHBOARD_METRICS,
  GET_REVENUE_REPORT,
  GET_INVOICES,
} from "@/lib/apollo/operations";
import { normalizeStatus, invoiceStatusLabel } from "@/lib/revenue-status";

const formatCurrency = (value?: number | null): string => {
  if (!value) return "₹0";
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
};

const formatDate = (value?: string | null): string => {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export default function OverviewPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month" | "quarter">("month");

  const { data: metricsData, loading: metricsLoading } = useQuery(GET_DASHBOARD_METRICS, {
    fetchPolicy: "cache-and-network",
    errorPolicy: "all",
  });
  const { data: revenueData } = useQuery(GET_REVENUE_REPORT, {
    fetchPolicy: "cache-and-network",
    errorPolicy: "all",
  });
  const { data: invoicesData } = useQuery(GET_INVOICES, {
    fetchPolicy: "cache-and-network",
    errorPolicy: "all",
  });

  const metrics = metricsData?.dashboardMetrics;
  const revenue = revenueData?.revenueReport;
  const invoices = invoicesData?.invoices ?? [];

  const periods = [
    { id: "week", label: "This Week" },
    { id: "month", label: "This Month" },
    { id: "quarter", label: "This Quarter" },
  ];

  // Build revenue cards from live data
  const growthPct = revenue?.growth != null ? revenue.growth : 0;
  const growthLabel = `${growthPct > 0 ? "+" : ""}${growthPct.toFixed(1)}%`;

  const revenueCards = [
    {
      title: "Total Revenue",
      value: metricsLoading ? "…" : formatCurrency(revenue?.total ?? metrics?.totalRevenue),
      change: growthLabel,
      trend: growthPct >= 0 ? ("up" as const) : ("down" as const),
      icon: "📈",
    },
    {
      title: "This Month",
      value: metricsLoading
        ? "…"
        : formatCurrency(
            (revenue?.byMonth ?? []).reduce(
              (sum: number, m: any) => sum + Number(m.revenue ?? 0),
              0,
            ),
          ),
      change: growthLabel,
      trend: growthPct >= 0 ? ("up" as const) : ("down" as const),
      icon: "📊",
    },
    {
      title: "Pending Payments",
      value: metricsLoading ? "…" : formatCurrency(metrics?.pendingPayments),
      change: growthLabel,
      trend: growthPct >= 0 ? ("up" as const) : ("down" as const),
      icon: "📝",
    },
    {
      title: "Occupancy Rate",
      value: metricsLoading
        ? "…"
        : metrics?.occupancyRate != null
          ? `${(metrics.occupancyRate * 100).toFixed(1)}%`
          : "—",
      change: growthLabel,
      trend: growthPct >= 0 ? ("up" as const) : ("down" as const),
      icon: "📈",
    },
  ];

  // Build recent transactions from live invoices (most recent first)
  const recentInvoices = [...invoices]
    .sort((a: any, b: any) => {
      const da = a.issueDate ? new Date(a.issueDate).getTime() : 0;
      const db = b.issueDate ? new Date(b.issueDate).getTime() : 0;
      return db - da;
    })
    .slice(0, 5)
    .map((inv: any) => ({
      id: inv.id,
      client: inv.customerName || "—",
      amount: formatCurrency(inv.totalAmount ?? inv.amount ?? 0),
      date: formatDate(inv.issueDate),
      status: normalizeStatus(inv.status) === "PAID" ? "completed" : "pending",
      statusLabel: invoiceStatusLabel[normalizeStatus(inv.status)] || inv.status || "—",
    }));

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm p-6 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#101828]">Reports Overview</h1>
            <p className="text-[#4A5565]">Track your revenue and business performance</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as any)}
              className="bg-gray-100 border-0 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A2F] transition-all duration-200"
            >
              {periods.map((period) => (
                <option key={period.id} value={period.id}>
                  {period.label}
                </option>
              ))}
            </select>
            <button className="flex items-center gap-2 bg-[#FF6A2F] text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-[#FF6A3D] active:scale-[0.97] transition-all duration-200 shadow-sm">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M8 3V8L11 11" />
                <circle cx="8" cy="8" r="5" />
              </svg>
              <span>Export Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {revenueCards.map((card, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl shadow-sm p-6 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
            style={{ '--i': index } as React.CSSProperties}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-[#6A7282]">{card.title}</span>
              <span className="text-2xl">{card.icon}</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-[#101828]">{card.value}</span>
              <span className={`text-sm font-medium ${
                card.trend === "up" ? "text-green-600" : "text-red-600"
              }`}>
                {card.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-2xl shadow-sm p-6 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
          <h3 className="text-lg font-semibold text-[#101828] mb-4">Revenue Trend</h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl">
            {revenue?.byMonth && revenue.byMonth.length > 0 ? (
              <div className="w-full h-full flex items-end justify-around gap-2 p-4">
                {revenue.byMonth.map((m: any, idx: number) => {
                  const values = revenue.byMonth.map((mm: any) => Number(mm.revenue ?? 0));
                  const max = Math.max(...values, 1);
                  const heightPct = (Number(m.revenue ?? 0) / max) * 100;
                  return (
                    <div key={idx} className="flex flex-col items-center gap-2 flex-1 h-full justify-end">
                      <div
                        className="w-full bg-[#FF6A2F] rounded-t-md"
                        style={{ height: `${heightPct}%`, minHeight: '2px' }}
                        title={`${m.month}: ${formatCurrency(m.revenue)}`}
                      ></div>
                      <span className="text-xs text-gray-500">{m.month}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center">
                <svg className="mx-auto mb-4" width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="#9CA3AF" strokeWidth="1.5">
                  <path d="M4 40L12 30L20 35L28 20L36 25L44 10" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M4 40L44 10" stroke="#9CA3AF" strokeWidth="1" strokeDasharray="2,2" />
                </svg>
                <p className="text-gray-500 font-medium">No revenue data available</p>
                <p className="text-sm text-gray-400">No data for the selected period</p>
              </div>
            )}
          </div>
        </div>

        {/* Occupancy Chart */}
        <div className="bg-white rounded-2xl shadow-sm p-6 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
          <h3 className="text-lg font-semibold text-[#101828] mb-4">Space Utilization</h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl">
            {metrics && metrics.totalSeats ? (
              (() => {
                const total = metrics.totalSeats || 0;
                const available = metrics.availableSeats ?? 0;
                const occupied = Math.max(total - available, 0);
                const occupiedPct = total ? Math.round((occupied / total) * 100) : 0;
                const availablePct = Math.max(100 - occupiedPct, 0);
                return (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-4">
                    <div className="w-full max-w-xs flex h-8 overflow-hidden rounded-lg">
                      <div className="bg-[#FF6A2F] flex items-center justify-center" style={{ width: `${occupiedPct}%` }}>
                        {occupiedPct > 10 && <span className="text-white text-xs font-semibold">{occupiedPct}%</span>}
                      </div>
                      <div className="bg-gray-200 flex items-center justify-center" style={{ width: `${availablePct}%` }}>
                        {availablePct > 10 && <span className="text-gray-600 text-xs font-semibold">{availablePct}%</span>}
                      </div>
                    </div>
                    <div className="flex gap-6 text-sm">
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-sm bg-[#FF6A2F]"></span>
                        <span className="text-gray-600">Occupied: {occupied}</span>
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-sm bg-gray-200"></span>
                        <span className="text-gray-600">Available: {available}</span>
                      </span>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="text-center">
                <svg className="mx-auto mb-4" width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="#9CA3AF" strokeWidth="1.5">
                  <rect x="6" y="20" width="8" height="20" rx="2" />
                  <rect x="18" y="12" width="8" height="28" rx="2" />
                  <rect x="30" y="16" width="8" height="24" rx="2" />
                </svg>
                <p className="text-gray-500 font-medium">No occupancy data available</p>
                <p className="text-sm text-gray-400">Seat utilization unavailable</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl shadow-sm p-6 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
        <h3 className="text-lg font-semibold text-[#101828] mb-4">Recent Transactions</h3>
        <div className="space-y-3">
          {recentInvoices.length === 0 ? (
            <div className="p-4 bg-gray-50 rounded-xl text-center text-gray-500">
              No recent transactions found
            </div>
          ) : (
            recentInvoices.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5 active:scale-[0.97] cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-100">
                    <span className="text-sm font-medium">📄</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#101828]">{transaction.client}</p>
                    <p className="text-xs text-gray-500">{transaction.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-[#101828]">{transaction.amount}</p>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      transaction.status === "completed"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {transaction.statusLabel}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
