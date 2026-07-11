/**
 * File:        apps/web/src/components/ui/dashboard/event-today-card.tsx
 * Module:      Web · UI · Dashboard · Event Today Card
 * Purpose:     KPI card showing number of events scheduled today
 *
 * Design Reference: Figma SVG export - exact pixel match
 * - Card: 232px x 132px, 14px radius, white bg, shadow
 * - Icon container (36px, 10px radius, light orange bg)
 * - Label text (12px, Inter, #6B7280) - "Event Scheduled Today"
 * - Value (28px, Inter, 600, #1F2937)
 * - Trend with up arrow icon + percentage
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-05-31
 */

"use client";

import React from "react";

interface EventTodayCardProps {
  /** Card dimensions */
  width?: number;
  height?: number;
  /** Icon to display (SVG or component) */
  icon?: React.ReactNode;
  /** Label text */
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

// Event star icon (from Figma)
const EventIcon = ({ color = "#FF6A2F" }: { color?: string }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <rect x="1" y="1" width="12" height="12" rx="2" stroke={color} strokeWidth="1.33"/>
    <path
      d="M7 4.5l1.35 1.35 2.15 0.3-1.55 1.5 0.35 2.1L7 8.1 4.7 9.75l0.35-2.1L3.5 6.15l2.15-0.3L7 4.5z"
      stroke={color}
      strokeWidth="1.33"
      strokeLinejoin="round"
    />
  </svg>
);

// Trend up arrow icon
const TrendUpIcon = ({ color = "#FF7847" }: { color?: string }) => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path
      d="M6 9V3M3 6l3-3 3 3"
      stroke={color}
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export function EventTodayCard({
  width = 232,
  height = 132,
  icon,
  label = "Event Scheduled Today",
  value = "6",
  trend = "5%",
  trendColor = "#FF7847",
  iconBgColor = "#FFF5F1",
  iconColor = "#FF6A2F",
  className = "",
}: EventTodayCardProps) {
  return (
    <div
      className={`bg-white rounded-[14px] relative transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${className}`}
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
        {icon || <EventIcon color={iconColor} />}
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
export function EventTodayCardDemo() {
  return <EventTodayCard />;
}