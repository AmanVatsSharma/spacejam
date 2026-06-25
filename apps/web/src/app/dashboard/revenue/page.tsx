/**
 * File:        apps/web/src/app/dashboard/revenue/page.tsx
 * Module:      Web · Dashboard · Revenue (Invoices)
 * Purpose:     Default revenue view = invoices. Implements the Figma
 *              "Invoice / Revenue & Invoice Reports" design with a
 *              two-column layout: main (header → report → table →
 *              upcoming) on the left, aside (stat cards, renewal
 *              alert, recent activities) on the right. The sub-tab
 *              nav (Invoices / Deposit / Contracts) is rendered in the
 *              global dashboard header — see `dashboard/layout.tsx`.
 *              The deposit and contract views live in sibling routes
 *              under this folder.
 *
 * Exports:
 *   - RevenuePage — revenue/invoices view
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-20
 */

"use client";

import { useMemo, useState } from "react";
import styles from "./page.module.css";

type InvoiceStatus = "paid" | "pending" | "overdue";

interface Invoice {
  id: string;
  clientName: string;
  amount: number;
  date: string;
  status: InvoiceStatus;
}

interface UpcomingInvoice {
  id: string;
  clientName: string;
  amount: number;
  dueIn: string;
}

interface ChartPoint {
  month: string;
  paid: number;
  outstanding: number;
}

const mockInvoices: Invoice[] = [
  { id: "INV-1001", clientName: "TechSpark Co.", amount: 2400, date: "Apr 18, 2026", status: "paid" },
  { id: "INV-1002", clientName: "Creative Studio", amount: 6200, date: "Apr 22, 2026", status: "pending" },
  { id: "INV-1003", clientName: "Design Labs", amount: 3600, date: "Apr 30, 2026", status: "paid" },
  { id: "INV-1004", clientName: "Innovate Inc.", amount: 5300, date: "May 06, 2026", status: "overdue" },
  { id: "INV-1005", clientName: "Startup Hub", amount: 2200, date: "May 12, 2026", status: "pending" },
  { id: "INV-1006", clientName: "FlexSpace Co.", amount: 4800, date: "May 18, 2026", status: "paid" },
  { id: "INV-1007", clientName: "Digital Agency", amount: 7100, date: "May 24, 2026", status: "paid" },
];

const upcomingInvoices: UpcomingInvoice[] = [
  { id: "INV-1008", clientName: "Acme Corporation", amount: 3300, dueIn: "Due in 5 days" },
  { id: "INV-1009", clientName: "Global Ventures", amount: 4800, dueIn: "Due in 7 days" },
  { id: "INV-1010", clientName: "NextGen Tech", amount: 5200, dueIn: "Due in 10 days" },
];

const chartData: ChartPoint[] = [
  { month: "Jan", paid: 4500, outstanding: 1200 },
  { month: "Feb", paid: 5200, outstanding: 1500 },
  { month: "Mar", paid: 4800, outstanding: 1300 },
  { month: "Apr", paid: 6100, outstanding: 1800 },
  { month: "May", paid: 7200, outstanding: 2200 },
  { month: "Jun", paid: 6800, outstanding: 1700 },
  { month: "Jul", paid: 8000, outstanding: 2400 },
  { month: "Aug", paid: 8500, outstanding: 2000 },
  { month: "Sep", paid: 7800, outstanding: 1900 },
  { month: "Oct", paid: 9200, outstanding: 2300 },
  { month: "Nov", paid: 8800, outstanding: 2100 },
  { month: "Dec", paid: 9600, outstanding: 2500 },
];

const statusBadgeClass: Record<InvoiceStatus, string> = {
  paid: styles.statusPaid,
  pending: styles.statusPending,
  overdue: styles.statusOverdue,
};

const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

export default function RevenuePage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | InvoiceStatus>("all");

  const filteredInvoices = useMemo(() => {
    return mockInvoices.filter((inv) => {
      const matchesSearch =
        !search ||
        inv.clientName.toLowerCase().includes(search.toLowerCase()) ||
        inv.id.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter]);

  const totals = useMemo(() => {
    const paid = mockInvoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0);
    const outstanding = mockInvoices.filter((i) => i.status !== "paid").reduce((s, i) => s + i.amount, 0);
    return { paid, outstanding };
  }, []);

  const maxChartValue = useMemo(
    () => Math.max(...chartData.map((d) => d.paid + d.outstanding)),
    [],
  );

  const recentActivities = [
    { color: "default", text: <>Created new invoice for <strong>Acme Corporation</strong></>, time: "2 hours ago" },
    { color: "green", text: <>Payment received from <strong>Digital Agency</strong></>, time: "5 hours ago" },
    { color: "blue", text: <>Updated invoice <strong>INV-1004</strong> status</>, time: "Yesterday at 4:30 PM" },
    { color: "purple", text: <>Sent payment reminder to <strong>Innovate Inc.</strong></>, time: "2 days ago" },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Page Header */}
      <div className={`${styles.pageHeader} compact:flex-col compact:items-start compact:gap-3`}>
        <div className={styles.pageTitleBlock}>
          <h1 className={styles.pageTitle}>Invoice</h1>
          <p className={styles.pageSubtitle}>Manage and track all coworking invoices</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.exportBtn}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M7 1.5V9.5M7 9.5L4 6.5M7 9.5L10 6.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 11V12.5H12V11" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Export Excel</span>
          </button>
          <button type="button" className={styles.createBtn}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M7 2V12M2 7H12" strokeLinecap="round" />
            </svg>
            <span>Generate Invoice</span>
          </button>
        </div>
      </div>

      {/* Two-column layout */}
      <div className={styles.layout}>
        {/* Main column */}
        <div className={styles.mainColumn}>
          {/* Income & Invoice Reports */}
          <section className={styles.card}>
            <div className={styles.reportTopRow}>
              <div className={styles.totalRevenue}>
                <span className={styles.totalRevenueLabel}>Total Revenue</span>
                <span className={styles.totalRevenueValue}>{inr(totals.paid)}</span>
              </div>
              <div className={styles.legend}>
                <span className={styles.legendItem}>
                  <span className={`${styles.legendSwatch} ${styles.legendSwatchPaid}`} />
                  Paid
                  <span className={styles.legendAmount}>{inr(totals.paid)}</span>
                </span>
                <span className={styles.legendItem}>
                  <span className={`${styles.legendSwatch} ${styles.legendSwatchOutstanding}`} />
                  Outstanding
                  <span className={styles.legendAmount}>{inr(totals.outstanding)}</span>
                </span>
              </div>
            </div>

            <div className={styles.chart} aria-hidden="true">
              {chartData.map((d) => {
                const paidHeight = Math.max(8, (d.paid / maxChartValue) * 100);
                const outstandingHeight = Math.max(6, (d.outstanding / maxChartValue) * 100);
                return (
                  <div key={d.month} className={styles.chartBarGroup}>
                    <div
                      className={`${styles.chartBar} ${styles.chartBarPaid}`}
                      style={{ height: `${paidHeight}%` }}
                    />
                    <div
                      className={`${styles.chartBar} ${styles.chartBarOutstanding}`}
                      style={{ height: `${outstandingHeight}%` }}
                    />
                  </div>
                );
              })}
            </div>
            <div className={styles.chartAxis}>
              {chartData.map((d) => (
                <span key={d.month}>{d.month}</span>
              ))}
            </div>
          </section>

          {/* Invoices list */}
          <section className={styles.card}>
            <div className={styles.invoicesHeader}>
              <div className={styles.cardTitleBlock}>
                <span className={styles.cardTitle}>Invoices</span>
                <span className={styles.cardSubtitle}>View list of all latest invoices</span>
              </div>
              <div className={styles.filterBar}>
                <div className={styles.searchField}>
                  <svg className={styles.searchIcon} width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4" />
                    <path d="M11 11L9.2 9.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search Invoice..."
                    className={styles.searchInput}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    aria-label="Search invoices"
                  />
                </div>
                <select
                  className={styles.filterSelect}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as "all" | InvoiceStatus)}
                  aria-label="Filter by status"
                >
                  <option value="all">All Status</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="overdue">Overdue</option>
                </select>
                {(search || statusFilter !== "all") && (
                  <button
                    type="button"
                    className={styles.clearAll}
                    onClick={() => {
                      setSearch("");
                      setStatusFilter("all");
                    }}
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Client Name</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={5} className={styles.emptyHint}>
                        No invoices match your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((invoice) => (
                      <tr key={invoice.id}>
                        <td className={styles.cellClient}>{invoice.clientName}</td>
                        <td className={styles.cellAmount}>{inr(invoice.amount)}</td>
                        <td className={styles.cellDate}>{invoice.date}</td>
                        <td>
                          <span className={`${styles.statusBadge} ${statusBadgeClass[invoice.status]}`}>
                            <span className={styles.statusDot} />
                            {invoice.status}
                          </span>
                        </td>
                        <td>
                          <div className={styles.actionsCell}>
                            <button type="button" className={styles.iconBtn} aria-label="View invoice">
                              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <path d="M1 7C1 7 3 2.5 7 2.5C11 2.5 13 7 13 7C13 7 11 11.5 7 11.5C3 11.5 1 7 1 7Z" stroke="currentColor" strokeWidth="1.2" />
                                <circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.2" />
                              </svg>
                            </button>
                            <button type="button" className={styles.iconBtn} aria-label="Edit invoice">
                              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <path d="M2 12L3 9L9.5 2.5L11.5 4.5L5 11L2 12Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                                <path d="M8.5 3.5L10.5 5.5" stroke="currentColor" strokeWidth="1.2" />
                              </svg>
                            </button>
                            <button type="button" className={styles.iconBtn} aria-label="Delete invoice">
                              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <path d="M2.5 4H11.5M5.5 4V2.5H8.5V4M3.5 4L4 11.5C4 12 4.5 12.5 5 12.5H9C9.5 12.5 10 12 10 11.5L10.5 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Upcoming Invoices */}
          <section className={styles.card}>
            <div className={styles.upcomingHeader}>
              <div className={styles.cardTitleBlock}>
                <span className={styles.cardTitle}>Upcoming Invoices</span>
                <span className={styles.cardSubtitle}>Invoices scheduled to be sent soon</span>
              </div>
              <a href="#" className={styles.viewAllLink}>
                View All
              </a>
            </div>

            <div className={styles.upcomingList}>
              {upcomingInvoices.map((inv) => {
                const initials = inv.clientName
                  .split(" ")
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();
                return (
                  <div key={inv.id} className={styles.upcomingItem}>
                    <div className={styles.upcomingItemLeft}>
                      <div className={styles.upcomingAvatar}>{initials}</div>
                      <div className={styles.upcomingMeta}>
                        <span className={styles.upcomingClient}>{inv.clientName}</span>
                        <span className={styles.upcomingDue}>{inv.dueIn}</span>
                      </div>
                    </div>
                    <div className={styles.upcomingRight}>
                      <span className={styles.upcomingAmount}>{inr(inv.amount)}</span>
                      <button type="button" className={styles.alertSecondary}>
                        Send
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Aside column */}
        <aside className={styles.asideColumn}>
          {/* Total Receivables */}
          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <span className={styles.statLabel}>Total Receivables</span>
              <span className={styles.statBadge}>+12%</span>
            </div>
            <div className={styles.statValue}>{inr(24200)}</div>
            <div className={styles.statMeta}>
              <span className={styles.statSubLabel}>Over Due</span>
              <span className={styles.statSubValue}>{inr(5300)}</span>
            </div>
          </div>

          {/* Collected this month */}
          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <span className={styles.statLabel}>Collected this month</span>
              <span className={styles.statBadge}>+8%</span>
            </div>
            <div className={styles.statValue}>{inr(18200)}</div>
            <div className={styles.statMeta}>
              <span className={styles.statSubLabel}>vs last month</span>
              <span className={styles.statSubValue}>{inr(16800)}</span>
            </div>
          </div>


          {/* Renewal Alert */}
          <div className={styles.alertCard}>
            <div className={styles.alertHeader}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 2L16 16H2L9 2Z" stroke="#FF6A2F" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M9 7V11" stroke="#FF6A2F" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="9" cy="13" r="0.8" fill="#FF6A2F" />
              </svg>
              <span className={styles.alertTitle}>Renewal Alert</span>
            </div>
            <p className={styles.alertText}>
              Upcoming subscription renewals may affect upcoming invoices. Review pending renewals to keep
              billing accurate.
            </p>
            <div className={styles.alertActions}>
              <button type="button" className={styles.alertPrimary}>
                View renewals
              </button>
              <button type="button" className={styles.alertSecondary}>
                Remind me later
              </button>
            </div>
          </div>

          {/* Recent Activities */}
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitleBlock}>
                <span className={styles.cardTitle}>Recent Activities</span>
                <span className={styles.cardSubtitle}>Latest invoice & billing activity</span>
              </div>
            </div>
            <div className={styles.activitiesList}>
              {recentActivities.map((a, idx) => {
                const dotClass =
                  a.color === "green"
                    ? styles.activityDotGreen
                    : a.color === "blue"
                      ? styles.activityDotBlue
                      : a.color === "purple"
                        ? styles.activityDotPurple
                        : "";
                return (
                  <div key={idx} className={styles.activityItem}>
                    <span className={`${styles.activityDot} ${dotClass}`} />
                    <div className={styles.activityBody}>
                      <span className={styles.activityText}>{a.text}</span>
                      <span className={styles.activityTime}>{a.time}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}