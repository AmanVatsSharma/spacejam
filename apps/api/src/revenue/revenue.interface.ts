/**
 * File:        apps/api/src/revenue/revenue.interface.ts
 * Module:      API · Revenue Interface
 * Purpose:     Type definitions for revenue data
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-07
 */

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

export interface Invoice {
  id: string;
  client: string;
  amount: string;
  date: string;
  status: 'paid' | 'pending' | 'overdue';
}