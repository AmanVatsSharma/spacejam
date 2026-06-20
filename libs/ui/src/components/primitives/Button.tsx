/**
 * File:        libs/ui/src/components/primitives/Button.tsx
 * Module:      Libs · UI · Primitives
 * Purpose:     Production-grade Button component with variants, sizes, states
 *
 * Features:
 *   - Multiple variants (primary, secondary, outline, ghost, danger)
 *   - Multiple sizes (xs, sm, md, lg, xl, icon)
 *   - Full loading state with inline spinner (no external icon deps)
 *   - Icon support (left/right)
 *   - Disabled state
 *   - Full width mode
 *   - Accessible (aria-busy, aria-disabled, focus-visible rings)
 *   - TypeScript strict typing
 *   - Forward ref support
 *   - Zero runtime dependencies beyond React + clsx/cn
 *
 * Design System Alignment:
 *   - Primary: #FF6A2F
 *   - Danger: #EF4444
 *   - Success: #10B981
 *   - Active press: scale-[0.98] for tactile feedback
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-07
 */

"use client";

import * as React from "react";
import { cn } from "../../lib/utils";

// ---------------------------------------------------------------------------
// Variant map — each key maps to a full Tailwind class string.
// Adding a new variant = one new entry here. No CVA, no runtime cost.
// ---------------------------------------------------------------------------
const variantStyles: Record<string, string> = {
  primary:
    "bg-[#FF6A2F] text-white shadow-sm hover:bg-[#E55A26] focus-visible:ring-[#FF6A2F] active:bg-[#D14F1F]",
  secondary:
    "bg-[#FFF5F1] text-[#FF6A2F] hover:bg-[#FFE8DE] focus-visible:ring-[#FF6A2F]",
  outline:
    "border border-[#E5E7EB] bg-white text-[#101828] hover:bg-[#F9FAFB] hover:border-[#D1D5DB] focus-visible:ring-[#4B5563]",
  ghost:
    "text-[#4A5565] hover:bg-[#F3F4F6] hover:text-[#101828] focus-visible:ring-[#4B5563]",
  danger:
    "bg-[#EF4444] text-white shadow-sm hover:bg-[#DC2626] focus-visible:ring-[#EF4444] active:bg-[#B91C1C]",
  success:
    "bg-[#10B981] text-white shadow-sm hover:bg-[#059669] focus-visible:ring-[#10B981] active:bg-[#047857]",
  link: "text-[#FF6A2F] underline-offset-4 hover:underline p-0 h-auto",
};

const sizeStyles: Record<string, string> = {
  xs: "h-8 px-3 text-xs rounded-lg",
  sm: "h-9 px-4 text-sm",
  md: "h-10 px-5 text-sm",
  lg: "h-11 px-6 text-base",
  xl: "h-12 px-8 text-base",
  icon: "h-10 w-10 p-0",
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual variant */
  variant?: keyof typeof variantStyles;
  /** Size */
  size?: keyof typeof sizeStyles;
  /** Show loading spinner and disable interaction */
  loading?: boolean;
  /** Left icon element */
  leftIcon?: React.ReactNode;
  /** Right icon element */
  rightIcon?: React.ReactNode;
  /** Full width button */
  fullWidth?: boolean;
  /** Text to show when loading (replaces children) */
  loadingText?: string;
}

// ---------------------------------------------------------------------------
// Spinner — inline SVG, no deps
// ---------------------------------------------------------------------------
const Spinner = () => (
  <svg
    className="h-4 w-4 shrink-0 animate-spin"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
    />
  </svg>
);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      loadingText,
      children,
      disabled,
      type = "button",
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        type={type}
        ref={ref}
        disabled={isDisabled}
        aria-busy={loading}
        aria-disabled={isDisabled}
        className={cn(
          // Base: flex layout, font, rounded, transitions, focus ring, active press
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-medium transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          "active:scale-[0.98]",
          // Variant + size from maps
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {loading ? (
          <>
            <Spinner />
            {loadingText ? <span>{loadingText}</span> : <span>{children}</span>}
          </>
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button, variantStyles, sizeStyles };
