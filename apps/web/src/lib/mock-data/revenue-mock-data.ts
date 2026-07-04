/**
 * File:        apps/web/src/lib/mock-data/revenue-mock-data.ts
 * Module:      Web · Mock Data · Revenue
 * Purpose:     Demo/fallback data for the Revenue section. All pages under
 *              /dashboard/revenue consume these constants when the Apollo
 *              query returns null or an empty array (e.g. backend is down,
 *              auth token is missing, or running in offline/demo mode).
 *
 *              Each export is used as a <source-of-truth> fallback so
 *              the UI never breaks — it simply shows the DEMO_BADGE.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-02
 */

import { DEMO_BADGE } from './crm-mock-data';

// Re-export so callers can import DEMO_BADGE from here too
export { DEMO_BADGE };

/* ──────────────────────────────────────────────────
 * Enums (mirrors backend enums — use exact string values)
 * ────────────────────────────────────────────────── */

export type InvoiceStatus = 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Cancelled';
export type DepositStatus = 'Held' | 'Released' | 'Refunded';
export type DepositType   = 'Security' | 'Advance' | 'Other';
export type ContractStatus = 'Active' | 'Expiring Soon' | 'Expired' | 'Terminated';
export type PaymentFrequency = 'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Yearly';

/* ──────────────────────────────────────────────────
 * Invoice type
 * ────────────────────────────────────────────────── */

export interface MockInvoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  centerId?: string;
  planName?: string;
  amount: number;
  tax?: number;
  totalAmount: number;
  status: InvoiceStatus;
  issueDate: string;   // ISO date string for display
  dueDate: string;
  paidDate?: string;
  paymentMethod?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  /** Signals this item is mock data; used to show per-item badge */
  __isDemo?: boolean;
}

/* ──────────────────────────────────────────────────
 * Deposit type
 * ────────────────────────────────────────────────── */

export interface MockDeposit {
  id: string;
  customerId: string;
  customerName: string;
  centerId?: string;
  amount: number;
  type: DepositType;
  status: DepositStatus;
  referenceNumber: string;
  receivedDate: string;
  releasedDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  __isDemo?: boolean;
}

/* ──────────────────────────────────────────────────
 * Contract type
 * ────────────────────────────────────────────────── */

export interface MockContract {
  id: string;
  contractNumber: string;
  customerId: string;
  customerName: string;
  centerId?: string;
  planName?: string;
  startDate: string;
  endDate: string;
  status: ContractStatus;
  amount: number;
  paymentFrequency: PaymentFrequency;
  autoRenew: boolean;
  terms?: string;
  createdAt: string;
  updatedAt: string;
  __isDemo?: boolean;
}

/* ──────────────────────────────────────────────────
 * Revenue aggregate stats
 * ────────────────────────────────────────────────── */

export interface MockRevenueStats {
  totalRevenue: number;
  pendingInvoices: number;
  pendingAmount: number;
  activeContracts: number;
  totalDepositsHeld: number;
  overdueInvoices: number;
  overdueAmount: number;
  collectedThisMonth: number;
  __isDemo?: boolean;
}

/* ──────────────────────────────────────────────────
 * Mock Invoices
 * ────────────────────────────────────────────────── */

export const MOCK_INVOICES: MockInvoice[] = [
  {
    id: 'inv-001',
    invoiceNumber: 'INV-2026-001',
    customerId: 'cust-001',
    customerName: 'TechStart Co.',
    customerEmail: 'billing@techstart.io',
    planName: 'Premium Desk',
    amount: 45000,
    tax: 4050,
    totalAmount: 49050,
    status: 'Paid',
    issueDate: '2026-04-10',
    dueDate: '2026-05-10',
    paidDate: '2026-04-18',
    paymentMethod: 'UPI',
    createdAt: '2026-04-10T10:00:00Z',
    updatedAt: '2026-04-18T14:30:00Z',
    __isDemo: true,
  },
  {
    id: 'inv-002',
    invoiceNumber: 'INV-2026-002',
    customerId: 'cust-002',
    customerName: 'Creative Studio',
    customerEmail: 'accounts@creativestudio.in',
    planName: 'Private Office',
    amount: 62000,
    tax: 5580,
    totalAmount: 67580,
    status: 'Overdue',
    issueDate: '2026-04-12',
    dueDate: '2026-05-12',
    paymentMethod: undefined,
    notes: 'Reminder sent on May 15',
    createdAt: '2026-04-12T09:00:00Z',
    updatedAt: '2026-05-15T11:00:00Z',
    __isDemo: true,
  },
  {
    id: 'inv-003',
    invoiceNumber: 'INV-2026-003',
    customerId: 'cust-003',
    customerName: 'Design Labs',
    customerEmail: 'finance@designlabs.co',
    planName: 'Flexi Desk',
    amount: 38000,
    tax: 3420,
    totalAmount: 41420,
    status: 'Sent',
    issueDate: '2026-04-15',
    dueDate: '2026-05-15',
    createdAt: '2026-04-15T10:30:00Z',
    updatedAt: '2026-04-15T10:30:00Z',
    __isDemo: true,
  },
  {
    id: 'inv-004',
    invoiceNumber: 'INV-2026-004',
    customerId: 'cust-004',
    customerName: 'Innovate Inc.',
    customerEmail: 'ap@Innovateinc.com',
    planName: 'Premium Desk',
    amount: 55000,
    tax: 4950,
    totalAmount: 59950,
    status: 'Paid',
    issueDate: '2026-04-16',
    dueDate: '2026-05-16',
    paidDate: '2026-04-22',
    paymentMethod: 'Net Banking',
    createdAt: '2026-04-16T08:00:00Z',
    updatedAt: '2026-04-22T16:00:00Z',
    __isDemo: true,
  },
  {
    id: 'inv-005',
    invoiceNumber: 'INV-2026-005',
    customerId: 'cust-005',
    customerName: 'StartUp Hub',
    customerEmail: 'finance@startuphub.io',
    planName: 'Dedicated Desk',
    amount: 42000,
    tax: 3780,
    totalAmount: 45780,
    status: 'Draft',
    issueDate: '2026-04-18',
    dueDate: '2026-05-18',
    createdAt: '2026-04-18T11:00:00Z',
    updatedAt: '2026-04-18T11:00:00Z',
    __isDemo: true,
  },
  {
    id: 'inv-006',
    invoiceNumber: 'INV-2026-006',
    customerId: 'cust-006',
    customerName: 'Digital Agency',
    customerEmail: 'billing@digitalagency.dev',
    planName: 'Private Office',
    amount: 71000,
    tax: 6390,
    totalAmount: 77390,
    status: 'Sent',
    issueDate: '2026-04-20',
    dueDate: '2026-05-20',
    createdAt: '2026-04-20T09:30:00Z',
    updatedAt: '2026-04-20T09:30:00Z',
    __isDemo: true,
  },
  {
    id: 'inv-007',
    invoiceNumber: 'INV-2026-007',
    customerId: 'cust-007',
    customerName: 'Acme Corporation',
    customerEmail: 'accounts@acmecorp.com',
    planName: 'Enterprise Suite',
    amount: 120000,
    tax: 10800,
    totalAmount: 130800,
    status: 'Sent',
    issueDate: '2026-06-01',
    dueDate: '2026-06-30',
    createdAt: '2026-06-01T10:00:00Z',
    updatedAt: '2026-06-01T10:00:00Z',
    __isDemo: true,
  },
  {
    id: 'inv-008',
    invoiceNumber: 'INV-2026-008',
    customerId: 'cust-008',
    customerName: 'Global Ventures',
    customerEmail: 'finance@globalventures.net',
    planName: 'Private Office',
    amount: 85000,
    tax: 7650,
    totalAmount: 92650,
    status: 'Sent',
    issueDate: '2026-06-02',
    dueDate: '2026-07-02',
    createdAt: '2026-06-02T08:00:00Z',
    updatedAt: '2026-06-02T08:00:00Z',
    __isDemo: true,
  },
];

/* ──────────────────────────────────────────────────
 * Mock Deposits
 * ────────────────────────────────────────────────── */

export const MOCK_DEPOSITS: MockDeposit[] = [
  {
    id: 'dep-001',
    customerId: 'cust-001',
    customerName: 'TechStart Co.',
    amount: 100000,
    type: 'Security',
    status: 'Held',
    referenceNumber: 'DEP-2026-001',
    receivedDate: '2026-01-15',
    notes: 'Refundable security deposit',
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-01-15T10:00:00Z',
    __isDemo: true,
  },
  {
    id: 'dep-002',
    customerId: 'cust-002',
    customerName: 'Creative Studio',
    amount: 50000,
    type: 'Advance',
    status: 'Held',
    referenceNumber: 'DEP-2026-002',
    receivedDate: '2026-02-01',
    notes: '3-month advance rent',
    createdAt: '2026-02-01T09:00:00Z',
    updatedAt: '2026-02-01T09:00:00Z',
    __isDemo: true,
  },
  {
    id: 'dep-003',
    customerId: 'cust-003',
    customerName: 'Design Labs',
    amount: 75000,
    type: 'Security',
    status: 'Released',
    referenceNumber: 'DEP-2026-003',
    receivedDate: '2025-10-10',
    releasedDate: '2026-04-10',
    notes: 'Returned after contract termination',
    createdAt: '2025-10-10T10:00:00Z',
    updatedAt: '2026-04-10T14:00:00Z',
    __isDemo: true,
  },
  {
    id: 'dep-004',
    customerId: 'cust-004',
    customerName: 'Innovate Inc.',
    amount: 120000,
    type: 'Security',
    status: 'Held',
    referenceNumber: 'DEP-2026-004',
    receivedDate: '2026-03-01',
    notes: 'Premium security deposit',
    createdAt: '2026-03-01T11:00:00Z',
    updatedAt: '2026-03-01T11:00:00Z',
    __isDemo: true,
  },
  {
    id: 'dep-005',
    customerId: 'cust-006',
    customerName: 'Digital Agency',
    amount: 60000,
    type: 'Other',
    status: 'Refunded',
    referenceNumber: 'DEP-2026-005',
    receivedDate: '2025-08-15',
    releasedDate: '2026-02-15',
    notes: 'Equipment deposit — refunded',
    createdAt: '2025-08-15T08:00:00Z',
    updatedAt: '2026-02-15T10:00:00Z',
    __isDemo: true,
  },
];

/* ──────────────────────────────────────────────────
 * Mock Contracts
 * ────────────────────────────────────────────────── */

export const MOCK_CONTRACTS: MockContract[] = [
  {
    id: 'cnt-001',
    contractNumber: 'CNT-2026-001',
    customerId: 'cust-001',
    customerName: 'TechStart Co.',
    planName: 'Premium Desk',
    startDate: '2026-01-01',
    endDate: '2027-01-01',
    status: 'Active',
    amount: 540000,
    paymentFrequency: 'Yearly',
    autoRenew: true,
    terms: 'Annual premium desk contract with 2-month notice period',
    createdAt: '2025-12-20T10:00:00Z',
    updatedAt: '2026-01-01T09:00:00Z',
    __isDemo: true,
  },
  {
    id: 'cnt-002',
    contractNumber: 'CNT-2026-002',
    customerId: 'cust-002',
    customerName: 'Creative Studio',
    planName: 'Private Office',
    startDate: '2026-02-01',
    endDate: '2026-07-31',
    status: 'Expiring Soon',
    amount: 372000,
    paymentFrequency: 'Monthly',
    autoRenew: false,
    terms: '6-month private office lease, rolling monthly thereafter',
    createdAt: '2026-01-25T10:00:00Z',
    updatedAt: '2026-01-25T10:00:00Z',
    __isDemo: true,
  },
  {
    id: 'cnt-003',
    contractNumber: 'CNT-2026-003',
    customerId: 'cust-004',
    customerName: 'Innovate Inc.',
    planName: 'Premium Desk',
    startDate: '2026-03-01',
    endDate: '2027-03-01',
    status: 'Active',
    amount: 660000,
    paymentFrequency: 'Yearly',
    autoRenew: true,
    terms: 'Annual dedicated desk contract',
    createdAt: '2026-02-20T11:00:00Z',
    updatedAt: '2026-03-01T09:00:00Z',
    __isDemo: true,
  },
  {
    id: 'cnt-004',
    contractNumber: 'CNT-2025-004',
    customerId: 'cust-003',
    customerName: 'Design Labs',
    planName: 'Flexi Desk',
    startDate: '2025-07-01',
    endDate: '2026-06-30',
    status: 'Expired',
    amount: 180000,
    paymentFrequency: 'Quarterly',
    autoRenew: false,
    terms: 'Annual flexi desk contract — expired, not renewed',
    createdAt: '2025-06-15T10:00:00Z',
    updatedAt: '2026-06-30T23:59:59Z',
    __isDemo: true,
  },
  {
    id: 'cnt-005',
    contractNumber: 'CNT-2026-005',
    customerId: 'cust-007',
    customerName: 'Acme Corporation',
    planName: 'Enterprise Suite',
    startDate: '2026-06-01',
    endDate: '2028-06-01',
    status: 'Active',
    amount: 2400000,
    paymentFrequency: 'Half-Yearly',
    autoRenew: true,
    terms: '2-year enterprise suite contract with half-yearly billing',
    createdAt: '2026-05-20T10:00:00Z',
    updatedAt: '2026-06-01T09:00:00Z',
    __isDemo: true,
  },
];

/* ──────────────────────────────────────────────────
 * Mock Revenue Stats
 * ────────────────────────────────────────────────── */

export const MOCK_REVENUE_STATS: MockRevenueStats = {
  totalRevenue: 654200,
  pendingInvoices: 5,
  pendingAmount: 128500,
  activeContracts: 3,
  totalDepositsHeld: 270000,
  overdueInvoices: 1,
  overdueAmount: 67580,
  collectedThisMonth: 109000,
  __isDemo: true,
};

/* ──────────────────────────────────────────────────
 * Helper: compute stats from mock invoices (used by
 * revenue page stat cards when no live data is loaded)
 * ────────────────────────────────────────────────── */

export function computeRevenueStats(invoices: MockInvoice[]): MockRevenueStats {
  const paid    = invoices.filter(i => i.status === 'Paid');
  const overdue = invoices.filter(i => i.status === 'Overdue');
  const pending = invoices.filter(i => i.status === 'Sent' || i.status === 'Draft');

  return {
    totalRevenue: paid.reduce((sum, i) => sum + i.totalAmount, 0),
    pendingInvoices: pending.length,
    pendingAmount: pending.reduce((sum, i) => sum + i.totalAmount, 0),
    activeContracts: MOCK_CONTRACTS.filter(c => c.status === 'Active').length,
    totalDepositsHeld: MOCK_DEPOSITS.filter(d => d.status === 'Held').reduce((s, d) => s + d.amount, 0),
    overdueInvoices: overdue.length,
    overdueAmount: overdue.reduce((sum, i) => sum + i.totalAmount, 0),
    collectedThisMonth: paid
      .filter(i => i.paidDate?.startsWith('2026-04'))
      .reduce((sum, i) => sum + i.totalAmount, 0),
    __isDemo: true,
  };
}
