"use client";

/**
 * File:        apps/web/src/app/dashboard/operations/meeting-room/meeting-room-form-modal.tsx
 * Module:      Web · Dashboard · Meeting Room
 * Purpose:     Create/edit modal for meeting rooms
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-19
 */

import { useEffect, useState } from "react";
import { useQuery } from "@apollo/client";
import { GET_MY_CENTERS } from "@/lib/apollo/operations";

export interface MeetingRoomFormValues {
  name: string;
  centerId: string;
  floorId: string | null;
  type: "MEETING_ROOM" | "CONFERENCE_ROOM" | "BOARD_ROOM" | "TRAINING_ROOM" | "EVENT_SPACE" | "PRIVATE_OFFICE";
  capacity: number;
  status: "AVAILABLE" | "BOOKED" | "OCCUPIED" | "MAINTENANCE";
  amenities: string[];
  pricePerHour: number;
}

export interface MeetingRoomFormModalProps {
  open: boolean;
  onClose: () => void;
  editingRoom?: any;
  defaultCenterId?: string;
  onSubmit: (values: MeetingRoomFormValues) => Promise<void> | void;
}

const ROOM_TYPES: MeetingRoomFormValues["type"][] = [
  "MEETING_ROOM",
  "CONFERENCE_ROOM",
  "BOARD_ROOM",
  "TRAINING_ROOM",
  "EVENT_SPACE",
  "PRIVATE_OFFICE",
];

const ROOM_STATUSES: MeetingRoomFormValues["status"][] = [
  "AVAILABLE",
  "BOOKED",
  "OCCUPIED",
  "MAINTENANCE",
];

const DEFAULT_AMENITIES = ["WiFi", "TV", "Whiteboard", "AC", "Coffee", "Phone"];

const empty: MeetingRoomFormValues = {
  name: "",
  centerId: "",
  floorId: null,
  type: "MEETING_ROOM",
  capacity: 4,
  status: "AVAILABLE",
  amenities: [],
  pricePerHour: 0,
};

export function MeetingRoomFormModal({ open, onClose, editingRoom, defaultCenterId, onSubmit }: MeetingRoomFormModalProps) {
  const { data: centersData } = useQuery(GET_MY_CENTERS, { skip: !open });
  const [form, setForm] = useState<MeetingRoomFormValues>(empty);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editingRoom) {
      setForm({
        name: editingRoom.name ?? "",
        centerId: editingRoom.centerId ?? "",
        floorId: editingRoom.floorId ?? null,
        type: editingRoom.type ?? "MEETING_ROOM",
        capacity: editingRoom.capacity ?? 4,
        status: editingRoom.status ?? "AVAILABLE",
        amenities: editingRoom.amenities ?? [],
        pricePerHour: editingRoom.hourlyRate ?? 0,
      });
    } else {
      setForm({ ...empty, centerId: defaultCenterId ?? "" });
    }
  }, [open, editingRoom, defaultCenterId]);

  if (!open) return null;

  const centers: any[] = centersData?.myCenters ?? [];
  const selectedCenter = centers.find((c) => c.id === form.centerId);
  const floors: any[] = selectedCenter?.floors ?? [];

  const toggleAmenity = (a: string) => {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(a)
        ? prev.amenities.filter((x) => x !== a)
        : [...prev.amenities, a],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (!form.centerId) return;
    if (form.capacity < 1) return;
    setSubmitting(true);
    try {
      await onSubmit(form);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {editingRoom ? "Edit meeting room" : "New meeting room"}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {editingRoom ? "Update room details and pricing." : "Add a bookable space to a center."}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-700 transition-colors p-1">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M6 18L18 6" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Boardroom A"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Center *</label>
              <select
                required
                value={form.centerId}
                onChange={(e) => setForm({ ...form, centerId: e.target.value, floorId: null })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
              >
                <option value="">Select center…</option>
                {centers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Floor</label>
              <select
                value={form.floorId ?? ""}
                onChange={(e) => setForm({ ...form, floorId: e.target.value || null })}
                disabled={!form.centerId}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white disabled:bg-gray-50 disabled:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
              >
                <option value="">No floor</option>
                {floors.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as MeetingRoomFormValues["type"] })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
              >
                {ROOM_TYPES.map((t) => (
                  <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Capacity *</label>
              <input
                type="number"
                required
                min={1}
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value, 10) || 1 })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as MeetingRoomFormValues["status"] })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
              >
                {ROOM_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Price / hour</label>
              <input
                type="number"
                min={0}
                step="0.5"
                value={form.pricePerHour}
                onChange={(e) => setForm({ ...form, pricePerHour: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Amenities</label>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_AMENITIES.map((a) => {
                const active = form.amenities.includes(a);
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() => toggleAmenity(a)}
                    className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                      active
                        ? "bg-orange-500 text-white border-orange-500"
                        : "bg-white text-gray-700 border-gray-200 hover:border-orange-300"
                    }`}
                  >
                    {a}
                  </button>
                );
              })}
            </div>
          </div>
        </form>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50">
          <button type="button" onClick={onClose} className="bg-white hover:bg-gray-100 text-gray-700 text-sm font-medium py-2 px-5 rounded-lg border border-gray-200 transition-colors">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !form.name.trim() || !form.centerId}
            className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-medium py-2 px-5 rounded-lg transition-colors"
          >
            {submitting ? "Saving…" : editingRoom ? "Save changes" : "Create room"}
          </button>
        </div>
      </div>
    </div>
  );
}
