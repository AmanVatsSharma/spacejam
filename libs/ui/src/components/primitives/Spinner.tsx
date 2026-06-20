/**
 * File:        libs/ui/src/components/primitives/Spinner.tsx
 * Module:      Libs · UI · Primitives
 * Purpose:     Standalone inline SVG spinner component for loading states
 *
 * Features:
 *   - Four size variants: sm (20px), md (32px), lg (48px), xl (64px)
 *   - Animated rotation via CSS keyframes (animate-spin)
 *   - Accessible: aria-hidden on decorative SVG, role="status" support
 *   - Zero runtime dependencies beyond React + cn
 *   - Fully typed with TypeScript
 *
 * Design System Alignment:
 *   - Primary orange: #FF6A2F
 *   - Text dark: #1F1F1F
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-07
 */

import * as React from "react";
import { cn } from "../../lib/utils";

// ---------------------------------------------------------------------------
// Size map — pixel dimensions for each variant
// ---------------------------------------------------------------------------
const sizeMap: Record<string, number> = {
  sm: 20,
  md: 32,
  lg: 48,
  xl: 64,
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface SpinnerProps extends React.SVGAttributes<SVGElement> {
  /** Spinner size variant */
  size?: keyof typeof sizeMap;
  /** Additional CSS classes */
  className?: string;
  /** Accessible label for screen readers */
  label?: string;
}

// ---------------------------------------------------------------------------
// Spinner component
// ---------------------------------------------------------------------------
export function Spinner({
  size = "md",
  className,
  label = "Loading",
  ...props
}: SpinnerProps) {
  const pixelSize = sizeMap[size];

  return (
    <span className={cn("inline-flex shrink-0", className)} role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      <svg
        width={pixelSize}
        height={pixelSize}
        viewBox="0 0 24 24"
        fill="none"
        className="animate-spin"
        aria-hidden="true"
        {...props}
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3"
        />
        <path
          className="opacity-75"
          fill="#FF6A2F"
          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
        />
      </svg>
    </span>
  );
}

export default Spinner;
