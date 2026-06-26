/**
 * File:        apps/web/src/app/dashboard/operations/request/page.tsx
 * Module:      Web · Dashboard · Meeting Room · Request & Registration
 * Purpose:     Manage all types of requests (events, printers, upgrades, services).
 *              Pixel-perfect match to Figma SpaceJam-VB node 0-12998.
 *              Layout: two stat cards (Total Requests + Recent Activities),
 *              search bar + filter dropdowns, followed by a full-width table
 *              with Request Type | Requested By | Details | Date | Status | Action.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-26
 */

"use client";

import { useMemo, useState } from "react";
import styles from "./request.module.css";

type RequestStatus = "Pending" | "Approved" | "Rejected";
type RequestType = "Events" | "Printer" | "Upgrade" | "Services";

interface RoomRequest {
  id: string;
  requestType: RequestType;
  requestedBy: string;
  details: string;
  date: string;
  status: RequestStatus;
}

interface ActivityItem {
  icon: "payment" | "printer" | "event";
  title: string;
  description: string;
}

const REQUESTS: RoomRequest[] = [
  {
    id: "REQ-001",
    requestType: "Events",
    requestedBy: "Sarah Chen",
    details: "Conference room booking for team meeting",
    date: "24-04-2026",
    status: "Pending",
  },
  {
    id: "REQ-002",
    requestType: "Printer",
    requestedBy: "Mike Johnson",
    details: "Color printer access request",
    date: "21-04-2026",
    status: "Approved",
  },
  {
    id: "REQ-003",
    requestType: "Upgrade",
    requestedBy: "Emily Rodriguez",
    details: "Upgrade to premium desk space",
    date: "22-04-2026",
    status: "Pending",
  },
  {
    id: "REQ-004",
    requestType: "Services",
    requestedBy: "David Kim",
    details: "IT support for network setup",
    date: "20-04-2026",
    status: "Approved",
  },
  {
    id: "REQ-005",
    requestType: "Events",
    requestedBy: "Lisa Wang",
    details: "Workshop space for Friday afternoon",
    date: "23-04-2026",
    status: "Rejected",
  },
  {
    id: "REQ-006",
    requestType: "Printer",
    requestedBy: "James Taylor",
    details: "Bulk printing for marketing materials",
    date: "20-04-2026",
    status: "Pending",
  },
  {
    id: "REQ-007",
    requestType: "Upgrade",
    requestedBy: "Anna Martinez",
    details: "Additional storage locker request",
    date: "19-04-2026",
    status: "Approved",
  },
  {
    id: "REQ-008",
    requestType: "Services",
    requestedBy: "Tom Anderson",
    details: "Mail handling service setup",
    date: "18-04-2026",
    status: "Pending",
  },
];

const ACTIVITIES: ActivityItem[] = [
  {
    icon: "payment",
    title: "Payment Failed",
    description: "Invoice #INV-1021 (₹4,200)",
  },
  {
    icon: "printer",
    title: "Printer Booked Today",
    description: "Patel Enterprises printer bo...",
  },
  {
    icon: "printer",
    title: "Printer Booked Today",
    description: "Patel Enterprises printer bo...",
  },
];

function ActivityIcon({ type }: { type: ActivityItem["icon"] }) {
  if (type === "payment") {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
        <rect width="20" height="20" rx="4" fill="rgba(255,120,71,0.1)" />
        <path
          d="M10 4C7.24 4 5 6.24 5 9s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 8.5c-1.93 0-3.5-1.57-3.5-3.5S8.07 5.5 10 5.5s3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"
          fill="#FF7847"
        />
      </svg>
    );
  }
  if (type === "printer") {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
        <rect width="20" height="20" rx="4" fill="rgba(255,120,71,0.1)" />
        <path
          d="M14 5h-1V3a1 1 0 00-1-1H7a1 1 0 00-1 1v2H5a1 1 0 00-1 1v7a1 1 0 001 1h1v1a1 1 0 001 1h6a1 1 0 001-1v-1h1a1 1 0 001-1V6a1 1 0 00-1-1zm-7 6H7V8h5v3zm2-5H7V4h2v2zm4 5h-2v-3h2v3z"
          fill="#FF7847"
        />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <rect width="20" height="20" rx="4" fill="rgba(255,120,71,0.1)" />
      <path
        d="M10 4a6 6 0 100 12 6 6 0 000-12zm0 10a4 4 0 110-8 4 4 0 010 8z"
        fill="#FF7847"
      />
    </svg>
  );
}

function StatusBadge({ status }: { status: RequestStatus }) {
  return (
    <span className={`${styles.statusBadge} ${styles[`status${status}`]}`}>
      {status}
      <svg
        className={styles.statusIcon}
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        aria-hidden
      >
        <path
          d="M4.5 7L6 8.5L8.5 5.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export default function MeetingRoomRequestPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"All Categories" | RequestType>(
    "All Categories"
  );
  const [statusFilter, setStatusFilter] = useState<"All Statuses" | RequestStatus>(
    "All Statuses"
  );
  const [showOnlyPending, setShowOnlyPending] = useState(false);
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return REQUESTS.filter((r) => {
      if (showOnlyPending && r.status !== "Pending") return false;
      if (categoryFilter !== "All Categories" && r.requestType !== categoryFilter) {
        return false;
      }
      if (statusFilter !== "All Statuses" && r.status !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          r.requestType.toLowerCase().includes(q) ||
          r.requestedBy.toLowerCase().includes(q) ||
          r.details.toLowerCase().includes(q) ||
          r.date.toLowerCase().includes(q) ||
          r.status.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [searchQuery, categoryFilter, statusFilter, showOnlyPending]);

  const pendingCount = REQUESTS.filter((r) => r.status === "Pending").length;
  const totalCount = REQUESTS.length;

  const handleClearAll = () => {
    setSearchQuery("");
    setCategoryFilter("All Categories");
    setStatusFilter("All Statuses");
    setShowOnlyPending(false);
  };

  const handleAction = (requestId: string, action: "Approve" | "Reject" | "Delete") => {
    console.log(`${action} ${requestId}`);
    setOpenActionMenu(null);
  };

  return (
    <div className={styles.page}>
      {/* Two stat cards row */}
      <div className={styles.statCardsRow}>
        {/* Total Requests card */}
        <div className={styles.statCard}>
          <div className={styles.statCardHeader}>
            <span className={styles.statCardLabel}>Total Requests</span>
            <span className={styles.statCardCount}>{totalCount}</span>
          </div>
          <div className={styles.statCardRow}>
            <span className={styles.statCardSub}>Pending Approvals</span>
            <span className={styles.statCardCount}>{pendingCount}</span>
          </div>
          <button
            type="button"
            className={styles.viewPendingButton}
            onClick={() => {
              setShowOnlyPending(true);
              setStatusFilter("All Statuses");
              setCategoryFilter("All Categories");
              setSearchQuery("");
            }}
          >
            View Pending
          </button>
        </div>

        {/* Recent Activities card */}
        <div className={styles.statCard}>
          <div className={styles.statCardHeader}>
            <span className={styles.statCardLabel}>Recent Activities</span>
          </div>
          <div className={styles.activityList}>
            {ACTIVITIES.map((activity, idx) => (
              <div key={idx} className={styles.activityItem}>
                <ActivityIcon type={activity.icon} />
                <div className={styles.activityText}>
                  <span className={styles.activityTitle}>{activity.title}</span>
                  <span className={styles.activityDesc}>{activity.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className={styles.searchBar}>
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
          type="text"
          className={styles.searchInput}
          placeholder="Search Requests.."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search requests"
        />
      </div>

      {/* Filter dropdowns */}
      <div className={styles.filterRow}>
        <div className={styles.selectWrap}>
          <select
            className={styles.select}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            aria-label="Filter by category"
          >
            <option>All Categories</option>
            <option>Events</option>
            <option>Printer</option>
            <option>Upgrade</option>
            <option>Services</option>
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            aria-label="Filter by status"
          >
            <option>All Statuses</option>
            <option>Pending</option>
            <option>Approved</option>
            <option>Rejected</option>
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

        <button
          type="button"
          className={styles.clearButton}
          onClick={handleClearAll}
          aria-label="Clear all filters"
        >
          Clear All
        </button>
      </div>

      {/* Main table card */}
      <div className={styles.tableCard}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr>
                <th>Request Type</th>
                <th>Requested By</th>
                <th>Details</th>
                <th>Date</th>
                <th>Status</th>
                <th>Action</th>
                <th>
                  <input type="checkbox" className={styles.checkbox} aria-label="Select all" />
                </th>
              </tr>
            </thead>
            <tbody className={styles.tbody}>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className={styles.emptyState}>
                    No requests match the current filters.
                  </td>
                </tr>
              )}
              {filtered.map((request) => (
                <tr key={request.id} className={styles.tableRow}>
                  <td className={styles.cellType}>{request.requestType}</td>
                  <td className={styles.cellRequestedBy}>{request.requestedBy}</td>
                  <td className={styles.cellDetails}>{request.details}</td>
                  <td className={styles.cellDate}>{request.date}</td>
                  <td>
                    <StatusBadge status={request.status} />
                  </td>
                  <td className={styles.actionCell}>
                    <button
                      type="button"
                      className={styles.actionButton}
                      onClick={() =>
                        setOpenActionMenu(openActionMenu === request.id ? null : request.id)
                      }
                      aria-label={`Actions for ${request.id}`}
                      aria-expanded={openActionMenu === request.id}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        aria-hidden
                      >
                        <circle cx="10" cy="3.5" r="1.5" fill="currentColor" />
                        <circle cx="10" cy="10" r="1.5" fill="currentColor" />
                        <circle cx="10" cy="16.5" r="1.5" fill="currentColor" />
                      </svg>
                    </button>

                    {openActionMenu === request.id && (
                      <div className={styles.actionMenu}>
                        <button
                          type="button"
                          className={styles.actionMenuItem}
                          onClick={() => handleAction(request.id, "Approve")}
                        >
                          Approve
                        </button>
                        <div className={styles.actionMenuDivider} />
                        <button
                          type="button"
                          className={styles.actionMenuItem}
                          onClick={() => handleAction(request.id, "Reject")}
                        >
                          Reject
                        </button>
                        <div className={styles.actionMenuDivider} />
                        <button
                          type="button"
                          className={styles.actionMenuItem}
                          onClick={() => handleAction(request.id, "Delete")}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      className={styles.checkbox}
                      aria-label={`Select ${request.id}`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
