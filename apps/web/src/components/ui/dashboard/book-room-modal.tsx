"use client";

import React from "react";

interface BookRoomModalProps {
  open: boolean;
  onClose: () => void;
}

export function BookRoomModal({ open, onClose }: BookRoomModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm transition-opacity duration-200" onClick={onClose}>
      <div
        className="w-full max-w-[500px] bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden transition-all duration-200 scale-100 opacity-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-[20px] font-bold text-gray-900">Book Meeting Room</h2>
        </div>

        <div className="p-6 overflow-y-auto flex flex-col gap-5 max-h-[70vh]">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-gray-700">Select Room</label>
            <div className="relative">
              <select className="w-full px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-colors appearance-none pr-10">
                <option value="">Select a room...</option>
                <option value="room1">Meeting Room 1</option>
                <option value="room2">Meeting Room 2</option>
                <option value="room3">Meeting Room 3</option>
                <option value="boardroom">Boardroom A</option>
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-gray-700">Date</label>
            <input type="date" className="px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-colors" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-gray-700">Start Time</label>
              <input type="time" className="px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-colors" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-gray-700">End Time</label>
              <input type="time" className="px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-colors" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-gray-700">Meeting Title / Purpose</label>
            <input type="text" placeholder="e.g. Monthly Sync" className="px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-colors" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-gray-700">Attendees</label>
            <input type="number" placeholder="Number of people" className="px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-colors" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-gray-700">Special Requirements</label>
            <textarea 
              placeholder="e.g. Projector, Whiteboard, Coffee..." 
              rows={3}
              className="px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-colors resize-none" 
            />
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex gap-4">
          <button 
            onClick={onClose}
            className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 text-[14px] font-semibold rounded-lg hover:bg-gray-50 transition-all active:scale-[0.97]"
          >
            Cancel
          </button>
          <button className="flex-1 py-3 bg-[#FF6A2F] text-white text-[14px] font-semibold rounded-lg hover:bg-[#E55A20] transition-all active:scale-[0.97]">
            Confirm Booking
          </button>
        </div>
      </div>
    </div>
  );
}
