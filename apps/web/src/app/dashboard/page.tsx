/**
 * File:        apps/web/src/app/dashboard/page.tsx
 * Module:      Web · Dashboard · Home Screen
 * Purpose:     Redesigned home screen with quick actions, lead management, and room overview
 *
 * Design Reference: dashboard-design-hd.png
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-26
 */

"use client";

import React from "react";
import { useAuth } from "@/contexts/auth-context";
import {
  StatCard,
  RevenueIcon,
  CustomersIcon,
  DuesIcon,
  BookingsIcon,
} from "@/components/ui/stat-card";
import {
  TotalLeadCardDemo,
  ApprovalQueueCardDemo,
  PaymentHealthCardDemo,
  TasksComplianceCardDemo,
  RoomAvailabilityCircleCardDemo,
  MeetingRoomBookingGridDemo,
  DepositHeldCardDemo,
  EventTodayCardDemo,
} from "@/components/ui/dashboard";

export default function DashboardPage() {
  const { user } = useAuth();
  const greetingName = user?.name?.split(/\s+/)[0] ?? user?.email?.split("@")[0] ?? "Jhon Doe";

  const stats = [
    {
      label: "Revenue (MTD)",
      value: "₹9.8L",
      icon: <RevenueIcon />,
      changePercent: 12,
      changeDirection: "up" as const,
      className: "flex-1 min-w-0",
    },
    {
      label: "Active Customer",
      value: "20",
      icon: <CustomersIcon />,
      changePercent: 5,
      changeDirection: "up" as const,
      className: "flex-1 min-w-0",
    },
    {
      label: "Outstanding Dues",
      value: "₹6.2L",
      icon: <DuesIcon />,
      changePercent: 8,
      changeDirection: "down" as const,
      className: "flex-1 min-w-0",
    },
    {
      label: "Booking Today",
      value: "3",
      icon: <BookingsIcon />,
      changePercent: 5,
      changeDirection: "up" as const,
      className: "flex-1 min-w-0",
    },
  ];

  return (
    <div className="flex flex-col gap-[24px]">
      {/* Welcome Header */}
      <div className="bg-white rounded-[14px] shadow-sm border border-[#E5E7EB] px-6 py-5 flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-[22px] font-semibold text-[#101828]">Welcome {greetingName},</h1>
          <p className="text-sm text-[#4A5565]">
            Monitor meeting room usage , availability and booking status
          </p>
        </div>
        <div className="flex gap-3">
          <button className="h-10 px-4 bg-[#FF6A2F] text-white rounded-[10px] text-sm font-medium hover:bg-[#FF5A1F] transition-colors shadow-sm flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7 0v4m2-2h-4M2 14v-1.5a3.5 3.5 0 0 1 3.5-3.5h1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Add Lead
          </button>
          <button className="h-10 px-4 bg-[#FF6A2F] text-white rounded-[10px] text-sm font-medium hover:bg-[#FF5A1F] transition-colors shadow-sm flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7 0v4m2-2h-4M2 14v-1.5a3.5 3.5 0 0 1 3.5-3.5h1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Add Client
          </button>
        </div>
      </div>

      {/* Row 1: KPI Cards */}
      <div className="grid grid-cols-4 compact:grid-cols-2 gap-[24px] compact:gap-3">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Row 2: Lead & Health */}
      <div className="flex gap-[24px] compact:flex-col items-start w-full">
        {/* Left Column */}
        <div className="flex flex-col gap-[24px] flex-shrink-0">
          <TotalLeadCardDemo />
          <div className="flex gap-[24px]">
            <DepositHeldCardDemo />
            <EventTodayCardDemo />
          </div>
        </div>
        
        {/* Middle Column */}
        <div className="flex-shrink-0">
          <PaymentHealthCardDemo />
        </div>

        {/* Right Column */}
        <div className="flex-1 min-w-0 w-full h-full">
          <TasksComplianceCardDemo />
        </div>
      </div>

      {/* Row 3: Rooms & Approvals */}
      <div className="flex gap-[24px] compact:flex-col items-start w-full">
        {/* Left Column */}
        <div className="flex-shrink-0">
          <RoomAvailabilityCircleCardDemo />
        </div>

        {/* Middle Column */}
        <div className="flex-shrink-0">
          <MeetingRoomBookingGridDemo />
        </div>

        {/* Right Column */}
        <div className="flex-1 min-w-0 w-full">
          <ApprovalQueueCardDemo />
        </div>
      </div>
    </div>
  );
}
