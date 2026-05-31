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

// Bar chart component with colored and faded bars
const BarChart = ({
  color,
  fadedColor,
  labelPadding,
}: {
  color: string;
  fadedColor: string;
  labelPadding: number;
}) => {
  // Generate bar positions based on Figma exact coordinates
  const coloredBars = [
    { left: 10, top: 44 },
    { left: 8, top: 44 },
    { left: 4, top: 44 },
    { left: 6, top: 44 },
    { left: 2, top: 44 },
    { left: 12, top: 44 },
    { left: 16, top: 44 },
    { left: 24, top: 44 },
    { left: 34, top: 44 },
    { left: 44, top: 44 },
    { left: 54, top: 44 },
    { left: 60, top: 44 },
    { left: 62, top: 44 },
    { left: 58, top: 44 },
    { left: 56, top: 44 },
    { left: 52, top: 44 },
    { left: 50, top: 44 },
    { left: 48, top: 44 },
    { left: 46, top: 44 },
    { left: 42, top: 44 },
    { left: 40, top: 44 },
    { left: 38, top: 44 },
    { left: 36, top: 44 },
    { left: 32, top: 44 },
    { left: 30, top: 44 },
    { left: 28, top: 44 },
    { left: 26, top: 44 },
    { left: 22, top: 44 },
    { left: 20, top: 44 },
    { left: 18, top: 44 },
    { left: 14, top: 44 },
  ];

  const fadedBars = [
    { left: 54, top: 44 },
    { left: 66, top: 44 },
    { left: 64, top: 44 },
    { left: 60, top: 44 },
    { left: 62, top: 44 },
    { left: 58, top: 44 },
    { left: 56, top: 44 },
    { left: 68, top: 44 },
    { left: 72, top: 44 },
    { left: 80, top: 44 },
    { left: 90, top: 44 },
    { left: 100, top: 44 },
    { left: 110, top: 44 },
    { left: 116, top: 44 },
    { left: 118, top: 44 },
    { left: 114, top: 44 },
    { left: 112, top: 44 },
    { left: 108, top: 44 },
    { left: 106, top: 44 },
    { left: 104, top: 44 },
    { left: 102, top: 44 },
    { left: 98, top: 44 },
    { left: 96, top: 44 },
    { left: 94, top: 44 },
    { left: 92, top: 44 },
    { left: 88, top: 44 },
    { left: 86, top: 44 },
    { left: 84, top: 44 },
    { left: 82, top: 44 },
    { left: 78, top: 44 },
    { left: 76, top: 44 },
    { left: 74, top: 44 },
    { left: 70, top: 44 },
  ];

  return (
    <div style={{ width: 120, height: 50, position: 'relative' }}>
      {/* Label */}
      <div style={{ width: 65, height: 50, left: 0, top: 0, position: 'absolute' }}>
        <div style={{
          left: labelPadding,
          top: 9,
          position: 'absolute',
          color: 'black',
          fontSize: 16,
          fontFamily: 'Nunito',
          fontWeight: '600',
          wordWrap: 'break-word'
        }}>
          {/* Label text injected via parent */}
        </div>
      </div>

      {/* Colored bars */}
      {coloredBars.map((bar, i) => (
        <div
          key={`colored-${i}`}
          style={{
            width: 6,
            height: 0,
            left: bar.left,
            top: bar.top,
            position: 'absolute',
            transform: 'rotate(90deg)',
            transformOrigin: 'top left',
            outline: `1px ${color} solid`,
            outlineOffset: '-0.50px'
          }}
        />
      ))}

      {/* Faded bars */}
      {fadedBars.map((bar, i) => (
        <div
          key={`faded-${i}`}
          style={{
            width: 6,
            height: 0,
            left: bar.left,
            top: bar.top,
            position: 'absolute',
            transform: 'rotate(90deg)',
            transformOrigin: 'top left',
            outline: `1px ${fadedColor} solid`,
            outlineOffset: '-0.50px'
          }}
        />
      ))}

      {/* Horizontal bar at top */}
      <div style={{
        width: 41,
        height: 0,
        left: 0,
        top: 9,
        position: 'absolute',
        transform: 'rotate(90deg)',
        transformOrigin: 'top left',
        outline: `1px ${color} solid`,
        outlineOffset: '-0.50px'
      }} />
    </div>
  );
};

// Simplified bar chart using CSS grid pattern
const MiniKPI = ({
  label,
  value,
  color,
  fadedColor,
  labelPadding = 11,
}: {
  label: string;
  value: number;
  color: string;
  fadedColor: string;
  labelPadding?: number;
}) => (
  <div style={{ width: 120, height: 50, position: 'relative' }}>
    {/* Label */}
    <div style={{
      left: labelPadding,
      top: 9,
      position: 'absolute',
      color: 'black',
      fontSize: 16,
      fontFamily: 'Nunito',
      fontWeight: '600',
      wordWrap: 'break-word',
      whiteSpace: 'nowrap'
    }}>
      {label}
    </div>

    {/* Bar chart area */}
    <div style={{ position: 'absolute', left: 0, top: 9 }}>
      {/* Colored bars - simplified representation */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {/* Top horizontal line */}
        <div style={{
          width: 62,
          height: 0,
          borderTop: `1px ${color} solid`,
          marginLeft: 0,
          marginTop: 0
        }} />
        {/* Colored vertical bars */}
        {[10, 8, 4, 6, 2, 12, 16, 24, 34, 44, 54, 60, 62, 58, 56, 52, 50, 48, 46, 42, 40, 38, 36, 32, 30, 28, 26, 22, 20, 18, 14].map((x, i) => (
          <div
            key={`v-${i}`}
            style={{
              width: 6,
              height: 35 - (i % 5) * 2,
              borderRight: `1px ${color} solid`,
              marginLeft: x - 2,
              marginTop: -0.5,
              position: 'relative',
              top: 0
            }}
          />
        ))}
      </div>
    </div>

    {/* Value below */}
    <div style={{
      position: 'absolute',
      left: 0,
      top: 53,
      fontSize: 16,
      fontFamily: 'Inter',
      fontWeight: '600',
      color: '#1F2937',
      lineHeight: 32,
      letterSpacing: 0.07
    }}>
      {value}
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
      className={className}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        background: 'white',
        boxShadow: '0px 1px 2px -1px rgba(0, 0, 0, 0.10), 0px 1px 3px rgba(0, 0, 0, 0.10)',
        borderRadius: 14,
        transform: 'rotate(0deg)'
      }}
    >
      {/* Title - top left */}
      <div style={{
        left: 18,
        top: 10,
        position: 'absolute',
        color: '#1F2937',
        fontSize: 16,
        fontFamily: 'Inter',
        fontWeight: '600',
        lineHeight: 28,
        wordWrap: 'break-word'
      }}>
        Total Lead
      </div>

      {/* Subtitle */}
      <div style={{
        width: 148.16,
        height: 16,
        left: 24,
        top: 38,
        position: 'absolute'
      }}>
        <div style={{
          left: -4,
          top: 1,
          position: 'absolute',
          color: '#6B7280',
          fontSize: 12,
          fontFamily: 'Inter',
          fontWeight: '400',
          lineHeight: 16,
          wordWrap: 'break-word'
        }}>
          Total available room and seat
        </div>
      </div>

      {/* Value row - top right */}
      <div style={{
        width: 433,
        height: 37,
        left: 20,
        top: 75,
        position: 'absolute'
      }}>
        <div style={{
          left: 0,
          top: 0,
          position: 'absolute',
          justifyContent: 'flex-start',
          alignItems: 'flex-end',
          gap: 10,
          display: 'inline-flex'
        }}>
          {/* Main value */}
          <div style={{
            width: 76,
            height: 28,
            color: '#1F2937',
            fontSize: 24,
            fontFamily: 'Inter',
            fontWeight: '600',
            lineHeight: 32,
            letterSpacing: 0.07,
            wordWrap: 'break-word'
          }}>
            {totalLeads}
          </div>

          {/* Trend */}
          <div style={{ width: 105, height: 16, position: 'relative' }}>
            <div style={{ left: 0, top: 1, position: 'absolute' }}>
              <span style={{
                color: '#00D1C6',
                fontSize: 10,
                fontFamily: 'Inter',
                fontWeight: '700',
                lineHeight: 16,
                wordWrap: 'break-word'
              }}>
                +{changePercent}%
              </span>
              <span style={{
                color: '#6B7280',
                fontSize: 10,
                fontFamily: 'Inter',
                fontWeight: '700',
                lineHeight: 16,
                wordWrap: 'break-word'
              }}>
                {' '}
              </span>
              <span style={{
                color: '#6B7280',
                fontSize: 10,
                fontFamily: 'Inter',
                fontWeight: '400',
                lineHeight: 16,
                wordWrap: 'break-word'
              }}>
                Vs Last Week
              </span>
            </div>
          </div>
        </div>

        {/* Orange separator line */}
        <div style={{
          width: 433,
          height: 0,
          left: 0,
          top: 37,
          position: 'absolute',
          outline: '1px #FF7847 solid',
          outlineOffset: '-0.50px'
        }} />
      </div>

      {/* 3 Mini KPI sections */}
      <div style={{
        left: 20,
        top: 120,
        position: 'absolute',
        justifyContent: 'flex-start',
        alignItems: 'center',
        gap: 31,
        display: 'inline-flex'
      }}>
        {/* Visited */}
        <MiniKPI label="Visited" value={visited} color="#FE7A49" fadedColor="rgba(254, 122, 73, 0.30)" labelPadding={11} />

        {/* Inquiry */}
        <MiniKPI label="Inquiry" value={inquiry} color="#4ECDC3" fadedColor="rgba(113, 214, 206, 0.30)" labelPadding={12} />

        {/* Converted */}
        <MiniKPI label="Converted" value={converted} color="#FFD167" fadedColor="rgba(255, 209, 103, 0.30)" labelPadding={11} />
      </div>

      {/* Bottom values row */}
      <div style={{
        width: 422,
        left: 20,
        top: 170,
        position: 'absolute',
        justifyContent: 'flex-start',
        alignItems: 'center',
        gap: 80,
        display: 'inline-flex'
      }}>
        <div style={{
          width: 76,
          height: 28,
          color: '#1F2937',
          fontSize: 16,
          fontFamily: 'Inter',
          fontWeight: '600',
          lineHeight: 32,
          letterSpacing: 0.07,
          wordWrap: 'break-word'
        }}>
          {visited}
        </div>
        <div style={{
          width: 76,
          height: 28,
          color: '#1F2937',
          fontSize: 16,
          fontFamily: 'Inter',
          fontWeight: '600',
          lineHeight: 32,
          letterSpacing: 0.07,
          wordWrap: 'break-word'
        }}>
          {inquiry}
        </div>
        <div style={{
          width: 110,
          height: 28,
          color: '#1F2937',
          fontSize: 16,
          fontFamily: 'Inter',
          fontWeight: '600',
          lineHeight: 32,
          letterSpacing: 0.07,
          wordWrap: 'break-word'
        }}>
          {converted}
        </div>
      </div>
    </div>
  );
}

// Demo export
export function TotalLeadCardDemo() {
  return <TotalLeadCard className="shrink-0" />;
}