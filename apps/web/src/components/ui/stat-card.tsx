/**
 * File:        apps/web/src/components/ui/stat-card.tsx
 * Module:      Web · UI · KPI Cards
 * Purpose:     4 KPI cards showing Revenue, Active Customers, Outstanding Dues, Bookings Today
 *
 * Design Reference: 4-KPI.png - exact Figma specs
 * - Card: 285px x 142px (first 3), last is 292px
 * - Border-radius: 14px
 * - Icon container: 36x36px, background #FFF5F1, radius 10px
 * - Value: 28px, Inter, 600 weight, color #1F2937
 * - Label: 12px, Inter, color #6B7280
 * - Trend: #FF7847 color, 12px
 * - Cards span full width below welcome header
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-05-29
 */

"use client";

import React from "react";

type TrendDirection = "up" | "down" | "neutral";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  changePercent?: number;
  changeDirection?: TrendDirection;
  className?: string;
}

// Revenue icon - bar chart
const RevenueIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="1.5" y="8" width="3" height="6" stroke="#FF6A2F" strokeWidth="1.33"/>
    <rect x="6" y="4" width="3" height="10" stroke="#FF6A2F" strokeWidth="1.33"/>
    <rect x="10.5" y="6" width="3" height="8" stroke="#FF6A2F" strokeWidth="1.33"/>
  </svg>
);

// Active Customers icon - people
const CustomersIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="5.5" cy="5" r="2.5" stroke="#FF6A2F" strokeWidth="1.33"/>
    <path d="M0.5 13c0-2.5 2-4.5 5-4.5s5 2 5 4.5" stroke="#FF6A2F" strokeWidth="1.33"/>
    <circle cx="11" cy="5" r="2" stroke="#FF6A2F" strokeWidth="1.33"/>
    <path d="M13 11c0-1.5-.8-2.8-2-3.5" stroke="#FF6A2F" strokeWidth="1.33"/>
  </svg>
);

// Outstanding Dues icon - alert/triangle
const DuesIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M10 2L1 18H19L10 2Z" stroke="#FF7847" strokeWidth="1.67" strokeLinejoin="round"/>
    <path d="M10 8V11" stroke="#FF7847" strokeWidth="1.67" strokeLinecap="round"/>
    <circle cx="10" cy="14.5" r="0.83" fill="#FF7847"/>
  </svg>
);

// Bookings icon - calendar
const BookingsIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <rect x="1.5" y="2.5" width="11" height="10" rx="1.75" stroke="#FF7847" strokeWidth="1.75"/>
    <path d="M1.5 5.5H12.5" stroke="#FF7847" strokeWidth="1.75"/>
    <path d="M4.5 1V3.5M9.5 1V3.5" stroke="#FF7847" strokeWidth="1.75" strokeLinecap="round"/>
  </svg>
);

// Deposit Held icon - tablet/handheld
const DepositIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="2.5" y="1.5" width="9" height="13" rx="1.5" stroke="#FF7847" strokeWidth="1.33"/>
    <rect x="5" y="3.5" width="4" height="6" rx="0.5" fill="#FF7847"/>
    <path d="M5.5 12H8.5" stroke="#FF7847" strokeWidth="1.33" strokeLinecap="round"/>
  </svg>
);

// Event Today icon - calendar with event
const EventIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="#FF7847" strokeWidth="1.33"/>
    <path d="M2 6.5H14" stroke="#FF7847" strokeWidth="1.33"/>
    <path d="M5 1.5V4M11 1.5V4" stroke="#FF7847" strokeWidth="1.33" strokeLinecap="round"/>
    <circle cx="8" cy="10" r="1.5" fill="#FF7847"/>
  </svg>
);

// Trend up arrow
const TrendUpIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M6 9V3M3 6l3-3 3 3" stroke="#FF7847" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Trend down arrow
const TrendDownIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M6 3v6M3 6l3 3 3-3" stroke="#FF7847" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export function StatCard({
  label,
  value,
  icon,
  changePercent,
  changeDirection = "up",
  className = "",
}: StatCardProps) {
  return (
    <div
      className={`bg-white rounded-[14px] shadow-[0px_0px_0px_0.5px_rgba(0,0,0,0.08),0px_2px_4px_-2px_rgba(0,0,0,0.05)] flex flex-col gap-2 p-5 ${className}`}
    >
      {/* Top Row - Icon and Trend */}
      <div className="flex items-center justify-between">
        {/* Icon Container - circular with #FFF5F1 background */}
        <div className="w-[36px] h-[36px] bg-[#FFF5F1] rounded-full flex items-center justify-center">
          {icon}
        </div>

        {/* Trend Indicator */}
        {changePercent !== undefined && (
          <div className="flex items-center gap-1">
            {changeDirection === "up" ? <TrendUpIcon /> : <TrendDownIcon />}
            <span className="text-[12px] text-[#FF7847]">
              {changePercent}%
            </span>
          </div>
        )}
      </div>

      {/* Value - 28px, Inter, 600 weight */}
      <div>
        <span className="text-[28px] font-semibold text-[#1F2937] leading-[32px] tracking-[0.0703125px]">
          {value}
        </span>
      </div>

      {/* Label - 12px, color #6B7280 */}
      <div>
        <span className="text-[12px] text-[#6B7280]">{label}</span>
      </div>
    </div>
  );
}

// Pre-configured 6 KPI cards - spans full width
export function StatCards() {
  const stats = [
    {
      label: "Revenue (MTD)",
      value: "₹9.8L",
      icon: <RevenueIcon />,
      changePercent: 12,
      changeDirection: "up" as TrendDirection,
      className: "flex-1 min-w-0",
    },
    {
      label: "Active Customer",
      value: "20",
      icon: <CustomersIcon />,
      changePercent: 5,
      changeDirection: "up" as TrendDirection,
      className: "flex-1 min-w-0",
    },
    {
      label: "Outstanding Dues",
      value: "₹6.2L",
      icon: <DuesIcon />,
      changePercent: 8,
      changeDirection: "down" as TrendDirection,
      className: "flex-1 min-w-0",
    },
    {
      label: "Booking Today",
      value: "3",
      icon: <BookingsIcon />,
      changePercent: 5,
      changeDirection: "up" as TrendDirection,
      className: "flex-1 min-w-0",
    },
    {
      label: "Deposit Held",
      value: "₹3.8L",
      icon: <DepositIcon />,
      changePercent: 5,
      changeDirection: "up" as TrendDirection,
      className: "flex-1 min-w-0",
    },
    {
      label: "Event Today",
      value: "6",
      icon: <EventIcon />,
      changePercent: 5,
      changeDirection: "up" as TrendDirection,
      className: "flex-1 min-w-0",
    },
  ];

  return (
    <div className="grid grid-cols-6 compact:grid-cols-3 gap-[21px] compact:gap-3">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
}

// Export icons
export { RevenueIcon, CustomersIcon, DuesIcon, BookingsIcon, DepositIcon, EventIcon, TrendUpIcon, TrendDownIcon };