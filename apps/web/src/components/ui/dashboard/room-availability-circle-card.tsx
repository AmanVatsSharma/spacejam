/**
 * File:        apps/web/src/components/ui/dashboard/room-availability-circle-card.tsx
 * Module:      Web · UI · Dashboard · Seat and Room Availability
 * Purpose:     Card showing overall seat/room availability with circular progress
 *               and 6 sub-category progress bars (Hot Desks, Cabins, etc.)
 *
 * Design Reference: Figma node 0:32796
 * - Card width: 347px, height: ~388px
 * - Title + subtitle
 * - "View Floor Plan" button (orange)
 * - Circular progress chart with 355/500 center
 * - Legend (Available / Booked)
 * - 2x3 grid of sub-stats with progress bars
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-24
 */

"use client";

import React from "react";
import styles from "./room-availability-circle-card.module.css";

export interface RoomSubStat {
  label: string;
  available: number;
  total: number;
}

interface RoomAvailabilityCircleCardProps {
  title?: string;
  subtitle?: string;
  totalAvailable?: number;
  totalSeats?: number;
  changePercent?: number;
  subStats?: RoomSubStat[];
  onViewFloorPlan?: () => void;
  className?: string;
}

const defaultSubStats: RoomSubStat[] = [
  { label: "Hot Desks", available: 45, total: 60 },
  { label: "Private Cabins", available: 8, total: 12 },
  { label: "Meeting Rooms", available: 3, total: 5 },
  { label: "Event Space", available: 1, total: 2 },
  { label: "Cabin (2 Seaters)", available: 3, total: 5 },
  { label: "Cabin (6 Seaters)", available: 3, total: 5 },
];

export function RoomAvailabilityCircleCard({
  title = "Seat and Room Availability",
  subtitle = "Total available room and seat",
  totalAvailable = 355,
  totalSeats = 500,
  changePercent = 3.4,
  subStats = defaultSubStats,
  onViewFloorPlan = () => {},
  className = "",
}: RoomAvailabilityCircleCardProps) {
  
  const renderTicks = () => {
    const ticks = [];
    const totalTicks = 30;
    const ratio = totalSeats > 0 ? totalAvailable / totalSeats : 0;
    const availableTicks = Math.round(ratio * totalTicks);
    
    for (let i = 0; i <= totalTicks; i++) {
      const angle = -90 + (i * (180 / totalTicks));
      const isAvailable = i < availableTicks;
      const color = isAvailable ? "#00D1C6" : "#FF7A49";
      
      ticks.push(
        <line
          key={i}
          x1="120" y1="20" x2="120" y2="40"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          transform={`rotate(${angle} 120 120)`}
        />
      );
    }
    return ticks;
  };

  return (
    <div className={`${styles.card} ${className} transition-all duration-200 hover:shadow-md hover:-translate-y-0.5`}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
        {onViewFloorPlan && (
          <button
            onClick={onViewFloorPlan}
            className={styles.viewPlanBtn}
          >
            View Floor Plan
          </button>
        )}
      </div>

      {/* Circular chart */}
      <div className={styles.chartSection}>
        <div className={styles.circleWrap}>
          <svg width="240" height="130" viewBox="0 0 240 130" className={styles.svg}>
            {renderTicks()}
          </svg>
          <div className={styles.circleCenter}>
            <div className={styles.centerRatio}>
              <span className={styles.ratioTeal}>{totalAvailable}</span>
              <span className={styles.ratioOrange}>/{totalSeats}</span>
            </div>
            <div className={styles.centerChange}>
              <span className={styles.changeOrange}>+{changePercent}%</span>
              <span className={styles.changeGray}> vs Last week</span>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.legendDotOrange}`} />
            <span className={styles.legendLabel}>Available</span>
          </div>
          <div className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.legendDotTeal}`} />
            <span className={styles.legendLabel}>Booked</span>
          </div>
        </div>
      </div>

      {/* Sub stats grid 2x3 */}
      {subStats.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-6 text-center bg-[#F9FAFB] rounded-[10px] border border-dashed border-[#E5E7EB] mt-4 min-h-[140px]">
          <span className="text-[14px] font-medium text-[#6B7280]">No seat data available</span>
          <span className="text-[12px] text-[#9CA3AF] mt-1">Detailed room capacity metrics are not available at this time.</span>
        </div>
      ) : (
        <div className={styles.subStatsGrid}>
          {subStats.map((stat) => {
            const percent = stat.total > 0 ? (stat.available / stat.total) * 100 : 0;
            return (
              <div key={stat.label} className={`${styles.subStat} transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5`}>
                <div className={styles.subStatHeader}>
                  <span className={styles.subStatLabel}>{stat.label}</span>
                  <span className={styles.subStatValue}>
                    <span className={styles.valueNumber}>{stat.available}</span>
                    <span className={styles.valueTotal}>/{stat.total}</span>
                  </span>
                </div>
                <div className={styles.progressTrack}>
                  <div
                    className={styles.progressFillLeft}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function RoomAvailabilityCircleCardDemo() {
  return <RoomAvailabilityCircleCard />;
}
