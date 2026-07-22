"use client";

/**
 * File:        apps/web/src/hooks/use-crm.ts
 * Module:      Web · Hooks · CRM
 * Purpose:     Apollo-based data layer for CRM — leads, customers, and onboarding.
 *              Centralises all lead/customer queries and mutations so every CRM
 *              page shares one source of truth for refetch logic and error handling.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-22
 */

import { useMemo } from 'react';
import { useQuery, useMutation, useApolloClient, gql } from '@apollo/client';
import { toast } from 'sonner';
import {
  GET_LEADS,
  GET_LEAD,
  GET_CUSTOMERS,
  GET_CUSTOMER,
  CREATE_LEAD,
  UPDATE_LEAD,
  CONVERT_LEAD,
  DELETE_LEAD,
  CREATE_CUSTOMER,
  UPDATE_CUSTOMER,
  DELETE_CUSTOMER,
  LEAD_PIPELINE_STATS,
  GET_CUSTOMER_DEPOSITS,
  GET_CUSTOMER_CONTRACTS,
  GET_CUSTOMER_INVOICES,
} from '@/lib/apollo/operations';

// ═══════════════════════════════════════════════════════
// Types (shared across CRM pages)
// ═══════════════════════════════════════════════════════

export type LeadStatus = 'New' | 'Visited' | 'Negotiation' | 'Converted' | 'Cold';

export interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  source?: string;
  requirement?: string;
  budget?: string;
  location?: string;
  status: LeadStatus;
  lastContact?: string;
  teamSize?: string;
  moveInDate?: string;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  status: string;
  planType?: string;
  totalBookings?: number;
  lifetimeValue?: number;
  createdAt?: string;
}

// ═══════════════════════════════════════════════════════
// Leads
// ═══════════════════════════════════════════════════════

export interface UseLeadsOptions {
  fetchPolicy?: 'cache-first' | 'cache-and-network' | 'network-only';
}

export function useLeads(opts: UseLeadsOptions = {}) {
  const { data, loading, error, refetch } = useQuery<{ leads: Lead[] }>(GET_LEADS, {
    fetchPolicy: opts.fetchPolicy ?? 'cache-first',
  });
  return {
    leads: data?.leads ?? [],
    loading,
    error,
    refetch,
  };
}

export function useLead(id: string | undefined) {
  const { data, loading, error, refetch } = useQuery<{ lead: Lead }>(GET_LEAD, {
    variables: { id },
    skip: !id,
  });
  return {
    lead: data?.lead ?? null,
    loading,
    error,
    refetch,
  };
}

export function useLeadMutations() {
  const client = useApolloClient();

  const refetchAll = useMemo(() => [
    { query: GET_LEADS },
    { query: GET_CUSTOMERS },
    { query: LEAD_PIPELINE_STATS },
  ], []);

  const [createLead] = useMutation(CREATE_LEAD, {
    refetchQueries: [{ query: GET_LEADS }, { query: LEAD_PIPELINE_STATS }],
  });

  const [updateLead] = useMutation(UPDATE_LEAD, {
    refetchQueries: [{ query: GET_LEADS }],
  });

  const [deleteLead] = useMutation(DELETE_LEAD, {
    refetchQueries: [{ query: GET_LEADS }, { query: LEAD_PIPELINE_STATS }],
  });

  const [convertLead] = useMutation(CONVERT_LEAD, {
    refetchQueries: refetchAll,
    onCompleted: async (data) => {
      if (data?.convertLead?.success) {
        toast.success('Lead converted to client');
      }
    },
    onError: () => {
      toast.error('Failed to convert lead');
    },
  });

  const handleCreate = async (input: Record<string, string>) => {
    try {
      await createLead({ variables: { input } });
      toast.success('Lead created');
      return true;
    } catch {
      return false;
    }
  };

  const handleUpdate = async (id: string, input: Record<string, string>) => {
    try {
      await updateLead({ variables: { id, input } });
      toast.success('Lead updated');
      return true;
    } catch {
      return false;
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this lead?')) return false;
    try {
      await deleteLead({ variables: { id } });
      toast.success('Lead deleted');
      return true;
    } catch {
      toast.error('Failed to delete lead');
      return false;
    }
  };

  const handleConvert = async (leadId: string) => {
    try {
      await convertLead({ variables: { id: leadId } });
      return true;
    } catch {
      return false;
    }
  };

  return {
    createLead: handleCreate,
    updateLead: handleUpdate,
    deleteLead: handleDelete,
    convertLead: handleConvert,
  };
}

// ═══════════════════════════════════════════════════════
// Pipeline Stats
// ═══════════════════════════════════════════════════════

export interface PipelineCounts {
  new: number;
  visited: number;
  negotiation: number;
  converted: number;
  cold: number;
}

export function useLeadPipelineStats() {
  const { data, loading, error } = useQuery<{
    new: number;
    visited: number;
    negotiation: number;
    converted: number;
    cold: number;
  }>(LEAD_PIPELINE_STATS, {
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });

  const counts: PipelineCounts = useMemo(() => ({
    new: data?.new ?? 0,
    visited: data?.visited ?? 0,
    negotiation: data?.negotiation ?? 0,
    converted: data?.converted ?? 0,
    cold: data?.cold ?? 0,
  }), [data]);

  return { counts, loading, error };
}

// ═══════════════════════════════════════════════════════
// Customers
// ═══════════════════════════════════════════════════════

export function useCustomers(fetchPolicy: 'cache-first' | 'cache-and-network' | 'network-only' = 'cache-first') {
  const { data, loading, error, refetch } = useQuery<{ customers: Customer[] }>(GET_CUSTOMERS, {
    fetchPolicy,
  });
  return {
    customers: data?.customers ?? [],
    loading,
    error,
    refetch,
  };
}

export function useCustomer(id: string | undefined) {
  const { data, loading, error, refetch } = useQuery<{ customer: Customer }>(GET_CUSTOMER, {
    variables: { id },
    skip: !id,
  });
  return {
    customer: data?.customer ?? null,
    loading,
    error,
    refetch,
  };
}

export function useCustomerDetail(id: string | undefined) {
  const { data: customerData, loading: customerLoading, error: customerError, refetch: refetchCustomer } =
    useQuery<{ customer: Customer }>(GET_CUSTOMER, {
      variables: { id },
      skip: !id,
    });

  const { data: depositsData, loading: depositsLoading } = useQuery(GET_CUSTOMER_DEPOSITS, {
    variables: { customerId: id },
    skip: !id,
  });

  const { data: contractsData, loading: contractsLoading } = useQuery(GET_CUSTOMER_CONTRACTS, {
    variables: { customerId: id },
    skip: !id,
  });

  const { data: invoicesData, loading: invoicesLoading } = useQuery(GET_CUSTOMER_INVOICES, {
    variables: { customerId: id },
    skip: !id,
  });

  return {
    customer: customerData?.customer ?? null,
    deposits: depositsData?.customerDeposits ?? [],
    contracts: contractsData?.customerContracts ?? [],
    invoices: invoicesData?.customerInvoices ?? [],
    loading: customerLoading || depositsLoading || contractsLoading || invoicesLoading,
    error: customerError,
    refetch: refetchCustomer,
  };
}

export function useCustomerMutations() {
  const [createCustomer] = useMutation(CREATE_CUSTOMER, {
    refetchQueries: [{ query: GET_CUSTOMERS }],
    onCompleted: () => toast.success('Customer created'),
    onError: () => toast.error('Failed to create customer'),
  });

  const [updateCustomer] = useMutation(UPDATE_CUSTOMER, {
    refetchQueries: [{ query: GET_CUSTOMER }],
    onCompleted: () => toast.success('Customer updated'),
    onError: () => toast.error('Failed to update customer'),
  });

  const [deleteCustomer] = useMutation(DELETE_CUSTOMER, {
    refetchQueries: [{ query: GET_CUSTOMERS }],
    onCompleted: () => toast.success('Customer deleted'),
    onError: () => toast.error('Failed to delete customer'),
  });

  return {
    createCustomer,
    updateCustomer,
    deleteCustomer,
  };
}

// ═══════════════════════════════════════════════════════
// Onboarding
// ═══════════════════════════════════════════════════════

export function useOnboardingList(customerId?: string) {
  const { data, loading, error, refetch } = useQuery<{ customers: Customer[] }>(GET_CUSTOMERS, {
    variables: customerId ? { id: customerId } : undefined,
    fetchPolicy: 'cache-and-network',
  });
  return {
    onboardings: data?.customers ?? [],
    loading,
    error,
    refetch,
  };
}

// ═══════════════════════════════════════════════════════
// Conversion helper (lead → customer)
// ═══════════════════════════════════════════════════════

export function useLeadConversion() {
  const client = useApolloClient();

  const convert = async (leadId: string, leadData: Lead) => {
    try {
      const { data } = await client.mutate({
        mutation: CONVERT_LEAD,
        variables: { id: leadId },
        refetchQueries: [
          { query: GET_LEADS },
          { query: GET_CUSTOMERS },
          { query: LEAD_PIPELINE_STATS },
        ],
      });

      if (data?.convertLead?.success) {
        toast.success('Lead converted to customer');
        return data.convertLead;
      }
      return null;
    } catch {
      toast.error('Failed to convert lead');
      return null;
    }
  };

  return { convert };
}
