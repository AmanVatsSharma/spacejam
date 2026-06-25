/**
 * File:        apps/web/src/app/dashboard/page.tsx
 * Module:      Web · Dashboard · Home Screen
 * Purpose:     Redesigned home screen with quick actions, lead management, and room overview
 *
 * Design Reference: 01-home_screen.png
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-04
 */

"use client";

import React from "react";
import {
  StatCards,
  RevenueIcon,
  CustomersIcon,
  DuesIcon,
  BookingsIcon
} from "@/components/ui/stat-card";
import { TotalLeadCard } from "@/components/ui/dashboard/total-lead-card";
import { RoomAvailabilityCard } from "@/components/ui/dashboard/room-availability-card";
import { MeetingRoomBookingCard } from "@/components/ui/dashboard/meeting-room-booking-card";
import { TasksComplianceCard } from "@/components/ui/dashboard/tasks-compliance-card";
import { useAuth } from "@/contexts/auth-context";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Admin",
  CENTER_MANAGER: "Center Manager",
  MEMBER: "Member",
};

export default function DashboardPage() {
  const { user } = useAuth();
  const greetingName = user?.name?.split(/\s+/)[0] ?? user?.email?.split("@")[0] ?? "there";
  const roleLabel = user ? ROLE_LABEL[user.role] ?? user.role : null;
  const sampleRooms = [
    {
      id: "1",
      name: "Boardroom Alpha",
      floor: "Floor 3",
      capacity: 12,
      availableSeats: 8,
      status: "available" as const,
    },
    {
      id: "2",
      name: "Meeting Room 2B",
      floor: "Floor 2",
      capacity: 6,
      availableSeats: 0,
      status: "unavailable" as const,
    },
    {
      id: "3",
      name: "Conference Suite",
      floor: "Floor 1",
      capacity: 20,
      availableSeats: 5,
      status: "partial" as const,
    },
  ];

  const sampleBookings = [
    {
      id: "1",
      roomName: "Boardroom Alpha",
      floor: "Floor 3",
      time: "10:00 AM",
      duration: "2 hrs",
      status: "confirmed" as const,
      bookedBy: "Sarah Johnson",
    },
    {
      id: "2",
      roomName: "Meeting Room 2B",
      floor: "Floor 2",
      time: "11:30 AM",
      duration: "1 hr",
      status: "pending" as const,
      bookedBy: "Mike Chen",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Welcome Header */}
      <div className="bg-white rounded-[14px] shadow-sm px-6 py-5 flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-[22px] font-semibold text-[#101828]">Welcome back, {greetingName}!</h1>
          {roleLabel && (
            <p className="text-sm text-[#6A7282]">Signed in as {roleLabel}</p>
          )}
          <p className="text-sm text-[#4A5565]">
            Manage your coworking space efficiency and track performance
          </p>
        </div>
        <div className="flex gap-3">
          <button className="h-10 px-4 compact:hidden bg-white border border-[#E5E7EB] rounded-xl text-sm font-medium text-[#364152] hover:bg-gray-50 transition-colors">
            View Analytics
          </button>
          <button className="h-10 px-4 bg-[#FF7847] text-white rounded-xl text-sm font-medium hover:bg-[#FF6A3D] transition-colors shadow-sm">
            Add New Member
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <StatCards />

      {/* Main Grid Section */}
      <div className="flex gap-6 compact:gap-3 items-start">
        {/* Left Column - Room & Booking Management */}
        <div className="flex flex-col gap-6">
          <RoomAvailabilityCard rooms={sampleRooms} title="Meeting Room Availability" onViewAll={() => {}} />
          <MeetingRoomBookingCard bookings={sampleBookings} title="Upcoming Bookings" onViewAll={() => {}} />
        </div>

        {/* Middle Column - Lead Performance */}
        <div className="flex flex-col gap-6">
          <TotalLeadCard className="!w-[428px] compact:!w-[260px]" />
          <div className="bg-white rounded-[14px] shadow-sm p-5 compact:p-3 w-[428px] compact:w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-800">Quick Actions</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button className="p-3 bg-gray-50 rounded-xl flex flex-col items-center gap-2 hover:bg-gray-100 transition-colors group">
                <div className="w-10 h-10 bg-[#FFF5F1] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <RevenueIcon />
                </div>
                <span className="text-xs font-medium text-gray-700">Add Income</span>
              </button>
              <button className="p-3 bg-gray-50 rounded-xl flex flex-col items-center gap-2 hover:bg-gray-100 transition-colors group">
                <div className="w-10 h-10 bg-[#FFF5F1] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CustomersIcon />
                </div>
                <span className="text-xs font-medium text-gray-700">Add Member</span>
              </button>
              <button className="p-3 bg-gray-50 rounded-xl flex flex-col items-center gap-2 hover:bg-gray-100 transition-colors group">
                <div className="w-10 h-10 bg-[#FFF5F1] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BookingsIcon />
                </div>
                <span className="text-xs font-medium text-gray-700">New Booking</span>
              </button>
              <button className="p-3 bg-gray-50 rounded-xl flex flex-col items-center gap-2 hover:bg-gray-100 transition-colors group">
                <div className="w-10 h-10 bg-[#FFF5F1] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <DuesIcon />
                </div>
                <span className="text-xs font-medium text-gray-700">Raise Invoice</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Tasks & Compliance */}
        <div className="flex-1 min-w-0">
          <TasksComplianceCard className="h-full" badgeCount={12} />
        </div>
      </div>
    </div>
  );
}
