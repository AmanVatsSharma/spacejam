/**
 * File:        apps/web/src/components/ui/dashboard/payment-health-card.tsx
 * Module:      Web · UI · Dashboard · Payment Health Card
 * Purpose:     Card showing payment metrics with donut chart
 *
 * Design Reference: Center Manager view - exact layout
 * - White card with 14px radius, shadow
 * - Header: "Payment Health" title + subtitle
 * - Donut chart showing total collection
 * - Payment breakdown: Paid (73% ₹28.5L), Overdue (16% ₹6.2L), Partial (11% ₹4.3L)
 * - Total: ₹39.0L in center of donut
 *
 * Exports:
 *   - PaymentHealthCard — card displaying payment health
 *   - PaymentHealthCardDemo — demo component
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-05-29
 */

"use client";

import React from "react";

interface PaymentHealthCardProps {
  total?: string;
  paid?: { percent: number; amount: string };
  overdue?: { percent: number; amount: string };
  partial?: { percent: number; amount: string };
  onViewDetails?: () => void;
  className?: string;
}

// Donut chart component
const DonutChart = ({ total }: { total: string }) => {
  return (
    <div className="relative w-[250px] h-[250px]">
      {/* Background circle */}
      <svg className="absolute inset-0" viewBox="0 0 179 179">
        {/* Donut segments using stroke-dasharray */}
        {/* Total collection: 73% orange, 16% red, 11% yellow */}
        <circle
          cx="89.5"
          cy="89.5"
          r="70"
          fill="none"
          stroke="#00D1C6"
          strokeWidth="12"
          strokeDasharray="220 220"
          strokeDashoffset="85"
          transform="rotate(-90 89.5 89.5)"
        />
        <circle
          cx="89.5"
          cy="89.5"
          r="70"
          fill="none"
          stroke="#FF7847"
          strokeWidth="12"
          strokeDasharray="180 220"
          strokeDashoffset="-135"
          transform="rotate(-90 89.5 89.5)"
        />
        <circle
          cx="89.5"
          cy="89.5"
          r="70"
          fill="none"
          stroke="#FBBF24"
          strokeWidth="12"
          strokeDasharray="50 220"
          strokeDashoffset="45"
          transform="rotate(-90 89.5 89.5)"
        />
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[19.9px] font-extrabold text-[#030229] leading-[24px]">
          {total}
        </span>
        <span className="text-[13.3px] text-[#030229] opacity-70">Total</span>
      </div>
    </div>
  );
};

// Dot indicator - inlined in component for each color

export function PaymentHealthCard({
  total = "₹39.0L",
  paid = { percent: 73, amount: "₹28.5L" },
  overdue = { percent: 16, amount: "₹6.2L" },
  partial = { percent: 11, amount: "₹4.3L" },
  onViewDetails,
  className = "",
}: PaymentHealthCardProps) {
  return (
    <div className={`bg-white rounded-[14px] shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] flex flex-col p-5 ${className}`}>
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-[16px] font-semibold text-[#1F2937] tracking-[-0.3125px] mb-1">
          Payment Health
        </h2>
        <p className="text-[12px] text-[#6B7280]">Total payment characteristics</p>
      </div>

      <div className="flex gap-6">
        {/* Donut Chart */}
        <DonutChart total={total} />

        {/* Payment breakdown */}
        <div className="flex flex-col gap-4 flex-1 justify-center">
          {/* Paid */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-[12px] h-[12px] rounded-full bg-[#FF7847]" />
              <span className="text-[14px] text-[#6B7280]">Paid</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[12px] text-[#6B7280]">{paid.percent}%</span>
              <span className="text-[14px] font-medium text-[#1F2937]">{paid.amount}</span>
            </div>
          </div>

          {/* Overdue */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-[12px] h-[12px] rounded-full bg-[#EF4444]" />
              <span className="text-[14px] text-[#6B7280]">Overdue</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[12px] text-[#6B7280]">{overdue.percent}%</span>
              <span className="text-[14px] font-medium text-[#1F2937]">{overdue.amount}</span>
            </div>
          </div>

          {/* Partial */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-[12px] h-[12px] rounded-full bg-[#FBBF24]" />
              <span className="text-[14px] text-[#6B7280]">Partial</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[12px] text-[#6B7280]">{partial.percent}%</span>
              <span className="text-[14px] font-medium text-[#1F2937]">{partial.amount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Demo export
export function PaymentHealthCardDemo() {
  return (
    <PaymentHealthCard
      className="w-[488px] h-[360px]"
    />
  );
}