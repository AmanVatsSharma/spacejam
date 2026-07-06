/**
 * File:        apps/web/src/app/dashboard/layout.tsx
 * Module:      Web · Dashboard Layout
 * Purpose:     Shared layout with fixed header, sidebar, and scrollable content.
 *              The header's center pill is route-aware: it shows the
 *              sub-navigation for whichever top-level dashboard section the
 *              user is currently in.
 *
 * Exports:
 *   - DashboardLayout — layout component with fixed navigation and scrollable content
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-20
 */

export const dynamic = 'force-dynamic';

import React from 'react';
import ClientLayout from './ClientLayout';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClientLayout>{children}</ClientLayout>
  );
}
