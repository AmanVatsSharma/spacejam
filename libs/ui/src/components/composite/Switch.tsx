/**
 * File:        libs/ui/src/components/composite/Switch.tsx
 * Module:      Libs · UI · Composite
 * Purpose:    Toggle switch component
 *
 * Features:
 *   - Inline SVG toggle thumb
 *   - Primary color (#FF6A2F) for active state
 *   - Gray for inactive state
 *   - Accessible label association
 *   - Disabled state
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
export interface SwitchProps {
  /** Checked state */
  checked: boolean;
  /** Change handler */
  onChange: (checked: boolean) => void;
  /** Label text */
  label?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Input name */
  name?: string;
  /** Additional className */
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function Switch({
  checked,
  onChange,
  label,
  disabled = false,
  name,
  className,
}: SwitchProps) {
  const switchId = `switch-${React.useId()}`;

  const handleClick = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Switch button */}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-disabled={disabled}
        aria-labelledby={label ? switchId : undefined}
        name={name}
        disabled={disabled}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full",
          "transition-colors duration-200 ease-in-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6A2F] focus-visible:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          checked ? "bg-[#FF6A2F]" : "bg-[#E5E7EB]"
        )}
      >
        {/* Toggle thumb - inline SVG */}
        <span
          className={cn(
            "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg",
            "transform transition-transform duration-200 ease-in-out",
            "flex items-center justify-center",
            checked ? "translate-x-5" : "translate-x-0.5"
          )}
        >
          <svg
            className={cn(
              "h-3 w-3",
              checked ? "text-[#FF6A2F]" : "text-[#9CA3AF]"
            )}
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            {checked ? (
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
            ) : (
              <circle cx="12" cy="12" r="3" fill="currentColor" />
            )}
          </svg>
        </span>
      </button>

      {/* Label */}
      {label && (
        <label
          htmlFor={switchId}
          className={cn(
            "text-sm font-medium cursor-pointer select-none",
            disabled ? "text-[#9CA3AF]" : "text-[#1F1F1F]",
            "peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
          )}
        >
          {label}
        </label>
      )}
    </div>
  );
}