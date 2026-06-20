/**
 * File:        libs/ui/src/components/composite/FormItem.tsx
 * Module:      Libs · UI · Composite
 * Purpose:    Form field wrapper with label, input, and error display
 *
 * Features:
 *   - Label + input + error in vertical stack
 *   - Accessible htmlFor association
 *   - Required field indicator
 *   - Optional description text
 *   - Error state with design system colors
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-07
 */

"use client";

import * as React from "react";
import { cn } from "../../lib/utils";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface FormItemProps {
  /** Label text */
  label: string;
  /** Links to input id */
  htmlFor: string;
  /** Error message */
  error?: string;
  /** Mark field as required */
  required?: boolean;
  /** Helper description text */
  description?: string;
  /** Input element */
  children: React.ReactNode;
  /** Additional className */
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function FormItem({
  label,
  htmlFor,
  error,
  required,
  description,
  children,
  className,
}: FormItemProps) {
  const errorId = `${htmlFor}-error`;
  const descriptionId = description ? `${htmlFor}-description` : undefined;

  return (
    <div className={cn("space-y-1.5", className)}>
      {/* Label */}
      <label
        htmlFor={htmlFor}
        className={cn(
          "block text-sm font-medium",
          error ? "text-[#EF4444]" : "text-[#1F1F1F]"
        )}
      >
        {label}
        {required && <span className="text-[#EF4444] ml-0.5">*</span>}
      </label>

      {/* Input */}
      {children}

      {/* Description */}
      {description && !error && (
        <p id={descriptionId} className="text-xs text-[#6B7280]">
          {description}
        </p>
      )}

      {/* Error message */}
      {error && (
        <p id={errorId} className="text-xs text-[#EF4444] flex items-center gap-1.5">
          <svg
            className="h-3.5 w-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4m0 4h.01" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}