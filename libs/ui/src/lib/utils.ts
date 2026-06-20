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
export function cn(...inputs: (string | undefined | false | null)[]) {
  return inputs.filter(Boolean).join(" ");
}
