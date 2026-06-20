/**
 * File:        libs/ui/src/components/layout/Grid.tsx
 * Module:      Libs · UI · Layout
 * Purpose:     Responsive grid layout component
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-07
 */

import React from 'react';
import { cn } from '../../lib/utils';

export interface GridProps {
  columns?: number | 'auto';
  gap?: number;
  minItemWidth?: string;
  className?: string;
  children: React.ReactNode;
}

export default function Grid({
  columns = 1,
  gap = 4,
  minItemWidth,
  className,
  children,
}: GridProps) {
  const gridStyle = {
    gap: `${gap * 0.25}rem`,
    ...(minItemWidth && columns === 'auto'
      ? {
          gridTemplateColumns: `repeat(auto-fill, minmax(${minItemWidth}, 1fr))`,
        }
      : {}),
  };

  const gridClasses = cn(
    'grid',
    {
      'grid-cols-1': columns === 1,
      'grid-cols-2': columns === 2,
      'grid-cols-3': columns === 3,
      'grid-cols-4': columns === 4,
      'grid-cols-5': columns === 5,
      'grid-cols-6': columns === 6,
      'grid-cols-12': columns === 12,
    },
    minItemWidth && columns === 'auto' ? '' : '',
    className
  );

  return (
    <div className={gridClasses} style={gridStyle}>
      {children}
    </div>
  );
}

export { Grid };