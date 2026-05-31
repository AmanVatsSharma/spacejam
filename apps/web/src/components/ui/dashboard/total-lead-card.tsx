/**
 * File:        apps/web/src/components/ui/dashboard/total-lead-card.tsx
 * Module:      Web · UI · Dashboard · Total Lead Card
 * Purpose:     KPI card showing total leads with mini bar charts
 *
 * Design Reference: Figma CSS export - exact pixel match
 * - Card: 473px x 216px, 14px radius, white bg, shadow
 * - Title "Total Lead" (16px) + subtitle on left side
 * - Value "1349" (24px) + trend on right side
 * - Orange separator line (37px from top)
 * - 3 mini bar charts: Visited (orange), Inquiry (teal), Converted (yellow)
 * - Bottom values: 459, 350, 215 with 80px gap
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-05-31
 */

"use client";

import React from "react";

interface TotalLeadCardProps {
  totalLeads?: number;
  changePercent?: number;
  visited?: number;
  inquiry?: number;
  converted?: number;
  className?: string;
}

// Bar chart with 12 bars - exact Figma positioning
const BarChart = ({
  color,
  fadedColor,
}: {
  color: string;
  fadedColor: string;
}) => {
  // Bar heights represent data distribution
  // Left side: colored bars, Right side: faded bars
  const coloredHeights = [2, 6, 10, 14, 18, 22, 26, 30];
  const fadedHeights = [34, 38, 36, 40];

  return (
    <div className="relative w-[64px] h-[41px]">
      {/* Colored bars */}
      <div className="absolute left-0 top-[9px] flex items-end gap-[2px] h-[32px]">
        {coloredHeights.map((h, i) => (
          <div
            key={`c-${i}`}
            className="w-[6px]"
            style={{
              height: `${h}px`,
              backgroundColor: color,
            }}
          />
        ))}
      </div>
      {/* Faded bars */}
      <div className="absolute left-0 top-[9px] flex items-end gap-[2px] h-[32px]">
        {fadedHeights.map((h, i) => (
          <div
            key={`f-${i}`}
            className="w-[6px]"
            style={{
              height: `${h}px`,
              backgroundColor: fadedColor,
            }}
          />
        ))}
      </div>
    </div>
  );
};

// Mini KPI box with label, chart, and value
const MiniKPI = ({
  label,
  value,
  color,
  fadedColor,
}: {
  label: string;
  value: number;
  color: string;
  fadedColor: string;
}) => (
  <div className="flex flex-col items-center gap-1 w-[120px]">
    {/* Label - Nunito font, 16px */}
    <span
      className="font-['Nunito'] font-semibold text-[16px] leading-[22px] text-[#000000]"
      style={{ paddingLeft: '11px' }}
    >
      {label}
    </span>

    {/* Bar chart */}
    <BarChart color={color} fadedColor={fadedColor} />

    {/* Value - 16px, Inter, 600 */}
    <span
      className="text-[16px] font-semibold text-[#1F2937] leading-[32px] tracking-[0.0703125px]"
      style={{ width: '76px', textAlign: 'center' }}
    >
      {value}
    </span>
  </div>
);

export function TotalLeadCard({
  totalLeads = 1349,
  changePercent = 1.6,
  visited = 459,
  inquiry = 350,
  converted = 215,
  className = "",
}: TotalLeadCardProps) {
  return (
    <div
      className={`bg-white rounded-[14px] p-5 relative ${className}`}
      style={{
        width: '473px',
        height: '216px',
        boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px -1px rgba(0, 0, 0, 0.1)',
      }}
    >
      {/* Row 1: Title/Subtitle on left, Value/Trend on right */}
      <div className="flex justify-between items-start h-[37px]">
        {/* Left: Title + Subtitle */}
        <div className="flex flex-col" style={{ paddingLeft: '18px' }}>
          <span
            className="text-[16px] font-semibold text-[#1F2937] leading-[28px] tracking-[-0.439453px]"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Total Lead
          </span>
          <span
            className="text-[12px] text-[#6B7280] leading-[16px]"
            style={{ paddingLeft: '6px' }}
          >
            Total available room and seat
          </span>
        </div>

        {/* Right: Value + Trend */}
        <div className="flex flex-col items-end">
          <div className="flex items-end gap-[10px]">
            <span
              className="text-[24px] font-semibold text-[#1F2937] leading-[32px] tracking-[0.0703125px]"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              {totalLeads}
            </span>
          </div>
          <span
            className="text-[10px] font-bold text-[#00D1C6] leading-[16px]"
            style={{ marginTop: '-4px' }}
          >
            +{changePercent}% Vs Last Week
          </span>
        </div>
      </div>

      {/* Orange separator line - exactly 37px from top of container area */}
      <div
        className="absolute w-[433px] h-[1px] bg-[#FF7847]"
        style={{ top: '75px', left: '20px' }}
      />

      {/* Row 2: 3 Mini KPI charts with 80px gap */}
      <div
        className="flex items-center gap-[80px]"
        style={{ marginTop: '38px', paddingLeft: '20px' }}
      >
        {/* Visited - Orange */}
        <MiniKPI
          label="Visited"
          value={visited}
          color="#FE7A49"
          fadedColor="rgba(254, 122, 73, 0.3)"
        />

        {/* Inquiry - Teal */}
        <MiniKPI
          label="Inquiry"
          value={inquiry}
          color="#4ECDC3"
          fadedColor="rgba(113, 214, 206, 0.3)"
        />

        {/* Converted - Yellow */}
        <MiniKPI
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
  return <TotalLeadCard className="shrink-0" />;
}