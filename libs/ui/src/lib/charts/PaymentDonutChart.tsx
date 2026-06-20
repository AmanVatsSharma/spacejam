/**
 * File:        libs/ui/src/lib/charts/PaymentDonutChart.tsx
 * Module:      UI · Charts · Payment Donut
 * Purpose:     Payment health donut chart component
 *
 * Exports:
 *   - PaymentDonutChart — 3D donut chart for payment status visualization
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-07
 */

"use client";

import React from 'react';
import styles from './PaymentDonutChart.module.css';

interface PaymentData {
  status: 'paid' | 'overdue' | 'partial';
  amount: number;
  color: string;
  percentage: number;
}

const mockPaymentData: PaymentData[] = [
  { status: 'paid', amount: 730000, color: '#10B981', percentage: 73 },
  { status: 'overdue', amount: 160000, color: '#EF4444', percentage: 16 },
  { status: 'partial', amount: 110000, color: '#FBBF24', percentage: 11 },
];

const centerX = 150;
const centerY = 150;
const radius = 120;
const innerRadius = 80;

const calculatePath = (startAngle: number, endAngle: number) => {
  const startX = centerX + radius * Math.cos(startAngle);
  const startY = centerY + radius * Math.sin(startAngle);
  const endX = centerX + radius * Math.cos(endAngle);
  const endY = centerY + radius * Math.sin(endAngle);
  const innerStartX = centerX + innerRadius * Math.cos(endAngle);
  const innerStartY = centerY + innerRadius * Math.sin(endAngle);
  const innerEndX = centerX + innerRadius * Math.cos(startAngle);
  const innerEndY = centerY + innerRadius * Math.sin(startAngle);

  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

  return `
    M ${startX} ${startY}
    A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY}
    L ${innerStartX} ${innerStartY}
    A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerEndX} ${innerEndY}
    Z
  `;
};

const totalAmount = mockPaymentData.reduce((sum, item) => sum + item.amount, 0);
const formatCurrency = (value: number) => {
  return `₹${(value / 100000).toFixed(1)}L`;
};

const statusLabels = {
  paid: 'Paid',
  overdue: 'Overdue',
  partial: 'Partial',
};

export default function PaymentDonutChart() {
  const startAngle = -Math.PI / 2;
  let currentAngle = startAngle;

  const totalPercentage = mockPaymentData.reduce((sum, item) => sum + item.percentage, 0);
  void totalPercentage; // reserved for normalization helper

  return (
    <div className={styles.container}>
      <svg width="400" height="320" viewBox="0 0 400 320">
        {/* Drop shadow filter */}
        <defs>
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
            <feOffset dx="0" dy="2" result="offsetblur" />
            <feFlood floodColor="#000000" floodOpacity="0.1" />
            <feComposite in2="offsetblur" operator="in" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Donut segments */}
        {mockPaymentData.map((item, index) => {
          const segmentAngle = (item.percentage / 100) * 2 * Math.PI;
          const pathData = calculatePath(currentAngle, currentAngle + segmentAngle);
          currentAngle += segmentAngle;

          return (
            <path
              key={index}
              d={pathData}
              fill={item.color}
              filter="url(#shadow)"
              transform="translate(0, 5)"
            />
          );
        })}

        {/* Center circle */}
        <circle
          cx={centerX}
          cy={centerY}
          r={innerRadius}
          fill="#FFFFFF"
        />

        {/* Center text */}
        <text
          x={centerX}
          y={centerY - 10}
          textAnchor="middle"
          className={styles.centerValue}
        >
          {formatCurrency(totalAmount)}
        </text>
        <text
          x={centerX}
          y={centerY + 10}
          textAnchor="middle"
          className={styles.centerLabel}
        >
          Total Amount
        </text>

        {/* Legend */}
        <g transform="translate(260, 50)">
          {mockPaymentData.map((item, index) => {
            const yPos = index * 70;
            return (
              <React.Fragment key={index}>
                <rect
                  x="0"
                  y={yPos}
                  width="12"
                  height="12"
                  fill={item.color}
                  rx="2"
                />
                <text
                  x="20"
                  y={yPos + 10}
                  className={styles.legendLabel}
                >
                  {statusLabels[item.status]} ({item.percentage}%)
                </text>
                <text
                  x="180"
                  y={yPos + 10}
                  className={styles.legendAmount}
                >
                  {formatCurrency(item.amount)}
                </text>
              </React.Fragment>
            );
          })}
        </g>
      </svg>
    </div>
  );
}