"use client";

/**
 * File:        apps/web/src/hooks/use-revenue.ts
 * Module:      Web · Hooks · Revenue
 * Purpose:     Apollo-based data layer for Revenue — invoices, deposits, contracts.
 *              Centralises all revenue queries and mutations so every revenue
 *              page shares one source of truth for refetch logic and error handling.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-22
 */

import { useMemo } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { toast } from 'sonner';
import {
  GET_INVOICES,
  GET_INVOICE,
  CREATE_INVOICE,
  UPDATE_INVOICE,
  DELETE_INVOICE,
  GET_DEPOSITS,
  GET_DEPOSIT,
  CREATE_DEPOSIT,
  UPDATE_DEPOSIT,
  DELETE_DEPOSIT,
  GET_CONTRACTS,
  GET_CONTRACT,
  CREATE_CONTRACT,
  UPDATE_CONTRACT,
  TERMINATE_CONTRACT,
  GET_CUSTOMERS,
} from '@/lib/apollo/operations';

// ═══════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════

export interface Invoice {
  id: string;
  customerId?: string;
  customer?: { id: string; name: string };
  amount: number;
  tax: number;
  totalAmount: number;
  status: string;
  dueDate?: string;
  paidAt?: string;
  createdAt?: string;
}

export interface Deposit {
  id: string;
  customerId?: string;
  customer?: { id: string; name: string };
  amount: number;
  method: string;
  status: string;
  reference?: string;
  receivedAt?: string;
  createdAt?: string;
}

export interface Contract {
  id: string;
  customerId?: string;
  customer?: { id: string; name: string };
  planType: string;
  startDate?: string;
  endDate?: string;
  amount: number;
  status: string;
  createdAt?: string;
}

// ═══════════════════════════════════════════════════════
// Invoices
// ═══════════════════════════════════════════════════════

export function useInvoices(fetchPolicy: 'cache-first' | 'cache-and-network' | 'network-only' = 'cache-first') {
  const { data, loading, error, refetch } = useQuery<{ invoices: Invoice[] }>(GET_INVOICES, {
    fetchPolicy,
  });
  return {
    invoices: data?.invoices ?? [],
    loading,
    error,
    refetch,
  };
}

export function useInvoice(id: string | undefined) {
  const { data, loading, error, refetch } = useQuery<{ invoice: Invoice }>(GET_INVOICE, {
    variables: { id },
    skip: !id,
  });
  return {
    invoice: data?.invoice ?? null,
    loading,
    error,
    refetch,
  };
}

export function useInvoiceMutations() {
  const refetchAll = useMemo(() => [
    { query: GET_INVOICES },
    { query: GET_DEPOSITS },
    { query: GET_CONTRACTS },
  ], []);

  const [createInvoice] = useMutation(CREATE_INVOICE, {
    refetchQueries: [{ query: GET_INVOICES }],
    onCompleted: () => toast.success('Invoice created'),
    onError: () => toast.error('Failed to create invoice'),
  });

  const [updateInvoice] = useMutation(UPDATE_INVOICE, {
    refetchQueries: [{ query: GET_INVOICE }],
    onCompleted: () => toast.success('Invoice updated'),
    onError: () => toast.error('Failed to update invoice'),
  });

  const [deleteInvoice] = useMutation(DELETE_INVOICE, {
    refetchQueries: [{ query: GET_INVOICES }],
    onCompleted: () => toast.success('Invoice deleted'),
    onError: () => toast.error('Failed to delete invoice'),
  });

  return {
    createInvoice,
    updateInvoice,
    deleteInvoice,
  };
}

// ═══════════════════════════════════════════════════════
// Deposits
// ═══════════════════════════════════════════════════════

export function useDeposits(fetchPolicy: 'cache-first' | 'cache-and-network' | 'network-only' = 'cache-first') {
  const { data, loading, error, refetch } = useQuery<{ deposits: Deposit[] }>(GET_DEPOSITS, {
    fetchPolicy,
  });
  return {
    deposits: data?.deposits ?? [],
    loading,
    error,
    refetch,
  };
}

export function useDeposit(id: string | undefined) {
  const { data, loading, error, refetch } = useQuery<{ deposit: Deposit }>(GET_DEPOSIT, {
    variables: { id },
    skip: !id,
  });
  return {
    deposit: data?.deposit ?? null,
    loading,
    error,
    refetch,
  };
}

export function useDepositMutations() {
  const [createDeposit] = useMutation(CREATE_DEPOSIT, {
    refetchQueries: [{ query: GET_DEPOSITS }],
    onCompleted: () => toast.success('Deposit created'),
    onError: () => toast.error('Failed to create deposit'),
  });

  const [updateDeposit] = useMutation(UPDATE_DEPOSIT, {
    refetchQueries: [{ query: GET_DEPOSIT }],
    onCompleted: () => toast.success('Deposit updated'),
    onError: () => toast.error('Failed to update deposit'),
  });

  const [deleteDeposit] = useMutation(DELETE_DEPOSIT, {
    refetchQueries: [{ query: GET_DEPOSITS }],
    onCompleted: () => toast.success('Deposit deleted'),
    onError: () => toast.error('Failed to delete deposit'),
  });

  return {
    createDeposit,
    updateDeposit,
    deleteDeposit,
  };
}

// ═══════════════════════════════════════════════════════
// Contracts
// ═══════════════════════════════════════════════════════

export function useContracts(fetchPolicy: 'cache-first' | 'cache-and-network' | 'network-only' = 'cache-first') {
  const { data, loading, error, refetch } = useQuery<{ contracts: Contract[] }>(GET_CONTRACTS, {
    fetchPolicy,
  });
  return {
    contracts: data?.contracts ?? [],
    loading,
    error,
    refetch,
  };
}

export function useContract(id: string | undefined) {
  const { data, loading, error, refetch } = useQuery<{ contract: Contract }>(GET_CONTRACT, {
    variables: { id },
    skip: !id,
  });
  return {
    contract: data?.contract ?? null,
    loading,
    error,
    refetch,
  };
}

export function useContractMutations() {
  const [createContract] = useMutation(CREATE_CONTRACT, {
    refetchQueries: [{ query: GET_CONTRACTS }],
    onCompleted: () => toast.success('Contract created'),
    onError: () => toast.error('Failed to create contract'),
  });

  const [updateContract] = useMutation(UPDATE_CONTRACT, {
    refetchQueries: [{ query: GET_CONTRACT }],
    onCompleted: () => toast.success('Contract updated'),
    onError: () => toast.error('Failed to update contract'),
  });

  const [terminateContract] = useMutation(TERMINATE_CONTRACT, {
    refetchQueries: [{ query: GET_CONTRACTS }],
    onCompleted: () => toast.success('Contract terminated'),
    onError: () => toast.error('Failed to terminate contract'),
  });

  return {
    createContract,
    updateContract,
    terminateContract,
  };
}

// ═══════════════════════════════════════════════════════
// Customer list lookup for modals (deposit/invoice/contract creation)
// ═══════════════════════════════════════════════════════

export function useCustomerLookup() {
  const { data, loading, error } = useQuery<{ customers: { id: string; name: string }[] }>(GET_CUSTOMERS, {
    fetchPolicy: 'cache-first',
  });

  return {
    customers: data?.customers ?? [],
    loading,
    error,
  };
}

// ═══════════════════════════════════════════════════════
// Financial summary for Overview tab
// ═══════════════════════════════════════════════════════

export function useFinancialSummary() {
  const { data: invoicesData } = useQuery(GET_INVOICES, { fetchPolicy: 'cache-first' });
  const { data: depositsData } = useQuery(GET_DEPOSITS, { fetchPolicy: 'cache-first' });
  const { data: contractsData } = useQuery(GET_CONTRACTS, { fetchPolicy: 'cache-first' });

  const invoices = invoicesData?.invoices ?? [];
  const deposits = depositsData?.deposits ?? [];
  const contracts = contractsData?.contracts ?? [];

  const summary = useMemo(() => {
    const totalRevenue = invoices
      .filter((inv: Invoice) => inv.status === 'PAID')
      .reduce((sum: number, inv: Invoice) => sum + inv.totalAmount, 0);

    const totalDeposits = deposits
      .filter((d: Deposit) => d.status === 'RECEIVED')
      .reduce((sum: number, d: Deposit) => sum + d.amount, 0);

    const activeContracts = contracts.filter((c: Contract) => c.status === 'ACTIVE').length;

    const pendingInvoices = invoices.filter((inv: Invoice) => inv.status === 'PENDING').length;
    const pendingAmount = invoices
      .filter((inv: Invoice) => inv.status === 'PENDING')
      .reduce((sum: number, inv: Invoice) => sum + inv.totalAmount, 0);

    return {
      totalRevenue,
      totalDeposits,
      activeContracts,
      pendingInvoices,
      pendingAmount,
      totalInvoices: invoices.length,
      totalDepositsCount: deposits.length,
      totalContracts: contracts.length,
    };
  }, [invoices, deposits, contracts]);

  return { summary, invoices, deposits, contracts };
}
