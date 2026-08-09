/**
 * File:        apps/web/src/app/dashboard/crm/subscriptions/page.tsx
 * Module:      Web · Dashboard · CRM · Subscriptions
 * Purpose:     Admin Subscriptions page — lists a center's company
 *              subscriptions (the M2 contract layer) and lets a center manager
 *              run the M3 billing fan-out (allocate seats, create monthly
 *              bookings, generate an invoice) for a subscription or for all
 *              due cycles. This is where "the center manager can see those
 *              bookings" lives.
 *
 * Author:      ZCode
 * Last-updated: 2026-08-09
 */
'use client';

import { useMutation } from '@apollo/client';
import { toast } from 'sonner';
import { useSubscriptions, useSubscriptionMutations } from '@/hooks/use-plans';
import { PROCESS_SUBSCRIPTION_CYCLE, PROCESS_DUE_SUBSCRIPTIONS } from '@/lib/apollo/operations';
import { GET_SUBSCRIPTIONS } from '@/lib/apollo/operations';

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  SUSPENDED: 'bg-amber-100 text-amber-700',
  CANCELLED: 'bg-gray-100 text-gray-600 line-through',
  EXPIRED: 'bg-red-100 text-red-700',
  PENDING: 'bg-blue-100 text-blue-700',
};

export default function SubscriptionsPage() {
  const { subscriptions, loading } = useSubscriptions();
  const { cancelSubscription } = useSubscriptionMutations();

  const [processCycle, { loading: processingOne }] = useMutation(PROCESS_SUBSCRIPTION_CYCLE, {
    refetchQueries: [{ query: GET_SUBSCRIPTIONS }],
    onCompleted: (data) => {
      const r = data?.processSubscriptionCycle;
      if (r?.skipped) {
        toast.info('Cycle already processed — no changes.');
      } else {
        toast.success(`Cycle processed: ${r.bookingsCreated} bookings, ${r.seatsAllocated} seats allocated, invoice generated.`);
      }
    },
    onError: (err) => toast.error(err.message || 'Billing failed'),
  });

  const [processDue, { loading: processingDue }] = useMutation(PROCESS_DUE_SUBSCRIPTIONS, {
    refetchQueries: [{ query: GET_SUBSCRIPTIONS }],
    onCompleted: (data) => {
      const results = data?.processDueSubscriptions ?? [];
      const billed = results.filter((r: any) => !r.skipped).length;
      toast.success(`Processed ${billed} of ${results.length} due subscription(s).`);
    },
    onError: (err) => toast.error(err.message || 'Bulk billing failed'),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1F1F1F]">Subscriptions</h1>
          <p className="text-sm text-[#6A7282]">
            Company seat commitments. Run a billing cycle to allocate seats, create monthly bookings,
            and generate an invoice.
          </p>
        </div>
        <button
          onClick={() => processDue()}
          disabled={processingDue}
          className="rounded-[10px] border border-[#FF6A2F] px-4 py-2 text-sm font-medium text-[#FF6A2F] hover:bg-[#FF6A2F] hover:text-white disabled:opacity-50"
        >
          {processingDue ? 'Processing…' : 'Run all due cycles'}
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-[#6A7282]">Loading subscriptions…</p>
      ) : subscriptions.length === 0 ? (
        <div className="rounded-[14px] border border-dashed border-[#E5E7EB] bg-white p-12 text-center">
          <p className="text-sm text-[#6A7282]">No subscriptions yet. Create a customer subscription to start billing monthly seats.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[14px] border border-[#E5E7EB] bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-[#E5E7EB] text-left text-[#6A7282]">
              <tr>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Seats</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Next billing</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((s) => (
                <tr key={s.id} className="border-b border-[#E5E7EB] last:border-0">
                  <td className="px-4 py-3 font-medium text-[#1F1F1F]">
                    {s.customer?.name ?? s.customerId}
                    {s.customer?.company ? <span className="block text-xs text-[#6A7282]">{s.customer.company}</span> : null}
                  </td>
                  <td className="px-4 py-3 text-[#4A5565]">
                    {s.plan?.name ?? s.planId}
                    {s.plan ? <span className="block text-xs text-[#6A7282]">{s.plan.seatType.replace('_', ' ')} · {s.plan.billingCycle.toLowerCase()}</span> : null}
                  </td>
                  <td className="px-4 py-3 text-[#1F1F1F]">{s.seatCount}</td>
                  <td className="px-4 py-3 text-[#1F1F1F]">₹{Number(s.amount).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-[#4A5565]">{new Date(s.nextBillingDate).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[s.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 text-xs">
                      <button
                        onClick={() => processCycle({ variables: { subscriptionId: s.id } })}
                        disabled={processingOne || s.status !== 'ACTIVE'}
                        className="text-[#FF6A2F] hover:underline disabled:opacity-40"
                      >
                        {processingOne ? 'Running…' : 'Run cycle'}
                      </button>
                      {s.status === 'ACTIVE' && (
                        <button
                          onClick={() => { if (confirm('Cancel this subscription?')) cancelSubscription(s.id); }}
                          className="text-red-600 hover:underline"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
