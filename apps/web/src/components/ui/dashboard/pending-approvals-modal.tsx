"use client";

import { useState } from "react";

interface RequestDetails {
  id: string;
  type: "Event Booking" | "Printer Access" | "Upgrades";
  title: string;
  user: {
    name: string;
    avatar: string;
  };
  details: string;
  timeAgo: string;
  isHighPriority: boolean;
  status: "Pending";
  // Expanded details
  description: string;
  plan: string;
  usage: string;
  dues: string;
  conflict?: {
    isConflict: boolean;
    message: string;
  };
}

const MOCK_REQUESTS: RequestDetails[] = [
  {
    id: "req-1",
    type: "Event Booking",
    title: "Conference Room Booking",
    user: { name: "Sarah Johnson", avatar: "https://i.pravatar.cc/150?u=sarah" },
    details: "Hot Desk",
    timeAgo: "2h ago",
    isHighPriority: true,
    status: "Pending",
    description: "Requesting conference room A for team meeting on March 31, 2026, 2:00 PM - 4:00 PM",
    plan: "Premium Plan",
    usage: "15 hours this month",
    dues: "$0",
    conflict: {
      isConflict: true,
      message: "Smart Suggestion: Conference Room B is available at the same time"
    }
  },
  {
    id: "req-2",
    type: "Printer Access",
    title: "Printer Access Request",
    user: { name: "Michael Chen", avatar: "https://i.pravatar.cc/150?u=michael" },
    details: "Color Printer",
    timeAgo: "4h ago",
    isHighPriority: false,
    status: "Pending",
    description: "Requesting access to color printer for marketing materials",
    plan: "Basic Plan",
    usage: "5 hours this month",
    dues: "$50",
    conflict: {
      isConflict: false,
      message: "No conflicts detected"
    }
  },
  {
    id: "req-3",
    type: "Upgrades",
    title: "Plan Upgrade Request",
    user: { name: "Emily Rodriguez", avatar: "https://i.pravatar.cc/150?u=emily" },
    details: "Premium to Enterprise",
    timeAgo: "6h ago",
    isHighPriority: true,
    status: "Pending",
    description: "Requesting upgrade to Enterprise plan for more features",
    plan: "Premium Plan",
    usage: "15 hours this month",
    dues: "$0",
    conflict: {
      isConflict: false,
      message: "No conflicts detected"
    }
  },
  {
    id: "req-4",
    type: "Event Booking",
    title: "Meeting Room Reservation",
    user: { name: "David Kim", avatar: "https://i.pravatar.cc/150?u=david" },
    details: "Private Office",
    timeAgo: "8h ago",
    isHighPriority: false,
    status: "Pending",
    description: "Requesting private office for client meeting",
    plan: "Standard Plan",
    usage: "8 hours this month",
    dues: "$20",
    conflict: {
      isConflict: false,
      message: "No conflicts detected"
    }
  },
  {
    id: "req-5",
    type: "Printer Access",
    title: "Scanner Access",
    user: { name: "Lisa Anderson", avatar: "https://i.pravatar.cc/150?u=lisa" },
    details: "Document Scanner",
    timeAgo: "1d ago",
    isHighPriority: false,
    status: "Pending",
    description: "Requesting access to document scanner",
    plan: "Basic Plan",
    usage: "2 hours this month",
    dues: "$0",
    conflict: {
      isConflict: false,
      message: "No conflicts detected"
    }
  }
];

export function PendingApprovalsModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [activeFilter, setActiveFilter] = useState<"All" | "Event Booking" | "Printer Access" | "Upgrades">("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const filteredRequests = MOCK_REQUESTS.filter((req) => 
    activeFilter === "All" || req.type === activeFilter
  );

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case "Event Booking":
        return (
          <svg className="w-5 h-5 text-[#FF7847]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case "Printer Access":
        return (
          <svg className="w-5 h-5 text-[#FF7847]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
        );
      case "Upgrades":
        return (
          <svg className="w-5 h-5 text-[#FF7847]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        );
      default:
        return null;
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
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
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
              <p className="text-[28px] font-bold text-[#FF7847] mt-1">5</p>
            </div>
            <div className="bg-[#FFF9F2] border border-[#FFEBD6] rounded-xl p-4">
              <p className="text-[13px] text-[#FF7847] font-medium">High Priority</p>
              <p className="text-[28px] font-bold text-[#FF7847] mt-1">2</p>
            </div>
            <div className="bg-[#F0FBFA] border border-[#D5F5F3] rounded-xl p-4">
              <p className="text-[13px] text-[#00C4B8] font-medium">Avg Response</p>
              <p className="text-[28px] font-bold text-[#00C4B8] mt-1">2.5 hours</p>
            </div>
          </div>
        </div>

        {/* Toolbar & List container (gray background, scrollable) */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
          
          {/* Toolbar */}
          {isBulkMode ? (
            <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-gray-100 shadow-sm">
              <span className="text-[14px] text-gray-600 font-medium">{selectedIds.size} request(s) selected</span>
              <div className="flex items-center gap-3">
                <button className="px-4 py-2 bg-[#70D8D3] hover:bg-[#5AC4BF] text-white rounded-lg text-[13px] font-medium transition-colors">
                  Approve All
                </button>
                <button className="px-4 py-2 border border-[#FFDCD3] text-[#FF6B6B] hover:bg-[#FFF5F2] rounded-lg text-[13px] font-medium transition-colors">
                  Reject All
                </button>
                <button onClick={() => { setIsBulkMode(false); setSelectedIds(new Set()); }} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-[13px] font-medium transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {["All", "Event Booking", "Printer Access", "Upgrades"].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter as any)}
                    className={`px-4 py-2 rounded-full text-[14px] font-medium transition-colors ${
                      activeFilter === filter 
                        ? "bg-[#FF7847] text-white" 
                        : "bg-gray-200/50 text-[#4A5565] hover:bg-gray-200"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setIsBulkMode(true)}
                className="px-4 py-2 bg-white border border-gray-200 text-[#101828] rounded-lg text-[14px] font-medium hover:bg-gray-50 transition-colors shadow-sm"
              >
                Bulk Actions
              </button>
            </div>
          )}

          {/* Requests List */}
          <div className="flex flex-col gap-4">
            {filteredRequests.map((req) => (
              <div key={req.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-200">
                
                {/* Card Header (always visible) */}
                <div 
                  className={`p-5 flex items-start gap-4 ${!isBulkMode ? 'cursor-pointer hover:bg-gray-50/50' : ''}`}
                  onClick={() => !isBulkMode && setExpandedId(expandedId === req.id ? null : req.id)}
                >
                  {isBulkMode && (
                    <div className="pt-2">
                      <input 
                        type="checkbox"
                        checked={selectedIds.has(req.id)}
                        onChange={() => toggleSelect(req.id)}
                        className="w-5 h-5 rounded border-gray-300 text-[#FF7847] focus:ring-[#FF7847]"
                      />
                    </div>
                  )}
                  
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl bg-[#FFF5F2] flex items-center justify-center shrink-0">
                    {getIconForType(req.type)}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="text-[16px] font-bold text-[#101828] truncate">{req.title}</h3>
                      <div className="flex items-center gap-3 shrink-0">
                        {req.isHighPriority && (
                          <span className="px-2.5 py-1 bg-[#FFF5F2] text-[#FF7847] text-[12px] font-medium rounded-full border border-[#FFEBE5]">
                            High Priority
                          </span>
                        )}
                        {!isBulkMode && (
                          <svg className={`w-5 h-5 text-gray-400 transition-transform ${expandedId === req.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-[13px] text-gray-500">{req.type}</p>
                    
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-2">
                        <img src={req.user.avatar} alt="" className="w-6 h-6 rounded-full" />
                        <span className="text-[14px] text-[#4A5565]">{req.user.name}</span>
                        <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                        <span className="text-[14px] text-[#4A5565]">{req.details}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-gray-500 text-[13px]">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {req.timeAgo}
                        </div>
                        <span className="px-3 py-1 bg-white border border-[#FFD9CC] text-[#FF7847] text-[12px] font-medium rounded-full">
                          {req.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {!isBulkMode && expandedId === req.id && (
                  <div className="px-5 pb-5 pt-2 border-t border-gray-100 bg-white">
                    <div className="flex flex-col gap-5 mt-4">
                      
                      {/* Description */}
                      <div>
                        <h4 className="text-[14px] font-bold text-[#101828] mb-2">Request Details</h4>
                        <p className="text-[14px] text-[#4A5565]">{req.description}</p>
                      </div>

                      {/* Info Grid */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-[#F8F9FA] rounded-xl p-4">
                          <p className="text-[13px] text-gray-500 mb-1">Plan</p>
                          <p className="text-[14px] font-bold text-[#101828]">{req.plan}</p>
                        </div>
                        <div className="bg-[#F8F9FA] rounded-xl p-4">
                          <p className="text-[13px] text-gray-500 mb-1">Usage</p>
                          <p className="text-[14px] font-bold text-[#101828]">{req.usage}</p>
                        </div>
                        <div className="bg-[#F8F9FA] rounded-xl p-4">
                          <p className="text-[13px] text-gray-500 mb-1">Dues</p>
                          <p className="text-[14px] font-bold text-[#101828]">{req.dues}</p>
                        </div>
                      </div>

                      {/* Context Banner */}
                      {req.conflict && (
                        req.conflict.isConflict ? (
                          <div className="bg-[#FFF9F2] rounded-xl p-4 border border-[#FFEBD6] flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-[#FF7847]">
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              <span className="font-bold text-[14px]">Conflict Detected</span>
                            </div>
                            <p className="text-[#FF7847] text-[13px] ml-7">{req.conflict.message}</p>
                          </div>
                        ) : (
                          <div className="bg-[#F0FBFA] rounded-xl p-4 border border-[#D5F5F3] flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-[#00C4B8]">
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="font-bold text-[14px]">Available</span>
                            </div>
                            <p className="text-[#00C4B8] text-[13px] ml-7">{req.conflict.message}</p>
                          </div>
                        )
                      )}

                      {/* Action Buttons */}
                      <div className="flex items-center gap-3 mt-2">
                        <button className="flex-1 flex items-center justify-center gap-2 bg-[#FF7847] text-white py-2.5 rounded-xl font-medium text-[14px] hover:bg-[#E56A3D] transition-colors shadow-sm">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Approve
                        </button>
                        <button className="flex-1 flex items-center justify-center gap-2 bg-white border border-[#FFDCD3] text-[#FF7847] py-2.5 rounded-xl font-medium text-[14px] hover:bg-[#FFF5F2] transition-colors shadow-sm">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Reject
                        </button>
                        <button className="w-[120px] flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 py-2.5 rounded-xl font-medium text-[14px] hover:bg-gray-50 transition-colors shadow-sm">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                          </svg>
                          Clarify
                        </button>
                      </div>

                    </div>
                  </div>
                )}
              </div>
            ))}

            {filteredRequests.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No requests found for this category.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
