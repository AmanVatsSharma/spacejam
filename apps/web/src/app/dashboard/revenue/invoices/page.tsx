"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { toast } from "sonner";
import {
  GET_INVOICES,
  DELETE_INVOICE,
  MARK_INVOICE_PAID,
  GET_DISCOUNTS,
  CREATE_DISCOUNT,
  UPDATE_DISCOUNT,
  DELETE_DISCOUNT,
} from "@/lib/apollo/operations";
import { normalizeStatus, invoiceStatusLabel } from "@/lib/revenue-status";
import { GenerateInvoiceModal } from "@/components/ui/dashboard/generate-invoice-modal";

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
  maxAmount?: number;
  description?: string;
  isActive: boolean;
  validFrom?: string;
  validUntil?: string;
  minOrderAmount?: number;
  usageLimit?: number;
  usedCount: number;
  applicableTo?: string;
  centerId?: string;
  createdAt: string;
  updatedAt: string;
}

const statusStyles: Record<string, string> = {
  PAID: "bg-green-100 text-green-700 border-green-200",
  SENT: "bg-yellow-100 text-yellow-700 border-yellow-200",
  DRAFT: "bg-gray-100 text-gray-700 border-gray-200",
  OVERDUE: "bg-red-100 text-red-700 border-red-200",
  CANCELLED: "bg-gray-100 text-gray-500 border-gray-200",
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
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Discounts tab state
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [discountForm, setDiscountForm] = useState({
    code: "",
    percentage: "",
    maxAmount: "",
    description: "",
    isActive: true,
    validFrom: "",
    validUntil: "",
    minOrderAmount: "",
    usageLimit: "",
    applicableTo: "",
  });

  const { data: invoiceData, loading: invoiceLoading, error: invoiceError } = useQuery<{ invoices: Invoice[] }>(GET_INVOICES, {
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });

  const { data: discountData, loading: discountLoading, refetch: refetchDiscounts } = useQuery<{ discounts: Discount[] }>(GET_DISCOUNTS, {
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });

  const [deleteInvoice] = useMutation(DELETE_INVOICE, {
    refetchQueries: [{ query: GET_INVOICES }],
  });

  const [markInvoicePaid] = useMutation(MARK_INVOICE_PAID, {
    refetchQueries: [{ query: GET_INVOICES }],
  });

  const [createDiscount] = useMutation(CREATE_DISCOUNT, {
    refetchQueries: [{ query: GET_DISCOUNTS }],
  });

  const [updateDiscount] = useMutation(UPDATE_DISCOUNT, {
    refetchQueries: [{ query: GET_DISCOUNTS }],
  });

  const [deleteDiscount] = useMutation(DELETE_DISCOUNT, {
    refetchQueries: [{ query: GET_DISCOUNTS }],
  });

  const invoices = invoiceData?.invoices ?? [];
  const discounts = discountData?.discounts ?? [];

  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      const q = search.trim().toLowerCase();
      const matchesQuery =
        q.length === 0 ||
        inv.invoiceNumber?.toLowerCase().includes(q) ||
        inv.customerName?.toLowerCase().includes(q) ||
        inv.customerEmail?.toLowerCase().includes(q);
      const matchesStatus = !statusFilter || normalizeStatus(inv.status) === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [invoices, search, statusFilter]);

  const resetDiscountForm = () => {
    setDiscountForm({
      code: "",
      percentage: "",
      maxAmount: "",
      description: "",
      isActive: true,
      validFrom: "",
      validUntil: "",
      minOrderAmount: "",
      usageLimit: "",
      applicableTo: "",
    });
    setEditingDiscount(null);
  };

  const openCreateDiscount = () => {
    resetDiscountForm();
    setShowDiscountModal(true);
  };

  const openEditDiscount = (discount: Discount) => {
    setEditingDiscount(discount);
    setDiscountForm({
      code: discount.code,
      percentage: String(discount.percentage),
      maxAmount: discount.maxAmount != null ? String(discount.maxAmount) : "",
      description: discount.description ?? "",
      isActive: discount.isActive,
      validFrom: discount.validFrom ? discount.validFrom.slice(0, 10) : "",
      validUntil: discount.validUntil ? discount.validUntil.slice(0, 10) : "",
      minOrderAmount: discount.minOrderAmount != null ? String(discount.minOrderAmount) : "",
      usageLimit: discount.usageLimit != null ? String(discount.usageLimit) : "",
      applicableTo: discount.applicableTo ?? "",
    });
    setShowDiscountModal(true);
  };

  const handleDiscountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discountForm.code.trim()) {
      toast.error("Discount code is required");
      return;
    }
    const percentage = parseFloat(discountForm.percentage);
    if (isNaN(percentage) || percentage <= 0 || percentage > 100) {
      toast.error("Percentage must be between 0 and 100");
      return;
    }

    const input: Record<string, unknown> = {
      code: discountForm.code.trim().toUpperCase(),
      percentage,
      isActive: discountForm.isActive,
    };

    if (discountForm.maxAmount) input.maxAmount = parseFloat(discountForm.maxAmount);
    if (discountForm.description) input.description = discountForm.description;
    if (discountForm.validFrom) input.validFrom = new Date(discountForm.validFrom);
    if (discountForm.validUntil) input.validUntil = new Date(discountForm.validUntil);
    if (discountForm.minOrderAmount) input.minOrderAmount = parseFloat(discountForm.minOrderAmount);
    if (discountForm.usageLimit) input.usageLimit = parseInt(discountForm.usageLimit, 10);
    if (discountForm.applicableTo) input.applicableTo = discountForm.applicableTo;

    try {
      if (editingDiscount) {
        await updateDiscount({ variables: { id: editingDiscount.id, input } });
        toast.success("Discount updated");
      } else {
        await createDiscount({ variables: { input } });
        toast.success("Discount created");
      }
      setShowDiscountModal(false);
      resetDiscountForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save discount");
    }
  };

  const handleDeleteDiscount = async (id: string) => {
    if (!confirm("Delete this discount?")) return;
    try {
      await deleteDiscount({ variables: { id } });
      toast.success("Discount deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete discount");
    }
  };

  const handleMarkPaid = async (id: string) => {
    try {
      await markInvoicePaid({ variables: { id } });
      toast.success("Invoice marked as paid");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to mark invoice as paid");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this invoice?')) return;
    try {
      await deleteInvoice({ variables: { id } });
      toast.success("Invoice deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete invoice");
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
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-[#FF6A2F] text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-[#FF6A3D] transition-all shadow-sm active:scale-[0.97] transition-transform duration-150"
        >
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
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === "invoices"
              ? "bg-[#FF6A2F] text-white"
              : "text-[#4A5565] hover:bg-gray-100"
            }`}
        >
          Invoices
        </button>
        <button
          onClick={() => setActiveTab("discounts")}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === "discounts"
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
              <option value="DRAFT">Draft</option>
              <option value="SENT">Sent</option>
              <option value="PAID">Paid</option>
              <option value="OVERDUE">Overdue</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div className="overflow-x-auto">
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
                {invoiceLoading && filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                      Loading invoices…
                    </td>
                  </tr>
                ) : invoiceError && filtered.length === 0 ? (
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
                    <tr key={invoice.id} className="transition-colors duration-150 hover:bg-[#F9FAFB]">
                      <td className="px-6 py-4 text-sm font-medium text-[#101828]">{invoice.invoiceNumber}</td>
                      <td className="px-6 py-4 text-sm text-[#4A5565]">{invoice.customerName}</td>
                      <td className="px-6 py-4 text-sm font-medium text-[#101828]">{formatCurrency(invoice.totalAmount)}</td>
                      <td className="px-6 py-4 text-sm text-[#4A5565]">{formatDate(invoice.issueDate)}</td>
                      <td className="px-6 py-4 text-sm text-[#4A5565]">{formatDate(invoice.dueDate)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusStyles[normalizeStatus(invoice.status)] ?? statusStyles.DRAFT}`}>
                          {invoiceStatusLabel[normalizeStatus(invoice.status)] ?? invoice.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 flex gap-2">
                        {normalizeStatus(invoice.status) !== "PAID" && (
                          <button
                            onClick={() => handleMarkPaid(invoice.id)}
                            className="text-green-600 text-sm font-medium hover:underline transition-all active:scale-[0.97] transition-transform duration-150"
                          >
                            Mark Paid
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(invoice.id)}
                          className="text-red-500 text-sm font-medium hover:underline transition-all active:scale-[0.97] transition-transform duration-150"
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
        </div>
      )}

      {/* Discounts Grid */}
      {activeTab === "discounts" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#4A5565]">
              {discounts.length} discount{discounts.length !== 1 ? 's' : ''} available
            </p>
            <button
              onClick={openCreateDiscount}
              className="flex items-center gap-2 bg-[#FF6A2F] text-white px-4 py-2 rounded-xl font-medium text-sm hover:bg-[#FF6A3D] transition-all shadow-sm active:scale-[0.97] transition-transform duration-150"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M8 3V13M3 8H13" />
              </svg>
              <span>Add Discount</span>
            </button>
          </div>

          {discountLoading && discounts.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm p-12 text-center text-gray-400">
              Loading discounts…
            </div>
          ) : discounts.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm p-12 text-center text-gray-400">
              No discounts found. Click "Add Discount" to create one.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {discounts.map((discount) => (
                <div
                  key={discount.id}
                  className={`bg-white rounded-2xl shadow-sm p-6 transition-all duration-200 ${!discount.isActive ? "opacity-60" : "hover:shadow-md hover:-translate-y-0.5"
                    }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-[#101828] mb-1">{discount.code}</h3>
                      <p className="text-sm text-[#4A5565]">{discount.description || "No description"}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${discount.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                        }`}>
                        {discount.isActive ? "Active" : "Inactive"}
                      </span>
                      {!discount.isActive && (
                        <span className="text-xs text-gray-400 line-through">Expired</span>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between mb-4">
                    <span className="text-sm text-[#4A5565]">{discount.percentage}% off</span>
                    <span className="text-sm font-medium text-[#101828]">
                      {discount.maxAmount ? `Max ${formatCurrency(discount.maxAmount)}` : "No max"}
                    </span>
                  </div>
                  {discount.validFrom || discount.validUntil ? (
                    <div className="text-xs text-[#4A5565] mb-4">
                      {discount.validFrom && <>From {formatDate(discount.validFrom)}</>}
                      {discount.validFrom && discount.validUntil && <> – </>}
                      {discount.validUntil && <>Until {formatDate(discount.validUntil)}</>}
                    </div>
                  ) : null}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-400">
                      Used {discount.usedCount}{discount.usageLimit ? ` / ${discount.usageLimit}` : ""}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditDiscount(discount)}
                        className="text-[#FF6A2F] text-sm font-medium hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteDiscount(discount.id)}
                        className="text-red-500 text-sm font-medium hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Create/Edit Discount Modal */}
          {showDiscountModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-[#101828] mb-4">
                    {editingDiscount ? "Edit Discount" : "Add Discount"}
                  </h2>
                  <form onSubmit={handleDiscountSubmit} className="flex flex-col gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#4A5565] mb-1">Code *</label>
                      <input
                        type="text"
                        value={discountForm.code}
                        onChange={(e) => setDiscountForm({ ...discountForm, code: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A2F]"
                        placeholder="e.g. WELCOME10"
                        disabled={!!editingDiscount}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#4A5565] mb-1">Percentage (%) *</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={discountForm.percentage}
                        onChange={(e) => setDiscountForm({ ...discountForm, percentage: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A2F]"
                        placeholder="e.g. 10"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#4A5565] mb-1">Max Amount (INR)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={discountForm.maxAmount}
                        onChange={(e) => setDiscountForm({ ...discountForm, maxAmount: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A2F]"
                        placeholder="e.g. 1500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#4A5565] mb-1">Description</label>
                      <textarea
                        value={discountForm.description}
                        onChange={(e) => setDiscountForm({ ...discountForm, description: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A2F]"
                        placeholder="Brief description of the discount"
                        rows={2}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        id="isActive"
                        type="checkbox"
                        checked={discountForm.isActive}
                        onChange={(e) => setDiscountForm({ ...discountForm, isActive: e.target.checked })}
                        className="h-4 w-4 rounded border-gray-300 text-[#FF6A2F] focus:ring-[#FF6A2F]"
                      />
                      <label htmlFor="isActive" className="text-sm font-medium text-[#4A5565]">Active</label>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[#4A5565] mb-1">Valid From</label>
                        <input
                          type="date"
                          value={discountForm.validFrom}
                          onChange={(e) => setDiscountForm({ ...discountForm, validFrom: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A2F]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#4A5565] mb-1">Valid Until</label>
                        <input
                          type="date"
                          value={discountForm.validUntil}
                          onChange={(e) => setDiscountForm({ ...discountForm, validUntil: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A2F]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#4A5565] mb-1">Min Order Amount (INR)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={discountForm.minOrderAmount}
                        onChange={(e) => setDiscountForm({ ...discountForm, minOrderAmount: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A2F]"
                        placeholder="Minimum order value to apply"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#4A5565] mb-1">Usage Limit</label>
                      <input
                        type="number"
                        min="0"
                        value={discountForm.usageLimit}
                        onChange={(e) => setDiscountForm({ ...discountForm, usageLimit: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A2F]"
                        placeholder="Max number of uses"
                      />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => { setShowDiscountModal(false); resetDiscountForm(); }}
                        className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-[#4A5565] hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-4 py-2 bg-[#FF6A2F] text-white rounded-lg text-sm font-medium hover:bg-[#FF6A3D]"
                      >
                        {editingDiscount ? "Update" : "Create"} Discount
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Invoice Modal */}
      <GenerateInvoiceModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
}
