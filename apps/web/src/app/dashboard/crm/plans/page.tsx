/**
 * File:        apps/web/src/app/dashboard/crm/plans/page.tsx
 * Module:      Web · Dashboard · CRM · Plans
 * Purpose:     Admin Plans page — lists a center's billable seat offerings
 *              (the M2 Plan model) and lets staff create/edit/archive them.
 *              A Plan is what a Subscription references; it is the pricing
 *              layer for the company → employee → monthly-seat model.
 *
 * Author:      ZCode
 * Last-updated: 2026-08-09
 */
'use client';

import { useState } from 'react';
import { usePlans, usePlanMutations, type Plan } from '@/hooks/use-plans';
import { useCenters } from '@/hooks/use-inventory';

const SEAT_TYPES: Plan['seatType'][] = ['HOT_DESK', 'DEDICATED', 'CABIN'];
const BILLING_CYCLES: Plan['billingCycle'][] = ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY'];

const STATUS_BADGE: Record<Plan['status'], string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  INACTIVE: 'bg-gray-100 text-gray-600',
  ARCHIVED: 'bg-amber-100 text-amber-700',
};

export default function PlansPage() {
  const { centers } = useCenters();
  const activeCenterId = centers[0]?.id;
  const { plans, loading } = usePlans({ centerId: activeCenterId });
  const { createPlan, updatePlan, deletePlan } = usePlanMutations();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    seatType: 'DEDICATED' as Plan['seatType'],
    billingCycle: 'MONTHLY' as Plan['billingCycle'],
    price: '',
    minSeats: '1',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCenterId) return;
    await createPlan({
      centerId: activeCenterId,
      name: form.name,
      description: form.description || undefined,
      seatType: form.seatType,
      billingCycle: form.billingCycle,
      price: Number(form.price),
      minSeats: Number(form.minSeats) || 1,
    });
    setForm({ name: '', description: '', seatType: 'DEDICATED', billingCycle: 'MONTHLY', price: '', minSeats: '1' });
    setShowForm(false);
  };

  const toggleStatus = async (plan: Plan) => {
    const next = plan.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await updatePlan(plan.id, { status: next as Plan['status'] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1F1F1F]">Plans</h1>
          <p className="text-sm text-[#6A7282]">
            Billable seat offerings for {centers[0]?.name ?? 'this center'}. A plan defines a seat
            type, billing cycle, and price that customers subscribe to.
          </p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="rounded-[10px] bg-[#FF6A2F] px-4 py-2 text-sm font-medium text-white hover:bg-[#FE7A47]"
        >
          {showForm ? 'Cancel' : '+ New Plan'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-[14px] border border-[#E5E7EB] bg-white p-6">
          <div className="grid grid-cols-1 gap-4 compact:grid-cols-2">
            <label className="space-y-1">
              <span className="text-sm font-medium text-[#1F1F1F]">Plan name</span>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Dedicated Desk — Monthly"
                className="w-full rounded-[10px] border border-[#E5E7EB] px-3 py-2 text-sm"
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-[#1F1F1F]">Price (₹)</span>
              <input
                required
                type="number"
                min="0"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="e.g. 8000"
                className="w-full rounded-[10px] border border-[#E5E7EB] px-3 py-2 text-sm"
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-[#1F1F1F]">Seat type</span>
              <select
                value={form.seatType}
                onChange={(e) => setForm({ ...form, seatType: e.target.value as Plan['seatType'] })}
                className="w-full rounded-[10px] border border-[#E5E7EB] px-3 py-2 text-sm"
              >
                {SEAT_TYPES.map((t) => (
                  <option key={t} value={t}>{t.replace('_', ' ')}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-[#1F1F1F]">Billing cycle</span>
              <select
                value={form.billingCycle}
                onChange={(e) => setForm({ ...form, billingCycle: e.target.value as Plan['billingCycle'] })}
                className="w-full rounded-[10px] border border-[#E5E7EB] px-3 py-2 text-sm"
              >
                {BILLING_CYCLES.map((c) => (
                  <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-[#1F1F1F]">Min seats</span>
              <input
                type="number"
                min="1"
                value={form.minSeats}
                onChange={(e) => setForm({ ...form, minSeats: e.target.value })}
                className="w-full rounded-[10px] border border-[#E5E7EB] px-3 py-2 text-sm"
              />
            </label>
            <label className="space-y-1 compact:col-span-2">
              <span className="text-sm font-medium text-[#1F1F1F]">Description</span>
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-[10px] border border-[#E5E7EB] px-3 py-2 text-sm"
              />
            </label>
          </div>
          <button type="submit" className="rounded-[10px] bg-[#FF6A2F] px-4 py-2 text-sm font-medium text-white hover:bg-[#FE7A47]">
            Create plan
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-[#6A7282]">Loading plans…</p>
      ) : plans.length === 0 ? (
        <div className="rounded-[14px] border border-dashed border-[#E5E7EB] bg-white p-12 text-center">
          <p className="text-sm text-[#6A7282]">No plans yet. Create one to start offering monthly seats.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[14px] border border-[#E5E7EB] bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-[#E5E7EB] text-left text-[#6A7282]">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Seat type</th>
                <th className="px-4 py-3 font-medium">Cycle</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Min seats</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((p) => (
                <tr key={p.id} className="border-b border-[#E5E7EB] last:border-0">
                  <td className="px-4 py-3 font-medium text-[#1F1F1F]">{p.name}</td>
                  <td className="px-4 py-3 text-[#4A5565]">{p.seatType.replace('_', ' ')}</td>
                  <td className="px-4 py-3 text-[#4A5565]">{p.billingCycle.charAt(0) + p.billingCycle.slice(1).toLowerCase()}</td>
                  <td className="px-4 py-3 text-[#1F1F1F]">₹{Number(p.price).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-[#4A5565]">{p.minSeats}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[p.status]}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 text-xs">
                      <button onClick={() => toggleStatus(p)} className="text-[#FF6A2F] hover:underline">
                        {p.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => { if (confirm('Delete this plan?')) deletePlan(p.id); }}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
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
