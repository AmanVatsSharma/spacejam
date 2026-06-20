/**
 * File:        apps/web/src/app/dashboard/invoices/contracts/page.tsx
 * Module:      Web · Dashboard · Invoices · Contracts
 * Purpose:     Contract Management sub-tab under Revenue > Invoices.
 *              Implements the Figma design (node 0:21788) — header card,
 *              filters bar, four KPI cards, five status tiles, contracts
 *              table, plus a right rail with Client Info, Contract Info,
 *              Documents, and action buttons.
 *
 * Exports:
 *   - default: ContractsPage — contract management view
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-21
 */

"use client";

import { useMemo, useState } from "react";
import styles from "./contracts.module.css";

/* ----------------------------- Types ----------------------------- */

type ContractStatus = "Active" | "Renewal Due" | "Expired" | "Upgraded" | "Terminated";

interface ContractRow {
  id: string;
  name: string;
  company: string;
  source: string;
  plan: string;
  assignedTo: string;
  status: ContractStatus;
  initials: string;
  initialBg: string;
}

interface StatusCount {
  name: ContractStatus;
  count: number;
  cls: string;
}

/* ----------------------------- Data ------------------------------ */

const STATS = [
  { id: "s1", label: "Total Active Contracts", value: "125",       trend: "+12% vs last week", icon: "doc"     },
  { id: "s2", label: "Monthly Revenue",        value: "₹42.5L",    trend: "+8% vs last week",  icon: "rupee"   },
  { id: "s3", label: "Expiring This Months",   value: "18",        trend: "Action Required",   icon: "alert"   },
  { id: "s4", label: "Renewals Completed",     value: "9",         trend: "This Months",       icon: "refresh" },
];

const STATUS_COUNTS: StatusCount[] = [
  { name: "Active",      count: 2, cls: styles.tileActive   },
  { name: "Renewal Due", count: 1, cls: styles.tileRenewal  },
  { name: "Expired",     count: 1, cls: styles.tileExpired  },
  { name: "Upgraded",    count: 1, cls: styles.tileUpgraded },
  { name: "Terminated",  count: 0, cls: styles.tileTerminated },
];

const CONTRACTS: ContractRow[] = [
  { id: "c1", name: "Rahul Sharma", company: "Freelancer",     source: "Website",  plan: "Hot Desk",        assignedTo: "CM Rahul", status: "Active",      initials: "RS", initialBg: "#FF7847" },
  { id: "c2", name: "StartupX",     company: "Startup",        source: "Referral", plan: "Cabin",           assignedTo: "CM Rahul", status: "Renewal Due", initials: "SX", initialBg: "#FBBF24" },
  { id: "c3", name: "Ankit",        company: "Individual",     source: "Walk-in",  plan: "Dedicated Desk",  assignedTo: "CM Rahul", status: "Expired",     initials: "AK", initialBg: "#EF4444" },
  { id: "c4", name: "TechCorp",     company: "Enterprise",     source: "Website",  plan: "Private Office",  assignedTo: "CM Rahul", status: "Upgraded",    initials: "TC", initialBg: "#14B8A6" },
  { id: "c5", name: "Priya Singh",  company: "Freelancer",     source: "Referral", plan: "Hot Desk",        assignedTo: "CM Rahul", status: "Active",      initials: "PS", initialBg: "#FF7847" },
  { id: "c6", name: "Kabir",        company: "Freelancer",     source: "Referral", plan: "Hot Desk",        assignedTo: "CM Rahul", status: "Active",      initials: "KB", initialBg: "#6366F1" },
  { id: "c7", name: "Shashank",     company: "Ux Designer",    source: "Walk In",  plan: "Hot Desk",        assignedTo: "CM Rahul", status: "Renewal Due", initials: "SK", initialBg: "#FBBF24" },
  { id: "c8", name: "Ar. Damae",    company: "Freelancer",     source: "Referral", plan: "Hot Desk",        assignedTo: "CM Rahul", status: "Active",      initials: "AD", initialBg: "#0EA5E9" },
  { id: "c9", name: "Prabhav Singh",company: "Freelancer",     source: "Referral", plan: "Hot Desk",        assignedTo: "CM Rahul", status: "Expired",     initials: "PB", initialBg: "#EF4444" },
];

const STATUS_PILL_CLASS: Record<ContractStatus, string> = {
  "Active":      styles.pillActive,
  "Renewal Due": styles.pillRenewal,
  "Expired":     styles.pillExpired,
  "Upgraded":    styles.pillUpgraded,
  "Terminated":  styles.pillTerminated,
};

/* ----------------------------- Icons ----------------------------- */

const Icon = {
  Search: (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M14 14L11 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  Caret: (
    <svg viewBox="0 0 10 6" fill="none" aria-hidden>
      <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Plus: (
    <svg viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  User: (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 13c0-2.5 2.2-4 5-4s5 1.5 5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  Phone: (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M14 11.4v1.7a1 1 0 0 1-1.1 1 14 14 0 0 1-6.1-2.2 13.7 13.7 0 0 1-4.2-4.2A14 14 0 0 1 .4 1.6 1 1 0 0 1 1.4.5h1.7a1 1 0 0 1 1 .9c.1.7.3 1.3.5 2a1 1 0 0 1-.3 1L3.3 5.6a11.4 11.4 0 0 0 4.2 4.2l1.2-1.2a1 1 0 0 1 1-.3c.7.2 1.3.4 2 .5a1 1 0 0 1 .9 1z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Mail: (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="2" y="3.5" width="12" height="9" rx="1.2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2.5 4.5L8 9l5.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  Building: (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="2.5" y="2" width="11" height="12" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 5h1M5 7.5h1M5 10h1M10 5h1M10 7.5h1M10 10h1M7 14v-3h2v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  Users: (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="6" cy="6" r="2.2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="11" cy="6.5" r="1.7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 13c0-2 1.7-3 4-3s4 1 4 3M10 13c0-1.5 1-2.5 3-2.5s3 1 3 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  Plan: (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="2" y="2.5" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 6h12M5 9.5h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  MapPin: (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M8 14s-5-4.5-5-8.5a5 5 0 1 1 10 0c0 4-5 8.5-5 8.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="8" cy="5.5" r="1.7" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  Calendar: (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 1.5v3M11 1.5v3M2 6.5h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  Cycle: (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M2 6.5a6 6 0 0 1 11-2M14 9.5a6 6 0 0 1-11 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M13 2v3h-3M3 14v-3h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Deposit: (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="2" y="4" width="12" height="9" rx="1.2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="8" cy="8.5" r="1.7" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  Download: (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M8 1.5v9M4.5 7L8 10.5 11.5 7M2.5 13.5h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Refresh: (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M13.5 7.5h-3l1.2-1.2a4.5 4.5 0 1 0 1.3 3.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Ban: (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3.5 3.5l9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  // KPI icons
  Doc: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M14 2v6h6M8 13h8M8 17h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  Rupee: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 3h12M6 8h12M6 13l8 8M6 13h3a5 5 0 0 0 0-10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Alert: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 7v6M12 16.5v.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  Check: (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5.5 8.2l1.8 1.8L11 6.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

function kpiIcon(name: string) {
  switch (name) {
    case "doc":     return Icon.Doc;
    case "rupee":   return Icon.Rupee;
    case "alert":   return Icon.Alert;
    case "refresh": return Icon.Refresh;
    default:        return Icon.Doc;
  }
}

/* --------------------------- Component --------------------------- */

export default function ContractsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ContractStatus>("all");
  const [centerFilter, setCenterFilter] = useState<"all" | string>("all");
  const [assignedFilter, setAssignedFilter] = useState<"all" | string>("all");
  const [selectedId, setSelectedId] = useState<string>("c1");

  const filtered = useMemo(() => {
    return CONTRACTS.filter((c) => {
      const q = search.trim().toLowerCase();
      const matchesQuery =
        q.length === 0 ||
        c.name.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        c.plan.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [search, statusFilter]);

  const selected = useMemo(
    () => CONTRACTS.find((c) => c.id === selectedId) ?? CONTRACTS[0],
    [selectedId],
  );

  return (
    <div className={styles.shell}>
      {/* ----------------------- Main column ----------------------- */}
      <div className={styles.main}>
        {/* Header card */}
        <div className={styles.headerCard}>
          <h1 className={styles.headerTitle}>Contract Management</h1>
          <p className={styles.headerSub}>
            Track potential clients, manage inquiries, and convert them into customers.
          </p>
        </div>

        {/* Filters bar */}
        <div className={styles.filtersBar}>
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}>{Icon.Search}</span>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search contracts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className={styles.filtersRight}>
            <div className={styles.select}>
              <button
                type="button"
                className={styles.selectBtn}
                onClick={() => {
                  const order: ("all" | ContractStatus)[] = ["all", "Active", "Renewal Due", "Expired", "Upgraded", "Terminated"];
                  const i = order.indexOf(statusFilter);
                  setStatusFilter(order[(i + 1) % order.length]);
                }}
              >
                {statusFilter === "all" ? "All status" : statusFilter}
                <span className={styles.selectCaret}>{Icon.Caret}</span>
              </button>
            </div>
            <div className={styles.select}>
              <button
                type="button"
                className={styles.selectBtn}
                onClick={() =>
                  setCenterFilter((p) =>
                    p === "all"
                      ? "Koramangala"
                      : p === "Koramangala"
                        ? "Andheri"
                        : p === "Andheri"
                          ? "Powai"
                          : "all",
                  )
                }
              >
                {centerFilter === "all" ? "All centers" : centerFilter}
                <span className={styles.selectCaret}>{Icon.Caret}</span>
              </button>
            </div>
            <div className={styles.select}>
              <button
                type="button"
                className={styles.selectBtn}
                onClick={() =>
                  setAssignedFilter((p) => (p === "all" ? "CM Rahul" : "all"))
                }
              >
                {assignedFilter === "all" ? "All assigned" : assignedFilter}
                <span className={styles.selectCaret}>{Icon.Caret}</span>
              </button>
            </div>
            <button
              type="button"
              className={styles.clearBtn}
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setCenterFilter("all");
                setAssignedFilter("all");
              }}
            >
              Clear Filters
            </button>
            <button type="button" className={styles.addBtn}>
              {Icon.Plus}
              Add Lead
            </button>
          </div>
        </div>

        {/* KPI cards */}
        <div className={styles.statsGrid}>
          {STATS.map((s) => (
            <div key={s.id} className={styles.statCard}>
              <div className={styles.statIconWrap}>{kpiIcon(s.icon)}</div>
              <h3 className={styles.statValue}>{s.value}</h3>
              <p className={styles.statLabel}>{s.label}</p>
              <p className={styles.statTrend}>{s.trend}</p>
            </div>
          ))}
        </div>

        {/* Status tiles */}
        <div className={styles.statusStrip}>
          {STATUS_COUNTS.map((s) => (
            <div key={s.name} className={`${styles.statusTile} ${s.cls}`}>
              <h4>{s.name}</h4>
              <p>{s.count}</p>
            </div>
          ))}
        </div>

        {/* Contracts table */}
        <div className={styles.tableCard}>
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.leadNameCol}>Lead Name</th>
                  <th>Company</th>
                  <th>Source</th>
                  <th>Interested Plan</th>
                  <th>Assigned To</th>
                  <th>Status</th>
                  <th className={styles.actionCol}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={c.id === selectedId ? styles.selectedRow : undefined}
                  >
                    <td className={styles.leadNameCell}>
                      <span className={styles.avatar} style={{ background: c.initialBg }}>
                        {c.initials}
                      </span>
                      <span className={styles.leadNameText}>{c.name}</span>
                    </td>
                    <td>{c.company}</td>
                    <td>{c.source}</td>
                    <td>{c.plan}</td>
                    <td>
                      <div className={styles.assignedCell}>
                        <span className={styles.assignedAvatar}>R</span>
                        {c.assignedTo}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`${styles.statusPill} ${STATUS_PILL_CLASS[c.status]}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className={styles.actionCell}>
                      <button type="button" className={styles.viewBtn}>
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ----------------------- Right sidebar ----------------------- */}
      <aside className={styles.sidebar}>
        <div className={styles.panel}>
          <h3 className={styles.panelTitle}>Contract Details</h3>

          {/* Client Info */}
          <div className={styles.detailSection}>
            <h4 className={styles.detailSectionTitle}>Client Info</h4>
            <div className={styles.detailList}>
              <div className={styles.detailRow}>
                <span className={styles.detailIcon}>{Icon.User}</span>
                <div>
                  <p className={styles.detailLabel}>Name</p>
                  <p className={styles.detailValue}>{selected.name}</p>
                </div>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailIcon}>{Icon.Phone}</span>
                <div>
                  <p className={styles.detailLabel}>Phone</p>
                  <p className={styles.detailValue}>+91 98765 43210</p>
                </div>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailIcon}>{Icon.Mail}</span>
                <div>
                  <p className={styles.detailLabel}>Email</p>
                  <p className={styles.detailValue}>rahul@techstartup.com</p>
                </div>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailIcon}>{Icon.Building}</span>
                <div>
                  <p className={styles.detailLabel}>Company</p>
                  <p className={styles.detailValue}>TechStartup Inc</p>
                </div>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailIcon}>{Icon.Users}</span>
                <div>
                  <p className={styles.detailLabel}>Team Size</p>
                  <p className={styles.detailValue}>8 members</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contract Info */}
          <div className={styles.detailSection}>
            <h4 className={styles.detailSectionTitle}>Contract Info</h4>
            <div className={styles.detailList}>
              <div className={styles.detailRow}>
                <span className={styles.detailIcon}>{Icon.Plan}</span>
                <div>
                  <p className={styles.detailLabel}>Plan</p>
                  <p className={styles.detailValue}>Private Office</p>
                </div>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailIcon}>{Icon.MapPin}</span>
                <div>
                  <p className={styles.detailLabel}>Center Location</p>
                  <p className={styles.detailValue}>Koramangala</p>
                </div>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailIcon}>{Icon.Calendar}</span>
                <div>
                  <p className={styles.detailLabel}>Start Date</p>
                  <p className={styles.detailValue}>15 January 2024</p>
                </div>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailIcon}>{Icon.Calendar}</span>
                <div>
                  <p className={styles.detailLabel}>End Date</p>
                  <p className={styles.detailValue}>15 January 2025</p>
                </div>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailIcon}>{Icon.Cycle}</span>
                <div>
                  <p className={styles.detailLabel}>Billing Cycle</p>
                  <p className={styles.detailValue}>Monthly</p>
                </div>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailIcon}>{Icon.Deposit}</span>
                <div>
                  <p className={styles.detailLabel}>Deposit</p>
                  <p className={styles.detailValue}>₹90,000</p>
                </div>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className={styles.detailSection}>
            <h4 className={styles.detailSectionTitle}>Documents</h4>
            <div className={styles.docList}>
              <button type="button" className={styles.docBtn}>
                <span className={styles.docIcon}>{Icon.Download}</span>
                <span>Download Contract (PDF)</span>
              </button>
              <button type="button" className={styles.docBtn}>
                <span className={styles.docIcon}>{Icon.Download}</span>
                <span>Download Invoice</span>
              </button>
              <button type="button" className={styles.docBtn}>
                <span className={styles.docIcon}>{Icon.Download}</span>
                <span>Download Client Details</span>
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className={styles.detailSection}>
            <button type="button" className={styles.renewBtn}>
              <span className={styles.renewIcon}>{Icon.Refresh}</span>
              Renew Contract
            </button>
            <button type="button" className={styles.terminateBtn}>
              <span className={styles.terminateIcon}>{Icon.Ban}</span>
              Terminate Contract
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
