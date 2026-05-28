/**
 * File:        apps/web/src/components/ui/sidebar.tsx
 * Module:      Web · UI · Sidebar Navigation
 * Purpose:     Left sidebar with navigation icons for SpaceJam app
 *
 * Exports:
 *   - Sidebar — navigation component with Dashboard, CRM, Revenue, Operations, Report, Inventory, Settings
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-05-28
 */

"use client";

import { ReactNode } from "react";

interface NavItem {
  id: string;
  label: string;
  icon: ReactNode;
}

const DashboardIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="10" y="2" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="2" y="10" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="10" y="10" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

const CRMIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="9" cy="6" r="3" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M3 15C3 12.24 5.79 10 9 10C12.21 10 15 12.24 15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const RevenueIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 2V16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M9 2L6 5M9 2L12 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 16L6 13M9 16L12 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const OperationsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 6H15M3 9H15M3 12H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const ReportIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 3V15H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 3L9 9L15 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6 12H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const InventoryIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M7 9H11M9 7V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const SettingsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M9 1V3M9 15V17M17 9H15M3 9H1M14.85 3.15L13.44 4.56M4.56 13.44L3.15 14.85M14.85 14.85L13.44 13.44M4.56 4.56L3.15 3.15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

interface SidebarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function Sidebar({ activeTab = "inventory", onTabChange }: SidebarProps) {
  const navItems: NavItem[] = [
    { id: "dashboard", label: "Dashboard", icon: <DashboardIcon /> },
    { id: "crm", label: "CRM", icon: <CRMIcon /> },
    { id: "revenue", label: "Revenue", icon: <RevenueIcon /> },
    { id: "operations", label: "Operations", icon: <OperationsIcon /> },
    { id: "report", label: "Report", icon: <ReportIcon /> },
    { id: "inventory", label: "Inventory", icon: <InventoryIcon /> },
    { id: "settings", label: "Settings", icon: <SettingsIcon /> },
  ];

  return (
    <nav className="flex flex-col items-center py-4 px-2 gap-1 bg-[#111827] rounded-3xl shadow-lg w-[72px] h-[580px]">
      {navItems.map((item) => {
        const isActive = item.id === activeTab;
        return (
          <button
            key={item.id}
            onClick={() => onTabChange?.(item.id)}
            className={`
              flex flex-col items-center justify-center w-14 h-14 rounded-2xl cursor-pointer transition-all duration-200 gap-1
              ${isActive
                ? "bg-[#FF7847] text-white shadow-lg"
                : "text-white/70 hover:bg-white/10"
              }
            `}
          >
            {item.icon}
            <span className="text-[8px] font-medium leading-none">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}