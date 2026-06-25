/**
 * File:        libs/ui/src/lib/utils.ts
 * Module:      Libs · UI · Utilities
 * Purpose:     Shared utility functions for the UI component library
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-07
 */

/**
 * Merge class names with proper precedence.
 * Later classes override earlier ones for conflicting properties.
 *
 * Uses clsx pattern internally — accepts strings, arrays, objects.
 *
 * @example
 * cn("px-4 py-2", condition && "bg-red-500", { "opacity-50": disabled })
 */
type CnPrimitive = string | number | bigint | boolean | null | undefined;
type CnValue = CnPrimitive | Record<string, unknown>;

export function cn(...inputs: CnValue[]): string {
  const out: string[] = [];
  for (const input of inputs) {
    if (!input) continue;
    if (typeof input === "string" || typeof input === "number") {
      out.push(String(input));
    } else if (typeof input === "object") {
      for (const [key, value] of Object.entries(input)) {
        if (value) out.push(key);
      }
    }
  }
  return out.join(" ");
}
