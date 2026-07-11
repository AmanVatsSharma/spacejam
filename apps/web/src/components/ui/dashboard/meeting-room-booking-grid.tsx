/**
 * File:        apps/web/src/components/ui/dashboard/meeting-room-booking-grid.tsx
 * Module:      Web · UI · Dashboard · Meeting Room Booking Grid
 * Purpose:     2x3 grid of meeting room cards with status pills
 *
 * Design Reference: Figma node 0:32446 (Meeting Room Booking)
 * - Card width: 525px, height: ~388px
 * - Title + subtitle
 * - 2 rows x 3 cols of room cards (153x131 each)
 * - Each room: Name, Status pill, Capacity
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-24
 */

"use client";

import React from "react";
import styles from "./meeting-room-booking-grid.module.css";

export type RoomStatus = "Occupied" | "Available" | "Booked" | "Maintenance";

export interface MeetingRoom {
  id: string;
  name: string;
  status: RoomStatus;
  capacity: number;
}

interface MeetingRoomBookingGridProps {
  title?: string;
  subtitle?: string;
  rooms?: MeetingRoom[];
  className?: string;
}

const defaultRooms: MeetingRoom[] = [
  { id: "1", name: "Boardroom A", status: "Occupied", capacity: 12 },
  { id: "2", name: "Meeting 1", status: "Available", capacity: 6 },
  { id: "3", name: "Conference 1", status: "Booked", capacity: 20 },
  { id: "4", name: "Meeting 2", status: "Available", capacity: 4 },
  { id: "5", name: "Boardroom B", status: "Occupied", capacity: 10 },
  { id: "6", name: "Conference 2", status: "Maintenance", capacity: 20 },
];

// Status icon (small dot)
const StatusDot = ({ color }: { color: string }) => (
  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
    <circle cx="4" cy="4" r="3" fill={color} />
  </svg>
);

// Chevron down for status pill
const ChevronDown = ({ color }: { color: string }) => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
    <path d="M3 4L5 6L7 4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// User icon for capacity
const UserIcon = ({ color }: { color: string }) => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <circle cx="6" cy="4" r="2" stroke={color} strokeWidth="1.2"/>
    <path d="M2 10C2 8 4 7 6 7C8 7 10 8 10 10" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);

const statusColors: Record<RoomStatus, { bg: string; text: string; dot: string }> = {
  Occupied: { bg: "#FEE4DA", text: "#C4320A", dot: "#FF7847" },
  Available: { bg: "#D0F1ED", text: "#0A7B6E", dot: "#10B981" },
  Booked: { bg: "#F3F4F6", text: "#6B7280", dot: "#9CA3AF" },
  Maintenance: { bg: "#FEE2E2", text: "#B91C1C", dot: "#EF4444" },
};

export function MeetingRoomBookingGrid({
  title = "Meeting Room Booking",
  subtitle = "Booking status of the meeting rooms",
  rooms = defaultRooms,
  className = "",
}: MeetingRoomBookingGridProps) {
  return (
    <div className={`${styles.card} ${className}`}>
      {/* Header */}
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.subtitle}>{subtitle}</p>
      </div>

      {/* Room grid 2x3 */}
      {rooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-6 mt-4 text-center bg-[#F9FAFB] rounded-[10px] border border-dashed border-[#E5E7EB] min-h-[160px]">
          <span className="text-[14px] font-medium text-[#6B7280]">No meeting rooms available</span>
          <span className="text-[12px] text-[#9CA3AF] mt-1">There are currently no meeting rooms to display.</span>
        </div>
      ) : (
        <div className={styles.grid}>
          {rooms.map((room, idx) => {
            const colors = statusColors[room.status];
            return (
              <div key={room.id} className={`${styles.roomCard}`} style={{ '--i': idx } as React.CSSProperties}>
                {/* Room name */}
                <h4 className={styles.roomName}>{room.name}</h4>
  
                {/* Status pill */}
                <button className={styles.statusPill} style={{ background: colors.bg }}>
                  <StatusDot color={colors.dot} />
                  <span className={styles.statusLabel} style={{ color: colors.text }}>
                    {room.status}
                  </span>
                  <ChevronDown color={colors.text} />
                </button>
  
                {/* Capacity */}
                <div className={styles.capacity}>
                  <UserIcon color="#9CA3AF" />
                  <span className={styles.capacityText}>{room.capacity} people</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function MeetingRoomBookingGridDemo() {
  return <MeetingRoomBookingGrid />;
}
