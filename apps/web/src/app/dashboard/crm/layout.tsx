/**
 * File:        apps/web/src/app/dashboard/crm/layout.tsx
 * Module:      Web · Dashboard · CRM Layout
 * Purpose:     CRM section wrapper. Sub-tabs (Customers, Leads, Onboarding)
 *              are rendered in the global dashboard header — see
 *              `dashboard/layout.tsx` (SECTION_TABS.crm). This layout just
 *              passes children through.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-20
 */

export default function CRMLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex-1 flex flex-col min-h-0">{children}</div>;
}
