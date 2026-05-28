/**
 * File:        apps/web/src/components/ui/floor-card.tsx
 * Module:      Web · UI · Floor Card
 * Purpose:     Floor overview card with occupancy stats
 *
 * Exports:
 *   - FloorCard — individual floor card
 *   - FloorCardGrid — grid of floor cards
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-05-28
 */

"use client";

import React from "react";

type FloorStatus = "active" | "full" | "maintenance";

interface FloorCardProps {
  floorName: string;
  totalSeats: number;
  status: FloorStatus;
  openSeats: string;
  cabins: number;
  occupancy: number;
}

const statusLabels: Record<FloorStatus, string> = {
  active: "Active",
  full: "Full",
  maintenance: "Maintenance",
};

const statusStyles: Record<FloorStatus, string> = {
  active: "bg-[#D0F1ED] text-gray-500",
  full: "bg-[#FFE4DA] text-gray-500",
  maintenance: "bg-[#FEF2D3] text-gray-500",
};

export function FloorCard({
  floorName,
  totalSeats,
  status,
  openSeats,
  cabins,
  occupancy,
}: FloorCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-[#EAEAEA] shadow-sm p-5 flex flex-col gap-4 w-[428px]">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-medium text-gray-800">{floorName}</h3>
          <p className="text-sm text-gray-500">{totalSeats} Total Seats</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusStyles[status]}`}>
          {statusLabels[status]}
        </span>
      </div>

      {/* Stats */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Open Seats:</span>
          <span className="text-sm font-medium text-gray-800">{openSeats}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Cabins:</span>
          <span className="text-sm font-medium text-gray-800">{cabins}</span>
        </div>
      </div>

      {/* Occupancy Progress */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Occupancy</span>
          <span className="text-xs text-gray-500">{occupancy}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#FF6A3D] rounded-full"
            style={{ width: `${occupancy}%` }}
          />
        </div>
      </div>

      {/* View Floor Map Button */}
      <button className="w-full h-[38px] bg-white border border-[#EAEAEA] rounded-xl flex items-center justify-center gap-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="1" y="1" width="6" height="6" rx="1" />
          <rect x="9" y="1" width="6" height="6" rx="1" />
          <rect x="1" y="9" width="6" height="6" rx="1" />
          <rect x="9" y="9" width="6" height="6" rx="1" />
        </svg>
        <span>View Floor Map</span>
      </button>
    </div>
  );
}

interface FloorCardGridProps {
  floors: FloorCardProps[];
}

export function FloorCardGrid({ floors }: FloorCardGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 w-[872px]">
      {floors.map((floor, index) => (
        <FloorCard key={index} {...floor} />
      ))}
    </div>
  );
}