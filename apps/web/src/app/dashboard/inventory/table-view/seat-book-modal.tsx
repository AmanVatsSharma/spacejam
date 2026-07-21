"use client";

/**
 * File:        apps/web/src/app/dashboard/inventory/table-view/seat-book-modal.tsx
 * Module:      Web · Dashboard · Inventory · Seat Book Modal
 * Purpose:     Book a seat for a date range — sets seat status to RESERVED
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-21
 */

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useUpdateSeat } from "@/hooks/use-inventory";

export interface SeatBookModalProps {
  open: boolean;
  onClose: () => void;
  seatId: string;
  seatName: string;
}

const emptyForm = {
  guestName: "",
  guestEmail: "",
  dateFrom: "",
  dateTo: "",
  notes: "",
};

export function SeatBookModal({ open, onClose, seatId, seatName }: SeatBookModalProps) {
  const [form, setForm] = useState(emptyForm);
  const [touched, setTouched] = useState(false);

  const { updateSeat, loading: booking } = useUpdateSeat();

  // Reset form when modal opens/closes.
  useEffect(() => {
    if (open) {
      const today = new Date().toISOString().split("T")[0];
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      setForm({ ...emptyForm, dateFrom: today, dateTo: tomorrow });
      setTouched(false);
    }
  }, [open]);

  if (!open) return null;

  const update = (field: keyof typeof emptyForm, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);

    if (!form.guestName.trim()) {
      toast.error("Guest name is required");
      return;
    }
    if (!form.guestEmail.trim()) {
      toast.error("Guest email is required");
      return;
    }
    if (!form.dateFrom) {
      toast.error("Start date is required");
      return;
    }
    if (!form.dateTo) {
      toast.error("End date is required");
      return;
    }
    if (form.dateTo < form.dateFrom) {
      toast.error("End date must be on or after start date");
      return;
    }

    try {
      const result = await updateSeat({
        id: seatId,
        input: { status: "RESERVED" },
      });

      if (result) {
        toast.success(`Seat "${seatName}" booked successfully`);
        onClose();
      } else {
        toast.error("Could not book the seat. Please try again.");
      }
    } catch (err) {
      toast.error(
        `Failed to book seat: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[480px] bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-start justify-between">
          <div>
            <h2 className="text-[20px] font-bold text-gray-900">Book Seat</h2>
            <p className="text-[14px] text-gray-500 mt-1">
              Reserve <span className="font-medium text-gray-700">{seatName}</span> for a guest
            </p>
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

        {/* Form */}
        <form className="p-6 overflow-y-auto flex flex-col gap-5" onSubmit={handleSubmit}>
          {/* Seat (display only) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-gray-700">Seat</label>
            <div className="px-4 py-3 bg-gray-50 rounded-lg text-[14px] text-gray-900 border border-gray-100">
              {seatName}
            </div>
          </div>

          {/* Guest Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-gray-700">
              Guest Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Enter guest name"
              className="px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-colors"
              value={form.guestName}
              onChange={(e) => update("guestName", e.target.value)}
            />
            {touched && !form.guestName.trim() && (
              <span className="text-[12px] text-red-500">Guest name is required</span>
            )}
          </div>

          {/* Guest Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-gray-700">
              Guest Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              placeholder="guest@example.com"
              className="px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-colors"
              value={form.guestEmail}
              onChange={(e) => update("guestEmail", e.target.value)}
            />
            {touched && !form.guestEmail.trim() && (
              <span className="text-[12px] text-red-500">Guest email is required</span>
            )}
          </div>

          {/* Date From / Date To */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-gray-700">
                Date From <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                className="px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-colors"
                value={form.dateFrom}
                onChange={(e) => update("dateFrom", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-gray-700">
                Date To <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                className="px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-colors"
                value={form.dateTo}
                onChange={(e) => update("dateTo", e.target.value)}
              />
            </div>
          </div>
          {touched && form.dateTo < form.dateFrom && (
            <span className="text-[12px] text-red-500 -mt-3">End date must be on or after start date</span>
          )}

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-gray-700">Notes (optional)</label>
            <textarea
              placeholder="Any additional notes..."
              rows={3}
              className="px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-colors resize-none"
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
            />
          </div>

          {/* Footer */}
          <div className="flex gap-4 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 text-[14px] font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              disabled={booking}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-[#FF6A2F] text-white text-[14px] font-semibold rounded-lg hover:bg-[#E55A20] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={booking}
            >
              {booking && (
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                  <path d="M22 12a10 10 0 01-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              )}
              {booking ? "Booking…" : "Book Seat"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
