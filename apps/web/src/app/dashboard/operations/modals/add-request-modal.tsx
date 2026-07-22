"use client";

/**
 * File:        apps/web/src/app/dashboard/operations/modals/add-request-modal.tsx
 * Module:      Web · Dashboard · Operations · Add Request Modal
 * Purpose:     Controlled form to create a support request via useCreateRequest.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-08
 */

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useCreateRequest } from "@/hooks/use-operations";

export interface AddRequestModalProps {
  open: boolean;
  onClose: () => void;
}

const REQUEST_TYPES: { value: string; label: string }[] = [
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "IT_SUPPORT", label: "IT Support" },
  { value: "CLEANING", label: "Cleaning" },
  { value: "OTHER", label: "Other" },
];

const URGENCIES: { value: string; label: string }[] = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
];

const emptyForm = {
  type: "MAINTENANCE",
  title: "",
  description: "",
  urgency: "MEDIUM",
  dueDate: "",
};

export function AddRequestModal({ open, onClose }: AddRequestModalProps) {
  const [form, setForm] = useState(emptyForm);
  const [touched, setTouched] = useState(false);

  const { create, saving } = useCreateRequest();

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

    if (!form.title.trim()) {
      toast.error("Request title is required");
      return;
    }
    if (!form.description.trim()) {
      toast.error("Please describe the request");
      return;
    }

    const input: Record<string, unknown> = {
      type: form.type,
      title: form.title.trim(),
      description: form.description.trim(),
      urgency: form.urgency,
    };
    if (form.dueDate) input.dueDate = form.dueDate;

    try {
      const result = await create(input);
      if (result) {
        toast.success("Request submitted successfully");
        onClose();
      } else {
        toast.error("Failed to submit request");
      }
    } catch (err) {
      toast.error(
        `Failed to submit request: ${err instanceof Error ? err.message : "Unknown error"}`,
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
        className="w-full max-w-[520px] bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-start justify-between">
          <div>
            <h2 className="text-[20px] font-bold text-gray-900">New Request</h2>
            <p className="text-[14px] text-gray-500 mt-1">Submit a maintenance, IT or service request.</p>
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
          {/* Type + Urgency */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-gray-700">Request Type</label>
              <div className="relative">
                <select
                  className={`${inputCls} appearance-none pr-10`}
                  value={form.type}
                  onChange={(e) => update("type", e.target.value)}
                >
                  {REQUEST_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
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
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-gray-700">Urgency</label>
              <div className="relative">
                <select
                  className={`${inputCls} appearance-none pr-10`}
                  value={form.urgency}
                  onChange={(e) => update("urgency", e.target.value)}
                >
                  {URGENCIES.map((u) => (
                    <option key={u.value} value={u.value}>
                      {u.label}
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

          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-gray-700">Title</label>
            <input
              type="text"
              placeholder="e.g. Air conditioner not cooling"
              className={inputCls}
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
            />
            {touched && !form.title.trim() && (
              <span className="text-[12px] text-red-500">Title is required</span>
            )}
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-gray-700">Description</label>
            <textarea
              placeholder="Describe the issue in detail..."
              rows={4}
              className={`${inputCls} resize-none`}
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
            />
            {touched && !form.description.trim() && (
              <span className="text-[12px] text-red-500">Description is required</span>
            )}
          </div>

          {/* Due date */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-gray-700">Due Date (optional)</label>
            <input
              type="date"
              className={inputCls}
              value={form.dueDate}
              onChange={(e) => update("dueDate", e.target.value)}
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
              {saving ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
