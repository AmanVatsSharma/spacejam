"use client";


/**
 * File:        apps/web/src/app/dashboard/page.tsx
 * Module:      Web · Dashboard · Home Screen
 * Purpose:     Redesigned home screen with quick actions, lead management, and room overview
 *              Wired to live dashboardMetrics + leadCount queries.
 *
 * Design Reference: dashboard-design-hd.png
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-06
 */


import React, { useState, useMemo } from "react";
import { useQuery } from "@apollo/client";
import { useAuth } from "@/contexts/auth-context";
import {
  GET_DASHBOARD_METRICS,
  GET_LEADS,
  LEAD_COUNT,
  GET_DEPOSITS,
} from "@/lib/apollo/operations";
import {
  StatCard,
  RevenueIcon,
  CustomersIcon,
  DuesIcon,
  BookingsIcon,
} from "@/components/ui/stat-card";
import {
  TotalLeadCard,
  ApprovalQueueCardDemo,
  PaymentHealthCardDemo,
  TasksComplianceCardDemo,
  RoomAvailabilityCircleCardDemo,
  MeetingRoomBookingGridDemo,
  DepositHeldCardDemo,
  EventTodayCardDemo,
  AddLeadModal,
  AddClientModal,
} from "@/components/ui/dashboard";

function formatCurrency(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${Math.round(amount)}`;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const greetingName = user?.name?.split(/\s+/)[0] ?? user?.email?.split("@")[0] ?? "Jhon Doe";

  const [showAddLead, setShowAddLead] = useState(false);
  const [showAddClient, setShowAddClient] = useState(false);

  // Live dashboard metrics
  const { data: metricsData, loading: metricsLoading } = useQuery(GET_DASHBOARD_METRICS, {
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });

  // Live lead count
  const { data: leadCountData } = useQuery(LEAD_COUNT, {
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });

  // Live leads for the TotalLeadCard breakdown
  const { data: leadsData } = useQuery(GET_LEADS, {
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });

  // Live deposits for deposit held stat
  const { data: depositsData } = useQuery(GET_DEPOSITS, {
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });

  const metrics = metricsData?.dashboardMetrics;
  const leads = leadsData?.leads ?? [];
  const deposits = depositsData?.deposits ?? [];

  // Compute lead breakdown from live data
  const leadBreakdown = useMemo(() => {
    const visited = leads.filter((l: any) => l.status === "Visited").length;
    const inquiry = leads.filter((l: any) => l.status === "New").length;
    const converted = leads.filter((l: any) => l.status === "Converted").length;
    return { visited, inquiry, converted, total: leadCountData?.leadCount ?? leads.length };
  }, [leads, leadCountData]);

  // Compute deposit held total
  const depositHeld = useMemo(() => {
    return deposits
      .filter((d: any) => d.status === "Held" || d.status === "Active")
      .reduce((sum: number, d: any) => sum + Number(d.amount ?? 0), 0);
  }, [deposits]);

  const stats = [
    {
      label: "Revenue (MTD)",
      value: metrics ? formatCurrency(metrics.totalRevenue) : "—",
      icon: <RevenueIcon />,
      changePercent: 12,
      changeDirection: "up" as const,
      className: "flex-1 min-w-0",
    },
    {
      label: "Active Bookings",
      value: metrics ? String(metrics.activeBookings) : "—",
      icon: <CustomersIcon />,
      changePercent: 5,
      changeDirection: "up" as const,
      className: "flex-1 min-w-0",
    },
    {
      label: "Pending Payments",
      value: metrics ? formatCurrency(metrics.pendingPayments) : "—",
      icon: <DuesIcon />,
      changePercent: 8,
      changeDirection: "down" as const,
      className: "flex-1 min-w-0",
    },
    {
      label: "Available Seats",
      value: metrics ? `${metrics.availableSeats}/${metrics.totalSeats}` : "—",
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
          <button
            onClick={() => setShowAddLead(true)}
            className="h-10 px-4 bg-[#FF6A2F] text-white rounded-[10px] text-sm font-medium hover:bg-[#FF5A1F] transition-colors shadow-sm flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7 0v4m2-2h-4M2 14v-1.5a3.5 3.5 0 0 1 3.5-3.5h1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Add Lead
          </button>
          <button
            onClick={() => setShowAddClient(true)}
            className="h-10 px-4 bg-[#FF6A2F] text-white rounded-[10px] text-sm font-medium hover:bg-[#FF5A1F] transition-colors shadow-sm flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7 0v4m2-2h-4M2 14v-1.5a3.5 3.5 0 0 1 3.5-3.5h1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
          <TotalLeadCard
            totalLeads={leadBreakdown.total}
            visited={leadBreakdown.visited}
            inquiry={leadBreakdown.inquiry}
            converted={leadBreakdown.converted}
          />
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

      {/* Modals */}
      <AddLeadModal open={showAddLead} onClose={() => setShowAddLead(false)} />
      <AddClientModal open={showAddClient} onClose={() => setShowAddClient(false)} />
    </div>
  );
}
