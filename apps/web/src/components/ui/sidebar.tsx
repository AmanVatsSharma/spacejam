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

import { ReactNode, cloneElement } from "react";

interface NavItem {
  id: string;
  label: string;
  icon: ReactNode;
}

interface IconProps {
  active?: boolean;
}

const DashboardIcon = ({ active }: IconProps) => (
  <svg width="16" height="18" viewBox="0 0 16 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="1" width="6" height="6" rx="1" stroke={active ? "white" : "#4B5563"} strokeWidth="1.5"/>
    <rect x="9" y="1" width="6" height="6" rx="1" stroke={active ? "white" : "#4B5563"} strokeWidth="1.5"/>
    <rect x="1" y="9" width="6" height="6" rx="1" stroke={active ? "white" : "#4B5563"} strokeWidth="1.5"/>
    <rect x="9" y="9" width="6" height="6" rx="1" stroke={active ? "white" : "#4B5563"} strokeWidth="1.5"/>
  </svg>
);

const CRMIcon = ({ active }: IconProps) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="9" cy="6" r="3" stroke={active ? "white" : "#4B5563"} strokeWidth="1.5"/>
    <path d="M3 15C3 12.24 5.79 10 9 10C12.21 10 15 12.24 15 15" stroke={active ? "white" : "#4B5563"} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const RevenueIcon = ({ active }: IconProps) => (
  <svg width="16" height="18" viewBox="0 0 16 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 2V16" stroke={active ? "white" : "#4B5563"} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M8 2L5 5M8 2L11 5" stroke={active ? "white" : "#4B5563"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 16L5 13M8 16L11 13" stroke={active ? "white" : "#4B5563"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const OperationsIcon = ({ active }: IconProps) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 6H15M3 9H15M3 12H15" stroke={active ? "white" : "#4B5563"} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const ReportIcon = ({ active }: IconProps) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 3V15H15" stroke={active ? "white" : "#4B5563"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 3L9 9L15 3" stroke={active ? "white" : "#4B5563"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6 12H12" stroke={active ? "white" : "#4B5563"} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const InventoryIcon = ({ active }: IconProps) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="12" height="12" rx="2" stroke={active ? "white" : "#4B5563"} strokeWidth="1.5"/>
    <path d="M7 9H11M9 7V11" stroke={active ? "white" : "#4B5563"} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const SettingsIcon = ({ active }: IconProps) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="9" cy="9" r="2.5" stroke={active ? "white" : "#4B5563"} strokeWidth="1.5"/>
    <path d="M9 1V3M9 15V17M17 9H15M3 9H1M14.85 3.15L13.44 4.56M4.56 13.44L3.15 14.85M14.85 14.85L13.44 13.44M4.56 4.56L3.15 3.15" stroke={active ? "white" : "#4B5563"} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const icons: Record<string, (props: IconProps) => JSX.Element> = {
  dashboard: DashboardIcon,
  crm: CRMIcon,
  revenue: RevenueIcon,
  operations: OperationsIcon,
  report: ReportIcon,
  inventory: InventoryIcon,
  settings: SettingsIcon,
};

interface SidebarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function Sidebar({ activeTab = "dashboard", onTabChange }: SidebarProps) {
  const navItems: NavItem[] = [
    { id: "dashboard", label: "Dashboard", icon: DashboardIcon },
    { id: "crm", label: "CRM", icon: CRMIcon },
    { id: "revenue", label: "Revenue", icon: RevenueIcon },
    { id: "operations", label: "Operations", icon: OperationsIcon },
    { id: "report", label: "Report", icon: ReportIcon },
    { id: "inventory", label: "Inventory", icon: InventoryIcon },
    { id: "settings", label: "Settings", icon: SettingsIcon },
  ];

  return (
    <nav className="flex flex-col items-center py-4 px-4 gap-3 bg-white rounded-3xl shadow-md w-[80px] h-[560px] ml-2 mt-4 sticky top-0">
      {navItems.map((item) => {
        const isActive = item.id === activeTab;
        const IconComponent = icons[item.id];

        return (
          <button
            key={item.id}
            onClick={() => onTabChange?.(item.id)}
            className={`
              flex flex-col items-center justify-center w-12 h-12 rounded-2xl cursor-pointer transition-all duration-200 gap-1
              ${isActive
                ? "bg-[#FF7847] text-white"
                : "text-gray-600 hover:bg-gray-100"
              }
            `}
          >
            <IconComponent active={isActive} />
            <span className={`text-[8px] font-medium leading-none ${isActive ? "text-white" : "text-gray-500"}`}>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}