/**
 * File:        apps/web/src/app/dashboard/page.tsx
 * Module:      Web · Dashboard · Overview Page
 * Purpose:     Main dashboard with overview stats, KPI cards, and management sections
 *
 * Layout structure (row by row):
 * - Welcome Header: greeting + subtitle
 * - KPI Cards Row: 4 cards spanning full width
 * - Second Stack Row: Total Lead (473px fixed) + Payment Health (flex remaining)
 * - Third Row: Deposit Held + Event Today (280px each, side by side)
 * - Fourth Row: Tasks & Compliance (full width)
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-05-28
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
      {/* Welcome Header */}
      <div className="bg-white rounded-[19px] shadow-[0px_0px_6px_rgba(252,135,88,0.2),0px_0px_5px_rgba(99,99,99,0.25)] p-5">
        <h1 className="text-[21.5px] font-semibold text-[#111827] tracking-[-0.5px] mb-1">
          Welcome back, Rahul!
        </h1>
        <p className="text-[16px] text-[#4B5565] tracking-[-0.5px]">
          Monitor meeting room usage, availability and booking status
        </p>
      </div>

      {/* Row 1: 4 KPI Cards */}
      <StatCards />

      {/* Row 2: Total Lead (473px fixed) + Payment Health (flex remaining) */}
      <div className="flex gap-5">
        <TotalLeadCardDemo />
        <div className="flex-1">
          <PaymentHealthCardDemo />
        </div>
      </div>

      {/* Row 3: Deposit Held + Event Today */}
      <div className="flex gap-5">
        <DepositHeldCardDemo />
        <EventTodayCardDemo />
      </div>

      {/* Row 4: Approval Queue + Tasks & Compliance */}
      <div className="flex gap-5">
        <ApprovalQueueCardDemo />
        <TasksComplianceCardDemo />
      </div>
    </div>
  );
}