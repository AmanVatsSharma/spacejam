/**
 * File:        libs/ui/src/components/composite/Textarea.tsx
 * Module:      Libs · UI · Composite
 * Purpose:    Styled textarea component
 *
 * Features:
 *   - Resize options (none, vertical, horizontal, both)
 *   - Max rows support
 *   - Label and description
 *   - Error states with design system colors
 *   - Forward ref support
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
type ResizeOption = "none" | "vertical" | "horizontal" | "both";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Label text */
  label?: string;
  /** Error message */
  error?: string;
  /** Helper description text */
  description?: string;
  /** Resize behavior */
  resize?: ResizeOption;
  /** Maximum rows to show */
  maxRows?: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      error,
      description,
      resize = "vertical",
      maxRows,
      id,
      required,
      ...props
    },
    ref
  ) => {
    const textareaId = id || `textarea-${React.useId()}`;
    const errorId = error ? `${textareaId}-error` : undefined;
    const descriptionId = description ? `${textareaId}-description` : undefined;

    const resizeStyles: Record<ResizeOption, string> = {
      none: "resize-none",
      vertical: "resize-y",
      horizontal: "resize-x",
      both: "resize",
    };

    return (
      <div className="space-y-1.5">
        {/* Label */}
        {label && (
          <label
            htmlFor={textareaId}
            className={cn(
              "block text-sm font-medium",
              error ? "text-[#EF4444]" : "text-[#1F1F1F]"
            )}
          >
            {label}
            {required && <span className="text-[#EF4444] ml-0.5">*</span>}
          </label>
        )}

        {/* Textarea */}
        <textarea
          ref={ref}
          id={textareaId}
          aria-describedby={errorId || descriptionId}
          aria-invalid={!!error}
          required={required}
          className={cn(
            "w-full px-4 py-2.5 rounded-lg border transition-colors outline-none",
            "focus:ring-2 focus:ring-offset-0",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            resizeStyles[resize],
            error
              ? "border-[#EF4444] focus:ring-[#EF4444] bg-[#FEF2F2]"
              : "border-[#E5E7EB] focus:ring-[#FF6A2F] bg-white hover:border-[#D1D5DB]",
            className
          )}
          {...props}
        />

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
);

Textarea.displayName = "Textarea";

export { Textarea };