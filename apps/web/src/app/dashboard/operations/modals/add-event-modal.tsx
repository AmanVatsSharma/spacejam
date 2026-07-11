"use client";

/**
 * File:        apps/web/src/app/dashboard/operations/modals/add-event-modal.tsx
 * Module:      Web · Dashboard · Operations · Add Event Modal
 * Purpose:     Controlled form to create an event via useCreateEvent.
 *              The mutation returns a { success, event, error } payload which
 *              we unwrap to drive the toast + close behaviour.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-08
 */

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useCreateEvent, useUpdateEvent, useMeetingRooms } from "@/hooks/use-operations";

export interface AddEventModalProps {
  open: boolean;
  onClose: () => void;
  /**
   * Optional event to edit. When provided, the modal opens in EDIT mode:
   * the form is pre-filled with the event's data and submit calls
   * useUpdateEvent().update(id, input) instead of create.
   */
  event?: {
    id: string;
    title?: string | null;
    description?: string | null;
    company?: string | null;
    eventDate?: string | null;
    startTime?: string | null;
    endTime?: string | null;
    attendeesCount?: number | null;
    eventType?: string | null;
    meetingRoomId?: string | null;
    specialRequests?: string | null;
  };
}

const EVENT_TYPES: { value: string; label: string }[] = [
  { value: "MEETING", label: "Meeting" },
  { value: "WORKSHOP", label: "Workshop" },
  { value: "CONFERENCE", label: "Conference" },
  { value: "OTHER", label: "Other" },
];

const emptyForm = {
  title: "",
  description: "",
  company: "",
  eventDate: "",
  startTime: "",
  endTime: "",
  attendeesCount: "",
  type: "MEETING",
  meetingRoomId: "",
  specialRequests: "",
};

export function AddEventModal({ open, onClose, event }: AddEventModalProps) {
  const isEdit = Boolean(event?.id);
  const [form, setForm] = useState(emptyForm);
  const [touched, setTouched] = useState(false);

  const { create, saving: creating } = useCreateEvent();
  const { update: updateEvent, saving: updating } = useUpdateEvent();
  const saving = isEdit ? updating : creating;
  const { rooms, loading: roomsLoading } = useMeetingRooms();

  // Reset on close, or pre-fill when opening in edit mode.
  useEffect(() => {
    if (!open) {
      setForm(emptyForm);
      setTouched(false);
      return;
    }
    if (event) {
      setForm({
        title: event.title ?? "",
        description: event.description ?? "",
        company: event.company ?? "",
        eventDate: event.eventDate ?? "",
        startTime: event.startTime ?? "",
        endTime: event.endTime ?? "",
        attendeesCount:
          event.attendeesCount != null ? String(event.attendeesCount) : "",
        type: event.eventType ?? "MEETING",
        meetingRoomId: event.meetingRoomId ?? "",
        specialRequests: event.specialRequests ?? "",
      });
    }
  }, [open, event]);

  if (!open) return null;

  const update = (field: keyof typeof emptyForm, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);

    if (!form.title.trim()) {
      toast.error("Event title is required");
      return;
    }
    if (!form.eventDate || !form.startTime || !form.endTime) {
      toast.error("Date, start time and end time are required");
      return;
    }
    if (form.endTime <= form.startTime) {
      toast.error("End time must be after start time");
      return;
    }

    const input: Record<string, unknown> = {
      title: form.title.trim(),
      eventType: form.type,
      eventDate: form.eventDate,
      startTime: form.startTime,
      endTime: form.endTime,
    };
    if (form.description.trim()) input.description = form.description.trim();
    if (form.company.trim()) input.company = form.company.trim();
    if (form.attendeesCount) input.attendeesCount = Number(form.attendeesCount);
    if (form.meetingRoomId) input.meetingRoomId = form.meetingRoomId;
    if (form.specialRequests.trim()) input.specialRequests = form.specialRequests.trim();

    try {
      // EDIT mode: call update with the existing event id.
      if (isEdit && event?.id) {
        const payload = await updateEvent(event.id, input);
        if (payload?.success) {
          toast.success("Event updated successfully");
          onClose();
        } else {
          toast.error(payload?.error ?? "Failed to update event");
        }
        return;
      }

      // CREATE mode.
      const payload = await create(input);

      // useCreateEvent returns { success, event, error } | null
      if (payload?.success) {
        toast.success("Event created successfully");
        onClose();
      } else {
        toast.error(payload?.error ?? "Failed to create event");
      }
    } catch (err) {
      toast.error(
        `Failed to ${isEdit ? "update" : "create"} event: ${
          err instanceof Error ? err.message : "Unknown error"
        }`,
      );
    }
  };

  const inputCls =
    "px-4 py-3 bg-[#F9FAFB] rounded-lg text-[14px] text-gray-900 outline-none border border-transparent focus:border-[#FF6A2F] transition-colors w-full";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[640px] bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-start justify-between">
          <div>
            <h2 className="text-[20px] font-bold text-gray-900">
              {isEdit ? "Edit Event" : "Add New Event"}
            </h2>
            <p className="text-[14px] text-gray-500 mt-1">
              {isEdit
                ? "Update the details of this event."
                : "Schedule a new booking or workspace event."}
            </p>
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
          {/* Title + Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-gray-700">Event Title</label>
              <input
                type="text"
                placeholder="e.g. Quarterly Strategy Meeting"
                className={inputCls}
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
              />
              {touched && !form.title.trim() && (
                <span className="text-[12px] text-red-500">Title is required</span>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-gray-700">Event Type</label>
              <div className="relative">
                <select
                  className={`${inputCls} appearance-none pr-10`}
                  value={form.type}
                  onChange={(e) => update("type", e.target.value)}
                >
                  {EVENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-gray-700">Description</label>
            <textarea
              placeholder="Brief description of the event..."
              rows={3}
              className={`${inputCls} resize-none`}
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
            />
          </div>

          {/* Company + Attendees */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-gray-700">Company</label>
              <input
                type="text"
                placeholder="e.g. Acme Inc."
                className={inputCls}
                value={form.company}
                onChange={(e) => update("company", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-gray-700">Attendees</label>
              <input
                type="number"
                min="1"
                placeholder="Number of people"
                className={inputCls}
                value={form.attendeesCount}
                onChange={(e) => update("attendeesCount", e.target.value)}
              />
            </div>
          </div>

          {/* Date + times */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-gray-700">Date</label>
              <input
                type="date"
                className={inputCls}
                value={form.eventDate}
                onChange={(e) => update("eventDate", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-gray-700">Start Time</label>
              <input
                type="time"
                className={inputCls}
                value={form.startTime}
                onChange={(e) => update("startTime", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-gray-700">End Time</label>
              <input
                type="time"
                className={inputCls}
                value={form.endTime}
                onChange={(e) => update("endTime", e.target.value)}
              />
            </div>
          </div>

          {/* Meeting room */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-gray-700">Meeting Room</label>
            <div className="relative">
              <select
                className={`${inputCls} appearance-none pr-10 disabled:opacity-60`}
                value={form.meetingRoomId}
                onChange={(e) => update("meetingRoomId", e.target.value)}
                disabled={roomsLoading}
              >
                <option value="">{roomsLoading ? "Loading rooms..." : "Select a room (optional)"}</option>
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
          </div>

          {/* Special requests */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-gray-700">Special Requests</label>
            <textarea
              placeholder="e.g. Projector, whiteboard, catering..."
              rows={3}
              className={`${inputCls} resize-none`}
              value={form.specialRequests}
              onChange={(e) => update("specialRequests", e.target.value)}
            />
          </div>

          {/* Footer */}
          <div className="flex gap-4 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 text-[14px] font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-[#FF6A2F] text-white text-[14px] font-semibold rounded-lg hover:bg-[#E55A20] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={saving}
            >
              {saving && (
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                  <path d="M22 12a10 10 0 01-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              )}
              {saving ? (isEdit ? "Updating..." : "Creating...") : isEdit ? "Update Event" : "Create Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
