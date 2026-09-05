"use client";

/**
 * File:        apps/web/src/app/dashboard/crm/customers/[id]/seat-assign-modal.tsx
 * Module:      Web · CRM · Customer Detail · Seat Assign Modal
 * Purpose:     Enterprise seat picker for team members — renders the real
 *              floor map (seats positioned by x/y) with live occupancy:
 *              free seats are pickable, seats taken by teammates show the
 *              sitter, occupied/maintenance seats are blocked. Includes
 *              search, status filters with counts, and a floor selector.
 *
 * Author:      ZCode
 * Last-updated: 2026-09-05
 */

import { useMemo, useState } from "react";
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

const GRID = 44;

const TYPE_LABEL: Record<string, string> = {
  HOT_DESK: "Hot Desk",
  DEDICATED: "Dedicated",
  CABIN: "Cabin",
  MEETING_ROOM: "Meeting Room",
};

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

  const { data: floorsData, loading } = useQuery(GET_FLOORS, {
    variables: centerId ? { centerId } : undefined,
    skip: !centerId,
    fetchPolicy: "cache-and-network",
    errorPolicy: "all",
  });

  // seatId → teammate sitting there (excluding the member being edited
  // via currentSeatId comparison at render time).
  const takenBy = useMemo(() => {
    const map = new Map<string, string>();
    for (const emp of employees) {
      if (emp.seatId && emp.seatId !== currentSeatId) {
        map.set(emp.seatId, emp.name);
      }
    }
    return map;
  }, [employees, currentSeatId]);

  const allSeats: SeatAssignSeat[] = useMemo(() => {
    const list: SeatAssignSeat[] = [];
    for (const floor of floorsData?.floors ?? []) {
      for (const seat of floor.seats ?? []) {
        list.push({
          id: seat.id,
          name: seat.name,
          seatType: seat.seatType,
          status: seat.status,
          price: seat.price ?? null,
          floorId: floor.id,
          floorName: floor.name,
          x: seat.x ?? null,
          y: seat.y ?? null,
        });
      }
    }
    return list;
  }, [floorsData]);

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

  const q = search.trim().toLowerCase();
  const matches = (seat: SeatAssignSeat) => {
    if (!q) return true;
    return seat.name.toLowerCase().includes(q);
  };
  const passesFilter = (seat: SeatAssignSeat) => {
    if (filter === "ALL") return true;
    const st = seatState(seat);
    if (filter === "FREE") return st === "FREE" || st === "MINE";
    if (filter === "TAKEN") return st === "TAKEN";
    return st === "OCCUPIED" || st === "MAINTENANCE";
  };

  const pickedSeat = allSeats.find((s) => s.id === pickedId);

  const chipVisual: Record<string, { cls: string; label: string }> = {
    FREE: { cls: "sam-chip sam-free", label: "Free" },
    MINE: { cls: "sam-chip sam-mine", label: "Current" },
    TAKEN: { cls: "sam-chip sam-taken", label: "Teammate" },
    OCCUPIED: { cls: "sam-chip sam-occupied", label: "Occupied" },
    MAINTENANCE: { cls: "sam-chip sam-maintenance", label: "Maintenance" },
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
            <p className="sam-hint">Pick a free seat on the floor map — taken & blocked seats can&apos;t be selected</p>
          </div>
          <button type="button" className="sam-close" onClick={onClose} aria-label="Close">×</button>
        </header>

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

        <div className="sam-body">
          {loading ? (
            <div className="sam-empty">Loading floor map…</div>
          ) : allSeats.length === 0 ? (
            <div className="sam-empty">
              <p className="sam-empty-title">No seats in inventory</p>
              <p className="sam-empty-body">
                This center has no seats yet. Add floors &amp; seats in Inventory first.
              </p>
            </div>
          ) : (
            (floorsData?.floors ?? []).map((floor: any) => {
              const seats: SeatAssignSeat[] = (floor.seats ?? [])
                .map((s: any) => allSeats.find((a) => a.id === s.id)!)
                .filter(Boolean)
                .filter(matches)
                .filter(passesFilter);
              if (seats.length === 0) return null;
              const positioned = seats.filter((s) => s.x != null && s.y != null);
              const unpositioned = seats.filter((s) => s.x == null || s.y == null);
              const cols = Math.min(24, Math.max(10, ...positioned.map((s) => (s.x ?? 0) + 1)));
              const rows = Math.max(6, ...positioned.map((s) => (s.y ?? 0) + 1));
              return (
                <section key={floor.id} className="sam-floor">
                  <div className="sam-floor-head">
                    <h3 className="sam-floor-name">{floor.name}</h3>
                    <span className="sam-floor-count">{seats.length} seats</span>
                  </div>
                  <div className="sam-canvas-wrap">
                    {positioned.length > 0 && (
                      <div
                        className="sam-canvas"
                        style={{
                          width: cols * GRID,
                          height: rows * GRID,
                          backgroundSize: `${GRID}px ${GRID}px`,
                        }}
                      >
                        {positioned.map((seat) => {
                          const st = seatState(seat);
                          const v = chipVisual[st];
                          const picked = pickedId === seat.id;
                          const clickable = st === "FREE" || st === "MINE";
                          const sitter = st === "TAKEN" ? takenBy.get(seat.id) : undefined;
                          return (
                            <button
                              key={seat.id}
                              type="button"
                              disabled={!clickable}
                              className={`${v.cls} ${picked ? "sam-picked" : ""} ${clickable ? "sam-clickable" : ""}`}
                              style={{ left: (seat.x ?? 0) * GRID + 3, top: (seat.y ?? 0) * GRID + 3 }}
                              onClick={() => setPickedId(clickable ? seat.id : null)}
                              title={`${seat.name} · ${TYPE_LABEL[seat.seatType] ?? seat.seatType} · ${v.label}${sitter ? ` (${sitter})` : ""}${seat.price != null ? ` · ₹${seat.price}` : ""}`}
                            >
                              <span className="sam-dot" />
                              <span className="sam-seat-name">{seat.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {unpositioned.length > 0 && (
                      <div className="sam-flow">
                        {unpositioned.map((seat) => {
                          const st = seatState(seat);
                          const v = chipVisual[st];
                          const picked = pickedId === seat.id;
                          const clickable = st === "FREE" || st === "MINE";
                          const sitter = st === "TAKEN" ? takenBy.get(seat.id) : undefined;
                          return (
                            <button
                              key={seat.id}
                              type="button"
                              disabled={!clickable}
                              className={`${v.cls} ${v.cls}-flow ${picked ? "sam-picked" : ""} ${clickable ? "sam-clickable" : ""}`}
                              onClick={() => setPickedId(clickable ? seat.id : null)}
                              title={`${seat.name} · ${TYPE_LABEL[seat.seatType] ?? seat.seatType} · ${v.label}${sitter ? ` (${sitter})` : ""}`}
                            >
                              <span className="sam-dot" />
                              {seat.name}
                              {sitter ? <span className="sam-sitter">· {sitter.split(" ")[0]}</span> : null}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </section>
              );
            })
          )}
        </div>

        <div className="sam-legend">
          <span className="sam-legend-item"><span className="sam-dot sam-dot-free" /> Free</span>
          <span className="sam-legend-item"><span className="sam-dot sam-dot-mine" /> Current seat</span>
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
              <span className="sam-picked-meta">No seat selected</span>
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
