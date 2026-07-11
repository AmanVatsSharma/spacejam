"use client";

import React from "react";

interface SendProposalModalProps {
  open: boolean;
  onClose: () => void;
}

export function SendProposalModal({ open, onClose }: SendProposalModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm transition-opacity duration-200" onClick={onClose}>
      <div
        className="w-full max-w-[600px] bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden transition-all duration-200 scale-100 opacity-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-[20px] font-bold text-gray-900">Send Proposal</h2>
        </div>

        <div className="p-6 overflow-y-auto flex flex-col gap-6 max-h-[70vh]">
          <div className="flex flex-col gap-1.5">
            <label className="text-[14px] font-medium text-gray-700">Template Selection</label>
            <input type="text" className="px-4 py-3 bg-white border border-gray-200 rounded-lg text-[14px] text-gray-900 outline-none focus:border-[#FF6A2F] focus:ring-1 focus:ring-[#FF6A2F] transition-all" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[14px] font-medium text-gray-700">Pricing (₹/month)</label>
              <input type="text" defaultValue="5000" className="px-4 py-3 bg-white border border-gray-200 rounded-lg text-[14px] text-gray-900 outline-none focus:border-[#FF6A2F] focus:ring-1 focus:ring-[#FF6A2F] transition-all" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[14px] font-medium text-gray-700">Duration (months)</label>
              <input type="text" defaultValue="6" className="px-4 py-3 bg-white border border-gray-200 rounded-lg text-[14px] text-gray-900 outline-none focus:border-[#FF6A2F] focus:ring-1 focus:ring-[#FF6A2F] transition-all" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[14px] font-medium text-gray-700">Proposal Notes</label>
            <textarea 
              placeholder="Add any custom notes for this proposal..." 
              rows={4}
              className="px-4 py-3 bg-white border border-gray-200 rounded-lg text-[14px] text-gray-900 outline-none focus:border-[#FF6A2F] focus:ring-1 focus:ring-[#FF6A2F] transition-all resize-none" 
            />
          </div>

          <div className="bg-[#F8FAFC] border border-gray-100 rounded-xl p-5 flex flex-col gap-2">
            <span className="text-[12px] font-bold text-gray-500 tracking-wide uppercase">PREVIEW</span>
            <div className="text-[14px] text-gray-600 flex flex-col gap-1 mt-1">
              <p><strong className="font-semibold text-gray-700">Package:</strong> Hot Desk Package</p>
              <p><strong className="font-semibold text-gray-700">Price:</strong> ₹5,000/month</p>
              <p><strong className="font-semibold text-gray-700">Duration:</strong> 6 months</p>
              <p><strong className="font-semibold text-gray-700">Includes:</strong> High-speed WiFi, Meeting room access, Printing credits</p>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
          <button className="flex-1 py-3 px-4 bg-white border border-gray-200 text-gray-700 text-[14px] font-semibold rounded-lg hover:bg-gray-50 transition-all duration-200 active:scale-[0.97]">
            Preview PDF
          </button>
          <div className="flex flex-1 gap-3">
            <button 
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-white border border-gray-200 text-gray-700 text-[14px] font-semibold rounded-lg hover:bg-gray-50 transition-all duration-200 active:scale-[0.97]"
            >
              Cancel
            </button>
            <button className="flex-1 py-3 px-4 bg-[#FF6A2F] text-white text-[14px] font-semibold rounded-lg hover:bg-[#E55A20] transition-all duration-200 active:scale-[0.97] flex items-center justify-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7l9 6 9-6" />
              </svg>
              Send Proposal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
