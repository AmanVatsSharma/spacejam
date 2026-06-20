/**
 * File:        libs/ui/src/lib/stats-card/StatsCard.tsx
 * Module:      UI · Stats Card
 * Purpose:     Statistics card component from Figma design
 *
 * Exports:
 *   - StatsCard — stats display card component
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-07
 */

"use client";

import React from 'react';
import styles from './StatsCard.module.css';

interface StatsCardProps {
  label: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: string;
}

const Icons: Record<string, React.ReactNode> = {
  revenue: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M10 2V18M10 18L7 15M10 18L13 15" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 2L7 5M10 2L13 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  guest: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="10" cy="7" r="3" />
      <path d="M4 17C4 14.24 6.69 12 10 12C13.31 12 16 14.24 16 17" strokeLinecap="round" />
    </svg>
  ),
  member: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="7" cy="6" r="2.5" />
      <circle cx="13" cy="6" r="2.5" />
      <path d="M3 17C3 15 5 14 7 14H13C15 14 17 15 17 17" strokeLinecap="round" />
      <path d="M7 14V11M13 14V11" strokeLinecap="round" />
    </svg>
  ),
  space: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="4" width="14" height="13" rx="2" />
      <path d="M3 8H17M7 4V2M13 4V2" />
    </svg>
  ),
};

export default function StatsCard({ label, value, change, changeType = 'neutral', icon }: StatsCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.label}>{label}</div>
      <div className={styles.value}>{value}</div>
      {change && (
        <div className={`${styles.change} ${styles[changeType]}`}>
          {changeType === 'positive' && '↑'}
          {changeType === 'negative' && '↓'}
          {change}
        </div>
      )}
      {icon && Icons[icon] && (
        <div className={styles.icon}>
          {Icons[icon]}
        </div>
      )}
    </div>
  );
}