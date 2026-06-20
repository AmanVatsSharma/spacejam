/**
 * File:        apps/web/src/app/dashboard/revenue/invoices/page.tsx
 * Module:      Web · Dashboard · Revenue · Invoices
 * Purpose:     Invoices listing with tab navigation
 *
 * Exports:
 *   - InvoicesPage — invoices list with discounts tab
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-07
 */

"use client";

import { useState } from "react";

interface Invoice {
  id: string;
  client: string;
  amount: string;
  date: string;
  status: "paid" | "pending" | "overdue";
  dueDate?: string;
}

interface Discount {
  id: string;
  code: string;
  percentage: number;
  amount: string;
  description: string;
  valid: boolean;
}

const mockInvoices: Invoice[] = [
  { id: "INV-001", client: "TechCorp India", amount: "₹45,000", date: "May 28, 2026", status: "paid", dueDate: "May 15, 2026" },
  { id: "INV-002", client: "StartupXYZ", amount: "₹28,500", date: "May 25, 2026", status: "pending", dueDate: "June 10, 2026" },
  { id: "INV-003", client: "Design Studio", amount: "₹32,000", date: "May 20, 2026", status: "overdue", dueDate: "May 10, 2026" },
  { id: "INV-004", client: "Freelancer Co.", amount: "₹15,000", date: "May 18, 2026", status: "paid", dueDate: "May 5, 2026" },
];

const discounts: Discount[] = [
  { id: "DSC001", code: "WELCOME10", percentage: 10, amount: "₹1,500", description: "First month 10% off", valid: true },
  { id: "DSC002", code: "YEAR20", percentage: 20, amount: "₹4,000", description: "Annual membership 20% off", valid: true },
  { id: "DSC003", code: "TEAM15", percentage: 15, amount: "₹3,000", description: "Team booking discount", valid: false },
];

const statusStyles = {
  paid: "bg-green-100 text-green-700 border-green-200",
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  overdue: "bg-red-100 text-red-700 border-red-200",
};

export default function InvoicesPage() {
  const [activeTab, setActiveTab] = useState<"invoices" | "discounts">("invoices");

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="bg-white rounded-2xl shadow-sm p-6 flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold text-[#101828]">Invoices</h1>
          <p className="text-[#4A5565]">Manage and track all your invoices</p>
        </div>
        <button className="flex items-center gap-2 bg-[#FF6A2F] text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-[#FF6A3D] transition-colors shadow-sm">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M8 3V13M3 8H13" />
          </svg>
          <span>Create Invoice</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm w-fit">
        <button
          onClick={() => setActiveTab("invoices")}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "invoices"
              ? "bg-[#FF6A2F] text-white"
              : "text-[#4A5565] hover:bg-gray-100"
          }`}
        >
          Invoices
        </button>
        <button
          onClick={() => setActiveTab("discounts")}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "discounts"
              ? "bg-[#FF6A2F] text-white"
              : "text-[#4A5565] hover:bg-gray-100"
          }`}
        >
          Discounts
        </button>
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
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusStyles[invoice.status]}`}>
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
      )}

      {/* Discounts Grid */}
      {activeTab === "discounts" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {discounts.map((discount) => (
            <div key={discount.id} className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-[#101828] mb-1">{discount.code}</h3>
                  <p className="text-sm text-[#4A5565]">{discount.description}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  discount.valid ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                }`}>
                  {discount.valid ? "Active" : "Expired"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[#4A5565]">{discount.percentage}% off</span>
                <span className="text-sm font-medium text-[#101828]">Max {discount.amount}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}