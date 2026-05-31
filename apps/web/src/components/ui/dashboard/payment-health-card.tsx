/**
 * File:        apps/web/src/components/ui/dashboard/payment-health-card.tsx
 * Module:      Web · UI · Dashboard · Payment Health Card
 * Purpose:     Card showing payment metrics with donut chart
 *
 * Design Reference: Figma export - exact pixel match
 * - Card: 398x360px, 14px radius, soft shadow
 * - Donut: 250x250px with colored segments (Teal, Yellow, Orange)
 * - Legend: 3 rows with dot + label + percentage + amount
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

// Donut chart - exact Figma dimensions
const DonutChart = ({ total }: { total: string }) => {
  return (
    <div
      className="relative"
      style={{
        width: '250px',
        height: '250px',
        marginLeft: '51px',
        marginTop: '-19px',
      }}
    >
      {/* SVG Donut Chart - exact Figma export */}
      <svg width="250" height="250" viewBox="0 0 250 250" className="absolute top-0 left-0">
        {/* Background track - light blue with 5% opacity */}
        <circle
          cx="125"
          cy="125"
          r="77.33"
          fill="none"
          stroke="rgba(91, 147, 255, 0.05)"
          strokeWidth="12.4348"
        />

        {/* Yellow segment - Partial (11%) */}
        <circle
          cx="125"
          cy="125"
          r="77.33"
          fill="none"
          stroke="#FBBF24"
          strokeWidth="12.4348"
          strokeDasharray="53.5 483"
          transform="rotate(117.86 125 125)"
        />

        {/* Teal segment - Overdue (16%) */}
        <circle
          cx="125"
          cy="125"
          r="77.33"
          fill="none"
          stroke="#00D1C6"
          strokeWidth="12.4348"
          strokeDasharray="77.8 483"
          transform="rotate(35.84 125 125)"
        />

        {/* Orange/Pink segment - Paid (73%) */}
        <circle
          cx="125"
          cy="125"
          r="77.33"
          fill="none"
          stroke="#FF7847"
          strokeWidth="12.4348"
          strokeDasharray="355 483"
          transform="rotate(-90 125 125)"
          style={{
            filter: 'drop-shadow(0px 3.31595px 3.31595px rgba(91, 147, 255, 0.24))'
          }}
        />
      </svg>

      {/* Center text - exact positioning */}
      <div
        className="absolute flex flex-col items-center"
        style={{
          left: '91.19px',
          top: '105.28px',
        }}
      >
        <span
          className="font-extrabold"
          style={{
            fontSize: '19.8957px',
            lineHeight: '24px',
            color: '#030229',
          }}
        >
          {total}
        </span>
        <span
          style={{
            fontSize: '13.2638px',
            lineHeight: '16px',
            color: '#030229',
            opacity: 0.7,
            marginTop: '-1px',
          }}
        >
          Total
        </span>
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
    { label: "Paid", percent: paid.percent, amount: paid.amount, color: "#FF7847" },
    { label: "Overdue", percent: overdue.percent, amount: overdue.amount, color: "#EF4444" },
    { label: "Partial", percent: partial.percent, amount: partial.amount, color: "#FBBF24" },
  ];

  return (
    <div
      className={`bg-white rounded-[14px] flex flex-col p-5 ${className}`}
      style={{
        width: '398px',
        height: '360px',
        boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px -1px rgba(0, 0, 0, 0.1)',
      }}
    >
      {/* Header - left aligned */}
      <div className="mb-3">
        <h2
          style={{
            fontSize: '16px',
            fontWeight: 600,
            lineHeight: '24px',
            letterSpacing: '-0.3125px',
            color: '#1F2937',
          }}
        >
          Payment Health
        </h2>
        <p
          style={{
            fontSize: '12px',
            lineHeight: '16px',
            color: '#6B7280',
            marginTop: '1.5px',
          }}
        >
          Total payment characteristics
        </p>
      </div>

      {/* Donut Chart - positioned as per Figma */}
      <DonutChart total={total} />

      {/* Legend - 3 rows at bottom, exact spacing from Figma */}
      <div className="flex flex-col gap-3 mt-[-80px]">
        {legendItems.map((item, index) => (
          <div
            key={item.label}
            className="flex items-center"
            style={{
              height: '20px',
              justifyContent: 'space-between',
            }}
          >
            {/* Left: Color dot + Label */}
            <div className="flex items-center gap-2">
              {/* Color indicator dot - 12px */}
              <div
                className="rounded-full"
                style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: item.color,
                }}
              />
              {/* Label - 14px */}
              <span
                style={{
                  fontSize: '14px',
                  lineHeight: '20px',
                  color: '#6B7280',
                  letterSpacing: '-0.150391px',
                }}
              >
                {item.label}
              </span>
            </div>

            {/* Right: Percentage + Amount */}
            <div className="flex items-center gap-3">
              {/* Percentage - 12px */}
              <span
                style={{
                  fontSize: '12px',
                  lineHeight: '16px',
                  color: '#6B7280',
                  minWidth: '25px',
                }}
              >
                {item.percent}%
              </span>
              {/* Amount - 14px, font-weight 500 */}
              <span
                style={{
                  fontSize: '14px',
                  lineHeight: '20px',
                  fontWeight: 500,
                  color: '#1F2937',
                  letterSpacing: '-0.150391px',
                }}
              >
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