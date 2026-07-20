"use client";

import React from "react";

interface RoomBooking {
  id: string;
  name: string;
  status: "Available" | "Occupied" | "Booked" | "Maintenance";
  capacity?: number;
}

interface MeetingRoomBookingGridProps {
  rooms: RoomBooking[];
}

const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
  Available: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
  Occupied: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
  Booked: { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500" },
  Maintenance: { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" },
};

export function MeetingRoomBookingGrid({ rooms }: MeetingRoomBookingGridProps) {
  const cols = rooms.length > 0 ? Math.ceil(Math.sqrt(rooms.length)) : 2;
  const colWidth = `repeat(${Math.min(cols, 2)}, 1fr)`;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 flex flex-col gap-4 hover:shadow-md transition-all duration-200 w-[284px]">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-800">Meeting Rooms</h3>
        <span className="text-xs text-gray-400">{rooms.length} rooms</span>
      </div>

      {rooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
          <svg className="h-8 w-8 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" />
            <path d="M1 21h22" />
          </svg>
          <span className="text-sm mt-2">No rooms available</span>
        </div>
      ) : (
        <div className="grid gap-2" style={{ gridTemplateColumns: colWidth }}>
          {rooms.map((room) => {
            const config = statusConfig[room.status] ?? statusConfig.Available;
            return (
              <div
                key={room.id}
                className={`${config.bg} ${config.text} rounded-xl px-3 py-2.5 flex items-center gap-2 transition-all duration-200 hover:shadow-sm`}
              >
                <span className={`w-2 h-2 rounded-full ${config.dot} flex-shrink-0`} />
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium truncate">{room.name}</span>
                  <span className="text-[10px] opacity-70">
                    {room.capacity ? `${room.capacity} seats` : room.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
