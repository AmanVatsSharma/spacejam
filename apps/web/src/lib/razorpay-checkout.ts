/**
 * File:        apps/web/src/lib/razorpay-checkout.ts
 * Module:      Web · Lib · Payments
 * Purpose:     One place that knows how to open Razorpay Checkout. Shared by the
 *              onboarding wizard, the pending-payments page and the invoice
 *              "mark paid" modal (they used to carry three copies of this).
 *
 *              The ORDER is always created by the server — this helper only
 *              displays it. `openRazorpayCheckout` resolves exactly once:
 *                paid        — the customer paid; the caller must now ask the
 *                              server to verify (never trust this client-side)
 *                dismissed   — the modal was closed without paying
 *                unavailable — the Checkout script could not be loaded
 *              A failed attempt inside the modal is only reported through
 *              `onAttemptFailed`: Razorpay lets the customer retry in the same
 *              modal, so it must not end the flow.
 *
 * Author:      Claude Sonnet 5.5
 * Last-updated: 2026-10-02
 */

export type RazorpayCheckoutOutcome =
  | { status: 'paid'; orderId: string; paymentId: string; signature: string }
  | { status: 'dismissed' }
  | { status: 'unavailable'; reason: string };

export interface RazorpayCheckoutOptions {
  /** Publishable key id (rzp_test_… / rzp_live_…). */
  keyId: string;
  /** Order id created by the server (order_…). */
  orderId: string;
  name?: string;
  description?: string;
  prefill?: { name?: string | null; email?: string | null; contact?: string | null };
  /** An attempt failed inside the modal (card declined, UPI timed out…). The modal stays open. */
  onAttemptFailed?: (reason: string) => void;
}

interface RazorpaySuccess {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}
interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: (payload: { error?: { description?: string } }) => void) => void;
}
type RazorpayCtor = new (options: Record<string, unknown>) => RazorpayInstance;
type RazorpayWindow = Window & { Razorpay?: RazorpayCtor };

const SCRIPT_ID = 'rzp-checkout-js';
const SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';
let loading: Promise<boolean> | null = null;

/** Load Checkout once; a failed load is retried on the next call. */
export function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  const w = window as RazorpayWindow;
  if (w.Razorpay) return Promise.resolve(true);
  if (loading) return loading;

  loading = new Promise<boolean>((resolve) => {
    const done = (ok: boolean) => {
      if (!ok) loading = null;
      resolve(ok);
    };
    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      existing.addEventListener('load', () => done(!!w.Razorpay));
      existing.addEventListener('error', () => done(false));
      return;
    }
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => done(!!w.Razorpay);
    script.onerror = () => {
      script.remove(); // so the next attempt can add a fresh tag
      done(false);
    };
    document.body.appendChild(script);
  });
  return loading;
}

export async function openRazorpayCheckout(opts: RazorpayCheckoutOptions): Promise<RazorpayCheckoutOutcome> {
  const loaded = await loadRazorpayScript();
  const Ctor = (window as RazorpayWindow).Razorpay;
  if (!loaded || !Ctor) {
    return {
      status: 'unavailable',
      reason: 'Could not load Razorpay Checkout. Check the internet connection and try again.',
    };
  }

  return new Promise<RazorpayCheckoutOutcome>((resolve) => {
    const rzp = new Ctor({
      key: opts.keyId,
      order_id: opts.orderId, // the amount is already fixed by the server on the order
      name: opts.name ?? 'SpaceJam',
      description: opts.description,
      prefill: {
        name: opts.prefill?.name ?? undefined,
        email: opts.prefill?.email ?? undefined,
        contact: opts.prefill?.contact ?? undefined,
      },
      theme: { color: '#FF6A2F' },
      handler: (resp: RazorpaySuccess) =>
        resolve({
          status: 'paid',
          orderId: resp.razorpay_order_id,
          paymentId: resp.razorpay_payment_id,
          signature: resp.razorpay_signature,
        }),
      modal: { ondismiss: () => resolve({ status: 'dismissed' }) },
    });
    rzp.on('payment.failed', (payload) => opts.onAttemptFailed?.(payload?.error?.description ?? 'The payment attempt failed.'));
    rzp.open();
  });
}
