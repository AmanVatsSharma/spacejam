"use client";


/**
 * File:        apps/web/src/app/dashboard/home/page.tsx
 * Module:      Web · Dashboard · Home Screen
 * Purpose:     Canonical wired home screen with quick actions, lead management,
 *              and room overview. Wired to live dashboardMetrics, leadCount,
 *              leads, deposits, requests, events + create mutations.
 *
 * Design Reference: dashboard-design-hd.png
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-12
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
  GET_INVOICES,
  CREATE_LEAD,
  CREATE_CUSTOMER,
} from "@/lib/apollo/operations";
import { useRequests } from "@/hooks/use-operations";
import { useMeetingRooms } from "@/hooks/use-operations";
import { useEvents } from "@/hooks/use-operations";
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
  const greetingName = user?.name || "User";

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

  // Live deposits for deposit held stat + approvals
  const { data: depositsData } = useQuery(GET_DEPOSITS, {
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });

  // Live invoices (for overdue compliance items)
  const { data: invoicesData } = useQuery(GET_INVOICES, {
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });

  // Pending service requests feed the Tasks & Compliance card.
  const { requests } = useRequests({ pendingOnly: true });
  // Meeting rooms + events for the booking grid and "Events today" metric.
  const { rooms: rawRooms } = useMeetingRooms();
  const { events } = useEvents();

  // Map backend room status enums to the display strings the grid expects.
  const rooms = useMemo(() => {
    const statusMap: Record<string, "Occupied" | "Available" | "Booked" | "Maintenance"> = {
      AVAILABLE: "Available",
      OCCUPIED: "Occupied",
      BOOKED: "Booked",
      MAINTENANCE: "Maintenance",
    };
    return rawRooms.map((r: any) => ({
      id: r.id,
      name: r.name,
      status: statusMap[r.status] ?? "Available",
      capacity: r.capacity ?? 0,
    }));
  }, [rawRooms]);

  const metrics = metricsData?.dashboardMetrics;
  const leads = leadsData?.leads ?? [];
  const deposits = depositsData?.deposits ?? [];
  const invoices = invoicesData?.invoices ?? [];

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

  // Events today count
  const eventsToday = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return events.filter((e: any) => e.eventDate === today).length;
  }, [events]);

  // Tasks & Compliance items derived from live data.
  const complianceItems = useMemo(() => {
    const items: { id: string; title: string; subtitle: string; color: "red" | "orange" | "yellow" }[] = [];
    const overdueInvoices = invoices.filter((i: any) => normalizeStatus(i.status) === "OVERDUE");
    if (overdueInvoices.length > 0) {
      items.push({
        id: "overdue-invoices",
        title: `${overdueInvoices.length} Overdue Invoice${overdueInvoices.length === 1 ? "" : "s"}`,
        subtitle: "Follow up with clients",
        color: "red",
      });
    }
    const pendingDeposits = deposits.filter(
      (d: any) => normalizeStatus(d.status) === "RELEASE_REQUESTED" || normalizeStatus(d.status) === "HELD",
    );
    if (pendingDeposits.length > 0) {
      items.push({
        id: "pending-deposits",
        title: `${pendingDeposits.length} Deposit${pendingDeposits.length === 1 ? "" : "s"} Pending`,
        subtitle: "Awaiting release/approval",
        color: "orange",
      });
    }
    requests.slice(0, 3).forEach((r: any) => {
      items.push({
        id: r.id,
        title: r.title,
        subtitle: `${r.requestType} · ${r.urgency}`,
        color: r.urgency === "HIGH" ? "red" : "yellow",
      });
    });
    return items;
  }, [invoices, deposits, requests]);

  // Approval queue: pending deposit releases + plan-upgrade requests.
  const approvalItems = useMemo(() => {
    const items: { id: string; title: string; subtitle: string; timeAgo: string; iconColor: string }[] = [];
    deposits
      .filter((d: any) => normalizeStatus(d.status) === "RELEASE_REQUESTED")
      .forEach((d: any) => {
        items.push({
          id: d.id,
          title: "Deposit Release",
          subtitle: d.customerName ?? "Deposit",
          timeAgo: d.releaseRequestedDate ? new Date(d.releaseRequestedDate).toLocaleDateString() : "",
          iconColor: "#FF7847",
        });
      });
    requests
      .filter((r: any) => r.requestType === "UPGRADE")
      .slice(0, 4)
      .forEach((r: any) => {
        items.push({
          id: r.id,
          title: "Plan Upgrade",
          subtitle: r.title,
          timeAgo: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "",
          iconColor: "#EF4444",
        });
      });
    return items;
  }, [deposits, requests]);

  // Payment Health Calculation - uses backend revenueTrend for the revenue card
  const revenueTrend = metrics?.revenueTrend;
  const revenueTrendProps = revenueTrend
    ? {
        changePercent: Math.round(revenueTrend.value),
        changeDirection: revenueTrend.direction as "up" | "down" | "neutral",
      }
    : undefined;

  const stats = [
    {
      label: "Revenue (MTD)",
      value: metrics ? formatCurrency(metrics.totalRevenue) : "—",
      icon: <RevenueIcon />,
      className: "flex-1 min-w-0",
      ...revenueTrendProps,
    },
    {
      label: "Active Bookings",
      value: metrics ? String(metrics.activeBookings) : "—",
      icon: <CustomersIcon />,
      className: "flex-1 min-w-0",
    },
    {
      label: "Pending Payments",
      value: metrics ? formatCurrency(metrics.pendingPayments) : "—",
      icon: <DuesIcon />,
      className: "flex-1 min-w-0",
    },
    {
      label: "Available Seats",
      value: metrics ? `${metrics.availableSeats}/${metrics.totalSeats}` : "—",
      icon: <BookingsIcon />,
      className: "flex-1 min-w-0",
    },
  ];

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
              value={String(eventsToday)}
              icon={<EventIcon />}
              className="flex-1"
            />
          </div>
        </div>

        {/* Middle Column — stretches to match row height */}
        <div className="flex-1 min-w-0 max-w-[420px]">
          <PaymentHealthCard
            total={formatCurrency(metrics?.totalRevenue ?? 0)}
            paid={{
              percent: Math.round(revenueTrend?.value ?? 0),
              amount: revenueTrend
                ? `${revenueTrend.direction === "up" ? "↑" : revenueTrend.direction === "down" ? "↓" : "—"} ${Math.round(revenueTrend.value)}%`
                : "—",
            }}
            overdue={{ percent: 0, amount: "₹0" }}
            partial={{ percent: 0, amount: "₹0" }}
            className="h-full"
          />
        </div>

        {/* Right Column */}
        <div className="flex-1 min-w-0 w-full h-full">
          <TasksComplianceCard items={complianceItems} badgeCount={complianceItems.length} />
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
          <MeetingRoomBookingGrid rooms={rooms} />
        </div>

        {/* Right Column */}
        <div className="flex-1 min-w-0 w-full">
          <ApprovalQueueCard items={approvalItems} pendingCount={approvalItems.length} />
        </div>
      </div>

      {/* Modals */}
      <AddLeadModal open={showAddLead} onClose={() => setShowAddLead(false)} onAdd={handleAddLead} />
      <AddClientModal open={showAddClient} onClose={() => setShowAddClient(false)} onAdd={handleAddClient} />
    </div>
  );
}
