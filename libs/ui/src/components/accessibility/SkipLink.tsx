/**
 * File:        libs/ui/src/components/accessibility/SkipLink.tsx
 * Module:      Libs · UI · Accessibility
 * Purpose:     Skip-to-content link for keyboard accessibility
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-07
 */

import React from 'react';
import { cn } from '../../lib/utils';

export interface SkipLinkProps {
  targetId?: string;
  className?: string;
  children?: React.ReactNode;
}

export default function SkipLink({
  targetId = 'main-content',
  className,
  children = 'Skip to main content',
}: SkipLinkProps) {
  return (
    <a
      href={`#${targetId}`}
      className={cn(
        'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50',
        'bg-[#FF6A2F] text-white px-4 py-2 rounded-lg font-medium text-sm',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF6A2F]',
        className
      )}
    >
      {children}
    </a>
  );
}

export { SkipLink };