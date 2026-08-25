/**
 * File:        common/utils/floor-layout.util.ts
 * Module:      API · Common · Floor Layout Util
 * Purpose:     Validate + normalize the Floor.layout jsonb written by the
 *              manual floor map editor. Defense-in-depth: the editor also
 *              clamps, but the server never trusts the client blob.
 *
 * Author:      ZCode
 * Last-updated: 2026-08-26
 */
import { BadRequestException } from '@nestjs/common';

export type ZoneKind = 'MEETING_ROOM' | 'PANTRY' | 'WASHROOM' | 'RECEPTION' | 'CUSTOM';

export interface FloorZone {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  kind: ZoneKind;
}

export interface FloorLabel {
  id: string;
  x: number;
  y: number;
  text: string;
}

export interface FloorLayout {
  version: number;
  zones: FloorZone[];
  labels: FloorLabel[];
}

const ZONE_KINDS = new Set<ZoneKind>(['MEETING_ROOM', 'PANTRY', 'WASHROOM', 'RECEPTION', 'CUSTOM']);
const MAX_ITEMS = 100;
const MAX_TEXT = 80;
const MAX_POS = 500;
const MAX_SIZE = 200;
const MAX_JSON_BYTES = 32 * 1024;

const isNum = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v);

const clampText = (v: unknown, fallback: string): string => {
  const s = typeof v === 'string' ? v.trim() : '';
  return (s || fallback).slice(0, MAX_TEXT);
};

export function sanitizeFloorLayout(incoming: unknown): FloorLayout {
  if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) {
    throw new BadRequestException('Layout must be a JSON object');
  }
  if (JSON.stringify(incoming).length > MAX_JSON_BYTES) {
    throw new BadRequestException(`Layout exceeds ${MAX_JSON_BYTES} bytes`);
  }

  const raw = incoming as Record<string, any>;
  const rawZones = Array.isArray(raw.zones) ? raw.zones : [];
  const rawLabels = Array.isArray(raw.labels) ? raw.labels : [];
  if (rawZones.length > MAX_ITEMS || rawLabels.length > MAX_ITEMS) {
    throw new BadRequestException(`Layout allows at most ${MAX_ITEMS} zones and ${MAX_ITEMS} labels`);
  }

  const zones: FloorZone[] = rawZones.map((z: any, i: number) => {
    if (!z || typeof z !== 'object') throw new BadRequestException(`zones[${i}] must be an object`);
    const kind = (typeof z.kind === 'string' ? z.kind : 'CUSTOM') as ZoneKind;
    if (!ZONE_KINDS.has(kind)) throw new BadRequestException(`zones[${i}].kind "${z.kind}" is not allowed`);
    for (const k of ['x', 'y', 'w', 'h'] as const) {
      if (!isNum(z[k])) throw new BadRequestException(`zones[${i}].${k} must be a number`);
    }
    if (z.x < 0 || z.y < 0 || z.x >= MAX_POS || z.y >= MAX_POS) {
      throw new BadRequestException(`zones[${i}] position out of bounds (0..${MAX_POS - 1})`);
    }
    if (z.w < 1 || z.h < 1 || z.w > MAX_SIZE || z.h > MAX_SIZE) {
      throw new BadRequestException(`zones[${i}] size out of bounds (1..${MAX_SIZE})`);
    }
    return {
      id: String(z.id ?? `z${i}`).slice(0, 40),
      x: Math.round(z.x),
      y: Math.round(z.y),
      w: Math.round(z.w),
      h: Math.round(z.h),
      label: clampText(z.label, 'Zone'),
      kind,
    };
  });

  const labels: FloorLabel[] = rawLabels.map((l: any, i: number) => {
    if (!l || typeof l !== 'object') throw new BadRequestException(`labels[${i}] must be an object`);
    for (const k of ['x', 'y'] as const) {
      if (!isNum(l[k])) throw new BadRequestException(`labels[${i}].${k} must be a number`);
    }
    if (l.x < 0 || l.y < 0 || l.x >= MAX_POS || l.y >= MAX_POS) {
      throw new BadRequestException(`labels[${i}] position out of bounds`);
    }
    return {
      id: String(l.id ?? `l${i}`).slice(0, 40),
      x: Math.round(l.x),
      y: Math.round(l.y),
      text: clampText(l.text, 'Label'),
    };
  });

  // First save normalizes to version 1; subsequent saves carry the
  // optimistic-concurrency counter (checked by the resolver).
  const version = isNum(raw.version) && raw.version > 0 ? Math.floor(raw.version) : 1;

  return { version, zones, labels };
}
