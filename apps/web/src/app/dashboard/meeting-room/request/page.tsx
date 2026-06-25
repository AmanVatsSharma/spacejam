/**
 * File:        apps/web/src/app/dashboard/meeting-room/request/page.tsx
 * Module:      Web · Dashboard · Meeting Room · Request & Registration
 * Purpose:     Manage all types of requests (events, printers, upgrades, services).
 *              Pixel-perfect match to Figma SpaceJam-VB node 0-12998.
 *              Layout: header card (title + subtitle + search bar + filter dropdowns),
 *              followed by a full-width Recent Activities table with columns
 *              Request Type | Requested By | Details | Date | Status | Action.
 *              Action button reveals a dropdown menu with Approve/Reject/Delete.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-25
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

export default function MeetingRoomRequestPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"All Categories" | RequestType>(
    "All Categories"
  );
  const [statusFilter, setStatusFilter] = useState<"All Statuses" | RequestStatus>(
    "All Statuses"
  );
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return REQUESTS.filter((r) => {
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
  }, [searchQuery, categoryFilter, statusFilter]);

  const handleClearAll = () => {
    setSearchQuery("");
    setCategoryFilter("All Categories");
    setStatusFilter("All Statuses");
  };

  const handleAction = (requestId: string, action: "Approve" | "Reject" | "Delete") => {
    console.log(`${action} ${requestId}`);
    setOpenActionMenu(null);
  };

  return (
    <div className={styles.page}>
      {/* Header card with title, subtitle, search, and filters */}
      <div className={styles.headerCard}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Request &amp; Registration</h1>
          <p className={styles.subtitle}>
            Manage requests for events, printers and account upgrades
          </p>
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
            placeholder="Search Requests..."
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
      </div>

      {/* Recent Activities table */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h2 className={styles.tableTitle}>Recent Activities</h2>
        </div>

        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr>
                <th>
                  <input type="checkbox" className={styles.checkbox} aria-label="Select all" />
                </th>
                <th>Request Type</th>
                <th>Requested By</th>
                <th>Details</th>
                <th>Date</th>
                <th>Status</th>
                <th>Action</th>
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
                <tr key={request.id}>
                  <td>
                    <input
                      type="checkbox"
                      className={styles.checkbox}
                      aria-label={`Select ${request.id}`}
                    />
                  </td>
                  <td>{request.requestType}</td>
                  <td>{request.requestedBy}</td>
                  <td>{request.details}</td>
                  <td>{request.date}</td>
                  <td>
                    <span
                      className={`${styles.statusBadge} ${
                        request.status === "Approved"
                          ? styles.statusApproved
                          : request.status === "Pending"
                          ? styles.statusPending
                          : styles.statusRejected
                      }`}
                    >
                      {request.status}
                    </span>
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
                        fill="currentColor"
                        aria-hidden
                      >
                        <circle cx="10" cy="3" r="1.5" />
                        <circle cx="10" cy="10" r="1.5" />
                        <circle cx="10" cy="17" r="1.5" />
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}