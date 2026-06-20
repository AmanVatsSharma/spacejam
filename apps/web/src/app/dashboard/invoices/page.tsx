/**
 * File:        apps/web/src/app/dashboard/invoices/page.tsx
 * Module:      Web · Dashboard · Invoices
 * Purpose:     Invoices view for the Revenue section — hero, chart, table,
 *              upcoming invoices, renewal/upgrade rails, and recent
 *              activity. The sub-tab nav (Invoices / Deposit / Contracts)
 *              is rendered in the global header — see `dashboard/layout.tsx`.
 *
 * Exports:
 *   - default: InvoicesPage — invoices view
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-21
 */

"use client";

import { ActionMenu } from "@/components/ui/action-menu";
import styles from "./invoices.module.css";

type Status = "paid" | "overdue" | "due-soon" | "occupied";

const INVOICES = [
  { client: "TechStart Co.",   inv: "INV-001", amount: "$4,500", date: "Apr 10, 2026", status: "paid"      as Status },
  { client: "Creative Studio", inv: "INV-002", amount: "$6,200", date: "Apr 12, 2026", status: "overdue"   as Status },
  { client: "Design Labs",     inv: "INV-003", amount: "$3,800", date: "Apr 15, 2026", status: "due-soon"  as Status },
  { client: "Innovate Inc.",   inv: "INV-004", amount: "$5,500", date: "Apr 16, 2026", status: "paid"      as Status },
  { client: "StartUp Hub",     inv: "INV-005", amount: "$4,200", date: "Apr 18, 2026", status: "occupied"  as Status },
  { client: "Digital Agency",  inv: "INV-006", amount: "$7,100", date: "Apr 20, 2026", status: "due-soon"  as Status },
  { client: "Marketing Pro",   inv: "INV-007", amount: "$3,900", date: "Apr 22, 2026", status: "paid"      as Status },
];

// Monthly bar values for the Income & Invoice chart (Jan..Dec) — visual heights only.
const CHART = [
  { m: "Jan", h: 48 },
  { m: "Feb", h: 56 },
  { m: "Mar", h: 64 },
  { m: "Apr", h: 52 },
  { m: "May", h: 78 },
  { m: "Jun", h: 62 },
  { m: "Jul", h: 96 },
  { m: "Aug", h: 86 },
  { m: "Sep", h: 116 },
  { m: "Oct", h: 106 },
  { m: "Nov", h: 134 },
  { m: "Dec", h: 154 },
];

const RENEWALS = [
  { client: "TechStart Co.",   date: "Apr 20, 2026", left: "4d left"  },
  { client: "Creative Studio", date: "Apr 25, 2026", left: "9d left"  },
  { client: "Design Labs",     date: "Apr 28, 2026", left: "12d left" },
];

const UPGRADES = [
  { client: "TechStart Co.",   current: "Current: Basic",  target: "Pro",     bg: "#FFE5D9" },
  { client: "Creative Studio", current: "Pro",             target: "Premium", bg: "#FFE5D9" },
  { client: "Design Labs",     current: "Std",             target: "Pro",     bg: "#FFE5D9" },
];

const ACTIVITIES = [
  { title: "Payment Failed",         meta: "Acme Corporation · Today, 11:30 AM",  dot: "#EF4444" },
  { title: "License Renewed",        meta: "TechStart Co. · Yesterday, 4:15 PM",  dot: "#10B981" },
  { title: "Fwd:Invoice – basic",    meta: "Design Labs · 2 days ago",            dot: "#FF6A2F" },
  { title: "Fwd: Invoice",           meta: "Innovate Inc. · 3 days ago",          dot: "#FF6A2F" },
  { title: "Payment Received",       meta: "StartUp Hub · 4 days ago",            dot: "#10B981" },
];

const UPCOMING = [
  { client: "Acme Corporation", amount: "$7,500", date: "23 Apr 25", status: "Pending",  tag: "#FFE5D9" },
  { client: "Global Ventures",  amount: "$6,800", date: "27 Apr 25", status: "Overdue",  tag: "#FCE7E2" },
  { client: "NextGen Tech",     amount: "$5,200", date: "30 Apr 25", status: "Upcoming", tag: "#FFE5D9" },
];

const STATUS_STYLES: Record<Status, { bg: string; color: string; label: string }> = {
  paid:     { bg: "rgba(20,184,166,0.20)",  color: "#0F766E", label: "PAID"     },
  overdue:  { bg: "rgba(255,120,71,0.20)",  color: "#B43A14", label: "OVERDUE"  },
  "due-soon": { bg: "rgba(251,191,36,0.20)", color: "#92400E", label: "DUE SOON" },
  occupied: { bg: "rgba(255,120,71,0.20)",  color: "#B43A14", label: "OCCUPIED" },
};

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-6 text-[#4A5565]">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-3.5 text-[#6A7282]">
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3.5 10h17M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-6 text-[#4A5565]">
      <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowDownIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="size-4 text-white">
      <path d="M8 3v10M3 8l5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="size-4 text-white">
      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function DotsIcon() {
  return (
    <svg viewBox="0 0 14 14" fill="none" className="size-3.5 text-[#4A5565]">
      <circle cx="3.5" cy="7" r="1.2" fill="currentColor" />
      <circle cx="7" cy="7" r="1.2" fill="currentColor" />
      <circle cx="10.5" cy="7" r="1.2" fill="currentColor" />
    </svg>
  );
}

function ChartCard() {
  const maxH = Math.max(...CHART.map((c) => c.h));
  return (
    <div className={styles.chartCard}>
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-[20px] font-bold text-[#0A0A0A] tracking-[-0.45px]">
            Income &amp; Invoice Reports
          </h2>
          <p className="mt-1 text-[14px] font-medium text-[#62748E] tracking-[-0.15px]">
            Monthly revenue overview
          </p>
        </div>
        <div className="flex items-center gap-6 text-[14px]">
          <div className="text-right">
            <p className="text-[12px] text-[#62748E]">Paid</p>
            <p className="text-[14px] text-[#0A0A0A] tracking-[-0.15px]">$654,200</p>
          </div>
          <div className="text-right">
            <p className="text-[12px] text-[#62748E]">Overdue</p>
            <p className="text-[14px] text-[#FF7847] tracking-[-0.15px]">$42,800</p>
          </div>
          <div className="text-right">
            <p className="text-[12px] text-[#62748E]">Due Soon</p>
            <p className="text-[14px] text-[#FF7847] tracking-[-0.15px] w-[61px]">$128,500</p>
          </div>
        </div>
      </div>

      <div className={styles.chartArea}>
        {/* Y axis labels */}
        <div className={styles.yAxis}>
          {["$100k", "$75k", "$50k", "$25k", "$0k"].map((l) => (
            <span key={l} className="text-[12px] text-[#94A3B8] text-right">
              {l}
            </span>
          ))}
        </div>

        {/* Bars + X axis */}
        <div className={styles.plot}>
          <div className={styles.bars}>
            {CHART.map((b) => (
              <div
                key={b.m}
                className={styles.bar}
                style={{ height: `${(b.h / maxH) * 100}%` }}
              />
            ))}
          </div>
          <div className={styles.xAxis}>
            {CHART.map((b) => (
              <span key={b.m} className="text-[12px] text-[#94A3B8]">
                {b.m}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function InvoicesTable() {
  return (
    <div className={styles.tableCard}>
      <div>
        <h2 className="text-[20px] font-bold text-[#0A0A0A] tracking-[-0.45px]">
          Invoices
        </h2>
        <p className="mt-1 text-[14px] font-medium text-[#62748E] tracking-[-0.15px]">
          Overview of all client invoices
        </p>
      </div>

      <div className={styles.tableWrap}>
        <div className={styles.tableHead}>
          <div className="w-[260px] pl-[24px]">CLIENT NAME</div>
          <div className="w-[200px] text-right pr-2">AMOUNT</div>
          <div className="w-[160px] text-right pr-2">DATE</div>
          <div className="w-[110px] text-right pr-2">STATUS</div>
          <div className="w-[60px] text-right pr-[24px]">ACTIONS</div>
        </div>

        {INVOICES.map((row) => {
          const s = STATUS_STYLES[row.status];
          return (
            <div key={row.inv} className={styles.tableRow}>
              <div className={styles.clientCell}>
                <p className="text-[14px] font-medium text-[#101828] tracking-[-0.15px]">
                  {row.client}
                </p>
                <p className="text-[12px] text-[#6A7282]">{row.inv}</p>
              </div>
              <div className="w-[200px] text-right pr-2 text-[14px] font-medium text-[#101828]">
                {row.amount}
              </div>
              <div className="w-[160px] text-right pr-2 text-[14px] text-[#45556C]">
                {row.date}
              </div>
              <div className="w-[110px] flex justify-center">
                <span
                  className={styles.statusPill}
                  style={{ background: s.bg, color: s.color }}
                >
                  {s.label}
                </span>
              </div>
              <div className="w-[60px] flex justify-end pr-[24px]">
                <ActionMenu
                  items={[
                    { label: "View Details", onClick: () => {} },
                    { label: "Edit", onClick: () => {} },
                    { label: "Delete", destructive: true, onClick: () => {} },
                  ]}
                  trigger={
                    <button className="p-1" aria-label="Row actions">
                      <DotsIcon />
                    </button>
                  }
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function UpcomingInvoices() {
  return (
    <div className={styles.upcomingCard}>
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-[20px] font-bold text-[#0A0A0A] tracking-[-0.45px]">
            Upcoming Invoices
          </h2>
          <p className="mt-1 text-[14px] font-medium text-[#62748E] tracking-[-0.15px]">
            Scheduled for the next cycle
          </p>
        </div>
        <button className="rounded-[10px] bg-[#FF7847] px-4 py-2 text-[14px] font-semibold text-white">
          + Add New
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {UPCOMING.map((u) => (
          <div key={u.client} className={styles.upcomingItem}>
            <p className="text-[16px] font-semibold text-[#101828]">{u.client}</p>
            <p className="mt-1 text-[20px] font-bold text-[#101828] tracking-[-0.45px]">
              {u.amount}
            </p>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[12px] text-[#6A7282]">{u.date}</span>
              <span
                className="rounded-full px-3 py-[3px] text-[12px] font-medium"
                style={{ background: u.tag, color: "#B43A14" }}
              >
                {u.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RenewalAlerts() {
  return (
    <div className={styles.railCard}>
      <div>
        <h3 className="text-[18px] font-bold text-[#0A0A0A] tracking-[-0.44px]">
          Renewal Alerts
        </h3>
        <p className="mt-1 text-[14px] text-[#62748E] tracking-[-0.15px]">
          Upcoming subscription renewals
        </p>
      </div>
      <div className="flex flex-col gap-3">
        {RENEWALS.map((r) => (
          <div key={r.client} className={styles.renewalItem}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[16px] font-medium text-[#0A0A0A] tracking-[-0.31px]">
                  {r.client}
                </p>
                <div className="mt-1 flex items-center gap-[6px] text-[14px] text-[#62748E]">
                  <CalendarIcon />
                  <span>{r.date}</span>
                </div>
              </div>
              <span className="rounded-full bg-[#FFF7ED] px-2 py-[2px] text-[12px] font-medium text-[#FF7847]">
                {r.left}
              </span>
            </div>
            <button className="mt-3 h-9 w-full rounded-[12px] bg-[#FF7847] text-[14px] font-medium text-white">
              Renew
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function UpgradeOpportunities() {
  return (
    <div className={styles.railCard}>
      <div>
        <h3 className="text-[18px] font-bold text-[#0A0A0A] tracking-[-0.44px]">
          Upgrade Opportunities
        </h3>
        <p className="mt-1 text-[14px] text-[#62748E] tracking-[-0.15px]">
          Potential upsell clients
        </p>
      </div>
      <div className="flex flex-col gap-3">
        {UPGRADES.map((u) => (
          <div key={u.client} className={styles.upgradeItem}>
            <div className="flex items-center justify-between">
              <p className="text-[15px] font-semibold text-[#101828]">{u.client}</p>
              <span
                className="rounded-full px-2 py-[2px] text-[12px] font-medium"
                style={{ background: u.bg, color: "#B43A14" }}
              >
                {u.target}
              </span>
            </div>
            <p className="mt-1 text-[12px] text-[#6A7282]">{u.current}</p>
            <div className="mt-2 h-1.5 w-full rounded-full bg-[#F3F4F6]">
              <div
                className="h-full rounded-full bg-[#FF7847]"
                style={{ width: "60%" }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentActivities() {
  return (
    <div className={styles.railCard}>
      <div>
        <h3 className="text-[18px] font-bold text-[#0A0A0A] tracking-[-0.44px]">
          Recent Activities
        </h3>
        <p className="mt-1 text-[14px] text-[#62748E] tracking-[-0.15px]">
          Latest system events
        </p>
      </div>
      <ul className="flex flex-col gap-3">
        {ACTIVITIES.map((a, i) => (
          <li key={i} className="flex items-start gap-3">
            <span
              className="mt-2 size-2 shrink-0 rounded-full"
              style={{ background: a.dot }}
            />
            <div>
              <p className="text-[14px] font-medium text-[#101828]">{a.title}</p>
              <p className="mt-[2px] text-[12px] text-[#6A7282]">{a.meta}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function InvoicesPage() {
  return (
    <div className="flex flex-col gap-5">
      {/* Page hero */}
      <div className={styles.heroCard}>
        <div>
          <h1 className="text-[30px] font-bold leading-[36px] text-[#111827] tracking-[-0.5px]">
            Invoice
          </h1>
          <p className="mt-1 max-w-[667px] text-[16px] text-[#4B5563] tracking-[-0.5px]">
            Manage and track all coworking invoices
          </p>
        </div>

        <div className={styles.totalCard}>
          <div className="flex items-center justify-between">
            <p className="text-[18px] font-bold text-[#111827]">Total Receivable</p>
            <p className="text-[18px] font-medium text-[#111827]">9.98 L</p>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-[16px] text-[#4B5563]">Over dues</p>
            <p className="text-[18px] font-medium text-[#FF7847]">1.42 L</p>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-[16px] text-[#4B5563]">Collected this month</p>
            <p className="text-[18px] font-medium text-[#319319]">4.25 L</p>
          </div>
        </div>
      </div>

      {/* Filter row */}
      <div className={styles.filterRow}>
        <div className={styles.searchBox}>
          <SearchIcon />
          <input
            type="text"
            placeholder="Search Invoice.."
            className="flex-1 bg-transparent text-[16px] text-[#4A5565] outline-none placeholder:text-[#4A5565]"
          />
        </div>

        <button className={styles.selectBox}>
          <span>All Statuses</span>
          <ChevronIcon />
        </button>

        <button className={styles.selectBox}>
          <span>Last 30 Days</span>
          <ChevronIcon />
        </button>

        <button className={styles.clearAll}>Clear All</button>

        <div className="ml-auto flex items-center gap-3">
          <button className={styles.exportBtn}>
            <ArrowDownIcon />
            <span>Export Excel</span>
          </button>
          <button className={styles.primaryBtn}>
            <PlusIcon />
            <span>Generate Invoice</span>
          </button>
        </div>
      </div>

      {/* Main two-column grid */}
      <div className={styles.mainGrid}>
        <div className="flex flex-col gap-5">
          <ChartCard />
          <InvoicesTable />
          <UpcomingInvoices />
        </div>

        <div className="flex flex-col gap-5">
          <RenewalAlerts />
          <UpgradeOpportunities />
          <RecentActivities />
        </div>
      </div>
    </div>
  );
}
