/**
 * File:        apps/web/src/components/ui/dashboard/total-lead-card.tsx
 * Module:      Web · UI · Dashboard · Total Lead Card
 * Purpose:     KPI card showing total leads with mini bar charts
 *
 * Design Reference: Figma node 0-32565 - exact pixel match
 * - Card: 473px x 216px, 14px radius, white bg, shadow
 * - Title "Total Lead" + subtitle at top-left
 * - Value "1349" + trend at top-right
 * - Orange separator line
 * - 3 mini bar charts: Visited, Inquiry, Converted
 * - Bottom values row: 459, 350, 215 with 80px gap
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

// Figma bar chart images
const imgLine53 = "https://www.figma.com/api/mcp/asset/f5025759-06ef-4004-b5c2-65be3e12f7cc";
const imgGroupVisited = "https://www.figma.com/api/mcp/asset/7e9a488b-03cb-42ca-bfc2-c50ce624f6b3";
const imgGroupVisitedFaded = "https://www.figma.com/api/mcp/asset/b7b9880e-d2ec-4c47-a90c-dc5511d173d9";
const imgGroupInquiry = "https://www.figma.com/api/mcp/asset/9a1126ca-a604-49a0-84b7-4cd7dfeaad0a";
const imgGroupInquiryFaded = "https://www.figma.com/api/mcp/asset/e2316526-44a7-40c4-ae16-9c40dcc27e65";
const imgGroupConverted = "https://www.figma.com/api/mcp/asset/e4a647ef-a502-4047-990b-fc206400ed71";
const imgGroupConvertedFaded = "https://www.figma.com/api/mcp/asset/425b3886-8001-4234-aa64-80bbc0707dda";

// Mini KPI box with label, chart image, and value
const MiniKPI = ({
  label,
  value,
  chartImage,
  fadedChartImage,
}: {
  label: string;
  value: number;
  chartImage: string;
  fadedChartImage: string;
}) => (
  <div className="h-[50px] relative shrink-0 w-[120px]">
    {/* Label */}
    <p
      className="absolute font-['Nunito:SemiBold'] font-semibold text-[16px] text-black leading-[22px] whitespace-nowrap"
      style={{
        left: label === 'Inquiry' ? '12px' : '11px',
        top: '9px',
      }}
    >
      {label}
    </p>

    {/* Bar chart image */}
    <div className="absolute left-0 top-[9px]">
      <img
        alt=""
        src={chartImage}
        className="block max-w-none w-[62px] h-[41px]"
      />
    </div>

    {/* Faded bar chart image */}
    <div
      className="absolute"
      style={{
        left: '54px',
        top: '44px',
      }}
    >
      <img
        alt=""
        src={fadedChartImage}
        className="block max-w-none w-[64px] h-[6px]"
      />
    </div>
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
      className={`bg-white rounded-[14px] relative ${className}`}
      style={{
        boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px -1px rgba(0, 0, 0, 0.1)',
      }}
    >
      {/* Title - top left */}
      <p
        className="absolute font-['Inter:Semi_Bold'] font-semibold text-[16px] text-[#1f2937] leading-[28px] tracking-[-0.4395px] whitespace-nowrap"
        style={{
          left: '18px',
          top: '10px',
        }}
      >
        Total Lead
      </p>

      {/* Subtitle */}
      <div
        className="absolute h-[16px] w-[148.164px]"
        style={{
          left: '24px',
          top: '38px',
        }}
      >
        <p
          className="absolute font-['Inter:Regular'] font-normal text-[12px] text-[#6b7280] leading-[16px] whitespace-nowrap"
          style={{
            left: '-4px',
            top: '0px',
          }}
        >
          Total available room and seat
        </p>
      </div>

      {/* Value row - top right */}
      <div
        className="absolute h-[37px]"
        style={{
          left: '20px',
          right: '20px',
          top: '75px',
        }}
      >
        {/* Value + Trend */}
        <div className="absolute content-stretch flex gap-[10px] items-end left-0 top-0">
          <p className="font-['Inter:Semi_Bold'] font-semibold h-[28px] leading-[32px] text-[#1f2937] text-[24px] tracking-[0.0703px] w-[76px] shrink-0">
            {totalLeads}
          </p>
          <div className="h-[16px] relative shrink-0 w-[105px]">
            <p className="absolute leading-[16px] whitespace-nowrap">
              <span className="font-['Inter:Bold'] font-bold text-[#00d1c6] text-[10px]">+{changePercent}%</span>
              <span className="font-['Inter:Bold'] font-bold text-[10px]">{` `}</span>
              <span className="leading-[16px] text-[10px]">Vs Last Week</span>
            </p>
          </div>
        </div>

        {/* Orange separator line */}
        <div
          className="absolute h-0 left-0 right-0 top-[37px]"
        >
          <img
            alt=""
            src={imgLine53}
            className="block max-w-none w-full h-[1px]"
          />
        </div>
      </div>

      {/* 3 Mini KPI charts */}
      <div
        className="absolute content-stretch flex gap-[31px] items-center"
        style={{
          left: '20px',
          top: '120px',
        }}
      >
        <MiniKPI
          label="Visited"
          value={visited}
          chartImage={imgGroupVisited}
          fadedChartImage={imgGroupVisitedFaded}
        />
        <MiniKPI
          label="Inquiry"
          value={inquiry}
          chartImage={imgGroupInquiry}
          fadedChartImage={imgGroupInquiryFaded}
        />
        <MiniKPI
          label="Converted"
          value={converted}
          chartImage={imgGroupConverted}
          fadedChartImage={imgGroupConvertedFaded}
        />
      </div>

      {/* Bottom values row */}
      <div
        className="absolute content-stretch flex gap-[80px] items-center"
        style={{
          left: '20px',
          top: '170px',
        }}
      >
        <p
          className="font-['Inter:Semi_Bold'] font-semibold text-[#1f2937] text-[16px] leading-[32px] tracking-[0.0703px] h-[28px] w-[76px] shrink-0"
        >
          {visited}
        </p>
        <p
          className="font-['Inter:Semi_Bold'] font-semibold text-[#1f2937] text-[16px] leading-[32px] tracking-[0.0703px] h-[28px] w-[76px] shrink-0"
        >
          {inquiry}
        </p>
        <p
          className="font-['Inter:Semi_Bold'] font-semibold text-[#1f2937] text-[16px] leading-[32px] tracking-[0.0703px] h-[28px] w-[110px] shrink-0"
        >
          {converted}
        </p>
      </div>
    </div>
  );
}

// Demo export
export function TotalLeadCardDemo() {
  return <TotalLeadCard className="shrink-0" />;
}