"use client";

/**
 * File:        apps/web/src/app/dashboard/inventory/floor-map/page.tsx
 * Module:      Web · Dashboard · Floor Map Page
 * Purpose:     Visual floor map with real-time occupancy — wired to GraphQL
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-06
 */

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_CENTERS,
  GET_FLOORS,
  GET_SEATS,
  GET_DASHBOARD_METRICS,
  CREATE_SEAT,
  UPDATE_SEAT,
} from "@/lib/apollo/operations";
import styles from "./floor-map.module.css";

const Icons = {
  plus: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  ),
  search: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  ),
  filter: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
    </svg>
  ),
  chair: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 11v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8"></path>
      <path d="M5 11V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v6"></path>
      <line x1="2" y1="11" x2="22" y2="11"></line>
      <line x1="8" y1="21" x2="8" y2="23"></line>
      <line x1="16" y1="21" x2="16" y2="23"></line>
    </svg>
  ),
  circleCheck: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  ),
  target: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <circle cx="12" cy="12" r="6"></circle>
      <circle cx="12" cy="12" r="2"></circle>
    </svg>
  ),
  tools: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
    </svg>
  ),
  zoomIn: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      <line x1="11" y1="8" x2="11" y2="14"></line>
      <line x1="8" y1="11" x2="14" y2="11"></line>
    </svg>
  ),
  zoomOut: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      <line x1="8" y1="11" x2="14" y2="11"></line>
    </svg>
  ),
  calendar: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  )
};

// Normalize a seat status to one of our filter categories
function normalizeStatus(status: string): "AVAILABLE" | "OCCUPIED" | "MAINTENANCE" {
  const s = (status ?? "").toUpperCase();
  if (s === "AVAILABLE" || s === "FREE" || s === "OPEN") return "AVAILABLE";
  if (s === "MAINTENANCE" || s === "REPAIR" || s === "BLOCKED") return "MAINTENANCE";
  return "OCCUPIED";
}

// Map seat type to a display label
function seatTypeLabel(type: string): string {
  const t = (type ?? "").toUpperCase();
  if (t === "HOT_DESK" || t.includes("OPEN") || t.includes("DESK") || t.includes("HEXAGON")) return "Open Desk";
  if (t === "DEDICATED") return "Dedicated";
  if (t.includes("CABIN")) return "Cabin";
  if (t.includes("MEETING")) return "Meeting Room";
  return type || "Seat";
}

export default function FloorMapPage() {
  const router = useRouter();

  // Active center and floor selection
  const [activeCenterId, setActiveCenterId] = useState<string | null>(null);
  const [activeFloorId, setActiveFloorId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [selectedSeatId, setSelectedSeatId] = useState<string | null>(null);
  // Search queries and zoom for the floor map
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [mapSearch, setMapSearch] = useState<string>("");
  const [zoom, setZoom] = useState<number>(1);

  // Load centers to populate floor tabs
  const {
    data: centersData,
    loading: centersLoading,
  } = useQuery<{ centers: any[] }>(GET_CENTERS, {
    fetchPolicy: "cache-and-network",
    errorPolicy: "all",
  });

  // Load floors for the active center
  const {
    data: floorsData,
    loading: floorsLoading,
  } = useQuery<{ floors: any[] }>(GET_FLOORS, {
    fetchPolicy: "cache-and-network",
    errorPolicy: "all",
    variables: activeCenterId ? { centerId: activeCenterId } : {},
  });

  // Load seats for the active floor
  const {
    data: seatsData,
    loading: seatsLoading,
  } = useQuery<{ seats: any[] }>(GET_SEATS, {
    fetchPolicy: "cache-and-network",
    errorPolicy: "all",
    variables: activeFloorId ? { floorId: activeFloorId } : {},
  });

  // Load dashboard metrics for stat cards
  const {
    data: metricsData,
    loading: metricsLoading,
  } = useQuery<{ dashboardMetrics: any }>(GET_DASHBOARD_METRICS, {
    fetchPolicy: "cache-and-network",
    errorPolicy: "all",
    variables: activeCenterId ? { centerId: activeCenterId } : {},
  });

  // Mutations
  const [createSeat] = useMutation(CREATE_SEAT, {
    refetchQueries: [{ query: GET_SEATS }, { query: GET_FLOORS }],
  });

  const [updateSeat] = useMutation(UPDATE_SEAT, {
    refetchQueries: [{ query: GET_SEATS }, { query: GET_DASHBOARD_METRICS }],
  });

  // Derived data
  const floors = floorsData?.floors ?? [];
  const seats = seatsData?.seats ?? [];
  const metrics = metricsData?.dashboardMetrics;

  // Auto-select first floor when floors load
  const activeFloor = useMemo(
    () => floors.find((f: any) => f.id === activeFloorId) ?? floors[0] ?? null,
    [floors, activeFloorId]
  );

  // Auto-select first center when centers load
  const activeCenter = useMemo(
    () =>
      (centersData?.centers ?? []).find((c: any) => c.id === activeCenterId)
      ?? (centersData?.centers ?? [])[0]
      ?? null,
    [centersData, activeCenterId]
  );

  // Auto-select first floor when center changes or floors load
  useMemo(() => {
    if (floors.length > 0 && !activeFloorId) {
      setActiveFloorId(floors[0].id);
    }
  }, [floors, activeFloorId]);

  // Auto-select first center
  useMemo(() => {
    if (activeCenterId === null && centersData?.centers?.length) {
      setActiveCenterId(centersData.centers[0].id);
    }
  }, [centersData, activeCenterId]);

  // Filter seats by status + the left-bar search query
  const filteredSeats = useMemo(() => {
    let result = seats;
    if (activeFilter !== "All") {
      const normalized = activeFilter.toUpperCase();
      result = result.filter((s: any) => normalizeStatus(s.status) === normalized);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((s: any) =>
        String(s.number ?? "").toLowerCase().includes(q) ||
        seatTypeLabel(s.seatType).toLowerCase().includes(q) ||
        String(s.location ?? "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [seats, activeFilter, searchQuery]);

  // Seats actually rendered on the map (further narrowed by the map search box)
  const mapSeats = useMemo(() => {
    if (!mapSearch.trim()) return filteredSeats;
    const q = mapSearch.toLowerCase();
    return filteredSeats.filter((s: any) =>
      String(s.number ?? "").toLowerCase().includes(q) ||
      seatTypeLabel(s.seatType).toLowerCase().includes(q)
    );
  }, [filteredSeats, mapSearch]);

  // Zoom controls, clamped to [0.5, 2]
  const zoomIn = () => setZoom((z) => Math.min(2, +(z + 0.2).toFixed(2)));
  const zoomOut = () => setZoom((z) => Math.max(0.5, +(z - 0.2).toFixed(2)));

  const handleContinue = () => {
    router.push("/dashboard/inventory/table-view");
  };

  const handleViewDetails = (seatId: string | null) => {
    router.push("/dashboard/inventory/table-view");
    // seatId could be used to deep-link to a specific seat; table-view does not
    // yet accept a seat filter param, so we navigate to the list for now.
    if (seatId) void seatId;
  };

  // Stats from filtered seats (not dashboard metrics — those cover all centers)
  const seatStats = useMemo(() => {
    const total = seats.length;
    const available = seats.filter((s: any) => normalizeStatus(s.status) === "AVAILABLE").length;
    const occupied = seats.filter((s: any) => normalizeStatus(s.status) === "OCCUPIED").length;
    const maintenance = seats.filter((s: any) => normalizeStatus(s.status) === "MAINTENANCE").length;
    return { total, available, occupied, maintenance };
  }, [seats]);

  // Selected seat details
  const selectedSeat = useMemo(
    () => seats.find((s: any) => s.id === selectedSeatId) ?? null,
    [seats, selectedSeatId]
  );

  // Legend counts from filtered view
  const legendCounts = useMemo(() => {
    const all = seats.length;
    const available = seats.filter((s: any) => normalizeStatus(s.status) === "AVAILABLE").length;
    const occupied = seats.filter((s: any) => normalizeStatus(s.status) === "OCCUPIED").length;
    const maintenance = seats.filter((s: any) => normalizeStatus(s.status) === "MAINTENANCE").length;
    // Upcoming bookings per seat are not exposed by GET_SEATS. Intentionally 0
    // (do not fabricate) until a bookings-by-seat query is wired in.
    const upcoming = 0;
    return { all, available, occupied, maintenance, upcoming };
  }, [seats]);

  // Handle Add Space
  const handleAddSpace = async () => {
    if (!activeFloorId) return;
    try {
      await createSeat({
        variables: {
          input: {
            floorId: activeFloorId,
            number: `S-${Date.now().toString().slice(-5)}`,
            seatType: "HOT_DESK",
            status: "AVAILABLE",
          },
        },
      });
    } catch (err) {
      console.error("Failed to create seat:", err);
    }
  };

  // Handle Vacate / status change
  const handleVacate = async (seatId: string) => {
    try {
      await updateSeat({
        variables: {
          id: seatId,
          input: { status: "AVAILABLE" },
        },
      });
    } catch (err) {
      console.error("Failed to update seat:", err);
    }
  };

  const isLoading = centersLoading || floorsLoading || seatsLoading || metricsLoading;

  return (
    <div className={styles.page}>

      {/* LEFT COLUMN */}
      <div className={styles.leftCol}>

        {/* Header Card */}
        <div className={styles.headerCard}>
          <div className={styles.headerTitleWrap}>
            <h1 className={styles.headerTitle}>Floor Map</h1>
            <p className={styles.headerSubtitle}>Visualize space usage and real-time occupancy</p>
          </div>
          <button
            className={styles.addSpaceBtn + ' active:scale-[0.97] transition-transform duration-150'}
            onClick={handleAddSpace}
            disabled={!activeFloorId}
            title={!activeFloorId ? "Select a center and floor first" : "Add a new space"}
          >
            {Icons.plus} Add Space
          </button>
        </div>

        {/* Filter Bar */}
        <div className={styles.filterBar}>
          <div className={styles.searchBox}>
            <div className={styles.searchBoxIcon}>{Icons.search}</div>
            <input
              type="text"
              placeholder="Search seats, cabins, locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className={styles.filterPills}>
            {["All", "Available", "Occupied", "Maintenance"].map(filter => (
              <div
                key={filter}
                className={`${styles.filterPill} ${activeFilter === filter ? styles.filterPillActive : ''} active:scale-[0.97] transition-transform duration-150`}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </div>
            ))}
          </div>
        </div>

        {/* Stats Row */}
        <div className={styles.statsRow}>
          {metricsLoading && !metrics ? (
            <>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className={styles.statCard} style={{ animation: 'fadeInUp 0.4s ease-out forwards', opacity: 0, animationDelay: `${i * 60}ms` }}>
                  <div className={styles.statIcon}>{Icons.chair}</div>
                  <div className={styles.statValue}>—</div>
                  <div className={styles.statLabel}>Loading…</div>
                </div>
              ))}
            </>
          ) : metrics ? (
            <>
              <div className={styles.statCard} style={{ animation: 'fadeInUp 0.4s ease-out forwards', opacity: 0, animationDelay: '0ms' }}>
                <div className={styles.statIcon}>{Icons.chair}</div>
                <div className={styles.statValue}>
                  {metrics.totalSeats ?? seatStats.total}
                </div>
                <div className={styles.statLabel}>Total Seats</div>
              </div>
              <div className={styles.statCard} style={{ animation: 'fadeInUp 0.4s ease-out forwards', opacity: 0, animationDelay: '80ms' }}>
                <div className={styles.statIcon}>{Icons.circleCheck}</div>
                <div className={styles.statValue}>
                  {metrics.availableSeats ?? seatStats.available}
                </div>
                <div className={styles.statLabel}>Available</div>
              </div>
              <div className={styles.statCard} style={{ animation: 'fadeInUp 0.4s ease-out forwards', opacity: 0, animationDelay: '160ms' }}>
                <div className={styles.statIcon}>{Icons.target}</div>
                <div className={styles.statValue}>
                  {(metrics.totalSeats && metrics.availableSeats)
                    ? metrics.totalSeats - metrics.availableSeats
                    : seatStats.occupied}
                </div>
                <div className={styles.statLabel}>Occupied</div>
              </div>
              <div className={styles.statCard} style={{ animation: 'fadeInUp 0.4s ease-out forwards', opacity: 0, animationDelay: '240ms' }}>
                <div className={styles.statIcon}>{Icons.tools}</div>
                <div className={styles.statValue}>{seatStats.maintenance}</div>
                <div className={styles.statLabel}>Maintenance</div>
              </div>
            </>
          ) : (
            <>
              <div className={styles.statCard} style={{ animation: 'fadeInUp 0.4s ease-out forwards', opacity: 0, animationDelay: '0ms' }}>
                <div className={styles.statIcon}>{Icons.chair}</div>
                <div className={styles.statValue}>{seatStats.total}</div>
                <div className={styles.statLabel}>Total Seats</div>
              </div>
              <div className={styles.statCard} style={{ animation: 'fadeInUp 0.4s ease-out forwards', opacity: 0, animationDelay: '80ms' }}>
                <div className={styles.statIcon}>{Icons.circleCheck}</div>
                <div className={styles.statValue}>{seatStats.available}</div>
                <div className={styles.statLabel}>Available</div>
              </div>
              <div className={styles.statCard} style={{ animation: 'fadeInUp 0.4s ease-out forwards', opacity: 0, animationDelay: '160ms' }}>
                <div className={styles.statIcon}>{Icons.target}</div>
                <div className={styles.statValue}>{seatStats.occupied}</div>
                <div className={styles.statLabel}>Occupied</div>
              </div>
              <div className={styles.statCard} style={{ animation: 'fadeInUp 0.4s ease-out forwards', opacity: 0, animationDelay: '240ms' }}>
                <div className={styles.statIcon}>{Icons.tools}</div>
                <div className={styles.statValue}>{seatStats.maintenance}</div>
                <div className={styles.statLabel}>Maintenance</div>
              </div>
            </>
          )}
        </div>

        {/* Map Container */}
        <div className={styles.mapContainerCard}>

          {/* Floor Tabs — from server floors */}
          <div className={styles.floorTabsWrap}>
            {floorsLoading && floors.length === 0 ? (
              <div className={styles.floorTab}>Loading…</div>
            ) : floors.length === 0 ? (
              <div className={styles.floorTab}>No floors</div>
            ) : (
              floors.map((floor: any) => (
                <div
                  key={floor.id}
                  className={`${styles.floorTab} ${
                    (floor.id === activeFloorId || floor.id === activeFloor?.id)
                      ? styles.floorTabActive
                      : ""
                  }`}
                  onClick={() => setActiveFloorId(floor.id)}
                >
                  {floor.name ?? `Floor ${floor.id}`}
                </div>
              ))
            )}
          </div>

          <div className={styles.mapToolbar}>
            <div className={styles.mapToolbarLeft}>
              <div className={styles.mapSearch}>
                {Icons.search}
                <input
                  type="text"
                  placeholder="cabin 1B"
                  value={mapSearch}
                  onChange={(e) => setMapSearch(e.target.value)}
                />
              </div>
              <div className={styles.mapFilterIcon}>{Icons.filter}</div>

              <div className={styles.mapLegend}>
                <div className={styles.legendItem}>
                  <div className={styles.legendDot} style={{ background: '#FF7847' }}></div>
                  <span>All</span>
                  <span className={`${styles.legendCount} ${styles.legendCountActive}`}>
                    {legendCounts.all}
                  </span>
                </div>
                <div className={styles.legendItem}>
                  <div className={styles.legendDot} style={{ background: '#10B981' }}></div>
                  <span>Available</span>
                  <span className={styles.legendCount}>{legendCounts.available}</span>
                </div>
                <div className={styles.legendItem}>
                  <div className={styles.legendDot} style={{ background: '#EF4444' }}></div>
                  <span>Occupied</span>
                  <span className={styles.legendCount}>{legendCounts.occupied}</span>
                </div>
                <div className={styles.legendItem}>
                  <div className={styles.legendDot} style={{ background: '#6B7280' }}></div>
                  <span>Under Maintenance</span>
                  <span className={styles.legendCount}>{legendCounts.maintenance}</span>
                </div>
                <div className={styles.legendItem}>
                  <div className={styles.legendDot} style={{ background: '#F59E0B' }}></div>
                  <span>Upcoming</span>
                  <span className={styles.legendCount}>{legendCounts.upcoming}</span>
                </div>
              </div>
            </div>

            <div className={styles.mapToolbarRight}>
              <div className={styles.mapDatePicker}>
                {Icons.calendar}
                {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </div>
              <button
                className={styles.mapContinueBtn}
                onClick={handleContinue}
              >Continue</button>
            </div>
          </div>

          {/* Map Canvas */}
          <div className={styles.mapCanvas} style={{ transition: 'all 0.2s' }}>
            {isLoading && seats.length === 0 ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#9CA3AF", fontSize: "14px" }}>
                Loading floor data…
              </div>
            ) : filteredSeats.length === 0 && seats.length === 0 ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#9CA3AF", fontSize: "14px" }}>
                {activeFloorId
                  ? "No seats on this floor yet. Click \"Add Space\" to create one."
                  : "Select a center and floor to view the map."}
              </div>
            ) : (
              <div
                className={styles.floorGrid}
                style={{ transform: `scale(${zoom})`, transformOrigin: 'top center', transition: 'transform 0.2s ease-out' }}
              >
                {/* Open Seats area */}
                <div className={`${styles.roomBlock} ${styles.rOpenSeats} ${styles.bgGrey}`}>
                  <div className={styles.rHexagons}>
                    {Array.from({ length: Math.min(mapSeats.filter((s: any) => s.seatType?.toUpperCase().includes("HEXAGON") || s.seatType === "HOT_DESK").length, 4) }).map((_, i) => (
                      <div key={i} className={styles.hexagon}></div>
                    ))}
                  </div>
                  <div style={{ position: 'absolute', left: '70px', top: '40px', fontSize: '13px', color: '#1F2937' }}>
                    {mapSeats.filter((s: any) => s.seatType?.toUpperCase().includes("HEXAGON") || s.seatType === "HOT_DESK").length} Hexagon
                  </div>
                  <div style={{ position: 'absolute', right: '40px', top: '40px', fontSize: '13px', color: '#1F2937' }}>
                    {mapSeats.filter((s: any) => s.seatType === "HOT_DESK" || s.seatType === "DEDICATED" || s.seatType?.toUpperCase().includes("OPEN") || s.seatType?.toUpperCase().includes("DESK")).length} Open Seats
                  </div>
                  <div className={styles.rOpenSeatsBox}>
                    Open Seats
                  </div>
                </div>

                {/* Render each seat as a room card */}
                {mapSeats.map((seat: any, index: number) => {
                  const status = normalizeStatus(seat.status);
                  const statusColor: Record<string, string> = {
                    AVAILABLE: styles.roomGreen,
                    OCCUPIED: styles.roomRed,
                    MAINTENANCE: styles.roomGrey,
                  };
                  const statusText: Record<string, string> = {
                    AVAILABLE: "Available Now",
                    OCCUPIED: "Occupied",
                    MAINTENANCE: "Unavailable",
                  };
                  const colorClass = statusColor[status] ?? styles.roomOrange;

                  return (
                    <div
                      key={seat.id}
                      className={`${styles.roomBlock} ${colorClass} ${seat.id === selectedSeatId ? styles.roomActive : ''} active:scale-[0.95] transition-all duration-200`}
                      onClick={() => setSelectedSeatId(seat.id)}
                      style={{ cursor: "pointer", animation: 'fadeInUp 0.4s ease-out forwards', opacity: 0, animationDelay: `${index * 60}ms` }}
                    >
                      <div className={styles.roomHeader}>
                        <div className={styles.roomName}>
                          {seatTypeLabel(seat.seatType)} {seat.number ?? index + 1}
                        </div>
                        <div className={styles.roomDot}></div>
                      </div>
                      <div className={styles.roomCapacity}>
                        {Icons.chair} {seat.features?.length ?? 1}
                      </div>
                      <div className={styles.roomStatus}>{statusText[status]}</div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className={styles.zoomControls}>
              <button
                className={styles.zoomBtn}
                onClick={zoomIn}
                disabled={zoom >= 2}
                title="Zoom in"
              >{Icons.zoomIn}</button>
              <button
                className={styles.zoomBtn}
                onClick={zoomOut}
                disabled={zoom <= 0.5}
                title="Zoom out"
              >{Icons.zoomOut}</button>
            </div>
          </div>

        </div>

      </div>

      {/* RIGHT COLUMN */}
      <div className={styles.rightCol}>

        {selectedSeat ? (
          <>
            <div className={styles.panelHeader}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h2 className={styles.panelTitle}>
                  {seatTypeLabel(selectedSeat.seatType)} {selectedSeat.number ?? ""}
                </h2>
                <span className={styles.panelSubtitle}>{seatTypeLabel(selectedSeat.seatType)}</span>
              </div>
              <div className={styles.statusBadge}>
                <div className={styles.statusDot}></div>
                {normalizeStatus(selectedSeat.status) === "AVAILABLE"
                  ? "Available"
                  : normalizeStatus(selectedSeat.status) === "OCCUPIED"
                  ? "Occupied"
                  : "Maintenance"}
              </div>
            </div>

            <div className={styles.sectionBlock}>
              <span className={styles.sectionTitle}>Capacity</span>
              <span className={styles.sectionText}>
                {selectedSeat.features?.length ?? 1} seats
              </span>
            </div>

            {selectedSeat.price != null && (
              <div className={styles.sectionBlock}>
                <span className={styles.sectionTitle}>Pricing</span>
                <div className={styles.priceWrap}>
                  <span className={styles.priceText}>
                    {typeof selectedSeat.price === "number"
                      ? `₹${selectedSeat.price.toLocaleString("en-IN")}/month`
                      : selectedSeat.price}
                  </span>
                  <span className={styles.priceGst}>GST: 18%</span>
                </div>
              </div>
            )}

            {selectedSeat.features && selectedSeat.features.length > 0 && (
              <div className={styles.sectionBlock}>
                <span className={styles.sectionTitle}>Amenities</span>
                <div className={styles.amenityPills}>
                  {selectedSeat.features.map((feature: string, i: number) => (
                    <span key={i} className={styles.amenityPill}>{feature}</span>
                  ))}
                </div>
              </div>
            )}

            {selectedSeat.location && (
              <div className={styles.sectionBlock}>
                <span className={styles.sectionTitle}>Location</span>
                <span className={styles.sectionText}>{selectedSeat.location}</span>
              </div>
            )}

            <div className={styles.panelActions}>
              <button
                className={styles.btnSecondary}
                onClick={() => handleViewDetails(selectedSeat.id)}
              >View Details</button>
              {normalizeStatus(selectedSeat.status) !== "AVAILABLE" && (
                <button
                  className={styles.btnPrimary}
                  onClick={() => handleVacate(selectedSeat.id)}
                >
                  Vacate
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            <div className={styles.panelHeader}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h2 className={styles.panelTitle}>Select a Space</h2>
                <span className={styles.panelSubtitle}>Click on a room to see details</span>
              </div>
            </div>

            {activeFloor && (
              <div className={styles.sectionBlock}>
                <span className={styles.sectionTitle}>Floor</span>
                <span className={styles.sectionText}>{activeFloor.name ?? `Floor ${activeFloor.id}`}</span>
              </div>
            )}

            {activeCenter && (
              <div className={styles.sectionBlock}>
                <span className={styles.sectionTitle}>Center</span>
                <span className={styles.sectionText}>{activeCenter.name}</span>
              </div>
            )}

            <div className={styles.sectionBlock}>
              <span className={styles.sectionTitle}>Available Seats</span>
              <span className={styles.sectionText}>{seatStats.available}</span>
            </div>

            <div className={styles.sectionBlock}>
              <span className={styles.sectionTitle}>Occupied</span>
              <span className={styles.sectionText}>{seatStats.occupied}</span>
            </div>

            <div className={styles.sectionBlock}>
              <span className={styles.sectionTitle}>Maintenance</span>
              <span className={styles.sectionText}>{seatStats.maintenance}</span>
            </div>
          </>
        )}

      </div>

    </div>
  );
}
