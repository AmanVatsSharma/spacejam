/**
 * File:        apps/web/src/app/dashboard/revenue/page.tsx
 * Module:      Web · Dashboard · Revenue Page
 * Purpose:     Revenue tracking, invoices, deposits, and contracts management
 *
 * Exports:
 *   - RevenuePage — revenue page content with tabbed views
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-07
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
  completed: "bg-green-100 text-green-700",
  refunded: "bg-purple-100 text-purple-700",
  active: "bg-green-100 text-green-700",
  expiring: "bg-orange-100 text-orange-700",
  expired: "bg-red-100 text-red-700",
  renewed: "bg-blue-100 text-blue-700",
};

type TabType = "invoices" | "deposits" | "contracts";

interface Deposit {
  id: string;
  clientName: string;
  bookingId: string;
  amount: string;
  depositAmount: string;
  date: string;
  status: "completed" | "pending" | "refunded";
}

const mockDeposits: Deposit[] = [
  { id: "DEP-001", clientName: "TechCorp India", bookingId: "BK-2024-089", amount: "₹45,000", depositAmount: "₹22,500", date: "May 28, 2026", status: "completed" },
  { id: "DEP-002", clientName: "StartupXYZ", bookingId: "BK-2024-088", amount: "₹28,500", depositAmount: "₹14,250", date: "May 25, 2026", status: "completed" },
  { id: "DEP-003", clientName: "Design Studio", bookingId: "BK-2024-087", amount: "₹32,000", depositAmount: "₹16,000", date: "May 20, 2026", status: "pending" },
  { id: "DEP-004", clientName: "Freelancer Co.", bookingId: "BK-2024-086", amount: "₹15,000", depositAmount: "₹7,500", date: "May 18, 2026", status: "completed" },
  { id: "DEP-005", clientName: "Digital Agency", bookingId: "BK-2024-085", amount: "₹50,000", depositAmount: "₹25,000", date: "May 15, 2026", status: "completed" },
  { id: "DEP-006", clientName: "Cloud Services Inc", bookingId: "BK-2024-084", amount: "₹38,000", depositAmount: "₹19,000", date: "May 12, 2026", status: "refunded" },
];

interface Contract {
  id: string;
  clientName: string;
  bookingId: string;
  startDate: string;
  endDate: string;
  amount: string;
  status: "active" | "expiring" | "expired" | "renewed";
}

const mockContracts: Contract[] = [
  { id: "CON-001", clientName: "TechCorp India", bookingId: "BK-2024-089", startDate: "Jun 1, 2026", endDate: "Aug 31, 2026", amount: "₹45,000", status: "active" },
  { id: "CON-002", clientName: "StartupXYZ", bookingId: "BK-2024-088", startDate: "Jun 1, 2026", endDate: "Jul 31, 2026", amount: "₹28,500", status: "expiring" },
  { id: "CON-003", clientName: "Design Studio", bookingId: "BK-2024-087", startDate: "Jun 1, 2026", endDate: "Nov 30, 2026", amount: "₹32,000", status: "active" },
  { id: "CON-004", clientName: "Freelancer Co.", bookingId: "BK-2024-086", startDate: "Jun 1, 2026", endDate: "Jun 30, 2026", amount: "₹15,000", status: "expiring" },
  { id: "CON-005", clientName: "Digital Agency", bookingId: "BK-2024-085", startDate: "Jun 1, 2026", endDate: "Dec 31, 2026", amount: "₹50,000", status: "active" },
];

export default function RevenuePage() {
  const [activeTab, setActiveTab] = useState<TabType>("invoices");

  const tabs: { id: TabType; label: string }[] = [
    { id: "invoices", label: "Invoices" },
    { id: "deposits", label: "Deposit" },
    { id: "contracts", label: "Contracts" },
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
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="7" cy="7" r="5" />
                  <path d="M11 11L14 14" />
                </svg>
                <input
                  type="text"
                  placeholder="Search invoices..."
                  className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7847] focus:border-transparent w-64"
                />
              </div>
              <select className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7847] focus:border-transparent">
                <option value="">All Status</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>
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

      {/* Deposits Table */}
      {activeTab === "deposits" && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="7" cy="7" r="5" />
                  <path d="M11 11L14 14" />
                </svg>
                <input
                  type="text"
                  placeholder="Search deposits..."
                  className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7847] focus:border-transparent w-64"
                />
              </div>
              <select className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7847] focus:border-transparent">
                <option value="">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deposit ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deposit Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mockDeposits.map((deposit) => (
                <tr key={deposit.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-[#101828]">{deposit.id}</td>
                  <td className="px-6 py-4 text-sm text-[#4A5565]">{deposit.clientName}</td>
                  <td className="px-6 py-4 text-sm text-[#4A5565]">{deposit.bookingId}</td>
                  <td className="px-6 py-4 text-sm font-medium text-[#101828]">{deposit.amount}</td>
                  <td className="px-6 py-4 text-sm font-medium text-[#FF7847]">{deposit.depositAmount}</td>
                  <td className="px-6 py-4 text-sm text-[#4A5565]">{deposit.date}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${statusStyles[deposit.status]}`}>
                      {deposit.status}
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

      {/* Contracts Table */}
      {activeTab === "contracts" && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="7" cy="7" r="5" />
                  <path d="M11 11L14 14" />
                </svg>
                <input
                  type="text"
                  placeholder="Search contracts..."
                  className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7847] focus:border-transparent w-64"
                />
              </div>
              <select className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7847] focus:border-transparent">
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="expiring">Expiring</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contract ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mockContracts.map((contract) => (
                <tr key={contract.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-[#101828]">{contract.id}</td>
                  <td className="px-6 py-4 text-sm text-[#4A5565]">{contract.clientName}</td>
                  <td className="px-6 py-4 text-sm text-[#4A5565]">{contract.bookingId}</td>
                  <td className="px-6 py-4 text-sm text-[#4A5565]">{contract.startDate}</td>
                  <td className="px-6 py-4 text-sm text-[#4A5565]">{contract.endDate}</td>
                  <td className="px-6 py-4 text-sm font-medium text-[#101828]">{contract.amount}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${statusStyles[contract.status]}`}>
                      {contract.status}
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
    </div>
  );
}
