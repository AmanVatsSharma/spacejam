/**
 * File:        apps/api/src/revenue/revenue.service.ts
 * Module:      API · Revenue Service
 * Purpose:     Revenue data service
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-07
 */

import { Injectable } from '@nestjs/common';
import { RevenueData } from './revenue.interface';

@Injectable()
export class RevenueService {
  private revenueData: RevenueData = {
    totalRevenue: 1245000,
    monthlyRevenue: [
      { month: "Jan", revenue: 950000, target: 1000000 },
      { month: "Feb", revenue: 1100000, target: 1050000 },
      { month: "Mar", revenue: 1250000, target: 1100000 },
      { month: "Apr", revenue: 1180000, target: 1200000 },
      { month: "May", revenue: 1245000, target: 1250000 },
      { month: "Jun", revenue: 1400000, target: 1300000 },
    ],
    paymentHealth: {
      paid: 730000,
      overdue: 160000,
      partial: 110000,
    },
    outstandingInvoices: 45000,
  };

  getRevenue() {
    return this.revenueData;
  }

  getInvoices() {
    return [
      {
        id: "INV-001",
        client: "TechCorp India",
        amount: "₹45,000",
        date: "May 28, 2026",
        status: "paid",
      },
      {
        id: "INV-002",
        client: "StartupXYZ",
        amount: "₹28,500",
        date: "May 25, 2026",
        status: "pending",
      },
      {
        id: "INV-003",
        client: "Design Studio",
        amount: "₹32,000",
        date: "May 20, 2026",
        status: "overdue",
      },
      {
        id: "INV-004",
        client: "Freelancer Co.",
        amount: "₹15,000",
        date: "May 18, 2026",
        status: "paid",
      },
    ];
  }
}