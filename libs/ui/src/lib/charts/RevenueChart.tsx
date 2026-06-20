/**
 * File:        libs/ui/src/lib/charts/RevenueChart.tsx
 * Module:      UI · Charts · Revenue Chart
 * Purpose:     Revenue trend chart component with mock data
 *
 * Exports:
 *   - RevenueChart — line chart component for revenue visualization
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-07
 */

"use client";

import React from 'react';
import styles from './RevenueChart.module.css';

interface RevenueDataPoint {
  month: string;
  revenue: number;
  target: number;
}

const mockRevenueData: RevenueDataPoint[] = [
  { month: "Jan", revenue: 950000, target: 1000000 },
  { month: "Feb", revenue: 1100000, target: 1050000 },
  { month: "Mar", revenue: 1250000, target: 1100000 },
  { month: "Apr", revenue: 1180000, target: 1200000 },
  { month: "May", revenue: 1245000, target: 1250000 },
  { month: "Jun", revenue: 1400000, target: 1300000 },
];

const formatCurrency = (value: number) => {
  return `₹${(value / 100000).toFixed(0)}L`;
};

export default function RevenueChart() {
  const maxValue = Math.max(...mockRevenueData.map(d => Math.max(d.revenue, d.target)));
  const chartHeight = 200;
  const chartWidth = 600;
  const padding = 40;
  const chartInnerWidth = chartWidth - 2 * padding;
  const chartInnerHeight = chartHeight - 2 * padding;

  const xScale = (index: number) => padding + (index / (mockRevenueData.length - 1)) * chartInnerWidth;
  const yScale = (value: number) => chartHeight - padding - (value / maxValue) * chartInnerHeight;

  return (
    <div className={styles.container}>
      <svg width={chartWidth} height={chartHeight} className={styles.chart}>
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((percent) => {
          const y = padding + (percent / 100) * chartInnerHeight;
          return (
            <React.Fragment key={percent}>
              <line
                x1={padding}
                y1={y}
                x2={chartWidth - padding}
                y2={y}
                stroke="#E5E7EB"
                strokeWidth="1"
              />
              <text
                x={padding - 10}
                y={y + 5}
                textAnchor="end"
                className={styles.gridLabel}
              >
                {formatCurrency((maxValue * (100 - percent)) / 100)}
              </text>
            </React.Fragment>
          );
        })}

        {/* X-axis */}
        <line
          x1={padding}
          y1={chartHeight - padding}
          x2={chartWidth - padding}
          y2={chartHeight - padding}
          stroke="#E5E7EB"
          strokeWidth="2"
        />

        {/* Y-axis */}
        <line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={chartHeight - padding}
          stroke="#E5E7EB"
          strokeWidth="2"
        />

        {/* Revenue line */}
        <polyline
          points={mockRevenueData.map((d, i) => `${xScale(i)},${yScale(d.revenue)}`).join(' ')}
          fill="none"
          stroke="#FF6A2F"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Target line */}
        <polyline
          points={mockRevenueData.map((d, i) => `${xScale(i)},${yScale(d.target)}`).join(' ')}
          fill="none"
          stroke="#9CA3AF"
          strokeWidth="2"
          strokeDasharray="5,5"
        />

        {/* Data points for revenue */}
        {mockRevenueData.map((d, i) => (
          <g key={`revenue-${i}`}>
            <circle
              cx={xScale(i)}
              cy={yScale(d.revenue)}
              r="4"
              fill="#FF6A2F"
              stroke="white"
              strokeWidth="2"
            />
            {/* Value label */}
            <text
              x={xScale(i)}
              y={yScale(d.revenue) - 10}
              textAnchor="middle"
              className={styles.dataLabel}
            >
              {formatCurrency(d.revenue)}
            </text>
          </g>
        ))}

        {/* Month labels */}
        {mockRevenueData.map((d, i) => (
          <text
            key={i}
            x={xScale(i)}
            y={chartHeight - padding + 20}
            textAnchor="middle"
            className={styles.monthLabel}
          >
            {d.month}
          </text>
        ))}

        {/* Legend */}
        <g transform="translate(20, 20)">
          <rect x="0" y="0" width="12" height="3" fill="#FF6A2F" />
          <text x="18" y="5" className={styles.legendText}>Actual Revenue</text>

          <line x1="0" y1="15" x2="12" y2="15" stroke="#9CA3AF" strokeWidth="2" strokeDasharray="3,3" />
          <text x="18" y="20" className={styles.legendText}>Target</text>
        </g>
      </svg>
    </div>
  );
}