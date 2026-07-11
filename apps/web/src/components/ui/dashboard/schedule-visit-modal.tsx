"use client";

import React, { useState } from "react";
import { useMutation } from "@apollo/client";
import { toast } from "sonner";
import { UPDATE_LEAD } from "@/lib/apollo/operations";

interface ScheduleVisitModalProps {
  open: boolean;
  onClose: () => void;
  /** Lead to schedule the visit against. If absent, submit is rejected with a toast. */
  leadId?: string;
}

export function ScheduleVisitModal({ open, onClose, leadId }: ScheduleVisitModalProps) {
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("11:00 AM-12:00 PM");
  const [saving, setSaving] = useState(false);

  const [updateLead] = useMutation(UPDATE_LEAD);

  if (!open) return null;

  const handleConfirm = async () => {
    if (!leadId) {
      toast.error("No lead selected");
      return;
    }
    // Use the selected date (or now) as the lastContact timestamp.
    const visitDate = date ? new Date(date) : new Date();
    const isoDate = visitDate.toISOString();
    const notes = `Visit scheduled: ${date || "today"} ${timeSlot}`.trim();
    setSaving(true);
    try {
      const { errors } = await updateLead({
        variables: { id: leadId, input: { lastContact: isoDate, notes } },
      });
      if (errors && errors.length) {
        toast.error(errors[0].message);
        return;
      }
      toast.success("Visit scheduled");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to schedule visit");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm transition-opacity duration-200" onClick={onClose}>
      <div
        className="w-full max-w-[500px] bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden transition-all duration-200 scale-100 opacity-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-[20px] font-bold text-gray-900">Schedule Visit</h2>
        </div>

        <div className="p-6 overflow-y-auto flex flex-col gap-5 max-h-[70vh]">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-gray-700">Lead Name</label>
            <input type="text" defaultValue="StartupX" className="px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-all duration-200" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-gray-700">Date</label>
            <input type="date" placeholder="dd/mm/yyyy" className="px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-all duration-200" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-gray-700">Time Slot</label>
            <input type="text" className="px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-all duration-200" value={timeSlot} onChange={(e) => setTimeSlot(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-gray-700">Center</label>
            <input type="text" defaultValue="Mumbai" className="px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-all duration-200" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-gray-700">Assigned Staff</label>
            <input type="text" defaultValue="CM Rahul" className="px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-all duration-200" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-gray-700">Notes</label>
            <textarea 
              placeholder="Add any special notes..." 
              rows={3}
              className="px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-colors resize-none" 
            />
          </div>

          <div className="flex items-center gap-2 p-4 bg-[#FFF6F5] border border-[#FFD9D4] rounded-lg text-[#FF4D4F] text-[13px] font-medium mt-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Conflict detected: Another visit is scheduled at this time.
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex gap-4">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 text-[14px] font-semibold rounded-lg hover:bg-gray-50 transition-all duration-200 active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={saving}
            className="flex-1 py-3 bg-[#FF6A2F] text-white text-[14px] font-semibold rounded-lg hover:bg-[#E55A20] transition-all duration-200 active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? "Scheduling..." : "Confirm Visit"}
          </button>
        </div>
      </div>
    </div>
  );
}
