/**
 * File:        libs/ui/src/components/layout/Container.tsx
 * Module:      Libs · UI · Layout
 * Purpose:     Max-width container with responsive padding
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-07
 */

import React from 'react';
import { cn } from '../../lib/utils';

type MaxWidth = 'sm' | 'md' | 'lg' | 'xl' | 'full';

const maxWidthClasses = {
  sm: 'max-w-screen-sm',
  md: 'max-w-screen-md',
  lg: 'max-w-screen-lg',
  xl: 'max-w-screen-xl',
  full: 'max-w-full',
};

export interface ContainerProps {
  maxWidth?: MaxWidth;
  padding?: boolean;
  className?: string;
  children: React.ReactNode;
}

export default function Container({
  maxWidth = 'xl',
  padding = true,
  className,
  children,
}: ContainerProps) {
  const containerClasses = cn(
    'w-full',
    padding ? 'px-4 sm:px-6 lg:px-8' : '',
    maxWidth !== 'full' ? maxWidthClasses[maxWidth] : '',
    className
  );

  return (
    <div className={containerClasses}>
      {children}
    </div>
  );
}

export { Container };