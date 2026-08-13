/**
 * File:        apps/web/src/app/dashboard/calendar/types.ts
 * Module:      Web · Calendar · Types
 * Purpose:     Shared types for the calendar feature — mirrors the
 *              CalendarItem GraphQL object type from CalendarResolver.
 *
 * Author:      ZCode
 * Last-updated: 2026-08-13
 */

export type CalendarItemKind = 'EVENT' | 'BOOKING' | 'VISIT' | 'BIRTHDAY';

export interface CalendarItem {
  id: string;
  kind: CalendarItemKind;
  title: string;
  /** ISO date YYYY-MM-DD for grid placement. */
  date: string;
  startTime?: string | null;
  endTime?: string | null;
  status?: string | null;
  color?: string | null;
  referenceId?: string | null;
  meta?: string | null;
}

export type CalendarView = 'Month' | 'Week' | 'Day';

export type ModalKind = 'event' | 'visit' | 'block' | 'room' | 'birthday' | null;

/** Parse the JSON `meta` blob safely. */
export function parseMeta(item: CalendarItem): Record<string, any> {
  if (!item.meta) return {};
  try {
    return JSON.parse(item.meta);
  } catch {
    return {};
  }
}

/** Map a kind to the CSS color class suffix used by pills. */
export function colorClass(kind: CalendarItemKind, color?: string | null): string {
  if (color === 'orange') return 'eventOrange';
  if (color === 'blue') return 'eventBlue';
  if (color === 'pink') return 'eventPink';
  if (color === 'grey') return 'eventGrey';
  // default + purple
  return 'eventPurple';
}

/** Map a kind to the timeItem color class for time-grid views. */
export function timeItemClass(kind: CalendarItemKind, color?: string | null): string {
  const c = (color || '').toLowerCase();
  if (c === 'orange') return 'orange';
  if (c === 'blue') return 'blue';
  if (c === 'pink') return 'pink';
  if (c === 'grey') return 'grey';
  return '';
}

/** Format an HH:MM time string to 12-hour display. */
export function formatTime(time?: string | null): string {
  if (!time) return '';
  const parts = time.split(':');
  if (parts.length < 2) return time;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h)) return time;
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${String(m).padStart(2, '0')} ${suffix}`;
}
