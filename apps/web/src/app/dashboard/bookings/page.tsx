/**
 * File:        apps/web/src/app/dashboard/bookings/page.tsx
 * Module:      Web · Dashboard · Bookings Page
 * Purpose:     Full booking management with calendar and CRUD
 *
 * Exports:
 *   - BookingsPage — booking management page content
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-05-28
 */

"use client";

import { useState } from "react";

interface Booking {
  id: string;
  guest: string;
  company: string;
  space: string;
  spaceType: "Cabin" | "Hot Desk" | "Meeting Room" | "Dedicated" | "Phone Booth";
  date: string;
  checkIn: string;
  checkOut: string;
  duration: string;
  amount: number;
  status: "confirmed" | "checked-in" | "checked-out" | "cancelled";
  paymentStatus: "paid" | "pending" | "refunded";
}

const mockBookings: Booking[] = [
  {
    id: "BK-001",
    guest: "Priya Sharma",
    company: "TechCorp India",
    space: "Cabin A1",
    spaceType: "Cabin",
    date: "2026-05-28",
    checkIn: "9:00 AM",
    checkOut: "6:00 PM",
    duration: "9 hours",
    amount: 1500,
    status: "checked-in",
    paymentStatus: "paid",
  },
  {
    id: "BK-002",
    guest: "Rahul Verma",
    company: "StartupXYZ",
    space: "Hot Desk B2",
    spaceType: "Hot Desk",
    date: "2026-05-28",
    checkIn: "8:00 AM",
    checkOut: "5:00 PM",
    duration: "9 hours",
    amount: 500,
    status: "confirmed",
    paymentStatus: "pending",
  },
  {
    id: "BK-003",
    guest: "Anita Desai",
    company: "Design Studio",
    space: "Meeting Room 3",
    spaceType: "Meeting Room",
    date: "2026-05-28",
    checkIn: "2:00 PM",
    checkOut: "4:00 PM",
    duration: "2 hours",
    amount: 4000,
    status: "confirmed",
    paymentStatus: "paid",
  },
  {
    id: "BK-004",
    guest: "Vikram Singh",
    company: "Freelancer",
    space: "Dedicated Desk D5",
    spaceType: "Dedicated",
    date: "2026-05-27",
    checkIn: "10:00 AM",
    checkOut: "7:00 PM",
    duration: "9 hours",
    amount: 800,
    status: "checked-out",
    paymentStatus: "paid",
  },
  {
    id: "BK-005",
    guest: "Neha Kapoor",
    company: "Consultant",
    space: "Phone Booth P2",
    spaceType: "Phone Booth",
    date: "2026-05-29",
    checkIn: "10:00 AM",
    checkOut: "12:00 PM",
    duration: "2 hours",
    amount: 600,
    status: "confirmed",
    paymentStatus: "pending",
  },
];

const statusStyles = {
  confirmed: "bg-blue-100 text-blue-700",
  "checked-in": "bg-green-100 text-green-700",
  "checked-out": "bg-gray-100 text-gray-600",
  cancelled: "bg-red-100 text-red-700",
};

const paymentStyles = {
  paid: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  refunded: "bg-gray-100 text-gray-600",
};

type ViewMode = "list" | "calendar";
type StatusFilter = "all" | "confirmed" | "checked-in" | "checked-out" | "cancelled";

export default function BookingsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("2026-05-28");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // New booking form state
  const [newBooking, setNewBooking] = useState({
    guest: "",
    company: "",
    space: "",
    spaceType: "Cabin" as Booking["spaceType"],
    date: "",
    checkIn: "",
    checkOut: "",
  });

  // Filter bookings
  const filteredBookings = mockBookings.filter((booking) => {
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
    const matchesSearch =
      searchQuery === "" ||
      booking.guest.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.space.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calendar data
  const timeSlots = ["8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM"];
  const spaces = ["Cabin A1", "Cabin A2", "Hot Desk B1", "Hot Desk B2", "Meeting Room 1", "Meeting Room 3"];

  const getBookingForSlot = (space: string, time: string) => {
    return filteredBookings.find((b) => {
      const bookingTime = b.checkIn.replace(" AM", "").replace(" PM", "");
      const bookingHour = parseInt(bookingTime.split(":")[0]);
      const slotHour = parseInt(time.split(":")[0]);
      return b.space === space && bookingHour <= slotHour && slotHour < bookingHour + 2;
    });
  };

  const handleCreateBooking = () => {
    // Check for conflicts
    const conflicts = filteredBookings.filter(
      (b) => b.space === newBooking.space && b.date === newBooking.date
    );
    if (conflicts.length > 0) {
      alert(`Conflict detected: ${newBooking.space} is already booked for ${newBooking.date}`);
      return;
    }
    alert("Booking created successfully!");
    setIsNewBookingOpen(false);
    setNewBooking({
      guest: "",
      company: "",
      space: "",
      spaceType: "Cabin",
      date: "",
      checkIn: "",
      checkOut: "",
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="bg-white rounded-2xl shadow-sm p-6 flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold text-[#101828]">Booking Management</h1>
          <p className="text-[#4A5565]">Manage reservations, track bookings, and handle check-ins</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsNewBookingOpen(true)}
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
      <div className="grid grid-cols-2 compact:grid-cols-4 gap-4 compact:gap-3">
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-sm text-gray-500 mb-2">Total Bookings</p>
          <p className="text-2xl font-bold text-[#101828]">{mockBookings.length}</p>
          <span className="text-xs text-green-600 font-medium">12% vs last week</span>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-sm text-gray-500 mb-2">Active Today</p>
          <p className="text-2xl font-bold text-[#101828]">
            {mockBookings.filter((b) => b.status === "checked-in" || b.status === "confirmed").length}
          </p>
          <span className="text-xs text-gray-400 font-medium">Currently active</span>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-sm text-gray-500 mb-2">Pending Payment</p>
          <p className="text-2xl font-bold text-[#101828]">
            {mockBookings.filter((b) => b.paymentStatus === "pending").length}
          </p>
          <span className="text-xs text-yellow-600 font-medium">Needs attention</span>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-sm text-gray-500 mb-2">Today's Revenue</p>
          <p className="text-2xl font-bold text-[#101828]">
            Rs.{mockBookings.filter((b) => b.date === "2026-05-28").reduce((sum, b) => sum + b.amount, 0).toLocaleString()}
          </p>
          <span className="text-xs text-green-600 font-medium">8% vs avg</span>
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-white rounded-2xl shadow-sm p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="7" cy="7" r="5" />
              <path d="M11 11L14 14" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="Search bookings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="confirmed">Confirmed</option>
            <option value="checked-in">Checked In</option>
            <option value="checked-out">Checked Out</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Date Picker */}
          <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#4A5565" strokeWidth="1.5">
              <rect x="2" y="3" width="12" height="11" rx="2" />
              <path d="M5 1V4M11 1V4M2 7H14" />
            </svg>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-sm focus:outline-none cursor-pointer"
            />
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setViewMode("list")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === "list"
                ? "bg-white text-[#101828] shadow-sm"
                : "text-[#4A5565] hover:bg-gray-200"
            }`}
          >
            <span className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 4H11M3 7H11M3 10H11" strokeLinecap="round" />
              </svg>
              List
            </span>
          </button>
          <button
            onClick={() => setViewMode("calendar")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === "calendar"
                ? "bg-white text-[#101828] shadow-sm"
                : "text-[#4A5565] hover:bg-gray-200"
            }`}
          >
            <span className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="2" width="10" height="10" rx="2" />
                <path d="M5 1V4M9 1V4M2 7H12" />
              </svg>
              Calendar
            </span>
          </button>
        </div>
      </div>

      {/* List View */}
      {viewMode === "list" && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 compact:px-2 compact:py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 compact:px-2 compact:py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest</th>
                <th className="px-6 py-3 compact:px-2 compact:py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Space</th>
                <th className="px-6 py-3 compact:px-2 compact:py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 compact:px-2 compact:py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 compact:px-2 compact:py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                <th className="px-6 py-3 compact:px-2 compact:py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 compact:px-2 compact:py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 compact:px-2 compact:py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                <th className="px-6 py-3 compact:px-2 compact:py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 compact:px-2 compact:py-2 text-sm font-medium text-[#101828]">{booking.id}</td>
                  <td className="px-6 py-4 compact:px-2 compact:py-2">
                    <div>
                      <p className="text-sm font-medium text-[#101828]">{booking.guest}</p>
                      <p className="text-xs text-[#4A5565]">{booking.company}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 compact:px-2 compact:py-2">
                    <div>
                      <p className="text-sm text-[#101828] font-medium">{booking.space}</p>
                      <p className="text-xs text-[#4A5565]">{booking.spaceType}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 compact:px-2 compact:py-2 text-sm text-[#4A5565]">{booking.date}</td>
                  <td className="px-6 py-4 compact:px-2 compact:py-2">
                    <p className="text-sm text-[#4A5565]">{booking.checkIn}</p>
                    <p className="text-xs text-gray-400">{booking.checkOut}</p>
                  </td>
                  <td className="px-6 py-4 compact:px-2 compact:py-2 text-sm text-[#4A5565]">{booking.duration}</td>
                  <td className="px-6 py-4 compact:px-2 compact:py-2 text-sm font-medium text-[#101828]">Rs.{booking.amount.toLocaleString()}</td>
                  <td className="px-6 py-4 compact:px-2 compact:py-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${statusStyles[booking.status]}`}>
                      {booking.status.replace("-", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 compact:px-2 compact:py-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${paymentStyles[booking.paymentStatus]}`}>
                      {booking.paymentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 compact:px-2 compact:py-2">
                    <div className="flex gap-2">
                      <button className="text-xs bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600">
                        View
                      </button>
                      <button className="text-xs bg-gray-100 text-[#4A5565] px-3 py-1.5 rounded-lg hover:bg-gray-200">
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="px-6 py-4 flex items-center justify-between border-t border-gray-100">
            <p className="text-sm text-[#4A5565]">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, filteredBookings.length)} of{" "}
              {filteredBookings.length} bookings
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1.5 rounded-lg text-sm ${
                    page === currentPage
                      ? "bg-[#FF7847] text-white"
                      : "border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Calendar View */}
      {viewMode === "calendar" && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#4A5565" strokeWidth="1.5">
                  <path d="M12 15L7 10L12 5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <h3 className="text-lg font-semibold text-[#101828]">May 2026</h3>
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#4A5565" strokeWidth="1.5">
                  <path d="M8 5L13 10L8 15" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 text-sm bg-[#FF7847] text-white rounded-lg">Day</button>
              <button className="px-3 py-1.5 text-sm bg-gray-100 text-[#4A5565] rounded-lg">Week</button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 border-b border-r border-gray-100 min-w-[100px]">Time</th>
                  {spaces.map((space) => (
                    <th key={space} className="px-4 py-3 text-xs font-medium text-gray-500 border-b border-gray-100 min-w-[150px]">
                      {space}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((time) => (
                  <tr key={time}>
                    <td className="px-4 py-3 text-sm text-[#4A5565] border-r border-gray-100 font-medium">{time}</td>
                    {spaces.map((space) => {
                      const booking = getBookingForSlot(space, time);
                      return (
                        <td key={space} className="px-2 py-2 border-r border-gray-100 align-top h-16">
                          {booking && (
                            <div
                              className={`px-2 py-1 rounded-lg text-xs font-medium ${
                                booking.status === "checked-in"
                                  ? "bg-green-100 text-green-700 border border-green-200"
                                  : booking.status === "confirmed"
                                  ? "bg-blue-100 text-blue-700 border border-blue-200"
                                  : "bg-gray-100 text-gray-600 border border-gray-200"
                              }`}
                            >
                              <p className="font-semibold">{booking.guest}</p>
                              <p className="text-[10px] opacity-75">{booking.checkIn} - {booking.checkOut}</p>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="p-4 border-t border-gray-100 flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded"></div>
              <span className="text-xs text-[#4A5565]">Confirmed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
              <span className="text-xs text-[#4A5565]">Checked In</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded"></div>
              <span className="text-xs text-[#4A5565]">Completed</span>
            </div>
          </div>
        </div>
      )}

      {/* New Booking Modal */}
      {isNewBookingOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[#101828]">New Booking</h2>
              <button
                onClick={() => setIsNewBookingOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#4A5565" strokeWidth="1.5">
                  <path d="M5 5L15 15M15 5L5 15" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Guest Name */}
              <div>
                <label className="block text-sm font-medium text-[#101828] mb-2">Guest Name</label>
                <input
                  type="text"
                  placeholder="Enter guest name"
                  value={newBooking.guest}
                  onChange={(e) => setNewBooking({ ...newBooking, guest: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
                />
              </div>

              {/* Company */}
              <div>
                <label className="block text-sm font-medium text-[#101828] mb-2">Company</label>
                <input
                  type="text"
                  placeholder="Enter company name"
                  value={newBooking.company}
                  onChange={(e) => setNewBooking({ ...newBooking, company: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
                />
              </div>

              {/* Space Type & Space */}
              <div className="grid grid-cols-1 compact:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#101828] mb-2">Space Type</label>
                  <select
                    value={newBooking.spaceType}
                    onChange={(e) => setNewBooking({ ...newBooking, spaceType: e.target.value as Booking["spaceType"] })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 cursor-pointer"
                  >
                    <option value="Cabin">Cabin</option>
                    <option value="Hot Desk">Hot Desk</option>
                    <option value="Meeting Room">Meeting Room</option>
                    <option value="Dedicated">Dedicated</option>
                    <option value="Phone Booth">Phone Booth</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#101828] mb-2">Space</label>
                  <select
                    value={newBooking.space}
                    onChange={(e) => setNewBooking({ ...newBooking, space: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 cursor-pointer"
                  >
                    <option value="">Select space</option>
                    {newBooking.spaceType === "Cabin" && (
                      <>
                        <option value="Cabin A1">Cabin A1</option>
                        <option value="Cabin A2">Cabin A2</option>
                        <option value="Cabin A3">Cabin A3</option>
                      </>
                    )}
                    {newBooking.spaceType === "Hot Desk" && (
                      <>
                        <option value="Hot Desk B1">Hot Desk B1</option>
                        <option value="Hot Desk B2">Hot Desk B2</option>
                        <option value="Hot Desk B3">Hot Desk B3</option>
                      </>
                    )}
                    {newBooking.spaceType === "Meeting Room" && (
                      <>
                        <option value="Meeting Room 1">Meeting Room 1</option>
                        <option value="Meeting Room 2">Meeting Room 2</option>
                        <option value="Meeting Room 3">Meeting Room 3</option>
                      </>
                    )}
                    {newBooking.spaceType === "Dedicated" && (
                      <>
                        <option value="Dedicated Desk D1">Dedicated Desk D1</option>
                        <option value="Dedicated Desk D2">Dedicated Desk D2</option>
                      </>
                    )}
                    {newBooking.spaceType === "Phone Booth" && (
                      <>
                        <option value="Phone Booth P1">Phone Booth P1</option>
                        <option value="Phone Booth P2">Phone Booth P2</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-[#101828] mb-2">Date</label>
                <input
                  type="date"
                  value={newBooking.date}
                  onChange={(e) => setNewBooking({ ...newBooking, date: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
                />
              </div>

              {/* Time Slots */}
              <div className="grid grid-cols-1 compact:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#101828] mb-2">Check In</label>
                  <select
                    value={newBooking.checkIn}
                    onChange={(e) => setNewBooking({ ...newBooking, checkIn: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 cursor-pointer"
                  >
                    <option value="">Select time</option>
                    <option value="8:00 AM">8:00 AM</option>
                    <option value="9:00 AM">9:00 AM</option>
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="11:00 AM">11:00 AM</option>
                    <option value="12:00 PM">12:00 PM</option>
                    <option value="1:00 PM">1:00 PM</option>
                    <option value="2:00 PM">2:00 PM</option>
                    <option value="3:00 PM">3:00 PM</option>
                    <option value="4:00 PM">4:00 PM</option>
                    <option value="5:00 PM">5:00 PM</option>
                    <option value="6:00 PM">6:00 PM</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#101828] mb-2">Check Out</label>
                  <select
                    value={newBooking.checkOut}
                    onChange={(e) => setNewBooking({ ...newBooking, checkOut: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 cursor-pointer"
                  >
                    <option value="">Select time</option>
                    <option value="9:00 AM">9:00 AM</option>
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="11:00 AM">11:00 AM</option>
                    <option value="12:00 PM">12:00 PM</option>
                    <option value="1:00 PM">1:00 PM</option>
                    <option value="2:00 PM">2:00 PM</option>
                    <option value="3:00 PM">3:00 PM</option>
                    <option value="4:00 PM">4:00 PM</option>
                    <option value="5:00 PM">5:00 PM</option>
                    <option value="6:00 PM">6:00 PM</option>
                    <option value="7:00 PM">7:00 PM</option>
                  </select>
                </div>
              </div>

              {/* Conflict Warning */}
              {newBooking.space && newBooking.date && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <svg className="text-yellow-600 mt-0.5" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 1C4.13 1 1 4.13 1 8s3.13 7 7 7 7-3.13 7-7-3.13-7-7-7zm0 12.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm0-4.5c-.55 0-1 .45-1 1V8c0 .55.45 1 1 1s1-.45 1-1V6c0-.55-.45-1-1-1z"/>
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-yellow-800">Conflict Detection</p>
                      <p className="text-xs text-yellow-700 mt-1">
                        {filteredBookings.some((b) => b.space === newBooking.space && b.date === newBooking.date)
                          ? `This space is already booked on ${newBooking.date}. Please select a different space or date.`
                          : "No conflicts detected for this time slot."}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setIsNewBookingOpen(false)}
                className="px-5 py-2.5 border border-gray-200 text-[#4A5565] rounded-xl font-medium text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBooking}
                className="px-5 py-2.5 bg-[#FF7847] text-white rounded-xl font-medium text-sm hover:bg-[#FF6A3D]"
              >
                Create Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}