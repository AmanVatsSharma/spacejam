/**
 * File:        apps/web/src/app/dashboard/meeting-room/page.tsx
 * Module:      Web · Dashboard · Meeting Room
 * Purpose:     Meeting Room status dashboard with Layout (cards) and
 *              Table (rows) view modes. Pixel-perfect match to
 *              Figma SpaceJam-VB:
 *                - Layout view  → node 0-8190
 *                - Table view   → node 0-9849
 *              Both modes share the hero card, 4 stat cards, view
 *              toggle, and Active Add-ons panel.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-24
 */

"use client";

import { useState } from "react";
import styles from "./meeting-room.module.css";

type RoomStatus = "occupied" | "available" | "booked" | "maintenance";

interface BookingInfo {
  /** "Current Booking" or "Next booking" */
  label: string;
  title: string;
  /** "10:00 AM - 11:30 AM" */
  time: string;
}

interface RoomCard {
  id: string;
  name: string;
  capacity: number;
  status: RoomStatus;
  booking?: BookingInfo;
}

const ROOMS: RoomCard[] = [
  // Row 1
  {
    id: "boardroom-a",
    name: "Boardroom A",
    capacity: 12,
    status: "occupied",
    booking: { label: "Current Booking", title: "Oracle ltd.", time: "10:00 AM - 11:30 AM" },
  },
  {
    id: "meeting-room-1",
    name: "Meeting Room 1",
    capacity: 6,
    status: "available",
    booking: { label: "Next booking", title: "", time: "3:00 PM" },
  },
  {
    id: "conference-1",
    name: "Conference 1",
    capacity: 20,
    status: "booked",
  },
  // Row 2
  {
    id: "meeting-room-2",
    name: "Meeting Room 2",
    capacity: 4,
    status: "available",
    booking: { label: "Next booking", title: "", time: "4:00 PM" },
  },
  {
    id: "boardroom-b",
    name: "Boardroom B",
    capacity: 10,
    status: "occupied",
    booking: { label: "Current Booking", title: "Satyam Tech.", time: "9:30 AM - 12:00 PM" },
  },
  {
    id: "meeting-room-3",
    name: "Meeting Room 3",
    capacity: 8,
    status: "available",
  },
  // Row 3
  {
    id: "conference-2",
    name: "Conference 2",
    capacity: 15,
    status: "maintenance",
  },
  {
    id: "meeting-room-4",
    name: "Meeting Room 4",
    capacity: 6,
    status: "available",
    booking: { label: "Next booking", title: "", time: "5:00 PM" },
  },
  {
    id: "meeting-room-5",
    name: "Meeting Room 5",
    capacity: 4,
    status: "occupied",
    booking: { label: "Current Booking", title: "Sahu Enterprise.", time: "11:00 AM - 12:30 PM" },
  },
  // Row 4
  {
    id: "boardroom-c",
    name: "Boardroom C",
    capacity: 12,
    status: "available",
    booking: { label: "Next booking", title: "", time: "2:30 PM" },
  },
  {
    id: "meeting-room-6",
    name: "Meeting Room 6",
    capacity: 8,
    status: "booked",
  },
  {
    id: "conference-3",
    name: "Conference 3",
    capacity: 18,
    status: "available",
  },
];

interface AddonRow {
  id: string;
  title: string;
  subtitle: string;
  /** Renders a pill instead of check/x icons */
  statusLabel?: string;
  hasCheck?: boolean;
  hasX?: boolean;
}

const ADDONS: AddonRow[] = [
  { id: "projector", title: "Projector Setup", subtitle: "Boardroom A · 3:00 PM", hasCheck: true, hasX: true },
  { id: "catering", title: "Catering Service", subtitle: "Conference 2 · 3:30 PM", statusLabel: "Approved" },
  { id: "wifi", title: "Extra WiFi Access", subtitle: "Meeting Room 5 · 4:00 PM", hasCheck: true, hasX: true },
];

const STATUS_PILL: Record<RoomStatus, { label: string; color: string; bg: string }> = {
  occupied:    { label: "Occupied",   color: "#FF6A2F", bg: "#FFEBE0" },
  available:   { label: "Available",  color: "#10B981", bg: "#D1FAE5" },
  booked:      { label: "Booked",     color: "#FF6A2F", bg: "#FFEBE0" },
  maintenance: { label: "Maintenance", color: "#06B6D4", bg: "#CFFAFE" },
};

const ACTION_BTN: Record<RoomStatus, { label: string; bg: string; color: string; hover?: string }> = {
  occupied:    { label: "Extend",        bg: "#10B981", color: "#FFFFFF" },
  available:   { label: "Book Now",      bg: "#F59E0B", color: "#FFFFFF" },
  booked:      { label: "View Booking",  bg: "#FF6A4F", color: "#FFFFFF" },
  maintenance: { label: "Unavailable",   bg: "#94A3B8", color: "#FFFFFF" },
};

// Calendar / clock icons (kept inline for self-contained card)
const CalendarIcon = ({ stroke = "#6A7282" }: { stroke?: string }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <rect x="2" y="3" width="10" height="9" rx="1.5" stroke={stroke} strokeWidth="1.2" />
    <path d="M2 6H12" stroke={stroke} strokeWidth="1.2" />
    <path d="M5 1.5V4M9 1.5V4" stroke={stroke} strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);
const ClockIcon = ({ stroke = "#6A7282" }: { stroke?: string }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <circle cx="7" cy="7" r="5.5" stroke={stroke} strokeWidth="1.2" />
    <path d="M7 4V7.5L9.5 9" stroke={stroke} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const PeopleIcon = ({ stroke = "#6A7282" }: { stroke?: string }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <circle cx="7" cy="5" r="2.2" stroke={stroke} strokeWidth="1.2" />
    <path d="M2.5 12.5C2.5 9.74 4.74 8 7 8C9.26 8 11.5 9.74 11.5 12.5" stroke={stroke} strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

const AddOnIcon = ({ type }: { type: "projector" | "catering" | "wifi" }) => {
  const stroke = "#FF6A2F";
  if (type === "projector") {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="2" y="6" width="13" height="8" rx="1.5" stroke={stroke} strokeWidth="1.4" />
        <path d="M15 9L18 7V13L15 11" stroke={stroke} strokeWidth="1.4" strokeLinejoin="round" />
        <circle cx="6" cy="10" r="1.5" fill={stroke} />
      </svg>
    );
  }
  if (type === "catering") {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M4 8H16L15 14H5L4 8Z" stroke={stroke} strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M7 8V6C7 4.5 8.5 3 10 3C11.5 3 13 4.5 13 6V8" stroke={stroke} strokeWidth="1.4" />
        <path d="M10 11V17" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" />
        <path d="M7 17H13" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    );
  }
  // wifi
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M2.5 7.5C4.7 5.3 7.3 4 10 4C12.7 4 15.3 5.3 17.5 7.5" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" />
      <path d="M5 10C6.5 8.5 8.2 7.7 10 7.7C11.8 7.7 13.5 8.5 15 10" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" />
      <path d="M7.5 12.5C8.2 11.8 9.1 11.4 10 11.4C10.9 11.4 11.8 11.8 12.5 12.5" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="10" cy="15.5" r="1" fill={stroke} />
    </svg>
  );
};

const CheckCircle = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <circle cx="11" cy="11" r="9.5" stroke="#10B981" strokeWidth="1.5" />
    <path d="M7 11.5L9.8 14L15 8.5" stroke="#10B981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CrossCircle = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <circle cx="11" cy="11" r="9.5" stroke="#EF4444" strokeWidth="1.5" />
    <path d="M8 8L14 14M14 8L8 14" stroke="#EF4444" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

/* ---------------- Timeline ---------------- */

interface TimelineRow {
  room: string;
  /** Day timeline blocks (9 AM – 6 PM): [start%, width%] */
  day: [number, number][];
  /** Night timeline blocks (7 PM – 6 AM): [start%, width%] */
  night: [number, number][];
}

const TIMELINE_ROWS: TimelineRow[] = [
  // Block: [start%, width%]
  { room: "Boardroom A",    day: [[10, 15], [50, 20]], night: [[0, 17], [33, 12]] },
  { room: "Meeting Room 1", day: [[0, 20], [70, 10]],  night: [[8, 33], [55, 13]] },
  { room: "Conference 1",   day: [[20, 15], [70, 10]], night: [[4, 12], [50, 17]] },
  { room: "Meeting Room 2", day: [[40, 20]],            night: [[25, 42]] },
  { room: "Boardroom B",    day: [[60, 20]],            night: [[0, 25], [67, 12]] },
  { room: "Meeting Room 3", day: [[30, 10]],            night: [[12, 25]] },
];

const HOURS_DAY: string[] = [
  "9 AM", "10 AM", "11 AM", "12 PM",
  "1 PM", "2 PM", "3 PM", "4 PM", "5 PM", "6 PM",
];
const HOURS_NIGHT: string[] = [
  "7 PM", "8 PM", "9 PM", "10 PM", "11 PM", "12 AM",
  "1 AM", "2 AM", "3 AM", "4 AM", "5 AM", "6 AM",
];

function TimelineBlock({
  start,
  width,
  color,
}: {
  start: number;
  width: number;
  color: string;
}) {
  return (
    <div
      className={styles.timelineBlock}
      style={{
        left: `${start}%`,
        width: `${width}%`,
        background: color,
      }}
    />
  );
}

function TimelineRowTrack({
  blocks,
  color,
}: {
  blocks: [number, number][];
  color: string;
}) {
  return (
    <div className={styles.timelineTrack}>
      {blocks.map(([s, w], i) => (
        <TimelineBlock key={i} start={s} width={w} color={color} />
      ))}
    </div>
  );
}

/* ---------------- Room Card ---------------- */

function RoomCard({ room }: { room: RoomCard }) {
  const pill = STATUS_PILL[room.status];
  const action = ACTION_BTN[room.status];
  const showBooking =
    (room.status === "occupied" || room.status === "available") && room.booking;

  return (
    <div className={styles.roomCard}>
      <div className={styles.roomCardHeader}>
        <h3 className={styles.roomCardTitle}>{room.name}</h3>
        <span className={styles.statusPill} style={{ color: pill.color, background: pill.bg }}>
          {pill.label}
        </span>
      </div>

      <div className={styles.roomCardCapacity}>
        <PeopleIcon />
        <span>{room.capacity} people</span>
      </div>

      {showBooking && room.booking && (
        <div className={styles.roomCardBooking}>
          <div className={styles.bookingLabel}>{room.booking.label}</div>
          {room.booking.title && <div className={styles.bookingTitle}>{room.booking.title}</div>}
          <div className={styles.bookingTime}>
            <ClockIcon stroke={room.booking.title ? "#FF6A2F" : "#6A7282"} />
            <span>{room.booking.time}</span>
          </div>
        </div>
      )}

      <button
        type="button"
        className={styles.roomCardAction}
        style={{ background: action.bg, color: action.color }}
      >
        {action.label}
      </button>
    </div>
  );
}

/* ---------------- Add-on Row ---------------- */

function AddonRowItem({ item }: { item: AddonRow }) {
  // Map title to icon type
  const iconType: "projector" | "catering" | "wifi" =
    item.id === "projector" ? "projector" : item.id === "catering" ? "catering" : "wifi";

  return (
    <div className={styles.addonRow}>
      <div className={styles.addonLeft}>
        <div className={styles.addonIconWrap}>
          <AddOnIcon type={iconType} />
        </div>
        <div>
          <div className={styles.addonTitle}>{item.title}</div>
          <div className={styles.addonSubtitle}>{item.subtitle}</div>
        </div>
      </div>
      <div className={styles.addonRight}>
        {item.statusLabel ? (
          <span className={styles.approvedPill}>{item.statusLabel}</span>
        ) : (
          <>
            <button type="button" className={styles.iconBtn} aria-label="Approve">
              <CheckCircle />
            </button>
            <button type="button" className={styles.iconBtn} aria-label="Reject">
              <CrossCircle />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------------- Room Table (Table View) ---------------- */

/**
 * Derives the "next available" time string for the table view.
 * - For a "Next booking" entry we surface that time.
 * - For a "Current Booking" entry we assume the room is open again at 2:00 PM
 *   after the meeting ends (placeholder value matching the Figma mock).
 * - For rooms with no booking info we return undefined so the cell renders "—".
 */
const nextAvailableFor = (room: RoomCard): string | undefined => {
  if (!room.booking) return undefined;
  if (room.booking.label === "Next booking") return room.booking.time;
  return "2:00 PM";
};

function StatusPill({ status }: { status: RoomStatus }) {
  const p = STATUS_PILL[status];
  return (
    <span
      className={styles.tableStatusPill}
      style={{ color: p.color, background: p.bg }}
    >
      {p.label.toUpperCase()}
    </span>
  );
}

function RoomTable({ rows }: { rows: RoomCard[] }) {
  return (
    <section className={styles.tableCard}>
      <div className={styles.tableScroll}>
        <div className={styles.tableGrid} role="table" aria-label="Meeting rooms table">
          {/* Header row */}
          <div className={styles.tableHeader} role="row">
            <div className={styles.th} role="columnheader">Room Name</div>
            <div className={styles.th} role="columnheader">Capacity</div>
            <div className={styles.th} role="columnheader">Status</div>
            <div className={styles.th} role="columnheader">Current Booking</div>
            <div className={styles.th} role="columnheader">Next Available</div>
            <div className={`${styles.th} ${styles.thActions}`} role="columnheader">Actions</div>
          </div>

          {/* Body rows */}
          {rows.map((room) => {
            const next = nextAvailableFor(room);
            const isCurrent = room.booking?.label === "Current Booking";
            return (
              <div key={room.id} className={styles.tableRow} role="row">
                <div className={`${styles.td} ${styles.tdName}`} role="cell">
                  {room.name}
                </div>
                <div className={`${styles.td} ${styles.tdCapacity}`} role="cell">
                  <PeopleIcon stroke="#6A7282" />
                  <span>{room.capacity}</span>
                </div>
                <div className={`${styles.td} ${styles.tdStatus}`} role="cell">
                  <StatusPill status={room.status} />
                </div>
                <div className={`${styles.td} ${styles.tdBooking}`} role="cell">
                  {isCurrent && room.booking ? (
                    <div className={styles.bookingCell}>
                      <span className={styles.bookingTitle}>{room.booking.title}</span>
                      <span className={styles.bookingTime}>
                        <ClockIcon stroke="#6A7282" />
                        {room.booking.time}
                      </span>
                    </div>
                  ) : (
                    <span className={styles.dashCell}>—</span>
                  )}
                </div>
                <div className={`${styles.td} ${styles.tdNext}`} role="cell">
                  {next ?? <span className={styles.dashCell}>—</span>}
                </div>
                <div className={`${styles.td} ${styles.tdActions}`} role="cell">
                  <button type="button" className={styles.viewDetailsBtn}>
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Page ---------------- */

export default function MeetingRoomPage() {
  const [view, setView] = useState<"layout" | "table">("layout");

  return (
    <div className={styles.page}>
      {/* Hero status card */}
      <section className={styles.heroCard}>
        <div className={styles.heroLeft}>
          <h1 className={styles.heroTitle}>Meeting Room status</h1>
          <p className={styles.heroSubtitle}>Monitor meeting room usage , availability and booking status</p>
        </div>
        <button type="button" className={styles.heroAction}>
          <span className={styles.plusIcon}>+</span>
          <span>Book Room</span>
        </button>
      </section>

      {/* 4 Stats */}
      <section className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statIconWrap}><CalendarIcon stroke="#FF6A2F" /></span>
            <span className={styles.statLabel}>No. of Bookings</span>
          </div>
          <div className={styles.statValue}>200</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statIconWrap}><ClockIcon stroke="#FF6A2F" /></span>
            <span className={styles.statLabel}>Total Hours used</span>
          </div>
          <div className={styles.statValue}>260 <span className={styles.statUnit}>hrs</span></div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statIconWrap}><CalendarIcon stroke="#FF6A2F" /></span>
            <span className={styles.statLabel}>Vacant Slot</span>
          </div>
          <div className={styles.statValue}>2</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statIconWrap}><ClockIcon stroke="#FF6A2F" /></span>
            <span className={styles.statLabel}>Peak usage Hrs</span>
          </div>
          <div className={styles.statValue}>10 <span className={styles.statUnit}>AM – 4</span> <span className={styles.statUnit}>PM</span></div>
        </div>
      </section>

      {/* Layout / Table toggle */}
      <section className={styles.toggleRow}>
        <div className={styles.viewToggle}>
          <button
            type="button"
            className={`${styles.viewBtn} ${view === "layout" ? styles.viewBtnActive : ""}`}
            onClick={() => setView("layout")}
            aria-pressed={view === "layout"}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" />
              <rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" />
              <rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" />
              <rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" />
            </svg>
            <span>Layout View</span>
          </button>
          <button
            type="button"
            className={`${styles.viewBtn} ${view === "table" ? styles.viewBtnActive : ""}`}
            onClick={() => setView("table")}
            aria-pressed={view === "table"}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="2" width="12" height="2.5" rx="0.6" stroke="currentColor" strokeWidth="1.3" />
              <rect x="1" y="6" width="12" height="2.5" rx="0.6" stroke="currentColor" strokeWidth="1.3" />
              <rect x="1" y="10" width="12" height="2.5" rx="0.6" stroke="currentColor" strokeWidth="1.3" />
            </svg>
            <span>Table View</span>
          </button>
        </div>
        <div className={styles.showingCount}>Showing 12 of 12 rooms</div>
      </section>

      {/* Today's Timeline — shared by both Layout and Table views */}
      <section className={styles.timelineCard}>
        {/* Header row: title + legend */}
        <div className={styles.timelineHeader}>
          <div className={styles.timelineTitle}>Today&apos;s Timeline</div>
          <div className={styles.legend}>
            <span className={styles.legendItem}>
              <span
                className={styles.legendSwatch}
                style={{ background: "#FF7847" }}
              />
              <span>Day (9AM-7PM)</span>
            </span>
            <span className={styles.legendItem}>
              <span
                className={styles.legendSwatch}
                style={{ background: "#00D5BE" }}
              />
              <span>Night (7PM-7AM)</span>
            </span>
          </div>
        </div>

        {/* Day + Night halves with shared room list */}
        <div className={styles.timelineBody}>
          {/* Day half */}
          <div className={styles.timelineHalf}>
            <div className={styles.halfHeader}>
              <span className={`${styles.halfPill} ${styles.halfPillDay}`}>
                Day Timeline
              </span>
            </div>
            <div className={styles.hourAxis}>
              {HOURS_DAY.map((h) => (
                <div key={h} className={styles.hourLabel}>{h}</div>
              ))}
            </div>
            {TIMELINE_ROWS.map((r) => (
              <div key={r.room} className={styles.timelineRow}>
                <div className={styles.timelineLabel}>{r.room}</div>
                <TimelineRowTrack blocks={r.day} color="#FF7847" />
              </div>
            ))}
          </div>

          {/* Vertical separator */}
          <div className={styles.timelineDivider} aria-hidden="true" />

          {/* Night half */}
          <div className={styles.timelineHalf}>
            <div className={styles.halfHeader}>
              <span className={`${styles.halfPill} ${styles.halfPillNight}`}>
                Night Timeline
              </span>
            </div>
            <div className={styles.hourAxis}>
              {HOURS_NIGHT.map((h) => (
                <div key={h} className={styles.hourLabel}>{h}</div>
              ))}
            </div>
            {TIMELINE_ROWS.map((r) => (
              <div key={`night-${r.room}`} className={styles.timelineRow}>
                <div className={styles.timelineLabel}>{r.room}</div>
                <TimelineRowTrack blocks={r.night} color="#00D5BE" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Layout-view body: 12 room cards grid */}
      {view === "layout" && (
        <section className={styles.roomsGrid}>
          {ROOMS.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </section>
      )}

      {/* Table-view body: full-width room table */}
      {view === "table" && <RoomTable rows={ROOMS} />}

      {/* Active Add-ons & Requests */}
      <section className={styles.addonsCard}>
        <h2 className={styles.addonsTitle}>Active Add-ons &amp; Requests</h2>
        <div className={styles.addonsList}>
          {ADDONS.map((a) => (
            <AddonRowItem key={a.id} item={a} />
          ))}
        </div>
      </section>
    </div>
  );
}
