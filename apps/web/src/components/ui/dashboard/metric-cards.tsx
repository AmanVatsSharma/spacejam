/**
 * File:        apps/web/src/components/ui/dashboard/metric-cards.tsx
 * Module:      Web · UI · Dashboard · Small Metric Cards
 * Purpose:     Two small metric cards: Deposit Held and Event Today
 *
 * Design Reference: second_stack.png
 * - Card: white bg, 14px radius, shadow
 * - Icon container: 36x36px, #FFF5F1 bg, 10px radius
 * - Value: 28px, Inter, 600 weight
 * - Label: 12px, color #6B7280
 * - Trend: arrow + percentage in #FF7847
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-05-29
 */

"use client";

import React from "react";

// Deposit icon
const DepositIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <rect x="1" y="1" width="12" height="12" rx="2" stroke="#FF6A2F" strokeWidth="1.33"/>
    <path d="M4 5h6M4 7h4" stroke="#FF6A2F" strokeWidth="1.33" strokeLinecap="round"/>
  </svg>
);

// Event icon (star in square)
const EventIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <rect x="1" y="1" width="12" height="12" rx="2" stroke="#FF6A2F" strokeWidth="1.33"/>
    <path d="M7 4.5l1.35 1.35 2.15 0.3-1.55 1.5 0.35 2.1L7 8.1 4.7 9.75l0.35-2.1L3.5 6.15l2.15-0.3L7 4.5z" stroke="#FF6A2F" strokeWidth="1.33" strokeLinejoin="round"/>
  </svg>
);

// Trend up arrow
const TrendUpIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M6 9V3M3 6l3-3 3 3" stroke="#FF7847" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  changePercent?: number;
  className?: string;
}

export function MetricCard({
  label,
  value,
  icon,
  changePercent,
  className = "",
}: MetricCardProps) {
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
            <TrendUpIcon />
            <span className="text-[12px] text-[#FF7847]">{changePercent}%</span>
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

// Demo exports
export function DepositHeldCardDemo() {
  return (
    <MetricCard
      label="Deposit Held"
      value="₹3.8L"
      icon={<DepositIcon />}
      changePercent={5}
      className="flex-1"
    />
  );
}

export function EventTodayCardDemo() {
  return (
    <MetricCard
      label="Event Today"
      value="6"
      icon={<EventIcon />}
      changePercent={5}
      className="flex-1"
    />
  );
}