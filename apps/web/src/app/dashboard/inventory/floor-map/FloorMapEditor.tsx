"use client";

/**
 * File:        apps/web/src/app/dashboard/inventory/floor-map/FloorMapEditor.tsx
 * Module:      Web · Dashboard · Floor Map Editor
 * Purpose:     Manual drag-and-drop layout editor — capacity-based cabin and
 *              facility zones, tray + bulk seat creation, rename/delete of
 *              seats, snap to grid, save via the parent's mutation callbacks.
 *              No external drag libraries; plain pointer events.
 *
 * Author:      ZCode
 * Last-updated: 2026-09-04
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./floor-map.module.css";

export const GRID = 40; // px per grid unit at zoom 1
export const CANVAS_COLS = 24;
export const CANVAS_ROWS = 16;

export type ZoneKind =
  | "CABIN_1"
  | "CABIN_2"
  | "CABIN_4"
  | "CABIN_6"
  | "MEETING_ROOM"
  | "PANTRY"
  | "WASHROOM"
  | "RECEPTION";

export interface ZoneSpec {
  /** Human label (also used as the default zone name). */
  label: string;
  /** Default footprint in grid units. */
  w: number;
  h: number;
  /** Seat capacity (0 = non-seatable facility zone). */
  capacity: number;
}

/** Zone catalog — default size + capacity per zone kind. */
export const ZONE_KIND_SPECS: Record<ZoneKind, ZoneSpec> = {
  CABIN_1: { label: "1-Seater Cabin", w: 1, h: 1, capacity: 1 },
  CABIN_2: { label: "2-Seater Cabin", w: 2, h: 1, capacity: 2 },
  CABIN_4: { label: "4-Seater Cabin", w: 2, h: 2, capacity: 4 },
  CABIN_6: { label: "6-Seater Cabin", w: 3, h: 2, capacity: 6 },
  MEETING_ROOM: { label: "Meeting Room", w: 4, h: 3, capacity: 6 },
  PANTRY: { label: "Pantry", w: 3, h: 2, capacity: 0 },
  WASHROOM: { label: "Washroom", w: 3, h: 2, capacity: 0 },
  RECEPTION: { label: "Reception", w: 3, h: 2, capacity: 0 },
};

/** Spec lookup tolerant of legacy kinds (e.g. old "CUSTOM" layouts). */
const specOf = (kind: string): ZoneSpec | undefined =>
  (ZONE_KIND_SPECS as Record<string, ZoneSpec | undefined>)[kind];

/** Capacity for a zone — meeting rooms scale with their resized area. */
export const zoneCapacity = (z: EditorZone): number => {
  if (z.kind === "MEETING_ROOM") return Math.max(2, Math.floor((z.w * z.h) / 2));
  return specOf(z.kind)?.capacity ?? 0;
};

/** Title shown inside a zone, e.g. "Meeting Room (6)". */
export const zoneDisplayTitle = (z: EditorZone): string =>
  z.kind === "MEETING_ROOM" ? `${z.label} (${zoneCapacity(z)})` : z.label;

export interface EditorZone {
  id: string;
  x: number; y: number; w: number; h: number;
  label: string;
  kind: ZoneKind;
  rotation?: number;
}
export interface EditorLabel { id: string; x: number; y: number; text: string; }
export interface EditorLayout { version: number; zones: EditorZone[]; labels: EditorLabel[]; }
export interface SeatLike {
  id: string; name: string; seatType?: string; status?: string;
  x?: number | null; y?: number | null;
  w?: number | null; h?: number | null; rotation?: number | null;
}
export interface SeatPosition { id: string; x: number; y: number; }
/** Full geometry override for a seat (position + size + rotation). */
export interface SeatGeometry extends SeatPosition { w: number; h: number; rotation: number; }

const SEAT_TYPE_OPTIONS = ["HOT_DESK", "DEDICATED", "CABIN", "MEETING_ROOM"] as const;

const seatTypeText = (t: string) =>
  t === "HOT_DESK" ? "Hot Desk"
  : t === "DEDICATED" ? "Dedicated Desk"
  : t === "CABIN" ? "Cabin"
  : t === "MEETING_ROOM" ? "Meeting Room"
  : t;

const newId = (p: string) => `${p}${Math.random().toString(36).slice(2, 9)}`;
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const svgIcon = (children: React.ReactNode) => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

const ICONS = {
  layers: svgIcon(
    <>
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </>
  ),
  tag: svgIcon(
    <>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.83z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </>
  ),
  seat: svgIcon(
    <>
      <path d="M5 11v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8" />
      <path d="M5 11V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v6" />
      <line x1="2" y1="11" x2="22" y2="11" />
      <line x1="8" y1="21" x2="8" y2="23" />
      <line x1="16" y1="21" x2="16" y2="23" />
    </>
  ),
  stack: svgIcon(
    <>
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </>
  ),
  grid: svgIcon(
    <>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </>
  ),
  zoomIn: svgIcon(
    <>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="11" y1="8" x2="11" y2="14" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </>
  ),
  zoomOut: svgIcon(
    <>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </>
  ),
  pencil: svgIcon(<path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />),
  trash: svgIcon(
    <>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </>
  ),
};

interface DragState {
  kind: "seat" | "seatResize" | "zone" | "zoneResize" | "rotate" | "label" | "chip";
  id: string;
  offX: number;
  offY: number;
  startX: number;
  startY: number;
  orig: { x: number; y: number; w?: number; h?: number };
  /** For "rotate": the item's screen-space center (canvas-relative px). */
  centerX?: number;
  centerY?: number;
  /** For "rotate": whether the target is a zone (vs a seat). */
  isZone?: boolean;
}

export function FloorMapEditor({
  floor,
  seats,
  onSaveLayout,
  saving,
  onCreateSeat,
  onDeleteSeat,
  onBulkCreateSeats,
  onRenameSeat,
}: {
  floor: { id: string; name: string; layout: EditorLayout | null };
  seats: SeatLike[];
  onSaveLayout: (layout: EditorLayout, seatPositions: SeatGeometry[]) => Promise<void>;
  saving: boolean;
  /** Create a single seat server-side (parent wires the mutation). */
  onCreateSeat?: (name: string, seatType: string) => Promise<void>;
  /** Delete a seat server-side. */
  onDeleteSeat?: (seatId: string) => Promise<void>;
  /** Create a batch of seats server-side. */
  onBulkCreateSeats?: (seats: { name: string; seatType: string }[]) => Promise<void>;
  /** Rename a seat server-side. */
  onRenameSeat?: (seatId: string, name: string) => Promise<void>;
}) {
  const serverLayout: EditorLayout = floor.layout ?? { version: 1, zones: [], labels: [] };
  const [zones, setZones] = useState<EditorZone[]>(serverLayout.zones);
  const [labels, setLabels] = useState<EditorLabel[]>(serverLayout.labels);
  // Local positions: undefined = untouched, {x,y} = set (null = removed)
  const [positions, setPositions] = useState<Record<string, { x: number; y: number } | null>>({});
  // Local size/rotation overrides: undefined = untouched.
  const [geoms, setGeoms] = useState<Record<string, { w: number; h: number; rotation: number }>>({});
  const [snap, setSnap] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkCount, setBulkCount] = useState(10);
  const [bulkPrefix, setBulkPrefix] = useState("D");
  const [bulkStart, setBulkStart] = useState(1);
  const [bulkSeparator, setBulkSeparator] = useState("-");
  const [bulkSeatType, setBulkSeatType] = useState<string>("HOT_DESK");
  const [seatBusy, setSeatBusy] = useState(false);
  const [generating, setGenerating] = useState(false);
  /** Grid cells promised to seats created via Add Seat / Bulk Add — keyed by
   *  name and applied locally once the parent refetch lands the new seats. */
  const pendingPlacementsRef = useRef<Record<string, { x: number; y: number }>>({});
  const dragRef = useRef<DragState | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);

  const seatPos = useCallback(
    (s: SeatLike) => (positions[s.id] !== undefined ? positions[s.id] : s.x != null && s.y != null ? { x: s.x, y: s.y } : null),
    [positions],
  );

  /** Effective size/rotation for a seat (override ?? server ?? default). */
  const seatGeom = useCallback(
    (s: SeatLike) =>
      geoms[s.id] ?? {
        w: s.w ?? 1,
        h: s.h ?? 1,
        rotation: s.rotation ?? 0,
      },
    [geoms],
  );

  const placed = useMemo(() => seats.filter((s) => seatPos(s)), [seats, seatPos]);
  const tray = useMemo(() => seats.filter((s) => !seatPos(s)), [seats, seatPos]);

  const selectedSeat = useMemo(() => seats.find((s) => s.id === selected) ?? null, [seats, selected]);
  const selectedZone = useMemo(() => zones.find((z) => z.id === selected) ?? null, [zones, selected]);
  const selectedTextLabel = useMemo(() => labels.find((l) => l.id === selected) ?? null, [labels, selected]);
  const selectedName =
    selectedSeat?.name ?? selectedZone?.label ?? selectedTextLabel?.text ?? null;

  const dirty =
    JSON.stringify(zones) !== JSON.stringify(serverLayout.zones) ||
    JSON.stringify(labels) !== JSON.stringify(serverLayout.labels) ||
    Object.keys(positions).length > 0 ||
    Object.keys(geoms).length > 0;

  // When the parent refetches seats (create/delete/rename), apply pending
  // placements for freshly created seats and drop local state for removed ones.
  useEffect(() => {
    const ids = new Set(seats.map((s) => s.id));
    setPositions((p) => {
      let changed = false;
      const next: Record<string, { x: number; y: number } | null> = {};
      for (const [k, v] of Object.entries(p)) {
        if (ids.has(k)) next[k] = v;
        else changed = true;
      }
      return changed ? next : p;
    });
    setGeoms((g) => {
      let changed = false;
      const next: Record<string, { w: number; h: number; rotation: number }> = {};
      for (const [k, v] of Object.entries(g)) {
        if (ids.has(k)) next[k] = v;
        else changed = true;
      }
      return changed ? next : g;
    });

    const pend = pendingPlacementsRef.current;
    const toApply: Record<string, { x: number; y: number }> = {};
    for (const s of seats) {
      const pending = pend[s.name];
      if (pending) {
        toApply[s.id] = pending;
        delete pend[s.name];
      }
    }
    if (Object.keys(toApply).length > 0) setPositions((p) => ({ ...p, ...toApply }));
  }, [seats]);

  /** First N free grid cells (row-major) not occupied by placed seats. */
  const findFreeSeatPositions = useCallback(
    (count: number): { x: number; y: number }[] => {
      const occupied = new Set<string>();
      for (const s of placed) {
        const pos = seatPos(s)!;
        const g = seatGeom(s);
        for (let dx = 0; dx < Math.max(1, Math.round(g.w)); dx++) {
          for (let dy = 0; dy < Math.max(1, Math.round(g.h)); dy++) {
            occupied.add(`${pos.x + dx},${pos.y + dy}`);
          }
        }
      }
      const out: { x: number; y: number }[] = [];
      for (let y = 0; y < CANVAS_ROWS && out.length < count; y++) {
        for (let x = 0; x < CANVAS_COLS && out.length < count; x++) {
          const key = `${x},${y}`;
          if (!occupied.has(key)) {
            occupied.add(key);
            out.push({ x, y });
          }
        }
      }
      return out;
    },
    [placed, seatPos, seatGeom],
  );

  /** Top-left position (row-major scan) where a w×h zone fits without
   *  overlapping existing zones and stays inside the canvas. */
  const findZoneFreePos = useCallback(
    (w: number, h: number): { x: number; y: number } => {
      const fits = (x: number, y: number) =>
        x + w <= CANVAS_COLS &&
        y + h <= CANVAS_ROWS &&
        !zones.some((z) => x < z.x + z.w && x + w > z.x && y < z.y + z.h && y + h > z.y);
      for (let y = 0; y <= CANVAS_ROWS - h; y++) {
        for (let x = 0; x <= CANVAS_COLS - w; x++) {
          if (fits(x, y)) return { x, y };
        }
      }
      return { x: 1, y: 1 };
    },
    [zones],
  );

  const toGrid = (e: PointerEvent | React.PointerEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const gx = (e.clientX - rect.left) / (GRID * zoom);
    const gy = (e.clientY - rect.top) / (GRID * zoom);
    return {
      x: snap ? clamp(Math.round(gx), 0, CANVAS_COLS - 1) : clamp(gx, 0, CANVAS_COLS - 1),
      y: snap ? clamp(Math.round(gy), 0, CANVAS_ROWS - 1) : clamp(gy, 0, CANVAS_ROWS - 1),
    };
  };

  const onItemPointerDown = (
    e: React.PointerEvent,
    kind: DragState["kind"],
    id: string,
    orig: DragState["orig"],
  ) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // Capture is best-effort — moves also bubble to the canvas handler.
    }
    const g = toGrid(e);
    dragRef.current = { kind, id, offX: g.x - orig.x, offY: g.y - orig.y, startX: g.x, startY: g.y, orig };
    setSelected(id);
  };

  /**
   * Begin rotating an item (seat or zone). The handle sits at the top of
   * the box; 0° = handle pointing up. The item's screen-space center is
   * computed from grid geometry so rotation works at any zoom.
   */
  const onRotatePointerDown = (
    e: React.PointerEvent,
    id: string,
    isZone: boolean,
    orig: { x: number; y: number; w: number; h: number },
  ) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      /* best-effort */
    }
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    const centerX = canvasRect ? canvasRect.left + (orig.x + orig.w / 2) * GRID * zoom : 0;
    const centerY = canvasRect ? canvasRect.top + (orig.y + orig.h / 2) * GRID * zoom : 0;
    dragRef.current = {
      kind: "rotate",
      id,
      offX: 0,
      offY: 0,
      startX: 0,
      startY: 0,
      orig,
      centerX,
      centerY,
      isZone,
    };
    setSelected(id);
  };

  /** Pointer angle around the item center, normalized to [0, 360). */
  const angleFromCenter = (d: DragState, e: React.PointerEvent): number => {
    const deg = (Math.atan2(e.clientY - (d.centerY ?? 0), e.clientX - (d.centerX ?? 0)) * 180) / Math.PI + 90;
    let norm = Math.round(((deg % 360) + 360) % 360);
    if (snap) norm = Math.round(norm / 15) * 15 % 360;
    return norm;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;

    if (d.kind === "chip") {
      // The chip element owns pointer capture; once the pointer is inside
      // the canvas, place the seat live at the cursor position.
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect && e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
        const g = toGrid(e);
        setPositions((p) => ({ ...p, [d.id]: { x: g.x, y: g.y } }));
      }
      return;
    }

    const g = toGrid(e);
    if (d.kind === "seat") {
      setPositions((p) => ({ ...p, [d.id]: { x: clamp(g.x - d.offX, 0, CANVAS_COLS - 1), y: clamp(g.y - d.offY, 0, CANVAS_ROWS - 1) } }));
    } else if (d.kind === "zone" || d.kind === "label") {
      // Keep the whole item inside the canvas (zones account for footprint).
      const bw = d.kind === "zone" ? Math.max(1, d.orig.w ?? 1) : 1;
      const bh = d.kind === "zone" ? Math.max(1, d.orig.h ?? 1) : 1;
      const nx = clamp(g.x - d.offX, 0, Math.max(0, CANVAS_COLS - bw));
      const ny = clamp(g.y - d.offY, 0, Math.max(0, CANVAS_ROWS - bh));
      if (d.kind === "zone") setZones((zs) => zs.map((z) => (z.id === d.id ? { ...z, x: nx, y: ny } : z)));
      else setLabels((ls) => ls.map((l) => (l.id === d.id ? { ...l, x: nx, y: ny } : l)));
    } else if (d.kind === "zoneResize") {
      const w = clamp(Math.round(g.x - d.orig.x + (d.orig.w ?? 1)), 1, CANVAS_COLS - d.orig.x);
      const h = clamp(Math.round(g.y - d.orig.y + (d.orig.h ?? 1)), 1, CANVAS_ROWS - d.orig.y);
      setZones((zs) => zs.map((z) => (z.id === d.id ? { ...z, w, h } : z)));
    } else if (d.kind === "seatResize") {
      const w = clamp(Math.round(g.x - d.orig.x + (d.orig.w ?? 1)), 1, CANVAS_COLS - d.orig.x);
      const h = clamp(Math.round(g.y - d.orig.y + (d.orig.h ?? 1)), 1, CANVAS_ROWS - d.orig.y);
      setGeoms((gs) => ({
        ...gs,
        [d.id]: { ...(gs[d.id] ?? { w: d.orig.w ?? 1, h: d.orig.h ?? 1, rotation: 0 }), w, h },
      }));
    } else if (d.kind === "rotate") {
      const angle = angleFromCenter(d, e);
      if (d.isZone) {
        setZones((zs) => zs.map((z) => (z.id === d.id ? { ...z, rotation: angle } : z)));
      } else {
        setGeoms((gs) => ({
          ...gs,
          [d.id]: { ...(gs[d.id] ?? { w: d.orig.w ?? 1, h: d.orig.h ?? 1, rotation: 0 }), rotation: angle },
        }));
      }
    }
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  /** Add a zone at the first free spot, sized to its kind's default. */
  const addZone = (kind: ZoneKind) => {
    const spec = ZONE_KIND_SPECS[kind];
    const pos = findZoneFreePos(spec.w, spec.h);
    setZones((zs) => [
      ...zs,
      { id: newId("z"), x: pos.x, y: pos.y, w: spec.w, h: spec.h, label: spec.label, kind },
    ]);
  };
  const addLabel = () => {
    setLabels((ls) => [...ls, { id: newId("l"), x: 2, y: 2, text: "Label" }]);
  };

  /** Create one seat server-side and pre-place it at the first free cell. */
  const addSeat = async () => {
    if (!onCreateSeat || seatBusy) return;
    const existing = new Set(seats.map((s) => s.name));
    let n = seats.length + 1;
    while (existing.has(`Seat ${n}`)) n++;
    const name = `Seat ${n}`;
    const [pos] = findFreeSeatPositions(1);
    if (pos) pendingPlacementsRef.current[name] = pos;
    setSeatBusy(true);
    try {
      await onCreateSeat(name, "HOT_DESK");
    } finally {
      setSeatBusy(false);
    }
  };

  const bulkCountSafe = clamp(Math.round(bulkCount) || 1, 1, 50);
  const bulkNames = useMemo(
    () =>
      Array.from({ length: bulkCountSafe }, (_, i) =>
        `${bulkPrefix}${bulkSeparator}${bulkStart + i}`,
      ),
    [bulkCountSafe, bulkPrefix, bulkSeparator, bulkStart],
  );
  const bulkPreviewText =
    bulkNames.length > 3 ? `${bulkNames.slice(0, 3).join(", ")}, …` : bulkNames.join(", ");

  /** Generate the batch — each seat pre-placed at consecutive free cells. */
  const generateBulkSeats = async () => {
    if (!onBulkCreateSeats || generating) return;
    const list = bulkNames.map((name) => ({ name, seatType: bulkSeatType }));
    const free = findFreeSeatPositions(list.length);
    list.forEach((s, i) => {
      if (free[i]) pendingPlacementsRef.current[s.name] = free[i];
    });
    setGenerating(true);
    try {
      await onBulkCreateSeats(list);
      setBulkOpen(false);
    } finally {
      setGenerating(false);
    }
  };

  /** Remove the selected zone/label from the local layout. */
  const deleteSelected = () => {
    if (!selected) return;
    setZones((zs) => zs.filter((z) => z.id !== selected));
    setLabels((ls) => ls.filter((l) => l.id !== selected));
    setSelected(null);
  };

  /** Delete the selected seat server-side. */
  const deleteSelectedSeat = async () => {
    if (!selectedSeat || !onDeleteSeat) return;
    try {
      await onDeleteSeat(selectedSeat.id);
    } finally {
      setSelected(null);
    }
  };

  /** Rename the selected seat server-side. */
  const renameSelectedSeat = async () => {
    if (!selectedSeat || !onRenameSeat) return;
    const next = window.prompt("Seat name", selectedSeat.name);
    if (next == null || !next.trim() || next.trim() === selectedSeat.name) return;
    await onRenameSeat(selectedSeat.id, next.trim().slice(0, 60));
  };

  const handleSave = async () => {
    const layout: EditorLayout = { version: serverLayout.version + 1, zones, labels };
    const seatPositions: SeatGeometry[] = [];
    for (const s of seats) {
      const pos = positions[s.id];
      const geom = geoms[s.id];
      if (pos || geom) {
        const base = seatGeom(s);
        seatPositions.push({
          id: s.id,
          x: pos?.x ?? s.x ?? 0,
          y: pos?.y ?? s.y ?? 0,
          w: geom?.w ?? base.w,
          h: geom?.h ?? base.h,
          rotation: geom?.rotation ?? base.rotation,
        });
      }
    }
    await onSaveLayout(layout, seatPositions);
    setPositions({});
    setGeoms({});
  };

  const zoomIn = () => setZoom((z) => clamp(Math.round((z + 0.1) * 10) / 10, 0.5, 2));
  const zoomOut = () => setZoom((z) => clamp(Math.round((z - 0.1) * 10) / 10, 0.5, 2));

  return (
    <div className={styles.editorWrap}>
      <div className={styles.editorToolbar}>
        <span className={styles.editorTitle} title={`Floor: ${floor.name}`}>
          Editing: {floor.name}
        </span>

        <select
          aria-label="Add zone"
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) {
              addZone(e.target.value as ZoneKind);
              e.target.value = "";
            }
          }}
          className={styles.editorSelect}
          title="Add a zone with its default size and capacity"
        >
          <option value="">＋ Add Zone…</option>
          {(Object.keys(ZONE_KIND_SPECS) as ZoneKind[]).map((k) => {
            const spec = ZONE_KIND_SPECS[k];
            return (
              <option key={k} value={k}>
                {spec.label} ({spec.w}×{spec.h})
              </option>
            );
          })}
        </select>

        <button
          type="button"
          className={styles.editorBtn}
          onClick={addLabel}
          title="Add a movable text label"
        >
          {ICONS.tag} Label
        </button>
        <button
          type="button"
          className={styles.editorBtn}
          onClick={addSeat}
          disabled={!onCreateSeat || seatBusy}
          title={
            onCreateSeat
              ? "Create a seat and place it at the first free grid cell"
              : "Seat creation is not available"
          }
        >
          {ICONS.seat} {seatBusy ? "Adding…" : "Add Seat"}
        </button>
        <button
          type="button"
          className={`${styles.editorBtn} ${bulkOpen ? styles.editorBtnActive : ""}`}
          onClick={() => setBulkOpen((v) => !v)}
          disabled={!onBulkCreateSeats}
          title={
            onBulkCreateSeats
              ? "Generate a numbered batch of seats (e.g. D-1, D-2, …)"
              : "Bulk creation is not available"
          }
        >
          {ICONS.stack} Bulk Add Seats
        </button>

        <div className={styles.editorToolbarGroup}>
          <button
            type="button"
            className={`${styles.editorIconBtn} ${snap ? styles.editorIconBtnActive : ""}`}
            onClick={() => setSnap((v) => !v)}
            title={snap ? "Snap to grid: ON (click to disable)" : "Snap to grid: OFF (click to enable)"}
          >
            {ICONS.grid}
          </button>
          <button type="button" className={styles.editorIconBtn} onClick={zoomOut} title="Zoom out">
            {ICONS.zoomOut}
          </button>
          <span className={styles.editorZoom}>{Math.round(zoom * 100)}%</span>
          <button type="button" className={styles.editorIconBtn} onClick={zoomIn} title="Zoom in">
            {ICONS.zoomIn}
          </button>
        </div>

        {selectedName && (
          <div className={styles.editorToolbarGroup}>
            <span className={styles.editorSelectedInfo} title={selectedName}>
              <span className={styles.selectedInfoDot} />
              <span className={styles.editorSelectedInfoName}>{selectedName}</span>
            </span>
            {selectedSeat && (
              <button
                type="button"
                className={styles.editorBtn}
                onClick={renameSelectedSeat}
                disabled={!onRenameSeat}
                title={onRenameSeat ? "Rename the selected seat" : "Renaming is not available"}
              >
                {ICONS.pencil} Rename
              </button>
            )}
            <button
              type="button"
              className={styles.editorBtnDanger}
              onClick={selectedSeat ? deleteSelectedSeat : deleteSelected}
              disabled={!!selectedSeat && !onDeleteSeat}
              title={
                selectedSeat
                  ? onDeleteSeat
                    ? "Delete the selected seat permanently"
                    : "Deletion is not available"
                  : "Remove the selected zone or label"
              }
            >
              {ICONS.trash} {selectedSeat ? "Delete Seat" : "Delete"}
            </button>
          </div>
        )}

        <span className={styles.editorDirty}>{dirty ? "● unsaved changes" : "no changes"}</span>
        <div className={styles.editorToolbarRight}>
          <button type="button" className={styles.editorSave} disabled={!dirty || saving} onClick={handleSave}>
            {saving ? "Saving…" : "Save Layout"}
          </button>
        </div>
      </div>

      {bulkOpen && (
        <div className={styles.bulkPanel}>
          <div className={styles.bulkField}>
            <label className={styles.bulkFieldLabel} htmlFor="bulk-count">Count</label>
            <input
              id="bulk-count"
              className={styles.bulkInput}
              style={{ width: 72 }}
              type="number"
              min={1}
              max={50}
              value={bulkCount}
              onChange={(e) => setBulkCount(clamp(Number(e.target.value) || 1, 1, 50))}
            />
          </div>
          <div className={styles.bulkField}>
            <label className={styles.bulkFieldLabel} htmlFor="bulk-prefix">Prefix</label>
            <input
              id="bulk-prefix"
              className={styles.bulkInput}
              style={{ width: 84 }}
              type="text"
              maxLength={12}
              placeholder="D"
              value={bulkPrefix}
              onChange={(e) => setBulkPrefix(e.target.value)}
            />
          </div>
          <div className={styles.bulkField}>
            <label className={styles.bulkFieldLabel} htmlFor="bulk-start">Start №</label>
            <input
              id="bulk-start"
              className={styles.bulkInput}
              style={{ width: 72 }}
              type="number"
              min={0}
              value={bulkStart}
              onChange={(e) => setBulkStart(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
            />
          </div>
          <div className={styles.bulkField}>
            <label className={styles.bulkFieldLabel} htmlFor="bulk-sep">Separator</label>
            <input
              id="bulk-sep"
              className={styles.bulkInput}
              style={{ width: 64 }}
              type="text"
              maxLength={4}
              value={bulkSeparator}
              onChange={(e) => setBulkSeparator(e.target.value)}
            />
          </div>
          <div className={styles.bulkField}>
            <label className={styles.bulkFieldLabel} htmlFor="bulk-type">Seat type</label>
            <select
              id="bulk-type"
              className={styles.bulkSelect}
              value={bulkSeatType}
              onChange={(e) => setBulkSeatType(e.target.value)}
            >
              {SEAT_TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>{seatTypeText(t)}</option>
              ))}
            </select>
          </div>
          <span className={styles.bulkPreview} title={bulkNames.join(", ")}>
            {bulkPreviewText}
          </span>
          <div className={styles.bulkActions}>
            <button
              type="button"
              className={styles.editorBtn}
              onClick={() => setBulkOpen(false)}
              title="Close the bulk panel"
            >
              Cancel
            </button>
            <button
              type="button"
              className={styles.editorSave}
              onClick={generateBulkSeats}
              disabled={generating}
              title={`Create ${bulkCountSafe} seat${bulkCountSafe === 1 ? "" : "s"} on this floor`}
            >
              {generating ? "Creating…" : "Generate"}
            </button>
          </div>
        </div>
      )}

      <div className={styles.editorBody}>
        <div className={styles.editorTray}>
          <p className={styles.trayTitle}>Seats not on map ({tray.length})</p>
          <div className={styles.trayChips}>
            {tray.length === 0 && <span className={styles.trayEmpty}>All seats placed ✓</span>}
            {tray.map((s) => (
              <div
                key={s.id}
                className={styles.trayChip}
                title="Drag onto the map"
                onPointerDown={(e) => {
                  e.preventDefault();
                  try {
                    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                  } catch {
                    /* best-effort */
                  }
                  dragRef.current = { kind: "chip", id: s.id, offX: 0, offY: 0, startX: 0, startY: 0, orig: { x: 0, y: 0 } };
                  setSelected(null);
                }}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
              >
                {s.name}
              </div>
            ))}
          </div>
          <p className={styles.trayHint}>Drag a chip onto the grid to place the seat.</p>
        </div>

        <div className={styles.editorCanvasOuter}>
          <div
            ref={canvasRef}
            className={styles.editorCanvas}
            style={{
              width: CANVAS_COLS * GRID * zoom,
              height: CANVAS_ROWS * GRID * zoom,
              backgroundImage:
                "linear-gradient(#F3F4F6 1px, transparent 1px), linear-gradient(90deg, #F3F4F6 1px, transparent 1px)",
              backgroundSize: `${GRID * zoom}px ${GRID * zoom}px`,
            }}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
          >
            {zones.map((z) => {
              const zoneStyle = (styles as any)[`zone_${z.kind}`] ?? "";
              const cap = zoneCapacity(z);
              return (
                <div
                  key={z.id}
                  className={`${styles.editorZone} ${zoneStyle} ${selected === z.id ? styles.editorSelected : ""}`}
                  style={{
                    left: z.x * GRID * zoom,
                    top: z.y * GRID * zoom,
                    width: z.w * GRID * zoom,
                    height: z.h * GRID * zoom,
                    fontSize: `${12 * zoom}px`,
                    transform: z.rotation ? `rotate(${z.rotation}deg)` : undefined,
                  }}
                  onPointerDown={(e) => onItemPointerDown(e, "zone", z.id, { x: z.x, y: z.y, w: z.w, h: z.h })}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onDoubleClick={() => {
                    const next = window.prompt("Zone name", z.label);
                    if (next != null)
                      setZones((zs) => zs.map((zz) => (zz.id === z.id ? { ...zz, label: next.slice(0, 80) } : zz)));
                  }}
                >
                  {selected === z.id && <span className={styles.selectedBadge}>{z.label}</span>}
                  <span className={styles.zoneLabel}>{zoneDisplayTitle(z)}</span>
                  {cap > 0 && (
                    <span className={styles.zoneCapacity} title="Capacity">
                      {cap} {cap === 1 ? "seat" : "seats"}
                    </span>
                  )}
                  <span
                    className={styles.zoneResizeHandle}
                    onPointerDown={(e) =>
                      onItemPointerDown(e, "zoneResize", z.id, { x: z.x, y: z.y, w: z.w, h: z.h })
                    }
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                  />
                  <span
                    className={styles.rotateHandle}
                    title="Drag to rotate"
                    onPointerDown={(e) =>
                      onRotatePointerDown(e, z.id, true, { x: z.x, y: z.y, w: z.w, h: z.h })
                    }
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                  />
                </div>
              );
            })}

            {labels.map((l) => (
              <div
                key={l.id}
                className={`${styles.editorLabel} ${selected === l.id ? styles.editorSelected : ""}`}
                style={{ left: l.x * GRID * zoom, top: l.y * GRID * zoom, fontSize: `${12 * zoom}px` }}
                onPointerDown={(e) => onItemPointerDown(e, "label", l.id, { x: l.x, y: l.y })}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onDoubleClick={() => {
                  const next = window.prompt("Label text", l.text);
                  if (next != null)
                    setLabels((ls) => ls.map((ll) => (ll.id === l.id ? { ...ll, text: next.slice(0, 80) } : ll)));
                }}
              >
                {selected === l.id && <span className={styles.selectedBadge}>{l.text}</span>}
                📍 {l.text}
              </div>
            ))}

            {placed.map((s) => {
              const pos = seatPos(s)!;
              const geom = seatGeom(s);
              return (
                <div
                  key={s.id}
                  className={`${styles.editorSeat} ${selected === s.id ? styles.editorSelected : ""}`}
                  style={{
                    left: pos.x * GRID * zoom,
                    top: pos.y * GRID * zoom,
                    width: geom.w * GRID * zoom - 4,
                    height: geom.h * GRID * zoom - 4,
                    transform: geom.rotation ? `rotate(${geom.rotation}deg)` : undefined,
                  }}
                  onPointerDown={(e) =>
                    onItemPointerDown(e, "seat", s.id, { x: pos.x, y: pos.y, w: geom.w, h: geom.h })
                  }
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onDoubleClick={() => setPositions((p) => ({ ...p, [s.id]: null }))}
                  title={`${s.name} — double-click to remove from map · select for rename/delete`}
                >
                  {selected === s.id && <span className={styles.selectedBadge}>{s.name}</span>}
                  <span className={styles.seatName} style={{ fontSize: `${10 * zoom}px` }}>
                    {s.name}
                  </span>
                  <span
                    className={styles.seatResizeHandle}
                    onPointerDown={(e) =>
                      onItemPointerDown(e, "seatResize", s.id, { x: pos.x, y: pos.y, w: geom.w, h: geom.h })
                    }
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                  />
                  <span
                    className={styles.rotateHandle}
                    title="Drag to rotate"
                    onPointerDown={(e) =>
                      onRotatePointerDown(e, s.id, false, { x: pos.x, y: pos.y, w: geom.w, h: geom.h })
                    }
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <p className={styles.editorFooterHint}>
        Drag to move · corner handle resizes · top handle rotates (15° steps when snap is on) · double-click a
        seat to remove it from the map · double-click zones/labels to rename · select a seat to rename or
        delete it
      </p>
    </div>
  );
}
