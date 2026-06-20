/**
 * File:        apps/web/src/app/dashboard/invoices/deposits/page.tsx
 * Module:      Web · Dashboard · Invoices · Deposits
 * Purpose:     Security Deposits sub-tab under Revenue > Invoices. Shows a
 *              hero, filter row, four KPI cards, the deposits table with a
 *              status dropdown and a per-row action menu, plus a right
 *              rail with Quick Actions and Recent Activities. Mirrors the
 *              Figma design at node 0-22421.
 *
 * Exports:
 *   - default: DepositsPage — security deposits view
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-21
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { ActionMenu } from "@/components/ui/action-menu";
import styles from "./deposits.module.css";

/* ---------------- Types ---------------- */

type Status = "Active" | "Frozen" | "Pending" | "Release";

interface DepositRow {
  id: string;
  name: string;
  amount: string;
  plan: string;
  center: string;
  payMode: string;
  status: Status;
  date: string;
}

interface ActivityItem {
  id: string;
  text: string;
  tone: "plus" | "refund" | "freeze";
}

/* ---------------- Static demo data (mirrors Figma) ---------------- */

const KPI = [
  { id: "kpi-total",   label: "Total Deposits Held",  value: "₹15,0,000", icon: "rupee" },
  { id: "kpi-pending", label: "Pending Release (2)",  value: "₹11,500",    icon: "pending" },
  { id: "kpi-frozen",  label: "Frozen Deposits",      value: "₹7,500",     icon: "snowflake" },
  { id: "kpi-overdue", label: "Overdue Refunds",      value: "0",          icon: "alert" },
];

const DEPOSITS: DepositRow[] = [
  { id: "d1", name: "Rahul Verma",  amount: "₹5,000",  plan: "Monthly",   center: "Chandigarh Hub", payMode: "Cash", status: "Active",  date: "Apr 15" },
  { id: "d2", name: "Priya Sharma", amount: "₹10,000", plan: "Quarterly", center: "Mumbai Office",  payMode: "UPI",   status: "Frozen",  date: "Apr 20" },
  { id: "d3", name: "Amit Singh",   amount: "₹3,000",  plan: "Monthly",   center: "Delhi Center",   payMode: "Card",  status: "Pending", date: "Mar 28" },
  { id: "d4", name: "Amit Singh",   amount: "₹3,000",  plan: "Monthly",   center: "Delhi Center",   payMode: "Card",  status: "Release", date: "Mar 28" },
];

const ACTIVITIES: ActivityItem[] = [
  { id: "a1", text: "Deposit added for Noah Brown - ₹8,000",     tone: "plus"   },
  { id: "a2", text: "Refund processed for Liam Anderson - $5,500", tone: "refund" },
  { id: "a3", text: "Freeze applied to Emma Davis deposit",        tone: "freeze" },
  { id: "a4", text: "Deposit added for Michael Chen -\n$3,500",    tone: "plus"   },
  { id: "a5", text: "Deposit added for Sarah Momo Chen -\n$3,500", tone: "plus"   },
];

const STATUS_OPTIONS: Status[] = ["Active", "Frozen", "Pending", "Release"];

/* ---------------- Small presentational atoms ---------------- */

function ChevronDown() {
  return (
    <svg
      className="pillCaret"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3 4.5L6 7.5L9 4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="7" stroke="#4b5563" strokeWidth="2" />
      <path d="M20 20L17 17" stroke="#4b5563" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ExportIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M8 2v8m0 0L5 7m3 3l3-3M2.5 12.5V14h11v-1.5"
        stroke="#364153"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function KpiIcon({ name }: { name: string }) {
  switch (name) {
    case "rupee":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M6 4h12M6 8h12M6 12l8 8M6 12l8-8M6 16h6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "pending":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
          <path
            d="M12 7v5l3 2"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "snowflake":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07M9 5l3 2 3-2M9 19l3-2 3 2M5 9l2 3-2 3M19 9l-2 3 2 3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "alert":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
          <path
            d="M12 7v6M12 16.5v.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    default:
      return null;
  }
}

function QuickIcon({ name }: { name: string }) {
  const stroke = "#ff7847";
  switch (name) {
    case "check":
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <circle cx="8" cy="8" r="6.5" stroke={stroke} strokeWidth="1.5" />
          <path
            d="M5.5 8.2l1.8 1.8L11 6.4"
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "snowflake":
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path
            d="M8 1v14M1 8h14M3 3l10 10M13 3L3 13"
            stroke={stroke}
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        </svg>
      );
    case "plus":
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path
            d="M8 3v10M3 8h10"
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case "bell":
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path
            d="M3.5 12V8a4.5 4.5 0 1 1 9 0v4l1 1.5h-11L3.5 12zM6.5 14.5a1.5 1.5 0 0 0 3 0"
            stroke={stroke}
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
        </svg>
      );
    default:
      return null;
  }
}

function ActivityIcon({ tone }: { tone: ActivityItem["tone"] }) {
  const color = tone === "plus" ? "#ff7847" : tone === "refund" ? "#00a040" : "#00a0c8";
  if (tone === "plus") {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M8 3v10M3 8h10" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (tone === "refund") {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path
          d="M2.5 8a5.5 5.5 0 0 1 9.4-3.9M13.5 8a5.5 5.5 0 0 1-9.4 3.9M12 2v3h-3M4 14v-3h3"
          stroke={color}
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M8 1v14M1 8h14M3 3l10 10M13 3L3 13"
        stroke={color}
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DotsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="5"  cy="10" r="1.5" fill="#4a5565" />
      <circle cx="10" cy="10" r="1.5" fill="#4a5565" />
      <circle cx="15" cy="10" r="1.5" fill="#4a5565" />
    </svg>
  );
}

/* ---------------- Status pill (interactive) ---------------- */

function statusToneClass(status: Status) {
  switch (status) {
    case "Active":  return styles.toneActive;
    case "Frozen":  return styles.toneFrozen;
    case "Pending": return styles.tonePending;
    case "Release": return styles.toneRelease;
  }
}

function StatusPill({
  status,
  onChange,
}: {
  status: Status;
  onChange: (s: Status) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className={styles.statusCell}>
      <button
        type="button"
        className={`${styles.statusPill} ${statusToneClass(status)}`}
        data-open={open}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{status}</span>
        <ChevronDown />
      </button>
      {open && (
        <div role="listbox" className={styles.statusMenu}>
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              role="option"
              aria-selected={opt === status}
              className={styles.statusMenuItem}
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- Page ---------------- */

export default function DepositsPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All Statuses");
  const [range, setRange] = useState<string>("Last 30 Days");
  const [rows, setRows] = useState<DepositRow[]>(DEPOSITS);

  return (
    <div className={styles.page}>
      {/* Hero card */}
      <section className={styles.hero}>
        <div>
          <h1 className={styles.heroTitle}>Security Deposits</h1>
          <p className={styles.heroSubtitle}>
            Manage client deposits, refunds, and holds
          </p>
        </div>
        <button type="button" className={styles.exportBtn}>
          <ExportIcon />
          <span>Export Excel</span>
        </button>
      </section>

      {/* Two-column shell */}
      <div className={styles.shell}>
        {/* Main column */}
        <div className={styles.page}>
          {/* Filter row */}
          <div className={styles.filterRow}>
            <label className={styles.filterInput}>
              <SearchIcon />
              <input
                type="text"
                placeholder="Search Invoice.."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search invoices"
              />
            </label>
            <label className={styles.filterSelect}>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by status"
              >
                <option>All Statuses</option>
                <option>Active</option>
                <option>Frozen</option>
                <option>Pending</option>
                <option>Release</option>
              </select>
              <ChevronDown />
            </label>
            <label className={styles.filterSelect}>
              <select
                value={range}
                onChange={(e) => setRange(e.target.value)}
                aria-label="Filter by date range"
              >
                <option>Last 30 Days</option>
                <option>Last 7 Days</option>
                <option>Last 90 Days</option>
                <option>This Year</option>
              </select>
              <ChevronDown />
            </label>
            <button
              type="button"
              className={styles.clearBtn}
              onClick={() => {
                setQuery("");
                setStatusFilter("All Statuses");
                setRange("Last 30 Days");
              }}
            >
              Clear All
            </button>
          </div>

          {/* KPI cards */}
          <div className={styles.kpiGrid}>
            {KPI.map((k) => (
              <div key={k.id} className={styles.kpiCard}>
                <div className={styles.kpiIconWrap}>
                  <KpiIcon name={k.icon} />
                </div>
                <p className={styles.kpiValue}>{k.value}</p>
                <p className={styles.kpiLabel}>{k.label}</p>
              </div>
            ))}
          </div>

          {/* Deposits table */}
          <div className={styles.tableCard}>
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th style={{ width: "16%" }}>Name</th>
                    <th style={{ width: "11%" }}>Amount</th>
                    <th style={{ width: "11%" }}>Plan</th>
                    <th style={{ width: "15%" }}>Center</th>
                    <th style={{ width: "12%" }}>Pay-Mode</th>
                    <th style={{ width: "13%" }}>Status</th>
                    <th style={{ width: "10%" }}>Date</th>
                    <th style={{ width: "12%" }} className={styles.actionCell}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td className={styles.nameCell}>{row.name}</td>
                      <td className={styles.amountCell}>{row.amount}</td>
                      <td>{row.plan}</td>
                      <td>{row.center}</td>
                      <td>{row.payMode}</td>
                      <td>
                        <StatusPill
                          status={row.status}
                          onChange={(s) =>
                            setRows((prev) =>
                              prev.map((r) => (r.id === row.id ? { ...r, status: s } : r)),
                            )
                          }
                        />
                      </td>
                      <td className={styles.dateCell}>{row.date}</td>
                      <td className={styles.actionCell}>
                        <ActionMenu
                          align="right"
                          items={[
                            { label: "View Details" },
                            { label: "Release" },
                            { label: "Freeze" },
                          ]}
                          trigger={<DotsIcon />}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right rail */}
        <aside className={styles.rail}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>Quick Actions</div>
            <div className={styles.quickActions}>
              <button type="button" className={styles.quickBtn}>
                <QuickIcon name="check" />
                <span>Approve Requests</span>
              </button>
              <button type="button" className={styles.quickBtn}>
                <QuickIcon name="snowflake" />
                <span>Freeze Account</span>
              </button>
              <button type="button" className={styles.quickBtn}>
                <QuickIcon name="plus" />
                <span>Add Deposit</span>
              </button>
              <button type="button" className={styles.quickBtn}>
                <QuickIcon name="bell" />
                <span>Send Reminder</span>
              </button>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>Recent Activities</div>
            <div className={styles.activityList}>
              {ACTIVITIES.map((a) => (
                <div key={a.id} className={styles.activityItem}>
                  <span
                    className={`iconWrap ${
                      a.tone === "plus"
                        ? "tonePlus"
                        : a.tone === "refund"
                          ? "toneRefund"
                          : "toneFreeze"
                    }`}
                  >
                    <ActivityIcon tone={a.tone} />
                  </span>
                  <span className={styles.activityText}>{a.text}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
