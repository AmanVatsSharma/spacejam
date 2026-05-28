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

import React from "react";

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
}

const DashboardIcon = () => (
  <svg width="16" height="18" viewBox="0 0 16 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 9H8M1 1H15V15H1V1ZM8 17H15V9H8V17Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CRMIcon = () => (
  <svg width="22" height="20" viewBox="0 0 22 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="11" cy="8" r="4" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M2 17C2 13.6863 6.02944 11 11 11C15.9706 11 20 13.6863 20 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const RevenueIcon = () => (
  <svg width="16" height="18" viewBox="0 0 16 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 1V17M8 1L5 4M8 1L11 4M8 17L5 14M8 17L11 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const OperationsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="1" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M5 9H13M5 5H13M5 13H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const ReportIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 15V5C3 3.89543 3.89543 3 5 3H11L15 7V15C15 16.1046 14.1046 17 13 17H5C3.89543 17 3 16.1046 3 15Z" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M11 7H6M11 11H6M11 15H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const InventoryIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 1L17 6V12L9 17L1 12V6L9 1Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
  </svg>
);

const SettingsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M9 1V3M9 15V17M17 9H15M3 9H1M14.95 3.05L13.54 4.46M4.46 13.54L3.05 14.95M14.95 14.95L13.54 13.54M4.46 4.46L3.05 3.05" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
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
    { id: "inventory", label: "Inventory", icon: <InventoryIcon />, active: true },
    { id: "settings", label: "Settings", icon: <SettingsIcon /> },
  ];

  return (
    <nav className="flex flex-col items-start py-4 px-4 gap-3 bg-white rounded-3xl shadow-sm w-[80px] h-[560px]">
      <div className="flex flex-col gap-3 self-stretch">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange?.(item.id)}
            className={`
              flex flex-col items-center justify-center w-12 h-12 rounded-2xl cursor-pointer transition-all duration-200
              ${item.active
                ? "bg-[#FF7847] text-white"
                : "text-gray-600 hover:bg-gray-100"
              }
            `}
          >
            {item.icon}
            <span className="text-[8px] mt-1">{item.label}</span>
          </button>
        ))}
      </div>
      <div className="h-px bg-gray-200 self-stretch" />
      <button className="flex flex-col items-center justify-center w-12 h-12">
        <SettingsIcon />
        <span className="text-[8px] mt-1 text-gray-400">Settings</span>
      </button>
    </nav>
  );
}
