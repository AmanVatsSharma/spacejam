/**
 * File:        apps/web/src/app/dashboard/floors/page.tsx
 * Module:      Web · Dashboard · Floors Page
 * Purpose:     Floor and seat management overview
 *
 * Exports:
 *   - FloorsPage — floor/seat overview page content
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-05-28
 */

"use client";

import { useState } from "react";

interface Seat {
  id: string;
  type: string;
  status: "available" | "occupied" | "maintenance";
  occupant: string | null;
  price: number;
}

interface Floor {
  id: string;
  name: string;
  seats: Seat[];
}

const floors: Floor[] = [
  {
    id: "floor-1",
    name: "Floor 1",
    seats: [
      { id: "C1", type: "Cabin", status: "occupied", occupant: "TechCorp India", price: 1500 },
      { id: "C2", type: "Cabin", status: "available", occupant: null, price: 1500 },
      { id: "C3", type: "Cabin", status: "maintenance", occupant: null, price: 1500 },
      { id: "HD1", type: "Hot Desk", status: "occupied", occupant: "Priya Sharma", price: 500 },
      { id: "HD2", type: "Hot Desk", status: "available", occupant: null, price: 500 },
      { id: "HD3", type: "Hot Desk", status: "occupied", occupant: "Rahul Verma", price: 500 },
      { id: "DD1", type: "Dedicated", status: "occupied", occupant: "StartupXYZ", price: 800 },
      { id: "DD2", type: "Dedicated", status: "available", occupant: null, price: 800 },
    ],
  },
  {
    id: "floor-2",
    name: "Floor 2",
    seats: [
      { id: "M1", type: "Meeting Room", status: "occupied", occupant: "Design Studio", price: 2000 },
      { id: "M2", type: "Meeting Room", status: "available", occupant: null, price: 2000 },
      { id: "PB1", type: "Phone Booth", status: "available", occupant: null, price: 300 },
      { id: "PB2", type: "Phone Booth", status: "occupied", occupant: "Vikram Singh", price: 300 },
      { id: "HD4", type: "Hot Desk", status: "available", occupant: null, price: 500 },
      { id: "HD5", type: "Hot Desk", status: "occupied", occupant: "Neha Gupta", price: 500 },
    ],
  },
];

const seatColors = {
  available: "bg-green-100 border-green-300 text-green-700",
  occupied: "bg-orange-100 border-orange-300 text-orange-700",
  maintenance: "bg-gray-100 border-gray-300 text-gray-500",
};

const statusBadgeColors = {
  available: "bg-green-100 text-green-700",
  occupied: "bg-orange-100 text-orange-700",
  maintenance: "bg-gray-100 text-gray-600",
};

export default function FloorsPage() {
  const [activeFloor, setActiveFloor] = useState<string>(floors[0].id);
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);

  const currentFloor = floors.find((f) => f.id === activeFloor) || floors[0];

  const totalFloors = floors.length;
  const totalSeats = floors.reduce((sum, f) => sum + f.seats.length, 0);
  const occupiedSeats = floors.reduce(
    (sum, f) => sum + f.seats.filter((s) => s.status === "occupied").length,
    0
  );
  const availableSeats = floors.reduce(
    (sum, f) => sum + f.seats.filter((s) => s.status === "available").length,
    0
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "available":
        return (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="mr-1">
            <circle cx="6" cy="6" r="5" fill="#10B981" />
          </svg>
        );
      case "occupied":
        return (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="mr-1">
            <circle cx="6" cy="6" r="5" fill="#F59E0B" />
          </svg>
        );
      case "maintenance":
        return (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="mr-1">
            <circle cx="6" cy="6" r="5" fill="#9CA3AF" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="bg-white rounded-2xl shadow-sm p-6 flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold text-[#101828]">Floor & Seats Overview</h1>
          <p className="text-[#4A5565]">Manage floor plans and seat availability</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-white border border-gray-200 text-[#4A5565] px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors shadow-sm">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2 4V12C2 12.55 2.21 13.05 2.59 13.41C2.96 13.78 3.46 14 4 14H12C12.55 14 13.05 13.78 13.41 13.41C13.78 13.05 14 12.55 14 12V4M2 4H14M2 4L4 2H12L14 4M8 6V10M6 8H10" />
            </svg>
            <span>Export Layout</span>
          </button>
          <button className="flex items-center gap-2 bg-[#FF7847] text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-[#FF6A3D] transition-colors shadow-sm">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8 3V13M3 8H13" />
            </svg>
            <span>Add Seat</span>
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-sm text-gray-500 mb-2">Total Floors</p>
          <p className="text-2xl font-bold text-[#101828]">{totalFloors}</p>
          <span className="text-xs text-gray-400 font-medium">Building levels</span>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-sm text-gray-500 mb-2">Total Seats</p>
          <p className="text-2xl font-bold text-[#101828]">{totalSeats}</p>
          <span className="text-xs text-gray-400 font-medium">All spaces</span>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-sm text-gray-500 mb-2">Occupied Seats</p>
          <p className="text-2xl font-bold text-[#101828]">{occupiedSeats}</p>
          <span className="text-xs text-orange-500 font-medium">In use</span>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-sm text-gray-500 mb-2">Available Seats</p>
          <p className="text-2xl font-bold text-[#101828]">{availableSeats}</p>
          <span className="text-xs text-green-600 font-medium">Ready to book</span>
        </div>
      </div>

      {/* Floor Selector Tabs */}
      <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm w-fit">
        {floors.map((floor) => (
          <button
            key={floor.id}
            onClick={() => {
              setActiveFloor(floor.id);
              setSelectedSeat(null);
            }}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeFloor === floor.id
                ? "bg-[#FF7847] text-white"
                : "text-[#4A5565] hover:bg-gray-100"
            }`}
          >
            {floor.name}
          </button>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Floor Visualization */}
        <div className="col-span-2 bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-[#101828]">{currentFloor.name} Layout</h3>
            <div className="flex gap-4 text-xs">
              <div className="flex items-center">
                <span className="w-3 h-3 rounded bg-green-100 border border-green-300 mr-1"></span>
                <span className="text-gray-500">Available</span>
              </div>
              <div className="flex items-center">
                <span className="w-3 h-3 rounded bg-orange-100 border border-orange-300 mr-1"></span>
                <span className="text-gray-500">Occupied</span>
              </div>
              <div className="flex items-center">
                <span className="w-3 h-3 rounded bg-gray-100 border border-gray-300 mr-1"></span>
                <span className="text-gray-500">Maintenance</span>
              </div>
            </div>
          </div>

          {/* Seat Grid */}
          <div className="grid grid-cols-4 gap-3">
            {currentFloor.seats.map((seat) => (
              <button
                key={seat.id}
                onClick={() => setSelectedSeat(seat)}
                className={`
                  p-3 rounded-xl border-2 text-center transition-all hover:scale-105 cursor-pointer
                  ${seatColors[seat.status]}
                  ${selectedSeat?.id === seat.id ? "ring-2 ring-[#FF6A2F] ring-offset-2" : ""}
                `}
              >
                <div className="text-sm font-semibold">{seat.id}</div>
                <div className="text-xs mt-1 opacity-75">{seat.type}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Seat Details Panel */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-[#101828] mb-4">Seat Details</h3>

          {selectedSeat ? (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl font-bold text-[#101828]">{selectedSeat.id}</span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${statusBadgeColors[selectedSeat.status]}`}
                  >
                    {selectedSeat.status}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Type</span>
                    <span className="font-medium text-[#101828]">{selectedSeat.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Price</span>
                    <span className="font-medium text-[#101828]">₹{selectedSeat.price}/day</span>
                  </div>
                  {selectedSeat.occupant && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Occupant</span>
                      <span className="font-medium text-[#101828]">{selectedSeat.occupant}</span>
                    </div>
                  )}
                </div>
              </div>

              {selectedSeat.status === "available" && (
                <button className="w-full bg-[#FF7847] text-white px-4 py-2.5 rounded-xl font-medium text-sm hover:bg-[#FF6A3D] transition-colors">
                  Book This Seat
                </button>
              )}
              {selectedSeat.status === "occupied" && (
                <button className="w-full bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl font-medium text-sm hover:bg-gray-200 transition-colors">
                  View Booking Details
                </button>
              )}
              {selectedSeat.status === "maintenance" && (
                <button className="w-full bg-blue-100 text-blue-700 px-4 py-2.5 rounded-xl font-medium text-sm hover:bg-blue-200 transition-colors">
                  Mark as Available
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M9 9h6M9 12h6M9 15h4" />
                </svg>
              </div>
              <p className="text-sm text-gray-500">Select a seat from the grid to view details</p>
            </div>
          )}

          {/* Seat List */}
          <div className="mt-6">
            <h4 className="text-sm font-medium text-[#101828] mb-3">All Seats ({currentFloor.seats.length})</h4>
            <div className="space-y-2 max-h-[240px] overflow-y-auto">
              {currentFloor.seats.map((seat) => (
                <button
                  key={seat.id}
                  onClick={() => setSelectedSeat(seat)}
                  className={`
                    w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors
                    ${selectedSeat?.id === seat.id ? "bg-[#FF7847]/10 border border-[#FF7847]" : "bg-gray-50 hover:bg-gray-100"}
                  `}
                >
                  <div className="flex items-center gap-2">
                    {getStatusIcon(seat.status)}
                    <div>
                      <span className="text-sm font-medium text-[#101828]">{seat.id}</span>
                      <span className="text-xs text-gray-400 ml-2">{seat.type}</span>
                    </div>
                  </div>
                  {seat.occupant && (
                    <span className="text-xs text-gray-500 truncate max-w-[80px]">{seat.occupant}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
