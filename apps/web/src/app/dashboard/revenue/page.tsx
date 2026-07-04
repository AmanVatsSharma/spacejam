/**
 * File:        apps/web/src/app/dashboard/revenue/page.tsx
 * Module:      Web · Dashboard · Revenue
 * Purpose:     Revenue dashboard — Invoices, Deposits, Contracts management.
 *              Apollo-first with constant mock-data fallback so the page
 *              never breaks when the backend is unavailable.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-02
 */
"use client";

import { useMemo, useState, useCallback } from "react";
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
  gql,
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
  CREATE_INVOICE,
  CREATE_DEPOSIT,
  CREATE_CONTRACT,
  UPDATE_INVOICE,
  UPDATE_DEPOSIT,
  UPDATE_CONTRACT,
  INVOICE_COUNT,
} from "@/lib/apollo/operations";
import {
  MOCK_INVOICES,
  MOCK_DEPOSITS,
  MOCK_CONTRACTS,
  MOCK_REVENUE_STATS,
  computeRevenueStats,
  type MockInvoice,
  type MockDeposit,
  type MockContract,
  InvoiceStatus,
  DepositStatus,
  ContractStatus,
} from "@/lib/mock-data/revenue-mock-data";
import { DEMO_BADGE } from "@/lib/mock-data/crm-mock-data";

/* ──────────────────────────────────────────────────────────
 * GraphQL type-shapes (narrower than the full backend types —
 * we only select the fields the UI actually renders)
 * ────────────────────────────────────────────────────────── */

interface InvoiceRow {
  id: string;
  invoiceNumber: string;
  customerName: string;
  amount: number;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  paidDate?: string;
}

interface DepositRow {
  id: string;
  customerName: string;
  amount: number;
  type: string;
  status: DepositStatus;
  receivedDate: string;
  referenceNumber: string;
}

interface ContractRow {
  id: string;
  contractNumber: string;
  customerName: string;
  planName?: string;
  startDate: string;
  endDate: string;
  status: ContractStatus;
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
 * Local UI types (kept to avoid rewriting every className
 * and component reference in this page)
 * ────────────────────────────────────────────────────────── */

type InvoiceStatusUI = "paid" | "overdue" | "due_soon" | "occupied";
type DepositTypeUI = "Security" | "Advance" | "Other";

interface UIInvoice {
  id: string;
  clientName: string;
  amount: number;
  date: string;
  status: InvoiceStatusUI;
}

interface UIUpcomingInvoice {
  id: string;
  clientName: string;
  amount: number;
  dueIn: string;
}

interface ChartPoint {
  month: string;
  paid: number;
}

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

const upcomingInvoices: UIUpcomingInvoice[] = [
  { id: "INV-007", clientName: "Acme Corporation", amount: 55000, dueIn: "Due: March 30" },
  { id: "INV-008", clientName: "Global Ventures", amount: 40000, dueIn: "Due: April 2" },
  { id: "INV-009", clientName: "NextGen Tech", amount: 35000, dueIn: "Due: April 5" },
];

/* ──────────────────────────────────────────────────────────
 * Apollo hooks — each falls back to constant mock arrays
 * when the query returns null / [] (backend unreachable,
 * auth missing, or running in offline/demo mode)
 * ────────────────────────────────────────────────────────── */

function useInvoices() {
  const { data, loading, error } = useQuery<InvoicesResult>(GET_INVOICES);

  // Map backend fields → UI fields
  const invoices: UIInvoice[] = useMemo(() => {
    if (data?.invoices && data.invoices.length > 0) {
      return data.invoices.map((inv) => ({
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
    }
    // Fallback to mock — map InvoiceStatus → UI status
    return MOCK_INVOICES.map((inv) => ({
      id: inv.invoiceNumber,
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
  }, [data]);

  const isDemo = !data?.invoices?.length;

  return { invoices, loading, error, isDemo };
}

function useDeposits() {
  const { data, loading, error } = useQuery<{ deposits?: DepositRow[] }>(
    GET_DEPOSITS
  );

  const deposits: MockDeposit[] = useMemo(() => {
    if (data?.deposits && data.deposits.length > 0) {
      return data.deposits.map((d) => ({
        id: d.id,
        customerId: d.id,
        customerName: d.customerName,
        centerId: undefined,
        amount: d.amount,
        type: d.type as DepositTypeUI,
        status: d.status as DepositStatus,
        referenceNumber: d.referenceNumber,
        receivedDate: d.receivedDate,
        releasedDate: d.releasedDate,
        notes: undefined,
        createdAt: "",
        updatedAt: "",
        __isDemo: false,
      }));
    }
    return MOCK_DEPOSITS;
  }, [data]);

  const isDemo = !data?.deposits?.length;

  return { deposits, loading, error, isDemo };
}

function useContracts() {
  const { data, loading, error } = useQuery<{ contracts?: ContractRow[] }>(
    GET_CONTRACTS
  );

  const contracts: MockContract[] = useMemo(() => {
    if (data?.contracts && data.contracts.length > 0) {
      return data.contracts.map((c) => ({
        id: c.id,
        contractNumber: c.contractNumber,
        customerId: c.customerId,
        customerName: c.customerName,
        centerId: undefined,
        planName: c.planName,
        startDate: c.startDate,
        endDate: c.endDate,
        status: c.status as ContractStatus,
        amount: c.amount,
        paymentFrequency: c.paymentFrequency,
        autoRenew: c.autoRenew,
        terms: undefined,
        createdAt: "",
        updatedAt: "",
        __isDemo: false,
      }));
    }
    return MOCK_CONTRACTS;
  }, [data]);

  const isDemo = !data?.contracts?.length;

  return { contracts, loading, error, isDemo };
}

function useInvoiceCount() {
  const { data } = useQuery<InvoiceCountResult>(INVOICE_COUNT, {
    variables: { status: "Overdue" },
  });
  return data?.invoiceCount ?? MOCK_INVOICES.filter((i) => i.status === "Overdue").length;
}

/* ──────────────────────────────────────────────────────────
 * Helpers
 * ────────────────────────────────────────────────────────── */

function mapInvoiceStatus(backendStatus: InvoiceStatus): InvoiceStatusUI {
  switch (backendStatus) {
    case "Paid":
      return "paid";
    case "Overdue":
      return "overdue";
    case "Sent":
      return "due_soon";
    default:
      return "occupied";
  }
}

const formatCurrency = (n: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
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

/* ──────────────────────────────────────────────────────────
 * Mutations — disabled in demo mode
 * ────────────────────────────────────────────────────────── */

function useInvoiceMutations(isDemo: boolean) {
  const [markPaid] = useMutation(MARK_INVOICE_PAID, {
    refetchQueries: [{ query: GET_INVOICES }],
  });
  const [deleteInv] = useMutation(DELETE_INVOICE, {
    refetchQueries: [{ query: GET_INVOICES }],
  });

  const handleMarkPaid = useCallback(
    (id: string) => {
      if (isDemo) {
        alert("Demo mode: Invoice mutations are disabled. Connect the backend to enable live editing.");
        return;
      }
      void markPaid({ variables: { id } });
    },
    [isDemo, markPaid]
  );

  const handleDelete = useCallback(
    (id: string) => {
      if (isDemo) {
        alert("Demo mode: Invoice mutations are disabled. Connect the backend to enable live editing.");
        return;
      }
      void deleteInv({ variables: { id } });
    },
    [isDemo, deleteInv]
  );

  return { handleMarkPaid, handleDelete };
}

function useDepositMutations(isDemo: boolean) {
  const [release] = useMutation(RELEASE_DEPOSIT, {
    refetchQueries: [{ query: GET_DEPOSITS }],
  });
  const [del] = useMutation(DELETE_DEPOSIT, {
    refetchQueries: [{ query: GET_DEPOSITS }],
  });

  const handleRelease = useCallback(
    (id: string) => {
      if (isDemo) {
        alert("Demo mode: Deposit mutations are disabled. Connect the backend to enable live editing.");
        return;
      }
      void release({ variables: { id } });
    },
    [isDemo, release]
  );

  const handleDelete = useCallback(
    (id: string) => {
      if (isDemo) {
        alert("Demo mode: Deposit mutations are disabled. Connect the backend to enable live editing.");
        return;
      }
      void del({ variables: { id } });
    },
    [isDemo, del]
  );

  return { handleRelease, handleDelete };
}

function useContractMutations(isDemo: boolean) {
  const [terminate] = useMutation(TERMINATE_CONTRACT, {
    refetchQueries: [{ query: GET_CONTRACTS }],
  });

  const handleTerminate = useCallback(
    (id: string) => {
      if (isDemo) {
        alert("Demo mode: Contract mutations are disabled. Connect the backend to enable live editing.");
        return;
      }
      void terminate({ variables: { id } });
    },
    [isDemo, terminate]
  );

  return { handleTerminate };
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
  const [selectedUpgradeClient, setSelectedUpgradeClient] = useState<
    { name: string; plan: string; upsell: string } | null
  >(null);

  const {
    invoices,
    loading: invoicesLoading,
    error: invoicesError,
    isDemo: invoicesDemo,
  } = useInvoices();

  const {
    deposits,
    loading: depositsLoading,
    isDemo: depositsDemo,
  } = useDeposits();

  const {
    contracts,
    loading: contractsLoading,
    isDemo: contractsDemo,
  } = useContracts();

  const isDemo = invoicesDemo || depositsDemo || contractsDemo;
  const overdueCount = useInvoiceCount();
  const {
    handleMarkPaid,
    handleDelete: handleDeleteInvoice,
  } = useInvoiceMutations(isDemo);
  const { handleRelease, handleDelete: handleDeleteDeposit } =
    useDepositMutations(isDemo);
  const { handleTerminate } = useContractMutations(isDemo);

  /* ── Computed stats — uses mock totals when in demo mode ── */
  const stats = useMemo(() => {
    if (isDemo) return MOCK_REVENUE_STATS;
    const s = computeRevenueStats(
      MOCK_INVOICES /* replace with live invoice list when wired */
    );
    return { ...s, __isDemo: false };
  }, [isDemo]);

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

  const maxChartValue = 100000;

  return (
    <div className="flex flex-col gap-5">
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.pageTitleBlock}>
          <div className="flex items-center gap-3">
            <h1 className={styles.pageTitle}>Invoice</h1>
            {isDemo && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-300">
                Demo
              </span>
            )}
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
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                d="M7 1.5V9.5M7 9.5L4 6.5M7 9.5L10 6.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 11V12.5H12V11"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Export Excel</span>
          </button>
          <button
            type="button"
            className={styles.createBtn}
            onClick={() => {
              if (isDemo) {
                alert(
                  "Demo mode: Creating invoices is disabled. Connect the backend to enable live editing."
                );
                return;
              }
              setIsGenerateModalOpen(true);
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M7 2V12M2 7H12" strokeLinecap="round" />
            </svg>
            <span>Generate Invoice</span>
          </button>
        </div>
      </div>

      {/* Global Filter Bar */}
      <div className={styles.globalFilterBar}>
        <div className={styles.searchField}>
          <svg
            className={styles.searchIcon}
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
          >
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4" />
            <path
              d="M11 11L9.2 9.2"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
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
          onChange={(e) =>
            setStatusFilter(e.target.value as "all" | InvoiceStatusUI)
          }
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
                <span className={styles.cardSubtitle}>
                  Monthly revenue overview
                </span>
              </div>
              <div className={styles.legendWrapper}>
                <div className={styles.legendItem}>
                  <span className={styles.legendLabel}>Paid</span>
                  <span className={styles.legendValueBlack}>
                    {formatINR(stats.totalRevenue)}
                  </span>
                </div>
                <div className={styles.legendItem}>
                  <span className={styles.legendLabel}>Overdue</span>
                  <span className={styles.legendValueRed}>
                    {formatINR(stats.overdueAmount)}
                  </span>
                </div>
                <div className={styles.legendItem}>
                  <span className={styles.legendLabel}>Due Soon</span>
                  <span className={styles.legendValueOrange}>
                    {formatINR(stats.pendingAmount)}
                  </span>
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
            <div
              className={styles.cardTitleBlock}
              style={{ marginBottom: "20px" }}
            >
              <span className={styles.cardTitle}>Invoices</span>
              <span className={styles.cardSubtitle}>
                Overview of all client invoices
              </span>
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
                        <td className={styles.cellAmount}>
                          {formatINR(invoice.amount)}
                        </td>
                        <td className={styles.cellDate}>{invoice.date}</td>
                        <td>
                          <span
                            className={`${styles.statusBadge} ${styles['status_' + invoice.status]}`}
                          >
                            {invoice.status.replace("_", " ").toUpperCase()}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div style={{ display: "inline-flex", gap: "8px" }}>
                            <button
                              className={styles.actionMenuBtn}
                              onClick={() => {
                                setSelectedInvoice(invoice);
                                setIsEditModalOpen(true);
                              }}
                            >
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                            <button
                              className={styles.actionMenuBtn}
                              onClick={() => {
                                setSelectedInvoice(invoice);
                                setIsDetailsModalOpen(true);
                              }}
                            >
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
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
              <button className={styles.notifyAllBtn}>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0" />
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
                      <span className={styles.upcomingCardAmount}>
                        {formatINR(inv.amount)}
                      </span>
                      <button className={styles.notifyBtn}>
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0" />
                        </svg>
                        Notify
                      </button>
                    </div>
                    <div className={styles.upcomingCardDue}>
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        style={{ marginRight: "4px" }}
                      >
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
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
              <span className={styles.statRowValueBlack}>
                {formatINR(
                  stats.totalRevenue + stats.pendingAmount + stats.overdueAmount
                )}
              </span>
            </div>
            <div className={styles.statRow}>
              <span className={styles.statRowLabel}>Over dues</span>
              <span className={styles.statRowValueRed}>
                {formatINR(stats.overdueAmount)}
              </span>
            </div>
            <div className={styles.statRow}>
              <span className={styles.statRowLabel}>Collected this month</span>
              <span className={styles.statRowValueGreen}>
                {formatINR(stats.collectedThisMonth)}
              </span>
            </div>
          </div>

          {/* Renewal Alerts */}
          <div className={styles.asideBlock}>
            <div className={styles.asideBlockHeader}>
              <h3 className={styles.asideBlockTitle}>Renewal Alerts</h3>
              <p className={styles.asideBlockSubtitle}>
                Upcoming subscription renewals
              </p>
            </div>
            <div className={styles.asideCardList}>
              {[
                { name: "TechStart Co.", date: "Apr 20, 2026", left: "4d left" },
                {
                  name: "Creative Studio",
                  date: "Apr 25, 2026",
                  left: "9d left",
                },
                {
                  name: "Design Labs",
                  date: "Apr 28, 2026",
                  left: "12d left",
                },
              ].map((item, idx) => (
                <div key={idx} className={styles.asideInnerCard}>
                  <div className={styles.asideInnerHeader}>
                    <span className={styles.asideInnerName}>{item.name}</span>
                    <span className={styles.daysLeftBadge}>{item.left}</span>
                  </div>
                  <div className={styles.asideInnerDate}>
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      style={{ marginRight: "4px" }}
                    >
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    {item.date}
                  </div>
                  <button
                    className={styles.renewBtn}
                    onClick={() => {
                      setSelectedRenewClient(item);
                      setIsRenewModalOpen(true);
                    }}
                  >
                    Renew
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Upgrade Opportunities */}
          <div className={styles.asideBlock}>
            <div className={styles.asideBlockHeader}>
              <h3 className={styles.asideBlockTitle}>Upgrade Opportunities</h3>
              <p className={styles.asideBlockSubtitle}>
                Potential upsell clients
              </p>
            </div>
            <div className={styles.asideCardList}>
              {[
                { name: "StartUp Hub", plan: "Basic", upsell: "+$2400/mo" },
                {
                  name: "Digital Agency",
                  plan: "Standard",
                  upsell: "+$3600/mo",
                },
              ].map((item, idx) => (
                <div key={idx} className={styles.asideInnerCard}>
                  <div className={styles.asideInnerHeader}>
                    <span className={styles.asideInnerName}>{item.name}</span>
                  </div>
                  <div className={styles.upgradeRow}>
                    <span className={styles.upgradeCurrent}>
                      Current: <strong>{item.plan}</strong>
                    </span>
                    <button
                      className={styles.upgradeBtn}
                      onClick={() => {
                        setSelectedUpgradeClient(item);
                        setIsUpgradeModalOpen(true);
                      }}
                    >
                      Upgrade
                    </button>
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
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                </div>
                <div>
                  <div className={styles.activityTitle}>Payment Faild</div>
                  <div className={styles.activityDesc}>Pending Approvals</div>
                </div>
              </div>
              <div className={styles.activityItem}>
                <div className={styles.activityIconOrange}>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="6 9 6 2 18 2 18 9" />
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                    <rect x="6" y="14" width="12" height="8" />
                  </svg>
                </div>
                <div>
                  <div className={styles.activityTitle}>Printer Booked Today</div>
                  <div className={styles.activityDesc}>
                    Patel Enterprises printer bo.....
                  </div>
                </div>
              </div>
              <div className={styles.activityItem}>
                <div className={styles.activityIconRed}>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
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

      {/* Modals */}
      <GenerateInvoiceModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
      />

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
        clientName={selectedUpgradeClient?.name}
      />

      <ExportExcelModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />

      <EditInvoiceModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        invoiceId={selectedInvoice?.id}
      />
    </div>
  );
}
