/**
 * File:        libs/ui/src/lib/charts/OccupancyBarChart.tsx
 * Module:      UI · Charts · Occupancy Bar Chart
 * Purpose:     Bar chart showing space occupancy by type
 *
 * Exports:
 *   - OccupancyBarChart — horizontal bar chart for occupancy visualization
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-07
 */

"use client";

import React from 'react';
import styles from './OccupancyBarChart.module.css';

interface OccupancyData {
  type: string;
  total: number;
  occupied: number;
  category: string;
}

const mockOccupancyData: OccupancyData[] = [
  { type: 'Private Cabins', total: 10, occupied: 8, category: 'cabins' },
  { type: 'Hot Desks', total: 20, occupied: 14, category: 'hotdesks' },
  { type: 'Meeting Rooms', total: 5, occupied: 4, category: 'meeting' },
  { type: 'Dedicated Desks', total: 15, occupied: 9, category: 'dedicated' },
  { type: 'Event Spaces', total: 3, occupied: 2, category: 'event' },
];

export default function OccupancyBarChart() {
  const maxTotal = Math.max(...mockOccupancyData.map(d => d.total));
  const barHeight = 36;
  const gap = 20;
  const chartHeight = mockOccupancyData.length * (barHeight + gap) + 60;

  const getOccupancyColor = (occupied: number, total: number) => {
    const percentage = (occupied / total) * 100;
    if (percentage >= 80) return '#10B981';
    if (percentage >= 50) return '#FBBF24';
    return '#EF4444';
  };

  const formatValue = (occupied: number, total: number) => {
    return `${occupied}/${total}`;
  };

  const getPercentage = (occupied: number, total: number) => {
    return Math.round((occupied / total) * 100);
  };

  return (
    <div className={styles.container}>
      <svg width="600" height={chartHeight} className={styles.chart}>
        {mockOccupancyData.map((item, index) => {
          const yPos = 50 + index * (barHeight + gap);
          const occupiedWidth = (item.occupied / item.total) * maxTotal;
          const percentage = getPercentage(item.occupied, item.total);
          const color = getOccupancyColor(item.occupied, item.total);

          return (
            <React.Fragment key={index}>
              {/* Label */}
              <text
                x="0"
                y={yPos + barHeight / 2 + 5}
                className={styles.label}
              >
                {item.type}
              </text>

              {/* Background bar */}
              <rect
                x="130"
                y={yPos}
                width={maxTotal * 10 + 60}
                height={barHeight}
                rx="8"
                className={styles.barBackground}
              />

              {/* Occupied bar */}
              <rect
                x="130"
                y={yPos}
                width={occupiedWidth * 10 + 40}
                height={barHeight}
                rx="8"
                fill={color}
              />

              {/* Value label */}
              <text
                x="140"
                y={yPos + barHeight / 2 + 5}
                className={styles.valueLabel}
              >
                {formatValue(item.occupied, item.total)}
              </text>

              {/* Percentage label */}
              <text
                x={maxTotal * 10 + 200}
                y={yPos + barHeight / 2 + 5}
                className={styles.percentageLabel}
              >
                {percentage}%
              </text>
            </React.Fragment>
          );
        })}

        {/* Title */}
        <text x="0" y="30" className={styles.title}>
          Space Type
        </text>
        <text x="130" y="30" className={styles.title}>
          Utilization
        </text>
        <text x={maxTotal * 10 + 200} y="30" className={styles.title}>
          Rate
        </text>
      </svg>
    </div>
  );
}