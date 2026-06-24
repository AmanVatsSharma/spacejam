/**
 * File:        apps/web/src/app/dashboard/meeting-room/request/page.tsx
 * Module:      Web · Dashboard · Meeting Room · Request & Registration
 * Purpose:     Manage inbound meeting room booking requests and approvals.
 *              Pixel-perfect match to Figma SpaceJam-VB node 0-12998.
 *              Header + filter bar (search, status tabs with counts,
 *              "All Requests" + "Meeting Room" dropdowns) followed by a
 *              two-column body: a Total Request stats card on the left
 *              and a paginated Recent Activities table on the right.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-24
 */

"use client";

import { useMemo, useState } from "react";
import styles from "./request.module.css";

type RequestStatus = "approved" | "pending" | "rejected" | "completed";

interface RoomRequest {
  id: string;
  user: { name: string; email: string };
  room: string;
  date: string;
  time: string;
  purpose: string;
  status: RequestStatus;
}

const REQUESTS: RoomRequest[] = [
  {
    id: "REQ-001",
    user: { name: "Priya Sharma", email: "priya.s@techcorp.in" },
    room: "Room A · 8 seats",
    date: "Apr 25, 2026",
    time: "09:00 AM",
    purpose: "Quarterly product planning",
    status: "approved",
  },
  {
    id: "REQ-002",
    user: { name: "Rahul Verma", email: "rahul@startupxyz.io" },
    room: "Room B · 6 seats",
    date: "Apr 25, 2026",
    time: "11:30 AM",
    purpose: "Client onboarding session",
    status: "pending",
  },
  {
    id: "REQ-003",
    user: { name: "Ananya Iyer", email: "ananya@creative.studio" },
    room: "Conference Hall · 12 seats",
    date: "Apr 26, 2026",
    time: "02:00 PM",
    purpose: "Design sprint workshop",
    status: "approved",
  },
  {
    id: "REQ-004",
    user: { name: "Vikram Singh", email: "vikram@venturecap.vc" },
    room: "Room C · 5 seats",
    date: "Apr 27, 2026",
    time: "04:30 PM",
    purpose: "Series A pitch rehearsal",
    status: "pending",
  },
  {
    id: "REQ-005",
    user: { name: "Meera Nair", email: "meera@fintech.co.in" },
    room: "Room A · 8 seats",
    date: "Apr 28, 2026",
    time: "10:00 AM",
    purpose: "Quarterly board review",
    status: "completed",
  },
  {
    id: "REQ-006",
    user: { name: "Arjun Kapoor", email: "arjun@innovateco.in" },
    room: "Conference Hall · 25 seats",
    date: "Apr 29, 2026",
    time: "03:00 PM",
    purpose: "Team off-site planning",
    status: "rejected",
  },
  {
    id: "REQ-007",
    user: { name: "Sara Khan", email: "sara.khan@brightlabs.ai" },
    room: "Room B · 6 seats",
    date: "Apr 30, 2026",
    time: "11:00 AM",
    purpose: "AI ethics roundtable",
    status: "approved",
  },
];

const STATUS_TABS: { id: "all" | RequestStatus; label: string }[] = [
  { id: "all", label: "All Requests" },
  { id: "approved", label: "Approved" },
  { id: "pending", label: "Pending" },
  { id: "rejected", label: "Rejected" },
  { id: "completed", label: "Completed" },
];

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function MeetingRoomRequestPage() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] =
    useState<(typeof STATUS_TABS)[number]["id"]>("all");
  const [requestType, setRequestType] = useState("All Requests");
  const [roomFilter, setRoomFilter] = useState("Meeting Room");

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: REQUESTS.length };
    for (const r of REQUESTS) counts[r.status] = (counts[r.status] ?? 0) + 1;
    return counts;
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return REQUESTS.filter((r) => {
      if (activeTab !== "all" && r.status !== activeTab) return false;
      if (!q) return true;
      return (
        r.id.toLowerCase().includes(q) ||
        r.user.name.toLowerCase().includes(q) ||
        r.user.email.toLowerCase().includes(q) ||
        r.room.toLowerCase().includes(q) ||
        r.purpose.toLowerCase().includes(q)
      );
    });
  }, [query, activeTab]);

  return (
    <div className={styles.page}>
      {/* Page header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Request &amp; Registration</h1>
        <p className={styles.subtitle}>
          Review, approve, and track every meeting room booking request in one place.
        </p>
      </div>

      {/* Filter bar */}
      <div className={styles.filterBar}>
        <div className={styles.searchInput}>
          <svg
            className={styles.searchIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            className={styles.searchField}
            placeholder="Search by ID, user, room, or purpose"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search requests"
          />
        </div>

        <div className={styles.tabGroup} role="tablist">
          {STATUS_TABS.map((t) => {
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                className={`${styles.tab} ${active ? styles.tabActive : ""}`}
                onClick={() => setActiveTab(t.id)}
              >
                {t.label}
                <span className={styles.tabCount}>{tabCounts[t.id] ?? 0}</span>
              </button>
            );
          })}
        </div>

        <div className={styles.selectWrap}>
          <select
            className={styles.select}
            value={requestType}
            onChange={(e) => setRequestType(e.target.value)}
            aria-label="Request type"
          >
            <option>All Requests</option>
            <option>My Requests</option>
            <option>Department Requests</option>
          </select>
          <svg
            className={styles.selectIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>

        <div className={styles.selectWrap}>
          <select
            className={styles.select}
            value={roomFilter}
            onChange={(e) => setRoomFilter(e.target.value)}
            aria-label="Room filter"
          >
            <option>Meeting Room</option>
            <option>Conference Hall</option>
            <option>Phone Booth</option>
            <option>All Rooms</option>
          </select>
          <svg
            className={styles.selectIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </div>

      {/* Body: stats + table */}
      <div className={styles.body}>
        {/* Stats card */}
        <aside className={styles.statsCard} aria-label="Total requests">
          <div className={styles.statsHead}>
            <h3 className={styles.statsTitle}>Total Request</h3>
            <svg
              className={styles.statsDots}
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
            >
              <circle cx="5" cy="12" r="1.6" />
              <circle cx="12" cy="12" r="1.6" />
              <circle cx="19" cy="12" r="1.6" />
            </svg>
          </div>
          <div className={styles.statsValue}>
            <span className={styles.statsNumber}>847</span>
            <span className={styles.statsChange}>+12.4%</span>
          </div>
          <p style={{ margin: 0, fontSize: 12, color: "#6A7282", lineHeight: 1.5 }}>
            Compared to <strong style={{ color: "#101828" }}>753</strong> last month
            across all meeting spaces.
          </p>
          <div className={styles.statsMeta}>
            <span>Updated just now</span>
            <button type="button" className={styles.viewAll}>
              View All
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="m9 6 6 6-6 6" />
              </svg>
            </button>
          </div>
        </aside>

        {/* Table card */}
        <section className={styles.tableCard} aria-label="Recent activities">
          <div className={styles.tableHead}>
            <div>
              <h2 className={styles.tableTitle}>Recent Activities</h2>
              <p className={styles.tableSub}>
                Showing {filtered.length} of {REQUESTS.length} requests
              </p>
            </div>
            <div className={styles.selectWrap}>
              <select
                className={styles.select}
                defaultValue="Last 7 days"
                aria-label="Date range"
              >
                <option>Today</option>
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>This quarter</option>
              </select>
              <svg
                className={styles.selectIcon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
          </div>

          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead className={styles.thead}>
                <tr>
                  <th>ID</th>
                  <th>User</th>
                  <th>Room</th>
                  <th>Date &amp; Time</th>
                  <th>Purpose</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody className={styles.tbody}>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "32px 16px", color: "#6A7282" }}>
                      No requests match the current filters.
                    </td>
                  </tr>
                )}
                {filtered.map((r) => (
                  <tr key={r.id}>
                    <td className={styles.idCell}>{r.id}</td>
                    <td>
                      <div className={styles.userCell}>
                        <span className={styles.avatar}>{initials(r.user.name)}</span>
                        <span className={styles.userMeta}>
                          <span className={styles.userName}>{r.user.name}</span>
                          <span className={styles.userEmail}>{r.user.email}</span>
                        </span>
                      </div>
                    </td>
                    <td>{r.room}</td>
                    <td className={styles.dateCell}>
                      {r.date}
                      <span className={styles.dateSub}>{r.time}</span>
                    </td>
                    <td className={styles.purposeCell}>{r.purpose}</td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                    <td className={styles.actionCell}>
                      <button
                        type="button"
                        className={`${styles.iconBtn} ${styles.iconBtnPrimary}`}
                        aria-label={`Approve ${r.id}`}
                        title="Approve"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className={styles.iconBtn}
                        aria-label={`Reject ${r.id}`}
                        title="Reject"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <path d="M18 6 6 18M6 6l12 12" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className={styles.iconBtn}
                        aria-label={`More options for ${r.id}`}
                        title="More"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                          <circle cx="5" cy="12" r="1.6" />
                          <circle cx="12" cy="12" r="1.6" />
                          <circle cx="19" cy="12" r="1.6" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.tableFoot}>
            <span>Showing 1–{filtered.length} of {REQUESTS.length}</span>
            <div className={styles.pager}>
              <button type="button" className={styles.pagerBtn} aria-label="Previous page">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="m15 6-6 6 6 6" />
                </svg>
              </button>
              <button type="button" className={`${styles.pagerBtn} ${styles.pagerBtnActive}`}>1</button>
              <button type="button" className={styles.pagerBtn}>2</button>
              <button type="button" className={styles.pagerBtn}>3</button>
              <button type="button" className={styles.pagerBtn} aria-label="Next page">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="m9 6 6 6-6 6" />
                </svg>
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

/* ---------------- Status badge ---------------- */

function StatusBadge({ status }: { status: RequestStatus }) {
  const label = status[0].toUpperCase() + status.slice(1);
  const cls =
    status === "approved"
      ? styles.statusApproved
      : status === "pending"
      ? styles.statusPending
      : status === "rejected"
      ? styles.statusRejected
      : styles.statusCompleted;
  return (
    <span className={`${styles.statusBadge} ${cls}`}>
      <span className={styles.statusDot} />
      {label}
    </span>
  );
}
