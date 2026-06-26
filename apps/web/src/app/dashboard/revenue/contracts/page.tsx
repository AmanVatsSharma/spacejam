"use client";

import { useMemo, useState } from "react";
import styles from "../page.module.css";

type ContractStatus = "active" | "expiring" | "expired" | "renewed";

interface Contract {
  id: string;
  clientName: string;
  bookingId: string;
  startDate: string;
  endDate: string;
  amount: number;
  status: ContractStatus;
}

interface UpcomingRenewal {
  id: string;
  clientName: string;
  amount: number;
  dueIn: string;
}

interface ChartPoint {
  month: string;
  active: number;
  expired: number;
}

const mockContracts: Contract[] = [
  { id: "CON-1001", clientName: "TechCorp India", bookingId: "BK-2024-089", startDate: "Jun 1, 2026", endDate: "Aug 31, 2026", amount: 45000, status: "active" },
  { id: "CON-1002", clientName: "StartupXYZ", bookingId: "BK-2024-088", startDate: "Jun 1, 2026", endDate: "Jul 31, 2026", amount: 28500, status: "expiring" },
  { id: "CON-1003", clientName: "Design Studio", bookingId: "BK-2024-087", startDate: "Jun 1, 2026", endDate: "Nov 30, 2026", amount: 32000, status: "active" },
  { id: "CON-1004", clientName: "Freelancer Co.", bookingId: "BK-2024-086", startDate: "Jun 1, 2026", endDate: "Jun 30, 2026", amount: 15000, status: "expired" },
  { id: "CON-1005", clientName: "Digital Agency", bookingId: "BK-2024-085", startDate: "Jun 1, 2026", endDate: "Dec 31, 2026", amount: 50000, status: "renewed" },
];

const upcomingRenewals: UpcomingRenewal[] = [
  { id: "CON-1008", clientName: "Acme Corporation", amount: 33000, dueIn: "Expires in 5 days" },
  { id: "CON-1009", clientName: "Global Ventures", amount: 48000, dueIn: "Expires in 7 days" },
  { id: "CON-1010", clientName: "NextGen Tech", amount: 52000, dueIn: "Expires in 10 days" },
];

const chartData: ChartPoint[] = [
  { month: "Jan", active: 45, expired: 12 },
  { month: "Feb", active: 52, expired: 15 },
  { month: "Mar", active: 48, expired: 13 },
  { month: "Apr", active: 61, expired: 18 },
  { month: "May", active: 72, expired: 22 },
  { month: "Jun", active: 68, expired: 17 },
  { month: "Jul", active: 80, expired: 24 },
  { month: "Aug", active: 85, expired: 20 },
  { month: "Sep", active: 78, expired: 19 },
  { month: "Oct", active: 92, expired: 23 },
  { month: "Nov", active: 88, expired: 21 },
  { month: "Dec", active: 96, expired: 25 },
];

const statusBadgeClass: Record<ContractStatus, string> = {
  active: styles.statusPaid,
  renewed: styles.statusPaid,
  expiring: styles.statusPending,
  expired: styles.statusOverdue,
};

const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

export default function ContractsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ContractStatus>("all");

  const filteredContracts = useMemo(() => {
    return mockContracts.filter((con) => {
      const matchesSearch =
        !search ||
        con.clientName.toLowerCase().includes(search.toLowerCase()) ||
        con.id.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || con.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter]);

  const totals = useMemo(() => {
    const active = mockContracts.filter((i) => i.status === "active" || i.status === "renewed").length;
    const expiring = mockContracts.filter((i) => i.status === "expiring").length;
    return { active, expiring };
  }, []);

  const maxChartValue = useMemo(
    () => Math.max(...chartData.map((d) => d.active + d.expired)),
    [],
  );

  const recentActivities = [
    { color: "default", text: <>Created new contract for <strong>Acme Corporation</strong></>, time: "2 hours ago" },
    { color: "green", text: <>Contract renewed by <strong>Digital Agency</strong></>, time: "5 hours ago" },
    { color: "blue", text: <>Updated contract <strong>CON-1004</strong> status</>, time: "Yesterday at 4:30 PM" },
    { color: "purple", text: <>Sent renewal reminder to <strong>StartupXYZ</strong></>, time: "2 days ago" },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Page Header */}
      <div className={`${styles.pageHeader} compact:flex-col compact:items-start compact:gap-3`}>
        <div className={styles.pageTitleBlock}>
          <h1 className={styles.pageTitle}>Contracts</h1>
          <p className={styles.pageSubtitle}>Manage client agreements, renewals, and statuses</p>
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
            <span>Create Contract</span>
          </button>
        </div>
      </div>

      {/* Two-column layout */}
      <div className={styles.layout}>
        {/* Main column */}
        <div className={styles.mainColumn}>
          {/* Contracts Reports */}
          <section className={styles.card}>
            <div className={styles.reportTopRow}>
              <div className={styles.totalRevenue}>
                <span className={styles.totalRevenueLabel}>Total Contracts</span>
                <span className={styles.totalRevenueValue}>124</span>
              </div>
              <div className={styles.legend}>
                <span className={styles.legendItem}>
                  <span className={`${styles.legendSwatch} ${styles.legendSwatchPaid}`} />
                  Active
                  <span className={styles.legendAmount}>98</span>
                </span>
                <span className={styles.legendItem}>
                  <span className={`${styles.legendSwatch} ${styles.legendSwatchOutstanding}`} />
                  Expired
                  <span className={styles.legendAmount}>26</span>
                </span>
              </div>
            </div>

            <div className={styles.chart} aria-hidden="true">
              {chartData.map((d) => {
                const paidHeight = Math.max(8, (d.active / maxChartValue) * 100);
                const outstandingHeight = Math.max(6, (d.expired / maxChartValue) * 100);
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

          {/* Contracts list */}
          <section className={styles.card}>
            <div className={styles.invoicesHeader}>
              <div className={styles.cardTitleBlock}>
                <span className={styles.cardTitle}>Contracts</span>
                <span className={styles.cardSubtitle}>View list of all client contracts</span>
              </div>
              <div className={styles.filterBar}>
                <div className={styles.searchField}>
                  <svg className={styles.searchIcon} width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4" />
                    <path d="M11 11L9.2 9.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search Contract..."
                    className={styles.searchInput}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    aria-label="Search contracts"
                  />
                </div>
                <select
                  className={styles.filterSelect}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as "all" | ContractStatus)}
                  aria-label="Filter by status"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="expiring">Expiring</option>
                  <option value="expired">Expired</option>
                  <option value="renewed">Renewed</option>
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
                    <th>Contract ID</th>
                    <th>Client Name</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContracts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className={styles.emptyHint}>
                        No contracts match your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredContracts.map((contract) => (
                      <tr key={contract.id}>
                        <td className={styles.cellClient} style={{ color: "#4A5565", fontWeight: "normal" }}>{contract.id}</td>
                        <td className={styles.cellClient}>{contract.clientName}</td>
                        <td className={styles.cellDate}>{contract.startDate}</td>
                        <td className={styles.cellDate}>{contract.endDate}</td>
                        <td className={styles.cellAmount}>{inr(contract.amount)}</td>
                        <td>
                          <span className={`${styles.statusBadge} ${statusBadgeClass[contract.status]}`}>
                            <span className={styles.statusDot} />
                            {contract.status}
                          </span>
                        </td>
                        <td>
                          <div className={styles.actionsCell}>
                            <button type="button" className={styles.iconBtn} aria-label="View contract">
                              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <path d="M1 7C1 7 3 2.5 7 2.5C11 2.5 13 7 13 7C13 7 11 11.5 7 11.5C3 11.5 1 7 1 7Z" stroke="currentColor" strokeWidth="1.2" />
                                <circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.2" />
                              </svg>
                            </button>
                            <button type="button" className={styles.iconBtn} aria-label="Edit contract">
                              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <path d="M2 12L3 9L9.5 2.5L11.5 4.5L5 11L2 12Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                                <path d="M8.5 3.5L10.5 5.5" stroke="currentColor" strokeWidth="1.2" />
                              </svg>
                            </button>
                            <button type="button" className={styles.iconBtn} aria-label="Delete contract">
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

          {/* Upcoming Renewals */}
          <section className={styles.card}>
            <div className={styles.upcomingHeader}>
              <div className={styles.cardTitleBlock}>
                <span className={styles.cardTitle}>Upcoming Renewals</span>
                <span className={styles.cardSubtitle}>Contracts expiring soon</span>
              </div>
              <a href="#" className={styles.viewAllLink}>
                View All
              </a>
            </div>

            <div className={styles.upcomingList}>
              {upcomingRenewals.map((con) => {
                const initials = con.clientName
                  .split(" ")
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();
                return (
                  <div key={con.id} className={styles.upcomingItem}>
                    <div className={styles.upcomingItemLeft}>
                      <div className={styles.upcomingAvatar}>{initials}</div>
                      <div className={styles.upcomingMeta}>
                        <span className={styles.upcomingClient}>{con.clientName}</span>
                        <span className={styles.upcomingDue}>{con.dueIn}</span>
                      </div>
                    </div>
                    <div className={styles.upcomingRight}>
                      <span className={styles.upcomingAmount}>{inr(con.amount)}</span>
                      <button type="button" className={styles.alertSecondary}>
                        Remind
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
          {/* Active Contracts */}
          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <span className={styles.statLabel}>Active Contracts</span>
              <span className={styles.statBadge}>+15%</span>
            </div>
            <div className={styles.statValue}>98</div>
            <div className={styles.statMeta}>
              <span className={styles.statSubLabel}>Total Value</span>
              <span className={styles.statSubValue}>{inr(154000)}</span>
            </div>
          </div>

          {/* Expiring Contracts */}
          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <span className={styles.statLabel}>Expiring Soon</span>
              <span className={`${styles.statBadge} ${styles.statBadgeNegative}`}>Action Reqd</span>
            </div>
            <div className={styles.statValue}>15</div>
            <div className={styles.statMeta}>
              <span className={styles.statSubLabel}>Within 30 Days</span>
              <span className={styles.statSubValue}>{inr(48500)}</span>
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
              <span className={styles.alertTitle}>Action Required</span>
            </div>
            <p className={styles.alertText}>
              15 contracts are expiring within the next 30 days. Send renewal reminders to ensure continuous billing.
            </p>
            <div className={styles.alertActions}>
              <button type="button" className={styles.alertPrimary}>
                Send Reminders
              </button>
              <button type="button" className={styles.alertSecondary}>
                Dismiss
              </button>
            </div>
          </div>

          {/* Recent Activities */}
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitleBlock}>
                <span className={styles.cardTitle}>Recent Activities</span>
                <span className={styles.cardSubtitle}>Latest contract activity</span>
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
