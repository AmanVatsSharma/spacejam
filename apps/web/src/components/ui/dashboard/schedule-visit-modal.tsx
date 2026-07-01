"use client";

import React from "react";

interface ScheduleVisitModalProps {
  open: boolean;
  onClose: () => void;
}

export function ScheduleVisitModal({ open, onClose }: ScheduleVisitModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-[500px] bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-[20px] font-bold text-gray-900">Schedule Visit</h2>
        </div>

        <div className="p-6 overflow-y-auto flex flex-col gap-5 max-h-[70vh]">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-gray-700">Lead Name</label>
            <input type="text" defaultValue="StartupX" className="px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-colors" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-gray-700">Date</label>
            <input type="text" placeholder="dd/mm/yyyy" className="px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-colors" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-gray-700">Time Slot</label>
            <input type="text" defaultValue="11:00 AM-12:00 PM" className="px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-colors" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-gray-700">Center</label>
            <input type="text" defaultValue="Mumbai" className="px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-colors" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-gray-700">Assigned Staff</label>
            <input type="text" defaultValue="CM Rahul" className="px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-colors" />
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
            className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 text-[14px] font-semibold rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button className="flex-1 py-3 bg-[#FF6A2F] text-white text-[14px] font-semibold rounded-lg hover:bg-[#E55A20] transition-colors">
            Confirm Visit
          </button>
        </div>
      </div>
    </div>
  );
}
