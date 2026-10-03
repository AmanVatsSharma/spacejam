"use client";

/**
 * File:        apps/web/src/app/dashboard/crm/onboarding/pending/page.tsx
 * Module:      Web · Dashboard · CRM · Pending payments
 * Purpose:     Where onboardings that still need money are managed:
 *                - cheques awaiting clearance (the client is a COLD lead until
 *                  staff confirm the bank cleared it — that confirmation is what
 *                  creates the client)
 *                - online (Razorpay) payments that were started but not completed
 *                - failed attempts / bounced cheques, which can be retried by any
 *                  method on the same saved application
 *              Every action calls the server, which enforces roles, center scope
 *              and the payment rules.
 *
 * Author:      Claude Sonnet 5.5
 * Last-updated: 2026-10-02
 */
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  errorMessage,
  formatInr,
  usePaymentConfig,
  usePendingOnboardings,
  useOnboardingPaymentActions,
  type PendingOnboarding,
} from "@/hooks/use-onboarding-payments";
import {
  BounceChequeDialog,
  CancelOnboardingDialog,
  CollectPaymentDialog,
  ConfirmChequeDialog,
} from "@/components/ui/dashboard/onboarding-payment-ui";
import { QueryEmpty, QueryError, QueryLoading } from "@/components/ui/query-status";

type Filter = "all" | "cheque" | "online" | "failed";

const stateOf = (o: PendingOnboarding): Exclude<Filter, "all"> =>
  o.paymentStatus === "AWAITING_CLEARANCE" ? "cheque" : o.paymentStatus === "FAILED" ? "failed" : "online";

const PILL: Record<Exclude<Filter, "all">, { label: (o: PendingOnboarding) => string; cls: string }> = {
  cheque: { label: () => "Awaiting cheque clearance", cls: "bg-[#FFF4E5] text-[#B25E09] border-[#FFD8A8]" },
  online: { label: () => "Awaiting online payment", cls: "bg-[#EEF4FF] text-[#1D4ED8] border-[#C7D7FE]" },
  failed: { label: (o) => (o.paymentMethod === "CHEQUE" ? "Cheque bounced" : "Payment failed"), cls: "bg-[#FEF3F2] text-[#B42318] border-[#FDA29B]" },
};

const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso.length === 10 ? `${iso}T00:00:00` : iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

function details(o: PendingOnboarding): string {
  if (o.paymentMethod === "CHEQUE" && o.chequeNumber) {
    return `Cheque #${o.chequeNumber}${o.chequeBank ? ` · ${o.chequeBank}` : ""}${o.chequeDate ? ` · dated ${fmtDate(o.chequeDate)}` : ""}`;
  }
  if (o.paymentStatus === "PENDING") return "Waiting for the client to pay through Razorpay";
  return o.failureReason ?? "—";
}

export default function PendingPaymentsPage() {
  const router = useRouter();
  const { config } = usePaymentConfig();
  const { pending, loading, error, refetch } = usePendingOnboardings({ pollMs: 20_000 });
  const { collect, completeOnline } = useOnboardingPaymentActions();

  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [collecting, setCollecting] = useState<PendingOnboarding | null>(null);
  const [clearing, setClearing] = useState<PendingOnboarding | null>(null);
  const [bouncing, setBouncing] = useState<PendingOnboarding | null>(null);
  const [cancelling, setCancelling] = useState<PendingOnboarding | null>(null);

  const tiles = useMemo(() => {
    const sum = (list: PendingOnboarding[]) => list.reduce((t, o) => t + Number(o.paymentAmount ?? 0), 0);
    const by = (s: Exclude<Filter, "all">) => pending.filter((o) => stateOf(o) === s);
    return [
      { key: "cheque" as const, label: "Cheques awaiting clearance", list: by("cheque"), hint: "Cold leads until the bank clears them", tone: "text-[#B25E09]" },
      { key: "online" as const, label: "Online payments pending", list: by("online"), hint: "Started but not completed", tone: "text-[#1D4ED8]" },
      { key: "failed" as const, label: "Needs attention", list: by("failed"), hint: "Failed payments & bounced cheques", tone: "text-[#B42318]" },
    ].map((t) => ({ ...t, count: t.list.length, total: sum(t.list) }));
  }, [pending]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return pending.filter(
      (o) =>
        (filter === "all" || stateOf(o) === filter) &&
        (!q ||
          [o.companyName, o.contactName, o.contactEmail, o.chequeNumber, o.paymentReference]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(q))),
    );
  }, [pending, filter, search]);

  /** One click: create a fresh Razorpay order on this application and open Checkout. */
  const payOnline = async (o: PendingOnboarding) => {
    setBusyId(o.id);
    try {
      const result = await collect(o.id, { method: "RAZORPAY" });
      if (result.outcome === "PENDING_ONLINE_PAYMENT" && result.razorpay) {
        const online = await completeOnline(result);
        if (online.kind === "onboarded") toast.success(online.result.message);
        else toast.warning(online.message);
      } else if (result.outcome === "ONBOARDED") {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
      refetch();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const actionBtn = "text-[12px] font-semibold px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50";
  const primary = `${actionBtn} bg-[#FF6A2F] text-white border-[#FF6A2F] hover:bg-[#E55A20]`;
  const ghost = `${actionBtn} bg-white text-gray-700 border-gray-200 hover:bg-gray-50`;
  const danger = `${actionBtn} bg-white text-[#B42318] border-[#FDA29B] hover:bg-[#FEF3F2]`;

  return (
    <div className="px-6 py-6 flex flex-col gap-6 max-w-[1400px] mx-auto w-full" data-testid="pending-payments-page">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[24px] font-bold text-[#1F1F1F]">Pending payments</h1>
          <p className="text-[14px] text-[#4A5565] mt-1 max-w-2xl">
            Applications that are saved but still need money. A client is created only once the payment is confirmed — for a cheque, that means you
            confirm the bank cleared it.
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/dashboard/crm/onboarding")}
          className="bg-[#FF6A2F] hover:bg-[#E55A20] text-white text-[14px] font-semibold px-5 py-2.5 rounded-[10px] transition-colors"
        >
          + New onboarding
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tiles.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setFilter((f) => (f === t.key ? "all" : t.key))}
            className={`text-left bg-white border rounded-[14px] p-4 transition-colors ${filter === t.key ? "border-[#FF6A2F] ring-1 ring-[#FF6A2F]" : "border-[#E5E7EB] hover:bg-gray-50"}`}
          >
            <p className="text-[12px] text-[#6A7282] font-medium">{t.label}</p>
            <p className={`text-[28px] font-bold mt-1 ${t.tone}`}>{t.count}</p>
            <p className="text-[12px] text-[#6A7282]">
              {formatInr(t.total)} · {t.hint}
            </p>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-[14px] overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-3 flex-wrap">
          <input
            type="text"
            placeholder="Search company, contact, cheque no. or UTR…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-72 border border-gray-200 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
          />
          {(["all", "cheque", "online", "failed"] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`h-9 px-3 rounded-lg text-xs font-semibold border transition-colors ${filter === f ? "bg-[#FFF8F6] border-[#FF6A2F] text-[#FF6A2F]" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
            >
              {f === "all" ? "All" : f === "cheque" ? "Cheques" : f === "online" ? "Online" : "Needs attention"}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="text-[12px] text-[#6A7282] border-b border-gray-100">
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Details</th>
                <th className="px-4 py-3 font-medium">Saved</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && rows.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12"><QueryLoading message="Loading pending payments…" /></td></tr>
              ) : error && rows.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12"><QueryError message="Unable to load pending payments." onRetry={() => refetch()} /></td></tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <QueryEmpty message="No pending payments" hint="Cheques, unfinished online payments and failed attempts will show up here." />
                  </td>
                </tr>
              ) : (
                rows.map((o) => {
                  const st = stateOf(o);
                  const busy = busyId === o.id;
                  return (
                    <tr key={o.id} className="border-b border-gray-50 align-top" data-testid={`pending-row-${o.id}`}>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-[#1F1F1F]">{o.companyName || o.contactName || "—"}</p>
                        <p className="text-xs text-[#6A7282]">
                          {o.contactName}
                          {o.contactEmail ? ` · ${o.contactEmail}` : ""}
                        </p>
                        {o.center?.name && <p className="text-xs text-[#6A7282]">{o.center.name}</p>}
                        {o.leadId && (
                          <button type="button" onClick={() => router.push(`/dashboard/crm/leads/${o.leadId}`)} className="text-xs text-[#FF6A2F] hover:underline mt-0.5">
                            View lead ({o.lead?.status ?? "Cold"})
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#1F1F1F] whitespace-nowrap">{formatInr(o.paymentAmount)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block text-[11px] font-bold px-2.5 py-1 rounded-full border ${PILL[st].cls}`}>{PILL[st].label(o)}</span>
                      </td>
                      <td className="px-4 py-3 text-[#4A5565] max-w-[320px]">{details(o)}</td>
                      <td className="px-4 py-3 text-[#6A7282] whitespace-nowrap">{fmtDate(o.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2 flex-wrap">
                          {st === "cheque" && (
                            <>
                              <button type="button" className={primary} disabled={busy} onClick={() => setClearing(o)} data-testid="act-cleared">Cheque cleared</button>
                              <button type="button" className={danger} disabled={busy} onClick={() => setBouncing(o)} data-testid="act-bounced">Bounced</button>
                              <button type="button" className={ghost} disabled={busy} onClick={() => setCollecting(o)} data-testid="act-other">Pay another way</button>
                            </>
                          )}
                          {st === "online" && (
                            <>
                              {config?.configured && (
                                <button type="button" className={primary} disabled={busy} onClick={() => payOnline(o)} data-testid="act-pay-online">
                                  {busy ? "Opening…" : "Pay online"}
                                </button>
                              )}
                              <button type="button" className={ghost} disabled={busy} onClick={() => setCollecting(o)} data-testid="act-other">Pay another way</button>
                            </>
                          )}
                          {st === "failed" && (
                            <button type="button" className={primary} disabled={busy} onClick={() => setCollecting(o)} data-testid="act-collect">Collect payment</button>
                          )}
                          <button type="button" className={danger} disabled={busy} onClick={() => setCancelling(o)} data-testid="act-cancel">Cancel</button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CollectPaymentDialog open={!!collecting} onboarding={collecting} config={config} onClose={() => setCollecting(null)} onDone={() => refetch()} />
      <ConfirmChequeDialog open={!!clearing} onboarding={clearing} onClose={() => setClearing(null)} onDone={() => refetch()} />
      <BounceChequeDialog open={!!bouncing} onboarding={bouncing} onClose={() => setBouncing(null)} onDone={() => refetch()} />
      <CancelOnboardingDialog open={!!cancelling} onboarding={cancelling} onClose={() => setCancelling(null)} onDone={() => refetch()} />
    </div>
  );
}
