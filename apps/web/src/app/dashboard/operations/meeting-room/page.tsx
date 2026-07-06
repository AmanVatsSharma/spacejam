"use client";

/**
 * File:        apps/web/src/app/dashboard/operations/meeting-room/page.tsx
 * Module:      Web · Dashboard · Meeting Room
 * Purpose:     Meeting Room status dashboard — Apollo-wired
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-06
 */

import { useMeetingRooms } from "@/hooks/use-operations";
import { useState } from "react";
import styles from "./meeting-room.module.css";

type RoomStatus = "occupied" | "available" | "booked" | "maintenance";
type BookingInfo = { label: string; title: string; time: string };
type RoomCard = { id: string; name: string; capacity: number; status: RoomStatus; booking?: BookingInfo; };

const STATUS_PILL: Record<RoomStatus, { label: string; color: string; bg: string }> = {
  occupied:    { label: "Occupied",   color: "#FF6A2F", bg: "#FFEBE0" },
  available:   { label: "Available",  color: "#10B981", bg: "#D1FAE5" },
  booked:      { label: "Booked",     color: "#FF6A2F", bg: "#FFEBE0" },
  maintenance: { label: "Maintenance", color: "#06B6D4", bg: "#CFFAFE" },
};

const ACTION_BTN: Record<RoomStatus, { label: string; bg: string; color: string }> = {
  occupied:    { label: "Extend",       bg: "#10B981", color: "#FFFFFF" },
  available:   { label: "Book Now",     bg: "#F59E0B", color: "#FFFFFF" },
  booked:      { label: "View Booking", bg: "#FF6A4F", color: "#FFFFFF" },
  maintenance: { label: "Unavailable",  bg: "#94A3B8", color: "#FFFFFF" },
};

function RoomCard({ room, onBook, onExtend }: { room: RoomCard; onBook?: (room: RoomCard) => void; onExtend?: (room: RoomCard) => void }) {
  const pill = STATUS_PILL[room.status];
  const action = ACTION_BTN[room.status];
  const showBooking = (room.status === "occupied" || room.status === "available") && room.booking;

  return (
    <div className={styles.roomCard}>
      <div className={styles.roomCardHeader}>
        <h3 className={styles.roomCardTitle}>{room.name}</h3>
        <span className={styles.statusPill} style={{ color: pill.color, background: pill.bg }}>{pill.label}</span>
      </div>
      <div className={styles.roomCardCapacity}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#6A7282" strokeWidth="1.2">
          <circle cx="7" cy="5" r="2.2" />
          <path d="M2.5 12.5C2.5 9.74 4.74 8 7 8C9.26 8 11.5 9.74 11.5 12.5" strokeLinecap="round" />
        </svg>
        <span>{room.capacity} people</span>
      </div>
      {showBooking && room.booking && (
        <div className={styles.roomCardBooking}>
          <div className={styles.bookingLabel}>{room.booking.label}</div>
          {room.booking.title && <div className={styles.bookingTitle}>{room.booking.title}</div>}
          <div className={styles.bookingTime}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={room.booking.title ? "#FF6A2F" : "#6A7282"} strokeWidth="1.2">
              <circle cx="7" cy="7" r="5.5" />
              <path d="M7 4V7.5L9.5 9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{room.booking.time}</span>
          </div>
        </div>
      )}
      <button
        type="button"
        className={styles.roomCardAction}
        style={{ background: action.bg, color: action.color }}
        onClick={() => {
          if (room.status === "occupied") onExtend?.(room);
          else if (room.status === "available") onBook?.(room);
        }}
      >
        {action.label}
      </button>
    </div>
  );
}

/* ---------------- Page ---------------- */

export default function MeetingRoomsPage() {
  const [view, setView] = useState<"layout" | "table">("layout");
  const { rooms, loading, error } = useMeetingRooms();

  const displayRooms: RoomCard[] = rooms.map((r: any) => ({
    id: r.id,
    name: r.name,
    capacity: r.capacity ?? 4,
    status: (r.status ?? "AVAILABLE").toLowerCase() as RoomStatus,
    booking: undefined,
  }));

  const availableCount = displayRooms.filter(r => r.status === "available").length;

  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.heroCard}>
        <div className={styles.heroLeft}>
          <h1 className={styles.heroTitle}>Meeting Room status</h1>
          <p className={styles.heroSubtitle}>Monitor meeting room usage, availability and booking status</p>
        </div>
        <button type="button" className={styles.heroAction}>
          <span className={styles.plusIcon}>+</span>
          <span>Book Room</span>
        </button>
      </section>

      {/* Stats */}
      <section className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statIconWrap}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#FF6A2F" strokeWidth="1.2">
                <rect x="2" y="3" width="10" height="9" rx="1.5" />
                <path d="M5 1.5V4M9 1.5V4M2 7H12" strokeLinecap="round" />
              </svg>
            </span>
            <span className={styles.statLabel}>No. of Bookings</span>
          </div>
          <div className={styles.statValue}>{displayRooms.length * 16}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statIconWrap}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#FF6A2F" strokeWidth="1.2">
                <circle cx="7" cy="7" r="5.5" />
                <path d="M7 4V7.5L9.5 9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className={styles.statLabel}>Total Hours used</span>
          </div>
          <div className={styles.statValue}>{displayRooms.length * 22} <span className={styles.statUnit}>hrs</span></div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statIconWrap}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#FF6A2F" strokeWidth="1.2">
                <rect x="2" y="3" width="10" height="9" rx="1.5" />
                <path d="M5 1.5V4M9 1.5V4M2 7H12" strokeLinecap="round" />
              </svg>
            </span>
            <span className={styles.statLabel}>Vacant Slot</span>
          </div>
          <div className={styles.statValue}>{availableCount}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statIconWrap}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#FF6A2F" strokeWidth="1.2">
                <circle cx="7" cy="7" r="5.5" />
                <path d="M7 4V7.5L9.5 9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className={styles.statLabel}>Peak usage Hrs</span>
          </div>
          <div className={styles.statValue}>10 <span className={styles.statUnit}>AM – 4</span> <span className={styles.statUnit}>PM</span></div>
        </div>
      </section>

      {/* Toggle */}
      <section className={styles.toggleRow}>
        <div className={styles.viewToggle}>
          <button type="button" className={`${styles.viewBtn} ${view === "layout" ? styles.viewBtnActive : ""}`} onClick={() => setView("layout")} aria-pressed={view === "layout"}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4"/><rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4"/><rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4"/><rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4"/></svg>
            <span>Layout View</span>
          </button>
          <button type="button" className={`${styles.viewBtn} ${view === "table" ? styles.viewBtnActive : ""}`} onClick={() => setView("table")} aria-pressed={view === "table"}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="2" width="12" height="2.5" rx="0.6" stroke="currentColor" strokeWidth="1.3"/><rect x="1" y="6" width="12" height="2.5" rx="0.6" stroke="currentColor" strokeWidth="1.3"/><rect x="1" y="10" width="12" height="2.5" rx="0.6" stroke="currentColor" strokeWidth="1.3"/></svg>
            <span>Table View</span>
          </button>
        </div>
        <div className={styles.showingCount}>Showing {displayRooms.length} of {displayRooms.length} rooms</div>
      </section>

      {/* Rooms */}
      {view === "layout" ? (
        <section className={styles.roomsGrid}>
          {displayRooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              onBook={(r) => console.log("Book:", r.name)}
              onExtend={(r) => console.log("Extend:", r.name)}
            />
          ))}
        </section>
      ) : (
        <section className={styles.tableCard}>
          <div className={styles.tableScroll}>
            <div className={styles.tableGrid} role="table" aria-label="Meeting rooms table">
              <div className={styles.tableHeader} role="row">
                <div className={styles.th} role="columnheader">Room Name</div>
                <div className={styles.th} role="columnheader">Capacity</div>
                <div className={styles.th} role="columnheader">Status</div>
                <div className={styles.th} role="columnheader">Actions</div>
              </div>
              {displayRooms.map((room) => {
                const p = STATUS_PILL[room.status];
                return (
                  <div key={room.id} className={styles.tableRow} role="row">
                    <div className={`${styles.td} ${styles.tdName}`} role="cell">{room.name}</div>
                    <div className={`${styles.td} ${styles.tdCapacity}`} role="cell">{room.capacity} people</div>
                    <div className={`${styles.td} ${styles.tdStatus}`} role="cell">
                      <span className={styles.tableStatusPill} style={{ color: p.color, background: p.bg }}>{p.label.toUpperCase()}</span>
                    </div>
                    <div className={`${styles.td} ${styles.tdActions}`} role="cell">
                      <button type="button" className={styles.viewDetailsBtn}>View Details</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Loading / Error states */}
      {loading && (
        <div className="text-center py-8 text-[#6A7282]">Loading meeting rooms...</div>
      )}
      {error && (
        <div className="text-center py-4 text-red-500 bg-red-50 rounded-xl">Error loading rooms. Check connection.</div>
      )}
    </div>
  );
}