/**
 * File:        libs/ui/src/components/primitives/Skeleton.tsx
 * Module:      Libs · UI · Primitives
 * Purpose:     Skeleton loading placeholder component with animated gradient
 *
 * Features:
 *   - Four visual variants: text, circular, rectangular, thumbnail
 *   - Custom width and height via props
 *   - Animated shimmer gradient effect via injected <style> keyframes
 *   - Accessible: aria-busy and aria-label for screen readers
 *   - Zero runtime dependencies beyond React + cn
 *   - Fully typed with TypeScript
 *
 * Design System Alignment:
 *   - Border: #E5E7EB
 *   - Background: #F9FAFB
 *   - Text dark: #1F1F1F
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-07
 */

import * as React from "react";
import { cn } from "../../lib/utils";

// ---------------------------------------------------------------------------
// Variant map — each key maps to base Tailwind classes for shape
// ---------------------------------------------------------------------------
const variantStyles: Record<string, string> = {
  text: "h-4 w-full rounded",
  circular: "rounded-full",
  rectangular: "rounded-lg",
  thumbnail: "rounded-2xl",
};

// ---------------------------------------------------------------------------
// Shimmer keyframes (injected once per mount)
// ---------------------------------------------------------------------------
const shimmerKeyframes = `
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
`;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Visual variant controlling shape */
  variant?: "text" | "circular" | "rectangular" | "thumbnail";
  /** Custom width (CSS value string, e.g. "120px", "50%") */
  width?: string;
  /** Custom height (CSS value string, e.g. "80px", "2rem") */
  height?: string;
  /** Additional CSS classes */
  className?: string;
}

// ---------------------------------------------------------------------------
// Skeleton component
// ---------------------------------------------------------------------------
export function Skeleton({
  variant = "text",
  width,
  height,
  className,
  ...props
}: SkeletonProps) {
  return (
    <>
      {/* Inject keyframes once */}
      <style>{shimmerKeyframes}</style>
      <div
        className={cn(
          // Shimmer gradient background
          "animate-shimmer",
          // Gradient: warm cream base -> light gray highlight
          "bg-gradient-to-r from-[#F9FAFB] via-[#E5E7EB] to-[#F9FAFB]",
          "bg-[length:200%_100%]",
          // Variant shape classes
          variantStyles[variant],
          className
        )}
        style={{
          width: width ?? (variant === "text" ? undefined : undefined),
          height: height ?? (variant === "circular" ? undefined : undefined),
          ...(width ? { width } : {}),
          ...(height ? { height } : {}),
        }}
        aria-busy="true"
        aria-label="Loading content"
        {...props}
      />
    </>
  );
}

export default Skeleton;
