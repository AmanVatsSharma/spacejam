/**
 * File:        apps/web/src/components/ui/dashboard/payment-health-card.tsx
 * Module:      Web · UI · Dashboard · Payment Health Card
 * Purpose:     Card showing payment metrics with donut chart
 *
 * Design Reference: Figma SVG export - exact match with 3D effect
 * - Card: 398x360px, 14px radius, soft shadow
 * - Donut: 250x250px with colored segments (Yellow, Teal, Orange with shadow)
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

// Exact Figma SVG donut chart
const DonutChart = ({ total }: { total: string }) => {
  return (
    <svg width="250" height="250" viewBox="0 0 250 250" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Background track */}
      <circle cx="125" cy="124.999" r="83.3132" stroke="#5B93FF" strokeOpacity="0.05" strokeWidth="12.4348"/>

      {/* Yellow segment - Partial (11%) */}
      <path
        d="M87.8572 195.259C85.2613 200.17 79.1364 202.091 74.5478 198.961C67.0428 193.842 60.3443 187.598 54.6952 180.434C46.9653 170.63 41.3712 159.319 38.2721 147.225C35.1729 135.131 34.6373 122.523 36.6996 110.21C38.2067 101.212 41.077 92.5166 45.1948 84.4186C47.7125 79.4675 54.0066 78.2063 58.6443 81.2632C63.282 84.32 64.4885 90.5359 62.1333 95.5664C59.4679 101.26 57.5815 107.303 56.5379 113.533C54.939 123.08 55.3543 132.855 57.7571 142.232C60.16 151.608 64.4973 160.379 70.4905 167.98C74.4019 172.94 78.9623 177.331 84.0373 181.041C88.5216 184.319 90.4532 190.349 87.8572 195.259Z"
        fill="#FBBF24"
      />

      {/* Teal segment - Overdue (16%) */}
      <path
        d="M186.669 172.104C191.905 176.104 192.958 183.659 188.298 188.318C174.703 201.909 157.004 210.844 137.767 213.616C118.53 216.387 99.0287 212.812 82.1494 203.611C76.3644 200.457 75.2419 192.912 79.136 187.597C83.0301 182.282 90.4655 181.245 96.3964 184.114C108.102 189.778 121.317 191.879 134.365 190C147.413 188.12 159.497 182.374 169.127 173.636C174.007 169.209 181.433 168.105 186.669 172.104Z"
        fill="#00D1C6"
      />

      {/* Orange/Pink segment - Paid (73%) with shadow filter */}
      <g filter="url(#filter0_d_0_32323)">
        <path
          d="M56.6356 96.884C48.6619 93.6048 44.7484 84.3819 49.3612 77.098C53.8468 70.0152 59.3188 63.5755 65.633 57.9823C75.8568 48.9256 88.0171 42.3282 101.183 38.6949C114.349 35.0616 128.172 34.4888 141.594 37.0204C155.016 39.5519 167.68 45.1207 178.618 53.3005C189.556 61.4802 198.478 72.0541 204.7 84.2127C210.922 96.3714 214.28 109.792 214.517 123.449C214.753 137.105 211.862 150.634 206.065 163.001C202.485 170.639 197.854 177.708 192.328 184.013C186.646 190.497 176.693 189.35 171.293 182.628C165.894 175.907 167.188 166.163 172.241 159.178C174.377 156.225 176.239 153.07 177.795 149.749C181.571 141.695 183.454 132.884 183.3 123.99C183.146 115.096 180.959 106.355 176.906 98.4363C172.854 90.5177 167.044 83.6312 159.92 78.3039C152.796 72.9767 144.548 69.3499 135.807 67.7012C127.066 66.0525 118.063 66.4255 109.489 68.7917C100.914 71.158 92.9942 75.4547 86.3358 81.3531C83.5906 83.7848 81.0898 86.4623 78.8614 89.346C73.5896 96.1681 64.6093 100.163 56.6356 96.884Z"
          fill="#FF7847"
        />
      </g>

      <defs>
        <filter id="filter0_d_0_32323" x="44.0742" y="35.4692" width="173.772" height="159.481" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix"/>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <feOffset dy="3.31595"/>
          <feGaussianBlur stdDeviation="1.65797"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0.356863 0 0 0 0 0.576471 0 0 0 0 1 0 0 0 0.24 0"/>
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_0_32323"/>
          <feBlend mode="normal" in2="effect1_dropShadow_0_32323" result="shape"/>
        </filter>
      </defs>
    </svg>
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

      {/* Donut Chart - centered with negative margin to reduce space */}
      <div className="flex justify-center items-center flex-1">
        <div className="relative">
          <DonutChart total={total} />
          {/* Center total text overlay */}
          <div
            className="absolute flex flex-col items-center justify-center"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
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
              }}
            >
              Total
            </span>
          </div>
        </div>
      </div>

      {/* Legend - 3 rows at bottom */}
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