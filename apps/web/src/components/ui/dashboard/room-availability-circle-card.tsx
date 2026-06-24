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
  onViewFloorPlan,
  className = "",
}: RoomAvailabilityCircleCardProps) {
  const ratio = totalSeats > 0 ? totalAvailable / totalSeats : 0;
  // 71% — based on 355/500
  const dashArray = 2 * Math.PI * 56; // circumference for r=56
  const dashOffset = dashArray * (1 - ratio);

  return (
    <div className={`${styles.card} ${className}`}>
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
          <svg width="160" height="160" viewBox="0 0 160 160" className={styles.svg}>
            {/* Background ring */}
            <circle
              cx="80"
              cy="80"
              r="56"
              fill="none"
              stroke="#F3F4F6"
              strokeWidth="14"
            />
            {/* Progress ring (available - orange) */}
            <circle
              cx="80"
              cy="80"
              r="56"
              fill="none"
              stroke="#FF7847"
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={dashArray}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 80 80)"
            />
            {/* Booked segment overlay (gray) */}
            <circle
              cx="80"
              cy="80"
              r="56"
              fill="none"
              stroke="#D1D5DB"
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={`${dashArray * (1 - ratio)} ${dashArray}`}
              transform="rotate(-90 80 80)"
              opacity="0.4"
            />
          </svg>
          <div className={styles.circleCenter}>
            <span className={styles.centerRatio}>
              {totalAvailable}/{totalSeats}
            </span>
            <span className={styles.centerChange}>
              +{changePercent}% vs Last week
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.legendDotOrange}`} />
            <span className={styles.legendLabel}>Available</span>
          </div>
          <div className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.legendDotGray}`} />
            <span className={styles.legendLabel}>Booked</span>
          </div>
        </div>
      </div>

      {/* Sub stats grid 2x3 */}
      <div className={styles.subStatsGrid}>
        {subStats.map((stat) => {
          const percent = stat.total > 0 ? (stat.available / stat.total) * 100 : 0;
          return (
            <div key={stat.label} className={styles.subStat}>
              <div className={styles.subStatHeader}>
                <span className={styles.subStatLabel}>{stat.label}</span>
                <span className={styles.subStatValue}>
                  {stat.available}/{stat.total}
                </span>
              </div>
              <div className={styles.progressTrack}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function RoomAvailabilityCircleCardDemo() {
  return <RoomAvailabilityCircleCard onViewFloorPlan={() => {}} />;
}
