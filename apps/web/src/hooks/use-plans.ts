"use client";

/**
 * File:        apps/web/src/hooks/use-plans.ts
 * Module:      Web · Hooks · Plans & Subscriptions
 * Purpose:     Apollo-based data layer for the M2 Plan + Subscription model.
 *              Powers the admin Plans page and the customer detail Subscriptions
 *              tab. Centralises queries/mutations so refetch + error handling is
 *              consistent across surfaces.
 *
 * Author:      ZCode
 * Last-updated: 2026-08-09
 */

import { useQuery, useMutation } from '@apollo/client';
import { toast } from 'sonner';
import {
  GET_PLANS,
  GET_PLAN,
  CREATE_PLAN,
  UPDATE_PLAN,
  DELETE_PLAN,
  GET_SUBSCRIPTIONS,
  GET_SUBSCRIPTION,
  CREATE_SUBSCRIPTION,
  UPDATE_SUBSCRIPTION,
  CANCEL_SUBSCRIPTION,
} from '@/lib/apollo/operations';

// ─── Types ────────────────────────────────────────────────────────────────
export interface Plan {
  id: string;
  centerId: string;
  name: string;
  description?: string | null;
  seatType: 'HOT_DESK' | 'DEDICATED' | 'CABIN' | 'MEETING_ROOM';
  billingCycle: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY';
  price: number;
  currency: string;
  minSeats: number;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  customerId: string;
  planId: string;
  centerId?: string | null;
  seatCount: number;
  unitPrice: number;
  amount: number;
  status: 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'EXPIRED' | 'PENDING';
  startDate: string;
  nextBillingDate: string;
  endDate?: string | null;
  notes?: string | null;
  createdAt: string;
  plan?: Pick<Plan, 'id' | 'name' | 'seatType' | 'billingCycle' | 'price' | 'currency'>;
  customer?: { id: string; name: string; company?: string | null };
}

interface PlansQueryVars {
  centerId?: string;
  seatType?: Plan['seatType'];
  billingCycle?: Plan['billingCycle'];
  status?: Plan['status'];
}

interface SubscriptionsQueryVars {
  customerId?: string;
  planId?: string;
  centerId?: string;
  status?: Subscription['status'];
}

// ─── Plans ────────────────────────────────────────────────────────────────
export function usePlans(vars: PlansQueryVars = {}) {
  const { data, loading, error, refetch } = useQuery<{ plans: Plan[] }>(GET_PLANS, {
    variables: { input: vars },
    fetchPolicy: 'cache-and-network',
  });
  return { plans: data?.plans ?? [], loading, error, refetch };
}

export function usePlan(id?: string) {
  const { data, loading, error } = useQuery<{ plan: Plan | null }>(GET_PLAN, {
    variables: { id },
    skip: !id,
  });
  return { plan: data?.plan ?? null, loading, error };
}

export function usePlanMutations() {
  const [createPlanMut] = useMutation(CREATE_PLAN);
  const [updatePlanMut] = useMutation(UPDATE_PLAN);
  const [deletePlanMut] = useMutation(DELETE_PLAN);

  const createPlan = async (input: Partial<Plan> & { name: string; centerId: string; seatType: Plan['seatType']; price: number }) => {
    const res = await createPlanMut({ variables: { input }, refetchQueries: [{ query: GET_PLANS }] });
    toast.success('Plan created');
    return res.data?.createPlan;
  };

  const updatePlan = async (id: string, input: Partial<Plan>) => {
    const res = await updatePlanMut({ variables: { id, input }, refetchQueries: [{ query: GET_PLANS }] });
    toast.success('Plan updated');
    return res.data?.updatePlan;
  };

  const deletePlan = async (id: string) => {
    try {
      await deletePlanMut({ variables: { id }, refetchQueries: [{ query: GET_PLANS }] });
      toast.success('Plan deleted');
      return true;
    } catch (err: any) {
      toast.error(err?.message || 'Could not delete plan');
      return false;
    }
  };

  return { createPlan, updatePlan, deletePlan };
}

// ─── Subscriptions ────────────────────────────────────────────────────────
export function useSubscriptions(vars: SubscriptionsQueryVars = {}) {
  const { data, loading, error, refetch } = useQuery<{ subscriptions: Subscription[] }>(
    GET_SUBSCRIPTIONS,
    { variables: { input: vars }, fetchPolicy: 'cache-and-network' },
  );
  return { subscriptions: data?.subscriptions ?? [], loading, error, refetch };
}

export function useSubscription(id?: string) {
  const { data, loading, error } = useQuery<{ subscription: Subscription | null }>(
    GET_SUBSCRIPTION,
    { variables: { id }, skip: !id },
  );
  return { subscription: data?.subscription ?? null, loading, error };
}

export function useSubscriptionMutations() {
  const [createSubMut] = useMutation(CREATE_SUBSCRIPTION);
  const [updateSubMut] = useMutation(UPDATE_SUBSCRIPTION);
  const [cancelSubMut] = useMutation(CANCEL_SUBSCRIPTION);

  const createSubscription = async (input: {
    customerId: string;
    planId: string;
    seatCount: number;
    startDate?: string;
    notes?: string;
  }) => {
    const res = await createSubMut({
      variables: { input },
      refetchQueries: [{ query: GET_SUBSCRIPTIONS }],
    });
    toast.success('Subscription created');
    return res.data?.createSubscription;
  };

  const updateSubscription = async (id: string, input: Partial<Subscription>) => {
    const res = await updateSubMut({
      variables: { id, input },
      refetchQueries: [{ query: GET_SUBSCRIPTIONS }],
    });
    toast.success('Subscription updated');
    return res.data?.updateSubscription;
  };

  const cancelSubscription = async (id: string) => {
    try {
      await cancelSubMut({ variables: { id }, refetchQueries: [{ query: GET_SUBSCRIPTIONS }] });
      toast.success('Subscription cancelled');
      return true;
    } catch (err: any) {
      toast.error(err?.message || 'Could not cancel subscription');
      return false;
    }
  };

  return { createSubscription, updateSubscription, cancelSubscription };
}
