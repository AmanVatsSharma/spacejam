/**
 * File:        apps/web/src/hooks/use-customer-team.ts
 * Module:      Web · Hooks · Customer Team & Documents
 * Purpose:     Apollo mutations for customer employees (team members) and
 *              documents — backs the customer detail page tabs.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-24
 */
'use client';

import { useState } from 'react';
import { useApolloClient } from '@apollo/client';
import { toast } from 'sonner';
import {
  GET_CUSTOMER,
  CREATE_CUSTOMER_EMPLOYEE,
  UPDATE_CUSTOMER_EMPLOYEE,
  DELETE_CUSTOMER_EMPLOYEE,
  CREATE_CUSTOMER_DOCUMENT,
  UPDATE_CUSTOMER_DOCUMENT,
  DELETE_CUSTOMER_DOCUMENT,
} from '@/lib/apollo/operations';

type Refetch = { query: any; variables?: Record<string, any> }[];

const customerRefetch = (customerId: string): Refetch => [
  { query: GET_CUSTOMER, variables: { id: customerId } },
];

// ─── Employees ────────────────────────────────────────────────────────────

export function useCreateCustomerEmployee(customerId: string) {
  const client = useApolloClient();
  const [loading, setLoading] = useState(false);
  const create = async (input: Record<string, any>) => {
    setLoading(true);
    try {
      const { data } = await client.mutate({
        mutation: CREATE_CUSTOMER_EMPLOYEE,
        variables: { input },
        refetchQueries: customerRefetch(customerId),
      });
      toast.success('Team member added');
      return data?.createCustomerEmployee;
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add team member');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  return { create, loading };
}

export function useUpdateCustomerEmployee(customerId: string) {
  const client = useApolloClient();
  const [loading, setLoading] = useState(false);
  const update = async (id: string, input: Record<string, any>) => {
    setLoading(true);
    try {
      const { data } = await client.mutate({
        mutation: UPDATE_CUSTOMER_EMPLOYEE,
        variables: { id, input },
        refetchQueries: customerRefetch(customerId),
      });
      toast.success('Team member updated');
      return data?.updateCustomerEmployee;
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update team member');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  return { update, loading };
}

export function useDeleteCustomerEmployee(customerId: string) {
  const client = useApolloClient();
  const [loading, setLoading] = useState(false);
  const remove = async (id: string) => {
    setLoading(true);
    try {
      const { data } = await client.mutate({
        mutation: DELETE_CUSTOMER_EMPLOYEE,
        variables: { id },
        refetchQueries: customerRefetch(customerId),
      });
      toast.success('Team member removed');
      return Boolean(data?.deleteCustomerEmployee);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to remove team member');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  return { remove, loading };
}

// ─── Documents ────────────────────────────────────────────────────────────

export function useCreateCustomerDocument(customerId: string) {
  const client = useApolloClient();
  const [loading, setLoading] = useState(false);
  const create = async (input: Record<string, any>) => {
    setLoading(true);
    try {
      const { data } = await client.mutate({
        mutation: CREATE_CUSTOMER_DOCUMENT,
        variables: { input },
        refetchQueries: customerRefetch(customerId),
      });
      toast.success('Document added');
      return data?.createCustomerDocument;
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add document');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  return { create, loading };
}

export function useDeleteCustomerDocument(customerId: string) {
  const client = useApolloClient();
  const [loading, setLoading] = useState(false);
  const remove = async (id: string) => {
    setLoading(true);
    try {
      const { data } = await client.mutate({
        mutation: DELETE_CUSTOMER_DOCUMENT,
        variables: { id },
        refetchQueries: customerRefetch(customerId),
      });
      toast.success('Document deleted');
      return Boolean(data?.deleteCustomerDocument);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete document');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  return { remove, loading };
}
