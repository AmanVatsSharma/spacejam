"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCenters, useFloors, useCreateCenter, useUpdateFloor, useDeleteFloor } from "@/hooks/use-inventory";
import { FloorCardGrid } from "@/components/ui/floor-card";
import { LocationSidebar } from "@/components/ui/location-sidebar";
import { SetUpCenterModal, FloorSetupModal } from "@/components/ui/dashboard";
import { QueryLoading, QueryError, QueryEmpty } from "@/components/ui/query-status";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { normalizeStatus } from "@/lib/revenue-status";

interface SidebarLocation {
  id: string;
  name: string;
  expanded: boolean;
  centers: { id: string; name: string; selected?: boolean }[];
}

export default function InventoryPage() {
  const router = useRouter();
  const [selectedCenterId, setSelectedCenterId] = useState<string | null>(null);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showFloorModal, setShowFloorModal] = useState(false);
  const [creating, setCreating] = useState(false);

  const [renameTarget, setRenameTarget] = useState<{ id: string; currentName: string } | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [actionPending, setActionPending] = useState(false);

  const { centers: centersList, loading: centersLoading, error: centersError, refetch: refetchCenters } = useCenters();
  const { floors, loading: floorsLoading, error: floorsError, refetch: refetchFloors } = useFloors(selectedCenterId);

  const { loading: createCenterLoading, createCenter } = useCreateCenter();
  const { loading: updateFloorLoading, updateFloor } = useUpdateFloor();
  const { loading: deleteFloorLoading, deleteFloor } = useDeleteFloor();

  const locations: SidebarLocation[] = useMemo(() => {
    if (!centersList.length) return [];
    const byCity: Record<string, SidebarLocation> = {};
    for (const center of centersList) {
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
    return Object.values(byCity).map((loc) => ({
      ...loc,
      expanded: loc.centers.some((c) => c.selected),
    }));
  }, [centersList, selectedCenterId]);

  const stats = useMemo(() => {
    const totalSeats = floors.reduce((s: number, f: any) => s + (f.seats?.length ?? 0), 0);
    const availableSeats = floors.reduce(
      (s: number, f: any) => s + (f.seats?.filter((seat: any) => normalizeStatus(seat.status) === "AVAILABLE").length ?? 0),
      0,
    );
    const occupiedSeats = totalSeats - availableSeats;
    const occupancyRate = totalSeats > 0 ? Math.round((occupiedSeats / totalSeats) * 100) : 0;
    return { totalSeats, availableSeats, occupiedSeats, occupancyRate };
  }, [floors]);

  const isLoading = centersLoading || floorsLoading;

  const openRename = (floorId: string, currentName: string) => {
    setRenameTarget({ id: floorId, currentName });
    setRenameValue(currentName ?? "");
  };

  const closeRename = () => {
    setRenameTarget(null);
    setRenameValue("");
  };

  const submitRename = async () => {
    if (!renameTarget) return;
    const name = renameValue.trim();
    if (!name) {
      toast.error("Floor name cannot be empty");
      return;
    }
    if (name === renameTarget.currentName) {
      closeRename();
      return;
    }
    setActionPending(true);
    try {
      await updateFloor({ id: renameTarget.id, input: { name } });
      toast.success("Floor renamed");
      await refetchFloors();
      closeRename();
    } finally {
      setActionPending(false);
    }
  };

  const openDelete = (floorId: string, name: string) => {
    setDeleteTarget({ id: floorId, name });
  };

  const submitDelete = async () => {
    if (!deleteTarget) return;
    setActionPending(true);
    try {
      await deleteFloor({ id: deleteTarget.id });
      toast.success(`Floor "${deleteTarget.name}" deleted`);
      await refetchFloors();
      setDeleteTarget(null);
    } finally {
      setActionPending(false);
    }
  };

  const handleLocationSelect = (_locationId: string, centerId?: string) => {
    if (centerId) setSelectedCenterId(centerId);
  };

  const handleCreateCenter = async (input: Record<string, any>) => {
    setCreating(true);
    try {
      await createCenter({ input });
      setShowSetupModal(false);
      await refetchCenters();
    } finally {
      setCreating(false);
    }
  };

  const floorCards = useMemo(() => {
    return floors.map((floor: any) => ({
      id: floor.id,
      floorName: floor.name ?? `Floor ${floor.id}`,
      totalSeats: floor.seats?.length ?? 0,
      status: "active" as const,
      openSeats: floor.seats?.filter((s: any) => normalizeStatus(s.status) === "AVAILABLE").length ?? 0,
      cabins: floor.seats?.filter((s: any) => normalizeStatus(s.seatType) === "CABIN").length ?? 0,
      occupancy: stats.occupancyRate,
      // Wire the prominent "View Floor Map" button on each card (previously
      // the prop was omitted, so the button rendered as a disabled no-op).
      onViewFloorMap: (floorId: string) => {
        router.push(`/dashboard/inventory/floor-map?centerId=${selectedCenterId}&floorId=${floorId}`);
      },
      contextMenuItems: [
        {
          label: "View floor map",
          onClick: () => {
            router.push(`/dashboard/inventory/floor-map?centerId=${selectedCenterId}&floorId=${floor.id}`);
          },
        },
        {
          label: "Rename floor",
          onClick: () => openRename(floor.id, floor.name),
        },
        { divider: true, label: "", onClick: () => {} },
        {
          label: "Delete floor",
          destructive: true,
          onClick: () => openDelete(floor.id, floor.name ?? `Floor ${floor.id}`),
        },
      ],
    }));
  }, [floors, selectedCenterId, router, stats.occupancyRate]);

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

        {/* Inventory Stats — live data */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Centers", value: centersList.length, icon: "🏢", color: "text-blue-600" },
            { label: "Floors", value: floors.length, icon: "🏗️", color: "text-purple-600" },
            { label: "Total Seats", value: stats.totalSeats, icon: "🪑", color: "text-gray-700" },
            { label: "Available", value: stats.availableSeats, icon: "✅", color: "text-green-600" },
            { label: "Occupied", value: stats.occupiedSeats, icon: "🔴", color: "text-orange-600" },
            { label: "Occupancy", value: `${stats.occupancyRate}%`, icon: "📊", color: "text-[#FF6A2F]" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col gap-1">
              <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">{stat.label}</span>
              <span className={`text-[22px] font-bold ${stat.color}`}>{stat.value}</span>
            </div>
          ))}
        </div>

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
            <FloorCardGrid floors={floorCards} />
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
        <LocationSidebar
          locations={locations}
          onLocationSelect={handleLocationSelect}
          onAddSubLocation={() => {
            if (selectedCenterId) {
              setShowFloorModal(true);
            } else {
              toast.info("Select a center first to add a floor");
            }
          }}
        />
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

      {/* Rename Floor dialog (replaces native prompt) */}
      {renameTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={closeRename}>
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            role="dialog" aria-modal="true"
          >
            <div className="px-6 py-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Rename floor</h2>
              <p className="text-sm text-gray-500 mt-1.5">Choose a new name for this floor.</p>
            </div>
            <div className="px-6 py-4">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Floor name</label>
              <input
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitRename();
                  if (e.key === "Escape") closeRename();
                }}
                autoFocus
                placeholder="Enter floor name"
                className="mt-1.5 w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A2F]/30 focus:border-[#FF6A2F]"
              />
            </div>
            <div className="px-6 py-4 flex justify-end gap-2 bg-gray-50">
              <button
                type="button"
                onClick={closeRename}
                disabled={actionPending}
                className="bg-white hover:bg-gray-100 text-gray-700 text-sm font-medium py-2 px-5 rounded-lg border border-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitRename}
                disabled={actionPending || !renameValue.trim()}
                className="bg-[#FF6A2F] hover:bg-[#E85A1F] text-white text-sm font-medium py-2 px-5 rounded-lg transition-colors disabled:opacity-50"
              >
                {actionPending ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={!!deleteTarget}
        title={`Delete floor "${deleteTarget?.name ?? ""}"?`}
        description="This will remove the floor and all its seats. This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={submitDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
