/**
 * File:        libs/ui/src/lib/utils.ts
 * Module:      Libs · UI · Utilities
 * Purpose:     Shared utility functions for the UI component library
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-20
 */

/**
 * Merge class names with proper precedence.
 * Later classes override earlier ones for conflicting properties.
 *
 * Accepts strings, arrays, objects, and conditional values.
 *
 * @example
 * cn("px-4 py-2", condition && "bg-red-500", { "opacity-50": disabled })
 */
export type ClassValue =
  | string
  | number
  | bigint
  | boolean
  | null
  | undefined
  | ClassValue[]
  | { [key: string]: boolean | null | undefined };

export function cn(...inputs: ClassValue[]): string {
  const out: string[] = [];
  for (const input of inputs) {
    if (!input) continue;
    if (typeof input === "string" || typeof input === "number") {
      out.push(String(input));
    } else if (Array.isArray(input)) {
      const nested = cn(...input);
      if (nested) out.push(nested);
    } else if (typeof input === "object") {
      for (const [key, value] of Object.entries(input)) {
        if (value) out.push(key);
      }
    }
  }
  return out.join(" ");
}
