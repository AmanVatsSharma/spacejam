"use client";

import { useMemo, useState } from "react";
import styles from "./page.module.css";

type InvoiceStatus = "paid" | "overdue" | "due_soon" | "occupied";

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
}

const mockInvoices: Invoice[] = [
  { id: "INV-001", clientName: "TechStart Co.", amount: 4500, date: "Apr 10, 2026", status: "paid" },
  { id: "INV-002", clientName: "Creative Studio", amount: 6200, date: "Apr 12, 2026", status: "overdue" },
  { id: "INV-003", clientName: "Design Labs", amount: 3800, date: "Apr 15, 2026", status: "due_soon" },
  { id: "INV-004", clientName: "Innovate Inc.", amount: 5500, date: "Apr 16, 2026", status: "paid" },
  { id: "INV-005", clientName: "StartUp Hub", amount: 4200, date: "Apr 18, 2026", status: "occupied" },
  { id: "INV-006", clientName: "Digital Agency", amount: 7100, date: "Apr 20, 2026", status: "due_soon" },
];

const upcomingInvoices: UpcomingInvoice[] = [
  { id: "INV-007", clientName: "Acme Corporation", amount: 55000, dueIn: "Due: March 30" },
  { id: "INV-008", clientName: "Global Ventures", amount: 40000, dueIn: "Due: April 2" },
  { id: "INV-009", clientName: "NextGen Tech", amount: 35000, dueIn: "Due: April 5" },
];

const chartData: ChartPoint[] = [
  { month: "Jan", paid: 40000 },
  { month: "Feb", paid: 50000 },
  { month: "Mar", paid: 45000 },
  { month: "Apr", paid: 60000 },
  { month: "May", paid: 55000 },
  { month: "Jun", paid: 65000 },
  { month: "Jul", paid: 55000 },
  { month: "Aug", paid: 70000 },
  { month: "Sep", paid: 62000 },
  { month: "Oct", paid: 75000 },
  { month: "Nov", paid: 68000 },
  { month: "Dec", paid: 78000 },
];

const formatCurrency = (n: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
};

const formatINR = (n: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
};

export default function RevenuePage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | InvoiceStatus>("all");
  const [timeFilter, setTimeFilter] = useState("Last 30 Days");

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

  const maxChartValue = 100000;

  return (
    <div className="flex flex-col gap-5">
      {/* Page Header */}
      <div className={styles.pageHeader}>
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

      {/* Global Filter Bar */}
      <div className={styles.globalFilterBar}>
        <div className={styles.searchField}>
          <svg className={styles.searchIcon} width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4" />
            <path d="M11 11L9.2 9.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Search Invoice.."
            className={styles.searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className={styles.filterSelect}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "all" | InvoiceStatus)}
        >
          <option value="all">All Statues</option>
          <option value="paid">Paid</option>
          <option value="due_soon">Due Soon</option>
          <option value="overdue">Overdue</option>
        </select>
        <select
          className={styles.filterSelect}
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value)}
        >
          <option value="Last 30 Days">Last 30 Days</option>
          <option value="Last 7 Days">Last 7 Days</option>
        </select>
        <button
          type="button"
          className={styles.clearAllBtn}
          onClick={() => {
            setSearch("");
            setStatusFilter("all");
            setTimeFilter("Last 30 Days");
          }}
        >
          Clear All
        </button>
      </div>

      {/* Two-column layout */}
      <div className={styles.layout}>
        {/* Main column */}
        <div className={styles.mainColumn}>
          {/* Income & Invoice Reports */}
          <section className={styles.card}>
            <div className={styles.reportTopRow}>
              <div className={styles.cardTitleBlock}>
                <span className={styles.cardTitle}>Income & Invoice Reports</span>
                <span className={styles.cardSubtitle}>Monthly revenue overview</span>
              </div>
              <div className={styles.legendWrapper}>
                <div className={styles.legendItem}>
                  <span className={styles.legendLabel}>Paid</span>
                  <span className={styles.legendValueBlack}>$654,200</span>
                </div>
                <div className={styles.legendItem}>
                  <span className={styles.legendLabel}>Overdue</span>
                  <span className={styles.legendValueRed}>$42,800</span>
                </div>
                <div className={styles.legendItem}>
                  <span className={styles.legendLabel}>Due Soon</span>
                  <span className={styles.legendValueOrange}>$128,500</span>
                </div>
              </div>
            </div>

            <div className={styles.chartArea}>
              <div className={styles.chartYAxis}>
                <span>$100k</span>
                <span>$75k</span>
                <span>$50k</span>
                <span>$25k</span>
                <span>$0k</span>
              </div>
              <div className={styles.chartContent}>
                <div className={styles.chartBars}>
                  {chartData.map((d) => {
                    const heightPercent = (d.paid / maxChartValue) * 100;
                    return (
                      <div key={d.month} className={styles.chartBarCol}>
                        <div
                          className={styles.chartBarPaid}
                          style={{ height: `${heightPercent}%` }}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className={styles.chartXAxis}>
                  {chartData.map((d) => (
                    <span key={d.month}>{d.month}</span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Invoices list */}
          <section className={styles.card}>
            <div className={styles.cardTitleBlock} style={{ marginBottom: "20px" }}>
              <span className={styles.cardTitle}>Invoices</span>
              <span className={styles.cardSubtitle}>Overview of all client invoices</span>
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>CLIENT NAME</th>
                    <th>AMOUNT</th>
                    <th>DATE</th>
                    <th>STATUS</th>
                    <th style={{ textAlign: "right" }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={5} className={styles.emptyHint}>
                        No invoices found.
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((invoice) => (
                      <tr key={invoice.id}>
                        <td className={styles.cellClient}>
                          {invoice.clientName}
                          <div className={styles.invoiceId}>{invoice.id}</div>
                        </td>
                        <td className={styles.cellAmount}>{formatCurrency(invoice.amount)}</td>
                        <td className={styles.cellDate}>{invoice.date}</td>
                        <td>
                          <span className={`${styles.statusBadge} ${styles['status_' + invoice.status]}`}>
                            {invoice.status.replace("_", " ").toUpperCase()}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button className={styles.actionMenuBtn}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="5" r="1" />
                              <circle cx="12" cy="12" r="1" />
                              <circle cx="12" cy="19" r="1" />
                            </svg>
                          </button>
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
              <span className={styles.cardTitle}>Upcoming Invoices</span>
              <button className={styles.notifyAllBtn}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0"></path>
                </svg>
                Notify All
              </button>
            </div>

            <div className={styles.upcomingGrid}>
              {upcomingInvoices.map((inv) => {
                return (
                  <div key={inv.id} className={styles.upcomingGridCard}>
                    <div className={styles.upcomingClientName}>{inv.clientName}</div>
                    <div className={styles.upcomingCardRow}>
                      <span className={styles.upcomingCardAmount}>{formatINR(inv.amount)}</span>
                      <button className={styles.notifyBtn}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0"></path>
                        </svg>
                        Notify
                      </button>
                    </div>
                    <div className={styles.upcomingCardDue}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px' }}>
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                      </svg>
                      {inv.dueIn}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Aside column */}
        <aside className={styles.asideColumn}>
          {/* Total Receivables Combined Card */}
          <div className={styles.statCard}>
            <div className={styles.statRow}>
              <span className={styles.statRowLabelBlack}>Total Receivable</span>
              <span className={styles.statRowValueBlack}>9.98 L</span>
            </div>
            <div className={styles.statRow}>
              <span className={styles.statRowLabel}>Over dues</span>
              <span className={styles.statRowValueRed}>1.42 L</span>
            </div>
            <div className={styles.statRow}>
              <span className={styles.statRowLabel}>Collected this month</span>
              <span className={styles.statRowValueGreen}>4.25 L</span>
            </div>
          </div>

          {/* Renewal Alerts */}
          <div className={styles.asideBlock}>
            <div className={styles.asideBlockHeader}>
              <h3 className={styles.asideBlockTitle}>Renewal Alerts</h3>
              <p className={styles.asideBlockSubtitle}>Upcoming subscription renewals</p>
            </div>
            <div className={styles.asideCardList}>
              {[
                { name: "TechStart Co.", date: "Apr 20, 2026", left: "4d left" },
                { name: "Creative Studio", date: "Apr 25, 2026", left: "9d left" },
                { name: "Design Labs", date: "Apr 28, 2026", left: "12d left" }
              ].map((item, idx) => (
                <div key={idx} className={styles.asideInnerCard}>
                  <div className={styles.asideInnerHeader}>
                    <span className={styles.asideInnerName}>{item.name}</span>
                    <span className={styles.daysLeftBadge}>{item.left}</span>
                  </div>
                  <div className={styles.asideInnerDate}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px' }}>
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    {item.date}
                  </div>
                  <button className={styles.renewBtn}>Renew</button>
                </div>
              ))}
            </div>
          </div>

          {/* Upgrade Opportunities */}
          <div className={styles.asideBlock}>
            <div className={styles.asideBlockHeader}>
              <h3 className={styles.asideBlockTitle}>Upgrade Opportunities</h3>
              <p className={styles.asideBlockSubtitle}>Potential upsell clients</p>
            </div>
            <div className={styles.asideCardList}>
              {[
                { name: "StartUp Hub", plan: "Basic", upsell: "+$2400/mo" },
                { name: "Digital Agency", plan: "Standard", upsell: "+$3600/mo" }
              ].map((item, idx) => (
                <div key={idx} className={styles.asideInnerCard}>
                  <div className={styles.asideInnerHeader}>
                    <span className={styles.asideInnerName}>{item.name}</span>
                  </div>
                  <div className={styles.upgradeRow}>
                    <span className={styles.upgradeCurrent}>Current: <strong>{item.plan}</strong></span>
                    <button className={styles.upgradeBtn}>Upgrade</button>
                  </div>
                  <div className={styles.upsellAmount}>{item.upsell}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activities */}
          <div className={styles.asideBlock}>
            <div className={styles.asideBlockHeader}>
              <h3 className={styles.asideBlockTitle}>Recent Activities</h3>
            </div>
            <div className={styles.activityList}>
              <div className={styles.activityItem}>
                <div className={styles.activityIconRed}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                    <line x1="2" y1="10" x2="22" y2="10"></line>
                  </svg>
                </div>
                <div>
                  <div className={styles.activityTitle}>Payment Faild</div>
                  <div className={styles.activityDesc}>Pending Approvals</div>
                </div>
              </div>
              <div className={styles.activityItem}>
                <div className={styles.activityIconOrange}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 6 2 18 2 18 9"></polyline>
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                    <rect x="6" y="14" width="12" height="8"></rect>
                  </svg>
                </div>
                <div>
                  <div className={styles.activityTitle}>Printer Booked Today</div>
                  <div className={styles.activityDesc}>Patel Enterprises printer bo.....</div>
                </div>
              </div>
              <div className={styles.activityItem}>
                <div className={styles.activityIconRed}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                    <line x1="2" y1="10" x2="22" y2="10"></line>
                  </svg>
                </div>
                <div>
                  <div className={styles.activityTitle}>Payment Faild</div>
                  <div className={styles.activityDesc}>Pending Approvals</div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}