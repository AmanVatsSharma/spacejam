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
import { useQuery, useMutation } from "@apollo/client";
import { useAuth } from "@/contexts/auth-context";
import { normalizeStatus } from "@/lib/revenue-status";
import {
  GET_DASHBOARD_METRICS,
  GET_LEADS,
  LEAD_COUNT,
  GET_DEPOSITS,
  CREATE_LEAD,
  CREATE_CUSTOMER,
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
  ApprovalQueueCard,
  PaymentHealthCard,
  TasksComplianceCard,
  RoomAvailabilityCircleCard,
  MeetingRoomBookingGrid,
  MetricCard,
  AddLeadModal,
  AddClientModal,
} from "@/components/ui/dashboard";

// Icons for MetricCards
const DepositIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <rect x="1" y="1" width="12" height="12" rx="2" stroke="#FF6A2F" strokeWidth="1.33"/>
    <path d="M4 5h6M4 7h4" stroke="#FF6A2F" strokeWidth="1.33" strokeLinecap="round"/>
  </svg>
);

const EventIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <rect x="1" y="1" width="12" height="12" rx="2" stroke="#FF6A2F" strokeWidth="1.33"/>
    <path d="M7 4.5l1.35 1.35 2.15 0.3-1.55 1.5 0.35 2.1L7 8.1 4.7 9.75l0.35-2.1L3.5 6.15l2.15-0.3L7 4.5z" stroke="#FF6A2F" strokeWidth="1.33" strokeLinejoin="round"/>
  </svg>
);


function formatCurrency(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${Math.round(amount)}`;
}


export default function DashboardPage() {
  const { user } = useAuth() || { user: null };
  const greetingName = user?.name?.split(" ")[0] || "User";

  const [createLead] = useMutation(CREATE_LEAD, {
    refetchQueries: [{ query: LEAD_COUNT }, { query: GET_LEADS }],
  });

  const [createCustomer] = useMutation(CREATE_CUSTOMER);

  const handleAddLead = async (input: Record<string, string>) => {
    try {
      await createLead({ variables: { input } });
      setShowAddLead(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddClient = async (input: Record<string, string>) => {
    try {
      await createCustomer({ variables: { input } });
      setShowAddClient(false);
    } catch (err) {
      console.error(err);
    }
  };

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
      .filter((d: any) => normalizeStatus(d.status) === "HELD" || normalizeStatus(d.status) === "ACTIVE")
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

  // Payment Health Calculation
  const totalPayments = (metrics?.totalRevenue || 0) + (metrics?.pendingPayments || 0);
  const paidPercent = totalPayments ? Math.round(((metrics?.totalRevenue || 0) / totalPayments) * 100) : 0;
  const partialPercent = totalPayments ? Math.round(((metrics?.pendingPayments || 0) / totalPayments) * 100) : 0;
  const paymentHealthPaid = { percent: paidPercent, amount: formatCurrency(metrics?.totalRevenue || 0) };
  const paymentHealthPartial = { percent: partialPercent, amount: formatCurrency(metrics?.pendingPayments || 0) };

  return (
    <div className="w-full flex flex-col gap-[24px] compact:gap-4 p-8 compact:p-4">
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
      <div className="flex gap-[24px] compact:flex-col items-stretch w-full">
        {/* Left Column */}
        <div className="flex flex-col gap-[24px] flex-shrink-0">
          <TotalLeadCard
            totalLeads={leadBreakdown.total}
            visited={leadBreakdown.visited}
            inquiry={leadBreakdown.inquiry}
            converted={leadBreakdown.converted}
          />
          <div className="flex gap-[24px]">
            <MetricCard
              label="Deposit Held"
              value={formatCurrency(depositHeld)}
              icon={<DepositIcon />}
              className="flex-1"
            />
            <MetricCard
              label="Event Today"
              value="0"
              icon={<EventIcon />}
              className="flex-1"
            />
          </div>
        </div>

        {/* Middle Column — stretches to match row height */}
        <div className="flex-1 min-w-0 max-w-[420px]">
          <PaymentHealthCard
            total={formatCurrency(totalPayments)}
            paid={paymentHealthPaid}
            overdue={{ percent: 0, amount: "₹0" }}
            partial={paymentHealthPartial}
            className="h-full"
          />
        </div>

        {/* Right Column */}
        <div className="flex-1 min-w-0 w-full h-full">
          <TasksComplianceCard items={[]} badgeCount={0} />
        </div>
      </div>

      {/* Row 3: Rooms & Approvals */}
      <div className="flex gap-[24px] compact:flex-col items-stretch w-full">
        {/* Left Column */}
        <div className="flex-shrink-0">
          <RoomAvailabilityCircleCard
            totalAvailable={metrics?.availableSeats || 0}
            totalSeats={metrics?.totalSeats || 0}
            subStats={[]}
          />
        </div>

        {/* Middle Column */}
        <div className="flex-shrink-0">
          <MeetingRoomBookingGrid rooms={[]} />
        </div>

        {/* Right Column */}
        <div className="flex-1 min-w-0 w-full">
          <ApprovalQueueCard items={[]} pendingCount={0} />
        </div>
      </div>

      {/* Modals */}
      <AddLeadModal open={showAddLead} onClose={() => setShowAddLead(false)} onAdd={handleAddLead} />
      <AddClientModal open={showAddClient} onClose={() => setShowAddClient(false)} onAdd={handleAddClient} />
    </div>
  );
}
