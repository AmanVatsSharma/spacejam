"use client";


/**
 * File:        apps/web/src/app/dashboard/operations/request/page.tsx
 * Module:      Web · Dashboard · Operations · Requests
 * Purpose:     Requests & Registration page — Apollo-wired with mock fallback.
 *              Table view, filters, inline status management, side panel.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-02
 */


import { useMemo, useState } from "react";
import { useRequests, useAssignRequest, useUpdateRequest, useCompleteRequest, useRejectRequest, useApproveRequest, useRequestStats } from "@/hooks/use-operations";
import { PendingApprovalsModal } from "@/components/ui/dashboard/pending-approvals-modal";
import { AddRequestModal } from "../modals/add-request-modal";

// Local status type — UI display vocabulary used by this page's filters & comparisons.
type RequestStatus = "Pending" | "Approved" | "Rejected";

/* --------------- Icons --------------- */

const Icons = {
  search: (
    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  chevronDown: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  ),
  moreVertical: (
    <svg className="w-5 h-5 text-gray-500 hover:text-gray-700" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
    </svg>
  ),
  payment: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <rect width="20" height="20" rx="4" fill="rgba(255,120,71,0.1)" />
      <path d="M10 4C7.24 4 5 6.24 5 9s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 8.5c-1.93 0-3.5-1.57-3.5-3.5S8.07 5.5 10 5.5s3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z" fill="#FF7847" />
    </svg>
  ),
  printer: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <rect width="20" height="20" rx="4" fill="rgba(255,120,71,0.1)" />
      <path d="M14 5h-1V3a1 1 0 00-1-1H7a1 1 0 00-1 1v2H5a1 1 0 00-1 1v7a1 1 0 001 1h1v1a1 1 0 001 1h6a1 1 0 001-1v-1h1a1 1 0 001-1V6a1 1 0 00-1-1zm-7 6H7V8h5v3zm2-5H7V4h2v2zm4 5h-2v-3h2v3z" fill="#FF7847" />
    </svg>
  ),
};

/* --------------- Status styles --------------- */

function getStatusStyle(status: string) {
  switch (status) {
    case "Pending": return "bg-[#FFF0E6] text-[#FF7847]";
    case "Approved": return "bg-[#E6F4EA] text-[#1E8E3E]";
    case "Rejected": return "bg-[#FCE8E6] text-[#D93025]";
    default: return "bg-gray-100 text-gray-700";
  }
}

/* --------------- Page --------------- */

export default function RequestsPage() {
  const { requests, loading, error } = useRequests();
  const { stats } = useRequestStats();
  const { assign: _assign } = useAssignRequest();
  const { update } = useUpdateRequest();
  const { complete: _complete } = useCompleteRequest();
  const { reject } = useRejectRequest();
  const { approve } = useApproveRequest();

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"All Categories" | "Events" | "Printer" | "Upgrade" | "Services">("All Categories");
  const [statusFilter, setStatusFilter] = useState<"All Statuses" | "Pending" | "Approved" | "Rejected">("All Statuses");
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);
  const [openStatusMenu, setOpenStatusMenu] = useState<string | null>(null);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [showAddRequest, setShowAddRequest] = useState(false);

  // Loading state is handled by Apollo hook; fall back to loading indicator if needed

  // Map backend RequestStatus (PENDING/IN_PROGRESS/COMPLETED/REJECTED/CANCELLED)
  // to the UI's display vocabulary. IN_PROGRESS == "Approved" (work underway).
  function mapStatus(raw: string): "Pending" | "Approved" | "Rejected" | "Completed" | "Cancelled" {
    const s = (raw ?? "").toUpperCase();
    if (s === "PENDING") return "Pending";
    if (s === "IN_PROGRESS") return "Approved";
    if (s === "REJECTED") return "Rejected";
    if (s === "COMPLETED") return "Completed";
    if (s === "CANCELLED") return "Cancelled";
    return "Pending";
  }

  const requestList: {
    id: string;
    requestType: "Events" | "Printer" | "Upgrade" | "Services";
    requestedBy: string;
    details: string;
    date: string;
    status: "Pending" | "Approved" | "Rejected" | "Completed" | "Cancelled";
  }[] = requests.map((r: any) => ({
      id: r.id,
      requestType: (r.requestType ?? "Services") as "Events" | "Printer" | "Upgrade" | "Services",
      requestedBy: r.requestedBy?.name ?? "Unknown",
      details: r.title,
      date: r.dueDate ? new Date(r.dueDate).toLocaleDateString("en-GB") : new Date(r.createdAt).toLocaleDateString("en-GB"),
      status: mapStatus(r.status),
    }));

  const filtered = useMemo(() => {
    return requestList.filter((r) => {
      if (categoryFilter !== "All Categories" && r.requestType !== categoryFilter) return false;
      if (statusFilter !== "All Statuses" && r.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          r.requestType.toLowerCase().includes(q) ||
          r.requestedBy.toLowerCase().includes(q) ||
          r.details.toLowerCase().includes(q) ||
          r.date.toLowerCase().includes(q) ||
          r.status.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [requestList, searchQuery, categoryFilter, statusFilter]);

  const pendingCount = requestList.filter((r) => r.status === "Pending").length;
  const totalCount = requestList.length;

  const handleClearAll = () => {
    setSearchQuery("");
    setCategoryFilter("All Categories");
    setStatusFilter("All Statuses");
  };

  const handleStatusChange = (reqId: string, newStatus: string) => {
    const status = newStatus as RequestStatus;
    if (status === "Pending") {
      update(reqId, { status: "PENDING" } as any);
    } else if (status === "Approved") {
      // Approve via the dedicated approveRequest mutation (sets status IN_PROGRESS)
      approve(reqId);
    } else if (status === "Rejected") {
      reject(reqId, "Rejected by admin");
    }
    setOpenStatusMenu(null);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1440px] mx-auto pb-10">
      {/* Header */}
      <div className="bg-white rounded-[16px] shadow-sm border border-gray-100 p-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[#101828]">Request & Registration</h1>
          <p className="text-[15px] text-[#667085] mt-1">Manage requests for events, printers and account upgrades</p>
        </div>
        <button
          onClick={() => setShowAddRequest(true)}
          className="flex items-center gap-2 bg-[#FF6A2F] text-white px-5 py-2.5 rounded-xl text-[14px] font-semibold hover:bg-[#E55A20] transition-colors shadow-sm shrink-0"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M8 3V13M3 8H13" strokeLinecap="round" />
          </svg>
          <span>New Request</span>
        </button>
      </div>

      <div className="flex gap-6 items-start">
        {/* Left */}
        <div className="flex-1 flex flex-col gap-5 min-w-0">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-[280px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2">{Icons.search}</span>
              <input
                type="text"
                placeholder="Search Requests.."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-[14px] focus:outline-none focus:ring-1 focus:ring-[#FF7847] focus:border-[#FF7847] bg-white text-gray-700 shadow-sm"
              />
            </div>

            <div className="relative">
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as any)}
                className="appearance-none pl-4 pr-10 py-2.5 border border-gray-200 rounded-lg text-[14px] text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-[#FF7847] focus:border-[#FF7847] cursor-pointer min-w-[150px] shadow-sm">
                <option>All Categories</option><option>Events</option><option>Printer</option><option>Upgrade</option><option>Services</option>
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">{Icons.chevronDown}</span>
            </div>

            <div className="relative">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}
                className="appearance-none pl-4 pr-10 py-2.5 border border-gray-200 rounded-lg text-[14px] text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-[#FF7847] focus:border-[#FF7847] cursor-pointer min-w-[140px] shadow-sm">
                <option>All Statuses</option><option>Pending</option><option>Approved</option><option>Rejected</option>
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">{Icons.chevronDown}</span>
            </div>

            <button onClick={handleClearAll} className="px-5 py-2.5 bg-[#FFECE5] text-[#FF6A2F] rounded-lg text-[14px] font-medium hover:bg-[#FFD9CC] transition-colors">Clear All</button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-[16px] shadow-sm border border-gray-100 overflow-visible relative">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-5 text-[12px] font-bold text-gray-500 uppercase tracking-wider">Request Type</th>
                  <th className="px-6 py-5 text-[12px] font-bold text-gray-500 uppercase tracking-wider">Requested By</th>
                  <th className="px-6 py-5 text-[12px] font-bold text-gray-500 uppercase tracking-wider">Details</th>
                  <th className="px-6 py-5 text-[12px] font-bold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-5 text-[12px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-5 text-[12px] font-bold text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[14px] text-gray-400">Loading requests…</td>
                  </tr>
                )}
                {error && !loading && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[14px] text-red-500">Error loading requests. Check connection.</td>
                  </tr>
                )}
                {!loading && !error && filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center gap-3 text-gray-500">
                        <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center text-gray-300">
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                        <p className="text-[15px] font-semibold text-gray-700">No requests found</p>
                        <p className="text-[13px] text-gray-500 max-w-[320px]">
                          {requests.length === 0
                            ? "There are no requests yet. Click “New Request” to submit one."
                            : "No requests match the current filters. Try clearing them."}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
                {filtered.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-5 text-[14px] font-medium text-gray-900">{request.requestType}</td>
                    <td className="px-6 py-5 text-[14px] font-bold text-gray-900">{request.requestedBy}</td>
                    <td className="px-6 py-5 text-[14px] text-gray-500 max-w-[200px] leading-relaxed">{request.details}</td>
                    <td className="px-6 py-5 text-[14px] text-gray-500">{request.date}</td>
                    <td className="px-6 py-5 relative">
                      <button onClick={(e) => {
                        e.stopPropagation();
                        setOpenStatusMenu(openStatusMenu === request.id ? null : request.id);
                        setOpenActionMenu(null);
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium ${getStatusStyle(request.status)}`}>
                        {request.status}
                        <svg className="w-3 h-3 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {openStatusMenu === request.id && (
                        <div className="absolute left-6 top-[70%] z-20 w-32 bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-gray-100 py-1 overflow-hidden">
                          {["Pending", "Approved", "Rejected"].map((opt) => (
                            <button key={opt} className="w-full text-left px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors"
                              onClick={() => handleStatusChange(request.id, opt)}>
                              {opt}
                            </button>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-5 relative">
                      <button className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenActionMenu(openActionMenu === request.id ? null : request.id);
                          setOpenStatusMenu(null);
                        }}>
                        {Icons.moreVertical}
                      </button>
                      {openActionMenu === request.id && (
                        <div className="absolute right-6 top-[70%] z-20 w-32 bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-gray-100 py-1 overflow-hidden">
                          <button className="w-full text-left px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors"
                            onClick={() => {
                              approve(request.id);
                              setOpenActionMenu(null);
                            }}>Approve</button>
                          <button className="w-full text-left px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors"
                            onClick={() => {
                              reject(request.id, "Rejected by admin");
                              setOpenActionMenu(null);
                            }}>Reject</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-[320px] flex flex-col gap-5 shrink-0">
          <div className="bg-white rounded-[16px] shadow-sm border border-gray-100 p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[16px] font-bold text-gray-900">Total Requests</span>
              <span className="text-[18px] font-semibold text-gray-900">{stats.totalRequests ?? totalCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[14px] text-gray-500">Pending Approvals</span>
              <span className="text-[16px] font-semibold text-gray-900">{stats.pendingRequests ?? pendingCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[14px] text-gray-500">In Progress</span>
              <span className="text-[16px] font-semibold text-gray-900">{stats.inProgressRequests ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[14px] text-gray-500">High Urgency</span>
              <span className="text-[16px] font-semibold text-gray-900">{stats.highUrgencyRequests ?? 0}</span>
            </div>
            <button onClick={() => setShowPendingModal(true)}
              className="w-full mt-2 py-2.5 bg-[#FF6A2F] text-white rounded-lg text-[14px] font-semibold hover:bg-[#E55A20] transition-colors shadow-sm">View Pending</button>
          </div>

          {/* Activities section removed - real data integration pending */}
        </div>
      </div>

      {/* Modals */}
      <AddRequestModal open={showAddRequest} onClose={() => setShowAddRequest(false)} />
      <PendingApprovalsModal isOpen={showPendingModal} onClose={() => setShowPendingModal(false)} />
    </div>
  );
}
