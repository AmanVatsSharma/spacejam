/**
 * File:        libs/ui/src/components/composite/Select.tsx
 * Module:      Libs · UI · Composite
 * Purpose:    Styled select dropdown component
 *
 * Features:
 *   - Native select styled with SpaceJam design system
 *   - Error states
 *   - Optional label
 *   - Placeholder option
 *   - Full width option
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-07
 */

"use client";

import * as React from "react";
import { cn } from "../../lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export type SelectOptions = SelectOption[] | { value: string; label: string }[];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  /** Select label */
  label?: string;
  /** Error message */
  error?: string;
  /** Options array */
  options: SelectOptions;
  /** Placeholder text */
  placeholder?: string;
  /** Full width mode */
  fullWidth?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function Select({
  className,
  label,
  error,
  options,
  placeholder = "Select an option...",
  fullWidth = false,
  disabled,
  id,
  ...props
}: SelectProps) {
  const selectId = id || `select-${React.useId()}`;
  const errorId = error ? `${selectId}-error` : undefined;

  const formattedOptions = Array.isArray(options)
    ? options.map(opt => ({
        value: opt.value,
        label: opt.label,
        ...(('disabled' in opt) ? { disabled: opt.disabled as boolean } : {})
      }))
    : options;

  return (
    <div className={cn("space-y-1.5", fullWidth && "w-full")}>
      {/* Label */}
      {label && (
        <label
          htmlFor={selectId}
          className={cn(
            "block text-sm font-medium",
            error ? "text-[#EF4444]" : "text-[#1F1F1F]"
          )}
        >
          {label}
        </label>
      )}

      {/* Select wrapper */}
      <div className="relative">
        <select
          id={selectId}
          aria-describedby={errorId}
          aria-invalid={!!error}
          disabled={disabled}
          className={cn(
            "w-full px-4 py-2.5 rounded-lg border transition-colors outline-none appearance-none",
            "focus:ring-2 focus:ring-offset-0",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error
              ? "border-[#EF4444] focus:ring-[#EF4444] bg-[#FEF2F2]"
              : "border-[#E5E7EB] focus:ring-[#FF6A2F] bg-white hover:border-[#D1D5DB]",
            fullWidth && "w-full",
            className
          )}
          {...props}
        >
          {/* Placeholder option */}
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {/* Options */}
          {formattedOptions.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>

        {/* Custom caret */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg
            className="h-4 w-4 text-[#9CA3AF]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <p className="text-xs text-[#EF4444] flex items-center gap-1.5 mt-1">
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