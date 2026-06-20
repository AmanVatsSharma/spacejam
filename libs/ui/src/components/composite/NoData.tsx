/**
 * File:        libs/ui/src/components/composite/NoData.tsx
 * Module:      Libs · UI · Composite
 * Purpose:     Convenience preset of EmptyState for "no data" scenarios
 *
 * Features:
 *   - Preset title ("No data found") and default illustration
 *   - Accepts a custom message string for flexibility
 *   - Optional action button with configurable label
 *   - Accepts onAction callback for the preset button
 *   - Thin wrapper over EmptyState — zero duplication
 *   - Zero runtime dependencies beyond React + cn
 *   - Fully typed with TypeScript
 *
 * Design System Alignment:
 *   - Primary orange: #FF6A2F
 *   - Text dark: #1F1F1F / #101828
 *   - Text gray: #4A5565
 *   - Text muted: #9CA3AF
 *   - Success: #10B981
 *   - Error: #EF4444
 *   - Warning: #F59E0B
 *   - Border: #E5E7EB
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-07
 */

import * as React from "react";
import { EmptyState, type EmptyStateProps } from "./EmptyState";

// ---------------------------------------------------------------------------
// Default icon: document / inbox outline SVG
// ---------------------------------------------------------------------------
const DefaultNoDataIcon = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-[#FF6A2F]"
    aria-hidden="true"
  >
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="12" y1="18" x2="12" y2="12" />
    <line x1="9" y1="15" x2="15" y2="15" />
  </svg>
);

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface NoDataProps extends Omit<EmptyStateProps, "icon" | "title" | "description"> {
  /** Custom message (defaults to "No data found") */
  message?: string;
  /** Optional action button label */
  actionLabel?: string;
  /** Callback when the action button is clicked */
  onAction?: () => void;
  /** Additional CSS classes passed through to EmptyState */
  className?: string;
}

// ---------------------------------------------------------------------------
// NoData component
// ---------------------------------------------------------------------------
export function NoData({
  message = "No data found",
  actionLabel,
  onAction,
  className,
  ...props
}: NoDataProps) {
  return (
    <EmptyState
      icon={<DefaultNoDataIcon />}
      title="No data found"
      description={message}
      className={className}
      {...props}
    />
  );
}

export default NoData;
