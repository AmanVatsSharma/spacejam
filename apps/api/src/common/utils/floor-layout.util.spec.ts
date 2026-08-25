/**
 * File:        common/utils/floor-layout.util.spec.ts
 * Module:      API · Floor Layout Util Tests
 * Purpose:     Validation rules for the floor layout blob: whitelist,
 *              bounds, caps, text length, version handling.
 *
 * Author:      ZCode
 * Last-updated: 2026-08-26
 */
import { BadRequestException } from '@nestjs/common';
import { sanitizeFloorLayout } from './floor-layout.util';

describe('sanitizeFloorLayout', () => {
  const zone = (over: Partial<any> = {}) => ({
    id: 'z1', x: 1, y: 2, w: 4, h: 3, label: 'Meeting Room A', kind: 'MEETING_ROOM',
    ...over,
  });

  it('accepts a valid layout and normalizes the first version to 1', () => {
    const out = sanitizeFloorLayout({ zones: [zone()], labels: [{ id: 'l1', x: 2, y: 2, text: 'Entrance' }] });
    expect(out.version).toBe(1);
    expect(out.zones[0].label).toBe('Meeting Room A');
    expect(out.labels[0].text).toBe('Entrance');
  });

  it('rejects non-object input', () => {
    expect(() => sanitizeFloorLayout('nope')).toThrow(BadRequestException);
  });

  it('drops unknown top-level keys but keeps valid ones', () => {
    const out = sanitizeFloorLayout({ zones: [], labels: [], evil: { x: 1 } }) as any;
    expect(out.evil).toBeUndefined();
    expect(out.zones).toEqual([]);
  });

  it('rejects a zone with an unknown kind', () => {
    expect(() => sanitizeFloorLayout({ zones: [zone({ kind: 'VOLCANO' })] })).toThrow(BadRequestException);
  });

  it('rejects zones out of bounds', () => {
    expect(() => sanitizeFloorLayout({ zones: [zone({ x: -1 })] })).toThrow(BadRequestException);
    expect(() => sanitizeFloorLayout({ zones: [zone({ x: 500 })] })).toThrow(BadRequestException);
    expect(() => sanitizeFloorLayout({ zones: [zone({ w: 0 })] })).toThrow(BadRequestException);
    expect(() => sanitizeFloorLayout({ zones: [zone({ h: 201 })] })).toThrow(BadRequestException);
  });

  it('truncates long text and label strings to 80 chars', () => {
    const out = sanitizeFloorLayout({ zones: [zone({ label: 'x'.repeat(120) })] });
    expect(out.zones[0].label.length).toBe(80);
  });

  it('caps zones and labels at 100 each', () => {
    const many = Array.from({ length: 101 }, (_, i) => zone({ id: 'z' + i }));
    expect(() => sanitizeFloorLayout({ zones: many })).toThrow(BadRequestException);
    const manyLabels = Array.from({ length: 101 }, (_, i) => ({ id: 'l' + i, x: 1, y: 1, text: 't' }));
    expect(() => sanitizeFloorLayout({ zones: [], labels: manyLabels })).toThrow(BadRequestException);
  });

  it('rejects NaN coordinates', () => {
    expect(() => sanitizeFloorLayout({ zones: [zone({ x: 'abc' as any })] })).toThrow(BadRequestException);
  });
});
