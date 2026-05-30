/**
 * File:        apps/web/src/components/ui/dashboard/total-lead-card.tsx
 * Module:      Web · UI · Dashboard · Total Lead Card
 * Purpose:     KPI card showing total leads with mini bar charts
 *
 * Design Reference: Exact Figma implementation from CSS specs
 * - Card: 473px x 216px, border-radius 14px, white bg, shadow
 * - Value "1349" (24px, Inter, 600) on left with "+1.6% Vs Last Week" (10px, teal)
 * - "Total Lead" title (16px, Inter, 600) on right with subtitle
 * - Orange separator line (#FF7847) at top: 37px
 * - 3 mini bar charts: Visited (orange), Inquiry (teal), Converted (yellow)
 * - Values below charts: 459, 350, 215 with 80px gap
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-05-29
 */

"use client";

import React from "react";

interface TotalLeadCardProps {
  totalLeads: number;
  changePercent: number;
  visited?: number;
  inquiry?: number;
  converted?: number;
  className?: string;
}

// Mini bar chart component - exact Figma bar visualization
const MiniBarChart = ({
  label,
  value,
  color,
  fadedColor,
}: {
  label: string;
  value: number;
  color: string;
  fadedColor: string;
}) => {
  // 12 bars as in Figma - representing data points
  // Left bars are the color, right bars are faded
  const barHeights = [2, 6, 10, 14, 18, 22, 26, 30, 34, 38, 36, 40];
  const fadedIndex = 7; // 7 bars colored, 5 faded (approximately)

  return (
    <div className="flex flex-col gap-1 w-[120px]">
      {/* Label - Nunito font per Figma */}
      <span className="text-[16px] font-semibold text-[#000000] font-['Nunito'] leading-[22px]">
        {label}
      </span>

      {/* Bar chart visualization - 12 bars with gradient effect */}
      <div className="relative w-[62px] h-[41px]">
        {/* Colored bars (left portion) */}
        <div className="absolute left-0 top-[9px] flex items-end gap-[3px] h-[32px]">
          {barHeights.slice(0, fadedIndex).map((height, i) => (
            <div
              key={`color-${i}`}
              className="w-[6px]"
              style={{
                height: `${height}px`,
                backgroundColor: color,
              }}
            />
          ))}
        </div>
        {/* Faded bars (right portion) */}
        <div className="absolute left-0 top-[9px] flex items-end gap-[3px] h-[32px]">
          {barHeights.slice(fadedIndex).map((height, i) => (
            <div
              key={`faded-${i}`}
              className="w-[6px]"
              style={{
                height: `${height}px`,
                backgroundColor: fadedColor,
              }}
            />
          ))}
        </div>
      </div>

      {/* Value - 16px, Inter, 600 weight */}
      <span className="text-[16px] font-semibold text-[#1F2937] leading-[32px] tracking-[0.0703125px]">
        {value}
      </span>
    </div>
  );
};

export function TotalLeadCard({
  totalLeads,
  changePercent,
  visited = 459,
  inquiry = 350,
  converted = 215,
  className = "",
}: TotalLeadCardProps) {
  return (
    <div
      className={`bg-white rounded-[14px] shadow-[0px_1px_3px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] p-5 ${className}`}
    >
      {/* Header Row - Value on left, title on right */}
      <div className="flex justify-between items-start mb-[37px]">
        {/* Left side - Value and trend */}
        <div className="flex flex-col gap-1">
          <div className="flex items-end gap-[10px]">
            {/* Main value "1349" - 24px, Inter, 600 */}
            <span className="text-[24px] font-semibold text-[#1F2937] leading-[32px] tracking-[0.0703125px]">
              {totalLeads.toLocaleString()}
            </span>
            {/* Trend indicator "+1.6% Vs Last Week" - 10px, teal */}
            <span className="text-[10px] font-bold text-[#00D1C6] leading-[16px]">
              +{changePercent}% Vs Last Week
            </span>
          </div>
        </div>

        {/* Right side - Title and subtitle */}
        <div className="flex flex-col gap-0">
          <span
            className="text-[16px] font-semibold text-[#1F2937] leading-[28px] tracking-[-0.439453px]"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Total Lead
          </span>
          <span className="text-[12px] text-[#6B7280] leading-[16px] -ml-[4px]">
            Total available room and seat
          </span>
        </div>
      </div>

      {/* Orange separator line */}
      <div className="w-full h-[1px] bg-[#FF7847] mb-4" />

      {/* Bottom section - 3 mini bar charts with 80px gap */}
      <div className="flex gap-[80px]">
        {/* Visited - orange bars #FE7A49, faded rgba(254, 122, 73, 0.3) */}
        <MiniBarChart
          label="Visited"
          value={visited}
          color="#FE7A49"
          fadedColor="rgba(254, 122, 73, 0.3)"
        />

        {/* Inquiry - teal bars #4ECDC3, faded rgba(113, 214, 206, 0.3) */}
        <MiniBarChart
          label="Inquiry"
          value={inquiry}
          color="#4ECDC3"
          fadedColor="rgba(113, 214, 206, 0.3)"
        />

        {/* Converted - yellow bars #FFD167, faded rgba(255, 209, 103, 0.3) */}
        <MiniBarChart
          label="Converted"
          value={converted}
          color="#FFD167"
          fadedColor="rgba(255, 209, 103, 0.3)"
        />
      </div>
    </div>
  );
}

// Demo export
export function TotalLeadCardDemo() {
  return (
    <TotalLeadCard
      totalLeads={1349}
      changePercent={1.6}
      visited={459}
      inquiry={350}
      converted={215}
      className="w-[473px] h-[216px]"
    />
  );
}