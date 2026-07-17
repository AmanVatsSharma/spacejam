"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@apollo/client";
import { toast } from "sonner";
import {
  GET_CENTERS,
  GET_FLOORS,
  GET_SEATS,
  GET_DASHBOARD_METRICS,
  CREATE_SEAT,
  UPDATE_SEAT,
} from "@/lib/apollo/operations";

function normalizeStatus(status: string): "AVAILABLE" | "OCCUPIED" | "MAINTENANCE" {
  const s = (status ?? "").toUpperCase();
  if (s === "AVAILABLE" || s === "FREE" || s === "OPEN") return "AVAILABLE";
  if (s === "MAINTENANCE" || s === "REPAIR" || s === "BLOCKED") return "MAINTENANCE";
  return "OCCUPIED";
}

function seatTypeLabel(type: string): string {
  const t = (type ?? "").toUpperCase();
  if (t === "HOT_DESK") return "Hot Desk";
  if (t === "DEDICATED") return "Dedicated";
  if (t === "CABIN") return "Cabin";
  return type || "Seat";
}

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  AVAILABLE: { bg: "#ECFDF5", text: "#059669", dot: "#10B981" },
  OCCUPIED: { bg: "#FEF2F2", text: "#DC2626", dot: "#EF4444" },
  MAINTENANCE: { bg: "#F3F4F6", text: "#6B7280", dot: "#9CA3AF" },
};

export default function FloorMapPage() {
  const router = useRouter();

  const [activeCenterId, setActiveCenterId] = useState<string | null>(null);
  const [activeFloorId, setActiveFloorId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedSeatId, setSelectedSeatId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  // Add space form state
  const [seatNumber, setSeatNumber] = useState("");
  const [seatType, setSeatType] = useState("HOT_DESK");
  const [seatPrice, setSeatPrice] = useState("");
  const [adding, setAdding] = useState(false);

  const { data: centersData, loading: centersLoading } = useQuery<{ centers: any[] }>(GET_CENTERS, {
    fetchPolicy: "cache-and-network", errorPolicy: "all",
  });
  const { data: floorsData, loading: floorsLoading } = useQuery<{ floors: any[] }>(GET_FLOORS, {
    fetchPolicy: "cache-and-network", errorPolicy: "all",
    variables: activeCenterId ? { centerId: activeCenterId } : {},
  });
  const { data: seatsData, loading: seatsLoading } = useQuery<{ seats: any[] }>(GET_SEATS, {
    fetchPolicy: "cache-and-network", errorPolicy: "all",
    variables: activeFloorId ? { floorId: activeFloorId } : {},
  });

  const [createSeat] = useMutation(CREATE_SEAT, {
    refetchQueries: [{ query: GET_SEATS }, { query: GET_FLOORS }],
  });
  const [updateSeat] = useMutation(UPDATE_SEAT, {
    refetchQueries: [{ query: GET_SEATS }],
  });

  const centers = centersData?.centers ?? [];
  const floors = floorsData?.floors ?? [];
  const seats = seatsData?.seats ?? [];

  // Auto-select first center
  useMemo(() => {
    if (activeCenterId === null && centers.length > 0) setActiveCenterId(centers[0].id);
  }, [centers, activeCenterId]);

  // Auto-select first floor
  useMemo(() => {
    if (floors.length > 0 && !activeFloorId) setActiveFloorId(floors[0].id);
    if (floors.length > 0 && activeFloorId && !floors.find((f: any) => f.id === activeFloorId)) {
      setActiveFloorId(floors[0].id);
    }
  }, [floors, activeFloorId]);

  const filteredSeats = useMemo(() => {
    let result = seats;
    if (activeFilter !== "All") result = result.filter((s: any) => normalizeStatus(s.status) === activeFilter.toUpperCase());
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((s: any) =>
        String(s.number ?? "").toLowerCase().includes(q) ||
        seatTypeLabel(s.seatType).toLowerCase().includes(q)
      );
    }
    return result;
  }, [seats, activeFilter, searchQuery]);

  const seatStats = useMemo(() => ({
    total: seats.length,
    available: seats.filter((s: any) => normalizeStatus(s.status) === "AVAILABLE").length,
    occupied: seats.filter((s: any) => normalizeStatus(s.status) === "OCCUPIED").length,
    maintenance: seats.filter((s: any) => normalizeStatus(s.status) === "MAINTENANCE").length,
  }), [seats]);

  const selectedSeat = seats.find((s: any) => s.id === selectedSeatId) ?? null;

  const handleAddSpace = async () => {
    if (!activeFloorId) { toast.error("Select a floor first"); return; }
    if (!seatNumber.trim()) { toast.error("Enter a space name/number"); return; }
    setAdding(true);
    try {
      await createSeat({
        variables: {
          input: {
            floorId: activeFloorId,
            number: seatNumber.trim(),
            seatType,
            status: "AVAILABLE",
            ...(seatPrice ? { price: Number(seatPrice) } : {}),
          },
        },
      });
      toast.success(`Space "${seatNumber}" added`);
      setSeatNumber(""); setSeatPrice(""); setShowAddModal(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add space");
    } finally {
      setAdding(false);
    }
  };

  const handleStatusChange = async (seatId: string, status: string) => {
    try {
      await updateSeat({ variables: { id: seatId, input: { status } } });
      toast.success(`Status changed to ${status.toLowerCase()}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  const isLoading = centersLoading || floorsLoading || seatsLoading;
  const activeFloor = floors.find((f: any) => f.id === activeFloorId);

  return (
    <div className="flex gap-5 w-full max-w-[1400px] mx-auto pb-6" style={{ minHeight: "calc(100vh - 140px)" }}>

      {/* LEFT — Main content (scrollable) */}
      <div className="flex-1 flex flex-col gap-5 min-w-0">

        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-[22px] font-bold text-gray-900">Floor Map</h1>
            <p className="text-[14px] text-gray-500 mt-0.5">Visualize spaces and manage occupancy</p>
          </div>
          <button
            onClick={() => activeFloorId ? setShowAddModal(true) : toast.error("Select a floor first")}
            className="flex items-center gap-2 bg-[#FF6A2F] text-white px-4 py-2.5 rounded-xl text-[14px] font-semibold hover:bg-[#E55A20] transition-all active:scale-[0.97] shadow-sm"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 3V13M3 8H13" /></svg>
            Add Space
          </button>
        </div>

        {/* Center + Floor selector */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 flex-wrap flex-shrink-0">
          <select
            value={activeCenterId ?? ""}
            onChange={(e) => { setActiveCenterId(e.target.value || null); setActiveFloorId(null); }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-[14px] text-gray-700 bg-gray-50 focus:outline-none focus:border-[#FF6A2F]"
          >
            <option value="">Select Center</option>
            {centers.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div className="flex gap-2 flex-wrap">
            {floors.map((floor: any) => (
              <button
                key={floor.id}
                onClick={() => setActiveFloorId(floor.id)}
                className={`px-4 py-2 rounded-lg text-[14px] font-medium transition-all ${activeFloorId === floor.id ? "bg-[#FF6A2F] text-white" : "bg-gray-50 text-gray-600 hover:bg-gray-100"}`}
              >
                {floor.name}
              </button>
            ))}
            {floors.length === 0 && !floorsLoading && (
              <span className="text-[14px] text-gray-400 py-2">No floors — add a center first</span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 flex-shrink-0">
          {[
            { label: "Total", value: seatStats.total, color: "text-gray-700" },
            { label: "Available", value: seatStats.available, color: "text-green-600" },
            { label: "Occupied", value: seatStats.occupied, color: "text-red-600" },
            { label: "Maintenance", value: seatStats.maintenance, color: "text-gray-400" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col gap-1">
              <span className="text-[11px] font-medium text-gray-400 uppercase">{s.label}</span>
              <span className={`text-[22px] font-bold ${s.color}`}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* Filter + Search */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <input
            type="text"
            placeholder="Search spaces..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[14px] focus:outline-none focus:border-[#FF6A2F]"
          />
          <div className="flex gap-2">
            {["All", "Available", "Occupied", "Maintenance"].map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${activeFilter === f ? "bg-[#FF6A2F] text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Floor Grid — scrollable seat cards */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex-1 overflow-y-auto" style={{ minHeight: "300px", maxHeight: "calc(100vh - 400px)" }}>
          {isLoading && seats.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-gray-400 text-[14px]">Loading floor data…</div>
          ) : !activeFloorId ? (
            <div className="flex items-center justify-center h-40 text-gray-400 text-[14px]">Select a center and floor to view spaces.</div>
          ) : filteredSeats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <span className="text-gray-400 text-[14px]">No spaces on this floor yet.</span>
              <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-[#FF6A2F] text-white rounded-lg text-[14px] font-medium hover:bg-[#E55A20]">Add First Space</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredSeats.map((seat: any) => {
                const status = normalizeStatus(seat.status);
                const colors = STATUS_COLORS[status];
                return (
                  <div
                    key={seat.id}
                    onClick={() => setSelectedSeatId(seat.id)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${selectedSeatId === seat.id ? "border-[#FF6A2F] shadow-md" : "border-gray-100"}`}
                    style={{ background: colors.bg }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[14px] font-bold text-gray-900">{seat.number}</span>
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: colors.dot }} />
                    </div>
                    <div className="text-[12px] text-gray-500 mb-1">{seatTypeLabel(seat.seatType)}</div>
                    <div className="text-[12px] font-medium" style={{ color: colors.text }}>{status}</div>
                    {seat.price != null && <div className="text-[12px] text-gray-400 mt-1">₹{seat.price}/mo</div>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT — Sticky details panel */}
      <div className="w-[300px] flex-shrink-0">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-4">
          {selectedSeat ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-[18px] font-bold text-gray-900">{selectedSeat.number}</h2>
                  <span className="text-[14px] text-gray-500">{seatTypeLabel(selectedSeat.seatType)}</span>
                </div>
                <span
                  className="px-2.5 py-1 rounded-full text-[12px] font-medium"
                  style={{ background: STATUS_COLORS[normalizeStatus(selectedSeat.status)].bg, color: STATUS_COLORS[normalizeStatus(selectedSeat.status)].text }}
                >
                  {normalizeStatus(selectedSeat.status)}
                </span>
              </div>

              <div className="flex flex-col gap-3 mb-5">
                {selectedSeat.price != null && (
                  <div className="flex justify-between"><span className="text-[14px] text-gray-500">Price</span><span className="text-[14px] font-medium text-gray-900">₹{selectedSeat.price}/mo</span></div>
                )}
                {selectedSeat.location && (
                  <div className="flex justify-between"><span className="text-[14px] text-gray-500">Location</span><span className="text-[14px] font-medium text-gray-900">{selectedSeat.location}</span></div>
                )}
                <div className="flex justify-between"><span className="text-[14px] text-gray-500">Floor</span><span className="text-[14px] font-medium text-gray-900">{activeFloor?.name ?? "—"}</span></div>
              </div>

              {/* Status changer */}
              <div className="flex flex-col gap-2 mb-4">
                <span className="text-[13px] font-medium text-gray-700">Change Status:</span>
                <div className="grid grid-cols-3 gap-2">
                  {["AVAILABLE", "OCCUPIED", "MAINTENANCE"].map(s => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(selectedSeat.id, s)}
                      className={`px-2 py-1.5 rounded-lg text-[12px] font-medium border transition-all ${normalizeStatus(selectedSeat.status) === s ? "border-[#FF6A2F] bg-[#FFF5F1] text-[#FF6A2F]" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                    >
                      {s === "AVAILABLE" ? "Available" : s === "OCCUPIED" ? "Occupied" : "Maint."}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => router.push("/dashboard/inventory/table-view")}
                className="w-full py-2.5 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg text-[14px] font-medium hover:bg-gray-100 transition-all"
              >
                View in Table
              </button>
            </>
          ) : (
            <>
              <h2 className="text-[18px] font-bold text-gray-900 mb-1">Space Details</h2>
              <p className="text-[14px] text-gray-400 mb-4">Click a space to see details</p>
              {activeFloor && (
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between"><span className="text-[14px] text-gray-500">Floor</span><span className="text-[14px] font-medium text-gray-900">{activeFloor.name}</span></div>
                  <div className="flex justify-between"><span className="text-[14px] text-gray-500">Spaces</span><span className="text-[14px] font-medium text-gray-900">{seatStats.total}</span></div>
                  <div className="flex justify-between"><span className="text-[14px] text-gray-500">Available</span><span className="text-[14px] font-medium text-green-600">{seatStats.available}</span></div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add Space Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm" onClick={() => setShowAddModal(false)}>
          <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-[18px] font-bold text-gray-900">Add Space</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" /></svg></button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-gray-700">Space Name / Number <span className="text-red-500">*</span></label>
                <input type="text" placeholder="e.g. A1, Cabin 3, Desk 12" value={seatNumber} onChange={(e) => setSeatNumber(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddSpace()} className="px-4 py-3 bg-gray-50 rounded-lg text-[14px] border border-transparent focus:border-[#FF6A2F] outline-none" autoFocus />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-gray-700">Type</label>
                <select value={seatType} onChange={(e) => setSeatType(e.target.value)} className="px-4 py-3 bg-gray-50 rounded-lg text-[14px] border border-transparent focus:border-[#FF6A2F] outline-none">
                  <option value="HOT_DESK">Hot Desk</option>
                  <option value="DEDICATED">Dedicated Desk</option>
                  <option value="CABIN">Cabin</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-gray-700">Monthly Price (₹)</label>
                <input type="number" placeholder="e.g. 5000" value={seatPrice} onChange={(e) => setSeatPrice(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddSpace()} className="px-4 py-3 bg-gray-50 rounded-lg text-[14px] border border-transparent focus:border-[#FF6A2F] outline-none" />
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
              <button onClick={() => setShowAddModal(false)} className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 text-[14px] font-medium rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleAddSpace} disabled={adding} className="px-5 py-2.5 bg-[#FF6A2F] text-white text-[14px] font-semibold rounded-lg hover:bg-[#E55A20] disabled:opacity-60">
                {adding ? "Adding…" : "Add Space"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
