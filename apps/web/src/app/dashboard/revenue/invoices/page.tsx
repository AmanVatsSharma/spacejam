"use client";

/**
 * File:        apps/web/src/app/dashboard/revenue/invoices/page.tsx
 * Module:      Web · Dashboard · Revenue · Invoices
 * Purpose:     Invoices listing with tab navigation — wired to live Apollo data
 *
 * Exports:
 *   - InvoicesPage — invoices list with discounts tab
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-06
 */



import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_INVOICES,
  DELETE_INVOICE,
  MARK_INVOICE_PAID,
} from "@/lib/apollo/operations";

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail?: string;
  planName?: string;
  amount: number;
  tax?: number;
  totalAmount: number;
  status: string;
  issueDate: string;
  dueDate: string;
  paidDate?: string | null;
  paymentMethod?: string | null;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface Discount {
  id: string;
  code: string;
  percentage: number;
  amount: string;
  description: string;
  valid: boolean;
}

const discounts: Discount[] = [
  { id: "DSC001", code: "WELCOME10", percentage: 10, amount: "₹1,500", description: "First month 10% off", valid: true },
  { id: "DSC002", code: "YEAR20", percentage: 20, amount: "₹4,000", description: "Annual membership 20% off", valid: true },
  { id: "DSC003", code: "TEAM15", percentage: 15, amount: "₹3,000", description: "Team booking discount", valid: false },
];

const statusStyles: Record<string, string> = {
  Paid: "bg-green-100 text-green-700 border-green-200",
  Sent: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Draft: "bg-gray-100 text-gray-700 border-gray-200",
  Overdue: "bg-red-100 text-red-700 border-red-200",
  Cancelled: "bg-gray-100 text-gray-500 border-gray-200",
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default function InvoicesPage() {
  const [activeTab, setActiveTab] = useState<"invoices" | "discounts">("invoices");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const { data, loading, error } = useQuery<{ invoices: Invoice[] }>(GET_INVOICES, {
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });

  const [deleteInvoice] = useMutation(DELETE_INVOICE, {
    refetchQueries: [{ query: GET_INVOICES }],
  });

  const [markInvoicePaid] = useMutation(MARK_INVOICE_PAID, {
    refetchQueries: [{ query: GET_INVOICES }],
  });

  const invoices = data?.invoices ?? [];

  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      const q = search.trim().toLowerCase();
      const matchesQuery =
        q.length === 0 ||
        inv.invoiceNumber?.toLowerCase().includes(q) ||
        inv.customerName?.toLowerCase().includes(q) ||
        inv.customerEmail?.toLowerCase().includes(q);
      const matchesStatus = !statusFilter || inv.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [invoices, search, statusFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this invoice?')) return;
    try {
      await deleteInvoice({ variables: { id } });
    } catch {
      // handled by Apollo
    }
  };

  const handleMarkPaid = async (id: string) => {
    try {
      await markInvoicePaid({ variables: { id } });
    } catch {
      // handled by Apollo
    }
  };

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
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "invoices"
              ? "bg-[#FF6A2F] text-white"
              : "text-[#4A5565] hover:bg-gray-100"
            }`}
        >
          Invoices
        </button>
        <button
          onClick={() => setActiveTab("discounts")}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "discounts"
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
          {/* Filters */}
          <div className="flex gap-3 p-4 border-b border-gray-100">
            <input
              type="text"
              placeholder="Search invoices..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A2F] focus:border-transparent w-64 bg-white"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#FF6A2F]"
            >
              <option value="">All Status</option>
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Paid">Paid</option>
              <option value="Overdue">Overdue</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    Loading invoices…
                  </td>
                </tr>
              ) : error && filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    Unable to load invoices. Please try again.
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    No invoices found.
                  </td>
                </tr>
              ) : (
                filtered.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-[#101828]">{invoice.invoiceNumber}</td>
                    <td className="px-6 py-4 text-sm text-[#4A5565]">{invoice.customerName}</td>
                    <td className="px-6 py-4 text-sm font-medium text-[#101828]">{formatCurrency(invoice.totalAmount)}</td>
                    <td className="px-6 py-4 text-sm text-[#4A5565]">{formatDate(invoice.issueDate)}</td>
                    <td className="px-6 py-4 text-sm text-[#4A5565]">{formatDate(invoice.dueDate)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusStyles[invoice.status] ?? statusStyles.Draft}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex gap-2">
                      {invoice.status !== "Paid" && (
                        <button
                          onClick={() => handleMarkPaid(invoice.id)}
                          className="text-green-600 text-sm font-medium hover:underline"
                        >
                          Mark Paid
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(invoice.id)}
                        className="text-red-500 text-sm font-medium hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
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
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${discount.valid ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
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
