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

const MiniKPI = ({
  label,
  value,
  color,
  fadedColor,
  percentage,
}: {
  label: string;
  value: number;
  color: string;
  fadedColor: string;
  percentage: number;
}) => {
  const totalTicks = 35;
  const coloredCount = Math.floor((percentage / 100) * totalTicks);
  const fadedCount = totalTicks - coloredCount;

  return (
    <div className={styles.miniKPI}>
      <div className={styles.kpiTop} style={{ borderLeftColor: color }}>
        <span className={styles.miniLabel}>{label}</span>
        <div className={styles.barChartContainer}>
          {Array.from({ length: coloredCount }).map((_, i) => (
            <div key={`c-${i}`} className={styles.tick} style={{ backgroundColor: color }} />
          ))}
          {Array.from({ length: fadedCount }).map((_, i) => (
            <div key={`f-${i}`} className={styles.tick} style={{ backgroundColor: fadedColor }} />
          ))}
        </div>
      </div>
      <span className={styles.miniValue}>{value}</span>
    </div>
  );
};

export function TotalLeadCard({
  totalLeads = 1349,
  changePercent = 1.6,
  visited = 459,
  inquiry = 350,
  converted = 215,
  className = "",
}: TotalLeadCardProps) {
  return (
    <div className={`${styles.card} transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${className}`}>
      <div className={styles.header}>
        <h3 className={styles.title}>Total Lead</h3>
        <p className={styles.subtitle}>Total available room and seat</p>
        <div className={styles.valueRow}>
          <span className={styles.mainValue}>{totalLeads}</span>
          <span className={styles.trend}>
            <span className={styles.trendPercent}>+{changePercent}%</span>
            <span className={styles.trendText}> Vs Last Week</span>
          </span>
        </div>
      </div>

      <div className={styles.separator} />

      <div className={styles.kpiSection}>
        <MiniKPI label="Visited" value={visited} color="#FE7A49" fadedColor="rgba(254, 122, 73, 0.30)" percentage={55} />
        <MiniKPI label="Inquiry" value={inquiry} color="#4ECDC3" fadedColor="rgba(78, 205, 195, 0.30)" percentage={45} />
        <MiniKPI label="Converted" value={converted} color="#FFD167" fadedColor="rgba(255, 209, 103, 0.30)" percentage={35} />
      </div>
    </div>
  );
}

export function TotalLeadCardDemo() {
  return <TotalLeadCard className={styles.demo} />;
}