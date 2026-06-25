/**
 * File:        apps/web/src/app/dashboard/crm/layout.tsx
 * Module:      Web · Dashboard · CRM Layout
 * Purpose:     Pass-through layout for CRM routes. The Customers / Leads /
 *              Onboarding sub-navigation is rendered in the global dashboard
 *              header — see `dashboard/layout.tsx` (`SECTION_TABS.crm`).
 *              This file exists so any CRM-specific chrome (e.g. shared
 *              providers, breadcrumbs) can be added here without affecting
 *              sibling sections.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-20
 */

export default function CRMLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
