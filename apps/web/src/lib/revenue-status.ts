/**
 * File:        apps/web/src/lib/revenue-status.ts
 * Module:      Web · Lib · Revenue Status Mapping
 * Purpose:     Maps backend GraphQL enum keys (UPPERCASE) to UI display
 *              labels and style keys. The backend registers enums via
 *              `registerEnumType` without a valuesMap, so GraphQL exposes
 *              the TypeScript enum KEYS (e.g. "OVERDUE"), not the runtime
 *              string values (e.g. "Overdue"). Client-side filters that
 *              compare against Title-Case silently break against live data,
 *              so all such comparisons must go through these maps.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-08
 */

// Backend returns UPPERCASE enum keys. Normalize any incoming status so that
// both legacy Title-Case mock data and live UPPERCASE data map to a single
// canonical key used by the style/label maps below.
export function normalizeStatus(raw: string | null | undefined): string {
  if (!raw) return '';
  const upper = raw.toUpperCase().replace(/ /g, '_').replace(/-/g, '_');
  return upper;
}

// ── InvoiceStatus ──────────────────────────────────────
export const invoiceStatusLabel: Record<string, string> = {
  DRAFT: 'Draft',
  SENT: 'Sent',
  PAID: 'Paid',
  OVERDUE: 'Overdue',
  CANCELLED: 'Cancelled',
};

export const invoiceStatusStyles: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  SENT: 'bg-blue-100 text-blue-700',
  PAID: 'bg-green-100 text-green-700',
  OVERDUE: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

// ── DepositStatus ──────────────────────────────────────
export const depositStatusLabel: Record<string, string> = {
  HELD: 'Held',
  RELEASED: 'Released',
  REFUNDED: 'Refunded',
  FROZEN: 'Frozen',
  RELEASE_REQUESTED: 'Release Requested',
};

export const depositStatusStyles: Record<string, string> = {
  HELD: 'bg-amber-100 text-amber-700',
  RELEASED: 'bg-green-100 text-green-700',
  REFUNDED: 'bg-blue-100 text-blue-700',
  FROZEN: 'bg-cyan-100 text-cyan-700',
  RELEASE_REQUESTED: 'bg-purple-100 text-purple-700',
};

// ── ContractStatus ─────────────────────────────────────
export const contractStatusLabel: Record<string, string> = {
  ACTIVE: 'Active',
  EXPIRING_SOON: 'Expiring Soon',
  EXPIRED: 'Expired',
  TERMINATED: 'Terminated',
};

export const contractStatusStyles: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  EXPIRING_SOON: 'bg-amber-100 text-amber-700',
  EXPIRED: 'bg-gray-100 text-gray-700',
  TERMINATED: 'bg-red-100 text-red-700',
};

// ── PaymentFrequency ───────────────────────────────────
export const paymentFrequencyLabel: Record<string, string> = {
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  HALF_YEARLY: 'Half-Yearly',
  YEARLY: 'Yearly',
};

// ── DepositType ────────────────────────────────────────
export const depositTypeLabel: Record<string, string> = {
  SECURITY: 'Security',
  ADVANCE: 'Advance',
  OTHER: 'Other',
};

// Convenience helpers for option lists in <select> filters
export const invoiceStatusOptions = Object.entries(invoiceStatusLabel).map(
  ([value, label]) => ({ value, label }),
);
export const depositStatusOptions = Object.entries(depositStatusLabel).map(
  ([value, label]) => ({ value, label }),
);
export const contractStatusOptions = Object.entries(contractStatusLabel).map(
  ([value, label]) => ({ value, label }),
);
