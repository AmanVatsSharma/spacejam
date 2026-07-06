/**
 * File:        apps/web/src/lib/mock-data/operations-mock-data.tsx
 * Module:      Web · Mock Data · Operations
 * Purpose:     Demo/fallback data for the operations section (Meeting Rooms, Events, Requests).
 *              All pages in /dashboard/operations consume these constants when the Apollo
 *              query returns null or an empty array (e.g. backend is down, auth missing,
 *              or running in offline mode).
 *
 *              Each export is used as a <source-of-truth> fallback so the UI never breaks —
 *              it simply shows the DEMO_BADGE.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-02
 */

/* ──────────────────────────────────────────────────
 * Demo / Fallback Badge
 * Add this element next to any section title that is
 * backed by mock data so testers and devs can see it
 * at a glance.
 * ────────────────────────────────────────────────── */
export const DEMO_BADGE = (
  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200 ml-2 align-middle">
    <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
    Demo Data
  </span>
);

/* ──────────────────────────────────────────────────
 * Types (mirrors backend shapes exactly for parity)
 * ────────────────────────────────────────────────── */
export type RoomStatus = "occupied" | "available" | "booked" | "maintenance";
export type EventStatus = "confirmed" | "pending" | "completed";
export type RequestStatus = "Pending" | "Approved" | "Rejected";
export type RequestType = "Events" | "Printer" | "Upgrade" | "Services";

export interface BookingInfo {
  label: string;
  title: string;
  time: string;
}

export interface RoomCard {
  id: string;
  name: string;
  capacity: number;
  status: RoomStatus;
  booking?: BookingInfo;
}

export interface EventRow {
  id: string;
  title: string;
  company: string;
  date: string;
  time: string;
  duration: string;
  room: string;
  seats: number;
  addons: string[];
  notes: string;
  status: EventStatus;
}

export interface RoomRequest {
  id: string;
  requestType: RequestType;
  requestedBy: string;
  details: string;
  date: string;
  status: RequestStatus;
}

export interface ActivityItem {
  icon: "payment" | "printer" | "event";
  title: string;
  description: string;
}

/* ──────────────────────────────────────────────────
 * Helper functions
 * ────────────────────────────────────────────────── */

// Map backend status → frontend status
export const mapStatus = (s: string): RoomStatus => {
  const normalized = s.toLowerCase();
  if (normalized === "available") return "available";
  if (normalized === "booked" || normalized === "occupied") return "booked";
  if (normalized === "maintenance") return "maintenance";
  return "available";
};

// Convert Apollo event data → UI row format
export const toEventRow = (e: any): EventRow => ({
  id: e.id,
  title: e.title,
  company: e.company ?? (e.requestedBy?.name ?? "Unknown"),
  date: e.eventDate,
  time: e.startTime,
  duration: `${e.durationMinutes} min`,
  room: e.meetingRoom?.name ?? "—",
  seats: e.attendeesCount ?? 0,
  addons: e.addons ?? [],
  notes: e.notes ?? "",
  status: e.status?.toLowerCase() as EventStatus,
});

// Group events by date ranges
export const classifyByDate = (events: EventRow[], date: string) => {
  const today = new Date(date).setHours(0, 0, 0, 0);
  const tomorrow = new Date(today).getTime();
  return {
    today: events.filter((ev) => {
      const evDate = new Date(ev.date).getTime();
      return evDate >= today && evDate < tomorrow;
    }),
    upcoming: events.filter((ev) => {
      const evDate = new Date(ev.date).getTime();
      return evDate >= tomorrow;
    }),
    past: events.filter((ev) => {
      const evDate = new Date(ev.date).getTime();
      return evDate < today;
    }),
  };
};

/* ──────────────────────────────────────────────────
 * Fallback data (extracted from page files)
 * ────────────────────────────────────────────────── */

const FALLBACK_ROOMS: RoomCard[] = [
  {
    id: "boardroom-a", name: "Boardroom A", capacity: 12, status: "occupied",
    booking: { label: "Current Booking", title: "Oracle ltd.", time: "10:00 AM - 11:30 AM" },
  },
  {
    id: "meeting-room-1", name: "Meeting Room 1", capacity: 6, status: "available",
    booking: { label: "Next booking", title: "", time: "3:00 PM" },
  },
  {
    id: "conference-1", name: "Conference 1", capacity: 20, status: "booked",
  },
  {
    id: "meeting-room-2", name: "Meeting Room 2", capacity: 4, status: "available",
    booking: { label: "Next booking", title: "", time: "4:00 PM" },
  },
  {
    id: "boardroom-b", name: "Boardroom B", capacity: 10, status: "occupied",
    booking: { label: "Current Booking", title: "Satyam Tech.", time: "9:30 AM - 12:00 PM" },
  },
  {
    id: "meeting-room-3", name: "Meeting Room 3", capacity: 8, status: "available",
  },
  {
    id: "conference-2", name: "Conference 2", capacity: 15, status: "maintenance",
  },
  {
    id: "meeting-room-4", name: "Meeting Room 4", capacity: 6, status: "available",
    booking: { label: "Next booking", title: "", time: "5:00 PM" },
  },
  {
    id: "meeting-room-5", name: "Meeting Room 5", capacity: 4, status: "occupied",
    booking: { label: "Current Booking", title: "Sahu Enterprise.", time: "11:00 AM - 12:30 PM" },
  },
  {
    id: "boardroom-c", name: "Boardroom C", capacity: 12, status: "available",
    booking: { label: "Next booking", title: "", time: "2:30 PM" },
  },
  {
    id: "meeting-room-6", name: "Meeting Room 6", capacity: 8, status: "booked",
  },
  {
    id: "conference-3", name: "Conference 3", capacity: 18, status: "available",
  },
];

const FALLBACK_TODAY: EventRow[] = [
  { id: "ev-t1", title: "Product Strategy Meeting", company: "TechCorp Inc.", date: "April 25, 2026", time: "09:00 AM", duration: "2 hours", room: "Room A", seats: 8, addons: ["Projector", "Whiteboard"], notes: "Quarterly planning session", status: "confirmed" },
  { id: "ev-t2", title: "Client Onboarding Session", company: "StartupXYZ", date: "April 25, 2026", time: "11:30 AM", duration: "1 hour", room: "Room B", seats: 6, addons: ["TV Display"], notes: "Welcome walkthrough for the new cohort.", status: "confirmed" },
  { id: "ev-t3", title: "Design Workshop", company: "Creative Studios", date: "April 25, 2026", time: "02:00 PM", duration: "3 hours", room: "Conference Hall", seats: 12, addons: ["Whiteboard", "Markers"], notes: "Hands-on UI exploration — bring laptops.", status: "pending" },
  { id: "ev-t4", title: "Investment Pitch", company: "VentureCap Partners", date: "April 25, 2026", time: "04:30 PM", duration: "1.5 hours", room: "Room C", seats: 5, addons: ["Projector"], notes: "Series A deck rehearsal.", status: "confirmed" },
];

const FALLBACK_UPCOMING: EventRow[] = [
  { id: "ev-u1", title: "Team Building Event", company: "InnovateCo", date: "April 28, 2026", time: "10:00 AM", duration: "4 hours", room: "Conference Hall", seats: 25, addons: ["Catering", "Whiteboard"], notes: "Off-site team building — RSVP required.", status: "confirmed" },
  { id: "ev-u2", title: "Board Meeting", company: "FinTech Solutions", date: "May 02, 2026", time: "02:00 PM", duration: "2 hours", room: "Room A", seats: 10, addons: ["Projector", "Conference Phone"], notes: "Quarterly board review.", status: "pending" },
  { id: "ev-u3", title: "Training Workshop", company: "EduTech Labs", date: "May 06, 2026", time: "09:30 AM", duration: "3 hours", room: "Room B", seats: 15, addons: ["Whiteboard", "Markers", "Projector"], notes: "Train-the-trainer session.", status: "confirmed" },
];

const FALLBACK_PAST: EventRow[] = [
  { id: "ev-p1", title: "Annual General Meeting", company: "SpaceJam Co.", date: "April 10, 2026", time: "10:00 AM", duration: "2 hours", room: "Conference Hall", seats: 40, addons: ["Projector", "Catering"], notes: "Annual general meeting for stakeholders.", status: "completed" },
];

const todayStr = new Date().toISOString().split('T')[0];
const FALLBACK_EVENTS: EventRow[] = [
  ...FALLBACK_TODAY.map(e => ({ ...e, id: `fb-t-${e.id}` })),
  ...FALLBACK_UPCOMING,
  ...FALLBACK_PAST,
];

const FALLBACK_REQUESTS: RoomRequest[] = [
  { id: "REQ-001", requestType: "Events", requestedBy: "Sarah Chen", details: "Conference room booking for team meeting", date: "24-04-2026", status: "Pending" },
  { id: "REQ-002", requestType: "Printer", requestedBy: "Mike Johnson", details: "Color printer access request", date: "21-04-2026", status: "Approved" },
  { id: "REQ-003", requestType: "Upgrade", requestedBy: "Emily Rodriguez", details: "Upgrade to premium desk space", date: "22-04-2026", status: "Pending" },
  { id: "REQ-004", requestType: "Services", requestedBy: "David Kim", details: "IT support for network setup", date: "20-04-2026", status: "Approved" },
  { id: "REQ-005", requestType: "Events", requestedBy: "Lisa Wang", details: "Workshop space for Friday afternoon", date: "23-04-2026", status: "Rejected" },
  { id: "REQ-006", requestType: "Printer", requestedBy: "James Taylor", details: "Bulk printing for marketing materials", date: "20-04-2026", status: "Pending" },
  { id: "REQ-007", requestType: "Upgrade", requestedBy: "Anna Martinez", details: "Additional storage locker request", date: "19-04-2026", status: "Approved" },
  { id: "REQ-008", requestType: "Services", requestedBy: "Tom Anderson", details: "Mail handling service setup", date: "18-04-2026", status: "Pending" },
];

const FALLBACK_ACTIVITIES: ActivityItem[] = [
  { icon: "payment", title: "Payment Failed", description: "Invoice #INV-1021 (₹4,200)" },
  { icon: "printer", title: "Printer Booked Today", description: "Patel Enterprises printer bo....." },
  { icon: "printer", title: "Printer Booked Today", description: "Patel Enterprises printer bo....." },
];

/* ──────────────────────────────────────────────────
 * Export fallback data
 * ────────────────────────────────────────────────── */
export {
  FALLBACK_ROOMS,
  FALLBACK_TODAY,
  FALLBACK_UPCOMING,
  FALLBACK_PAST,
  FALLBACK_EVENTS,
  FALLBACK_REQUESTS,
  FALLBACK_ACTIVITIES,
};