"use client";

/**
 * File:        apps/web/src/app/dashboard/operations/recurring-bookings/recurring-booking-modal.tsx
 * Module:      Web · Dashboard · Operations · Recurring Booking Modal
 * Purpose:     Controlled modal for creating a new recurring booking.
 *              Shares the room/center/title/time fields with the one-time
 *              BookRoomModal but branches into the recurring flow when the
 *              toggle is on.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-21
 */

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useQuery } from "@apollo/client";
import { useMeetingRooms } from "@/hooks/use-operations";
import { useRecurringBookingMutations } from "@/hooks/use-enterprise";
import { GET_BOOKINGS } from "@/lib/apollo/operations";

export interface RecurringBookingModalProps {
  open: boolean;
  onClose: () => void;
}

const emptyForm = {
  roomId: "",
  eventDate: "",
  startTime: "",
  endTime: "",
  title: "",
};

const PATTERNS = [
  { value: "DAILY", label: "Daily" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "MONTHLY", label: "Monthly" },
] as const;

const WEEK_DAYS = [
  { value: 0, label: "Mon" },
  { value: 1, label: "Tue" },
  { value: 2, label: "Wed" },
  { value: 3, label: "Thu" },
  { value: 4, label: "Fri" },
  { value: 5, label: "Sat" },
  { value: 6, label: "Sun" },
];

export function RecurringBookingModal({ open, onClose }: RecurringBookingModalProps) {
  const [form, setForm] = useState(emptyForm);
  const [pattern, setPattern] = useState<"DAILY" | "WEEKLY" | "MONTHLY">("WEEKLY");
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 3, 5]);
  const [recurringEndDate, setRecurringEndDate] = useState("");
  const [touched, setTouched] = useState(false);
  const [creating, setCreating] = useState(false);

  const { rooms, loading: roomsLoading } = useMeetingRooms();
  const { create } = useRecurringBookingMutations();

  useEffect(() => {
    if (!open) {
      setForm(emptyForm);
      setPattern("WEEKLY");
      setDaysOfWeek([1, 3, 5]);
      setRecurringEndDate("");
      setTouched(false);
    }
  }, [open]);

  if (!open) return null;

  const update = (field: keyof typeof emptyForm, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const selectedRoom = rooms.find((r: any) => r.id === form.roomId);
  const centerId = selectedRoom?.centerId;

  const conflictQuery = useQuery(GET_BOOKINGS, {
    variables: {
      filters: {
        centerId: centerId ?? undefined,
        startDate: form.eventDate ? new Date(form.eventDate) : undefined,
        endDate: form.eventDate
          ? new Date(new Date(form.eventDate).getTime() + 24 * 60 * 60 * 1000)
          : undefined,
      },
    },
    skip: !form.roomId || !form.eventDate,
    fetchPolicy: "cache-and-network",
  });

  const conflictingBookings = useMemo(() => {
    if (!conflictQuery.data?.bookings || !form.roomId || !form.startTime || !form.endTime) {
      return [];
    }
    const selectedStart = new Date(`${form.eventDate}T${form.startTime}`).getTime();
    const selectedEnd = new Date(`${form.eventDate}T${form.endTime}`).getTime();
    return (conflictQuery.data.bookings as any[]).filter((b: any) => {
      if (!b.meetingRoomId || b.meetingRoomId !== form.roomId) return false;
      if (["CANCELLED", "NO_SHOW"].includes(b.status)) return false;
      const bStart = new Date(b.startDate).getTime();
      const bEnd = new Date(b.endDate).getTime();
      if (isNaN(bStart) || isNaN(bEnd)) return false;
      return bStart < selectedEnd && bEnd > selectedStart;
    });
  }, [conflictQuery.data, form.roomId, form.eventDate, form.startTime, form.endTime]);

  const hasConflict = conflictingBookings.length > 0;

  const toggleDay = (d: number) => {
    setDaysOfWeek((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort(),
    );
  };

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
      toast.error("Title is required");
      return;
    }
    if (form.endTime <= form.startTime) {
      toast.error("End time must be after start time");
      return;
    }
    if (!recurringEndDate) {
      toast.error("Recurrence end date is required");
      return;
    }
    if (recurringEndDate <= form.eventDate) {
      toast.error("Recurrence end date must be after the start date");
      return;
    }
    if (pattern === "WEEKLY" && daysOfWeek.length === 0) {
      toast.error("Select at least one day for weekly recurrence");
      return;
    }

    try {
      setCreating(true);
      await create({
        roomId: form.roomId,
        centerId,
        startDate: form.eventDate,
        endDate: recurringEndDate,
        startTime: form.startTime,
        endTime: form.endTime,
        pattern,
        title: form.title.trim(),
        ...(pattern === "WEEKLY" ? { daysOfWeek } : {}),
      });
      onClose();
    } catch (err) {
      toast.error(
        `Failed to create recurring booking: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[520px] bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-100 flex items-start justify-between">
          <div>
            <h2 className="text-[20px] font-bold text-gray-900">New Recurring Booking</h2>
            <p className="text-[14px] text-gray-500 mt-1">Set up a room booking that repeats on a schedule.</p>
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

        <form className="p-6 overflow-y-auto flex flex-col gap-5" onSubmit={handleSubmit}>
          {/* Select Room */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-gray-700">Select Room</label>
            <div className="relative">
              <select
                className="w-full px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-colors appearance-none pr-10 disabled:opacity-60"
                value={form.roomId}
                onChange={(e) => update("roomId", e.target.value)}
                disabled={roomsLoading}
              >
                <option value="">{roomsLoading ? "Loading rooms..." : "Select a room..."}</option>
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
            <label className="text-[13px] font-medium text-gray-700">Start Date</label>
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
            <label className="text-[13px] font-medium text-gray-700">Title</label>
            <input
              type="text"
              placeholder="e.g. Weekly Standup"
              className="px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-colors"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
            />
          </div>

          {/* Pattern selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-gray-700">Recurrence Pattern</label>
            <div className="flex gap-2">
              {PATTERNS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPattern(p.value)}
                  className={`flex-1 py-2.5 rounded-lg text-[13px] font-medium border transition-colors ${
                    pattern === p.value
                      ? "border-[#FF6A2F] bg-[#FFEBE0] text-[#FF6A2F]"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Days of week (WEEKLY) */}
          {pattern === "WEEKLY" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-gray-700">Repeat on</label>
              <div className="flex gap-2">
                {WEEK_DAYS.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => toggleDay(d.value)}
                    className={`flex-1 py-2 rounded-lg text-[13px] font-medium border transition-colors ${
                      daysOfWeek.includes(d.value)
                        ? "border-[#FF6A2F] bg-[#FFEBE0] text-[#FF6A2F]"
                        : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recurrence end date */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-gray-700">Recurrence End Date</label>
            <input
              type="date"
              className="px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-colors"
              value={recurringEndDate}
              onChange={(e) => setRecurringEndDate(e.target.value)}
            />
          </div>

          {/* Conflict warning */}
          {(conflictQuery.loading || hasConflict) && form.roomId && form.eventDate && form.startTime && form.endTime && (
            <div className={`rounded-lg p-4 ${hasConflict ? "bg-red-50 border border-red-100" : "bg-gray-50"}`}>
              {conflictQuery.loading ? (
                <p className="text-[13px] text-gray-500">Checking availability…</p>
              ) : hasConflict ? (
                <p className="text-[13px] font-medium text-red-700">
                  {conflictingBookings.length} conflicting booking{conflictingBookings.length > 1 ? "s" : ""} found on the start date
                </p>
              ) : (
                <p className="text-[13px] text-green-700 font-medium">This time slot is available</p>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex gap-4 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 text-[14px] font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-60"
              disabled={creating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-[#FF6A2F] text-white text-[14px] font-semibold rounded-lg hover:bg-[#E55A20] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={creating || hasConflict}
            >
              {creating && (
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                  <path d="M22 12a10 10 0 01-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              )}
              {creating ? "Creating..." : "Create Recurring Booking"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
