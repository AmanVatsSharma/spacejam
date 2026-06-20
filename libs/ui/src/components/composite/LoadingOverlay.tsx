/**
 * File:        libs/ui/src/components/composite/LoadingOverlay.tsx
 * Module:      Libs · UI · Composite
 * Purpose:     Full-screen loading overlay with centered spinner and optional message
 *
 * Features:
 *   - Centered Spinner with configurable size
 *   - Optional descriptive message below the spinner
 *   - Backdrop blur effect for visual hierarchy
 *   - Smooth fade-in animation
 *   - Accessible: aria-busy on the overlay region
 *   - Zero runtime dependencies beyond React + cn
 *   - Fully typed with TypeScript
 *
 * Design System Alignment:
 *   - Primary orange: #FF6A2F
 *   - Text dark: #1F1F1F
 *   - Text muted: #6B7280
 *   - Background: #FFFFFF (card)
 *   - Border: #E5E7EB
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-07
 */

import * as React from "react";
import { cn } from "../../lib/utils";
import { Spinner, type SpinnerProps } from "../primitives/Spinner";

// ---------------------------------------------------------------------------
// Fade-in keyframes
// ---------------------------------------------------------------------------
const fadeKeyframes = `
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
`;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface LoadingOverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional message displayed below the spinner */
  message?: string;
  /** Size of the spinner */
  spinnerSize?: SpinnerProps["size"];
  /** Additional CSS classes for the overlay container */
  className?: string;
}

// ---------------------------------------------------------------------------
// LoadingOverlay component
// ---------------------------------------------------------------------------
export function LoadingOverlay({
  message = "Loading...",
  spinnerSize = "lg",
  className,
  ...props
}: LoadingOverlayProps) {
  return (
    <>
      <style>{fadeKeyframes}</style>
      <div
        className={cn(
          // Fixed full-viewport overlay
          "fixed inset-0 z-50 flex flex-col items-center justify-center gap-4",
          // Backdrop: semi-transparent warm white with blur
          "bg-white/70 backdrop-blur-sm",
          // Entrance animation
          "animate-[fadeIn_0.2s_ease-out]",
          className
        )}
        aria-busy="true"
        aria-label={message}
        {...props}
      >
        {/* Centered spinner */}
        <Spinner size={spinnerSize} />

        {/* Optional message */}
        {message && (
          <p className="text-sm font-medium text-[#6B7280]">{message}</p>
        )}
      </div>
    </>
  );
}

export default LoadingOverlay;
