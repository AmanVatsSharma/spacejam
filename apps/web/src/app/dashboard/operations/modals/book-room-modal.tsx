"use client";

/**
 * File:        apps/web/src/app/dashboard/operations/modals/book-room-modal.tsx
 * Module:      Web · Dashboard · Operations · Book Room Modal
 * Purpose:     Controlled booking form — populates rooms via useMeetingRooms,
 *              submits via useBookRoom. Shows an empty state when no rooms exist.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-08
 */

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useBookRoom, useMeetingRooms } from "@/hooks/use-operations";

export interface BookRoomModalProps {
  open: boolean;
  onClose: () => void;
  /** Pre-select a room when launched from a specific room card. */
  roomId?: string;
  /** Constrain the room list to a single center. */
  centerId?: string;
}

const emptyForm = {
  roomId: "",
  eventDate: "",
  startTime: "",
  endTime: "",
  title: "",
  attendees: "",
};

export function BookRoomModal({ open, onClose, roomId, centerId }: BookRoomModalProps) {
  const [form, setForm] = useState(emptyForm);
  const [touched, setTouched] = useState(false);

  const { rooms, loading } = useMeetingRooms(centerId ? { centerId } : undefined);
  const { book, booking } = useBookRoom();

  // Pre-select a room when one is passed in (and refresh if it changes).
  useEffect(() => {
    if (roomId) setForm((prev) => ({ ...prev, roomId }));
  }, [roomId]);

  // Reset the form whenever the modal is closed.
  useEffect(() => {
    if (!open) {
      setForm(emptyForm);
      setTouched(false);
    }
  }, [open]);

  if (!open) return null;

  const update = (field: keyof typeof emptyForm, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const selectedRoom = rooms.find((r: any) => r.id === form.roomId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);

    if (!form.roomId) {
      toast.error("Please select a meeting room");
      return;
    }
    if (!form.eventDate || !form.startTime || !form.endTime) {
      toast.error("Date, start time and end time are required");
      return;
    }
    if (!form.title.trim()) {
      toast.error("Meeting title is required");
      return;
    }
    if (form.endTime <= form.startTime) {
      toast.error("End time must be after start time");
      return;
    }

    try {
      const result = await book({
        roomId: form.roomId,
        centerId: selectedRoom?.centerId ?? centerId ?? "",
        eventDate: form.eventDate,
        startTime: form.startTime,
        endTime: form.endTime,
        title: form.title.trim(),
      });

      if (result) {
        toast.success("Meeting room booked successfully");
        onClose();
      } else {
        toast.error("Could not book the room. Please try again.");
      }
    } catch (err) {
      toast.error(
        `Failed to book room: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[500px] bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-100 flex items-start justify-between">
          <div>
            <h2 className="text-[20px] font-bold text-gray-900">Book Meeting Room</h2>
            <p className="text-[14px] text-gray-500 mt-1">Reserve a room for your meeting.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {rooms.length === 0 && !loading ? (
          <div className="p-10 flex flex-col items-center justify-center text-center gap-3">
            <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center text-gray-300">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-16 0H3" />
              </svg>
            </div>
            <p className="text-[15px] font-semibold text-gray-700">No meeting rooms available</p>
            <p className="text-[13px] text-gray-500 max-w-[280px]">
              There are no meeting rooms to book right now. Try again later or contact an admin.
            </p>
          </div>
        ) : (
          <form className="p-6 overflow-y-auto flex flex-col gap-5" onSubmit={handleSubmit}>
            {/* Select Room */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-gray-700">Select Room</label>
              <div className="relative">
                <select
                  className="w-full px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-colors appearance-none pr-10 disabled:opacity-60"
                  value={form.roomId}
                  onChange={(e) => update("roomId", e.target.value)}
                  disabled={loading}
                >
                  <option value="">{loading ? "Loading rooms..." : "Select a room..."}</option>
                  {rooms.map((r: any) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                      {r.capacity ? ` · ${r.capacity} ppl` : ""}
                    </option>
                  ))}
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </div>
              {touched && !form.roomId && (
                <span className="text-[12px] text-red-500">Please select a room</span>
              )}
            </div>

            {/* Date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-gray-700">Date</label>
              <input
                type="date"
                className="px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-colors"
                value={form.eventDate}
                onChange={(e) => update("eventDate", e.target.value)}
              />
            </div>

            {/* Start / End Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-gray-700">Start Time</label>
                <input
                  type="time"
                  className="px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-colors"
                  value={form.startTime}
                  onChange={(e) => update("startTime", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-gray-700">End Time</label>
                <input
                  type="time"
                  className="px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-colors"
                  value={form.endTime}
                  onChange={(e) => update("endTime", e.target.value)}
                />
              </div>
            </div>

            {/* Title */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-gray-700">Meeting Title / Purpose</label>
              <input
                type="text"
                placeholder="e.g. Monthly Sync"
                className="px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-colors"
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
              />
            </div>

            {/* Attendees */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-gray-700">Attendees</label>
              <input
                type="number"
                min="1"
                placeholder="Number of people"
                className="px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-colors"
                value={form.attendees}
                onChange={(e) => update("attendees", e.target.value)}
              />
            </div>

            {/* Footer */}
            <div className="flex gap-4 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 text-[14px] font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                disabled={booking}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-[#FF6A2F] text-white text-[14px] font-semibold rounded-lg hover:bg-[#E55A20] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={booking}
              >
                {booking && (
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                    <path d="M22 12a10 10 0 01-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                )}
                {booking ? "Booking..." : "Confirm Booking"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
