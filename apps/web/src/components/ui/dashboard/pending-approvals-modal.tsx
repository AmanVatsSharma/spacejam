"use client";

/**
 * File:        apps/web/src/components/ui/dashboard/pending-approvals-modal.tsx
 * Module:      Web · UI · Dashboard · Pending Approvals Modal
 * Purpose:     Live list of pending requests from useRequests(), filtered to
 *              PENDING client-side. Stat cards from useRequestStats().
 *              Approve via useApproveRequest, reject via useRejectRequest.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-08
 */

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  useRequests,
  useRequestStats,
  useApproveRequest,
  useRejectRequest,
} from "@/hooks/use-operations";

export function PendingApprovalsModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [activeFilter, setActiveFilter] = useState<"All" | "MAINTENANCE" | "CLEANING" | "SECURITY" | "UPGRADE" | "SERVICES" | "EVENTS" | "OTHER">("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { requests, loading } = useRequests();
  const { stats } = useRequestStats();
  const { approve, approving } = useApproveRequest();
  const { reject, saving: rejecting } = useRejectRequest();

  // Filter to pending only, client-side.
  const pendingRequests = useMemo(
    () => requests.filter((r: any) => (r.status ?? "").toUpperCase() === "PENDING"),
    [requests],
  );

  const filteredRequests = useMemo(
    () => pendingRequests.filter((r: any) => activeFilter === "All" || r.requestType === activeFilter),
    [pendingRequests, activeFilter],
  );

  const highPriorityCount = pendingRequests.filter(
    (r: any) => (r.urgency ?? "").toUpperCase() === "HIGH",
  ).length;

  if (!isOpen) return null;

  const handleApprove = async (id: string) => {
    try {
      const result = await approve(id);
      if (result) {
        toast.success("Request approved");
        setExpandedId(null);
      } else {
        toast.error("Could not approve request");
      }
    } catch (err) {
      toast.error(`Failed to approve: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const handleReject = async (id: string) => {
    try {
      const result = await reject(id, "Rejected by admin");
      if (result) {
        toast.success("Request rejected");
        setExpandedId(null);
      } else {
        toast.error("Could not reject request");
      }
    } catch (err) {
      toast.error(`Failed to reject: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case "MAINTENANCE":
        return (
          <svg className="w-5 h-5 text-[#FF7847]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-3.941a4 4 0 11-5.66-5.66l1.06 1.06a3 3 0 014.243 4.243l1.06 1.06z" />
          </svg>
        );
      case "IT_SUPPORT":
        return (
          <svg className="w-5 h-5 text-[#FF7847]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case "CLEANING":
        return (
          <svg className="w-5 h-5 text-[#FF7847]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-[#FF7847]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
    }
  };

  const labelForType = (type: string) => {
    switch (type) {
      case "MAINTENANCE": return "Maintenance";
      case "CLEANING": return "Cleaning";
      case "SECURITY": return "Security";
      case "UPGRADE": return "Upgrade";
      case "SERVICES": return "Services";
      case "EVENTS": return "Events";
      case "PRINTER": return "Printer";
      default: return "Other";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <div className="bg-[#F8F9FA] rounded-2xl w-full max-w-[700px] max-h-[90vh] flex flex-col shadow-xl overflow-hidden">

        {/* Header Section (White background) */}
        <div className="bg-white p-6 border-b border-gray-100 flex flex-col gap-6 shrink-0 z-10 relative">

          {/* Top Bar */}
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-[24px] font-bold text-[#101828]">Pending Approvals</h2>
              <p className="text-[15px] text-[#667085] mt-1">Review and take action on pending requests</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500" aria-label="Close">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-[#FFF8F2] border border-[#FFE8D6] rounded-xl p-4">
              <p className="text-[13px] text-[#FF7847] font-medium">Pending Requests</p>
              <p className="text-[28px] font-bold text-[#FF7847] mt-1">{stats.pendingRequests ?? pendingRequests.length}</p>
            </div>
            <div className="bg-[#FFF9F2] border border-[#FFEBD6] rounded-xl p-4">
              <p className="text-[13px] text-[#FF7847] font-medium">High Priority</p>
              <p className="text-[28px] font-bold text-[#FF7847] mt-1">{stats.highUrgencyRequests ?? highPriorityCount}</p>
            </div>
            <div className="bg-[#F0FBFA] border border-[#D5F5F3] rounded-xl p-4">
              <p className="text-[13px] text-[#00C4B8] font-medium">Total Requests</p>
              <p className="text-[28px] font-bold text-[#00C4B8] mt-1">{stats.totalRequests ?? requests.length}</p>
            </div>
          </div>
        </div>

        {/* Toolbar & List container (gray background, scrollable) */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">

          {/* Toolbar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              {(["All", "MAINTENANCE", "CLEANING", "SECURITY", "UPGRADE", "SERVICES", "EVENTS", "OTHER"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-4 py-2 rounded-full text-[14px] font-medium transition-colors ${
                    activeFilter === filter
                      ? "bg-[#FF7847] text-white"
                      : "bg-gray-200/50 text-[#4A5565] hover:bg-gray-200"
                  }`}
                >
                  {filter === "All" ? "All" : labelForType(filter)}
                </button>
              ))}
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="text-center py-12 text-gray-400">Loading requests…</div>
          )}

          {/* Empty state */}
          {!loading && filteredRequests.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center text-gray-300">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-[15px] font-semibold text-gray-700">No pending requests</p>
              <p className="text-[13px] text-gray-500 max-w-[300px]">
                All requests have been reviewed. New pending requests will appear here.
              </p>
            </div>
          )}

          {/* Requests List */}
          {!loading && filteredRequests.length > 0 && (
            <div className="flex flex-col gap-4">
              {filteredRequests.map((req: any) => {
                const isHighPriority = (req.urgency ?? "").toUpperCase() === "HIGH";
                const requestedByName = req.requestedBy?.name ?? "Unknown";
                const createdAt = req.createdAt
                  ? new Date(req.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                  : "";
                return (
                  <div key={req.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-200">

                    {/* Card Header (always visible) */}
                    <div
                      className="p-5 flex items-start gap-4 cursor-pointer hover:bg-gray-50/50"
                      onClick={() => setExpandedId(expandedId === req.id ? null : req.id)}
                    >
                      {/* Icon */}
                      <div className="w-12 h-12 rounded-xl bg-[#FFF5F2] flex items-center justify-center shrink-0">
                        {getIconForType(req.requestType)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                        <div className="flex items-center justify-between gap-4">
                          <h3 className="text-[16px] font-bold text-[#101828] truncate">{req.title || "Untitled request"}</h3>
                          <div className="flex items-center gap-3 shrink-0">
                            {isHighPriority && (
                              <span className="px-2.5 py-1 bg-[#FFF5F2] text-[#FF7847] text-[12px] font-medium rounded-full border border-[#FFEBE5]">
                                High Priority
                              </span>
                            )}
                            <svg className={`w-5 h-5 text-gray-400 transition-transform ${expandedId === req.id ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>

                        <p className="text-[13px] text-gray-500">{labelForType(req.requestType)}</p>

                        <div className="flex items-center justify-between mt-1">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[11px] font-semibold text-gray-600">
                              {requestedByName.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-[14px] text-[#4A5565]">{requestedByName}</span>
                            {createdAt && (
                              <>
                                <span className="w-1 h-1 rounded-full bg-gray-300" />
                                <span className="text-[13px] text-gray-500">{createdAt}</span>
                              </>
                            )}
                          </div>
                          <span className="px-3 py-1 bg-white border border-[#FFD9CC] text-[#FF7847] text-[12px] font-medium rounded-full">
                            Pending
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {expandedId === req.id && (
                      <div className="px-5 pb-5 pt-2 border-t border-gray-100 bg-white">
                        <div className="flex flex-col gap-5 mt-4">

                          {/* Description */}
                          <div>
                            <h4 className="text-[14px] font-bold text-[#101828] mb-2">Request Details</h4>
                            <p className="text-[14px] text-[#4A5565]">{req.description || "No description provided."}</p>
                          </div>

                          {/* Info Grid */}
                          <div className="grid grid-cols-3 gap-4">
                            <div className="bg-[#F8F9FA] rounded-xl p-4">
                              <p className="text-[13px] text-gray-500 mb-1">Urgency</p>
                              <p className="text-[14px] font-bold text-[#101828]">{(req.urgency ?? "—").replace("_", " ")}</p>
                            </div>
                            <div className="bg-[#F8F9FA] rounded-xl p-4">
                              <p className="text-[13px] text-gray-500 mb-1">Due Date</p>
                              <p className="text-[14px] font-bold text-[#101828]">
                                {req.dueDate ? new Date(req.dueDate).toLocaleDateString("en-GB") : "—"}
                              </p>
                            </div>
                            <div className="bg-[#F8F9FA] rounded-xl p-4">
                              <p className="text-[13px] text-gray-500 mb-1">Type</p>
                              <p className="text-[14px] font-bold text-[#101828]">{labelForType(req.requestType)}</p>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-3 mt-2">
                            <button
                              onClick={() => handleApprove(req.id)}
                              disabled={approving || rejecting}
                              className="flex-1 flex items-center justify-center gap-2 bg-[#FF7847] text-white py-2.5 rounded-xl font-medium text-[14px] hover:bg-[#E56A3D] transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {approving ? (
                                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                                  <path d="M22 12a10 10 0 01-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                                </svg>
                              ) : (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(req.id)}
                              disabled={approving || rejecting}
                              className="flex-1 flex items-center justify-center gap-2 bg-white border border-[#FFDCD3] text-[#FF7847] py-2.5 rounded-xl font-medium text-[14px] hover:bg-[#FFF5F2] transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {rejecting ? (
                                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                                  <path d="M22 12a10 10 0 01-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                                </svg>
                              ) : (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              )}
                              Reject
                            </button>
                          </div>

                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
