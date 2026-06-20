/**
 * File:        apps/web/src/app/dashboard/page.tsx
 * Module:      Web · Dashboard · Overview Page
 * Purpose:     Main dashboard with overview stats, KPI cards, and management sections
 *
 * Layout structure (matches dashboard_01.png):
 * - Welcome Header: greeting + subtitle (14px radius, subtle shadow)
 * - KPI Cards Row: 4 cards with equal widths, 21px gap
 * - 3-Column Grid:
 *   - Column 1: Total Lead (top) + Deposit Held + Event Today (bottom, side by side)
 *   - Column 2: Payment Health (full height)
 *   - Column 3: Tasks& Compliance (full height)
 * - Full Width: Approval Queue
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-05-31
 */

"use client";

import { StatCards } from "@/components/ui/stat-card";
import { TotalLeadCardDemo } from "@/components/ui/dashboard/total-lead-card";
import { PaymentHealthCardDemo } from "@/components/ui/dashboard/payment-health-card";
import { DepositHeldCardDemo, EventTodayCardDemo } from "@/components/ui/dashboard/metric-cards";
import { TasksComplianceCardDemo } from "@/components/ui/dashboard/tasks-compliance-card";
import { ApprovalQueueCardDemo } from "@/components/ui/dashboard/approval-queue-card";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-5">
      {/* Welcome Header - 14px radius with subtle shadow */}
      <div className="bg-white rounded-[14px] shadow-[0px_0px_0px_0.5px_rgba(0,0,0,0.08),0px_2px_4px_-2px_rgba(0,0,0,0.05)] px-5 py-[18px]">
        <h1 className="text-[21.5px] font-semibold text-[#111827] tracking-[-0.5px] mb-[3px]">
          Welcome back, Rahul!
        </h1>
        <p className="text-[15px] text-[#4B5565] tracking-[-0.5px]">
          Monitor meeting room usage, availability and booking status
        </p>
      </div>

      {/* Row 1: 4 KPI Cards - equal widths, 21px gap */}
      <StatCards />

      {/* 3-Column Grid Row */}
      <div className="flex gap-5 items-start">
        {/* Column 1: Total Lead + (Deposit Held + Event Today) */}
        <div className="flex flex-col gap-5 w-[473px] shrink-0">
          <TotalLeadCardDemo />
          <div className="flex gap-5">
            <DepositHeldCardDemo />
            <EventTodayCardDemo />
          </div>
        </div>

        {/* Column 2: Payment Health */}
        <div className="flex-1 min-w-0">
          <PaymentHealthCardDemo />
        </div>

        {/* Column 3: Tasks & Compliance */}
        <div className="flex-1 min-w-0">
          <TasksComplianceCardDemo />
        </div>
      </div>

      {/* Bottom: Approval Queue - full width */}
      <ApprovalQueueCardDemo />
    </div>
  );
}
