"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useQuery } from "@apollo/client";
import { GET_BOOKINGS, GET_DEPOSITS } from "@/lib/apollo/operations";

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
  )
};

export default function NotificationsPage() {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSendDialog, setShowSendDialog] = useState(false);

  /* ── Live data for notification context ── */
  const { data: bookingsData } = useQuery(GET_BOOKINGS, {
    fetchPolicy: "cache-and-network",
    errorPolicy: "all",
  });
  const { data: depositsData } = useQuery(GET_DEPOSITS, {
    fetchPolicy: "cache-and-network",
    errorPolicy: "all",
  });

  const notificationCount = useMemo(() => {
    const activeBookings = (bookingsData?.bookings ?? []).filter(
      (b: any) => b.status === "CHECKED_IN" || b.status === "CONFIRMED"
    ).length;
    const pendingDeposits = (depositsData?.deposits ?? []).filter(
      (d: any) => d.status === "PENDING" || d.status === "HELD"
    ).length;
    return activeBookings + pendingDeposits;
  }, [bookingsData, depositsData]);

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1000px] mx-auto pb-10 px-4 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 bg-white p-4 sm:p-6 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 transition-all duration-200">
        <div>
          <h1 className="text-[24px] sm:text-[28px] font-bold text-[#101828] leading-tight">Notifications</h1>
          <p className="text-xs sm:text-sm text-[#667085] mt-1">
            Track leads, bookings, occupancy, maintenance tasks, billing, and daily center operations in real time.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => setShowSendDialog(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#FF6A2F] text-white rounded-lg text-sm font-semibold hover:bg-[#E55A20] active:scale-[0.97] transition-all duration-200 shadow-sm w-full sm:w-auto"
          >
            {Icons.bell} Send Notification
          </button>
          <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-[#344054] rounded-lg text-sm font-semibold hover:bg-gray-50 active:scale-[0.97] transition-all duration-200 shadow-sm w-full sm:w-auto">
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
          <button className="col-span-2 sm:col-span-1 px-4 py-2.5 sm:py-2 bg-white text-[#344054] border border-gray-200 rounded-lg text-[13px] font-medium hover:bg-gray-50 active:scale-[0.97] transition-all duration-200 w-full sm:w-auto mt-2 sm:mt-0">
            Clear All
          </button>
        </div>
      </div>

      {/* Live notification summary (derived from bookings + deposits) */}
      <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#FFF2EA] flex items-center justify-center text-[#FF6A2F] shrink-0">
            {Icons.bell}
          </div>
          <div>
            <p className="text-[14px] font-semibold text-[#101828]">
              {notificationCount} active {notificationCount === 1 ? "item" : "items"}
            </p>
            <p className="text-[12px] sm:text-[13px] text-[#667085]">
              Active bookings and pending deposits requiring attention.
            </p>
          </div>
        </div>
      </div>

      {/* Empty state — no notification feed is backed by the API yet */}
      <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 p-10 sm:p-16 flex flex-col items-center justify-center text-center gap-3">
        <div className="w-14 h-14 rounded-full bg-[#FFF2EA] flex items-center justify-center text-[#FF6A2F]">
          {Icons.bell}
        </div>
        <h3 className="text-[16px] sm:text-[18px] font-semibold text-[#101828]">No notifications</h3>
        <p className="text-[13px] sm:text-[14px] text-[#667085] max-w-[420px]">
          There is no notification history to show yet. Once notifications are available from the backend, they will appear here.
        </p>
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
            className="text-gray-400 hover:text-gray-600 active:scale-[0.97] transition-all duration-200 p-1 self-start"
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
              <input
                type="text"
                placeholder="Search and select customers..."
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
            className="w-full sm:w-auto flex justify-center items-center gap-2 px-6 py-3 bg-[#FF6A2F] text-white text-[14px] sm:text-[15px] font-semibold rounded-xl hover:bg-[#E55A20] active:scale-[0.97] transition-all duration-200 shadow-sm"
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
