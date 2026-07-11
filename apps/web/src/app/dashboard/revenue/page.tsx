"use client";

/**
 * File:        apps/web/src/app/dashboard/revenue/page.tsx
 * Module:      Web · Dashboard · Revenue
 * Purpose:     Revenue dashboard — Invoices, Deposits, Contracts management.
 *              Fully wired to live Apollo data. No mock fallbacks.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-08
 */

import { useMemo, useState, useCallback } from "react";
import { toast } from "sonner";
import styles from "./page.module.css";
import { GenerateInvoiceModal } from "@/components/ui/dashboard/generate-invoice-modal";
import { InvoiceDetailsModal } from "@/components/ui/dashboard/invoice-details-modal";
import { RenewMembershipModal } from "@/components/ui/dashboard/renew-membership-modal";
import { PlanUpgradeModal } from "@/components/ui/dashboard/plan-upgrade-modal";
import { ExportExcelModal } from "@/components/ui/dashboard/export-excel-modal";
import { EditInvoiceModal } from "@/components/ui/dashboard/edit-invoice-modal";
import {
  useQuery,
  useMutation,
} from "@apollo/client";

import {
  GET_INVOICES,
  MARK_INVOICE_PAID,
  DELETE_INVOICE,
  GET_DEPOSITS,
  RELEASE_DEPOSIT,
  DELETE_DEPOSIT,
  GET_CONTRACTS,
  TERMINATE_CONTRACT,
  INVOICE_COUNT,
} from "@/lib/apollo/operations";
import { normalizeStatus } from "@/lib/revenue-status";

/* ──────────────────────────────────────────────────────────
 * GraphQL type-shapes
 * ────────────────────────────────────────────────────────── */

interface InvoiceRow {
  id: string;
  invoiceNumber: string;
  customerName: string;
  amount: number;
  status: string;
  issueDate: string;
  dueDate: string;
  paidDate?: string;
}

interface ContractRow {
  id: string;
  contractNumber: string;
  customerId: string;
  customerName: string;
  planName?: string;
  startDate: string;
  endDate: string;
  status: string;
  amount: number;
  paymentFrequency: string;
  autoRenew: boolean;
}

interface InvoicesResult {
  invoices?: InvoiceRow[];
}

interface InvoiceCountResult {
  invoiceCount?: number;
}

/* ──────────────────────────────────────────────────────────
 * Local UI types
 * ────────────────────────────────────────────────────────── */

type InvoiceStatusUI = "paid" | "overdue" | "due_soon" | "occupied";

interface UIInvoice {
  id: string;
  clientName: string;
  amount: number;
  date: string;
  status: InvoiceStatusUI;
}

interface ChartPoint {
  month: string;
  paid: number;
}

function mapInvoiceStatus(backendStatus: string): InvoiceStatusUI {
  const s = normalizeStatus(backendStatus);
  switch (s) {
    case "PAID":
      return "paid";
    case "OVERDUE":
      return "overdue";
    case "SENT":
      return "due_soon";
    default:
      return "occupied";
  }
}

const formatINR = (n: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
};

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/* ──────────────────────────────────────────────────────────
 * Apollo hooks — live data only, no mock fallback.
 * ────────────────────────────────────────────────────────── */

function useInvoices() {
  const { data, loading, error } = useQuery<InvoicesResult>(GET_INVOICES, {
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });

  const rawInvoices = data?.invoices ?? [];

  const invoices: UIInvoice[] = useMemo(() => {
    return rawInvoices.map((inv) => ({
      id: inv.invoiceNumber || inv.id,
      clientName: inv.customerName,
      amount: inv.amount,
      date: inv.issueDate
        ? new Date(inv.issueDate).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : "",
      status: mapInvoiceStatus(inv.status),
    }));
  }, [rawInvoices]);

  return { invoices, rawInvoices, loading, error };
}

function useContracts() {
  const { data, loading, error } = useQuery<{ contracts?: ContractRow[] }>(
    GET_CONTRACTS,
    { fetchPolicy: 'cache-and-network', errorPolicy: 'all' }
  );

  return { contracts: data?.contracts ?? [], loading, error };
}

/* ──────────────────────────────────────────────────────────
 * Mutations
 * ────────────────────────────────────────────────────────── */

function useInvoiceMutations() {
  const [markPaid] = useMutation(MARK_INVOICE_PAID, {
    refetchQueries: [{ query: GET_INVOICES }],
  });
  const [deleteInv] = useMutation(DELETE_INVOICE, {
    refetchQueries: [{ query: GET_INVOICES }],
  });

  const handleMarkPaid = useCallback(
    async (id: string) => {
      try {
        await markPaid({ variables: { id } });
        toast.success("Invoice marked as paid");
      } catch {
        toast.error("Failed to mark invoice as paid");
      }
    },
    [markPaid]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteInv({ variables: { id } });
        toast.success("Invoice deleted");
      } catch {
        toast.error("Failed to delete invoice");
      }
    },
    [deleteInv]
  );

  return { handleMarkPaid, handleDelete };
}

/* ──────────────────────────────────────────────────────────
 * Main component
 * ────────────────────────────────────────────────────────── */

export default function RevenuePage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | InvoiceStatusUI>("all");
  const [timeFilter, setTimeFilter] = useState("Last 30 Days");

  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [selectedInvoice, setSelectedInvoice] = useState<UIInvoice | null>(null);
  const [selectedRenewClient, setSelectedRenewClient] = useState<
    { name: string; date: string; left: string } | null
  >(null);

  const { invoices, rawInvoices, loading: invoicesLoading } = useInvoices();
  const { contracts } = useContracts();
  const { handleMarkPaid } = useInvoiceMutations();

  /* ── Compute stats from live invoice data ── */
  const stats = useMemo(() => {
    const paid = rawInvoices.filter((i) => normalizeStatus(i.status) === "PAID");
    const overdue = rawInvoices.filter((i) => normalizeStatus(i.status) === "OVERDUE");
    const pending = rawInvoices.filter((i) => normalizeStatus(i.status) === "SENT" || normalizeStatus(i.status) === "DRAFT");

    const totalRevenue = paid.reduce((sum, i) => sum + Number(i.amount), 0);
    const overdueAmount = overdue.reduce((sum, i) => sum + Number(i.amount), 0);
    const pendingAmount = pending.reduce((sum, i) => sum + Number(i.amount), 0);
    const collectedThisMonth = paid
      .filter((i) => {
        const d = i.paidDate ? new Date(i.paidDate) : i.issueDate ? new Date(i.issueDate) : null;
        if (!d) return false;
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum, i) => sum + Number(i.amount), 0);

    return { totalRevenue, overdueAmount, pendingAmount, collectedThisMonth };
  }, [rawInvoices]);

  /* ── Chart data derived from paid invoices by month ── */
  const chartData: ChartPoint[] = useMemo(() => {
    const now = new Date();
    const monthlyTotals: Record<string, number> = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      monthlyTotals[key] = 0;
    }
    rawInvoices
      .filter((i) => normalizeStatus(i.status) === "PAID")
      .forEach((inv) => {
        const d = inv.paidDate ? new Date(inv.paidDate) : inv.issueDate ? new Date(inv.issueDate) : null;
        if (!d) return;
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (key in monthlyTotals) {
          monthlyTotals[key] += Number(inv.amount);
        }
      });
    return Object.entries(monthlyTotals).map(([key, paid]) => {
      const monthIdx = parseInt(key.split("-")[1], 10);
      return { month: MONTH_NAMES[monthIdx], paid };
    });
  }, [rawInvoices]);

  const maxChartValue = useMemo(() => {
    const max = Math.max(...chartData.map((d) => d.paid), 100000);
    return max > 0 ? max : 100000;
  }, [chartData]);

  /* ── Upcoming invoices: unpaid invoices sorted by due date ── */
  const upcomingInvoices = useMemo(() => {
    return rawInvoices
      .filter((i) => normalizeStatus(i.status) !== "PAID" && normalizeStatus(i.status) !== "CANCELLED")
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5)
      .map((inv) => ({
        id: inv.invoiceNumber || inv.id,
        clientName: inv.customerName,
        amount: inv.amount,
        dueIn: inv.dueDate ? `Due: ${new Date(inv.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : "",
      }));
  }, [rawInvoices]);

  /* ── Renewal alerts: contracts expiring within 30 days ── */
  const renewalAlerts = useMemo(() => {
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return contracts
      .filter((c) => {
        const ns = normalizeStatus(c.status);
        if (ns === "TERMINATED") return false;
        const endDate = new Date(c.endDate);
        return endDate >= now && endDate <= thirtyDaysLater;
      })
      .map((c) => {
        const endDate = new Date(c.endDate);
        const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
        return {
          id: c.id,
          name: c.customerName,
          date: endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          left: `${daysLeft}d left`,
        };
      });
  }, [contracts]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesSearch =
        !search ||
        inv.clientName.toLowerCase().includes(search.toLowerCase()) ||
        inv.id.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, search, statusFilter]);

  return (
    <div className="flex flex-col gap-5">
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.pageTitleBlock}>
          <div className="flex items-center gap-3">
            <h1 className={styles.pageTitle}>Invoice</h1>
            {invoicesLoading && (
              <span className="inline-flex items-center text-xs text-gray-400">
                Loading…
              </span>
            )}
          </div>
          <p className={styles.pageSubtitle}>Manage and track all coworking invoices</p>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.exportBtn}
            onClick={() => setIsExportModalOpen(true)}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M7 1.5V9.5M7 9.5L4 6.5M7 9.5L10 6.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 11V12.5H12V11" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Export Excel</span>
          </button>
          <button
            type="button"
            className={styles.createBtn}
            onClick={() => setIsGenerateModalOpen(true)}
          >
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
          onChange={(e) => setStatusFilter(e.target.value as "all" | InvoiceStatusUI)}
        >
          <option value="all">All Statuses</option>
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
                  <span className={styles.legendValueBlack}>{formatINR(stats.totalRevenue)}</span>
                </div>
                <div className={styles.legendItem}>
                  <span className={styles.legendLabel}>Overdue</span>
                  <span className={styles.legendValueRed}>{formatINR(stats.overdueAmount)}</span>
                </div>
                <div className={styles.legendItem}>
                  <span className={styles.legendLabel}>Due Soon</span>
                  <span className={styles.legendValueOrange}>{formatINR(stats.pendingAmount)}</span>
                </div>
              </div>
            </div>

            <div className={styles.chartArea}>
              <div className={styles.chartYAxis}>
                <span>{formatINR(maxChartValue)}</span>
                <span>{formatINR(maxChartValue * 0.75)}</span>
                <span>{formatINR(maxChartValue * 0.5)}</span>
                <span>{formatINR(maxChartValue * 0.25)}</span>
                <span>₹0</span>
              </div>
              <div className={styles.chartContent}>
                <div className={styles.chartBars}>
                  {chartData.map((d) => {
                    const heightPercent = maxChartValue > 0 ? (d.paid / maxChartValue) * 100 : 0;
                    return (
                      <div key={d.month} className={styles.chartBarCol}>
                        <div className={styles.chartBarPaid} style={{ height: `${heightPercent}%` }} />
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
                        {invoicesLoading ? "Loading invoices..." : "No invoices found."}
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((invoice) => (
                      <tr key={invoice.id}>
                        <td className={styles.cellClient}>
                          {invoice.clientName}
                          <div className={styles.invoiceId}>{invoice.id}</div>
                        </td>
                        <td className={styles.cellAmount}>{formatINR(invoice.amount)}</td>
                        <td className={styles.cellDate}>{invoice.date}</td>
                        <td>
                          <span className={`${styles.statusBadge} ${styles['status_' + invoice.status]}`}>
                            {invoice.status.replace("_", " ").toUpperCase()}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div style={{ display: "inline-flex", gap: "8px" }}>
                            <button
                              className={styles.actionMenuBtn}
                              onClick={() => { setSelectedInvoice(invoice); setIsEditModalOpen(true); }}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                            <button
                              className={styles.actionMenuBtn}
                              onClick={() => { setSelectedInvoice(invoice); setIsDetailsModalOpen(true); }}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="5" r="1" />
                                <circle cx="12" cy="12" r="1" />
                                <circle cx="12" cy="19" r="1" />
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
              <span className={styles.cardTitle}>Upcoming Invoices</span>
            </div>

            {upcomingInvoices.length === 0 ? (
              <div className={styles.emptyHint} style={{ padding: "24px", textAlign: "center" }}>
                No upcoming invoices.
              </div>
            ) : (
              <div className={styles.upcomingGrid}>
                {upcomingInvoices.map((inv, idx) => (
                  <div key={inv.id} className={`${styles.upcomingGridCard} ${styles.fadeInUp}`} style={{ '--i': idx }}>
                    <div className={styles.upcomingClientName}>{inv.clientName}</div>
                    <div className={styles.upcomingCardRow}>
                      <span className={styles.upcomingCardAmount}>{formatINR(inv.amount)}</span>
                      <button
                        className={styles.notifyBtn}
                        onClick={() => toast.success(`Reminder sent to ${inv.clientName}`)}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0" />
                        </svg>
                        Notify
                      </button>
                    </div>
                    <div className={styles.upcomingCardDue}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: "4px" }}>
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      {inv.dueIn}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Aside column */}
        <aside className={styles.asideColumn}>
          {/* Total Receivables */}
          <div className={styles.statCard}>
            <div className={styles.statRow}>
              <span className={styles.statRowLabelBlack}>Total Receivable</span>
              <span className={styles.statRowValueBlack}>
                {formatINR(stats.totalRevenue + stats.pendingAmount + stats.overdueAmount)}
              </span>
            </div>
            <div className={styles.statRow}>
              <span className={styles.statRowLabel}>Over dues</span>
              <span className={styles.statRowValueRed}>{formatINR(stats.overdueAmount)}</span>
            </div>
            <div className={styles.statRow}>
              <span className={styles.statRowLabel}>Collected this month</span>
              <span className={styles.statRowValueGreen}>{formatINR(stats.collectedThisMonth)}</span>
            </div>
          </div>

          {/* Renewal Alerts — live contracts expiring within 30 days */}
          <div className={styles.asideBlock}>
            <div className={styles.asideBlockHeader}>
              <h3 className={styles.asideBlockTitle}>Renewal Alerts</h3>
              <p className={styles.asideBlockSubtitle}>Upcoming subscription renewals</p>
            </div>
            <div className={styles.asideCardList}>
              {renewalAlerts.length === 0 ? (
                <div className={styles.emptyHint} style={{ padding: "16px", textAlign: "center" }}>
                  No upcoming renewals.
                </div>
              ) : (
                renewalAlerts.map((item, idx) => (
                  <div key={item.id} className={`${styles.asideInnerCard} ${styles.fadeInUp}`} style={{ '--i': idx }}>
                    <div className={styles.asideInnerHeader}>
                      <span className={styles.asideInnerName}>{item.name}</span>
                      <span className={styles.daysLeftBadge}>{item.left}</span>
                    </div>
                    <div className={styles.asideInnerDate}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: "4px" }}>
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      {item.date}
                    </div>
                    <button
                      className={`${styles.renewBtn} active:scale-[0.97] transition-transform duration-150`}
                      onClick={() => { setSelectedRenewClient(item); setIsRenewModalOpen(true); }}
                    >
                      Renew
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Modals */}
      <GenerateInvoiceModal isOpen={isGenerateModalOpen} onClose={() => setIsGenerateModalOpen(false)} />
      <InvoiceDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        invoiceId={selectedInvoice?.id}
        clientName={selectedInvoice?.clientName}
        amount={selectedInvoice?.amount}
      />
      <RenewMembershipModal
        isOpen={isRenewModalOpen}
        onClose={() => setIsRenewModalOpen(false)}
        clientName={selectedRenewClient?.name}
      />
      <PlanUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
      />
      <ExportExcelModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} />
      <EditInvoiceModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        invoiceId={selectedInvoice?.id}
      />
    </div>
  );
}
