/**
 * File:        libs/ui/src/lib/revenue-chart/RevenueChart.tsx
 * Module:      UI · Revenue Chart
 * Purpose:     Revenue trend chart component from Figma design
 *
 * Exports:
 *   - RevenueChart — revenue trend visualization component
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-07
 */

"use client";

import React from 'react';
import styles from './RevenueChart.module.css';

interface RevenueData {
  month: string;
  revenue: number;
}

const mockRevenueData: RevenueData[] = [
  { month: 'Jan', revenue: 450000 },
  { month: 'Feb', revenue: 520000 },
  { month: 'Mar', revenue: 680000 },
  { month: 'Apr', revenue: 580000 },
  { month: 'May', revenue: 720000 },
  { month: 'Jun', revenue: 850000 },
];

export default function RevenueChart() {
  const maxRevenue = Math.max(...mockRevenueData.map(d => d.revenue));
  const chartHeight = 200;
  const chartWidth = 400;
  const padding = 40;

  const points = mockRevenueData.map((d, i) => {
    const x = padding + (i / (mockRevenueData.length - 1)) * (chartWidth - 2 * padding);
    const y = chartHeight - padding - (d.revenue / maxRevenue) * (chartHeight - 2 * padding);
    return { x, y, value: d.revenue };
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Revenue Overview</h3>
        <div className={styles.highlight}>
          <span className={styles.prefix}>₹</span>
          <span className={styles.value}>850K</span>
          <span className={styles.change}>+24%</span>
        </div>
      </div>

      <div className={styles.chartWrapper}>
        <svg width="100%" height={chartHeight} className={styles.chart}>
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(percent => {
            const y = padding + (percent / 100) * (chartHeight - 2 * padding);
            return (
              <React.Fragment key={percent}>
                <line
                  x1={padding}
                  y1={y}
                  x2={chartWidth - padding}
                  y2={y}
                  stroke="#F3F4F6"
                  strokeWidth="1"
                />
                <text
                  x={padding - 10}
                  y={y + 5}
                  textAnchor="end"
                  className={styles.gridLabel}
                >
                  {Math.round((maxRevenue * (100 - percent)) / 100000)}K
                </text>
              </React.Fragment>
            );
          })}

          {/* Revenue line */}
          <polyline
            points={points.map(p => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="#FF6A2F"
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Area under curve */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FF6A2F" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#FF6A2F" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d={`${points[0].x},${points[0].y} ${points.map(p => `${p.x},${p.y}`).join(' ')} L${points[points.length - 1].x},${chartHeight - padding} Z`}
            fill="url(#gradient)"
          />

          {/* Data points */}
          {points.map((point, i) => (
            <g key={i}>
              <circle
                cx={point.x}
                cy={point.y}
                r="5"
                fill="#FFFFFF"
                stroke="#FF6A2F"
                strokeWidth="2"
              />
              <text
                x={point.x}
                y={point.y - 10}
                textAnchor="middle"
                className={styles.dataLabel}
              >
                ₹{(point.value / 1000).toFixed(0)}K
              </text>
            </g>
          ))}

          {/* Month labels */}
          {mockRevenueData.map((d, i) => (
            <text
              key={i}
              x={padding + (i / (mockRevenueData.length - 1)) * (chartWidth - 2 * padding)}
              y={chartHeight - 20}
              textAnchor="middle"
              className={styles.monthLabel}
            >
              {d.month}
            </text>
          ))}
        </svg>
      </div>

      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <div className={styles.legendColor} style={{ backgroundColor: '#FF6A2F' }} />
          <span>Actual Revenue</span>
        </div>
      </div>
    </div>
  );
}