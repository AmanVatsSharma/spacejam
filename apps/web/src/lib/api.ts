/**
 * File:        apps/web/src/lib/api.ts
 * Module:      Web · API Service
 * Purpose:     GraphQL-based API service for connecting to backend.
 *              All dashboard pages use Apollo Client directly via
 *              @/lib/apollo/operations.ts — this file provides a
 *              convenience wrapper for non-React contexts (e.g., SSR,
 *              middleware, or scripts).
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-07
 */

const GRAPHQL_URL =
  typeof window !== 'undefined'
    ? '/api/graphql'
    : process.env.NEXT_PUBLIC_GRAPHQL_HTTP_URL || 'http://localhost:3001/graphql';

export interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string; extensions?: Record<string, unknown> }>;
}

/**
 * Execute a raw GraphQL query/mutation against the backend.
 * Prefer using Apollo Client hooks (@/lib/apollo/operations.ts) in React
 * components. Use this only for non-React contexts.
 */
export async function graphqlRequest<T>(
  query: string,
  variables?: Record<string, unknown>,
  token?: string,
): Promise<GraphQLResponse<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`GraphQL request failed: ${response.status} ${errorBody}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[api] GraphQL request failed:', error);
    return {
      errors: [{ message: error instanceof Error ? error.message : 'Unknown error' }],
    };
  }
}

// ── Legacy type exports (kept for backward compatibility) ──

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface RevenueData {
  totalRevenue: number;
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
    target?: number;
  }>;
  paymentHealth: {
    paid: number;
    overdue: number;
    partial: number;
  };
  outstandingInvoices: number;
}

export interface OccupancyData {
  spaceType: string;
  totalSpaces: number;
  occupiedSpaces: number;
  utilizationRate: number;
}

export interface BookingData {
  id: string;
  guestName: string;
  spaceType: string;
  spaceName: string;
  checkIn: string;
  checkOut: string;
  status: 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled';
}

export interface CustomerData {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  type: 'lead' | 'customer' | 'partner';
  createdAt: string;
  totalBookings?: number;
  totalSpent?: number;
}