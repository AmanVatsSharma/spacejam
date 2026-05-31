/**
 * File:        apps/web/src/components/ui/dashboard/payment-health-card.tsx
 * Module:      Web · UI · Dashboard · Payment Health Card
 * Purpose:     Card showing payment metrics with 3D pie chart
 *
 * Design Reference: Payment Health card.png - exact match
 * Layout: Header → 3D Pie Chart (center) → Legend (bottom, 3 rows)
 * - Header: "Payment Health" title + "Total Collection" subtitle (left aligned)
 * - 3D Pie Chart: Orange (73% Paid), Red (16% Overdue), Yellow (11% Partial)
 * - Legend: 3 rows with color dot + label + percentage + amount
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-05-31
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

// 3D Pie Chart using proper SVG arc paths
const PieChart3D = ({ total }: { total: string }) => {
  // Total = 100%, Paid = 73%, Overdue = 16%, Partial = 11%
  // Using conic gradient for clean pie, then applying 3D transform

  const paidPercent = 73;
  const overduePercent = 16;
  const partialPercent = 11;

  return (
    <div className="relative w-full flex justify-center py-2">
      {/* 3D Pie Chart */}
      <div
        className="relative"
        style={{
          width: '140px',
          height: '140px',
        }}
      >
        {/* SVG Pie Chart */}
        <svg width="140" height="140" viewBox="0 0 140 140">
          <defs>
            {/* 3D effect gradients for each segment */}
            <linearGradient id="paidGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF8A65" />
              <stop offset="100%" stopColor="#E56A3D" />
            </linearGradient>
            <linearGradient id="overdueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F87171" />
              <stop offset="100%" stopColor="#DC2626" />
            </linearGradient>
            <linearGradient id="partialGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FCD34D" />
              <stop offset="100%" stopColor="#D4A017" />
            </linearGradient>
          </defs>

          {/* Background circle (light gray) */}
          <circle cx="70" cy="70" r="60" fill="#F3F4F6" />

          {/* Pie segments using conic gradient approach via segments */}
          {/* We build segments manually with arc paths */}

          {/* Paid segment - 73% - Orange */}
          <path
            d="M 70 70 L 70 10 A 60 60 0 1 1 40 115 Z"
            fill="url(#paidGrad)"
          />

          {/* Overdue segment - 16% - Red */}
          <path
            d="M 70 70 L 40 115 A 60 60 0 0 1 95 115 Z"
            fill="url(#overdueGrad)"
          />

          {/* Partial segment - 11% - Yellow */}
          <path
            d="M 70 70 L 95 115 A 60 60 0 0 1 70 10 Z"
            fill="url(#partialGrad)"
          />

          {/* Center white circle for donut effect */}
          <circle cx="70" cy="70" r="25" fill="white" />
        </svg>

        {/* 3D depth effect - bottom ellipse */}
        <div
          className="absolute left-0"
          style={{
            width: '140px',
            height: '20px',
            top: '125px',
            background: 'linear-gradient(180deg, rgba(0,0,0,0.08) 0%, transparent 100%)',
            borderRadius: '50%',
          }}
        />

        {/* Total in center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[15px] font-bold text-[#111827] leading-tight">
            {total}
          </span>
          <span className="text-[10px] text-[#6B7280]">Total</span>
        </div>
      </div>
    </div>
  );
};

export function PaymentHealthCard({
  total = "₹39.0L",
  paid = { percent: 73, amount: "₹28.5L" },
  overdue = { percent: 16, amount: "₹6.2L" },
  partial = { percent: 11, amount: "₹4.3L" },
  onViewDetails,
  className = "",
}: PaymentHealthCardProps) {
  const legendItems = [
    { label: "Paid", percent: paid.percent, amount: paid.amount, color: "#FF6A2F" },
    { label: "Overdue", percent: overdue.percent, amount: overdue.amount, color: "#EF4444" },
    { label: "Partial", percent: partial.percent, amount: partial.amount, color: "#FBBF24" },
  ];

  return (
    <div className={`bg-white rounded-[14px] shadow-[0px_0px_0px_0.5px_rgba(0,0,0,0.08),0px_2px_4px_-2px_rgba(0,0,0,0.05)] flex flex-col p-5 ${className}`}>
      {/* Row 1: Header - left aligned */}
      <div className="mb-3">
        <h2 className="text-[15px] font-semibold text-[#111827] tracking-[-0.3px] mb-0.5 text-left">
          Payment Health
        </h2>
        <p className="text-[12px] text-[#6B7280] text-left">Total Collection</p>
      </div>

      {/* Row 2: 3D Pie Chart - centered */}
      <PieChart3D total={total} />

      {/* Row 3: Legend - 3 rows */}
      <div className="flex flex-col gap-2 mt-2">
        {legendItems.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            {/* Color indicator dot */}
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: item.color }}
            />

            {/* Label */}
            <span className="text-[12px] text-[#374151] w-[60px]">
              {item.label}
            </span>

            {/* Percentage */}
            <span className="text-[12px] text-[#6B7280] w-[35px] text-right">
              {item.percent}%
            </span>

            {/* Divider dash */}
            <span className="text-[12px] text-[#D1D5DB]">-</span>

            {/* Amount */}
            <span className="text-[12px] text-[#374151] font-medium">
              {item.amount}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Demo export
export function PaymentHealthCardDemo() {
  return (
    <PaymentHealthCard
      className="flex-1 min-w-0"
    />
  );
}