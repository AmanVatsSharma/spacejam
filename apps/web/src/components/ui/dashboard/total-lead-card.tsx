/**
 * File:        apps/web/src/components/ui/dashboard/total-lead-card.tsx
 * Module:      Web · UI · Dashboard · Total Lead Card
 * Purpose:     KPI card showing total leads with mini bar charts
 *
 * Design Reference: Figma - exact pixel match
 * - White background, 14px border radius, soft shadow
 * - Title "Total Lead" + subtitle at top-left
 * - Value "1349" + trend at top-right
 * - Orange separator line
 * - 3 mini bar charts: Visited (orange), Inquiry (teal), Converted (yellow)
 * - Bottom values row: 459, 350, 215
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-05-31
 */

"use client";

import React from "react";
import styles from "./total-lead-card.module.css";

interface TotalLeadCardProps {
  totalLeads?: number;
  changePercent?: number;
  visited?: number;
  inquiry?: number;
  converted?: number;
  className?: string;
}

// Mini bar chart component
const BarChart = ({
  color,
  fadedColor,
}: {
  color: string;
  fadedColor: string;
}) => {
  // Bar heights for visual representation
  const coloredHeights = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20];
  const fadedHeights = [22, 24, 26, 28, 30, 32, 34, 36, 38, 40];

  return (
    <div className={styles.barChartContainer}>
      {/* Colored bars */}
      <div className={styles.coloredBars}>
        {coloredHeights.map((h, i) => (
          <div
            key={`colored-${i}`}
            className={styles.bar}
            style={{
              height: `${h}px`,
              backgroundColor: color,
            }}
          />
        ))}
      </div>
      {/* Faded bars */}
      <div className={styles.fadedBars}>
        {fadedHeights.map((h, i) => (
          <div
            key={`faded-${i}`}
            className={styles.bar}
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

// Mini KPI section
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
  <div className={styles.miniKPI}>
    <span className={styles.miniLabel}>{label}</span>
    <BarChart color={color} fadedColor={fadedColor} />
    <span className={styles.miniValue}>{value}</span>
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
    <div className={`${styles.card} ${className}`}>
      {/* Header row */}
      <div className={styles.headerRow}>
        {/* Left: Title and subtitle */}
        <div className={styles.titleSection}>
          <h3 className={styles.title}>Total Lead</h3>
          <p className={styles.subtitle}>Total available room and seat</p>
        </div>

        {/* Right: Value and trend */}
        <div className={styles.valueSection}>
          <span className={styles.mainValue}>{totalLeads}</span>
          <span className={styles.trend}>
            <span className={styles.trendPercent}>+{changePercent}%</span>
            <span className={styles.trendText}> Vs Last Week</span>
          </span>
        </div>
      </div>

      {/* Orange separator line */}
      <div className={styles.separator} />

      {/* Mini KPI sections */}
      <div className={styles.kpiSection}>
        <MiniKPI label="Visited" value={visited} color="#FE7A49" fadedColor="rgba(254, 122, 73, 0.30)" />
        <MiniKPI label="Inquiry" value={inquiry} color="#4ECDC3" fadedColor="rgba(113, 214, 206, 0.30)" />
        <MiniKPI label="Converted" value={converted} color="#FFD167" fadedColor="rgba(255, 209, 103, 0.30)" />
      </div>

      {/* Bottom values row */}
      <div className={styles.bottomValues}>
        <span className={styles.bottomValue}>{visited}</span>
        <span className={styles.bottomValue}>{inquiry}</span>
        <span className={styles.bottomValue}>{converted}</span>
      </div>
    </div>
  );
}

// Demo export
export function TotalLeadCardDemo() {
  return <TotalLeadCard className={styles.demo} />;
}