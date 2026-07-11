/**
 * File:        apps/web/src/components/ui/dashboard/payment-health-card.tsx
 * Module:      Web · UI · Dashboard · Payment Health Card
 * Purpose:     Card showing payment metrics with a dynamic donut chart
 *              whose arc segments are generated from real percentage data.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-09
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

/**
 * Generate an SVG arc path for a donut segment.
 * Uses polar-to-cartesian conversion to draw a stroked arc.
 */
function describeArc(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
): string {
  // Angles in degrees, 0 = top, clockwise
  const startRad = ((startAngle - 90) * Math.PI) / 180;
  const endRad = ((endAngle - 90) * Math.PI) / 180;

  const x1 = cx + radius * Math.cos(startRad);
  const y1 = cy + radius * Math.sin(startRad);
  const x2 = cx + radius * Math.cos(endRad);
  const y2 = cy + radius * Math.sin(endRad);

  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
}

// Dynamic donut chart — generates arc segments from real percentages
const DonutChart = ({
  paidPercent,
  overduePercent,
  partialPercent,
  total,
}: {
  paidPercent: number;
  overduePercent: number;
  partialPercent: number;
  total: string;
}) => {
  const size = 250;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 83;
  const strokeWidth = 13;
  const gap = 2; // small gap between segments in degrees

  // Build segments in clockwise order starting from top
  // Order: Paid (orange), Overdue (teal), Partial (yellow)
  const segments: { label: string; percent: number; color: string }[] = [
    { label: "Paid", percent: paidPercent, color: "#FF7847" },
    { label: "Overdue", percent: overduePercent, color: "#00D1C6" },
    { label: "Partial", percent: partialPercent, color: "#FBBF24" },
  ];

  let currentAngle = 0;
  const totalPercent = segments.reduce((sum, s) => sum + s.percent, 0) || 1;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Background track */}
        <circle cx={cx} cy={cy} r={radius} stroke="#5B93FF" strokeOpacity="0.05" strokeWidth={strokeWidth} />

        {/* Segments */}
        {segments.map((seg) => {
          const sweep = (seg.percent / totalPercent) * 360;
          if (sweep <= 0) return null;
          const startAngle = currentAngle + (sweep > gap * 2 ? gap / 2 : 0);
          const endAngle = currentAngle + sweep - (sweep > gap * 2 ? gap / 2 : 0);
          currentAngle += sweep;
          return (
            <path
              key={seg.label}
              d={describeArc(cx, cy, radius, startAngle, endAngle)}
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              fill="none"
            />
          );
        })}
      </svg>

      {/* Center text overlay */}
      <div className="absolute flex flex-col items-center">
        <span
          className="font-extrabold text-[#030229]"
          style={{ fontSize: '20px', lineHeight: '24px', fontFamily: 'Inter, sans-serif' }}
        >
          {total}
        </span>
        <span
          className="text-[#030229] opacity-70"
          style={{ fontSize: '13px', lineHeight: '16px', fontFamily: 'Inter, sans-serif', marginTop: '2px' }}
        >
          Total
        </span>
      </div>
    </div>
  );
};

export function PaymentHealthCard({
  total = "₹0",
  paid = { percent: 0, amount: "₹0" },
  overdue = { percent: 0, amount: "₹0" },
  partial = { percent: 0, amount: "₹0" },
  onViewDetails,
  className = "",
}: PaymentHealthCardProps) {
  const legendItems = [
    { label: "Paid", percent: paid.percent, amount: paid.amount, color: "#FF7847" },
    { label: "Overdue", percent: overdue.percent, amount: overdue.amount, color: "#00D1C6" },
    { label: "Partial", percent: partial.percent, amount: partial.amount, color: "#FBBF24" },
  ];

  return (
    <div
      className={`bg-white rounded-[14px] flex flex-col p-5 h-full transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${className}`}
      style={{
        minWidth: '340px',
        boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px -1px rgba(0, 0, 0, 0.1)',
      }}
    >
      {/* Header */}
      <div className="mb-2">
        <h2
          className="text-[#1F2937]"
          style={{ fontSize: '16px', fontWeight: 600, lineHeight: '24px', letterSpacing: '-0.3px', fontFamily: 'Inter, sans-serif' }}
        >
          Payment Health
        </h2>
        <p className="text-[#6B7280]" style={{ fontSize: '12px', lineHeight: '16px', fontFamily: 'Inter, sans-serif' }}>
          Total payment characteristics
        </p>
      </div>

      {/* Dynamic Donut Chart */}
      <div className="flex items-center justify-center flex-1">
        <DonutChart
          paidPercent={paid.percent}
          overduePercent={overdue.percent}
          partialPercent={partial.percent}
          total={total}
        />
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-2 mt-2">
        {legendItems.map((item) => (
          <div key={item.label} className="flex items-center justify-between" style={{ height: '20px' }}>
            <div className="flex items-center gap-2">
              <div className="rounded-full" style={{ width: '12px', height: '12px', backgroundColor: item.color }} />
              <span className="text-[#6B7280]" style={{ fontSize: '14px', fontFamily: 'Inter, sans-serif' }}>
                {item.label}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[#6B7280]" style={{ fontSize: '12px', minWidth: '25px', fontFamily: 'Inter, sans-serif' }}>
                {item.percent}%
              </span>
              <span className="text-[#1F2937] font-medium" style={{ fontSize: '14px', fontFamily: 'Inter, sans-serif' }}>
                {item.amount}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Demo export
export function PaymentHealthCardDemo() {
  return <PaymentHealthCard className="flex-1 min-w-0" />;
}
