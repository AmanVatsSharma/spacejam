"use client";

/**
 * File:        apps/web/src/app/dashboard/operations/recurring-bookings/page.tsx
 * Module:      Web · Dashboard · Operations · Recurring Bookings
 * Purpose:     Management page for recurring room bookings — list, expand,
 *              and cancel recurring bookings with a stats overview.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-21
 */

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useRecurringBookings, useRecurringBookingMutations } from "@/hooks/use-enterprise";
import { RecurringBookingModal } from "./recurring-booking-modal";
import { QueryLoading, QueryError, QueryEmpty } from "@/components/ui/query-status";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import styles from "./recurring-bookings.module.css";

/* --------------- Helpers --------------- */

const PATTERN_LABEL: Record<string, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatSchedule(daysOfWeek: number[] | null | undefined, pattern: string): string {
  if (!daysOfWeek || daysOfWeek.length === 0 || pattern === "DAILY" || pattern === "MONTHLY") {
    return PATTERN_LABEL[pattern] ?? pattern;
  }
  return daysOfWeek.map((d) => DAY_NAMES[d] ?? d).join(", ");
}

function formatDateRange(startDate: string, endDate: string): string {
  const fmt = (d: string) => {
    const date = new Date(d + "T00:00:00");
    if (isNaN(date.getTime())) return d;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };
  return `${fmt(startDate)} – ${fmt(endDate)}`;
}

/* --------------- Icons --------------- */

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const ExpandIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M1 5V3a2 2 0 012-2h2M13 9v2a2 2 0 01-2 2h-2M13 1L9 5M1 13l4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CancelIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

/* --------------- Page --------------- */

export default function RecurringBookingsPage() {
  const [showModal, setShowModal] = useState(false);
  const [cancelId, setCancelId] = useState<string | null>(null);

  const { bookings, loading, error, refetch } = useRecurringBookings();
  const { expand, cancel, expanding, cancelling } = useRecurringBookingMutations();

  const hasBookings = bookings.length > 0;

  /* Stats */
  const totalRecurring = bookings.length;
  const activeThisWeek = useMemo(
    () => bookings.filter((b: any) => b.active).length,
    [bookings],
  );
  const roomsCovered = useMemo(
    () => new Set(bookings.map((b: any) => b.roomId)).size,
    [bookings],
  );

  /* Actions */
  const handleExpand = async (id: string) => {
    try {
      const result = await expand(id);
      toast.success(`Expanded ${result?.length ?? 0} occurrences`);
      void refetch();
    } catch (err) {
      toast.error(`Failed to expand: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const handleCancelClick = (id: string) => {
    setCancelId(id);
  };

  const handleCancelConfirm = async () => {
    if (!cancelId) return;
    try {
      await cancel(cancelId);
      toast.success("Recurring booking cancelled");
      void refetch();
    } catch (err) {
      toast.error(`Failed to cancel: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setCancelId(null);
    }
  };

  const cancelBooking = bookings.find((b: any) => b.id === cancelId);

  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.heroCard}>
        <div className={styles.heroLeft}>
          <h1 className={styles.heroTitle}>Recurring Bookings</h1>
          <p className={styles.heroSubtitle}>Manage room bookings that repeat on a schedule.</p>
        </div>
        <button
          type="button"
          className={styles.heroAction}
          onClick={() => setShowModal(true)}
        >
          <PlusIcon />
          <span>New Recurring Booking</span>
        </button>
      </section>

      {/* Stats row */}
      {!loading && !error && hasBookings && (
        <section className={styles.statsRow}>
          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <span className={styles.statIconWrap}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 2H12M2 5H12M2 8H8" stroke="#FF6A2F" strokeWidth="1.5" />
                </svg>
              </span>
              <span className={styles.statLabel}>Total Recurring</span>
            </div>
            <div className={styles.statValue}>{totalRecurring}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <span className={styles.statIconWrap}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="5" stroke="#10B981" strokeWidth="1.5" />
                  <path d="M7 4V7L9 9" stroke="#10B981" strokeWidth="1.5" />
                </svg>
              </span>
              <span className={styles.statLabel}>Active This Week</span>
            </div>
            <div className={styles.statValue}>{activeThisWeek}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <span className={styles.statIconWrap}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 7L6 10L11 4" stroke="#8B5CF6" strokeWidth="1.5" />
                </svg>
              </span>
              <span className={styles.statLabel}>Rooms Covered</span>
            </div>
            <div className={styles.statValue}>{roomsCovered}</div>
          </div>
        </section>
      )}

      {/* Table */}
      <section className={styles.tableCard}>
        <div className={styles.tableWrap}>
          {loading && !hasBookings && <QueryLoading message="Loading recurring bookings..." />}
          {error && !hasBookings && (
            <QueryError message={error.message ?? "Failed to load recurring bookings"} onRetry={refetch} />
          )}
          {!loading && !error && !hasBookings && (
            <div className={styles.tableEmpty}>
              <div className={styles.tableEmptyIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
                </svg>
              </div>
              <p className={styles.tableEmptyTitle}>No recurring bookings</p>
              <p className={styles.tableEmptyHint}>
                Create a recurring booking to automatically reserve rooms on a schedule.
              </p>
            </div>
          )}
          {hasBookings && (
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Room</th>
                  <th>Pattern</th>
                  <th>Schedule</th>
                  <th>Date Range</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b: any) => (
                  <tr key={b.id}>
                    <td className={styles.titleCell}>{b.title || "Untitled"}</td>
                    <td className={styles.roomCell}>{b.room?.name ?? "—"}</td>
                    <td>
                      <span
                        className={`${styles.patternBadge} ${
                          b.pattern === "DAILY"
                            ? styles.patternDaily
                            : b.pattern === "WEEKLY"
                              ? styles.patternWeekly
                              : styles.patternMonthly
                        }`}
                      >
                        {PATTERN_LABEL[b.pattern] ?? b.pattern}
                      </span>
                    </td>
                    <td className={styles.scheduleText}>{formatSchedule(b.daysOfWeek, b.pattern)}</td>
                    <td className={styles.dateRangeText}>{formatDateRange(b.startDate, b.endDate)}</td>
                    <td>
                      <span
                        className={`${styles.statusPill} ${
                          b.active ? styles.statusActive : styles.statusCancelled
                        }`}
                      >
                        {b.active ? "Active" : "Cancelled"}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionsCell}>
                        <button
                          type="button"
                          className={`${styles.btnExpand} ${(expanding || cancelling) ? styles.btnLoading : ""}`}
                          onClick={() => handleExpand(b.id)}
                          disabled={expanding || cancelling || !b.active}
                          title="Expand into individual events"
                        >
                          <ExpandIcon />
                          Expand
                        </button>
                        {b.active && (
                          <button
                            type="button"
                            className={`${styles.btnCancel} ${(expanding || cancelling) ? styles.btnLoading : ""}`}
                            onClick={() => handleCancelClick(b.id)}
                            disabled={expanding || cancelling}
                            title="Cancel this recurring booking"
                          >
                            <CancelIcon />
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Modal */}
      <RecurringBookingModal open={showModal} onClose={() => setShowModal(false)} />

      {/* Cancel confirmation */}
      <ConfirmDialog
        open={!!cancelId}
        title="Cancel Recurring Booking"
        description={
          cancelBooking
            ? `Are you sure you want to cancel "${cancelBooking.title}"? This will stop all future occurrences.`
            : "Are you sure you want to cancel this recurring booking?"
        }
        confirmLabel="Cancel Booking"
        cancelLabel="Keep It"
        variant="danger"
        onConfirm={handleCancelConfirm}
        onCancel={() => setCancelId(null)}
      />
    </div>
  );
}
