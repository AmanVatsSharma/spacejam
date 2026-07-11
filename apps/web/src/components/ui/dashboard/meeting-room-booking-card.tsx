/**
 * File:        apps/web/src/components/ui/dashboard/meeting-room-booking-card.tsx
 * Module:      Web · UI · Dashboard · Meeting Room Booking Card
 * Purpose:     Booking list with room, time, and status display
 *
 * Exports:
 *   - MeetingRoomBookingCard — card displaying upcoming bookings
 *   - BookingStatus enum
 *
 * Author:      Claude Code
 * Last-updated: 2026-05-29
 */

"use client";

import React from "react";

export type BookingStatus = "confirmed" | "pending" | "cancelled";

interface Booking {
  id: string;
  roomName: string;
  floor: string;
  time: string;
  duration: string;
  status: BookingStatus;
  bookedBy: string;
}

interface MeetingRoomBookingCardProps {
  bookings: Booking[];
  title?: string;
  onViewAll?: () => void;
}

const statusLabels: Record<BookingStatus, string> = {
  confirmed: "Confirmed",
  pending: "Pending",
  cancelled: "Cancelled",
};

const statusStyles: Record<BookingStatus, string> = {
  confirmed: "bg-[#D0F1ED] text-[#0A7B6E]",
  pending: "bg-[#FEF2D3] text-[#946B00]",
  cancelled: "bg-[#FFE4DA] text-[#C4320A]",
};

export function MeetingRoomBookingCard({
  bookings,
  title = "Upcoming Bookings",
  onViewAll,
}: MeetingRoomBookingCardProps) {
  return (
    <div className="bg-white rounded-[14px] shadow-[0px_0px_0px_0.5px_rgba(0,0,0,0.08),0px_2px_4px_-2px_rgba(0,0,0,0.05)] p-5 flex flex-col gap-4 w-[428px] transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-800">{title}</h3>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-sm text-[#FF6A3D] font-medium hover:text-[#e55a2b] transition-colors"
          >
            View All
          </button>
        )}
      </div>

      {/* Bookings List */}
      <div className="flex flex-col gap-3">
        {bookings.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            No upcoming bookings
          </div>
        ) : (
          bookings.map((booking) => (
            <div
              key={booking.id}
              className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5"
            >
              {/* Room Icon */}
              <div className="w-10 h-10 bg-[#FFF7ED] rounded-lg flex items-center justify-center flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <rect x="2" y="4" width="16" height="12" rx="2" stroke="#FF6A3D" strokeWidth="1.5"/>
                  <path d="M2 8H18" stroke="#FF6A3D" strokeWidth="1.5"/>
                  <circle cx="5" cy="6" r="1" fill="#FF6A3D"/>
                  <circle cx="8" cy="6" r="1" fill="#FF6A3D"/>
                </svg>
              </div>

              {/* Booking Details */}
              <div className="flex flex-col gap-1 flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-medium text-gray-800 truncate">
                    {booking.roomName}
                  </h4>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[booking.status]} flex-shrink-0`}>
                    {statusLabels[booking.status]}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{booking.floor}</p>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="6" cy="6" r="5"/>
                      <path d="M6 3V6L8 7" strokeLinecap="round"/>
                    </svg>
                    <span>{booking.time}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M1 6H11M6 1V11" strokeLinecap="round"/>
                    </svg>
                    <span>{booking.duration}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-400">by {booking.bookedBy}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Default export with sample data
export function MeetingRoomBookingCardDemo() {
  const sampleBookings: Booking[] = [
    {
      id: "1",
      roomName: "Boardroom Alpha",
      floor: "Floor 3",
      time: "10:00 AM",
      duration: "2 hrs",
      status: "confirmed",
      bookedBy: "Sarah Johnson",
    },
    {
      id: "2",
      roomName: "Meeting Room 2B",
      floor: "Floor 2",
      time: "11:30 AM",
      duration: "1 hr",
      status: "pending",
      bookedBy: "Mike Chen",
    },
    {
      id: "3",
      roomName: "Conference Suite",
      floor: "Floor 1",
      time: "2:00 PM",
      duration: "3 hrs",
      status: "confirmed",
      bookedBy: "Emily Davis",
    },
    {
      id: "4",
      roomName: "Huddle Space",
      floor: "Floor 2",
      time: "4:30 PM",
      duration: "30 min",
      status: "cancelled",
      bookedBy: "Alex Turner",
    },
  ];

  return <MeetingRoomBookingCard bookings={sampleBookings} />;
}