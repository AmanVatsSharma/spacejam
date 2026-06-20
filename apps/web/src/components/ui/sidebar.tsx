/**
 * File:        apps/web/src/components/ui/sidebar.tsx
 * Module:      Web · UI · Sidebar Navigation
 * Purpose:     Left sidebar with navigation icons for SpaceJam app
 *
 * Exports:
 *   - Sidebar — navigation component with Dashboard, CRM, Revenue, Operations, Floors, Report, Inventory, Settings, Changelog
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-05-29
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, type ComponentType } from "react";

interface NavItem {
  id: string;
  label: string;
  icon: ComponentType<{ active?: boolean }>;
  href: string;
}

interface IconProps {
  active?: boolean;
}

const DashboardIcon = ({ active }: IconProps) => (
  <svg width="16" height="18" viewBox="0 0 16 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="1" width="6" height="6" rx="1" stroke={active ? "#FFFFFF" : "#4B5563"} strokeWidth="1.5"/>
    <rect x="9" y="1" width="6" height="6" rx="1" stroke={active ? "#FFFFFF" : "#4B5563"} strokeWidth="1.5"/>
    <rect x="1" y="9" width="6" height="6" rx="1" stroke={active ? "#FFFFFF" : "#4B5563"} strokeWidth="1.5"/>
    <rect x="9" y="9" width="6" height="6" rx="1" stroke={active ? "#FFFFFF" : "#4B5563"} strokeWidth="1.5"/>
  </svg>
);

const CRMIcon = ({ active }: IconProps) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="9" cy="6" r="3" stroke={active ? "#FFFFFF" : "#4B5563"} strokeWidth="1.5"/>
    <path d="M3 15C3 12.24 5.79 10 9 10C12.21 10 15 12.24 15 15" stroke={active ? "#FFFFFF" : "#4B5563"} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const RevenueIcon = ({ active }: IconProps) => (
  <svg width="16" height="18" viewBox="0 0 16 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 2V16" stroke={active ? "#FFFFFF" : "#4B5563"} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M8 2L5 5M8 2L11 5" stroke={active ? "#FFFFFF" : "#4B5563"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 16L5 13M8 16L11 13" stroke={active ? "#FFFFFF" : "#4B5563"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const OperationsIcon = ({ active }: IconProps) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 6H15M3 9H15M3 12H15" stroke={active ? "#FFFFFF" : "#4B5563"} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const ReportIcon = ({ active }: IconProps) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 3V15H15" stroke={active ? "#FFFFFF" : "#4B5563"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 3L9 9L15 3" stroke={active ? "#FFFFFF" : "#4B5563"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6 12H12" stroke={active ? "#FFFFFF" : "#4B5563"} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const InventoryIcon = ({ active }: IconProps) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="12" height="12" rx="2" stroke={active ? "#FFFFFF" : "#4B5563"} strokeWidth="1.5"/>
    <path d="M7 9H11M9 7V11" stroke={active ? "#FFFFFF" : "#4B5563"} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const LocationIcon = ({ active }: IconProps) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 2C6.79 2 5 3.79 5 6C5 9 9 14 9 14C9 14 13 9 13 6C13 3.79 11.21 2 9 2Z" stroke={active ? "#FFFFFF" : "#4B5563"} strokeWidth="1.5"/>
    <circle cx="9" cy="6" r="2" stroke={active ? "#FFFFFF" : "#4B5563"} strokeWidth="1.5"/>
  </svg>
);

const SettingsIcon = ({ active }: IconProps) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="9" cy="9" r="2.5" stroke={active ? "#FFFFFF" : "#4B5563"} strokeWidth="1.5"/>
    <path d="M9 1V3M9 15V17M17 9H15M3 9H1M14.85 3.15L13.44 4.56M4.56 13.44L3.15 14.85M14.85 14.85L13.44 13.44M4.56 4.56L3.15 3.15" stroke={active ? "#FFFFFF" : "#4B5563"} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const FloorIcon = ({ active }: IconProps) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="2" width="12" height="14" rx="2" stroke={active ? "#FFFFFF" : "#4B5563"} strokeWidth="1.5"/>
    <path d="M3 6H15M3 10H15M3 14H15" stroke={active ? "#FFFFFF" : "#4B5563"} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M7 2V6M11 2V6" stroke={active ? "#FFFFFF" : "#4B5563"} strokeWidth="1.5"/>
  </svg>
);

const BookingsIcon = ({ active }: IconProps) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="4" width="12" height="11" rx="2" stroke={active ? "#FFFFFF" : "#4B5563"} strokeWidth="1.5"/>
    <path d="M3 8H15" stroke={active ? "#FFFFFF" : "#4B5563"} strokeWidth="1.5"/>
    <path d="M6 2V5M12 2V5" stroke={active ? "#FFFFFF" : "#4B5563"} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M7 11L9 13L11 11" stroke={active ? "#FFFFFF" : "#4B5563"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ChangelogIcon = ({ active }: IconProps) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 4.5C3 3.67 3.67 3 4.5 3H7L8.5 5H13.5C14.33 5 15 5.67 15 6.5V13.5C15 14.33 14.33 15 13.5 15H4.5C3.67 15 3 14.33 3 13.5V4.5Z" stroke={active ? "#FFFFFF" : "#4B5563"} strokeWidth="1.5" strokeLinejoin="round"/>
    <circle cx="7" cy="10" r="0.9" fill={active ? "#FFFFFF" : "#4B5563"}/>
    <circle cx="9" cy="10" r="0.9" fill={active ? "#FFFFFF" : "#4B5563"}/>
    <circle cx="11" cy="10" r="0.9" fill={active ? "#FFFFFF" : "#4B5563"}/>
  </svg>
);

const icons: Record<string, (props: IconProps) => ReactNode> = {
  dashboard: DashboardIcon,
  crm: CRMIcon,
  revenue: RevenueIcon,
  operations: OperationsIcon,
  report: ReportIcon,
  inventory: InventoryIcon,
  location: LocationIcon,
  floors: FloorIcon,
  bookings: BookingsIcon,
  changelog: ChangelogIcon,
  settings: SettingsIcon,
};

interface SidebarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function Sidebar({ activeTab = "dashboard", onTabChange }: SidebarProps) {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    { id: "dashboard", label: "Dashboard", icon: DashboardIcon, href: "/dashboard" },
    { id: "crm", label: "CRM", icon: CRMIcon, href: "/dashboard/crm" },
    { id: "revenue", label: "Revenue", icon: RevenueIcon, href: "/dashboard/revenue" },
    { id: "operations", label: "Operations", icon: OperationsIcon, href: "/dashboard/operations" },
    { id: "bookings", label: "Bookings", icon: BookingsIcon, href: "/dashboard/bookings" },
    { id: "floors", label: "Floors", icon: FloorIcon, href: "/dashboard/floors" },
    { id: "report", label: "Report", icon: ReportIcon, href: "/dashboard/report" },
    { id: "inventory", label: "Inventory", icon: InventoryIcon, href: "/dashboard/inventory" },
    { id: "location", label: "Location", icon: LocationIcon, href: "/dashboard/location" },
    { id: "changelog", label: "What's new", icon: ChangelogIcon, href: "/changelog" },
    { id: "settings", label: "Settings", icon: SettingsIcon, href: "/dashboard/settings" },
  ];

  const getActiveFromPath = (href: string) => {
    if (pathname === href) return true;
    if (href !== "/dashboard" && pathname.startsWith(href)) return true;
    // /dashboard/revenue is the legacy alias for /dashboard/invoices; highlight it there.
    if (href === "/dashboard/revenue" && pathname.startsWith("/dashboard/invoices")) return true;
    return false;
  };

  return (
    <nav className="flex flex-col items-center py-4 px-3 compact:py-3 compact:px-2 bg-white rounded-3xl shadow-[0px_1px_2px_rgba(0,0,0,0.1)] w-[80px] compact:w-[64px] h-[560px] compact:h-[480px] ml-2 mt-4 sticky top-0" style={{ overscrollBehavior: 'contain' }}>
      <div className="flex flex-col items-center gap-3 compact:gap-1.5 w-full overflow-y-auto scrollbar-hide" style={{ overscrollBehavior: 'contain' }}>
        {navItems.map((item) => {
          const isActive = onTabChange ? item.id === activeTab : getActiveFromPath(item.href);
          const IconComponent = icons[item.id];

          return (
            <div key={item.id} className="flex flex-col items-center gap-1">
              <Link
                href={item.href}
                onClick={() => onTabChange?.(item.id)}
                className={`
                  flex items-center justify-center w-[48px] h-[48px] compact:w-[40px] compact:h-[40px] rounded-2xl cursor-pointer transition-all duration-200 no-underline
                  ${isActive
                    ? "bg-[#FF7847] text-white"
                    : "bg-[#F3F4F6] text-[#4B5563] hover:bg-gray-200"
                  }
                `}
              >
                <IconComponent active={isActive} />
              </Link>
              <span className={`text-[10px] compact:text-[9px] font-medium leading-none text-center ${isActive ? "text-[#FF7847]" : "text-[#4B5563]"}`}>
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </nav>
  );
}
