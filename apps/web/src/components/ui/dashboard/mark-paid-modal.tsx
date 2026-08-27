"use client";

/**
 * File:        apps/web/src/components/ui/dashboard/mark-paid-modal.tsx
 * Module:      Web · Dashboard · Revenue · Mark Paid Modal
 * Purpose:     Replaces the bare "Mark Paid" action with a two-path flow:
 *              1. Pay Online (Razorpay) — createPaymentOrder → Razorpay
 *                 Checkout → verifyPayment (signature checked server-side).
 *              2. Record Offline Payment — markInvoicePaid with the chosen
 *                 method (UPI/Cash/Cheque/Net banking/Bank transfer/…).
 *
 * Author:      ZCode
 * Last-updated: 2026-08-27
 */

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { toast } from "sonner";
import {
  GET_INVOICES,
  GET_PAYMENT_CONFIG,
  MARK_INVOICE_PAID,
  CREATE_PAYMENT_ORDER,
  VERIFY_PAYMENT,
} from "@/lib/apollo/operations";

interface RazorpayInstance {
  open: () => void;
}

type RazorpayCtor = new (options: Record<string, unknown>) => RazorpayInstance;

type RazorpayWindow = typeof window & {
  Razorpay?: RazorpayCtor;
};

export interface MarkPaidInvoice {
  id: string;
  invoiceNumber?: string | null;
  customerName?: string | null;
  totalAmount?: number | null;
  amount?: number | null;
}

interface MarkPaidModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: MarkPaidInvoice | null;
  /** Called after a successful offline mark-paid or a verified online payment. */
  onPaid?: () => void;
}

const PAYMENT_METHODS: { value: string; label: string }[] = [
  { value: "UPI", label: "UPI" },
  { value: "CASH", label: "Cash" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "NET_BANKING", label: "Net Banking" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "CARD", label: "Card" },
  { value: "WALLET", label: "Wallet" },
];

const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";

/** Injects the Razorpay Checkout <script> once and resolves when it is usable. */
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }
    const w = window as RazorpayWindow;
    if (w.Razorpay) {
      resolve(true);
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${RAZORPAY_SCRIPT_URL}"]`,
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(!!w.Razorpay));
      existing.addEventListener("error", () => resolve(false));
      return;
    }
    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(!!w.Razorpay);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const formatINR = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

export function MarkPaidModal({ isOpen, onClose, invoice, onPaid }: MarkPaidModalProps) {
  const [view, setView] = useState<"choose" | "online" | "offline">("choose");
  const [method, setMethod] = useState<string>("UPI");
  const [busy, setBusy] = useState(false);

  const { data: paymentConfigData } = useQuery(GET_PAYMENT_CONFIG, {
    skip: !isOpen,
  });
  const paymentConfig = paymentConfigData?.paymentConfig as
    | { configured: boolean; keyId?: string | null; mode?: string | null }
    | undefined;

  const [markInvoicePaid] = useMutation(MARK_INVOICE_PAID, {
    refetchQueries: [{ query: GET_INVOICES }],
  });
  const [createPaymentOrder] = useMutation(CREATE_PAYMENT_ORDER);
  const [verifyPayment] = useMutation(VERIFY_PAYMENT, {
    refetchQueries: [{ query: GET_INVOICES }],
  });

  useEffect(() => {
    if (isOpen) {
      setView("choose");
      setMethod("UPI");
      setBusy(false);
    }
  }, [isOpen]);

  if (!isOpen || !invoice) return null;

  const dueAmount = invoice.totalAmount ?? invoice.amount ?? 0;
  const invoiceLabel = invoice.invoiceNumber ?? invoice.id;

  const handleOffline = async () => {
    setBusy(true);
    try {
      await markInvoicePaid({ variables: { id: invoice.id, paymentMethod: method } });
      const methodLabel = PAYMENT_METHODS.find((m) => m.value === method)?.label ?? method;
      toast.success(`Invoice marked as paid via ${methodLabel}`);
      onPaid?.();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to mark invoice as paid");
    } finally {
      setBusy(false);
    }
  };

  const handleOnline = async () => {
    if (!paymentConfig?.configured || !paymentConfig.keyId) return;
    setBusy(true);
    try {
      const loaded = await loadRazorpayScript();
      const w = window as RazorpayWindow;
      if (!loaded || !w.Razorpay) {
        toast.error("Could not load Razorpay checkout. Check your connection and try again.");
        return;
      }

      const { data } = await createPaymentOrder({
        variables: { amount: dueAmount, invoiceId: invoice.id },
      });
      const orderId = data?.createPaymentOrder as string | null | undefined;
      if (!orderId) {
        toast.error("Could not create payment order");
        return;
      }

      // The order already encodes the amount — no need to pass `amount` here.
      new w.Razorpay({
        key: paymentConfig.keyId,
        order_id: orderId,
        name: "SpaceJam",
        description: `Invoice ${invoiceLabel}`,
        handler: async (resp: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            await verifyPayment({
              variables: {
                input: {
                  razorpayOrderId: resp.razorpay_order_id,
                  razorpayPaymentId: resp.razorpay_payment_id,
                  razorpaySignature: resp.razorpay_signature,
                  invoiceId: invoice.id,
                },
              },
            });
            toast.success("Payment verified — invoice paid");
            onPaid?.();
            onClose();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Payment verification failed");
          }
        },
        modal: { ondismiss: () => {} },
      }).open();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start online payment");
    } finally {
      setBusy(false);
    }
  };

  const primaryBtn =
    "flex items-center justify-center gap-2 rounded-xl bg-[#FF6A2F] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#FF6A3D] transition-all shadow-sm disabled:opacity-50";
  const backBtn = "self-start text-sm text-[#4A5565] hover:underline";

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-6 pb-4">
          <div>
            <h2 className="text-xl font-semibold text-[#101828]">Mark Invoice Paid</h2>
            <p className="mt-1 text-sm text-[#4A5565]">
              {invoiceLabel}
              {invoice.customerName ? ` · ${invoice.customerName}` : ""} ·{" "}
              <span className="font-medium text-[#FF6A2F]">{formatINR(dueAmount)}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#6A7282] transition-colors hover:text-[#101828]"
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-4 px-6 pb-6">
          {view === "choose" && (
            <>
              <button
                onClick={() => setView("online")}
                className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3.5 text-left transition-all hover:border-[#FF6A2F] hover:bg-[#FFF7EB]"
              >
                <span className="text-sm font-medium text-[#101828]">Pay Online (Razorpay)</span>
                <span className="text-xs text-[#6A7282]">Card / UPI / Net banking</span>
              </button>
              <button
                onClick={() => setView("offline")}
                className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3.5 text-left transition-all hover:border-[#FF6A2F] hover:bg-[#FFF7EB]"
              >
                <span className="text-sm font-medium text-[#101828]">Record Offline Payment</span>
                <span className="text-xs text-[#6A7282]">Cash / Cheque / Transfer</span>
              </button>
            </>
          )}

          {view === "online" && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[#4A5565]">
                  Pay {formatINR(dueAmount)} via Razorpay
                </span>
                {paymentConfig?.mode === "test" && (
                  <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
                    TEST MODE
                  </span>
                )}
              </div>
              {!paymentConfig?.configured ? (
                <p className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-[#4A5565]">
                  Online payments are not configured yet (Settings → Integrations)
                </p>
              ) : (
                <button onClick={handleOnline} disabled={busy} className={primaryBtn}>
                  {busy ? "Opening Razorpay…" : "Proceed to Pay"}
                </button>
              )}
              <button onClick={() => setView("choose")} className={backBtn}>
                ← Back
              </button>
            </>
          )}

          {view === "offline" && (
            <>
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-[#4A5565]">Payment method</span>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#FF6A2F]"
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </label>
              <button onClick={handleOffline} disabled={busy} className={primaryBtn}>
                {busy ? "Saving…" : "Mark as Paid"}
              </button>
              <button onClick={() => setView("choose")} className={backBtn}>
                ← Back
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
