"use client";

/**
 * File:        apps/web/src/app/dashboard/inventory/page.tsx
 * Module:      Web · Dashboard · Inventory Page
 * Purpose:     Inventory page content - header/sidebar provided by layout
 *
 * Exports:
 *   - InventoryPage — inventory page content
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-05-28
 */


export const dynamic = 'force-dynamic';

import { useState } from "react";
import { StatCards } from "@/components/ui/stat-card";
import { FloorCardGrid } from "@/components/ui/floor-card";
import { LocationSidebar } from "@/components/ui/location-sidebar";
import { SetUpCenterModal, FloorSetupModal } from "@/components/ui/dashboard";

const mockLocations = [
  {
    id: "chandigarh",
    name: "Chandigarh",
    expanded: true,
    centers: [
      { id: "it-park", name: "IT Park", selected: true },
      { id: "sector-17", name: "Sector 17" },
      { id: "industrial-area", name: "Industrial Area" },
    ],
  },
  {
    id: "mohali",
    name: "Mohali",
    centers: [{ id: "mohali-center", name: "Mohali Center" }],
  },
  {
    id: "jalandhar",
    name: "Jalandhar",
    centers: [{ id: "jalandhar-center", name: "Jalandhar Center" }],
  },
];

const mockFloors = [
  {
    floorName: "Floor 1",
    totalSeats: 60,
    status: "active" as const,
    openSeats: "40 (20 available)",
    cabins: 10,
    occupancy: 67,
  },
  {
    floorName: "Floor 2",
    totalSeats: 55,
    status: "active" as const,
    openSeats: "35 (15 available)",
    cabins: 8,
    occupancy: 73,
  },
  {
    floorName: "Floor 3",
    totalSeats: 50,
    status: "full" as const,
    openSeats: "30 (5 available)",
    cabins: 12,
    occupancy: 90,
  },
  {
    floorName: "Floor 4",
    totalSeats: 45,
    status: "maintenance" as const,
    openSeats: "25 (0 available)",
    cabins: 6,
    occupancy: 45,
  },
];

export default function InventoryPage() {
  const [locations, setLocations] = useState(mockLocations);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showFloorModal, setShowFloorModal] = useState(false);

  const handleLocationSelect = (locationId: string, centerId?: string) => {
    setLocations((prev) =>
      prev.map((loc) =>
        loc.id === locationId
          ? {
              ...loc,
              centers: loc.centers.map((c) => ({
                ...c,
                selected: centerId ? c.id === centerId : false,
              })),
            }
          : loc
      )
    );
  };

  return (
    <div className="flex gap-6 compact:gap-3">
      {/* Main Content */}
      <div className="flex flex-col gap-6 compact:gap-3 flex-1 min-w-0">
        {/* Page Title Card */}
        <div className="bg-white rounded-2xl shadow-sm p-5 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-[22px] font-semibold text-[#101828]">Location Management</h1>
            <p className="text-sm text-[#4A5565]">
              Manage coworking spaces, track capacity, and optimize utilization
            </p>
          </div>
          <button 
            onClick={() => setShowSetupModal(true)}
            className="flex items-center gap-2 bg-[#FF7847] text-white px-4 py-2 rounded-xl font-medium text-sm h-[36px] hover:bg-[#FF6A3D] transition-colors shadow-sm"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8 3V13M3 8H13" />
            </svg>
            <span>Add Center</span>
          </button>
        </div>

        {/* Stats Cards */}
        <StatCards />

        {/* Floor Overview */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-[#101828]">Floor Overview</h2>
            <button 
              onClick={() => setShowFloorModal(true)}
              className="flex items-center gap-2 bg-[#FF7847] text-white px-4 py-2 rounded-xl font-medium text-sm h-[36px] hover:bg-[#FF6A3D] transition-colors shadow-sm"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M8 3V13M3 8H13" />
              </svg>
              <span>Add Floor</span>
            </button>
          </div>
          <FloorCardGrid floors={mockFloors} />
        </div>
      </div>

      {/* Right Sidebar - Location Tree */}
      <LocationSidebar locations={locations} onLocationSelect={handleLocationSelect} />
      
      <SetUpCenterModal 
        isOpen={showSetupModal} 
        onClose={() => setShowSetupModal(false)} 
      />

      <FloorSetupModal 
        isOpen={showFloorModal}
        onClose={() => setShowFloorModal(false)}
      />
    </div>
  );
}