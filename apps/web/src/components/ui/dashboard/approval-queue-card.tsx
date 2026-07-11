/**
 * File:        apps/web/src/components/ui/dashboard/approval-queue-card.tsx
 * Module:      Web · UI · Dashboard · Approval Queue Card
 * Purpose:     Card showing pending approvals with request details
 *
 * Design Reference: Center Manager view - exact layout
 * - White card with 19px radius, shadow with orange glow
 * - Header with title and badge count
 * - Approval items with colored icon background and time indicator
 * - Icon backgrounds: #FEE4DD (light red), #FCE8E7 (red), #FEECDF (orange)
 *
 * Exports:
 *   - ApprovalQueueCard — card displaying approvals
 *   - ApprovalQueueCardDemo — demo component
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-05-29
 */

"use client";

import React from "react";

interface ApprovalItem {
  id: string;
  title: string;
  subtitle: string;
  timeAgo: string;
  iconColor: string;
}

interface ApprovalQueueCardProps {
  items?: ApprovalItem[];
  pendingCount?: number;
  onViewAll?: () => void;
  className?: string;
}

// Alert icon for approval items
const AlertIcon = ({ color }: { color: string }) => (
  <svg width="12" height="16" viewBox="0 0 12 16" fill="none">
    <path d="M6 1L1 14H11L6 1Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" fill="none"/>
    <circle cx="6" cy="11" r="0.75" fill={color}/>
    <path d="M6 7V9" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export function ApprovalQueueCard({
  items,
  pendingCount = 5,
  onViewAll,
  className = "",
}: ApprovalQueueCardProps) {
  const defaultItems: ApprovalItem[] = items || [
    {
      id: "1",
      title: "Plan Upgrade",
      subtitle: "Priya Mehta - Hot Desk to Cabin",
      timeAgo: "2h",
      iconColor: "#FF7847",
    },
    {
      id: "2",
      title: "Cancellation",
      subtitle: "Amit Kumar - Meeting Room",
      timeAgo: "4h",
      iconColor: "#EF4444",
    },
    {
      id: "3",
      title: "Plan Downgrade",
      subtitle: "Sarah Tech Solutions",
      timeAgo: "1d",
      iconColor: "#FF7847",
    },
  ];

  const getBgColor = (iconColor: string) => {
    switch (iconColor) {
      case "#FF7847":
        return "#FEECDF";
      case "#EF4444":
        return "#FCE8E7";
      default:
        return "#FEE4DD";
    }
  };

  return (
    <div className={`bg-white rounded-[14px] shadow-[0px_0px_0px_0.5px_rgba(0,0,0,0.08),0px_2px_4px_-2px_rgba(0,0,0,0.05)] flex flex-col p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-[16px] font-semibold text-[#1F2937]">Approvals Queue</h2>
        </div>
        {/* Badge count */}
        <div className="w-[28px] h-[28px] bg-[#FF7847] rounded-full flex items-center justify-center">
          <span className="text-[12px] font-bold text-white">{pendingCount}</span>
        </div>
      </div>

      {/* Approval Items */}
      <div className="flex flex-col gap-3">
        {defaultItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 text-center bg-[#F9FAFB] rounded-[10px] border border-dashed border-[#E5E7EB] min-h-[140px]">
            <span className="text-[14px] font-medium text-[#6B7280]">Queue is empty</span>
            <span className="text-[12px] text-[#9CA3AF] mt-1">No approvals pending your review.</span>
          </div>
        ) : (
          defaultItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3 rounded-[10px] bg-[#F9FAFB] cursor-pointer hover:bg-gray-100 transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5"
            >
              {/* Icon */}
              <div
                className="w-[40px] h-[40px] rounded-[12px] flex items-center justify-center flex-shrink-0"
                style={{ background: getBgColor(item.iconColor) }}
              >
                <AlertIcon color={item.iconColor} />
              </div>
  
              {/* Content */}
              <div className="flex flex-col gap-1 flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-semibold text-[#1F2937] leading-[17px] truncate">
                    {item.title}
                  </span>
                  <span className="text-[12px] text-[#9CA3AF] whitespace-nowrap ml-2">
                    {item.timeAgo}
                  </span>
                </div>
                <span className="text-[12px] text-[#6B7280] leading-[15px] truncate">
                  {item.subtitle}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* View All Button */}
      {onViewAll && (
        <button
          onClick={onViewAll}
          className="mt-4 w-full h-[40px] bg-white border border-[#E5E7EB] rounded-[10px] flex items-center justify-center gap-2 text-[14px] font-medium text-[#6B7280] hover:bg-gray-50 transition-all active:scale-[0.97]"
        >
          View All Approvals
        </button>
      )}
    </div>
  );
}

// Demo export
export function ApprovalQueueCardDemo() {
  return (
    <ApprovalQueueCard
      pendingCount={5}
      onViewAll={() => console.log("View all approvals")}
      className="flex-1 min-w-0"
    />
  );
}