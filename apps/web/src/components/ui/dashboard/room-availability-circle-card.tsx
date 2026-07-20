"use client";

import React from "react";

interface RoomAvailabilityCircleCardProps {
  totalAvailable: number;
  totalSeats: number;
  subStats?: { label: string; value: number; color?: string }[];
}

export function RoomAvailabilityCircleCard({
  totalAvailable,
  totalSeats,
  subStats = [],
}: RoomAvailabilityCircleCardProps) {
  const occupied = totalSeats - totalAvailable;
  const pct = totalSeats > 0 ? Math.round((occupied / totalSeats) * 100) : 0;
  const circumference = 2 * Math.PI * 52;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 flex flex-col gap-4 hover:shadow-md transition-all duration-200 w-[284px]">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-800">Room Availability</h3>
        <span className="text-xs text-gray-400">Today</span>
      </div>

      <div className="flex flex-col items-center gap-3">
        <div className="relative w-[120px] h-[120px]">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="52" fill="none" stroke="#F3F4F6" strokeWidth="8" />
            <circle
              cx="60" cy="60" r="52" fill="none" stroke="#FF6A2F" strokeWidth="8"
              strokeDasharray={circumference} strokeDashoffset={offset}
              strokeLinecap="round" className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-gray-900">{pct}%</span>
            <span className="text-[11px] text-gray-400">Occupied</span>
          </div>
        </div>

        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
            <span className="text-gray-600">Available: <strong className="text-gray-800">{totalAvailable}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF6A2F]" />
            <span className="text-gray-600">Occupied: <strong className="text-gray-800">{occupied}</strong></span>
          </div>
        </div>
      </div>

      {subStats.length > 0 && (
        <div className="flex gap-2">
          {subStats.map((s) => (
            <div key={s.label} className="flex-1 bg-gray-50 rounded-lg p-2 text-center">
              <div className={`text-lg font-semibold ${s.color ?? "text-gray-800"}`}>{s.value}</div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wide">{s.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
