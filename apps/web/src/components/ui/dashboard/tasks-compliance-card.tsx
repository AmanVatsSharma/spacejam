/**
 * File:        apps/web/src/components/ui/dashboard/tasks-compliance-card.tsx
 * Module:      Web · UI · Dashboard · Tasks & Compliance Card
 * Purpose:     Card showing compliance items with urgency indicators
 *
 * Design Reference: Center Manager view - exact layout
 * - White card with 19px radius, shadow with orange glow
 * - Header with title and badge count
 * - Compliance items with colored left border indicators
 * - Red indicator: Missing KYC (urgent)
 * - Orange indicator: Deposit Pending
 * - Red indicator: Overdue Invoices
 *
 * Exports:
 *   - TasksComplianceCard — card displaying compliance items
 *   - TasksComplianceCardDemo — demo component
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-05-29
 */

"use client";

import React from "react";

interface ComplianceItem {
  id: string;
  title: string;
  subtitle: string;
  color: "red" | "orange" | "yellow";
}

interface TasksComplianceCardProps {
  items?: ComplianceItem[];
  badgeCount?: number;
  onViewAll?: () => void;
  className?: string;
}

// Red dot icon
const RedDotIcon = () => (
  <div className="w-[12px] h-[12px] bg-[#EF4444] rounded-full" />
);

// Orange dot icon
const OrangeDotIcon = () => (
  <div className="w-[12px] h-[12px] bg-[#FF7847] rounded-full" />
);

// Arrow right icon
const ArrowRightIcon = () => (
  <svg width="7.5" height="12" viewBox="0 0 7.5 12" fill="none">
    <path d="M1 6H6.5M6.5 6L4 3.5M6.5 6L4 8.5" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export function TasksComplianceCard({
  items,
  badgeCount = 8,
  onViewAll,
  className = "",
}: TasksComplianceCardProps) {
  const defaultItems: ComplianceItem[] = items || [
    {
      id: "1",
      title: "Missing KYC",
      subtitle: "3 members pending",
      color: "red",
    },
    {
      id: "2",
      title: "Deposit Pending",
      subtitle: "2 bookings",
      color: "orange",
    },
    {
      id: "3",
      title: "Overdue Invoices",
      subtitle: "₹84,500 pending",
      color: "red",
    },
    {
      id: "4",
      title: "Lease Renewal",
      subtitle: "4 members pending",
      color: "orange",
    },
  ];

  const getIcon = (color: ComplianceItem["color"]) => {
    switch (color) {
      case "red":
        return <RedDotIcon />;
      case "orange":
        return <OrangeDotIcon />;
      case "yellow":
        return <OrangeDotIcon />;
      default:
        return <OrangeDotIcon />;
    }
  };

  const getBgColor = (color: ComplianceItem["color"]) => {
    switch (color) {
      case "red":
        return "rgba(255, 120, 71, 0.05)";
      case "orange":
        return "#FFF7ED";
      case "yellow":
        return "#FEF2D3";
      default:
        return "#FFF7ED";
    }
  };

  return (
    <div className={`bg-white rounded-[14px] shadow-[0px_0px_0px_0.5px_rgba(0,0,0,0.08),0px_2px_4px_-2px_rgba(0,0,0,0.05)] flex flex-col p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-[16px] font-semibold text-[#1F2937]">Tasks & Compliance</h2>
        </div>
        {/* Badge count */}
        <div className="w-[28px] h-[28px] bg-[#FF7847] rounded-full flex items-center justify-center">
          <span className="text-[12px] font-bold text-white">{badgeCount}</span>
        </div>
      </div>

      {/* Compliance Items */}
      <div className="flex flex-col gap-3">
        {defaultItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 text-center bg-[#F9FAFB] rounded-[10px] border border-dashed border-[#E5E7EB] min-h-[140px]">
            <span className="text-[14px] font-medium text-[#6B7280]">All caught up!</span>
            <span className="text-[12px] text-[#9CA3AF] mt-1">No pending tasks or compliance issues.</span>
          </div>
        ) : (
          defaultItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 rounded-[10px] cursor-pointer hover:opacity-90 transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5"
              style={{ background: getBgColor(item.color) }}
            >
              <div className="flex items-center gap-3">
                {getIcon(item.color)}
                <div className="flex flex-col gap-0.5">
                  <span className="text-[14px] font-semibold text-[#1F2937] leading-[17px]">
                    {item.title}
                  </span>
                  <span className="text-[12px] text-[#6B7280] leading-[15px]">
                    {item.subtitle}
                  </span>
                </div>
              </div>
              <ArrowRightIcon />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Demo export
export function TasksComplianceCardDemo() {
  return (
    <TasksComplianceCard
      badgeCount={8}
      className="flex-1 min-w-0"
    />
  );
}