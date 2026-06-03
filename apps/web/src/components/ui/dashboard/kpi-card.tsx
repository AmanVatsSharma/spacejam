/**
 * File:        apps/web/src/components/ui/dashboard/kpi-card.tsx
 * Module:      Web · UI · Dashboard · KPI Card
 * Purpose:     KPI card showing metric with value and trend
 *
 * Design Reference: Figma CSS export - exact pixel match
 * - Card: 232px x 132px, 14px radius, white bg, shadow
 * - Icon container (36px, rounded, light orange bg)
 * - Label text (12px, Inter, #6B7280)
 * - Value (28px, Inter, 600, #1F2937)
 * - Trend with up/down arrow icon + percentage
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-05-31
 */

"use client";

import React from "react";

interface KPICardProps {
  /** Card dimensions */
  width?: number;
  height?: number;
  /** Icon to display (SVG or component) */
  icon?: React.ReactNode;
  /** Label text below icon */
  label?: string;
  /** Main value to display */
  value?: string | number;
  /** Trend percentage string (e.g., "5%") */
  trend?: string;
  /** Trend color */
  trendColor?: string;
  /** Background color for icon container */
  iconBgColor?: string;
  /** Icon stroke color */
  iconColor?: string;
  /** Additional className */
  className?: string;
}

// Trend up arrow icon
const TrendUpIcon = ({ color = "#FF7847" }: { color?: string }) => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path
      d="M6 10V2M6 2L2 6M6 2L10 6"
      stroke={color}
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Default tablet icon (from Figma - streamline-sharp:one-handed-holding-tablet-handheld)
const TabletIcon = ({ color = "#FF6A2F" }: { color?: string }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="2" y="1" width="12" height="14" rx="2" stroke={color} strokeWidth="1.5" />
    <line x1="6" y1="13" x2="10" y2="13" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export function KPICard({
  width = 232,
  height = 132,
  icon,
  label = "Deposit Held",
  value = "₹3.8L",
  trend = "5%",
  trendColor = "#FF7847",
  iconBgColor = "#FFF5F1",
  iconColor = "#FF6A2F",
  className = "",
}: KPICardProps) {
  return (
    <div
      className={`bg-white rounded-[14px] relative ${className}`}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px -1px rgba(0, 0, 0, 0.1)',
      }}
    >
      {/* Icon container - top left */}
      <div
        className="absolute flex items-center justify-center"
        style={{
          width: '36px',
          height: '36px',
          top: '20px',
          left: '20px',
          background: iconBgColor,
          borderRadius: '10px',
        }}
      >
        {icon || <TabletIcon color={iconColor} />}
      </div>

      {/* Label - below icon area */}
      <div
        className="absolute"
        style={{
          left: '20px',
          top: '65px',
        }}
      >
        <span
          className="text-[12px] text-[#6B7280] leading-[16px]"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          {label}
        </span>
      </div>

      {/* Value + Trend row */}
      <div
        className="absolute flex items-center gap-1"
        style={{
          left: '20px',
          top: '90px',
        }}
      >
        {/* Main value - 28px, Inter, 600 */}
        <span
          className="text-[28px] font-semibold text-[#1F2937] leading-[32px] tracking-[0.0703125px]"
          style={{
            fontFamily: 'Inter, sans-serif',
            letterSpacing: '0.0703125px',
          }}
        >
          {value}
        </span>

        {/* Trend indicator */}
        {trend && (
          <div
            className="flex items-center gap-[4px] ml-1"
            style={{ marginLeft: '10px' }}
          >
            <TrendUpIcon color={trendColor} />
            <span
              className="text-[12px] text-[#FF7847] leading-[16px]"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              {trend}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// Demo export
export function KPICardDemo() {
  return <KPICard />;
}