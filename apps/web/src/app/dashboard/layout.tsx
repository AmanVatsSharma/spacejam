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

"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/ui/sidebar";
import { Header, type HeaderTab } from "@/components/ui/header";
import { SetUpNewCenter } from "@/components/ui/set-up-new-center";

/**
 * Per-section sub-navigation. The first tab of each section is the
 * section's index route (e.g. `/dashboard/revenue`). Tabs are matched
 * against the current pathname by prefix, so a child route like
 * `/dashboard/revenue/invoices` keeps the `revenue` section's tabs active.
 */
const SECTION_TABS: Record<string, HeaderTab[]> = {
  revenue: [
    { id: "invoices", label: "Invoices", href: "/dashboard/invoices" },
    { id: "deposits", label: "Deposit", href: "/dashboard/invoices/deposits" },
    { id: "contracts", label: "Contracts", href: "/dashboard/invoices/contracts" },
  ],
  invoices: [
    { id: "invoices", label: "Invoices", href: "/dashboard/invoices" },
    { id: "deposits", label: "Deposit", href: "/dashboard/invoices/deposits" },
    { id: "contracts", label: "Contracts", href: "/dashboard/invoices/contracts" },
  ],
  floors: [
    { id: "location", label: "Location", href: "/dashboard/floors" },
    { id: "floor-map", label: "Floor map", href: "/dashboard/floors/floor-map" },
    { id: "table-view", label: "Table view", href: "/dashboard/floors/table-view" },
  ],
  crm: [
    { id: "customers", label: "Customers", href: "/dashboard/crm/customers" },
    { id: "leads", label: "Leads", href: "/dashboard/crm/leads" },
    { id: "onboarding", label: "Onboarding", href: "/dashboard/crm/onboarding" },
  ],
  "meeting-room": [
    { id: "meeting-rooms", label: "Meeting Rooms", href: "/dashboard/meeting-room" },
    { id: "events", label: "Events", href: "/dashboard/meeting-room/events" },
    { id: "request", label: "Request", href: "/dashboard/meeting-room/request" },
  ],
};

function getTabsForPath(pathname: string | null): { tabs: HeaderTab[]; activeId: string | undefined } {
  if (!pathname) return { tabs: [], activeId: undefined };
  // `/dashboard/<section>/...` — pick the section segment.
  const match = pathname.match(/^\/dashboard\/([^/]+)/);
  const section = match?.[1];
  if (!section || !SECTION_TABS[section]) return { tabs: [], activeId: undefined };

  const tabs = SECTION_TABS[section];
  // Active = first tab whose href is a prefix of the current path.
  const active = tabs.find((t) => pathname === t.href || pathname.startsWith(`${t.href}/`));
  return { tabs, activeId: active?.id };
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showSetUpModal, setShowSetUpModal] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { tabs, activeId } = getTabsForPath(pathname);

  return (
    <div className="min-h-screen bg-[#FBF6F4]">
      {/* Fixed Header - stays at top */}
      <Header
        tabs={tabs}
        activeTabId={activeId}
        onTabChange={(tab) => router.push(tab.href)}
        onSetUpNewCenter={() => setShowSetUpModal(true)}
        hideSetUpButton={!pathname.startsWith('/dashboard/inventory')}
      />

      <div className="flex compact:gap-2">
        {/* Fixed Sidebar - stays on left - routing handles active state */}
        <Sidebar />

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto px-8 py-6 compact:px-4 compact:py-4 min-w-0">
          {children}
        </main>
      </div>

      {/* Set Up New Center Modal */}
      {showSetUpModal && <SetUpNewCenter onClose={() => setShowSetUpModal(false)} />}
    </div>
  );
}
