"use client";

/**
 * File:        apps/web/src/app/dashboard/operations/meeting-room/view-details-modal.tsx
 * Module:      Web · Dashboard · Meeting Room
 * Purpose:     Modal showing meeting room details + active booking + cancel action
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-06
 */

import { useQuery } from "@apollo/client";
import { GET_BOOKINGS } from "@/lib/apollo/operations";
import { useMemo } from "react";

export interface ViewDetailsModalProps {
  open: boolean;
  onClose: () => void;
  room: any;
  onCancelBooking?: (bookingId: string) => void | Promise<void>;
}

export function ViewDetailsModal({ open, onClose, room, onCancelBooking }: ViewDetailsModalProps) {
  const { data, loading } = useQuery(GET_BOOKINGS, { skip: !open || !room?.id });

  const activeBooking = useMemo(() => {
    if (!data?.bookings || !room?.id) return null;
    return data.bookings.find((b: any) =>
      b.meetingRoom?.id === room.id &&
      (b.status === 'CONFIRMED' || b.status === 'PENDING' || b.status === 'BOOKED')
    ) ?? null;
  }, [data, room?.id]);

  if (!open || !room) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{room.name}</h2>
            <p className="text-sm text-gray-500 mt-0.5">Capacity: {room.capacity ?? 4} people</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition-colors p-1"
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M6 18L18 6" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Status</p>
              <p className="mt-1 text-sm font-medium text-gray-900">{room.status ?? 'AVAILABLE'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Hourly Rate</p>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {room.hourlyRate != null ? `₹${room.hourlyRate}/hr` : 'Not set'}
              </p>
            </div>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold mb-2">Active Booking</p>
            {loading ? (
              <div className="bg-gray-50 rounded-lg p-3 animate-pulse h-16" />
            ) : activeBooking ? (
              <div className="bg-orange-50 border border-orange-100 rounded-lg p-3">
                <p className="text-sm font-medium text-gray-900">{activeBooking.title ?? 'Booking'}</p>
                <p className="text-xs text-gray-600 mt-1">
                  {activeBooking.startDate ?? activeBooking.startTime} → {activeBooking.endDate ?? activeBooking.endTime}
                </p>
                <p className="text-xs text-gray-500 mt-1">Status: {activeBooking.status}</p>
                <button
                  type="button"
                  onClick={() => onCancelBooking?.(activeBooking.id)}
                  className="mt-3 w-full bg-red-500 hover:bg-red-600 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Cancel Booking
                </button>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-3 text-center text-sm text-gray-500">
                No active bookings
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-2 px-5 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
