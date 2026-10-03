/**
 * File:        apps/web/src/hooks/use-onboarding-payments.ts
 * Module:      Web · Hooks · Onboarding payments
 * Purpose:     Everything the UI needs for the onboarding payment lifecycle:
 *                usePaymentConfig         — what the super admin has set up
 *                                           (Razorpay, bank account, cheque payee)
 *                usePendingOnboardings    — applications still waiting on money
 *                useOnboardingPaymentActions — submit / retry / clear a cheque /
 *                                           bounce / cancel / finish an online payment
 *
 *              Money rules live on the SERVER; this layer only calls it and
 *              reports outcomes. In particular `completeOnline` opens Razorpay
 *              Checkout for an order the server created and then asks the server
 *              to VERIFY the result — the browser's "paid" is never trusted.
 *
 * Author:      Claude Sonnet 5.5
 * Last-updated: 2026-10-02
 */
import { useCallback, useMemo } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { toast } from 'sonner';
import {
  CANCEL_ONBOARDING,
  COLLECT_ONBOARDING_PAYMENT,
  CONFIRM_CHEQUE_CLEARED,
  CONFIRM_ONBOARDING_PAYMENT,
  GET_ONBOARDINGS,
  GET_PAYMENT_CONFIG,
  MARK_CHEQUE_BOUNCED,
  SUBMIT_ONBOARDING,
} from '@/lib/apollo/operations';
import { openRazorpayCheckout } from '@/lib/razorpay-checkout';

// ── types (mirror the GraphQL schema) ───────────────────────────────────────
export type OnboardingPaymentMethod = 'RAZORPAY' | 'BANK_TRANSFER' | 'CHEQUE';
export type OnboardingPaymentStatus = 'NOT_REQUIRED' | 'PENDING' | 'AWAITING_CLEARANCE' | 'PAID' | 'FAILED';
export type OnboardingOutcome = 'ONBOARDED' | 'PENDING_ONLINE_PAYMENT' | 'AWAITING_CHEQUE_CLEARANCE' | 'PAYMENT_FAILED';

export interface OnboardingPaymentInput {
  method: OnboardingPaymentMethod;
  cheque?: { chequeNumber: string; bankName: string; chequeDate: string };
  bankTransfer?: { utr: string; transferDate: string; payerBankName?: string };
}

export interface RazorpayCheckoutInfo {
  orderId: string;
  keyId: string;
  amountPaise: number;
  currency: string;
  description: string;
  prefillName?: string | null;
  prefillEmail?: string | null;
  prefillContact?: string | null;
}

export interface OnboardingResult {
  outcome: OnboardingOutcome;
  message: string;
  onboarding: {
    id: string;
    status: string;
    paymentStatus: OnboardingPaymentStatus;
    paymentMethod?: OnboardingPaymentMethod | null;
    paymentAmount?: number | null;
    paymentReference?: string | null;
    chequeNumber?: string | null;
    chequeBank?: string | null;
    chequeDate?: string | null;
    transferDate?: string | null;
    customerId?: string | null;
    leadId?: string | null;
    invoiceId?: string | null;
    failureReason?: string | null;
    cancelledAt?: string | null;
  };
  lead?: { id: string; status: string; customerId?: string | null } | null;
  customer?: { id: string; name: string; email: string } | null;
  razorpay?: RazorpayCheckoutInfo | null;
  seats?: { requested: number; booked: number; shortfall: number } | null;
}

export interface PaymentConfig {
  configured: boolean;
  keyId?: string | null;
  mode?: string | null;
  qrConfigured?: boolean;
  qrUpiId?: string | null;
  bankConfigured: boolean;
  bankAccountName?: string | null;
  bankAccountNumber?: string | null;
  bankIfsc?: string | null;
  bankName?: string | null;
  bankBranch?: string | null;
  chequeConfigured: boolean;
  chequePayeeName?: string | null;
  chequeInstructions?: string | null;
}

export interface PendingOnboarding {
  id: string;
  companyName?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  planType?: string | null;
  seatCount?: number | null;
  status: string;
  notes?: string | null;
  leadId?: string | null;
  customerId?: string | null;
  createdAt?: string | null;
  paymentStatus: OnboardingPaymentStatus;
  paymentMethod?: OnboardingPaymentMethod | null;
  paymentAmount?: number | null;
  paymentReference?: string | null;
  chequeNumber?: string | null;
  chequeBank?: string | null;
  chequeDate?: string | null;
  chequeClearedAt?: string | null;
  transferDate?: string | null;
  payerBank?: string | null;
  invoiceId?: string | null;
  failureReason?: string | null;
  cancelledAt?: string | null;
  center?: { id: string; name: string } | null;
  lead?: { id: string; name: string; status: string } | null;
}

// ── helpers ─────────────────────────────────────────────────────────────────
/** Best human-readable message from an Apollo / network / thrown error. */
export function errorMessage(err: unknown): string {
  const e = err as {
    graphQLErrors?: { message?: string }[];
    networkError?: { message?: string; result?: { errors?: { message?: string }[] } };
    message?: string;
  };
  return (
    e?.graphQLErrors?.[0]?.message ||
    e?.networkError?.result?.errors?.[0]?.message ||
    e?.networkError?.message ||
    e?.message ||
    'Something went wrong. Please try again.'
  );
}

export const formatInr = (n?: number | null): string =>
  `₹${Number(n ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const REFETCH = ['GetOnboardings', 'GetLeads', 'GetCustomers', 'GetInvoices'];

// ── queries ─────────────────────────────────────────────────────────────────
/** What the super admin configured in Settings → Integrations (bank/cheque are returned to staff only). */
export function usePaymentConfig() {
  const { data, loading, error, refetch } = useQuery<{ paymentConfig: PaymentConfig }>(GET_PAYMENT_CONFIG, {
    fetchPolicy: 'cache-and-network',
  });
  return { config: data?.paymentConfig ?? null, loading, error, refetch };
}

/**
 * Applications that still need money: online pending, cheque awaiting clearance, failed/bounced.
 * The SERVER decides what that means (`needsPayment`) across every row — filtering a page of
 * the newest onboardings here used to drop old pending cheques once enough newer ones existed.
 */
export function usePendingOnboardings(opts: { pollMs?: number } = {}) {
  const { data, loading, error, refetch } = useQuery<{ onboardings: PendingOnboarding[] }>(GET_ONBOARDINGS, {
    variables: { filters: { needsPayment: true, limit: 200 } },
    fetchPolicy: 'cache-and-network',
    pollInterval: opts.pollMs,
  });
  const pending = useMemo(() => data?.onboardings ?? [], [data]);
  return { pending, loading, error, refetch };
}

// ── actions ─────────────────────────────────────────────────────────────────
export type OnlinePaymentOutcome =
  | { kind: 'onboarded'; result: OnboardingResult }
  | {
      kind: 'not-paid';
      reason: 'dismissed' | 'unavailable' | 'verify-failed';
      message: string;
      result: OnboardingResult;
    };

export function useOnboardingPaymentActions() {
  const [submitMut] = useMutation(SUBMIT_ONBOARDING, { refetchQueries: REFETCH });
  const [confirmMut] = useMutation(CONFIRM_ONBOARDING_PAYMENT, { refetchQueries: REFETCH });
  const [collectMut] = useMutation(COLLECT_ONBOARDING_PAYMENT, { refetchQueries: REFETCH });
  const [clearMut] = useMutation(CONFIRM_CHEQUE_CLEARED, { refetchQueries: REFETCH });
  const [bounceMut] = useMutation(MARK_CHEQUE_BOUNCED, { refetchQueries: REFETCH });
  const [cancelMut] = useMutation(CANCEL_ONBOARDING, { refetchQueries: REFETCH });

  /** The whole wizard in one atomic, idempotent call. */
  const submit = useCallback(
    async (input: Record<string, unknown>): Promise<OnboardingResult> => {
      const { data } = await submitMut({ variables: { input } });
      return data.submitOnboarding as OnboardingResult;
    },
    [submitMut],
  );

  /** (Re)take payment on a pending application — any method. */
  const collect = useCallback(
    async (onboardingId: string, payment: OnboardingPaymentInput): Promise<OnboardingResult> => {
      const { data } = await collectMut({ variables: { onboardingId, payment } });
      return data.collectOnboardingPayment as OnboardingResult;
    },
    [collectMut],
  );

  const confirmCheque = useCallback(
    async (onboardingId: string, clearedOn?: string, remarks?: string): Promise<OnboardingResult> => {
      const { data } = await clearMut({
        variables: { onboardingId, clearedOn: clearedOn || null, remarks: remarks?.trim() || null },
      });
      return data.confirmChequeCleared as OnboardingResult;
    },
    [clearMut],
  );

  const bounceCheque = useCallback(
    async (onboardingId: string, reason: string) => {
      const { data } = await bounceMut({ variables: { onboardingId, reason } });
      return data.markChequeBounced as { id: string; paymentStatus: OnboardingPaymentStatus; failureReason?: string };
    },
    [bounceMut],
  );

  const cancel = useCallback(
    async (onboardingId: string, reason?: string) => {
      const { data } = await cancelMut({ variables: { onboardingId, reason: reason?.trim() || null } });
      return data.cancelOnboarding as { id: string; cancelledAt?: string };
    },
    [cancelMut],
  );

  /**
   * An application with an open Razorpay order: show Checkout, then have the
   * SERVER verify the result (signature + payment status + amount) and
   * provision the client. If the customer closes the modal, the application
   * simply stays pending — it can be retried from Pending payments, and a
   * payment that did go through is also picked up by the Razorpay webhook.
   */
  const completeOnline = useCallback(
    async (result: OnboardingResult): Promise<OnlinePaymentOutcome> => {
      const checkout = result.razorpay;
      if (!checkout) {
        return { kind: 'not-paid', reason: 'unavailable', message: result.message, result };
      }
      const outcome = await openRazorpayCheckout({
        keyId: checkout.keyId,
        orderId: checkout.orderId,
        description: checkout.description,
        prefill: { name: checkout.prefillName, email: checkout.prefillEmail, contact: checkout.prefillContact },
        onAttemptFailed: (reason) => toast.error(`Payment attempt failed: ${reason}`),
      });

      if (outcome.status === 'dismissed') {
        return {
          kind: 'not-paid',
          reason: 'dismissed',
          message: 'The payment was not completed. The application is saved — retry it from Pending payments.',
          result,
        };
      }
      if (outcome.status === 'unavailable') {
        return { kind: 'not-paid', reason: 'unavailable', message: outcome.reason, result };
      }

      try {
        const { data } = await confirmMut({
          variables: {
            input: {
              onboardingId: result.onboarding.id,
              razorpayOrderId: outcome.orderId,
              razorpayPaymentId: outcome.paymentId,
              razorpaySignature: outcome.signature,
            },
          },
        });
        return { kind: 'onboarded', result: data.confirmOnboardingPayment as OnboardingResult };
      } catch (err) {
        return {
          kind: 'not-paid',
          reason: 'verify-failed',
          message: `${errorMessage(err)} If the money was debited it will be matched automatically — check Pending payments in a minute.`,
          result,
        };
      }
    },
    [confirmMut],
  );

  return { submit, collect, confirmCheque, bounceCheque, cancel, completeOnline };
}
