/**
 * File:        apps/web/src/app/dashboard/page.tsx
 * Module:      Web · Dashboard · Main Page
 * Purpose:     Dashboard home — pixel-perfect match to Figma node 0:32185
 *
 * Design Reference: Figma SpaceJam-VB node 0:32185
 * Layout:
 *   - Welcome header (title + Add Lead/Add Client buttons)
 *   - 6 KPI cards row
 *   - Total Lead (left, wide) | Room Availability Circle (right)
 *   - Meeting Room Booking (left) | Payment Health + Tasks (center) | Approvals (right)
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-24
 */

"use client";

import { StatCards } from "@/components/ui/stat-card";
import {
  TotalLeadCard,
  PaymentHealthCard,
  TasksComplianceCard,
  ApprovalQueueCard,
  RoomAvailabilityCircleCard,
  MeetingRoomBookingGrid,
} from "@/components/ui/dashboard";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6 compact:gap-4 p-6 compact:p-3 max-w-full overflow-x-auto">
      {/* Welcome Header */}
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[24px] font-bold text-[#1F2937] leading-[30px] tracking-[-0.5px]">
            Welcome Jhon Doe,
          </h1>
          <p className="text-[14px] font-normal text-[#6B7280] leading-[20px] mt-1">
            Monitor meeting room usage, availability and booking status
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="h-10 px-5 bg-[#FF6A2F] hover:bg-[#E55A1F] text-white text-[14px] font-medium rounded-[10px] transition-colors"
          >
            + Add Lead
          </button>
          <button
            type="button"
            className="h-10 px-5 bg-[#FF6A2F] hover:bg-[#E55A1F] text-white text-[14px] font-medium rounded-[10px] transition-colors"
          >
            + Add Client
          </button>
        </div>
      </header>

      {/* 6 KPI cards row */}
      <StatCards />

      {/* Top row: Total Lead (left, wide) | Room Availability Circle (right) */}
      <div className="grid grid-cols-12 gap-6 compact:gap-4 compact:grid-cols-1">
        <div className="col-span-7 compact:col-span-1">
          <TotalLeadCard
            totalLeads={1349}
            changePercent={1.6}
            visited={459}
            inquiry={350}
            converted={215}
          />
        </div>
        <div className="col-span-5 compact:col-span-1 flex flex-col gap-6 compact:gap-4 min-w-0">
          <RoomAvailabilityCircleCard
            onViewFloorPlan={() => console.log("View Floor Plan")}
            className="w-full"
          />
        </div>
      </div>

      {/* Middle row: Meeting Room Booking (left) | Payment Health (center) | Tasks & Approvals (right) */}
      <div className="grid grid-cols-12 gap-6 compact:gap-4 compact:grid-cols-1">
        <div className="col-span-6 compact:col-span-1">
          <MeetingRoomBookingGrid />
        </div>
        <div className="col-span-3 compact:col-span-1 flex flex-col gap-6 compact:gap-4">
          <TasksComplianceCard
            badgeCount={8}
            onViewAll={() => console.log("View all tasks")}
            className="w-full"
          />
          <PaymentHealthCard className="w-full" />
        </div>
        <div className="col-span-3 compact:col-span-1">
          <ApprovalQueueCard
            pendingCount={5}
            onViewAll={() => console.log("View all approvals")}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
