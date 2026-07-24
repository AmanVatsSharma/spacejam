/**
 * File:        apps/api/src/common/utils/settings.util.ts
 * Module:      API · Common · Settings Utils
 * Purpose:     Deep-merge a partial settings object into a target object,
 *              preserving sibling keys. Used by centerSettings resolvers so
 *              updating one group (finance) never wipes another (security).
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-22
 */

/**
 * Recursively merge `incoming` into `target`. Plain object values are
 * merged key-by-key; everything else (primitives, arrays) is overwritten
 * by the incoming value.
 */
export function deepMergeSettings(
  target: Record<string, any>,
  incoming: Record<string, any>,
): Record<string, any> {
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
      out[key] = deepMergeSettings(out[key], value);
    } else {
      out[key] = value;
    }
  }
  return out;
}
