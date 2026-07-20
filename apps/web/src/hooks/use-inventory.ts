"use client";

/**
 * File:        apps/web/src/hooks/use-inventory.ts
 * Module:      Web · Hooks · Inventory
 * Purpose:     Apollo-based data layer for inventory (Centers, Floors, Seats)
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-19
 */
import { useState } from 'react';
import { useQuery, useMutation, useApolloClient, gql } from '@apollo/client';
import { toast } from 'sonner';
import {
  GET_MY_CENTERS,
  CREATE_CENTER,
  UPDATE_CENTER,
  GET_FLOORS,
  GET_SEATS,
  CREATE_FLOOR,
  UPDATE_FLOOR,
  DELETE_FLOOR,
  CREATE_SEAT,
  UPDATE_SEAT,
  DELETE_SEAT,
} from '@/lib/apollo/operations';

// ═══════════════════════════════════════════════════════
// Query Hooks
// ═══════════════════════════════════════════════════════

export function useCenters(filters?: { locationId?: string }) {
  const { data, loading, error, refetch } = useQuery(GET_MY_CENTERS, {
    variables: filters,
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });
  return {
    centers: (data?.myCenters ?? data?.centers ?? []) as any[],
    loading,
    error,
    refetch,
  };
}

export function useFloors(centerId?: string | null) {
  const { data, loading, error, refetch } = useQuery(GET_FLOORS, {
    variables: { centerId },
    skip: !centerId,
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });
  return {
    floors: (data?.floors ?? []) as any[],
    loading,
    error,
    refetch,
  };
}

export function useSeats(floorId?: string | null) {
  const { data, loading, error, refetch } = useQuery(GET_SEATS, {
    variables: { floorId },
    skip: !floorId,
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });
  return {
    seats: (data?.seats ?? []) as any[],
    loading,
    error,
    refetch,
  };
}

// ═══════════════════════════════════════════════════════
// Mutation Hooks
// ═══════════════════════════════════════════════════════

function useMutationWithRefetch<TInput extends Record<string, unknown>, TOutput>(
  document: any,
  refetchQueryNames: string[],
  successMessage?: (data: TOutput) => string,
  errorMessage = 'Action failed',
): [boolean, (variables: TInput) => Promise<TOutput | null>] {
  const [loading, setLoading] = useState(false);
  const client = useApolloClient();
  const [mutate] = useMutation(document, { errorPolicy: 'all' });

  async function action(variables: TInput): Promise<TOutput | null> {
    setLoading(true);
    try {
      const result = await mutate({ variables: variables as any });
      if (result.errors?.length) {
        toast.error(result.errors[0]?.message ?? errorMessage);
        return null;
      }
      await client.refetchQueries({ include: refetchQueryNames });
      if (successMessage) toast.success(successMessage(result.data));
      return result.data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : errorMessage;
      toast.error(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }

  return [loading, action];
}

// ── Center mutations ──

export function useCreateCenter() {
  const [loading, action] = useMutationWithRefetch<any, { createCenter: { id: string; name: string } }>(
    CREATE_CENTER,
    ['GetMyCenters', 'GetCenters', 'GetFloors'],
    (data) => `Center "${data.createCenter.name}" created`,
    'Failed to create center',
  );
  return { loading, createCenter: action };
}

export function useUpdateCenter() {
  const [loading, action] = useMutationWithRefetch<any, { updateCenter: { name: string } }>(
    UPDATE_CENTER,
    ['GetMyCenters', 'GetCenters'],
    (data) => `Center "${data.updateCenter.name}" updated`,
    'Failed to update center',
  );
  return { loading, updateCenter: action };
}

// ── Floor mutations ──

export function useCreateFloor() {
  const [loading, action] = useMutationWithRefetch<any, { createFloor: { name: string } }>(
    CREATE_FLOOR,
    ['GetFloors', 'GetDashboardMetrics'],
    (data) => `Floor "${data.createFloor.name}" created`,
    'Failed to create floor',
  );
  return { loading, createFloor: action };
}

export function useUpdateFloor() {
  const [loading, action] = useMutationWithRefetch<any, { updateFloor: { name: string } }>(
    UPDATE_FLOOR,
    ['GetFloors'],
    (data) => `Floor "${data.updateFloor.name}" updated`,
    'Failed to rename floor',
  );
  return { loading, updateFloor: action };
}

export function useDeleteFloor() {
  const [loading, action] = useMutationWithRefetch<{ id: string }, { deleteFloor: boolean }>(
    DELETE_FLOOR,
    ['GetFloors', 'GetDashboardMetrics'],
    () => 'Floor deleted',
    'Failed to delete floor',
  );
  return { loading, deleteFloor: action };
}

// ── Seat mutations ──

export function useCreateSeat() {
  const [loading, action] = useMutationWithRefetch<any, { createSeat: { name: string } }>(
    CREATE_SEAT,
    ['GetSeats', 'GetFloors', 'GetDashboardMetrics'],
    (data) => `Seat "${data.createSeat.name}" added`,
    'Failed to add seat',
  );
  return { loading, createSeat: action };
}

export function useUpdateSeat() {
  const [loading, action] = useMutationWithRefetch<any, { updateSeat: { name: string } }>(
    UPDATE_SEAT,
    ['GetSeats'],
    (data) => `Seat "${data.updateSeat.name}" updated`,
    'Failed to update seat',
  );
  return { loading, updateSeat: action };
}

export function useDeleteSeat() {
  const [loading, action] = useMutationWithRefetch<{ id: string }, { deleteSeat: boolean }>(
    DELETE_SEAT,
    ['GetSeats', 'GetFloors'],
    () => 'Seat deleted',
    'Failed to delete seat',
  );
  return { loading, deleteSeat: action };
}
