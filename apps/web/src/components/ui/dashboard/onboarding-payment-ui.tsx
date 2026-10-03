"use client";

/**
 * File:        apps/web/src/components/ui/dashboard/onboarding-payment-ui.tsx
 * Module:      Web · Shared UI · Onboarding payments
 * Purpose:     The payment-method UI shared by the onboarding wizard (step 4) and
 *              the Pending payments page:
 *
 *                PaymentMethodPicker   Razorpay / Bank transfer / Cheque cards
 *                PaymentMethodDetails  method-specific panel + inputs. Shows the
 *                                      center's receiving bank account and the
 *                                      cheque payee exactly as the super admin
 *                                      configured them in Settings → Integrations
 *                validatePaymentForm   client-side mirror of the server rules
 *                                      (the server remains the authority)
 *                CollectPaymentDialog  (re)take payment on a pending application
 *                ConfirmChequeDialog   the bank cleared the cheque → client created
 *                BounceChequeDialog    cheque bounced → stays a cold lead
 *                CancelOnboardingDialog abandon a pending application
 *
 * Author:      Claude Sonnet 5.5
 * Last-updated: 2026-10-02
 */
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  errorMessage,
  formatInr,
  useOnboardingPaymentActions,
  type OnboardingPaymentInput,
  type OnboardingPaymentMethod,
  type OnboardingResult,
  type PaymentConfig,
  type PendingOnboarding,
} from "@/hooks/use-onboarding-payments";

// ───────────────────────── form model & validation ─────────────────────────

export interface PaymentFormState {
  method: OnboardingPaymentMethod;
  utr: string;
  transferDate: string;
  payerBank: string;
  chequeNumber: string;
  chequeBank: string;
  chequeDate: string;
}

export const todayIso = (): string => new Date().toISOString().slice(0, 10);

export const emptyPaymentForm = (method: OnboardingPaymentMethod = "RAZORPAY"): PaymentFormState => ({
  method,
  utr: "",
  transferDate: todayIso(),
  payerBank: "",
  chequeNumber: "",
  chequeBank: "",
  chequeDate: todayIso(),
});

/** The method to preselect: online if the super admin has set it up, else bank transfer. */
export const defaultMethod = (config: PaymentConfig | null): OnboardingPaymentMethod =>
  config?.configured ? "RAZORPAY" : "BANK_TRANSFER";

const dayDelta = (iso: string): number => {
  const d = new Date(`${iso}T00:00:00Z`);
  const t = new Date(`${todayIso()}T00:00:00Z`);
  return Math.round((d.getTime() - t.getTime()) / 86_400_000);
};
const isRealDate = (iso: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(iso) && !Number.isNaN(new Date(`${iso}T00:00:00Z`).getTime());

/** Mirrors the server's rules so mistakes are caught before a round trip. Returns an error message or null. */
export function validatePaymentForm(
  form: PaymentFormState,
  ctx: { amount: number; config: PaymentConfig | null },
): string | null {
  if (ctx.amount <= 0) return null; // nothing to collect
  switch (form.method) {
    case "RAZORPAY":
      if (!ctx.config?.configured) {
        return "Online payment is not set up yet. A super admin can add Razorpay under Settings → Integrations — or pick bank transfer / cheque.";
      }
      return null;
    case "BANK_TRANSFER": {
      if (!/^[A-Za-z0-9]{8,35}$/.test(form.utr.trim())) return "Enter the UTR / transaction reference of the transfer (8–35 letters or digits).";
      if (!isRealDate(form.transferDate)) return "Enter the date the transfer was made.";
      const d = dayDelta(form.transferDate);
      if (d > 1) return "The transfer date cannot be in the future.";
      if (d < -90) return "That transfer is more than 90 days old — check the date and UTR.";
      return null;
    }
    case "CHEQUE": {
      if (!/^\d{6,12}$/.test(form.chequeNumber.trim())) return "Cheque number must be 6–12 digits.";
      if (form.chequeBank.trim().length < 2) return "Enter the bank the cheque is drawn on.";
      if (!isRealDate(form.chequeDate)) return "Enter the date written on the cheque.";
      const d = dayDelta(form.chequeDate);
      if (d < -90) return "This cheque is stale (dated more than 90 days ago) — ask for a fresh one.";
      if (d > 90) return "A post-dated cheque can be at most 90 days ahead.";
      return null;
    }
  }
}

/** GraphQL input for the chosen method (undefined when there is nothing to collect). */
export function toPaymentInput(form: PaymentFormState, amount: number): OnboardingPaymentInput | undefined {
  if (amount <= 0) return undefined;
  if (form.method === "BANK_TRANSFER") {
    return {
      method: "BANK_TRANSFER",
      bankTransfer: {
        utr: form.utr.trim().toUpperCase(),
        transferDate: form.transferDate,
        ...(form.payerBank.trim() ? { payerBankName: form.payerBank.trim() } : {}),
      },
    };
  }
  if (form.method === "CHEQUE") {
    return {
      method: "CHEQUE",
      cheque: { chequeNumber: form.chequeNumber.trim(), bankName: form.chequeBank.trim(), chequeDate: form.chequeDate },
    };
  }
  return { method: "RAZORPAY" };
}

// ─────────────────────────────── small pieces ───────────────────────────────

const inputCls =
  "w-full h-11 px-4 border border-gray-200 rounded-lg text-[14px] text-gray-900 focus:outline-none focus:border-[#FF6A2F] focus:ring-1 focus:ring-[#FF6A2F] placeholder-gray-400 bg-white";
const labelCls = "block text-[12px] text-gray-700 font-medium mb-1.5";

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label className={labelCls}>
        {label} {required && <span className="text-[#FF6A2F]">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

function CopyButton({ value, label }: { value: string; label: string }) {
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          toast.success(`${label} copied`);
        } catch {
          toast.error("Could not copy — select and copy it manually");
        }
      }}
      className="text-[11px] font-semibold text-[#FF6A2F] hover:underline shrink-0"
    >
      Copy
    </button>
  );
}

function InfoRow({ label, value, copy }: { label: string; value?: string | null; copy?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 border-b border-[#F0F2F5] last:border-b-0">
      <span className="text-[12px] text-gray-500">{label}</span>
      <span className="flex items-center gap-3 min-w-0">
        <span className="text-[13px] font-semibold text-[#101828] truncate">{value}</span>
        {copy && <CopyButton value={value} label={label} />}
      </span>
    </div>
  );
}

function Callout({ tone, title, children }: { tone: "info" | "warn" | "orange"; title?: string; children: ReactNode }) {
  const styles = {
    info: "bg-[#F4F8FF] border-[#D6E4FF] text-[#1D4ED8]",
    warn: "bg-[#FFF8E6] border-[#FFE2A8] text-[#8A5A00]",
    orange: "bg-[#FFF8F6] border-[#FFE0D3] text-[#B4410F]",
  }[tone];
  return (
    <div className={`rounded-xl border px-4 py-3 text-[13px] leading-relaxed ${styles}`}>
      {title && <p className="font-bold mb-0.5">{title}</p>}
      {children}
    </div>
  );
}

// ────────────────────────────── method picker ──────────────────────────────

const METHOD_META: Record<OnboardingPaymentMethod, { title: string; sub: string; icon: ReactNode }> = {
  RAZORPAY: {
    title: "Pay online",
    sub: "UPI · Cards · Netbanking · Wallets via Razorpay",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  BANK_TRANSFER: {
    title: "Bank transfer",
    sub: "NEFT · RTGS · IMPS — record the UTR",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
      </svg>
    ),
  },
  CHEQUE: {
    title: "Cheque",
    sub: "Saved as a cold lead until it clears",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
};

export function PaymentMethodPicker({
  value,
  onChange,
  config,
}: {
  value: OnboardingPaymentMethod;
  onChange: (m: OnboardingPaymentMethod) => void;
  config: PaymentConfig | null;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" role="radiogroup" aria-label="Payment method">
      {(Object.keys(METHOD_META) as OnboardingPaymentMethod[]).map((m) => {
        const meta = METHOD_META[m];
        const selected = value === m;
        const unavailable = m === "RAZORPAY" && !config?.configured;
        return (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={selected}
            data-testid={`pay-method-${m}`}
            onClick={() => onChange(m)}
            className={`text-left flex flex-col gap-1.5 p-4 rounded-xl border transition-colors ${
              selected ? "border-[#FF6A2F] bg-[#FFF8F6]" : "border-gray-200 hover:bg-gray-50"
            } ${unavailable ? "opacity-80" : ""}`}
          >
            <span className={selected ? "text-[#FF6A2F]" : "text-gray-400"}>{meta.icon}</span>
            <span className="flex items-center gap-2">
              <span className={`text-[14px] font-bold ${selected ? "text-[#101828]" : "text-gray-700"}`}>{meta.title}</span>
              {unavailable && (
                <span className="text-[10px] font-bold uppercase tracking-wide text-[#8A5A00] bg-[#FFF1CC] rounded px-1.5 py-0.5">Not set up</span>
              )}
            </span>
            <span className="text-[12px] text-gray-500 leading-snug">{meta.sub}</span>
          </button>
        );
      })}
    </div>
  );
}

// ───────────────────────────── method details ─────────────────────────────

export function PaymentMethodDetails({
  form,
  onChange,
  config,
  amount,
}: {
  form: PaymentFormState;
  onChange: (next: PaymentFormState) => void;
  config: PaymentConfig | null;
  amount: number;
}) {
  const set = (patch: Partial<PaymentFormState>) => onChange({ ...form, ...patch });

  if (amount <= 0) {
    return <Callout tone="info">Nothing to collect right now — the security deposit is ₹0, so the client is onboarded as soon as you finish.</Callout>;
  }

  if (form.method === "RAZORPAY") {
    return (
      <div className="flex flex-col gap-3" data-testid="pay-details-RAZORPAY">
        {config?.configured ? (
          <Callout tone="info" title={`The client pays ${formatInr(amount)} online`}>
            Razorpay Checkout opens when you finish (UPI, cards, netbanking, wallets). The client is created only after the
            payment is verified — if the window is closed, the application stays saved under Pending payments.
          </Callout>
        ) : (
          <Callout tone="warn" title="Online payment isn't set up yet">
            A super admin needs to add the Razorpay keys under <b>Settings → Integrations</b>. Until then, choose bank transfer or cheque.
          </Callout>
        )}
        {config?.configured && config.mode === "test" && (
          <Callout tone="warn" title="Razorpay is in TEST mode">
            Payments are simulated and no real money moves. A super admin can switch to live keys in Settings → Integrations.
          </Callout>
        )}
      </div>
    );
  }

  if (form.method === "BANK_TRANSFER") {
    return (
      <div className="flex flex-col gap-4" data-testid="pay-details-BANK_TRANSFER">
        {config?.bankConfigured ? (
          <div className="rounded-xl border border-[#E5E7EB] bg-[#FBFBFC] px-4 py-2">
            <p className="text-[12px] font-bold text-[#101828] pt-2">Ask the client to pay {formatInr(amount)} to</p>
            <InfoRow label="Account name" value={config.bankAccountName} copy />
            <InfoRow label="Account number" value={config.bankAccountNumber} copy />
            <InfoRow label="IFSC" value={config.bankIfsc} copy />
            <InfoRow label="Bank" value={[config.bankName, config.bankBranch].filter(Boolean).join(" · ")} />
          </div>
        ) : (
          <Callout tone="warn" title="Receiving bank account isn't configured">
            A super admin can add it under <b>Settings → Integrations → Bank account</b> so it shows here for the client. You can still record a
            transfer below.
          </Callout>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="UTR / reference no." required hint="From the client's bank confirmation">
            <input
              data-testid="utr"
              className={inputCls}
              placeholder="e.g. HDFCR52026100212345"
              value={form.utr}
              maxLength={35}
              onChange={(e) => set({ utr: e.target.value.replace(/[^A-Za-z0-9]/g, "").toUpperCase() })}
            />
          </Field>
          <Field label="Transfer date" required>
            <input data-testid="transfer-date" type="date" className={inputCls} value={form.transferDate} max={todayIso()} onChange={(e) => set({ transferDate: e.target.value })} />
          </Field>
          <Field label="Client's bank">
            <input className={inputCls} placeholder="Optional" value={form.payerBank} onChange={(e) => set({ payerBank: e.target.value })} />
          </Field>
        </div>
        <Callout tone="info">
          Confirm the credit in your bank statement before continuing — the client is onboarded immediately with this payment recorded against the
          UTR. A UTR can only be used once.
        </Callout>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4" data-testid="pay-details-CHEQUE">
      <Callout tone="orange" title="Cheque clients are saved as a Cold lead">
        The client is <b>not onboarded yet</b>: no login, seats, deposit or paid invoice are created until the cheque clears. Everything you enter is
        kept, and you confirm clearance from <b>Pending payments</b> — that is what converts the lead into a client.
      </Callout>
      {config?.chequeConfigured && (
        <div className="rounded-xl border border-[#E5E7EB] bg-[#FBFBFC] px-4 py-2">
          <p className="text-[12px] font-bold text-[#101828] pt-2">Cheque for {formatInr(amount)}, made out to</p>
          <InfoRow label="Payee" value={config.chequePayeeName} copy />
          {config.chequeInstructions && <p className="text-[12px] text-gray-500 py-2">{config.chequeInstructions}</p>}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field label="Cheque number" required hint="6–12 digits">
          <input
            data-testid="cheque-number"
            className={inputCls}
            placeholder="e.g. 554433"
            inputMode="numeric"
            maxLength={12}
            value={form.chequeNumber}
            onChange={(e) => set({ chequeNumber: e.target.value.replace(/\D/g, "") })}
          />
        </Field>
        <Field label="Drawn on (bank)" required>
          <input data-testid="cheque-bank" className={inputCls} placeholder="e.g. ICICI Bank" value={form.chequeBank} onChange={(e) => set({ chequeBank: e.target.value })} />
        </Field>
        <Field label="Cheque date" required hint="Up to 90 days old or post-dated">
          <input data-testid="cheque-date" type="date" className={inputCls} value={form.chequeDate} onChange={(e) => set({ chequeDate: e.target.value })} />
        </Field>
      </div>
    </div>
  );
}

// ──────────────────────────────── dialogs ────────────────────────────────

function ModalShell({
  open,
  title,
  subtitle,
  onClose,
  children,
  footer,
  wide,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  footer: ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full ${wide ? "max-w-3xl" : "max-w-md"} max-h-[90vh] overflow-hidden flex flex-col`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-[17px] font-bold text-[#101828]">{title}</h2>
          {subtitle && <p className="text-[13px] text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className="px-6 py-5 overflow-y-auto flex flex-col gap-4">{children}</div>
        <div className="px-6 py-4 flex justify-end gap-2 bg-gray-50 border-t border-gray-100">{footer}</div>
      </div>
    </div>
  );
}

const btnGhost = "bg-white hover:bg-gray-100 text-gray-700 text-[13px] font-semibold py-2.5 px-5 rounded-[10px] border border-gray-200 transition-colors disabled:opacity-60";
const btnPrimary = "bg-[#FF6A2F] hover:bg-[#E55A20] text-white text-[13px] font-semibold py-2.5 px-5 rounded-[10px] transition-colors disabled:opacity-60 disabled:cursor-not-allowed";
const btnDanger = "bg-red-500 hover:bg-red-600 text-white text-[13px] font-semibold py-2.5 px-5 rounded-[10px] transition-colors disabled:opacity-60";

const clientLabel = (o: PendingOnboarding) => o.companyName || o.contactName || "this client";

/** Take (or retake) payment on a pending application, by any method. */
export function CollectPaymentDialog({
  open,
  onboarding,
  config,
  onClose,
  onDone,
}: {
  open: boolean;
  onboarding: PendingOnboarding | null;
  config: PaymentConfig | null;
  onClose: () => void;
  onDone: (result: OnboardingResult | null) => void;
}) {
  const { collect, completeOnline } = useOnboardingPaymentActions();
  const [form, setForm] = useState<PaymentFormState>(emptyPaymentForm());
  const [busy, setBusy] = useState(false);
  const amount = Number(onboarding?.paymentAmount ?? 0);

  useEffect(() => {
    if (open) setForm(emptyPaymentForm(defaultMethod(config)));
  }, [open, onboarding?.id, config]);

  if (!open || !onboarding) return null;

  const submit = async () => {
    const problem = validatePaymentForm(form, { amount, config });
    if (problem) {
      toast.error(problem);
      return;
    }
    const payment = toPaymentInput(form, amount);
    if (!payment) return;
    setBusy(true);
    try {
      const result = await collect(onboarding.id, payment);
      if (result.outcome === "PENDING_ONLINE_PAYMENT" && result.razorpay) {
        const online = await completeOnline(result);
        if (online.kind === "onboarded") {
          toast.success(online.result.message);
          onDone(online.result);
        } else {
          toast.warning(online.message);
          onDone(null);
        }
      } else if (result.outcome === "AWAITING_CHEQUE_CLEARANCE") {
        toast.success("Cheque registered — the client stays a cold lead until it clears.");
        onDone(result);
      } else if (result.outcome === "ONBOARDED") {
        toast.success(result.message);
        onDone(result);
      } else {
        toast.error(result.message);
        onDone(result);
      }
      onClose();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalShell
      wide
      open={open}
      title={`Collect payment — ${clientLabel(onboarding)}`}
      subtitle={`${formatInr(amount)} security deposit`}
      onClose={() => !busy && onClose()}
      footer={
        <>
          <button type="button" className={btnGhost} onClick={onClose} disabled={busy}>
            Close
          </button>
          <button type="button" className={btnPrimary} onClick={submit} disabled={busy} data-testid="collect-submit">
            {busy ? "Working…" : form.method === "RAZORPAY" ? "Open online payment" : form.method === "CHEQUE" ? "Register cheque" : "Record transfer & onboard"}
          </button>
        </>
      }
    >
      {onboarding.failureReason && <Callout tone="warn" title="Last attempt">{onboarding.failureReason}</Callout>}
      <PaymentMethodPicker value={form.method} onChange={(method) => setForm({ ...form, method })} config={config} />
      <PaymentMethodDetails form={form} onChange={setForm} config={config} amount={amount} />
    </ModalShell>
  );
}

/** Staff confirm the bank cleared the cheque — this is what turns the cold lead into a client. */
export function ConfirmChequeDialog({
  open,
  onboarding,
  onClose,
  onDone,
}: {
  open: boolean;
  onboarding: PendingOnboarding | null;
  onClose: () => void;
  onDone: (result: OnboardingResult) => void;
}) {
  const { confirmCheque } = useOnboardingPaymentActions();
  const [clearedOn, setClearedOn] = useState(todayIso());
  const [remarks, setRemarks] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setClearedOn(todayIso());
      setRemarks("");
    }
  }, [open, onboarding?.id]);

  if (!open || !onboarding) return null;

  const submit = async () => {
    setBusy(true);
    try {
      const result = await confirmCheque(onboarding.id, clearedOn, remarks);
      toast.success(result.message);
      onDone(result);
      onClose();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalShell
      open={open}
      title="Cheque cleared?"
      subtitle={`${clientLabel(onboarding)} · cheque ${onboarding.chequeNumber ?? ""} · ${formatInr(onboarding.paymentAmount)}`}
      onClose={() => !busy && onClose()}
      footer={
        <>
          <button type="button" className={btnGhost} onClick={onClose} disabled={busy}>
            Not yet
          </button>
          <button type="button" className={btnPrimary} onClick={submit} disabled={busy} data-testid="confirm-cheque-submit">
            {busy ? "Onboarding…" : "Yes, cleared — onboard the client"}
          </button>
        </>
      }
    >
      <Callout tone="orange">
        Only confirm once the amount is <b>credited in the bank statement</b>. This creates the client's login, allocates their seats, records the
        deposit and a paid invoice (cheque {onboarding.chequeNumber}), and converts the lead.
      </Callout>
      <Field label="Cleared on" required>
        <input className={inputCls} type="date" max={todayIso()} value={clearedOn} onChange={(e) => setClearedOn(e.target.value)} />
      </Field>
      <Field label="Remarks">
        <input className={inputCls} placeholder="e.g. Credited on 3 Oct, ref 8841" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
      </Field>
    </ModalShell>
  );
}

/** The cheque bounced: nothing is provisioned, the lead stays cold, another payment can be collected. */
export function BounceChequeDialog({
  open,
  onboarding,
  onClose,
  onDone,
}: {
  open: boolean;
  onboarding: PendingOnboarding | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const { bounceCheque } = useOnboardingPaymentActions();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) setReason("");
  }, [open, onboarding?.id]);

  if (!open || !onboarding) return null;

  const submit = async () => {
    if (!reason.trim()) {
      toast.error("Enter the reason the cheque bounced");
      return;
    }
    setBusy(true);
    try {
      await bounceCheque(onboarding.id, reason.trim());
      toast.success("Cheque marked as bounced — the lead stays cold.");
      onDone();
      onClose();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalShell
      open={open}
      title="Mark cheque as bounced"
      subtitle={`${clientLabel(onboarding)} · cheque ${onboarding.chequeNumber ?? ""}`}
      onClose={() => !busy && onClose()}
      footer={
        <>
          <button type="button" className={btnGhost} onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="button" className={btnDanger} onClick={submit} disabled={busy} data-testid="bounce-submit">
            {busy ? "Saving…" : "Mark as bounced"}
          </button>
        </>
      }
    >
      <Callout tone="info">Nothing is created for the client. You can collect another payment on the same application afterwards.</Callout>
      <Field label="Reason" required>
        <input className={inputCls} placeholder="e.g. Insufficient funds / signature mismatch" value={reason} onChange={(e) => setReason(e.target.value)} />
      </Field>
    </ModalShell>
  );
}

/** Abandon a pending application (a provisioned client can't be cancelled here). */
export function CancelOnboardingDialog({
  open,
  onboarding,
  onClose,
  onDone,
}: {
  open: boolean;
  onboarding: PendingOnboarding | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const { cancel } = useOnboardingPaymentActions();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) setReason("");
  }, [open, onboarding?.id]);

  if (!open || !onboarding) return null;

  const submit = async () => {
    setBusy(true);
    try {
      await cancel(onboarding.id, reason);
      toast.success("Application cancelled");
      onDone();
      onClose();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalShell
      open={open}
      title="Cancel this application?"
      subtitle={`${clientLabel(onboarding)} · ${formatInr(onboarding.paymentAmount)}`}
      onClose={() => !busy && onClose()}
      footer={
        <>
          <button type="button" className={btnGhost} onClick={onClose} disabled={busy}>
            Keep it
          </button>
          <button type="button" className={btnDanger} onClick={submit} disabled={busy} data-testid="cancel-submit">
            {busy ? "Cancelling…" : "Cancel application"}
          </button>
        </>
      }
    >
      <Callout tone="warn">
        The saved application is closed and hidden from the pending list. The lead (if any) is kept. If money was already received (for example a
        cheque in hand), return it to the client.
      </Callout>
      <Field label="Reason (optional)">
        <input className={inputCls} placeholder="e.g. Client went with another space" value={reason} onChange={(e) => setReason(e.target.value)} />
      </Field>
    </ModalShell>
  );
}
