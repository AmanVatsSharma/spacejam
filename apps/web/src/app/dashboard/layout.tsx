/**
 * File:        apps/web/src/app/dashboard/layout.tsx
 * Module:      Web · Dashboard Layout
 * Purpose:     Shared layout with fixed header, sidebar, and scrollable content
 *
 * Exports:
 *   - DashboardLayout — layout component with fixed navigation and scrollable content
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-05-28
 */

"use client";

import { useState } from "react";
import { Sidebar } from "@/components/ui/sidebar";
import { Header } from "@/components/ui/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activeSidebarTab, setActiveSidebarTab] = useState("dashboard");
  const [activeNav, setActiveNav] = useState<"location" | "floor-map" | "table-view">("table-view");

  return (
    <div className="min-h-screen bg-[#FBF6F4]">
      {/* Fixed Header - stays at top */}
      <Header activeNav={activeNav} onNavChange={setActiveNav} />

      <div className="flex">
        {/* Fixed Sidebar - stays on left */}
        <Sidebar activeTab={activeSidebarTab} onTabChange={setActiveSidebarTab} />

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto px-8 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}