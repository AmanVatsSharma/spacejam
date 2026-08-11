/**
 * File:        apps/api/src/common/utils/settings.util.ts
 * Module:      API · Common · Settings Utils
 * Purpose:     Deep-merge a partial settings object into a target object,
 *              preserving sibling keys. Used by centerSettings resolvers so
 *              that updating one group (finance) never wipes another
 *              (security). Also bounds the payload: a whitelist drops
 *              unknown top-level keys, a size cap rejects oversized blobs,
 *              and the merge depth is capped to prevent runaway recursion.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-08-10
 */
import { BadRequestException } from '@nestjs/common';

/**
 * The known set of top-level settings groups consumed by the frontend today.
 * Adding a new group requires extending this set (intentional friction — a
 * new key should be a deliberate decision, not an accidental stowaway).
 */
const SETTINGS_WHITELIST = new Set([
  'bookingDefaults',
  'workspaceDefaults',
  'operations',
  'managerConfig',
  'finance',
  'notifications',
  'security',
  'bookingRules',
  'roomDefaults',
  'maintenance',
  'permissions',
  'permissionsSecurity',
  'permissionsNotifications',
]);

const MAX_SETTINGS_BYTES = 64 * 1024;
const MAX_MERGE_DEPTH = 5;

/**
 * Drop any top-level key not in the whitelist and reject oversized payloads.
 * Non-whitelisted keys are dropped silently (the frontend never sends them
 * today); callers should log when this happens so a future bug surfaces.
 */
export function sanitizeSettings(incoming: Record<string, any>): Record<string, any> {
  const json = JSON.stringify(incoming);
  if (json.length > MAX_SETTINGS_BYTES) {
    throw new BadRequestException(`Settings payload exceeds ${MAX_SETTINGS_BYTES} bytes`);
  }
  const out: Record<string, any> = {};
  for (const [key, value] of Object.entries(incoming)) {
    if (SETTINGS_WHITELIST.has(key)) {
      out[key] = value;
    }
  }
  return out;
}

/**
 * Measure the maximum plain-object nesting depth of `value`. Arrays and
 * primitives do not increment depth (they are leaves for merging purposes).
 * Root object counts as depth 1.
 */
function maxNestingDepth(value: any, current = 0): number {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return current;
  }
  let max = current + 1;
  for (const child of Object.values(value)) {
    max = Math.max(max, maxNestingDepth(child, current + 1));
  }
  return max;
}

/**
 * Recursively merge `incoming` into `target`. Plain object values are
 * merged key-by-key; everything else (primitives, arrays) is overwritten.
 * Throws if object nesting exceeds MAX_MERGE_DEPTH.
 *
 * The top-level call also pre-validates `incoming`'s object-nesting depth,
 * so an oversized payload is rejected even when `target` has no matching
 * keys (in which case the recursive merge would never descend into it).
 * The in-frame `depth > MAX_MERGE_DEPTH` check below stays as
 * defense-in-depth.
 */
export function deepMergeSettings(
  target: Record<string, any>,
  incoming: Record<string, any>,
  depth = 0,
): Record<string, any> {
  if (depth === 0 && maxNestingDepth(incoming) > MAX_MERGE_DEPTH) {
    throw new BadRequestException(`Settings nesting exceeds depth ${MAX_MERGE_DEPTH}`);
  }
  if (depth > MAX_MERGE_DEPTH) {
    throw new BadRequestException(`Settings nesting exceeds depth ${MAX_MERGE_DEPTH}`);
  }
  const out: Record<string, any> = { ...target };
  for (const [key, value] of Object.entries(incoming)) {
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      out[key] &&
      typeof out[key] === 'object' &&
      !Array.isArray(out[key])
    ) {
      out[key] = deepMergeSettings(out[key], value, depth + 1);
    } else {
      out[key] = value;
    }
  }
  return out;
}
