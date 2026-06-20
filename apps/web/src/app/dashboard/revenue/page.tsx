/**
 * File:        apps/web/src/app/dashboard/revenue/page.tsx
 * Module:      Web · Dashboard · Revenue Page
 * Purpose:     Default revenue view = invoices. The sub-tab nav
 *              (Invoices / Deposit / Contracts) is rendered in the global
 *              dashboard header — see `dashboard/layout.tsx`. The deposit
 *              and contract views live in sibling routes under this folder.
 *
 * Exports:
 *   - RevenuePage — revenue/invoices view
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-20
 */

"use client";

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

export default function RevenuePage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="bg-white rounded-2xl shadow-sm p-6 flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold text-[#101828]">Revenue</h1>
          <p className="text-[#4A5565]">Track your income, invoices, and payment status</p>
        </div>
        <button className="flex items-center gap-2 bg-[#FF6A2F] text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-[#E55A26] transition-colors shadow-sm">
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

      {/* Invoices Table */}
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
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A2F] focus:border-transparent w-64"
              />
            </div>
            <select className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A2F] focus:border-transparent">
              <option value="">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
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
                    <button className="text-[#FF6A2F] text-sm font-medium hover:underline">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
