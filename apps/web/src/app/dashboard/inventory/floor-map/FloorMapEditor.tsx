"use client";

/**
 * File:        apps/web/src/app/dashboard/inventory/floor-map/FloorMapEditor.tsx
 * Module:      Web · Dashboard · Floor Map Editor
 * Purpose:     Manual drag-and-drop layout editor — place seats from the
 *              tray, add/resize zone rectangles, add text labels, snap to
 *              grid, save via the parent's mutation callbacks. No external
 *              drag libraries; plain pointer events.
 *
 * Author:      ZCode
 * Last-updated: 2026-08-26
 */

import { useCallback, useMemo, useRef, useState } from "react";
import styles from "./floor-map.module.css";

export const GRID = 40; // px per grid unit at zoom 1
export const CANVAS_COLS = 24;
export const CANVAS_ROWS = 16;

export type ZoneKind = "MEETING_ROOM" | "PANTRY" | "WASHROOM" | "RECEPTION" | "CUSTOM";

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

const ZONE_KIND_LABELS: Record<ZoneKind, string> = {
  MEETING_ROOM: "Meeting Room",
  PANTRY: "Pantry",
  WASHROOM: "Washroom",
  RECEPTION: "Reception",
  CUSTOM: "Custom Zone",
};

const newId = (p: string) => `${p}${Math.random().toString(36).slice(2, 9)}`;
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

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
}: {
  floor: { id: string; name: string; layout: EditorLayout | null };
  seats: SeatLike[];
  onSaveLayout: (layout: EditorLayout, seatPositions: SeatGeometry[]) => Promise<void>;
  saving: boolean;
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

  const dirty =
    JSON.stringify(zones) !== JSON.stringify(serverLayout.zones) ||
    JSON.stringify(labels) !== JSON.stringify(serverLayout.labels) ||
    Object.keys(positions).length > 0 ||
    Object.keys(geoms).length > 0;

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
      const nx = clamp(g.x - d.offX, 0, CANVAS_COLS - 1);
      const ny = clamp(g.y - d.offY, 0, CANVAS_ROWS - 1);
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

  const addZone = (kind: ZoneKind) => {
    setZones((zs) => [...zs, { id: newId("z"), x: 1, y: 1, w: 4, h: 3, label: ZONE_KIND_LABELS[kind], kind }]);
  };
  const addLabel = () => {
    setLabels((ls) => [...ls, { id: newId("l"), x: 2, y: 2, text: "Label" }]);
  };
  const deleteSelected = () => {
    if (!selected) return;
    setZones((zs) => zs.filter((z) => z.id !== selected));
    setLabels((ls) => ls.filter((l) => l.id !== selected));
    setSelected(null);
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

  return (
    <div className={styles.editorWrap}>
      <div className={styles.editorToolbar}>
        <span className={styles.editorTitle}>Editing: {floor.name}</span>
        <select
          aria-label="Add zone"
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) {
              addZone(e.target.value as ZoneKind);
              e.target.value = "";
            }
          }}
          className={styles.editorBtn}
        >
          <option value="">+ Add Zone…</option>
          {(Object.keys(ZONE_KIND_LABELS) as ZoneKind[]).map((k) => (
            <option key={k} value={k}>
              {ZONE_KIND_LABELS[k]}
            </option>
          ))}
        </select>
        <button type="button" className={styles.editorBtn} onClick={addLabel}>
          + Label
        </button>
        <button type="button" className={styles.editorBtn} onClick={() => setSnap((v) => !v)}>
          {snap ? "Snap: On" : "Snap: Off"}
        </button>
        <button
          type="button"
          className={styles.editorBtn}
          onClick={() => setZoom((z) => clamp(Math.round((z - 0.1) * 10) / 10, 0.5, 2))}
        >
          −
        </button>
        <span className={styles.editorZoom}>{Math.round(zoom * 100)}%</span>
        <button
          type="button"
          className={styles.editorBtn}
          onClick={() => setZoom((z) => clamp(Math.round((z + 0.1) * 10) / 10, 0.5, 2))}
        >
          +
        </button>
        {selected && (
          <button type="button" className={styles.editorBtnDanger} onClick={deleteSelected}>
            Delete selected
          </button>
        )}
        <span className={styles.editorDirty}>{dirty ? "● unsaved changes" : "no changes"}</span>
        <div className={styles.editorToolbarRight}>
          <button type="button" className={styles.editorSave} disabled={!dirty || saving} onClick={handleSave}>
            {saving ? "Saving…" : "Save Layout"}
          </button>
        </div>
      </div>

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
                  onPointerDown={(e) => onItemPointerDown(e, "zone", z.id, { x: z.x, y: z.y })}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onDoubleClick={() => {
                    const next = window.prompt("Zone name", z.label);
                    if (next != null)
                      setZones((zs) => zs.map((zz) => (zz.id === z.id ? { ...zz, label: next.slice(0, 80) } : zz)));
                  }}
                >
                  <span className={styles.zoneLabel}>{z.label}</span>
                  <span className={styles.zoneKind}>{ZONE_KIND_LABELS[z.kind]}</span>
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
                  title={`${s.name} — double-click to remove from map`}
                >
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
        Drag to move · corner handle resizes · top handle rotates (15° steps when snap is on) · double-click a seat
        to remove it from the map · double-click zones/labels to rename
      </p>
    </div>
  );
}
