"use client";

/**
 * File:        apps/web/src/app/dashboard/report/overview/page.tsx
 * Module:      Web · Dashboard · Report · Overview
 * Purpose:     Reports Overview dashboard with revenue metrics and insights
 *
 * Exports:
 *   - OverviewPage — reports overview with revenue cards and charts
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-07
 */



import { useState } from "react";

interface RevenueCard {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: string;
}

interface Transaction {
  id: string;
  client: string;
  amount: string;
  date: string;
  type: "revenue" | "payment";
  status: "completed" | "pending";
}

const revenueCards: RevenueCard[] = [
  {
    title: "Total Revenue",
    value: "₹12,45,000",
    change: "+12.5%",
    trend: "up",
    icon: "📈"
  },
  {
    title: "This Month",
    value: "₹1,85,000",
    change: "+8.2%",
    trend: "up",
    icon: "📊"
  },
  {
    title: "Pending Invoices",
    value: "₹45,000",
    change: "-5.3%",
    trend: "down",
    icon: "📝"
  },
  {
    title: "Growth Rate",
    value: "18.5%",
    change: "+3.2%",
    trend: "up",
    icon: "📈"
  }
];

const recentTransactions: Transaction[] = [
  { id: "TRX-001", client: "TechCorp India", amount: "₹45,000", date: "May 28, 2026", type: "revenue", status: "completed" },
  { id: "TRX-002", client: "StartupXYZ", amount: "₹28,500", date: "May 25, 2026", type: "payment", status: "completed" },
  { id: "TRX-003", client: "Design Studio", amount: "₹32,000", date: "May 24, 2026", type: "revenue", status: "pending" },
  { id: "TRX-004", client: "Freelancer Co.", amount: "₹15,000", date: "May 22, 2026", type: "payment", status: "completed" },
  { id: "TRX-005", client: "Global Innovations", amount: "₹52,000", date: "May 20, 2026", type: "revenue", status: "completed" },
];

export default function OverviewPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month" | "quarter">("month");

  const periods = [
    { id: "week", label: "This Week" },
    { id: "month", label: "This Month" },
    { id: "quarter", label: "This Quarter" },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#101828]">Reports Overview</h1>
            <p className="text-[#4A5565]">Track your revenue and business performance</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as any)}
              className="bg-gray-100 border-0 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A2F]"
            >
              {periods.map((period) => (
                <option key={period.id} value={period.id}>
                  {period.label}
                </option>
              ))}
            </select>
            <button className="flex items-center gap-2 bg-[#FF6A2F] text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-[#FF6A3D] transition-colors shadow-sm">
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
          <div key={index} className="bg-white rounded-2xl shadow-sm p-6">
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
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-[#101828] mb-4">Revenue Trend</h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl">
            <div className="text-center">
              <svg className="mx-auto mb-4" width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="#9CA3AF" strokeWidth="1.5">
                <path d="M4 40L12 30L20 35L28 20L36 25L44 10" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 40L44 10" stroke="#9CA3AF" strokeWidth="1" strokeDasharray="2,2" />
              </svg>
              <p className="text-gray-500 font-medium">Revenue Chart Visualization</p>
              <p className="text-sm text-gray-400">Last {selectedPeriod} performance</p>
            </div>
          </div>
        </div>

        {/* Occupancy Chart */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-[#101828] mb-4">Space Utilization</h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl">
            <div className="text-center">
              <svg className="mx-auto mb-4" width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="#9CA3AF" strokeWidth="1.5">
                <rect x="6" y="20" width="8" height="20" rx="2" />
                <rect x="18" y="12" width="8" height="28" rx="2" />
                <rect x="30" y="16" width="8" height="24" rx="2" />
              </svg>
              <p className="text-gray-500 font-medium">Occupancy Visualization</p>
              <p className="text-sm text-gray-400">Floor utilization overview</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-[#101828] mb-4">Recent Transactions</h3>
        <div className="space-y-3">
          {recentTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    transaction.type === "revenue" ? "bg-green-100" : "bg-blue-100"
                  }`}
                >
                  <span className="text-sm font-medium">
                    {transaction.type === "revenue" ? "📊" : "💳"}
                  </span>
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
                  {transaction.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}