/**
 * File:        apps/web/src/app/dashboard/operations/page.tsx
 * Module:      Web · Dashboard · Operations Page
 * Purpose:     Space management, bookings, and daily operations
 *
 * Exports:
 *   - OperationsPage — operations page content
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-05-28
 */

"use client";

import { useState } from "react";

interface Booking {
  id: string;
  guest: string;
  space: string;
  checkIn: string;
  checkOut: string;
  status: "confirmed" | "checked-in" | "checked-out" | "cancelled";
}

const mockBookings: Booking[] = [
  { id: "BK-001", guest: "Priya Sharma", space: "Cabin A1", checkIn: "9:00 AM", checkOut: "6:00 PM", status: "checked-in" },
  { id: "BK-002", guest: "Rahul Verma", space: "Hot Desk B2", checkIn: "8:00 AM", checkOut: "5:00 PM", status: "confirmed" },
  { id: "BK-003", guest: "Anita Desai", space: "Meeting Room 3", checkIn: "2:00 PM", checkOut: "4:00 PM", status: "confirmed" },
  { id: "BK-004", guest: "Vikram Singh", space: "Cabin A2", checkIn: "10:00 AM", checkOut: "7:00 PM", status: "checked-out" },
];

const statusStyles = {
  confirmed: "bg-blue-100 text-blue-700",
  "checked-in": "bg-green-100 text-green-700",
  "checked-out": "bg-gray-100 text-gray-600",
  cancelled: "bg-red-100 text-red-700",
};

type TabType = "bookings" | "check-in" | "spaces";

export default function OperationsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("bookings");

  const tabs: { id: TabType; label: string }[] = [
    { id: "bookings", label: "All Bookings" },
    { id: "check-in", label: "Check-in/Out" },
    { id: "spaces", label: "Space Status" },
  ];

  const activeBookings = mockBookings.filter((b) => b.status === "checked-in" || b.status === "confirmed");

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="bg-white rounded-2xl shadow-sm p-6 flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold text-[#101828]">Operations</h1>
          <p className="text-[#4A5565]">Manage bookings, check-ins, and space utilization</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-white border border-gray-200 text-[#4A5565] px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors shadow-sm">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="4" width="12" height="10" rx="2" />
              <path d="M5 2V4M11 2V4M2 8H14" />
            </svg>
            <span>Schedule</span>
          </button>
          <button className="flex items-center gap-2 bg-[#FF7847] text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-[#FF6A3D] transition-colors shadow-sm">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8 3V13M3 8H13" />
            </svg>
            <span>New Booking</span>
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-sm text-gray-500 mb-2">Active Bookings</p>
          <p className="text-2xl font-bold text-[#101828]">{activeBookings.length}</p>
          <span className="text-xs text-green-600 font-medium">↑ 3 more than yesterday</span>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-sm text-gray-500 mb-2">Checked In</p>
          <p className="text-2xl font-bold text-[#101828]">
            {mockBookings.filter((b) => b.status === "checked-in").length}
          </p>
          <span className="text-xs text-gray-400 font-medium">Currently in space</span>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-sm text-gray-500 mb-2">Available Spaces</p>
          <p className="text-2xl font-bold text-[#101828]">24</p>
          <span className="text-xs text-green-600 font-medium">67% utilization</span>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-sm text-gray-500 mb-2">Today's Revenue</p>
          <p className="text-2xl font-bold text-[#101828]">₹12,500</p>
          <span className="text-xs text-green-600 font-medium">↑ 15% vs avg</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-[#FF7847] text-white"
                : "text-[#4A5565] hover:bg-gray-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bookings Table */}
      {activeTab === "bookings" && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Space</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check In</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check Out</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mockBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-[#101828]">{booking.id}</td>
                  <td className="px-6 py-4 text-sm text-[#4A5565]">{booking.guest}</td>
                  <td className="px-6 py-4 text-sm text-[#101828] font-medium">{booking.space}</td>
                  <td className="px-6 py-4 text-sm text-[#4A5565]">{booking.checkIn}</td>
                  <td className="px-6 py-4 text-sm text-[#4A5565]">{booking.checkOut}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${statusStyles[booking.status]}`}>
                      {booking.status.replace("-", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 flex gap-2">
                    {booking.status === "confirmed" && (
                      <button className="text-xs bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600">
                        Check In
                      </button>
                    )}
                    {booking.status === "checked-in" && (
                      <button className="text-xs bg-orange-500 text-white px-3 py-1 rounded-lg hover:bg-orange-600">
                        Check Out
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Check-in/Out - Quick Actions */}
      {activeTab === "check-in" && (
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-[#101828] mb-4">Pending Check-ins</h3>
            <div className="space-y-4">
              {mockBookings.filter((b) => b.status === "confirmed").map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-[#101828]">{booking.guest}</p>
                    <p className="text-sm text-[#4A5565]">{booking.space} · {booking.checkIn}</p>
                  </div>
                  <button className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600">
                    Check In
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-[#101828] mb-4">Pending Check-outs</h3>
            <div className="space-y-4">
              {mockBookings.filter((b) => b.status === "checked-in").map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-[#101828]">{booking.guest}</p>
                    <p className="text-sm text-[#4A5565]">{booking.space} · {booking.checkOut}</p>
                  </div>
                  <button className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600">
                    Check Out
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Space Status */}
      {activeTab === "spaces" && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-[#101828] mb-4">Space Availability</h3>
          <div className="grid grid-cols-4 gap-4">
            {["Cabins", "Hot Desks", "Meeting Rooms", "Dedicated Desks"].map((type, i) => (
              <div key={type} className="bg-gray-50 rounded-xl p-4 text-center">
                <div className="w-12 h-12 bg-[#FF7847] rounded-full flex items-center justify-center mx-auto mb-3 text-white font-bold text-xl">
                  {["8", "12", "3", "6"][i]}
                </div>
                <p className="text-sm font-medium text-[#101828]">{type}</p>
                <p className="text-xs text-gray-500">available</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}