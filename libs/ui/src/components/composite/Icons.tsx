/**
 * File:        libs/ui/src/components/composite/Icons.tsx
 * Module:      Libs · UI · Composite
 * Purpose:     Icon collection with inline SVGs for SpaceJam design system
 *
 * Features:
 *   - Hand-authored SVG icons
 *   - Consistent stroke-width (2) and sizing
 *   - Theme-aware fill/stroke
 *   - Accessibility: aria-label support
 *   - All icons are single components
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-07
 */

"use client";

import React from "react";
import { cn } from "../../lib/utils";

// Unified icon props interface
export interface IconProps {
  /** Custom CSS class */
  className?: string;
  /** Icon size (in pixels or Tailwind classes) */
  size?: string | number;
  /** Accessibility label */
  ariaLabel?: string;
  /** Hidden for screen readers */
  ariaHidden?: boolean;
}

// Core components with consistent pattern
export function MenuIcon(props: IconProps) {
  return (
    <svg
      className={cn("w-5 h-5", props.className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-label={props.ariaLabel || "Menu"}
      aria-hidden={props.ariaHidden || false}
      style={{ width: props.size || "20px", height: props.size || "20px" }}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

export function XMarkIcon(props: IconProps) {
  return (
    <svg
      className={cn("w-5 h-5", props.className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-label={props.ariaLabel || "Close"}
      aria-hidden={props.ariaHidden || false}
      style={{ width: props.size || "20px", height: props.size || "20px" }}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export function MagnifyingGlassIcon(props: IconProps) {
  return (
    <svg
      className={cn("w-5 h-5", props.className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-label={props.ariaLabel || "Search"}
      aria-hidden={props.ariaHidden || false}
      style={{ width: props.size || "20px", height: props.size || "20px" }}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <svg
      className={cn("w-5 h-5", props.className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-label={props.ariaLabel || "Chevron left"}
      aria-hidden={props.ariaHidden || false}
      style={{ width: props.size || "20px", height: props.size || "20px" }}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <svg
      className={cn("w-5 h-5", props.className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-label={props.ariaLabel || "Chevron right"}
      aria-hidden={props.ariaHidden || false}
      style={{ width: props.size || "20px", height: props.size || "20px" }}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <svg
      className={cn("w-5 h-5", props.className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-label={props.ariaLabel || "User"}
      aria-hidden={props.ariaHidden || false}
      style={{ width: props.size || "20px", height: props.size || "20px" }}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  );
}

export function BellIcon(props: IconProps) {
  return (
    <svg
      className={cn("w-5 h-5", props.className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-label={props.ariaLabel || "Notifications"}
      aria-hidden={props.ariaHidden || false}
      style={{ width: props.size || "20px", height: props.size || "20px" }}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  );
}

export function CheckCircleIcon(props: IconProps) {
  return (
    <svg
      className={cn("w-5 h-5", props.className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-label={props.ariaLabel || "Check circle"}
      aria-hidden={props.ariaHidden || false}
      style={{ width: props.size || "20px", height: props.size || "20px" }}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

export function XCircleIcon(props: IconProps) {
  return (
    <svg
      className={cn("w-5 h-5", props.className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-label={props.ariaLabel || "Close circle"}
      aria-hidden={props.ariaHidden || false}
      style={{ width: props.size || "20px", height: props.size || "20px" }}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

export function AlertCircleIcon(props: IconProps) {
  return (
    <svg
      className={cn("w-5 h-5", props.className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-label={props.ariaLabel || "Alert circle"}
      aria-hidden={props.ariaHidden || false}
      style={{ width: props.size || "20px", height: props.size || "20px" }}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  );
}

export function InformationCircleIcon(props: IconProps) {
  return (
    <svg
      className={cn("w-5 h-5", props.className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-label={props.ariaLabel || "Information circle"}
      aria-hidden={props.ariaHidden || false}
      style={{ width: props.size || "20px", height: props.size || "20px" }}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

export function DocumentTextIcon(props: IconProps) {
  return (
    <svg
      className={cn("w-5 h-5", props.className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-label={props.ariaLabel || "Document text"}
      aria-hidden={props.ariaHidden || false}
      style={{ width: props.size || "20px", height: props.size || "20px" }}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

export function InboxIcon(props: IconProps) {
  return (
    <svg
      className={cn("w-5 h-5", props.className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-label={props.ariaLabel || "Inbox"}
      aria-hidden={props.ariaHidden || false}
      style={{ width: props.size || "20px", height: props.size || "20px" }}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
      />
    </svg>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <svg
      className={cn("w-5 h-5", props.className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-label={props.ariaLabel || "Calendar"}
      aria-hidden={props.ariaHidden || false}
      style={{ width: props.size || "20px", height: props.size || "20px" }}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}

export function ChartBarIcon(props: IconProps) {
  return (
    <svg
      className={cn("w-5 h-5", props.className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-label={props.ariaLabel || "Chart bar"}
      aria-hidden={props.ariaHidden || false}
      style={{ width: props.size || "20px", height: props.size || "20px" }}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  );
}

export function DocumentArrowDownIcon(props: IconProps) {
  return (
    <svg
      className={cn("w-5 h-5", props.className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-label={props.ariaLabel || "Download document"}
      aria-hidden={props.ariaHidden || false}
      style={{ width: props.size || "20px", height: props.size || "20px" }}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <svg
      className={cn("w-5 h-5", props.className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-label={props.ariaLabel || "Clock"}
      aria-hidden={props.ariaHidden || false}
      style={{ width: props.size || "20px", height: props.size || "20px" }}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

export function CreditCardIcon(props: IconProps) {
  return (
    <svg
      className={cn("w-5 h-5", props.className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-label={props.ariaLabel || "Credit card"}
      aria-hidden={props.ariaHidden || false}
      style={{ width: props.size || "20px", height: props.size || "20px" }}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
      />
    </svg>
  );
}

// Icon bundle for easy import
export const icons = {
  Menu: MenuIcon,
  XMark: XMarkIcon,
  MagnifyingGlass: MagnifyingGlassIcon,
  ChevronLeft: ChevronLeftIcon,
  ChevronRight: ChevronRightIcon,
  User: UserIcon,
  Bell: BellIcon,
  CheckCircle: CheckCircleIcon,
  XCircle: XCircleIcon,
  AlertCircle: AlertCircleIcon,
  InformationCircle: InformationCircleIcon,
  DocumentText: DocumentTextIcon,
  Inbox: InboxIcon,
  Calendar: CalendarIcon,
  ChartBar: ChartBarIcon,
  DocumentArrowDown: DocumentArrowDownIcon,
  Clock: ClockIcon,
  CreditCard: CreditCardIcon,
};