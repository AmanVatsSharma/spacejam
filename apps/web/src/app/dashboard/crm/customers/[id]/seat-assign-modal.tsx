"use client";

/**
 * File:        apps/web/src/app/dashboard/crm/customers/[id]/seat-assign-modal.tsx
 * Module:      Web · CRM · Customer Detail · Seat Assign Modal
 * Purpose:     Enterprise seat picker for team members. One floor visible at
 *              a time (floor tabs), canvas sized responsively to the modal
 *              width so chips stay large and easy to click. Live occupancy:
 *              free seats pickable, teammate seats show the sitter and are
 *              blocked, occupied/maintenance blocked. Search + status
 *              filters with counts, legend, confirm/unassign footer.
 *
 * Author:      ZCode
 * Last-updated: 2026-09-06
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@apollo/client";
import { GET_FLOORS } from "@/lib/apollo/operations";
import "./seat-assign-modal.css";

export interface SeatAssignSeat {
  id: string;
  name: string;
  seatType: string;
  status: string;
  price?: number | null;
  floorId: string;
  floorName: string;
  x?: number | null;
  y?: number | null;
}

interface SeatAssignModalProps {
  centerId?: string | null;
  /** All employees of the customer — used to mark seats taken by teammates. */
  employees: { id: string; name: string; seatId?: string | null }[];
  /** Seat currently assigned to the employee being edited (stays pickable). */
  currentSeatId?: string | null;
  memberName?: string;
  onClose: () => void;
  onPick: (seatId: string | null, seatName?: string) => void;
}

const TYPE_LABEL: Record<string, string> = {
  HOT_DESK: "Hot Desk",
  DEDICATED: "Dedicated",
  CABIN: "Cabin",
  MEETING_ROOM: "Meeting Room",
};

const MIN_CELL = 46;
const MAX_CELL = 84;

export function SeatAssignModal({
  centerId,
  employees,
  currentSeatId,
  memberName,
  onClose,
  onPick,
}: SeatAssignModalProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | "FREE" | "TAKEN" | "BLOCKED">("ALL");
  const [pickedId, setPickedId] = useState<string | null>(currentSeatId ?? null);
  const [activeFloorId, setActiveFloorId] = useState<string | null>(null);

  // Measure the canvas container so the grid scales with the modal width.
  const wrapRef = useRef<HTMLDivElement>(null);
  const [wrapWidth, setWrapWidth] = useState(880);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setWrapWidth(el.clientWidth || 880);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { data: floorsData, loading } = useQuery(GET_FLOORS, {
    variables: centerId ? { centerId } : undefined,
    skip: !centerId,
    fetchPolicy: "cache-and-network",
    errorPolicy: "all",
  });

  // seatId → teammate sitting there (the member being edited keeps their seat).
  const takenBy = useMemo(() => {
    const map = new Map<string, string>();
    for (const emp of employees) {
      if (emp.seatId && emp.seatId !== currentSeatId) {
        map.set(emp.seatId, emp.name);
      }
    }
    return map;
  }, [employees, currentSeatId]);

  const floors = useMemo<{ id: string; name: string; seats: SeatAssignSeat[] }[]>
    (() =>
      (floorsData?.floors ?? []).map((floor: any) => ({
        id: floor.id as string,
        name: floor.name as string,
        seats: (floor.seats ?? []).map((s: any) => ({
          id: s.id,
          name: s.name,
          seatType: s.seatType,
          status: s.status,
          price: s.price ?? null,
          floorId: floor.id,
          floorName: floor.name,
          x: s.x ?? null,
          y: s.y ?? null,
        })) as SeatAssignSeat[],
      })),
    [floorsData],
  );

  const allSeats = useMemo(() => floors.flatMap((f: { seats: SeatAssignSeat[] }) => f.seats), [floors]);

  const seatState = (seat: SeatAssignSeat): "FREE" | "TAKEN" | "OCCUPIED" | "MAINTENANCE" | "MINE" => {
    if (currentSeatId && seat.id === currentSeatId) return "MINE";
    if (takenBy.has(seat.id)) return "TAKEN";
    if (seat.status === "OCCUPIED" || seat.status === "RESERVED") return "OCCUPIED";
    if (seat.status === "MAINTENANCE") return "MAINTENANCE";
    return "FREE";
  };

  const counts = useMemo(() => {
    const c = { ALL: allSeats.length, FREE: 0, TAKEN: 0, BLOCKED: 0 };
    for (const seat of allSeats) {
      const st = seatState(seat);
      if (st === "FREE" || st === "MINE") c.FREE++;
      else if (st === "TAKEN") c.TAKEN++;
      else c.BLOCKED++;
    }
    return c;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allSeats, takenBy, currentSeatId]);

  // Default floor: the one holding the member's current seat, else the first.
  useEffect(() => {
    if (activeFloorId) return;
    if (floors.length === 0) return;
    const own = currentSeatId
      ? floors.find((f: any) => f.seats.some((s: SeatAssignSeat) => s.id === currentSeatId))
      : undefined;
    setActiveFloorId((own ?? floors[0]).id);
  }, [floors, currentSeatId, activeFloorId]);

  const q = search.trim().toLowerCase();
  const visibleInFloor = (seat: SeatAssignSeat) => {
    if (q && !seat.name.toLowerCase().includes(q)) return false;
    if (filter === "ALL") return true;
    const st = seatState(seat);
    if (filter === "FREE") return st === "FREE" || st === "MINE";
    if (filter === "TAKEN") return st === "TAKEN";
    return st === "OCCUPIED" || st === "MAINTENANCE";
  };

  const pickedSeat = allSeats.find((s) => s.id === pickedId);
  const activeFloor = floors.find((f: any) => f.id === activeFloorId) as
    | { id: string; name: string; seats: SeatAssignSeat[] }
    | undefined;

  const activeVisible = useMemo(
    () => (activeFloor?.seats ?? []).filter(visibleInFloor),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeFloor, q, filter, takenBy, currentSeatId],
  );
  const positioned = activeVisible.filter((s) => s.x != null && s.y != null);
  const unpositioned = activeVisible.filter((s) => s.x == null || s.y == null);
  const cols = Math.max(6, ...positioned.map((s) => (s.x ?? 0) + 1));
  const rows = Math.max(4, ...positioned.map((s) => (s.y ?? 0) + 1));
  // Responsive cell: fill the modal width, clamped for readability.
  const cell = Math.max(MIN_CELL, Math.min(MAX_CELL, Math.floor((wrapWidth - 24) / cols)));

  const stateVisual: Record<string, { cls: string; label: string }> = {
    FREE: { cls: "sam-free", label: "Free" },
    MINE: { cls: "sam-mine", label: "Current seat" },
    TAKEN: { cls: "sam-taken", label: "Teammate" },
    OCCUPIED: { cls: "sam-occupied", label: "Occupied" },
    MAINTENANCE: { cls: "sam-maintenance", label: "Maintenance" },
  };

  const renderSeat = (seat: SeatAssignSeat, flow: boolean) => {
    const st = seatState(seat);
    const v = stateVisual[st];
    const picked = pickedId === seat.id;
    const clickable = st === "FREE" || st === "MINE";
    const sitter = st === "TAKEN" ? takenBy.get(seat.id) : undefined;
    return (
      <button
        key={seat.id}
        type="button"
        disabled={!clickable}
        className={[
          "sam-chip",
          flow ? "sam-chip-flow" : "sam-chip-grid",
          v.cls,
          picked ? "sam-picked" : "",
          clickable ? "sam-clickable" : "",
        ].join(" ")}
        style={
          flow
            ? undefined
            : { left: (seat.x ?? 0) * cell + 4, top: (seat.y ?? 0) * cell + 4, width: cell - 8, height: cell - 8 }
        }
        onClick={() => clickable && setPickedId(seat.id)}
        title={`${seat.name} · ${TYPE_LABEL[seat.seatType] ?? seat.seatType} · ${v.label}${sitter ? ` (${sitter})` : ""}${seat.price != null ? ` · ₹${seat.price}` : ""}`}
      >
        <span className={`sam-dot sam-dot-${st.toLowerCase()}`} />
        <span className="sam-seat-name">{seat.name}</span>
        {sitter && !flow && cell >= 62 ? <span className="sam-sitter">{sitter.split(" ")[0]}</span> : null}
        {sitter && flow ? <span className="sam-sitter">{sitter.split(" ")[0]}</span> : null}
        {picked && <span className="sam-check" aria-hidden>✓</span>}
      </button>
    );
  };

  return (
    <div className="sam-backdrop" onClick={onClose}>
      <div className="sam-modal" onClick={(e) => e.stopPropagation()}>
        <header className="sam-header">
          <div>
            <h2 className="sam-title">
              Assign Seat
              {memberName ? <span className="sam-subtitle"> · {memberName}</span> : null}
            </h2>
            <p className="sam-hint">Pick a free seat — teammate &amp; blocked seats can&apos;t be selected</p>
          </div>
          <button type="button" className="sam-close" onClick={onClose} aria-label="Close">×</button>
        </header>

        {/* Search + status filters */}
        <div className="sam-toolbar">
          <input
            className="sam-search"
            placeholder="Search seat / cabin…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {([
            { key: "ALL", label: "All", n: counts.ALL },
            { key: "FREE", label: "Free", n: counts.FREE },
            { key: "TAKEN", label: "Teammates", n: counts.TAKEN },
            { key: "BLOCKED", label: "Blocked", n: counts.BLOCKED },
          ] as const).map((f) => (
            <button
              key={f.key}
              type="button"
              className={`sam-filter ${filter === f.key ? "sam-filter-active" : ""}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label} <span className="sam-count">{f.n}</span>
            </button>
          ))}
        </div>

        {/* Floor tabs */}
        {floors.length > 0 && (
          <div className="sam-floortabs" role="tablist">
            {floors.map((f: any) => {
              const active = f.id === activeFloorId;
              const free = f.seats.filter((s: SeatAssignSeat) => {
                const st = seatState(s);
                return st === "FREE" || st === "MINE";
              }).length;
              return (
                <button
                  key={f.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={`sam-floortab ${active ? "sam-floortab-active" : ""}`}
                  onClick={() => setActiveFloorId(f.id)}
                >
                  {f.name}
                  <span className={`sam-floortab-count ${free === 0 ? "sam-floortab-zero" : ""}`}>{free} free</span>
                </button>
              );
            })}
          </div>
        )}

        <div className="sam-body" ref={wrapRef}>
          {loading ? (
            <div className="sam-empty">Loading floor map…</div>
          ) : allSeats.length === 0 ? (
            <div className="sam-empty">
              <p className="sam-empty-title">No seats in inventory</p>
              <p className="sam-empty-body">This center has no seats yet. Add floors &amp; seats in Inventory first.</p>
            </div>
          ) : activeVisible.length === 0 ? (
            <div className="sam-empty">
              <p className="sam-empty-title">No seats match</p>
              <p className="sam-empty-body">Try another name or clear the status filter.</p>
            </div>
          ) : (
            <>
              {positioned.length > 0 && (
                <div
                  className="sam-canvas"
                  style={{
                    width: cols * cell,
                    height: rows * cell,
                    backgroundSize: `${cell}px ${cell}px`,
                  }}
                >
                  {positioned.map((s) => renderSeat(s, false))}
                </div>
              )}
              {unpositioned.length > 0 && (
                <div className="sam-flow">
                  <span className="sam-flow-label">Unplaced seats:</span>
                  {unpositioned.map((s) => renderSeat(s, true))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="sam-legend">
          <span className="sam-legend-item"><span className="sam-dot sam-dot-free" /> Free</span>
          <span className="sam-legend-item"><span className="sam-dot sam-dot-mine" /> Current</span>
          <span className="sam-legend-item"><span className="sam-dot sam-dot-taken" /> Teammate</span>
          <span className="sam-legend-item"><span className="sam-dot sam-dot-occupied" /> Occupied</span>
          <span className="sam-legend-item"><span className="sam-dot sam-dot-maintenance" /> Maintenance</span>
        </div>

        <footer className="sam-footer">
          <div className="sam-picked-info">
            {pickedSeat ? (
              <>
                <span className="sam-picked-chip">{pickedSeat.name}</span>
                <span className="sam-picked-meta">
                  {TYPE_LABEL[pickedSeat.seatType] ?? pickedSeat.seatType} · {pickedSeat.floorName}
                </span>
              </>
            ) : (
              <span className="sam-picked-meta">No seat selected — click a green seat</span>
            )}
          </div>
          <div className="sam-footer-actions">
            {currentSeatId ? (
              <button type="button" className="sam-btn sam-btn-danger" onClick={() => onPick(null)}>
                Unassign Seat
              </button>
            ) : null}
            <button type="button" className="sam-btn sam-btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="sam-btn sam-btn-primary"
              disabled={!pickedSeat}
              onClick={() => onPick(pickedSeat?.id ?? null, pickedSeat?.name)}
            >
              Confirm Assignment
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
