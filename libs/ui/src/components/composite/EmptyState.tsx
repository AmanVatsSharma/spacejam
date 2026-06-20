/**
 * File:        libs/ui/src/components/composite/EmptyState.tsx
 * Module:      Libs · UI · Composite
 * Purpose:     Empty-state composition component for no-content pages/sections
 *
 * Features:
 *   - Icon slot for illustrations or icons
 *   - Title and description text slots
 *   - Optional action slot (e.g. CTA button)
 *   - Centered layout with proper spacing
 *   - Accessible: semantic heading and descriptive text
 *   - Zero runtime dependencies beyond React + cn
 *   - Fully typed with TypeScript
 *
 * Design System Alignment:
 *   - Primary orange: #FF6A2F
 *   - Text dark: #1F1F1F / #101828
 *   - Text gray: #4A5565
 *   - Text muted: #9CA3AF
 *   - Border: #E5E7EB
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-07
 */

import * as React from "react";
import { cn } from "../../lib/utils";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Illustration or icon element (ReactNode) */
  icon?: React.ReactNode;
  /** Heading text */
  title: string;
  /** Body text describing the empty state */
  description: string;
  /** Optional call-to-action element (e.g. Button) */
  action?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

// ---------------------------------------------------------------------------
// EmptyState component
// ---------------------------------------------------------------------------
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        // Flex column, centered both axes
        "flex flex-col items-center justify-center gap-4 text-center",
        // Padding and max-width for readability
        "px-6 py-16",
        className
      )}
      {...props}
    >
      {/* Icon / illustration */}
      {icon && (
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#FFF5F1] text-[#FF6A2F]">
          {icon}
        </div>
      )}

      {/* Title */}
      <h3 className="text-lg font-semibold text-[#101828]">{title}</h3>

      {/* Description */}
      <p className="max-w-md text-sm text-[#4A5565]">{description}</p>

      {/* Optional CTA */}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export default EmptyState;
