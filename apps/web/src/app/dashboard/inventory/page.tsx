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
 * Last-updated: 2026-07-06
 */

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { toast } from "sonner";
import {
  GET_MY_CENTERS,
  GET_FLOORS,
  CREATE_CENTER,
  UPDATE_CENTER,
} from "@/lib/apollo/operations";
import { StatCards } from "@/components/ui/stat-card";
import { FloorCardGrid } from "@/components/ui/floor-card";
import { LocationSidebar } from "@/components/ui/location-sidebar";
import { SetUpCenterModal, FloorSetupModal } from "@/components/ui/dashboard";
import { QueryLoading, QueryError, QueryEmpty } from "@/components/ui/query-status";

interface CenterLocation {
  id: string;
  name?: string;
  city: string;
}

interface ServerCenter {
  id: string;
  name: string;
  location: CenterLocation;
  floors: { id: string; name: string }[];
}

interface SidebarLocation {
  id: string;
  name: string;
  expanded: boolean;
  centers: { id: string; name: string; selected?: boolean }[];
}

export default function InventoryPage() {
  const [selectedCenterId, setSelectedCenterId] = useState<string | null>(null);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showFloorModal, setShowFloorModal] = useState(false);
  const [creating, setCreating] = useState(false);

  // Query centers (provides sidebar tree)
  const {
    data: centersData,
    loading: centersLoading,
    error: centersError,
  } = useQuery<{ myCenters: ServerCenter[] }>(GET_MY_CENTERS, {
    fetchPolicy: "cache-and-network",
    errorPolicy: "all",
  });

  // Query floors — filtered by selected center
  const {
    data: floorsData,
    loading: floorsLoading,
    error: floorsError,
  } = useQuery<{ floors: any[] }>(GET_FLOORS, {
    fetchPolicy: "cache-and-network",
    errorPolicy: "all",
    variables: selectedCenterId ? { centerId: selectedCenterId } : {},
  });

  // Mutations
  const [createCenter] = useMutation(CREATE_CENTER, {
    refetchQueries: [{ query: GET_MY_CENTERS }],
  });

  const [updateCenter] = useMutation(UPDATE_CENTER, {
    refetchQueries: [{ query: GET_MY_CENTERS }, { query: GET_FLOORS }],
  });

  // Transform myCenters → sidebar location tree (grouped by city)
  const locations: SidebarLocation[] = useMemo(() => {
    if (!centersData?.myCenters) return [];

    // Group centers by city
    const byCity: Record<string, SidebarLocation> = {};
    for (const center of centersData.myCenters) {
      const cityKey = center.location?.city ?? "Unknown City";
      if (!byCity[cityKey]) {
        byCity[cityKey] = {
          id: cityKey.toLowerCase().replace(/\s+/g, "-"),
          name: cityKey,
          expanded: false,
          centers: [],
        };
      }
      byCity[cityKey].centers.push({
        id: center.id,
        name: center.name,
        selected: center.id === selectedCenterId,
      });
    }

    // Auto-expand the city that has the selected center
    const result = Object.values(byCity).map((loc) => ({
      ...loc,
      expanded: loc.centers.some((c) => c.selected),
    }));
    return result;
  }, [centersData, selectedCenterId]);

  // Transform server floors → FloorCard props
  const floors = useMemo(() => {
    if (!floorsData?.floors) return [];
    return floorsData.floors.map((floor: any) => ({
      floorName: floor.name ?? `Floor ${floor.id}`,
      totalSeats: floor.seats?.length ?? 0,
      status: "active" as const,
      openSeats: floor.seats?.filter((s: any) => s.status === "AVAILABLE" || s.status === "available").length ?? 0,
      cabins: floor.seats?.filter((s: any) => s.seatType === "CABIN" || s.seatType === "cabin").length ?? 0,
      occupancy: 0, // computed from seat statuses if booking data is available
    }));
  }, [floorsData]);

  const handleLocationSelect = (locationId: string, centerId?: string) => {
    if (centerId) {
      setSelectedCenterId(centerId);
    }
  };

  // Wire SetUpCenterModal "Create center" (step 5) to CREATE_CENTER mutation
  const handleCreateCenter = async (input: Record<string, any>) => {
    setCreating(true);
    try {
      await createCenter({ variables: { input } });
      toast.success("Center created successfully");
      setShowSetupModal(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create center");
    } finally {
      setCreating(false);
    }
  };

  const isLoading = centersLoading || floorsLoading;

  return (
    <div className="flex gap-6 compact:gap-3">
      {/* Main Content */}
      <div className="flex flex-col gap-6 compact:gap-3 flex-1 min-w-0">
        {/* Page Title Card */}
        <div className="bg-white rounded-2xl shadow-sm p-5 flex items-center justify-between hover:shadow-md transition-all duration-200">
          <div className="flex flex-col gap-1">
            <h1 className="text-[22px] font-semibold text-[#101828]">Location Management</h1>
            <p className="text-sm text-[#4A5565]">
              Manage coworking spaces, track capacity, and optimize utilization
            </p>
          </div>
          <button
            onClick={() => setShowSetupModal(true)}
            disabled={isLoading}
            className="flex items-center gap-2 bg-[#FF7847] text-white px-4 py-2 rounded-xl font-medium text-sm h-[36px] hover:bg-[#FF6A3D] active:scale-[0.97] transition-all duration-150 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
            {selectedCenterId ? (
              <button
                onClick={() => setShowFloorModal(true)}
                disabled={isLoading}
                className="flex items-center gap-2 bg-[#FF7847] text-white px-4 py-2 rounded-xl font-medium text-sm h-[36px] hover:bg-[#FF6A3D] active:scale-[0.97] transition-all duration-150 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M8 3V13M3 8H13" />
                </svg>
                <span>Add Floor</span>
              </button>
            ) : null}
          </div>
          {isLoading && floors.length === 0 ? (
            <div className="flex items-center justify-center h-40 bg-white rounded-2xl border border-[#EAEAEA]">
              <QueryLoading message="Loading floors…" />
            </div>
          ) : floorsError ? (
            <div className="flex items-center justify-center h-40 bg-white rounded-2xl border border-red-100">
              <QueryError message="Unable to load floors." onRetry={() => window.location.reload()} />
            </div>
          ) : floors.length === 0 ? (
            <div className="flex items-center justify-center h-40 bg-white rounded-2xl border border-[#EAEAEA]">
              <QueryEmpty message="No floors found" hint={selectedCenterId ? "Add a new floor to get started." : "Select a center from the sidebar to view floors."} />
            </div>
          ) : (
            <FloorCardGrid floors={floors} />
          )}
        </div>
      </div>

      {/* Right Sidebar - Location Tree */}
      {centersLoading && locations.length === 0 ? (
        <aside className="flex flex-col items-start py-6 px-6 bg-white rounded-2xl shadow-sm w-[320px] h-[859px] hover:shadow-md transition-all duration-200">
          <QueryLoading message="Loading locations…" />
        </aside>
      ) : centersError && locations.length === 0 ? (
        <aside className="flex flex-col items-start py-6 px-6 bg-white rounded-2xl shadow-sm w-[320px] h-[859px] hover:shadow-md transition-all duration-200">
          <QueryError message="Unable to load locations." onRetry={() => window.location.reload()} />
        </aside>
      ) : (
        <LocationSidebar locations={locations} onLocationSelect={handleLocationSelect} />
      )}

      <SetUpCenterModal
        isOpen={showSetupModal}
        onClose={() => setShowSetupModal(false)}
      />

      <FloorSetupModal
        isOpen={showFloorModal}
        onClose={() => setShowFloorModal(false)}
        centerId={selectedCenterId ?? undefined}
      />
    </div>
  );
}
