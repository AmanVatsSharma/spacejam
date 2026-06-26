"use client";

import { useState } from "react";
import Link from "next/link";

// Icons
const Icons = {
  search: (
    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  chevronDown: (
    <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  ),
  bell: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
  check: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
  trendDown: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
    </svg>
  ),
  rupee: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 8h6m-6 4h6m-6 4h6M6 4h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2z" />
    </svg>
  ),
  calendar: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  users: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  upload: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  ),
  moreVert: (
    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
    </svg>
  )
};

export default function NotificationsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSendDialog, setShowSendDialog] = useState(false);

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1000px] mx-auto pb-10 px-4 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 bg-white p-4 sm:p-6 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100">
        <div>
          <h1 className="text-[24px] sm:text-[28px] font-bold text-[#101828] leading-tight">Notifications</h1>
          <p className="text-xs sm:text-sm text-[#667085] mt-1">
            Track leads, bookings, occupancy, maintenance tasks, billing, and daily center operations in real time.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <button 
            onClick={() => setShowSendDialog(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#FF6A2F] text-white rounded-lg text-sm font-semibold hover:bg-[#E55A20] transition-colors shadow-sm w-full sm:w-auto"
          >
            {Icons.bell} Send Notification
          </button>
          <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-[#344054] rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors shadow-sm w-full sm:w-auto">
            {Icons.check} Mark all as read
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex items-center gap-3 flex-wrap bg-white p-4 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100">
        <div className="relative flex-1 min-w-full sm:min-w-[200px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2">{Icons.search}</span>
          <input
            type="text"
            placeholder="Search lead name, company, or phone"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 sm:py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#FF6A2F] focus:border-transparent bg-white"
          />
        </div>
        
        <div className="grid grid-cols-2 sm:flex flex-wrap gap-3 w-full sm:w-auto">
          {["All Status", "All Center", "All Types", "All Priorities", "This Week", "All Companies"].map((filterName, idx) => (
            <div className="relative w-full sm:w-auto" key={idx}>
              <select className="appearance-none w-full pl-3 pr-8 py-2.5 sm:py-2 border border-gray-200 rounded-lg text-[13px] text-[#344054] font-medium bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#FF6A2F] cursor-pointer">
                <option>{filterName}</option>
              </select>
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">{Icons.chevronDown}</span>
            </div>
          ))}
          <button className="col-span-2 sm:col-span-1 px-4 py-2.5 sm:py-2 bg-white text-[#344054] border border-gray-200 rounded-lg text-[13px] font-medium hover:bg-gray-50 transition-colors w-full sm:w-auto mt-2 sm:mt-0">
            Clear All
          </button>
        </div>
      </div>

      {/* Critical Insight Alert */}
      <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-[#FFE4D6] p-4 sm:p-5 flex flex-col gap-3 relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#FF6A2F] flex items-center justify-center text-white shrink-0">
              {Icons.trendDown}
            </div>
            <span className="text-[12px] sm:text-[13px] font-bold text-[#FF6A2F] tracking-wide uppercase">CRITICAL INSIGHT</span>
          </div>
          <span className="text-[11px] sm:text-[12px] text-gray-500">Updated 2 min ago</span>
        </div>
        <p className="text-[14px] sm:text-[16px] font-semibold text-[#101828]">Occupancy dropped 8% in Ludhiana due to 3 enterprise exits this week.</p>
        <div>
          <button className="text-[#FF6A2F] text-[13px] font-medium hover:underline flex items-center gap-1">
            View Detailed Report 
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:gap-5">
        <h3 className="text-[12px] font-bold text-gray-500 uppercase tracking-wider pl-1">TODAY</h3>
        
        {/* Notification 1 */}
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 p-4 sm:p-5 flex flex-col sm:flex-row items-start gap-4 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FF6A2F]"></div>
          <div className="flex items-start gap-3 sm:gap-4 flex-1 w-full sm:w-auto">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#FF6A2F] flex items-center justify-center text-white shrink-0 mt-0.5 sm:mt-0">
              {Icons.rupee}
            </div>
            <div className="flex flex-col flex-1 gap-1 min-w-0">
              <div className="flex justify-between items-start">
                <h4 className="text-[14px] sm:text-[15px] font-semibold text-[#101828]">Deposit Release Approval</h4>
                <button className="sm:hidden text-gray-400">{Icons.moreVert}</button>
              </div>
              <p className="text-[12px] sm:text-[13px] text-[#667085] leading-snug">
                Tech Innovators Pvt Ltd • Security deposit release • ₹50,000 • Chandigarh • Requested by Rahul Sharma
              </p>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                <span className="text-[11px] sm:text-[12px] font-medium text-[#FF6A2F] flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  5 min ago
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#FFF2EA] text-[#FF6A2F] border border-[#FFE4D6] text-[10px] sm:text-[11px] font-semibold">
                  High
                </span>
              </div>
            </div>
            <button className="hidden sm:block mt-1">{Icons.moreVert}</button>
          </div>
          <div className="flex items-center gap-2 mt-2 sm:mt-auto self-start sm:self-end w-full sm:w-auto justify-end flex-wrap sm:flex-nowrap pl-11 sm:pl-0">
            <button className="flex flex-1 sm:flex-none justify-center items-center gap-1.5 px-4 py-2 bg-[#10B981] text-white rounded-lg text-[12px] sm:text-[13px] font-medium hover:bg-[#059669] transition-colors">
              {Icons.check} Approve
            </button>
            <button className="flex flex-1 sm:flex-none justify-center items-center gap-1.5 px-4 py-2 bg-white border border-[#FECACA] text-[#EF4444] rounded-lg text-[12px] sm:text-[13px] font-medium hover:bg-[#FEF2F2] transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg> Reject
            </button>
            <button className="flex flex-1 sm:flex-none justify-center px-4 py-2 bg-white border border-gray-200 text-[#344054] rounded-lg text-[12px] sm:text-[13px] font-medium hover:bg-gray-50 transition-colors">
              View Details
            </button>
          </div>
        </div>

        {/* Notification 2 */}
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 p-4 sm:p-5 flex flex-col sm:flex-row items-start gap-4 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FF6A2F]"></div>
          <div className="flex items-start gap-3 sm:gap-4 flex-1 w-full sm:w-auto">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#FF6A2F] flex items-center justify-center text-white shrink-0 mt-0.5 sm:mt-0">
              {Icons.calendar}
            </div>
            <div className="flex flex-col flex-1 gap-1 min-w-0">
              <div className="flex justify-between items-start">
                <h4 className="text-[14px] sm:text-[15px] font-semibold text-[#101828]">Invoice Overdue</h4>
                <button className="sm:hidden text-gray-400">{Icons.moreVert}</button>
              </div>
              <p className="text-[12px] sm:text-[13px] text-[#667085] leading-snug">
                DataStream Solutions • INV-2026-1234 • Payment overdue • ₹50,000 • Jalandhar
              </p>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                <span className="text-[11px] sm:text-[12px] font-medium text-[#FF6A2F] flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  12 min ago
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#3B82F6] border border-[#DBEAFE] text-[10px] sm:text-[11px] font-semibold">
                  Medium
                </span>
              </div>
            </div>
            <button className="hidden sm:block mt-1">{Icons.moreVert}</button>
          </div>
          <div className="flex items-center gap-2 mt-2 sm:mt-auto self-start sm:self-end w-full sm:w-auto justify-end flex-wrap sm:flex-nowrap pl-11 sm:pl-0">
            <button className="flex flex-1 sm:flex-none justify-center items-center gap-1.5 px-4 py-2 bg-[#FF6A2F] text-white rounded-lg text-[12px] sm:text-[13px] font-medium hover:bg-[#E55A20] transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg> Review
            </button>
            <button className="flex flex-1 sm:flex-none justify-center items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 text-[#344054] rounded-lg text-[12px] sm:text-[13px] font-medium hover:bg-gray-50 transition-colors">
              {Icons.upload} Send Reminder
            </button>
          </div>
        </div>

        {/* Notification 3 */}
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 p-4 sm:p-5 flex flex-col sm:flex-row items-start gap-4 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent"></div>
          <div className="flex items-start gap-3 sm:gap-4 flex-1 w-full sm:w-auto">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#FF6A2F] flex items-center justify-center text-white shrink-0 mt-0.5 sm:mt-0">
              {Icons.rupee}
            </div>
            <div className="flex flex-col flex-1 gap-1 min-w-0">
              <div className="flex justify-between items-start">
                <h4 className="text-[14px] sm:text-[15px] font-semibold text-[#101828]">Pricing Override Request</h4>
                <button className="sm:hidden text-gray-400">{Icons.moreVert}</button>
              </div>
              <p className="text-[12px] sm:text-[13px] text-[#667085] leading-snug">
                Special discount requested • CloudScale Technologies • ₹2,40,000 revenue reduction • 12 months • 18 %
              </p>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                <span className="text-[11px] sm:text-[12px] font-medium text-gray-500 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  28 min ago
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#3B82F6] border border-[#DBEAFE] text-[10px] sm:text-[11px] font-semibold">
                  Medium
                </span>
              </div>
            </div>
            <button className="hidden sm:block mt-1">{Icons.moreVert}</button>
          </div>
          <div className="flex items-center gap-2 mt-2 sm:mt-auto self-start sm:self-end w-full sm:w-auto justify-end flex-wrap sm:flex-nowrap pl-11 sm:pl-0">
            <button className="flex flex-1 sm:flex-none justify-center items-center gap-1.5 px-4 py-2 bg-[#10B981] text-white rounded-lg text-[12px] sm:text-[13px] font-medium hover:bg-[#059669] transition-colors">
              {Icons.check} Approve
            </button>
            <button className="flex flex-1 sm:flex-none justify-center items-center gap-1.5 px-4 py-2 bg-white border border-[#FECACA] text-[#EF4444] rounded-lg text-[12px] sm:text-[13px] font-medium hover:bg-[#FEF2F2] transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg> Reject
            </button>
            <button className="flex flex-1 sm:flex-none justify-center px-4 py-2 bg-white border border-gray-200 text-[#344054] rounded-lg text-[12px] sm:text-[13px] font-medium hover:bg-gray-50 transition-colors">
              Clarify
            </button>
          </div>
        </div>

        {/* Notification 4 */}
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 p-4 sm:p-5 flex flex-col sm:flex-row items-start gap-4 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent"></div>
          <div className="flex items-start gap-3 sm:gap-4 flex-1 w-full sm:w-auto">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#FF6A2F] flex items-center justify-center text-white shrink-0 mt-0.5 sm:mt-0">
              {Icons.users}
            </div>
            <div className="flex flex-col flex-1 gap-1 min-w-0">
              <div className="flex justify-between items-start">
                <h4 className="text-[14px] sm:text-[15px] font-semibold text-[#101828]">Occupancy Alert</h4>
                <button className="sm:hidden text-gray-400">{Icons.moreVert}</button>
              </div>
              <p className="text-[12px] sm:text-[13px] text-[#667085] leading-snug">
                Center occupancy dropped below threshold • 76% Occupancy • 120/158 seats
              </p>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                <span className="text-[11px] sm:text-[12px] font-medium text-gray-500 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  1 hour ago
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#FFF2EA] text-[#FF6A2F] border border-[#FFE4D6] text-[10px] sm:text-[11px] font-semibold">
                  High
                </span>
              </div>
            </div>
            <button className="hidden sm:block mt-1">{Icons.moreVert}</button>
          </div>
          <div className="flex items-center gap-2 mt-2 sm:mt-auto self-start sm:self-end w-full sm:w-auto justify-end flex-wrap sm:flex-nowrap pl-11 sm:pl-0">
            <button className="flex flex-1 sm:flex-none justify-center items-center gap-1.5 px-4 py-2 bg-[#FF6A2F] text-white rounded-lg text-[12px] sm:text-[13px] font-medium hover:bg-[#E55A20] transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg> View Occupancy
            </button>
            <button className="flex flex-1 sm:flex-none justify-center px-4 py-2 bg-white border border-gray-200 text-[#344054] rounded-lg text-[12px] sm:text-[13px] font-medium hover:bg-gray-50 transition-colors">
              Clarify
            </button>
          </div>
        </div>

      </div>

      <div className="flex flex-col gap-4 sm:gap-5 mt-2">
        <h3 className="text-[12px] font-bold text-gray-500 uppercase tracking-wider pl-1">YESTERDAY</h3>
        
        {/* Notification 5 */}
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 p-4 sm:p-5 flex flex-col sm:flex-row items-start gap-4 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#E5E7EB]"></div>
          <div className="flex items-start gap-3 sm:gap-4 flex-1 w-full sm:w-auto">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#FF6A2F] flex items-center justify-center text-white shrink-0 mt-0.5 sm:mt-0">
              {Icons.users}
            </div>
            <div className="flex flex-col flex-1 gap-1 min-w-0">
              <div className="flex justify-between items-start">
                <h4 className="text-[14px] sm:text-[15px] font-semibold text-[#101828]">Company Structure Change</h4>
                <button className="sm:hidden text-gray-400">{Icons.moreVert}</button>
              </div>
              <p className="text-[12px] sm:text-[13px] text-[#667085] leading-snug">
                Nexus Ventures • Approval of new seats • Effective date - 01 June 2026
              </p>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                <span className="text-[11px] sm:text-[12px] font-medium text-gray-500 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Yesterday
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#3B82F6] border border-[#DBEAFE] text-[10px] sm:text-[11px] font-semibold">
                  Medium
                </span>
              </div>
            </div>
            <button className="hidden sm:block mt-1">{Icons.moreVert}</button>
          </div>
          <div className="flex items-center gap-2 mt-2 sm:mt-auto self-start sm:self-end w-full sm:w-auto justify-end flex-wrap sm:flex-nowrap pl-11 sm:pl-0">
            <button className="flex flex-1 sm:flex-none justify-center items-center gap-1.5 px-4 py-2 bg-[#FF6A2F] text-white rounded-lg text-[12px] sm:text-[13px] font-medium hover:bg-[#E55A20] transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg> View Occupancy
            </button>
            <button className="flex flex-1 sm:flex-none justify-center px-4 py-2 bg-white border border-gray-200 text-[#344054] rounded-lg text-[12px] sm:text-[13px] font-medium hover:bg-gray-50 transition-colors">
              View Details
            </button>
          </div>
        </div>

      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-4 sm:gap-0">
        <p className="text-[13px] text-gray-500 text-center sm:text-left">
          Showing <span className="font-semibold text-gray-900">1-7</span> of <span className="font-semibold text-gray-900">247</span> notifications
        </p>
        <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto justify-center">
          <button className="px-3.5 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-[13px] font-medium hover:bg-gray-50">Previous</button>
          <button className="w-9 h-9 bg-[#FF6A2F] text-white rounded-lg text-[13px] font-semibold shrink-0">1</button>
          <button className="w-9 h-9 bg-white border border-gray-200 text-gray-600 rounded-lg text-[13px] font-semibold hover:bg-gray-50 shrink-0">2</button>
          <button className="w-9 h-9 bg-white border border-gray-200 text-gray-600 rounded-lg text-[13px] font-semibold hover:bg-gray-50 shrink-0">3</button>
          <button className="px-3.5 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-[13px] font-medium hover:bg-gray-50">Next</button>
        </div>
      </div>

      {/* Send Notification Dialog */}
      <SendNotificationDialog 
        open={showSendDialog} 
        onClose={() => setShowSendDialog(false)} 
      />

    </div>
  );
}

/* ----- Send Notification Dialog ----- */
function SendNotificationDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [sendTo, setSendTo] = useState("Selective Customer");
  const [template, setTemplate] = useState("Booking Confirmation");
  const [message, setMessage] = useState(
    "Hi {{name}},\n\nGreat news! Your booking at {{center_name}} has been confirmed.\n\nBooking Details:\n• Booking ID: {{booking_id}}\n• Date: {{date}}"
  );

  const variables = [
    "{{name}}",
    "{{date}}",
    "{{time}}",
    "{{center_name}}",
    "{{booking_id}}",
    "{{amount}}",
  ];

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-[600px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="send-notification-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#FF6A2F] flex items-center justify-center text-white shadow-sm shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div className="flex flex-col">
              <h2 id="send-notification-title" className="text-[16px] sm:text-[18px] font-bold text-gray-900 leading-tight">
                Notification
              </h2>
              <p className="text-[12px] sm:text-[14px] text-gray-500 mt-0.5">Send Custom Notification to Client, Center etc</p>
            </div>
          </div>
          <button
            type="button"
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 self-start"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        {/* Body */}
        <div className="p-4 sm:p-6 flex flex-col gap-5 sm:gap-6 max-h-[70vh] overflow-y-auto">
          
          {/* Send To */}
          <div className="flex flex-col gap-2">
            <label className="text-[13px] sm:text-[14px] font-semibold text-gray-700">Send To</label>
            <input
              type="text"
              value={sendTo}
              onChange={(e) => setSendTo(e.target.value)}
              className="w-full px-4 py-2.5 sm:py-3 bg-white border border-gray-200 rounded-xl text-[13px] sm:text-[14px] text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#FF6A2F] focus:border-transparent transition-all"
            />
          </div>

          {/* Select Customers */}
          <div className="flex flex-col gap-2">
            <label className="text-[13px] sm:text-[14px] font-semibold text-gray-700">Select Customers</label>
            <div className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl flex flex-wrap gap-2 items-center min-h-[50px] focus-within:ring-2 focus-within:ring-[#FF6A2F] focus-within:border-transparent transition-all">
              <span className="text-gray-400 pl-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              {/* Customer Pill */}
              <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-[12px] sm:text-[13px] font-medium text-gray-900">
                Tech Innovators Pvt Ltd
                <button className="text-gray-400 hover:text-gray-600">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <input 
                type="text" 
                className="flex-1 min-w-[50px] bg-transparent outline-none text-[13px] sm:text-[14px]"
              />
            </div>
          </div>

          {/* Template Name */}
          <div className="flex flex-col gap-2">
            <label className="text-[13px] sm:text-[14px] font-semibold text-gray-700">Template Name</label>
            <input
              type="text"
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className="w-full px-4 py-2.5 sm:py-3 bg-white border border-gray-200 rounded-xl text-[13px] sm:text-[14px] text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#FF6A2F] focus:border-transparent transition-all"
            />
          </div>

          {/* Message Body */}
          <div className="flex flex-col gap-2">
            <label className="text-[13px] sm:text-[14px] font-semibold text-gray-700">Message Body</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              className="w-full px-4 py-3 bg-[#F9FAFB] border border-gray-200 rounded-xl text-[13px] sm:text-[14px] text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#FF6A2F] focus:border-transparent transition-all resize-none"
            />
            
            {/* Variables */}
            <div className="mt-2 flex flex-col gap-2">
              <span className="text-[12px] sm:text-[13px] text-gray-500">Insert variables:</span>
              <div className="flex flex-wrap gap-2">
                {variables.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setMessage((prev) => prev + v)}
                    className="px-2.5 sm:px-3 py-1.5 bg-[#FFF2EA] text-[#FF6A2F] rounded-lg text-[12px] sm:text-[13px] font-mono hover:bg-[#FFE4D6] transition-colors"
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <footer className="px-4 sm:px-6 py-4 sm:py-5 border-t border-gray-100 flex items-center justify-end">
          <button
            type="button"
            className="w-full sm:w-auto flex justify-center items-center gap-2 px-6 py-3 bg-[#FF6A2F] text-white text-[14px] sm:text-[15px] font-semibold rounded-xl hover:bg-[#E55A20] transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Send Notification
          </button>
        </footer>
      </div>
    </div>
  );
}
