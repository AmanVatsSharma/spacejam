/**
 * File:        apps/web/src/components/ui/dashboard/payment-health-card.tsx
 * Module:      Web · UI · Dashboard · Payment Health Card
 * Purpose:     Card showing payment metrics with donut chart
 *
 * Design Reference: Figma CSS export - exact pixel match
 * - Card: 398x360px, 14px radius, soft shadow
 * - Donut: 250x250px container with 4 ellipses creating arc effect
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

// Exact Figma donut chart using ellipses
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
      {/* Main donut container */}
      <div
        className="absolute"
        style={{
          width: '250px',
          height: '250px',
          left: '0px',
          top: '0px',
        }}
      >
        {/* Ellipse 28 - Background track */}
        <div
          style={{
            position: 'absolute',
            width: '179.06px',
            height: '179.06px',
            left: '35.47px',
            top: '35.47px',
            border: '12.4348px solid rgba(91, 147, 255, 0.05)',
            borderRadius: '50%',
            boxSizing: 'border-box',
          }}
        />

        {/* Ellipse 31 - Yellow (Partial 11%) */}
<div
          style={{
            position: 'absolute',
            width: '179.06px',
            height: '179.06px',
            left: '4.01px',
            top: '4.01px',
            background: '#FBBF24',
            borderRadius: '45.5943px',
            transform: 'rotate(117.86deg)',
 }}
        />

        {/* Ellipse 30 - Teal (Overdue 16%) */}
        <div
          style={{
            position: 'absolute',
            width: '179.06px',
            height: '179.06px',
            left: '0px',
            top: '0px',
            background: '#00D1C6',
            borderRadius: '25.6986px',
            transform: 'rotate(35.84deg)',
          }}
        />

        {/* Ellipse 29 - Orange (Paid 73%) with shadow */}
        <div
          style={{
            position: 'absolute',
            width: '179.06px',
            height: '179.06px',
            left: '35.47px',
            top: '35.47px',
            background: '#FF7847',
            borderRadius: '28.1856px',
            transform: 'rotate(-90deg)',
            boxShadow: '0px 3.31595px 3.31595px rgba(91, 147, 255, 0.24)',
          }}
        />
      </div>

      {/* Center text overlay */}
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
            fontFamily: 'Inter, sans-serif',
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
            fontFamily: 'Inter, sans-serif',
            marginTop: '2px',
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
    { label: "Overdue", percent: overdue.percent, amount: overdue.amount, color: "#00D1C6" },
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
            fontFamily: 'Inter, sans-serif',
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
            fontFamily: 'Inter, sans-serif',
          }}
        >
          Total payment characteristics
        </p>
      </div>

      {/* Donut Chart */}
<DonutChart total={total} />

      {/* Legend - 3 rows */}
      <div className="flex flex-col gap-3 mt-4">
        {legendItems.map((item) => (
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
              <div
                className="rounded-full"
                style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: item.color,
                }}
              />
              <span
                style={{
                  fontSize: '14px',
                  lineHeight: '20px',
                  color: '#6B7280',
                  letterSpacing: '-0.150391px',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {item.label}
              </span>
            </div>

            {/* Right: Percentage + Amount */}
            <div className="flex items-center gap-3">
              <span
                style={{
                  fontSize: '12px',
                  lineHeight: '16px',
                  color: '#6B7280',
                  minWidth: '25px',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {item.percent}%
              </span>
              <span
                style={{
                  fontSize: '14px',
                  lineHeight: '20px',
                  fontWeight: 500,
                  color: '#1F2937',
                  letterSpacing: '-0.150391px',
                  fontFamily: 'Inter, sans-serif',
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