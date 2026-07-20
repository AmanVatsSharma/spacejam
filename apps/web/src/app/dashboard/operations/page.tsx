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
 * Last-updated: 2026-07-06
 */


import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { toast } from "sonner";
import { BookRoomModal } from "@/app/dashboard/operations/modals/book-room-modal";
import { GET_BOOKINGS, GET_DASHBOARD_METRICS, CREATE_BOOKING, UPDATE_BOOKING, CHECK_IN_BOOKING, CHECK_OUT_BOOKING, CANCEL_BOOKING } from "@/lib/apollo/operations";
import { QueryLoading, QueryError, QueryEmpty } from "@/components/ui/query-status";
import { useMeetingRooms, useRequests } from "@/hooks/use-operations";

/** Booking statuses as returned by the backend */
type BackendBookingStatus = "PENDING" | "CONFIRMED" | "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED";

/** Maps backend status to frontend display */
const BACKEND_STATUS_MAP: Record<BackendBookingStatus, { label: string; style: string }> = {
  PENDING:     { label: "Pending",      style: "bg-blue-100 text-blue-700" },
  CONFIRMED:   { label: "Confirmed",    style: "bg-blue-100 text-blue-700" },
  CHECKED_IN:  { label: "Checked In",   style: "bg-green-100 text-green-700" },
  CHECKED_OUT: { label: "Checked Out",  style: "bg-gray-100 text-gray-600" },
  CANCELLED:   { label: "Cancelled",    style: "bg-red-100 text-red-700" },
};

type TabType = "bookings" | "check-in" | "spaces" | "meeting-rooms";

export default function OperationsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("meeting-rooms");
  const [showBookRoom, setShowBookRoom] = useState(false);

  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterFrom, setFilterFrom] = useState<string>("");
  const [filterTo, setFilterTo] = useState<string>("");

  const tabs: { id: TabType; label: string }[] = [
    { id: "bookings", label: "All Bookings" },
    { id: "check-in", label: "Check-in/Out" },
    { id: "spaces", label: "Space Status" },
    { id: "meeting-rooms", label: "Meeting Rooms" },
  ];

  // Real data hooks
  const { data: bookingsData, loading: bookingsLoading, refetch: refetchBookings } = useQuery(GET_BOOKINGS, {
    variables: {
      filters: {
        status: filterStatus || undefined,
        startDate: filterFrom ? new Date(filterFrom) : undefined,
        endDate: filterTo ? new Date(`${filterTo}T23:59:59`) : undefined,
      },
    },
    fetchPolicy: "cache-and-network",
    errorPolicy: "all",
  });

  const { data: metricsData, loading: metricsLoading } = useQuery(GET_DASHBOARD_METRICS, {
    fetchPolicy: "cache-and-network",
    errorPolicy: "all",
  });

  const [createBooking] = useMutation(CREATE_BOOKING, {
    refetchQueries: [{ query: GET_BOOKINGS }, { query: GET_DASHBOARD_METRICS }],
  });

  const [updateBooking] = useMutation(UPDATE_BOOKING, {
    refetchQueries: [{ query: GET_BOOKINGS }, { query: GET_DASHBOARD_METRICS }],
  });

  const [checkInBooking] = useMutation(CHECK_IN_BOOKING, {
    refetchQueries: [{ query: GET_BOOKINGS }, { query: GET_DASHBOARD_METRICS }],
  });

  const [checkOutBooking] = useMutation(CHECK_OUT_BOOKING, {
    refetchQueries: [{ query: GET_BOOKINGS }, { query: GET_DASHBOARD_METRICS }],
  });

  const [cancelBooking] = useMutation(CANCEL_BOOKING, {
    refetchQueries: [{ query: GET_BOOKINGS }, { query: GET_DASHBOARD_METRICS }],
  });

  const bookings = bookingsData?.bookings ?? [];
  const metrics = metricsData?.dashboardMetrics;

  const activeBookings = bookings.filter(
    (b: any) => b.status === "CHECKED_IN" || b.status === "CONFIRMED"
  );

  const handleCheckIn = async (id: string) => {
    try {
      await checkInBooking({ variables: { id }, refetchQueries: [{ query: GET_BOOKINGS }, { query: GET_DASHBOARD_METRICS }] });
      toast.success("Guest checked in successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to check in");
    }
  };

  const handleCheckOut = async (id: string) => {
    try {
      await checkOutBooking({ variables: { id }, refetchQueries: [{ query: GET_BOOKINGS }, { query: GET_DASHBOARD_METRICS }] });
      toast.success("Guest checked out successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to check out");
    }
  };

  const handleExtendBooking = async (id: string) => {
    try {
      const booking = bookings.find((b: any) => b.id === id);
      if (!booking) return;
      const newEndDate = new Date(booking.endDate);
      newEndDate.setDate(newEndDate.getDate() + 7);
      await updateBooking({
        variables: {
          id,
          input: { endDate: newEndDate.toISOString() },
        },
        refetchQueries: [{ query: GET_BOOKINGS }],
      });
      toast.success("Booking extended by 7 days");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to extend booking");
    }
  };

  const handleCancelBooking = async (id: string) => {
    try {
      await cancelBooking({ variables: { id }, refetchQueries: [{ query: GET_BOOKINGS }, { query: GET_DASHBOARD_METRICS }] });
      toast.success("Booking cancelled");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel booking");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="bg-white rounded-2xl shadow-sm p-6 flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold text-[#101828]">Operations</h1>
          <p className="text-[#4A5565]">Manage bookings, check-ins, and space utilization</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-white border border-gray-200 text-[#4A5565] px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-gray-50 transition-all shadow-sm active:scale-[0.97] transition-transform duration-150">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="4" width="12" height="10" rx="2" />
              <path d="M5 2V4M11 2V4M2 8H14" />
            </svg>
            <span>Schedule</span>
          </button>
          <button 
            onClick={() => setShowBookRoom(true)}
            className="flex items-center gap-2 bg-[#FF7847] text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-[#FF6A3D] transition-all shadow-sm active:scale-[0.97] transition-transform duration-150"
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
        <div className="bg-white rounded-2xl shadow-sm p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
          <p className="text-sm text-gray-500 mb-2">Active Bookings</p>
          <p className="text-2xl font-bold text-[#101828]">
            {metricsLoading ? "—" : (metrics?.activeBookings ?? activeBookings.length)}
          </p>
          <span className="text-xs text-green-600 font-medium">Active today</span>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
          <p className="text-sm text-gray-500 mb-2">Checked In</p>
          <p className="text-2xl font-bold text-[#101828]">
            {metricsLoading ? "—" : (metrics?.occupancyRate != null ? `${metrics.occupancyRate}%` : "—")}
          </p>
          <span className="text-xs text-gray-400 font-medium">Currently in space</span>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
          <p className="text-sm text-gray-500 mb-2">Available Spaces</p>
          <p className="text-2xl font-bold text-[#101828]">
            {metricsLoading ? "—" : (metrics?.availableSeats ?? "—")}
          </p>
          <span className="text-xs text-green-600 font-medium">Open seats</span>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
          <p className="text-sm text-gray-500 mb-2">Today's Revenue</p>
          <p className="text-2xl font-bold text-[#101828]">
            {metricsLoading ? "—" : (metrics?.totalRevenue != null ? `₹${metrics.totalRevenue.toLocaleString()}` : "—")}
          </p>
          <span className="text-xs text-green-600 font-medium">Revenue today</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
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
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden transition-all duration-200">
          <div className="flex flex-wrap items-center gap-3 px-6 py-4 border-b border-gray-100">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 bg-[#F9FAFB] rounded-lg text-sm text-gray-700 outline-none border border-gray-200 focus:border-[#FF6A2F] transition-colors"
              >
                <option value="">All</option>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="CHECKED_IN">Checked In</option>
                <option value="CHECKED_OUT">Checked Out</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">From</label>
              <input
                type="date"
                value={filterFrom}
                onChange={(e) => setFilterFrom(e.target.value)}
                className="px-3 py-2 bg-[#F9FAFB] rounded-lg text-sm text-gray-700 outline-none border border-gray-200 focus:border-[#FF6A2F] transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">To</label>
              <input
                type="date"
                value={filterTo}
                onChange={(e) => setFilterTo(e.target.value)}
                className="px-3 py-2 bg-[#F9FAFB] rounded-lg text-sm text-gray-700 outline-none border border-gray-200 focus:border-[#FF6A2F] transition-colors"
              />
            </div>
            <button
              onClick={() => { setFilterStatus(""); setFilterFrom(""); setFilterTo(""); }}
              className="self-end mb-1 px-3 py-2 text-xs font-medium text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Reset
            </button>
          </div>

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
              {bookingsLoading && bookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12">
                    <QueryLoading message="Loading bookings…" />
                  </td>
                </tr>
              ) : bookingsData?.error && bookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12">
                    <QueryError message="Unable to load bookings." onRetry={() => refetchBookings()} />
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-400">No bookings found.</td>
                </tr>
              ) : (
                bookings.map((booking: any) => {
                  const statusInfo = BACKEND_STATUS_MAP[booking.status as BackendBookingStatus] ?? {
                    label: booking.status,
                    style: "bg-gray-100 text-gray-600",
                  };
                  const checkIn = new Date(booking.startDate);
                  const checkOut = new Date(booking.endDate);
                  return (
                    <tr key={booking.id} className="transition-colors duration-150 hover:bg-[#F9FAFB]">
                      <td className="px-6 py-4 compact:px-3 compact:py-2 text-sm font-medium text-[#101828]">{booking.id.slice(0, 8)}…</td>
                      <td className="px-6 py-4 compact:px-3 compact:py-2 text-sm text-[#4A5565]">{booking.user?.name ?? "Unknown"}</td>
                      <td className="px-6 py-4 compact:px-3 compact:py-2 text-sm text-[#101828] font-medium">{booking.seat?.number ?? booking.meetingRoom?.name ?? "—"}</td>
                      <td className="px-6 py-4 compact:px-3 compact:py-2 text-sm text-[#4A5565]">{checkIn.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
                      <td className="px-6 py-4 compact:px-3 compact:py-2 text-sm text-[#4A5565]">{checkOut.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
                      <td className="px-6 py-4 compact:px-3 compact:py-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.style}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 compact:px-3 compact:py-2 flex gap-2">
                        {booking.status === "CONFIRMED" && (
                          <button onClick={() => handleCheckIn(booking.id)} className="text-xs bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600 transition-all active:scale-[0.97]">Check In</button>
                        )}
                        {booking.status === "CHECKED_IN" && (
                          <>
                            <button onClick={() => handleExtendBooking(booking.id)} className="text-xs bg-blue-100 text-blue-600 px-3 py-1 rounded-lg hover:bg-blue-200 mr-1 transition-all active:scale-[0.97]">Extend</button>
                            <button onClick={() => handleCheckOut(booking.id)} className="text-xs bg-orange-500 text-white px-3 py-1 rounded-lg hover:bg-orange-600 transition-all active:scale-[0.97]">Check Out</button>
                          </>
                        )}
                        {(booking.status === "CONFIRMED" || booking.status === "CHECKED_IN") && (
                          <button onClick={() => handleCancelBooking(booking.id)} className="text-xs bg-red-100 text-red-600 px-3 py-1 rounded-lg hover:bg-red-200 transition-all active:scale-[0.97]">Cancel</button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Check-in/Out - Quick Actions */}
      {activeTab === "check-in" && (
        <div className="grid grid-cols-1 compact:grid-cols-2 gap-6 compact:gap-3">
          <div className="bg-white rounded-2xl shadow-sm p-6 transition-all duration-200 hover:shadow-md">
            <h3 className="text-lg font-semibold text-[#101828] mb-4">Pending Check-ins</h3>
            <div className="space-y-4">
              {bookingsLoading ? (
                <div className="text-sm text-gray-400">Loading…</div>
              ) : bookings.filter((b: any) => b.status === "CONFIRMED").length === 0 ? (
                <div className="text-sm text-gray-400">No pending check-ins.</div>
              ) : (
                bookings
                  .filter((b: any) => b.status === "CONFIRMED")
                  .map((booking: any) => {
                    const checkIn = new Date(booking.startDate);
                    return (
                      <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5">
                        <div>
                          <p className="font-medium text-[#101828]">{booking.user?.name ?? "Unknown"}</p>
                          <p className="text-sm text-[#4A5565]">{booking.seat?.number ?? "—"} &middot; {checkIn.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                        </div>
                        <button onClick={() => handleCheckIn(booking.id)} className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition-all active:scale-[0.97]">
                          Check In
                        </button>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6 transition-all duration-200 hover:shadow-md">
            <h3 className="text-lg font-semibold text-[#101828] mb-4">Pending Check-outs</h3>
            <div className="space-y-4">
              {bookingsLoading ? (
                <div className="text-sm text-gray-400">Loading…</div>
              ) : bookings.filter((b: any) => b.status === "CHECKED_IN").length === 0 ? (
                <div className="text-sm text-gray-400">No pending check-outs.</div>
              ) : (
                bookings
                  .filter((b: any) => b.status === "CHECKED_IN")
                  .map((booking: any) => {
                    const checkOut = new Date(booking.endDate);
                    return (
                      <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5">
                        <div>
                          <p className="font-medium text-[#101828]">{booking.user?.name ?? "Unknown"}</p>
                          <p className="text-sm text-[#4A5565]">{booking.seat?.number ?? "—"} &middot; {checkOut.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                        </div>
                        <button onClick={() => handleCheckOut(booking.id)} className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition-all active:scale-[0.97]">
                          Check Out
                        </button>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Space Status */}
      {activeTab === "spaces" && (
        <div className="bg-white rounded-2xl shadow-sm p-6 transition-all duration-200 hover:shadow-md">
          <h3 className="text-lg font-semibold text-[#101828] mb-4">Space Availability</h3>
          <div className="grid grid-cols-4 gap-4">
            {["Cabins", "Hot Desks", "Meeting Rooms", "Dedicated Desks"].map((type, i) => {
              const counts: Record<string, number> = {
                "Cabins": metrics?.totalSeats ? Math.floor(metrics.totalSeats * 0.25) : 0,
                "Hot Desks": metrics?.totalSeats ? Math.floor(metrics.totalSeats * 0.40) : 0,
                "Meeting Rooms": metrics?.availableSeats ? Math.floor(metrics.availableSeats * 0.15) : 0,
                "Dedicated Desks": metrics?.totalSeats ? Math.floor(metrics.totalSeats * 0.20) : 0,
              };
              return (
                <div key={type} className="bg-gray-50 rounded-xl p-4 text-center transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                  <div className="w-12 h-12 bg-[#FF7847] rounded-full flex items-center justify-center mx-auto mb-3 text-white font-bold text-xl">
                    {metricsLoading ? "—" : (counts[type] ?? "—")}
                  </div>
                  <p className="text-sm font-medium text-[#101828]">{type}</p>
                  <p className="text-xs text-gray-500">available</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Meeting Rooms */}
      {activeTab === "meeting-rooms" && <MeetingRoomsTab onBookRoom={() => setShowBookRoom(true)} />}

      {/* Book Room Modal — rendered at page root so "New Booking" works on every tab */}
      <BookRoomModal open={showBookRoom} onClose={() => setShowBookRoom(false)} />
    </div>
  );
}

function MeetingRoomsTab({ onBookRoom }: { onBookRoom?: () => void }) {
  const { rooms, loading: roomsLoading, refetch: refetchRooms } = useMeetingRooms();
  const { requests, loading: requestsLoading } = useRequests({ status: "PENDING", limit: 10 });

  const availableCount = rooms.filter((r: any) => r.status === "AVAILABLE").length;
  const occupiedCount = rooms.filter((r: any) => r.status === "OCCUPIED").length;

  const ROOM_STATUS_STYLE: Record<string, { label: string; pill: string; card: string }> = {
    AVAILABLE:   { label: "Available",   pill: "bg-blue-50 text-blue-600",         card: "bg-blue-50 border-blue-200" },
    OCCUPIED:    { label: "Occupied",     pill: "bg-gray-100 text-gray-600",        card: "bg-orange-100 border-orange-300" },
    BOOKED:      { label: "Booked",       pill: "bg-purple-50 text-purple-600",    card: "bg-purple-50 border-purple-200" },
    MAINTENANCE: { label: "Maintenance",   pill: "bg-gray-100 text-gray-500",        card: "bg-gray-100 border-gray-300" },
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="bg-white rounded-2xl shadow-sm p-6 flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold text-[#101828]">Meeting Room Status</h1>
          <p className="text-[#4A5565]">Monitor meeting room usage, availability and booking status</p>
        </div>
        <button
          onClick={() => onBookRoom?.()}
          className="flex items-center gap-2 bg-[#FF7847] text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-[#FF6A3D] transition-colors shadow-sm"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M8 3V13M3 8H13" />
          </svg>
          <span>Book Room</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-sm p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
          <p className="text-sm text-gray-500 mb-2">No. of Rooms</p>
          <p className="text-2xl font-bold text-[#101828]">{roomsLoading ? "—" : rooms.length}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
          <p className="text-sm text-gray-500 mb-2">Occupied</p>
          <p className="text-2xl font-bold text-[#101828]">{roomsLoading ? "—" : occupiedCount}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
          <p className="text-sm text-gray-500 mb-2">Vacant Slot</p>
          <p className="text-2xl font-bold text-[#101828]">{roomsLoading ? "—" : availableCount}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
          <p className="text-sm text-gray-500 mb-2">Peak Usage Hrs</p>
          <p className="text-2xl font-bold text-[#101828]">10 AM – 4 PM</p>
        </div>
      </div>

      {/* Room Cards */}
      <div className="grid grid-cols-1 compact:grid-cols-2 gap-6 compact:gap-3">
        {roomsLoading ? (
          <div className="col-span-full text-center py-8 text-gray-400">Loading rooms…</div>
        ) : rooms.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-400">No meeting rooms found.</div>
        ) : (
          rooms.map((room: any) => {
            const style = ROOM_STATUS_STYLE[room.status] ?? ROOM_STATUS_STYLE["AVAILABLE"];
            const isActionable = room.status === "AVAILABLE" || room.status === "OCCUPIED";
            return (
              <div key={room.id} className="bg-white rounded-2xl shadow-sm p-6 transition-all duration-200 hover:shadow-md">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-[#101828]">{room.name}</h3>
                    <p className="text-sm text-[#6A7282]">{room.capacity ?? 0} people</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${style.pill}`}>
                    {style.label}
                  </span>
                </div>
                {room.locationName && (
                  <p className="text-sm text-[#4A5565] mb-1">{room.locationName}</p>
                )}
                <p className="text-xs text-[#6A7282] mb-4">
                  {room.hourlyRate != null ? `₹${room.hourlyRate}/hr` : ""}
                </p>
                {isActionable ? (
                  <button
                    onClick={() => onBookRoom?.()}
                    className="w-full py-2.5 rounded-xl text-sm font-medium bg-[#FF7847] text-white hover:bg-[#FF6A3D] transition-all active:scale-[0.97]"
                  >
                    {room.status === "OCCUPIED" ? "Extend" : "Book Now"}
                  </button>
                ) : (
                  <button className="w-full py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-[#4A5565] opacity-50 cursor-not-allowed transition-all" disabled>
                    Unavailable
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Active Add-ons & Requests */}
      <div className="bg-white rounded-2xl shadow-sm p-6 transition-all duration-200 hover:shadow-md">
        <h3 className="text-lg font-semibold text-[#101828] mb-4">Active Add-ons & Requests</h3>
        <div className="space-y-4">
          {requestsLoading ? (
            <div className="text-sm text-gray-400">Loading requests…</div>
          ) : requests.length === 0 ? (
            <div className="text-sm text-gray-400">No active requests.</div>
          ) : (
            requests.map((req: any) => (
              <div key={req.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5">
                <div className="flex items-center gap-3">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#6A7282]">
                    <rect x="2" y="3" width="16" height="14" rx="2" />
                    <path d="M10 7V13M7 10H13" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-[#101828]">{req.title ?? req.requestType}</p>
                    <p className="text-xs text-[#6A7282]">{req.requestedBy?.name ?? "—"}</p>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 ${
                  req.status === "COMPLETED" || req.status === "IN_PROGRESS"
                    ? "border-[#10B981] bg-[#10B981]"
                    : "border-[#FF7847]"
                }`} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}