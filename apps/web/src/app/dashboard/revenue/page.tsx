/**
 * File:        apps/web/src/app/dashboard/revenue/page.tsx
 * Module:      Web · Dashboard · Revenue Page
 * Purpose:     Revenue tracking, invoices, and financial overview
 *
 * Exports:
 *   - RevenuePage — revenue page content
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-05-28
 */

"use client";

import { useState } from "react";

interface RevenueStat {
  label: string;
  value: string;
  change: string;
  positive: boolean;
}

const revenueStats: RevenueStat[] = [
  { label: "Total Revenue", value: "₹12,45,000", change: "+12.5%", positive: true },
  { label: "This Month", value: "₹1,85,000", change: "+8.2%", positive: true },
  { label: "Outstanding", value: "₹45,000", change: "-5.3%", positive: false },
  { label: "Pending Invoices", value: "12", change: "", positive: true },
];

interface Invoice {
  id: string;
  client: string;
  amount: string;
  date: string;
  status: "paid" | "pending" | "overdue";
}

const mockInvoices: Invoice[] = [
  { id: "INV-001", client: "TechCorp India", amount: "₹45,000", date: "May 28, 2026", status: "paid" },
  { id: "INV-002", client: "StartupXYZ", amount: "₹28,500", date: "May 25, 2026", status: "pending" },
  { id: "INV-003", client: "Design Studio", amount: "₹32,000", date: "May 20, 2026", status: "overdue" },
  { id: "INV-004", client: "Freelancer Co.", amount: "₹15,000", date: "May 18, 2026", status: "paid" },
];

const statusStyles = {
  paid: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  overdue: "bg-red-100 text-red-700",
};

type TabType = "overview" | "invoices" | "payments";

export default function RevenuePage() {
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  const tabs: { id: TabType; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "invoices", label: "Invoices" },
    { id: "payments", label: "Payments" },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="bg-white rounded-2xl shadow-sm p-6 flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold text-[#101828]">Revenue</h1>
          <p className="text-[#4A5565]">Track your income, invoices, and payment status</p>
        </div>
        <button className="flex items-center gap-2 bg-[#FF7847] text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-[#FF6A3D] transition-colors shadow-sm">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M8 3V13M3 8H13" />
          </svg>
          <span>Create Invoice</span>
        </button>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-4 gap-4">
        {revenueStats.map((stat, index) => (
          <div key={index} className="bg-white rounded-2xl shadow-sm p-5">
            <p className="text-sm text-gray-500 mb-2">{stat.label}</p>
            <p className="text-2xl font-bold text-[#101828] mb-1">{stat.value}</p>
            {stat.change && (
              <span className={`text-xs font-medium ${stat.positive ? "text-green-600" : "text-red-600"}`}>
                {stat.change}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-[#FF7847] text-white"
                : "text-[#4A5565] hover:bg-gray-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Invoices Table */}
      {activeTab === "invoices" && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mockInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-[#101828]">{invoice.id}</td>
                  <td className="px-6 py-4 text-sm text-[#4A5565]">{invoice.client}</td>
                  <td className="px-6 py-4 text-sm font-medium text-[#101828]">{invoice.amount}</td>
                  <td className="px-6 py-4 text-sm text-[#4A5565]">{invoice.date}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${statusStyles[invoice.status]}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-[#FF7847] text-sm font-medium hover:underline">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Overview - Placeholder Chart */}
      {activeTab === "overview" && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-[#101828] mb-4">Revenue Trend</h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl">
            <div className="text-center">
              <svg className="mx-auto mb-4" width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="#9CA3AF" strokeWidth="1.5">
                <path d="M6 36L18 24L27 33L42 12" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M36 12H42V18" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-gray-500">Revenue chart visualization</p>
              <p className="text-sm text-gray-400">Chart component coming soon</p>
            </div>
          </div>
        </div>
      )}

      {/* Payments - Placeholder */}
      {activeTab === "payments" && (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="#9CA3AF" strokeWidth="1.5">
              <rect x="4" y="8" width="24" height="16" rx="2" />
              <path d="M4 14H28" />
              <path d="M8 20H12" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">Payment History</h3>
          <p className="text-gray-500">Payment tracking feature under development.</p>
        </div>
      )}
    </div>
  );
}
