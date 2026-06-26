"use client";

import React, { useState } from "react";

export default function ContractsPage() {
  const [activeTab, setActiveTab] = useState("Contracts");
  
  return (
    <div className="flex gap-6 h-[calc(100vh-80px)] font-sans">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 mb-6 flex-shrink-0">
          <h1 className="text-[24px] font-bold text-gray-900 mb-1">Contract Management</h1>
          <p className="text-[14px] text-gray-500">Track potential clients, manage inquiries, and convert them into members.</p>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-[280px]">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input type="text" placeholder="Search..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#FF6A2F]/20 focus:border-[#FF6A2F] transition-all" />
          </div>
          
          <div className="relative">
             <button className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-700 font-medium flex items-center gap-2 hover:bg-gray-50">
               All status
               <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
             </button>
          </div>
          
          <div className="relative">
             <button className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-700 font-medium flex items-center gap-2 hover:bg-gray-50">
               All centers
               <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
             </button>
          </div>
          
          <div className="relative">
             <button className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-700 font-medium flex items-center gap-2 hover:bg-gray-50">
               All assigned
               <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
             </button>
          </div>
          
          <button className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[14px] text-gray-700 font-medium hover:bg-gray-50">
            Clear Filters
          </button>
          
          <button className="ml-auto px-5 py-2.5 bg-[#FF6A2F] text-white rounded-xl text-[14px] font-semibold flex items-center gap-2 hover:bg-[#E55A20] transition-colors shadow-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
            Add Lead
          </button>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6 flex-shrink-0">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 flex flex-col justify-center">
            <h3 className="text-[32px] font-bold text-gray-900 mb-1">125</h3>
            <p className="text-[13px] text-gray-500 mb-2">Total Active Contracts</p>
            <span className="text-[13px] text-[#21A366] font-medium">+12% vs last week</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 flex flex-col justify-center">
            <h3 className="text-[32px] font-bold text-gray-900 mb-1">₹45.2L</h3>
            <p className="text-[13px] text-gray-500 mb-2">Monthly Revenue</p>
            <span className="text-[13px] text-[#21A366] font-medium">+8% vs last week</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 flex flex-col justify-center">
            <h3 className="text-[32px] font-bold text-gray-900 mb-1">12</h3>
            <p className="text-[13px] text-gray-500 mb-2">Expiring This Month</p>
            <span className="text-[13px] text-[#FF6A2F] font-medium">Action Required</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 flex flex-col justify-center">
            <h3 className="text-[32px] font-bold text-gray-900 mb-1">9</h3>
            <p className="text-[13px] text-gray-500 mb-2">Renewals Completed</p>
            <span className="text-[13px] text-[#21A366] font-medium">This Months</span>
          </div>
        </div>

        {/* Status Ribbons */}
        <div className="flex gap-3 mb-6 overflow-x-auto pb-2 flex-shrink-0">
          <button className="flex-1 min-w-[120px] bg-[#FF6A2F] text-white py-4 rounded-xl flex flex-col items-center justify-center transition-all shadow-sm">
            <span className="text-[14px] font-medium mb-1">Active</span>
            <span className="text-[24px] font-bold">2</span>
          </button>
          <button className="flex-1 min-w-[120px] bg-[#FFB703] text-white py-4 rounded-xl flex flex-col items-center justify-center opacity-90 hover:opacity-100 transition-all shadow-sm">
            <span className="text-[14px] font-medium mb-1">Renewal Due</span>
            <span className="text-[24px] font-bold">1</span>
          </button>
          <button className="flex-1 min-w-[120px] bg-[#06D6A0] text-white py-4 rounded-xl flex flex-col items-center justify-center opacity-90 hover:opacity-100 transition-all shadow-sm">
            <span className="text-[14px] font-medium mb-1">Expired</span>
            <span className="text-[24px] font-bold">1</span>
          </button>
          <button className="flex-1 min-w-[120px] bg-[#3A4556] text-white py-4 rounded-xl flex flex-col items-center justify-center opacity-90 hover:opacity-100 transition-all shadow-sm">
            <span className="text-[14px] font-medium mb-1">Upgraded</span>
            <span className="text-[24px] font-bold">1</span>
          </button>
          <button className="flex-1 min-w-[120px] bg-[#EF476F] text-white py-4 rounded-xl flex flex-col items-center justify-center opacity-90 hover:opacity-100 transition-all shadow-sm">
            <span className="text-[14px] font-medium mb-1">Terminated</span>
            <span className="text-[24px] font-bold">0</span>
          </button>
        </div>

        {/* Contracts Table */}
        <div className="bg-white rounded-2xl border border-gray-100 flex-1 overflow-hidden flex flex-col min-h-0">
          <div className="overflow-auto flex-1">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="sticky top-0 bg-white z-10">
                <tr>
                  <th className="py-4 px-6 text-[12px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Lead Name</th>
                  <th className="py-4 px-6 text-[12px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Company</th>
                  <th className="py-4 px-6 text-[12px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Source</th>
                  <th className="py-4 px-6 text-[12px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Interested Plan</th>
                  <th className="py-4 px-6 text-[12px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Assigned To</th>
                  <th className="py-4 px-6 text-[12px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: "Rahul Sharma", company: "Freelancer", source: "Website", plan: "Hot Desk", assigned: "CM Rahul", selected: true },
                  { name: "StartupX", company: "Startup", source: "Referral", plan: "Cabin", assigned: "CM Rahul" },
                  { name: "Ankit", company: "Individual", source: "Walk-in", plan: "Dedicated Desk", assigned: "CM Rahul" },
                  { name: "TechCorp", company: "Enterprise", source: "Website", plan: "Private Office", assigned: "CM Rahul" },
                  { name: "Priya Singh", company: "Freelancer", source: "Referral", plan: "Hot Desk", assigned: "CM Rahul" },
                  { name: "Kabir", company: "Freelancer", source: "Referral", plan: "Hot Desk", assigned: "CM Rahul" },
                  { name: "Shashank", company: "Ux Designer", source: "Walk In", plan: "Hot Desk", assigned: "CM Rahul" },
                  { name: "Ar. Damae", company: "Freelancer", source: "Referral", plan: "Hot Desk", assigned: "CM Rahul" },
                  { name: "Prabhav Singh", company: "Freelancer", source: "Referral", plan: "Hot Desk", assigned: "CM Rahul" },
                ].map((row, i) => (
                  <tr key={i} className={`group hover:bg-gray-50/50 transition-colors border-b border-gray-50 last:border-0 cursor-pointer ${row.selected ? "bg-[#FFF8F6]" : ""}`}>
                    <td className="py-4 px-6 text-[14px] font-semibold text-gray-900 whitespace-nowrap">{row.name}</td>
                    <td className="py-4 px-6 text-[14px] text-gray-600">{row.company}</td>
                    <td className="py-4 px-6 text-[14px] text-gray-600">{row.source}</td>
                    <td className="py-4 px-6 text-[14px] text-gray-600">{row.plan}</td>
                    <td className="py-4 px-6 text-[14px] text-gray-600">{row.assigned}</td>
                    <td className="py-4 px-6 text-[14px] text-right font-medium text-[#FF6A2F]">View Details</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Right Sidebar: Contract Details */}
      <div className="w-[360px] bg-white rounded-2xl border border-gray-100 flex flex-col flex-shrink-0 h-full overflow-y-auto">
        <div className="p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-[18px] font-bold text-gray-900">Contract Details</h2>
        </div>

        <div className="p-6 flex-1 flex flex-col">
          {/* Client Info */}
          <div className="mb-8">
            <h3 className="text-[15px] font-bold text-gray-900 mb-4">Client Info</h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0 text-gray-400">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <div>
                  <p className="text-[12px] text-gray-500 mb-0.5">Name</p>
                  <p className="text-[14px] font-semibold text-gray-900">Rahul Sharma</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0 text-gray-400">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                </div>
                <div>
                  <p className="text-[12px] text-gray-500 mb-0.5">Phone</p>
                  <p className="text-[14px] font-semibold text-gray-900">+91 98765 43210</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0 text-gray-400">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <div>
                  <p className="text-[12px] text-gray-500 mb-0.5">Email</p>
                  <p className="text-[14px] font-semibold text-gray-900">rahul@techstartup.com</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0 text-gray-400">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                </div>
                <div>
                  <p className="text-[12px] text-gray-500 mb-0.5">Company</p>
                  <p className="text-[14px] font-semibold text-gray-900">TechStartup Inc</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0 text-gray-400">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                </div>
                <div>
                  <p className="text-[12px] text-gray-500 mb-0.5">Team Size</p>
                  <p className="text-[14px] font-semibold text-gray-900">8 members</p>
                </div>
              </div>
            </div>
          </div>

          <hr className="border-gray-100 mb-8" />

          {/* Contract Info */}
          <div className="mb-8">
            <h3 className="text-[15px] font-bold text-gray-900 mb-4">Contract Info</h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0 text-gray-400">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <div>
                  <p className="text-[12px] text-gray-500 mb-0.5">Plan</p>
                  <p className="text-[14px] font-semibold text-gray-900">Private Office</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0 text-gray-400">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
                <div>
                  <p className="text-[12px] text-gray-500 mb-0.5">Center Location</p>
                  <p className="text-[14px] font-semibold text-gray-900">Koramangala</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0 text-gray-400">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <div>
                  <p className="text-[12px] text-gray-500 mb-0.5">Start Date</p>
                  <p className="text-[14px] font-semibold text-gray-900">15 January 2024</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0 text-gray-400">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <div>
                  <p className="text-[12px] text-gray-500 mb-0.5">End Date</p>
                  <p className="text-[14px] font-semibold text-gray-900">15 January 2025</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0 text-gray-400">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                </div>
                <div>
                  <p className="text-[12px] text-gray-500 mb-0.5">Billing Cycle</p>
                  <p className="text-[14px] font-semibold text-gray-900">Monthly</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0 text-gray-400">
                  <span className="font-bold">₹</span>
                </div>
                <div>
                  <p className="text-[12px] text-gray-500 mb-0.5">Deposit</p>
                  <p className="text-[14px] font-semibold text-gray-900">₹90,000</p>
                </div>
              </div>
            </div>
          </div>
          
          <hr className="border-gray-100 mb-8" />

          {/* Documents */}
          <div className="mb-auto">
            <h3 className="text-[15px] font-bold text-gray-900 mb-4">Documents</h3>
            <div className="space-y-3">
              <button className="w-full py-2.5 px-4 bg-white border border-gray-200 rounded-xl text-[14px] font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                Download Contract (PDF)
              </button>
              <button className="w-full py-2.5 px-4 bg-white border border-gray-200 rounded-xl text-[14px] font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                Download Invoice
              </button>
              <button className="w-full py-2.5 px-4 bg-white border border-gray-200 rounded-xl text-[14px] font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                Download Client Details
              </button>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="space-y-3 pt-8">
            <button className="w-full py-2.5 bg-[#FF6A2F] text-white rounded-xl text-[14px] font-semibold hover:bg-[#E55A20] transition-colors flex items-center justify-center gap-2 shadow-sm">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              Renew Contract
            </button>
            <button className="w-full py-2.5 bg-white border border-[#EF476F] text-[#EF476F] rounded-xl text-[14px] font-semibold hover:bg-[#FFF0F3] transition-colors flex items-center justify-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              Terminate Contract
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
