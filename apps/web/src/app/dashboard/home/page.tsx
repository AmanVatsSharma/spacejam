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

import { useState } from "react";
import { StatCards } from "@/components/ui/stat-card";
import { TotalLeadCardDemo } from "@/components/ui/dashboard/total-lead-card";
import { PaymentHealthCardDemo } from "@/components/ui/dashboard/payment-health-card";
import { DepositHeldCardDemo, EventTodayCardDemo } from "@/components/ui/dashboard/metric-cards";
import { TasksComplianceCardDemo } from "@/components/ui/dashboard/tasks-compliance-card";
import { ApprovalQueueCardDemo } from "@/components/ui/dashboard/approval-queue-card";
import { RoomAvailabilityCircleCardDemo } from "@/components/ui/dashboard/room-availability-circle-card";
import { MeetingRoomBookingGridDemo } from "@/components/ui/dashboard/meeting-room-booking-grid";
import { AddLeadModal, AddClientModal } from "@/components/ui/dashboard";

export default function DashboardPage() {
  const [showAddLead, setShowAddLead] = useState(false);
  const [showAddClient, setShowAddClient] = useState(false);

  return (
    <div className="flex flex-col gap-6 p-2">
      {/* Welcome Header */}
      <div className="bg-white rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.05)] px-6 py-5 flex justify-between items-center border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Welcome Jhon Doe,
          </h1>
          <p className="text-[15px] text-gray-500">
            Monitor meeting room usage , availability and booking status
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowAddLead(true)}
            className="flex items-center gap-2 bg-[#FF7A49] text-white px-5 py-2.5 rounded-[10px] font-medium text-sm transition-colors hover:bg-[#E56A39]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
            Add Lead
          </button>
          <button 
            onClick={() => setShowAddClient(true)}
            className="flex items-center gap-2 bg-[#FF7A49] text-white px-5 py-2.5 rounded-[10px] font-medium text-sm transition-colors hover:bg-[#E56A39]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
            Add Client
          </button>
        </div>
      </div>

      {/* Row 1: 4 KPI Cards */}
      <StatCards />

      {/* Middle Row (Payment Health, Tasks, Total Lead) */}
      <div className="grid grid-cols-[1.3fr_1.4fr_1fr] gap-6 items-stretch">
        <div className="flex flex-col gap-6 min-w-0">
          <div className="flex-1 flex flex-col">
            <TotalLeadCardDemo />
          </div>
          <div className="grid grid-cols-2 gap-6 flex-1">
            <div className="flex flex-col h-full [&>div]:flex-1 [&>div]:h-full">
              <DepositHeldCardDemo />
            </div>
            <div className="flex flex-col h-full [&>div]:flex-1 [&>div]:h-full">
              <EventTodayCardDemo />
            </div>
          </div>
        </div>

        <div className="flex flex-col min-w-0 [&>div]:flex-1 [&>div]:h-full">
          <PaymentHealthCardDemo />
        </div>

        <div className="flex flex-col min-w-0 [&>div]:flex-1 [&>div]:h-full">
          <TasksComplianceCardDemo />
        </div>
      </div>

      {/* Bottom Row (Availability, Bookings, Approvals) */}
      <div className="grid grid-cols-[1.3fr_1.4fr_1fr] gap-6 items-stretch">
        <div className="flex flex-col min-w-0 [&>div]:flex-1 [&>div]:h-full">
          <RoomAvailabilityCircleCardDemo />
        </div>
        
        <div className="flex flex-col min-w-0 [&>div]:flex-1 [&>div]:h-full">
          <MeetingRoomBookingGridDemo />
        </div>

        <div className="flex flex-col min-w-0 [&>div]:flex-1 [&>div]:h-full">
          <ApprovalQueueCardDemo />
        </div>
      </div>
      
      {/* Modals */}
      <AddLeadModal open={showAddLead} onClose={() => setShowAddLead(false)} />
      <AddClientModal open={showAddClient} onClose={() => setShowAddClient(false)} />
    </div>
  );
}
