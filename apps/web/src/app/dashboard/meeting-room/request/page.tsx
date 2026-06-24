/**
 * File:        apps/web/src/app/dashboard/meeting-room/request/page.tsx
 * Module:      Web · Dashboard · Meeting Room · Request
 * Purpose:     Form page for raising a new meeting room booking request
 *
 * Design:      Figma node 0-12998 — SpaceJam-VB
 *              Two-column layout: booking form on the left,
 *              contextual room/center info on the right.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-24
 */

"use client";

import { useState } from "react";
import styles from "./request.module.css";

type RoomOption = {
  id: string;
  name: string;
  capacity: number;
  price: string;
};

// Mock data — wired to backend later
const ROOMS: RoomOption[] = [
  { id: "saturn-1", name: "Saturn 1", capacity: 8, price: "₹600/hr" },
  { id: "saturn-2", name: "Saturn 2", capacity: 8, price: "₹600/hr" },
  { id: "mercury", name: "Mercury", capacity: 4, price: "₹400/hr" },
  { id: "jupiter", name: "Jupiter", capacity: 12, price: "₹900/hr" },
  { id: "neptune", name: "Neptune", capacity: 6, price: "₹500/hr" },
];

const CENTERS = [
  { id: "downtown", name: "Downtown Center" },
  { id: "tech-park", name: "Tech Park Center" },
  { id: "marina", name: "Marina Center" },
];

const AMENITIES = [
  "Projector",
  "Whiteboard",
  "TV / Display",
  "Conference Phone",
  "Video Conferencing",
  "Standing Desks",
];

export default function MeetingRoomRequestPage() {
  // Form state
  const [center, setCenter] = useState(CENTERS[0].id);
  const [room, setRoom] = useState(ROOMS[0].id);
  const [date, setDate] = useState("2026-06-25");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");
  const [attendees, setAttendees] = useState("6");
  const [purpose, setPurpose] = useState("");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    "Projector",
    "Whiteboard",
  ]);
  const [specialRequest, setSpecialRequest] = useState("");

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity]
    );
  };

  const selectedRoom = ROOMS.find((r) => r.id === room)!;
  const selectedCenter = CENTERS.find((c) => c.id === center)!;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: wire to backend
    console.log({
      center: selectedCenter.name,
      room: selectedRoom.name,
      date,
      startTime,
      endTime,
      attendees,
      purpose,
      selectedAmenities,
      specialRequest,
    });
  };

  return (
    <div className={styles.page}>
      {/* Page header */}
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Request Meeting Room</h1>
          <p className={styles.pageSubtitle}>
            Fill in the details below to book a meeting room for your team.
          </p>
        </div>
        <button
          type="button"
          className={styles.backLink}
          onClick={() => window.history.back()}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M10 3L5 8l5 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back
        </button>
      </header>

      <form className={styles.grid} onSubmit={handleSubmit}>
        {/* Left column — form */}
        <section className={styles.formCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Booking Details</h2>
            <p className={styles.cardSubtitle}>
              Choose a center, room and time for your meeting.
            </p>
          </div>

          {/* Center & Room */}
          <div className={styles.fieldGroup}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="center">
                Center <span className={styles.required}>*</span>
              </label>
              <div className={styles.selectWrap}>
                <select
                  id="center"
                  value={center}
                  onChange={(e) => setCenter(e.target.value)}
                  className={styles.select}
                >
                  {CENTERS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronIcon />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="room">
                Meeting Room <span className={styles.required}>*</span>
              </label>
              <div className={styles.selectWrap}>
                <select
                  id="room"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  className={styles.select}
                >
                  {ROOMS.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} — Capacity {r.capacity}
                    </option>
                  ))}
                </select>
                <ChevronIcon />
              </div>
            </div>
          </div>

          {/* Date */}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="date">
              Date <span className={styles.required}>*</span>
            </label>
            <div className={styles.inputWrap}>
              <input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={styles.input}
              />
            </div>
          </div>

          {/* Time range */}
          <div className={styles.fieldGroup}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="startTime">
                Start Time <span className={styles.required}>*</span>
              </label>
              <div className={styles.inputWrap}>
                <input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className={styles.input}
                />
                <ClockIcon />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="endTime">
                End Time <span className={styles.required}>*</span>
              </label>
              <div className={styles.inputWrap}>
                <input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className={styles.input}
                />
                <ClockIcon />
              </div>
            </div>
          </div>

          {/* Attendees */}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="attendees">
              Number of Attendees <span className={styles.required}>*</span>
            </label>
            <div className={styles.inputWrap}>
              <input
                id="attendees"
                type="number"
                min={1}
                max={selectedRoom.capacity}
                value={attendees}
                onChange={(e) => setAttendees(e.target.value)}
                className={styles.input}
              />
              <UsersIcon />
            </div>
            <p className={styles.helperText}>
              Maximum capacity for {selectedRoom.name} is{" "}
              {selectedRoom.capacity} people.
            </p>
          </div>

          {/* Purpose */}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="purpose">
              Purpose of Meeting
            </label>
            <textarea
              id="purpose"
              rows={3}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Briefly describe what this meeting is about…"
              className={`${styles.input} ${styles.textarea}`}
            />
          </div>

          {/* Amenities */}
          <div className={styles.field}>
            <label className={styles.label}>Required Amenities</label>
            <div className={styles.chips}>
              {AMENITIES.map((amenity) => {
                const active = selectedAmenities.includes(amenity);
                return (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => toggleAmenity(amenity)}
                    className={`${styles.chip} ${
                      active ? styles.chipActive : ""
                    }`}
                  >
                    {amenity}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Special request */}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="specialRequest">
              Special Request <span className={styles.optional}>(optional)</span>
            </label>
            <textarea
              id="specialRequest"
              rows={3}
              value={specialRequest}
              onChange={(e) => setSpecialRequest(e.target.value)}
              placeholder="Catering, seating arrangement, AV support, etc."
              className={`${styles.input} ${styles.textarea}`}
            />
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => window.history.back()}
            >
              Cancel
            </button>
            <button type="submit" className={styles.btnPrimary}>
              Submit Request
            </button>
          </div>
        </section>

        {/* Right column — summary panel */}
        <aside className={styles.summary}>
          <div className={styles.summaryCard}>
            <h3 className={styles.summaryTitle}>Booking Summary</h3>

            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Center</span>
              <span className={styles.summaryValue}>{selectedCenter.name}</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Room</span>
              <span className={styles.summaryValue}>{selectedRoom.name}</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Capacity</span>
              <span className={styles.summaryValue}>
                Up to {selectedRoom.capacity} people
              </span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Date</span>
              <span className={styles.summaryValue}>
                {new Date(date).toLocaleDateString("en-IN", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Time</span>
              <span className={styles.summaryValue}>
                {startTime} – {endTime}
              </span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Rate</span>
              <span className={styles.summaryValue}>{selectedRoom.price}</span>
            </div>

            <div className={styles.divider} />

            <div className={styles.notice}>
              <InfoIcon />
              <p>
                Your request will be sent to the center admin for approval.
                You&apos;ll be notified once it&apos;s confirmed.
              </p>
            </div>
          </div>
        </aside>
      </form>
    </div>
  );
}

function ChevronIcon() {
  return (
    <svg
      className={styles.selectIcon}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
    >
      <path
        d="M4 6l4 4 4-4"
        stroke="#6A7282"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      className={styles.inputIcon}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
    >
      <circle cx="8" cy="8" r="6.5" stroke="#6A7282" strokeWidth="1.2" />
      <path
        d="M8 4.5V8l2 1.5"
        stroke="#6A7282"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg
      className={styles.inputIcon}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
    >
      <circle cx="6" cy="5.5" r="2.5" stroke="#6A7282" strokeWidth="1.2" />
      <path
        d="M1.5 13c0-2.2 2-4 4.5-4s4.5 1.8 4.5 4"
        stroke="#6A7282"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <circle cx="11" cy="5" r="2" stroke="#6A7282" strokeWidth="1.2" />
      <path
        d="M12.5 9.5c1.6.5 2.5 1.8 2.5 3.5"
        stroke="#6A7282"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className={styles.infoIcon}
    >
      <circle cx="8" cy="8" r="6.5" stroke="#FF6A2F" strokeWidth="1.2" />
      <path
        d="M8 7.5v4"
        stroke="#FF6A2F"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <circle cx="8" cy="5" r="0.8" fill="#FF6A2F" />
    </svg>
  );
}
