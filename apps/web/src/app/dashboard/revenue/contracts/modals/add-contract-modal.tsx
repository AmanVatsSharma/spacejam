"use client";

/**
 * File:        apps/web/src/app/dashboard/revenue/contracts/modals/add-contract-modal.tsx
 * Module:      Web · Dashboard · Revenue · Contracts · Add Contract Modal
 * Purpose:     Controlled form to create a contract via the CREATE_CONTRACT
 *              mutation, refetching the GET_CONTRACTS list on success.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-08
 */

import { useEffect, useState } from "react";
import { useMutation } from "@apollo/client";
import { toast } from "sonner";
import { CREATE_CONTRACT, GET_CONTRACTS } from "@/lib/apollo/operations";
import { ClientSelect, type SelectedClient } from "@/components/ui/client-select";

export interface AddContractModalProps {
  open: boolean;
  onClose: () => void;
}

const PAYMENT_FREQUENCIES: { value: string; label: string }[] = [
  { value: "Monthly", label: "Monthly" },
  { value: "Quarterly", label: "Quarterly" },
  { value: "Half-Yearly", label: "Half-Yearly" },
  { value: "Yearly", label: "Yearly" },
];

const emptyForm = {
  customerName: "",
  customerId: "",
  planName: "",
  startDate: "",
  endDate: "",
  amount: "",
  paymentFrequency: "Monthly",
  terms: "",
};

export function AddContractModal({ open, onClose }: AddContractModalProps) {
  const [form, setForm] = useState(emptyForm);
  const [touched, setTouched] = useState(false);

  const [createContract, { loading: saving }] = useMutation(CREATE_CONTRACT, {
    refetchQueries: [{ query: GET_CONTRACTS }],
  });

  // Reset the form whenever the modal is closed.
  useEffect(() => {
    if (!open) {
      setForm(emptyForm);
      setTouched(false);
    }
  }, [open]);

  if (!open) return null;

  const update = (field: keyof typeof emptyForm, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);

    if (!form.customerId.trim() || !form.customerName.trim()) {
      toast.error("Please select a client");
      return;
    }
    if (!form.planName.trim()) {
      toast.error("Plan name is required");
      return;
    }
    if (!form.startDate || !form.endDate) {
      toast.error("Start and end dates are required");
      return;
    }
    if (form.endDate < form.startDate) {
      toast.error("End date must be on or after the start date");
      return;
    }
    const amountNum = Number(form.amount);
    if (!form.amount || Number.isNaN(amountNum) || amountNum <= 0) {
      toast.error("A valid contract amount is required");
      return;
    }

    const input: Record<string, unknown> = {
      customerId: form.customerId.trim(),
      customerName: form.customerName.trim(),
      planName: form.planName.trim(),
      startDate: form.startDate,
      endDate: form.endDate,
      amount: amountNum,
      paymentFrequency: form.paymentFrequency,
    };
    if (form.terms.trim()) input.terms = form.terms.trim();

    try {
      const { errors } = await createContract({ variables: { input } });
      if (errors && errors.length) {
        toast.error(errors[0].message);
        return;
      }
      toast.success("Contract created successfully");
      onClose();
    } catch (err) {
      toast.error(
        `Failed to create contract: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  const inputCls =
    "px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-colors w-full";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[640px] bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-start justify-between">
          <div>
            <h2 className="text-[20px] font-bold text-gray-900">Add New Contract</h2>
            <p className="text-[14px] text-gray-500 mt-1">Create a new customer contract and billing plan.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form className="p-6 overflow-y-auto flex flex-col gap-5" onSubmit={handleSubmit}>
          {/* Customer */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-gray-700">Client</label>
            <ClientSelect
              value={form.customerId}
              onChange={(client: SelectedClient | null) => {
                update("customerId", client?.id || "");
                update("customerName", client?.name || "");
              }}
              placeholder="Search and select a client..."
              required
              error={
                touched && !form.customerId.trim()
                  ? "Please select a client"
                  : undefined
              }
            />
          </div>

          {/* Plan + frequency */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-gray-700">Plan Name</label>
              <input
                type="text"
                placeholder="e.g. Premium Dedicated"
                className={inputCls}
                value={form.planName}
                onChange={(e) => update("planName", e.target.value)}
              />
              {touched && !form.planName.trim() && (
                <span className="text-[12px] text-red-500">Plan name is required</span>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-gray-700">Payment Frequency</label>
              <div className="relative">
                <select
                  className={`${inputCls} appearance-none pr-10`}
                  value={form.paymentFrequency}
                  onChange={(e) => update("paymentFrequency", e.target.value)}
                >
                  {PAYMENT_FREQUENCIES.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                className={inputCls}
                value={form.startDate}
                onChange={(e) => update("startDate", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-gray-700">End Date</label>
              <input
                type="date"
                className={inputCls}
                value={form.endDate}
                onChange={(e) => update("endDate", e.target.value)}
              />
            </div>
          </div>

          {/* Amount */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-gray-700">Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-[14px]">
                ₹
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                className={`${inputCls} pl-8`}
                value={form.amount}
                onChange={(e) => update("amount", e.target.value)}
              />
            </div>
            {touched && (!form.amount || Number.isNaN(Number(form.amount)) || Number(form.amount) <= 0) && (
              <span className="text-[12px] text-red-500">A valid amount is required</span>
            )}
          </div>

          {/* Terms */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-gray-700">Terms (optional)</label>
            <textarea
              placeholder="Contract terms and conditions..."
              rows={4}
              className={`${inputCls} resize-none`}
              value={form.terms}
              onChange={(e) => update("terms", e.target.value)}
            />
          </div>

          {/* Footer */}
          <div className="flex gap-4 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 text-[14px] font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-[#FF6A2F] text-white text-[14px] font-semibold rounded-lg hover:bg-[#E55A20] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={saving}
            >
              {saving && (
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                  <path d="M22 12a10 10 0 01-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              )}
              {saving ? "Creating..." : "Create Contract"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
