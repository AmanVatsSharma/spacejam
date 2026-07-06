"use client";


/**
 * File:        apps/web/src/app/dashboard/operations/page.tsx
 * Module:      Web · Dashboard · Operations Page
 * Purpose:     Space management, bookings, and daily operations
 *
 * Exports:
 *   - OperationsPage — operations page content
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-02
 */

export const dynamic = 'force-dynamic';

import { useState } from "react";
import { BookRoomModal } from "@/components/ui/dashboard/book-room-modal";

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

type TabType = "bookings" | "check-in" | "spaces" | "meeting-rooms";

export default function OperationsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("meeting-rooms");
  const [showBookRoom, setShowBookRoom] = useState(false);

  const tabs: { id: TabType; label: string }[] = [
    { id: "bookings", label: "All Bookings" },
    { id: "check-in", label: "Check-in/Out" },
    { id: "spaces", label: "Space Status" },
    { id: "meeting-rooms", label: "Meeting Rooms" },
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
          <button 
            onClick={() => setShowBookRoom(true)}
            className="flex items-center gap-2 bg-[#FF7847] text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-[#FF6A3D] transition-colors shadow-sm"
          >
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
                <th className="px-6 py-3 compact:px-3 compact:py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking ID</th>
                <th className="px-6 py-3 compact:px-3 compact:py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest</th>
                <th className="px-6 py-3 compact:px-3 compact:py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Space</th>
                <th className="px-6 py-3 compact:px-3 compact:py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check In</th>
                <th className="px-6 py-3 compact:px-3 compact:py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check Out</th>
                <th className="px-6 py-3 compact:px-3 compact:py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 compact:px-3 compact:py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mockBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 compact:px-3 compact:py-2 text-sm font-medium text-[#101828]">{booking.id}</td>
                  <td className="px-6 py-4 compact:px-3 compact:py-2 text-sm text-[#4A5565]">{booking.guest}</td>
                  <td className="px-6 py-4 compact:px-3 compact:py-2 text-sm text-[#101828] font-medium">{booking.space}</td>
                  <td className="px-6 py-4 compact:px-3 compact:py-2 text-sm text-[#4A5565]">{booking.checkIn}</td>
                  <td className="px-6 py-4 compact:px-3 compact:py-2 text-sm text-[#4A5565]">{booking.checkOut}</td>
                  <td className="px-6 py-4 compact:px-3 compact:py-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${statusStyles[booking.status]}`}>
                      {booking.status.replace("-", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 compact:px-3 compact:py-2 flex gap-2">
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
        <div className="grid grid-cols-1 compact:grid-cols-2 gap-6 compact:gap-3">
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
      {/* Meeting Rooms */}
      {activeTab === "meeting-rooms" && (
        <div className="flex flex-col gap-6">
          {/* Page Header */}
          <div className="bg-white rounded-2xl shadow-sm p-6 flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-semibold text-[#101828]">Meeting Room status</h1>
              <p className="text-[#4A5565]">Monitor meeting room usage, availability and booking status</p>
            </div>
            <button className="flex items-center gap-2 bg-[#FF7847] text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-[#FF6A3D] transition-colors shadow-sm">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M8 3V13M3 8H13" />
              </svg>
              <span>Book Room</span>
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <p className="text-sm text-gray-500 mb-2">No. of Bookings</p>
              <p className="text-2xl font-bold text-[#101828]">200</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <p className="text-sm text-gray-500 mb-2">Total Hours Used</p>
              <p className="text-2xl font-bold text-[#101828]">260 hrs</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <p className="text-sm text-gray-500 mb-2">Vacant Slot</p>
              <p className="text-2xl font-bold text-[#101828]">2</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <p className="text-sm text-gray-500 mb-2">Peak usage Hs</p>
              <p className="text-2xl font-bold text-[#101828]">10 AM - 4 PM</p>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm w-fit">
              <button className="px-4 py-2 rounded-lg text-sm font-medium bg-[#FF7847] text-white">Layout View</button>
              <button className="px-4 py-2 rounded-lg text-sm font-medium text-[#4A5565] hover:bg-gray-100">Table View</button>
            </div>
            <p className="text-sm text-[#6A7282]">Showing 12 of 12 rooms</p>
          </div>

          {/* Today's Timeline */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-[#101828] mb-4">Today's Timeline</h3>

            {/* Time Slots Header */}
            <div className="flex gap-1 mb-2 text-xs text-gray-500">
              <div className="w-24 shrink-0"></div>
              {["12 AM", "1 AM", "2 AM", "3 AM", "4 AM", "5 AM", "6 AM", "7 AM", "8 AM", "9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM", "4 PM", "5 PM", "6 PM", "7 PM", "8 PM", "9 PM", "10 PM", "11 PM"].map((time) => (
                <div key={time} className="flex-1 text-center">{time}</div>
              ))}
            </div>

            {/* Timeline Grid */}
            <div className="space-y-1">
              {[
                { name: "Boardroom A", floor: "1st floor", status: "Occupied", time: "10:00 AM - 11:30 AM", color: "bg-orange-100 border-orange-300", textColor: "text-orange-700" },
                { name: "Meeting Room 1", floor: "1st floor", status: "Available", time: "Available", color: "bg-blue-50 border-blue-200", textColor: "text-blue-600" },
                { name: "Conference 1", floor: "1st floor", status: "Booked", time: "20 people", color: "bg-purple-50 border-purple-200", textColor: "text-purple-600" },
                { name: "Meeting Room 2", floor: "1st floor", status: "Available", time: "Available", color: "bg-blue-50 border-blue-200", textColor: "text-blue-600" },
                { name: "Boardroom B", floor: "1st floor", status: "Occupied", time: "9:30 AM - 11:00 AM", color: "bg-orange-100 border-orange-300", textColor: "text-orange-700" },
                { name: "Meeting Room 3", floor: "1st floor", status: "Available", time: "8 people", color: "bg-blue-50 border-blue-200", textColor: "text-blue-600" },
                { name: "Conference 2", floor: "1st floor", status: "Maintenance", time: "Maintenance", color: "bg-gray-100 border-gray-300", textColor: "text-gray-500" },
                { name: "Meeting Room 4", floor: "1st floor", status: "Available", time: "Available", color: "bg-blue-50 border-blue-200", textColor: "text-blue-600" },
                { name: "Meeting Room 5", floor: "1st floor", status: "Occupied", time: "11:00 AM - 12:30 PM", color: "bg-orange-100 border-orange-300", textColor: "text-orange-700" },
                { name: "", floor: "", status: "", time: "", color: "", textColor: "" },
                { name: "Boardroom C", floor: "2nd floor", status: "Available", time: "Available", color: "bg-blue-50 border-blue-200", textColor: "text-blue-600" },
                { name: "Meeting Room 6", floor: "2nd floor", status: "Booked", time: "8 people", color: "bg-purple-50 border-purple-200", textColor: "text-purple-600" },
                { name: "Conference 3", floor: "2nd floor", status: "Available", time: "18 people", color: "bg-blue-50 border-blue-200", textColor: "text-blue-600" },
              ].map((room, i) => (
                <div key={i} className="flex items-center gap-2">
                  {room.name ? (
                    <>
                      <div className="w-24 shrink-0">
                        <p className="text-sm font-medium text-[#101828] truncate">{room.name}</p>
                        <p className="text-xs text-[#6A7282]">{room.floor}</p>
                      </div>
                      <div className="flex-1 h-10 relative bg-gray-50 rounded-lg border border-gray-100">
                        {room.status === "Occupied" && (
                          <div className="absolute inset-y-0 left-[40%] right-[30%] bg-orange-100 border border-orange-300 rounded-lg flex items-center px-2">
                            <div className="flex-1">
                              <p className="text-xs font-medium text-orange-700">{room.time}</p>
                            </div>
                          </div>
                        )}
                        {room.status === "Available" && (
                          <div className="absolute inset-y-0 left-0 right-0 bg-blue-50 border border-blue-200 rounded-lg flex items-center px-2">
                            <p className="text-xs font-medium text-blue-600">Available</p>
                          </div>
                        )}
                        {room.status === "Booked" && (
                          <div className="absolute inset-y-0 left-[25%] right-[35%] bg-purple-50 border border-purple-200 rounded-lg flex items-center px-2">
                            <p className="text-xs font-medium text-purple-600">{room.time}</p>
                          </div>
                        )}
                        {room.status === "Maintenance" && (
                          <div className="absolute inset-y-0 left-0 right-0 bg-gray-100 border border-gray-300 rounded-lg flex items-center px-2">
                            <p className="text-xs font-medium text-gray-500">Maintenance</p>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-24 shrink-0">
                        <p className="text-sm font-medium text-[#6A7282]">2nd floor</p>
                      </div>
                      <div className="flex-1"></div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Day/Night Legend */}
            <div className="flex items-center justify-end gap-4 mt-4 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-100 rounded"></div>
                <span>Day (8AM-7PM)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-100 rounded"></div>
                <span>Night (8PM-7AM)</span>
              </div>
            </div>
          </div>

          {/* Meeting Room Cards */}
          <div className="grid grid-cols-1 compact:grid-cols-2 gap-6 compact:gap-3">
            {/* Boardroom A */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-[#101828]">Boardroom A</h3>
                  <p className="text-sm text-[#6A7282]">4 people</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">Occupied</span>
              </div>
              <p className="text-sm text-[#4A5565] mb-1">Current Booking</p>
              <p className="text-sm font-medium text-[#101828] mb-1">Oracle Rd</p>
              <p className="text-xs text-[#6A7282] mb-4">10:30 AM - 11:30 AM</p>
              <button className="w-full py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-[#4A5565] hover:bg-gray-50">Extend</button>
            </div>

            {/* Meeting Room 1 */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-[#101828]">Meeting Room 1</h3>
                  <p className="text-sm text-[#6A7282]">6 people</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600">Available</span>
              </div>
              <p className="text-sm text-[#4A5565] mb-4">Next booking: 3:00 PM</p>
              <button className="w-full py-2.5 rounded-xl text-sm font-medium bg-[#FF7847] text-white hover:bg-[#FF6A3D]">Book Now</button>
            </div>

            {/* Conference 1 */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-[#101828]">Conference 1</h3>
                  <p className="text-sm text-[#6A7282]">20 people</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-600">Booked</span>
              </div>
              <button className="w-full py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-[#4A5565] hover:bg-gray-50">View Booking</button>
            </div>

            {/* Meeting Room 2 */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-[#101828]">Meeting Room 2</h3>
                  <p className="text-sm text-[#6A7282]">4 people</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600">Available</span>
              </div>
              <p className="text-sm text-[#4A5565] mb-4">Next booking: 4:00 PM</p>
              <button 
                onClick={() => setShowBookRoom(true)}
                className="w-full py-2.5 rounded-xl text-sm font-medium bg-[#FF7847] text-white hover:bg-[#FF6A3D]"
              >
                Book Now
              </button>
            </div>

            {/* Boardroom B */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-[#101828]">Boardroom B</h3>
                  <p className="text-sm text-[#6A7282]">10 people</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">Occupied</span>
              </div>
              <p className="text-sm text-[#4A5565] mb-1">Current Booking</p>
              <p className="text-sm font-medium text-[#101828] mb-1">Secoym. Tech.</p>
              <p className="text-xs text-[#6A7282] mb-4">9:30 AM - 11:00 PM</p>
              <button className="w-full py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-[#4A5565] hover:bg-gray-50">Extend</button>
            </div>

            {/* Meeting Room 3 */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-[#101828]">Meeting Room 3</h3>
                  <p className="text-sm text-[#6A7282]">8 people</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600">Available</span>
              </div>
              <button 
                onClick={() => setShowBookRoom(true)}
                className="w-full py-2.5 rounded-xl text-sm font-medium bg-[#FF7847] text-white hover:bg-[#FF6A3D]"
              >
                Book Now
              </button>
            </div>

            {/* Conference 2 */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-[#101828]">Conference 2</h3>
                  <p className="text-sm text-[#6A7282]">15 people</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">Maintenance</span>
              </div>
              <button className="w-full py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-[#4A5565] hover:bg-gray-50 opacity-50 cursor-not-allowed" disabled>Unavailable</button>
            </div>

            {/* Meeting Room 4 */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-[#101828]">Meeting Room 4</h3>
                  <p className="text-sm text-[#6A7282]">6 people</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600">Available</span>
              </div>
              <p className="text-sm text-[#4A5565] mb-4">Next booking: 5:00 PM</p>
              <button 
                onClick={() => setShowBookRoom(true)}
                className="w-full py-2.5 rounded-xl text-sm font-medium bg-[#FF7847] text-white hover:bg-[#FF6A3D]"
              >
                Book Now
              </button>
            </div>

            {/* Meeting Room 5 */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-[#101828]">Meeting Room 5</h3>
                  <p className="text-sm text-[#6A7282]">4 people</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">Occupied</span>
              </div>
              <p className="text-sm text-[#4A5565] mb-1">Current Booking</p>
              <p className="text-sm font-medium text-[#101828] mb-1">Sahu Enterprise</p>
              <p className="text-xs text-[#6A7282] mb-4">11:00 AM - 12:30 PM</p>
              <button className="w-full py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-[#4A5565] hover:bg-gray-50">Extend</button>
            </div>

            {/* Boardroom C */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-[#101828]">Boardroom C</h3>
                  <p className="text-sm text-[#6A7282]">12 people</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600">Available</span>
              </div>
              <p className="text-sm text-[#4A5565] mb-4">Next booking: 2:30 PM</p>
              <button 
                onClick={() => setShowBookRoom(true)}
                className="w-full py-2.5 rounded-xl text-sm font-medium bg-[#FF7847] text-white hover:bg-[#FF6A3D]"
              >
                Book Now
              </button>
            </div>

            {/* Meeting Room 6 */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-[#101828]">Meeting Room 6</h3>
                  <p className="text-sm text-[#6A7282]">8 people</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-600">Booked</span>
              </div>
              <button className="w-full py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-[#4A5565] hover:bg-gray-50">View Booking</button>
            </div>

            {/* Conference 3 */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-[#101828]">Conference 3</h3>
                  <p className="text-sm text-[#6A7282]">18 people</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600">Available</span>
              </div>
              <button 
                onClick={() => setShowBookRoom(true)}
                className="w-full py-2.5 rounded-xl text-sm font-medium bg-[#FF7847] text-white hover:bg-[#FF6A3D]"
              >
                Book Now
              </button>
            </div>
          </div>

          {/* Active Add-ons & Requests */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-[#101828] mb-4">Active Add-ons & Requests</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#6A7282]">
                    <rect x="2" y="3" width="16" height="14" rx="2" />
                    <path d="M10 7V13M7 10H13" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-[#101828]">Projector Setup</p>
                    <p className="text-xs text-[#6A7282]">Boardroom A - 2:00 PM</p>
                  </div>
                </div>
                <div className="w-5 h-5 rounded-full border-2 border-[#FF7847]"></div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#6A7282]">
                    <path d="M3 10H17M10 3V17" />
                    <circle cx="10" cy="10" r="3" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-[#101828]">Catering Service</p>
                    <p className="text-xs text-[#6A7282]">Conference 2 - 3:30 PM</p>
                  </div>
                </div>
                <div className="w-5 h-5 rounded-full border-2 border-[#10B981] bg-[#10B981]"></div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#6A7282]">
                    <path d="M10 2C5.58 2 2 5.58 2 10C2 14.42 5.58 18 10 18C14.42 18 18 14.42 18 10" />
                    <path d="M18 3L20 5" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-[#101828]">Extra WiFi Access</p>
                    <p className="text-xs text-[#6A7282]">Meeting Room 5 - 4:00 PM</p>
                  </div>
                </div>
                <div className="w-5 h-5 rounded-full border-2 border-[#10B981] bg-[#10B981]"></div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Modals */}
      <BookRoomModal open={showBookRoom} onClose={() => setShowBookRoom(false)} />
    </div>
  );
}