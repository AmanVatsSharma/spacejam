/**
 * File:        apps/web/src/components/ui/dashboard/room-availability-card.tsx
 * Module:      Web · UI · Dashboard · Room Availability Card
 * Purpose:     Availability grid/list view for meeting rooms
 *
 * Exports:
 *   - RoomAvailabilityCard — card displaying room availability
 *   - RoomAvailabilityGrid — alternative grid view
 *
 * Author:      Claude Code
 * Last-updated: 2026-05-29
 */

"use client";

import React, { useState } from "react";

export type AvailabilityStatus = "available" | "unavailable" | "partial";

interface Room {
  id: string;
  name: string;
  floor: string;
  capacity: number;
  availableSeats: number;
  status: AvailabilityStatus;
}

interface RoomAvailabilityCardProps {
  rooms: Room[];
  title?: string;
  viewMode?: "list" | "grid";
  onViewAll?: () => void;
}

const statusLabels: Record<AvailabilityStatus, string> = {
  available: "Available",
  unavailable: "Unavailable",
  partial: "Partial",
};

const statusStyles: Record<AvailabilityStatus, { bg: string; text: string; dot: string }> = {
  available: {
    bg: "bg-[#D0F1ED]",
    text: "text-[#0A7B6E]",
    dot: "bg-[#0A7B6E]",
  },
  unavailable: {
    bg: "bg-[#FFE4DA]",
    text: "text-[#C4320A]",
    dot: "bg-[#C4320A]",
  },
  partial: {
    bg: "bg-[#FEF2D3]",
    text: "text-[#946B00]",
    dot: "bg-[#946B00]",
  },
};

export function RoomAvailabilityCard({
  rooms,
  title = "Room Availability",
  viewMode = "list",
  onViewAll,
}: RoomAvailabilityCardProps) {
  return (
    <div className="bg-white rounded-[14px] shadow-[0px_0px_0px_0.5px_rgba(0,0,0,0.08),0px_2px_4px_-2px_rgba(0,0,0,0.05)] p-5 flex flex-col gap-4 w-[428px] transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-800">{title}</h3>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-sm text-[#FF6A3D] font-medium hover:text-[#e55a2b] transition-all"
          >
            View All
          </button>
        )}
      </div>

      {/* Room List */}
      <div className="flex flex-col gap-2">
        {rooms.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            No rooms available
          </div>
        ) : (
          rooms.map((room) => (
            <div
              key={room.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-xl transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5"
            >
              {/* Room Info */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#FFF7ED] rounded-lg flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <rect x="2" y="3" width="16" height="14" rx="2" stroke="#FF6A3D" strokeWidth="1.5"/>
                    <path d="M2 7H18" stroke="#FF6A3D" strokeWidth="1.5"/>
                    <path d="M6 17V11" stroke="#FF6A3D" strokeWidth="1.5"/>
                  </svg>
                </div>
                <div className="flex flex-col gap-0.5">
                  <h4 className="text-sm font-medium text-gray-800">{room.name}</h4>
                  <p className="text-xs text-gray-500">{room.floor}</p>
                </div>
              </div>

              {/* Capacity & Status */}
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-xs text-gray-500">
                    {room.availableSeats}/{room.capacity}
                  </span>
                  <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${statusStyles[room.status].bg}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusStyles[room.status].dot}`} />
                    <span className={`text-xs font-medium ${statusStyles[room.status].text}`}>
                      {statusLabels[room.status]}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Alternative grid view component
interface RoomAvailabilityGridProps {
  rooms: Room[];
  title?: string;
  onViewAll?: () => void;
}

export function RoomAvailabilityGrid({
  rooms,
  title = "Room Availability",
  onViewAll,
}: RoomAvailabilityGridProps) {
  const [activeView, setActiveView] = useState<"list" | "grid">("list");

  return (
    <div className="bg-white rounded-[14px] shadow-[0px_0px_0px_0.5px_rgba(0,0,0,0.08),0px_2px_4px_-2px_rgba(0,0,0,0.05)] p-5 flex flex-col gap-4 w-[428px] transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-800">{title}</h3>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveView("list")}
            className={`p-1.5 rounded-md transition-all duration-200 ${
              activeView === "list" ? "bg-white shadow-sm" : "hover:bg-gray-200"
            }`}
            aria-label="List view"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2 4H14M2 8H14M2 12H14" strokeLinecap="round"/>
            </svg>
          </button>
          <button
            onClick={() => setActiveView("grid")}
            className={`p-1.5 rounded-md transition-colors ${
              activeView === "grid" ? "bg-white shadow-sm" : "hover:bg-gray-200"
            }`}
            aria-label="Grid view"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="2" width="5" height="5" rx="1"/>
              <rect x="9" y="2" width="5" height="5" rx="1"/>
              <rect x="2" y="9" width="5" height="5" rx="1"/>
              <rect x="9" y="9" width="5" height="5" rx="1"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Content based on view mode */}
      {activeView === "list" ? (
        <div className="flex flex-col gap-2">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-xl transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#FFF7ED] rounded-lg flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <rect x="2" y="3" width="16" height="14" rx="2" stroke="#FF6A3D" strokeWidth="1.5"/>
                    <path d="M2 7H18" stroke="#FF6A3D" strokeWidth="1.5"/>
                    <path d="M6 17V11" stroke="#FF6A3D" strokeWidth="1.5"/>
                  </svg>
                </div>
                <div className="flex flex-col gap-0.5">
                  <h4 className="text-sm font-medium text-gray-800">{room.name}</h4>
                  <p className="text-xs text-gray-500">{room.floor}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-xs text-gray-500">
                    {room.availableSeats}/{room.capacity}
                  </span>
                  <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${statusStyles[room.status].bg}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusStyles[room.status].dot}`} />
                    <span className={`text-xs font-medium ${statusStyles[room.status].text}`}>
                      {statusLabels[room.status]}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="flex flex-col p-3 bg-gray-50 rounded-xl transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-[#FFF7ED] rounded-lg flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                    <rect x="2" y="3" width="16" height="14" rx="2" stroke="#FF6A3D" strokeWidth="1.5"/>
                    <path d="M2 7H18" stroke="#FF6A3D" strokeWidth="1.5"/>
                  </svg>
                </div>
                <div className="flex flex-col">
                  <h4 className="text-sm font-medium text-gray-800 truncate">{room.name}</h4>
                  <p className="text-xs text-gray-500">{room.floor}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {room.availableSeats}/{room.capacity} seats
                </span>
                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${statusStyles[room.status].bg}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusStyles[room.status].dot}`} />
                  <span className={`text-xs font-medium ${statusStyles[room.status].text}`}>
                    {statusLabels[room.status]}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View All Button */}
      {onViewAll && (
        <button
          onClick={onViewAll}
          className="w-full h-[38px] bg-white border border-[#E5E7EB] rounded-[10px] flex items-center justify-center gap-2 text-sm font-medium text-[#4A5568] hover:bg-gray-50 transition-all active:scale-[0.97]"
        >
          View All Rooms
        </button>
      )}
    </div>
  );
}

// Demo component with sample data
export function RoomAvailabilityDemo() {
  const sampleRooms: Room[] = [
    {
      id: "1",
      name: "Boardroom Alpha",
      floor: "Floor 3",
      capacity: 12,
      availableSeats: 8,
      status: "available",
    },
    {
      id: "2",
      name: "Meeting Room 2B",
      floor: "Floor 2",
      capacity: 6,
      availableSeats: 0,
      status: "unavailable",
    },
    {
      id: "3",
      name: "Conference Suite",
      floor: "Floor 1",
      capacity: 20,
      availableSeats: 5,
      status: "partial",
    },
    {
      id: "4",
      name: "Huddle Space",
      floor: "Floor 2",
      capacity: 4,
      availableSeats: 4,
      status: "available",
    },
  ];

  return (
    <div className="flex gap-4">
      <RoomAvailabilityCard rooms={sampleRooms} />
      <RoomAvailabilityGrid rooms={sampleRooms} />
    </div>
  );
}