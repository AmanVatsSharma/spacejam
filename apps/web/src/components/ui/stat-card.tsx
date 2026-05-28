/**
 * File:        apps/web/src/components/ui/stat-card.tsx
 * Module:      Web · UI · Stat Cards
 * Purpose:     Statistics cards showing capacity metrics
 *
 * Exports:
 *   - StatCard — individual stat display
 *   - StatCards — grid of stat cards
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-05-28
 */

"use client";

import React from "react";

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  subLabel?: string;
}

export function StatCard({ label, value, icon, subLabel }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col gap-3 w-[206px]">
      <div className="flex items-center justify-between">
        <div className="w-9 h-9 bg-[#FFF7ED] rounded-lg flex items-center justify-center">
          {icon}
        </div>
      </div>
      <div>
        <span className="text-[27px] font-bold text-gray-800">{value}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-xs text-gray-500">{label}</span>
        {subLabel && <span className="text-[10px] text-gray-400">{subLabel}</span>}
      </div>
    </div>
  );
}

const CapacityIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <rect x="1" y="1" width="20" height="20" rx="4" stroke="#FF6A3D" strokeWidth="2"/>
    <path d="M7 11H15M11 7V15" stroke="#FF6A3D" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const CabinIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M3 12L12 3L21 12V20H3V12Z" stroke="#FF7847" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M9 20V14H15V20" stroke="#FF7847" strokeWidth="2"/>
  </svg>
);

const HotDeskIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <rect x="4" y="6" width="16" height="12" rx="2" stroke="#FF7847" strokeWidth="2"/>
    <path d="M8 18V20M16 18V20" stroke="#FF7847" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const BookableIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="8" stroke="#FF7847" strokeWidth="2"/>
    <path d="M12 8V12L15 14" stroke="#FF7847" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export function StatCards() {
  const stats = [
    { label: "Total Capacity", value: 210, icon: <CapacityIcon /> },
    { label: "Number of Cabins", value: 32, icon: <CabinIcon /> },
    { label: "Total Hot desk", value: 18, icon: <HotDeskIcon /> },
    { label: "Total bookable space", value: 9, icon: <BookableIcon /> },
  ];

  return (
    <div className="flex flex-row gap-4">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
}