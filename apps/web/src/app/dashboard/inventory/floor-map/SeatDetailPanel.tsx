"use client";

/**
 * File:        apps/web/src/app/dashboard/inventory/floor-map/SeatDetailPanel.tsx
 * Module:      Web · Dashboard · Floor Map · Seat Detail Panel
 * Purpose:     Right-side panel shown when a seat is clicked in view mode —
 *              current booking, upcoming/past booking history, quick book,
 *              and a walk-in guest flow (creates a Lead, then opens the
 *              booking modal for the seat).
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-09-04
 */

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { toast } from "sonner";
import { GET_BOOKINGS, CREATE_LEAD } from "@/lib/apollo/operations";
import styles from "./floor-map.module.css";

export interface SeatDetailPanelProps {
  seat: {
    id: string;
    name: string;
    seatType: string;
    status: string;
    price: number;
    x?: number | null;
    y?: number | null;
  };
  centerId?: string;
  onClose: () => void;
  /** Opens the booking modal for this seat. */
  onBookSeat: (seatId: string, seatName: string) => void;
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function normalizeSeatStatus(status: string): "AVAILABLE" | "OCCUPIED" | "MAINTENANCE" {
  const s = (status ?? "").toUpperCase();
  if (s === "AVAILABLE" || s === "FREE" || s === "OPEN") return "AVAILABLE";
  if (s === "MAINTENANCE" || s === "REPAIR" || s === "BLOCKED") return "MAINTENANCE";
  return "OCCUPIED";
}

function seatTypeLabel(type: string): string {
  const t = (type ?? "").toUpperCase();
  if (t === "HOT_DESK" || t.includes("OPEN") || t.includes("DESK") || t.includes("HEXAGON")) return "Open Desk";
  if (t === "DEDICATED") return "Dedicated";
  if (t.includes("CABIN")) return "Cabin";
  if (t.includes("MEETING")) return "Meeting Room";
  return type || "Seat";
}

/** Compact date: "4 Sep" (year appended when it differs from today's). */
function shortDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  if (d.getFullYear() !== new Date().getFullYear()) opts.year = "numeric";
  return d.toLocaleDateString("en-IN", opts);
}

function dateRange(start?: string | null, end?: string | null): string {
  return `${shortDate(start)} → ${shortDate(end)}`;
}

/** Display label for whoever holds the booking (customer → user → walk-in). */
function bookingName(b: any): string {
  return b?.customer?.name || b?.user?.name || "Walk-in";
}

const BOOKING_STATUS_META: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Pending", className: "sdpBadgePending" },
  CONFIRMED: { label: "Confirmed", className: "sdpBadgeConfirmed" },
  CHECKED_IN: { label: "Checked in", className: "sdpBadgeCheckedIn" },
  CHECKED_OUT: { label: "Checked out", className: "sdpBadgeDone" },
  COMPLETED: { label: "Completed", className: "sdpBadgeDone" },
  CANCELLED: { label: "Cancelled", className: "sdpBadgeCancelled" },
};

function BookingStatusBadge({ status }: { status: string }) {
  const meta = BOOKING_STATUS_META[(status ?? "").toUpperCase()];
  if (!meta) return null;
  return (
    <span className={`${styles.sdpBadge} ${styles[meta.className]}`}>{meta.label}</span>
  );
}

/* ── Component ───────────────────────────────────────────────────────────── */

export function SeatDetailPanel({
  seat,
  centerId,
  onClose,
  onBookSeat,
}: SeatDetailPanelProps) {
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [showWalkIn, setShowWalkIn] = useState(false);
  const [walkIn, setWalkIn] = useState({ name: "", phone: "", email: "" });
  const [creatingLead, setCreatingLead] = useState(false);

  // Bookings for this seat only — backend supports filters: { seatId, limit }.
  const {
    data: bookingsData,
    loading: bookingsLoading,
  } = useQuery(GET_BOOKINGS, {
    variables: { filters: { seatId: seat.id, limit: 20 } },
    fetchPolicy: "cache-and-network",
    errorPolicy: "all",
  });

  const [createLead] = useMutation(CREATE_LEAD);

  const bookings = useMemo(() => bookingsData?.bookings ?? [], [bookingsData]);

  const { current, upcoming, past } = useMemo(() => {
    const now = Date.now();
    const active: any[] = [];
    const soon: any[] = [];
    const done: any[] = [];

    for (const b of bookings) {
      const status = String(b.status ?? "").toUpperCase();
      const start = b.startDate ? new Date(b.startDate).getTime() : NaN;
      const end = b.endDate ? new Date(b.endDate).getTime() : NaN;

      const isPastStatus =
        status === "CHECKED_OUT" || status === "COMPLETED" || status === "CANCELLED";
      const isFutureStatus = status === "PENDING" || status === "CONFIRMED" || status === "CHECKED_IN";

      if (isPastStatus || (!Number.isNaN(end) && end < now)) {
        done.push(b);
      } else if (
        isFutureStatus &&
        !Number.isNaN(start) &&
        start <= now &&
        (Number.isNaN(end) || end >= now)
      ) {
        active.push(b);
      } else if (isFutureStatus && !Number.isNaN(start) && start > now) {
        soon.push(b);
      } else {
        // Anything that fits no bucket (bad dates, unknown status) still
        // shows under Past so history is never silently dropped.
        done.push(b);
      }
    }

    // Upcoming: soonest first. Past: newest created first (API order).
    soon.sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

    return { current: active[0] ?? null, upcoming: soon, past: done };
  }, [bookings]);

  const seatStatus = normalizeSeatStatus(seat.status);
  const seatStatusMeta =
    seatStatus === "AVAILABLE"
      ? { label: "Available", className: "sdpSeatAvailable" }
      : seatStatus === "OCCUPIED"
        ? { label: "Occupied", className: "sdpSeatOccupied" }
        : { label: "Maintenance", className: "sdpSeatMaintenance" };

  const handleWalkInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkIn.name.trim()) {
      toast.error("Guest name is required");
      return;
    }
    setCreatingLead(true);
    try {
      // CreateLeadInput requires a valid email; when the guest has none we
      // synthesize a placeholder so the lead can still be captured.
      const email =
        walkIn.email.trim() || `walkin.${Date.now()}@guest.local`;

      // NOTE: enum-typed fields travel by their GraphQL NAMES (WALK_IN / NEW),
      // not their display values ("Walk-in" / "New") — the latter fail
      // variable coercion against the LeadSource/LeadStatus enums.
      await createLead({
        variables: {
          input: {
            name: walkIn.name.trim(),
            email,
            ...(walkIn.phone.trim() ? { phone: walkIn.phone.trim() } : {}),
            source: "WALK_IN",
            status: "NEW",
            ...(centerId ? { centerId } : {}),
          },
        },
      });

      toast.success("Walk-in lead created — booking seat");
      setWalkIn({ name: "", phone: "", email: "" });
      setShowWalkIn(false);
      onBookSeat(seat.id, seat.name);
    } catch (err) {
      toast.error(
        `Failed to create walk-in lead: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    } finally {
      setCreatingLead(false);
    }
  };

  const list = tab === "upcoming" ? upcoming : past;

  return (
    <aside className={styles.sdpPanel} aria-label={`Seat details: ${seat.name}`}>
      {/* Header — name, type badge, status badge, close */}
      <div className={styles.sdpHeader}>
        <div className={styles.sdpHeaderTop}>
          <div className={styles.sdpHeaderText}>
            <h2 className={styles.sdpTitle} title={seat.name}>{seat.name}</h2>
            <span className={styles.sdpTypeBadge}>{seatTypeLabel(seat.seatType)}</span>
          </div>
          <button
            type="button"
            className={styles.sdpCloseBtn}
            onClick={onClose}
            aria-label="Close seat details"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <span className={`${styles.sdpBadge} ${styles[seatStatusMeta.className]}`}>
          <span className={styles.sdpBadgeDot} />
          {seatStatusMeta.label}
        </span>
      </div>

      {/* Current booking */}
      <div className={styles.sdpSection}>
        <span className={styles.sdpSectionTitle}>Current Booking</span>
        {current ? (
          <div className={`${styles.sdpCard} ${styles.sdpCardActive}`}>
            <div className={styles.sdpCardRow}>
              <span className={styles.sdpCardName}>{bookingName(current)}</span>
              <BookingStatusBadge status={current.status} />
            </div>
            <span className={styles.sdpCardDates}>{dateRange(current.startDate, current.endDate)}</span>
            <span className={styles.sdpCardPrice}>
              {typeof current.totalPrice === "number"
                ? `₹${current.totalPrice.toLocaleString("en-IN")}`
                : typeof seat.price === "number"
                  ? `₹${seat.price.toLocaleString("en-IN")}/month`
                  : ""}
            </span>
          </div>
        ) : (
          <div className={styles.sdpCard}>
            <span className={styles.sdpCardEmpty}>
              {seatStatus === "MAINTENANCE"
                ? "No active booking — seat under maintenance"
                : "Available now"}
            </span>
          </div>
        )}
      </div>

      {/* Booking history */}
      <div className={styles.sdpSection}>
        <span className={styles.sdpSectionTitle}>Booking History</span>
        <div className={styles.sdpTabs}>
          <button
            type="button"
            className={`${styles.sdpTab} ${tab === "upcoming" ? styles.sdpTabActive : ""}`}
            onClick={() => setTab("upcoming")}
          >
            Upcoming ({upcoming.length})
          </button>
          <button
            type="button"
            className={`${styles.sdpTab} ${tab === "past" ? styles.sdpTabActive : ""}`}
            onClick={() => setTab("past")}
          >
            Past ({past.length})
          </button>
        </div>

        {bookingsLoading && bookings.length === 0 ? (
          <div className={styles.sdpEmpty}>Loading bookings…</div>
        ) : list.length === 0 ? (
          <div className={styles.sdpEmpty}>
            {tab === "upcoming" ? "No upcoming bookings" : "No booking history"}
          </div>
        ) : (
          <div className={styles.sdpList}>
            {list.map((b: any) => (
              <div key={b.id} className={styles.sdpCard}>
                <div className={styles.sdpCardRow}>
                  <span className={styles.sdpCardName}>{bookingName(b)}</span>
                  {tab === "past" && <BookingStatusBadge status={b.status} />}
                </div>
                <span className={styles.sdpCardDates}>{dateRange(b.startDate, b.endDate)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className={styles.sdpActions}>
        <button
          type="button"
          className={styles.sdpBookBtn}
          onClick={() => onBookSeat(seat.id, seat.name)}
        >
          Book This Seat
        </button>
        <button
          type="button"
          className={styles.sdpWalkInBtn}
          onClick={() => setShowWalkIn((v) => !v)}
        >
          Walk-in Guest
        </button>
      </div>

      {/* Walk-in mini form */}
      {showWalkIn && (
        <form className={styles.sdpWalkInForm} onSubmit={handleWalkInSubmit}>
          <div className={styles.sdpField}>
            <label htmlFor={`sdp-walkin-name-${seat.id}`}>Guest Name *</label>
            <input
              id={`sdp-walkin-name-${seat.id}`}
              type="text"
              placeholder="Guest name"
              value={walkIn.name}
              onChange={(e) => setWalkIn((f) => ({ ...f, name: e.target.value }))}
              autoFocus
            />
          </div>
          <div className={styles.sdpField}>
            <label htmlFor={`sdp-walkin-phone-${seat.id}`}>Phone</label>
            <input
              id={`sdp-walkin-phone-${seat.id}`}
              type="tel"
              placeholder="Phone number"
              value={walkIn.phone}
              onChange={(e) => setWalkIn((f) => ({ ...f, phone: e.target.value }))}
            />
          </div>
          <div className={styles.sdpField}>
            <label htmlFor={`sdp-walkin-email-${seat.id}`}>Email (optional)</label>
            <input
              id={`sdp-walkin-email-${seat.id}`}
              type="email"
              placeholder="guest@example.com"
              value={walkIn.email}
              onChange={(e) => setWalkIn((f) => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div className={styles.sdpWalkInFormActions}>
            <button
              type="button"
              className={styles.sdpWalkInCancel}
              onClick={() => setShowWalkIn(false)}
              disabled={creatingLead}
            >
              Cancel
            </button>
            <button type="submit" className={styles.sdpWalkInSubmit} disabled={creatingLead}>
              {creatingLead ? "Creating…" : "Create Lead & Book"}
            </button>
          </div>
        </form>
      )}
    </aside>
  );
}
