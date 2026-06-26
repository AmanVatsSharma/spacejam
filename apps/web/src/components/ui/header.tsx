/**
 * File:        apps/web/src/components/ui/header.tsx
 * Module:      Web · UI · Header
 * Purpose:     Top header with logo, contextual nav pills, and user profile
 *              dropdown. The center pill nav is driven by the active route —
 *              see `dashboard/layout.tsx` for the route → tabs mapping.
 *
 * Exports:
 *   - Header — top header component
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-20
 */

"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Logo from "@/assets/logo.png";

export interface HeaderTab {
  /** Stable id used to derive the active state from the URL. */
  id: string;
  /** Visible label, e.g. "Invoices". */
  label: string;
  /** Route to push when the tab is clicked. */
  href: string;
}

export interface HeaderUser {
  /** Display name. Falls back to the email if not provided. */
  name: string;
  /** Optional email — used to compute initials and the alt text. */
  email?: string;
  /** Display role label (e.g. "Center Manager"). */
  role: string;
  /** Called when the user picks "Log out" from the dropdown. */
  onLogout?: () => void;
}

interface HeaderProps {
  /** Tabs to render in the center pill. Empty array hides the pill. */
  tabs?: HeaderTab[];
  /**
   * Active tab id. If omitted, the header derives it from the current path
   * by matching each tab's `href` as a prefix of `window.location.pathname`.
   */
  activeTabId?: string;
  /** Called when a tab is clicked. If omitted, the header navigates via `tabs[i].href`. */
  onTabChange?: (tab: HeaderTab) => void;
  onSetUpNewCenter?: () => void;
  /** When true, the "Set Up New Center" button is hidden. */
  hideSetUpButton?: boolean;
  /** When provided, the user profile card surfaces the real user and a dropdown with "Log out". */
  user?: HeaderUser;
}

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Admin",
  SUPER_ADMIN: "Super Admin",
  CENTER_MANAGER: "Center Manager",
  MEMBER: "Member",
};

export function Header({ tabs = [], activeTabId, onTabChange, onSetUpNewCenter, hideSetUpButton = false, user }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const notifMenuRef = useRef<HTMLDivElement | null>(null);

  // Close menus on outside click.
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (showUserMenu && userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      if (showNotifications && notifMenuRef.current && !notifMenuRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showUserMenu, showNotifications]);

  const displayName = user?.name ?? "Guest";
  const displayRole = user?.role
    ? ROLE_LABEL[user.role] ?? user.role
    : "Sign in";
  const initials = displayName
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="h-[83px] flex justify-between items-center px-8 compact:px-4 bg-[#FBF6F4] sticky top-0 z-50">
      {/* Logo */}
      <div className="w-[120px] h-[50px] compact:w-[100px] compact:h-[40px]">
        <Image
          src={Logo}
          alt="SpaceJam Logo"
          width={120}
          height={50}
          className="object-contain"
        />
      </div>

      {/* Center Navigation - Pill style from Figma */}
      {tabs.length > 0 && (
        <nav className="flex items-center gap-1 bg-white border border-[#E5E7EB] rounded-full px-2 py-1.5">
          {tabs.map((tab) => {
            const isActive = activeTabId === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (onTabChange) onTabChange(tab);
                  else if (typeof window !== "undefined") window.location.href = tab.href;
                }}
                className={`
                  px-4 py-1.5 compact:px-3 compact:py-1 rounded-full text-sm compact:text-xs font-medium transition-all duration-200
                  ${isActive
                    ? "bg-[#FFF5F1] text-[#FF6A2F]"
                    : "text-[#4A5565] hover:bg-gray-50"
                  }
                `}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      )}

      {/* Set Up New Center Button */}
      {!hideSetUpButton && (
        <button
          onClick={onSetUpNewCenter}
          className="flex items-center gap-2 px-4 py-2.5 compact:px-2.5 bg-[#FF6A2F] text-white rounded-xl font-medium text-sm hover:bg-[#E55A26] transition-colors shadow-sm"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="8" y1="2" x2="8" y2="14" />
            <line x1="2" y1="8" x2="14" y2="8" />
          </svg>
          <span className="compact:hidden">Set Up New Center</span>
        </button>
      )}

      {/* Notifications & User Profile */}
      <div className="flex items-center gap-3">
        {/* Notification Icon */}
        <div className="relative" ref={notifMenuRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
            className="relative w-11 h-11 flex items-center justify-center bg-white rounded-full shadow-[0px_1px_2px_rgba(0,0,0,0.1)] hover:bg-gray-50 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#4A5565" strokeWidth="1.5">
              <path d="M10 2C7.24 2 5 4.24 5 7V10L3 12V13H17V12L15 10V7C15 4.24 12.76 2 10 2Z" />
              <path d="M8 13V14C8 15.1 8.9 16 10 16C11.1 16 12 15.1 12 14V13" />
            </svg>
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#FF7847] rounded-full flex items-center justify-center text-[10px] font-bold text-white">
              3
            </span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-14 w-80 rounded-2xl border border-[#E5E7EB] bg-white py-2 shadow-xl z-50">
              <div className="flex justify-between items-center px-4 py-3 border-b border-[#F3F4F6]">
                <span className="font-bold text-[#1F2937] text-sm">Notifications</span>
                <button className="text-xs text-[#FF6A2F] hover:underline font-medium">Mark all read</button>
              </div>
              <div className="flex flex-col max-h-[320px] overflow-y-auto">
                {/* Example short notification items */}
                <div className="px-4 py-3 border-b border-[#F3F4F6] hover:bg-gray-50 cursor-pointer flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#FFF2EA] text-[#FF6A2F] flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 8h6m-6 4h6m-6 4h6M6 4h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1F2937]">Deposit Release Approval</p>
                    <p className="text-[13px] text-[#6B7280] mt-0.5 leading-snug">Tech Innovators Pvt Ltd • ₹50,000</p>
                    <p className="text-xs text-[#FF6A2F] mt-1.5 font-medium">5 min ago</p>
                  </div>
                </div>
                <div className="px-4 py-3 border-b border-[#F3F4F6] hover:bg-gray-50 cursor-pointer flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#FFF2EA] text-[#FF6A2F] flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1F2937]">Invoice Overdue</p>
                    <p className="text-[13px] text-[#6B7280] mt-0.5 leading-snug">DataStream Solutions • INV-2026-1234</p>
                    <p className="text-xs text-[#FF6A2F] mt-1.5 font-medium">12 min ago</p>
                  </div>
                </div>
                <div className="px-4 py-3 border-b border-[#F3F4F6] hover:bg-gray-50 cursor-pointer flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#FFF2EA] text-[#FF6A2F] flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1F2937]">Occupancy Alert</p>
                    <p className="text-[13px] text-[#6B7280] mt-0.5 leading-snug">Center occupancy dropped to 76%</p>
                    <p className="text-xs text-[#FF6A2F] mt-1.5 font-medium">1 hour ago</p>
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 border-t border-[#F3F4F6] text-center bg-white rounded-b-2xl">
                <Link 
                  href="/dashboard/notifications" 
                  onClick={() => setShowNotifications(false)}
                  className="text-sm font-semibold text-[#FF6A2F] hover:underline"
                >
                  View all notifications
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Card */}
        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setShowUserMenu((v) => !v)}
            className="flex items-center h-11 px-1 bg-white rounded-full shadow-[0px_1px_2px_rgba(0,0,0,0.1)] hover:bg-gray-50 transition-colors"
            aria-haspopup="menu"
            aria-expanded={showUserMenu}
          >
            {/* Avatar with initials */}
            <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-[#FF6A2F] flex items-center justify-center text-xs font-semibold text-white">
              <span>{initials || "SJ"}</span>
            </div>

            {/* User Info */}
            <div className="flex flex-col justify-center px-3 h-9 compact:hidden text-left">
              <span className="text-sm font-semibold text-[#1F2937] leading-[17px]">{displayName}</span>
              <span className="text-xs font-normal text-[#6B7280] leading-[15px]">{displayRole}</span>
            </div>

            {/* Dropdown Arrow */}
            <span className="w-8 h-8 flex items-center justify-center flex-shrink-0">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#9CA3AF" strokeWidth="1.5">
                <path d="M3 4.5L6 7.5L9 4.5" />
              </svg>
            </span>
          </button>

          {showUserMenu && (
            <div
              role="menu"
              className="absolute right-0 top-12 w-56 rounded-2xl border border-[#E5E7EB] bg-white py-1 shadow-lg z-50"
            >
              <div className="border-b border-[#F3F4F6] px-4 py-3">
                <p className="text-sm font-semibold text-[#1F2937]">{displayName}</p>
                <p className="text-xs text-[#6B7280]">{user?.email ?? "Signed in"}</p>
              </div>
              {user?.onLogout && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setShowUserMenu(false);
                    user.onLogout?.();
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-[#EF4444] hover:bg-[#FEF2F2]"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Log out
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}