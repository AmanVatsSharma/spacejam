/**
 * File:        libs/ui/src/components/primitives/Badge.tsx
 * Module:      Libs · UI · Primitives
 * Purpose:     Badge/tag component
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-07
 */

import React from 'react';
import { cn } from '../../lib/utils';

export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
export type BadgeSize = 'sm' | 'md';

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-[#F3F4F6] text-[#4B5563]',
  primary: 'bg-[#FFF5F1] text-[#FF6A2F]',
  success: 'bg-[#ECFDF5] text-[#10B981]',
  warning: 'bg-[#FFFBEB] text-[#F59E0B]',
  danger: 'bg-[#FEF2F2] text-[#EF4444]',
  neutral: 'bg-[#F9FAFB] text-[#6B7280]',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
};

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
  children: React.ReactNode;
}

export default function Badge({
  variant = 'default',
  size = 'sm',
  className,
  children,
}: BadgeProps) {
  const classes = cn(
    'inline-flex items-center font-medium rounded-full whitespace-nowrap',
    sizeClasses[size],
    variantClasses[variant],
    className
  );

  return <span className={classes}>{children}</span>;
}