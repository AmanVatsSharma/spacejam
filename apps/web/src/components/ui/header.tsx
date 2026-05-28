/**
 * File:        apps/web/src/components/ui/header.tsx
 * Module:      Web · UI · Header
 * Purpose:     Top header with logo, nav buttons, and user profile
 *
 * Exports:
 *   - Header — top header component
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-05-28
 */

"use client";

import { useState } from "react";

interface HeaderProps {
  activeNav?: "location" | "floor-map" | "table-view";
  onNavChange?: (nav: "location" | "floor-map" | "table-view") => void;
}

export function Header({ activeNav = "table-view", onNavChange }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="h-[83px] flex justify-between items-center px-8 bg-white shadow-sm sticky top-0 z-50">
      {/* Logo */}
      <div className="w-[103px] h-[51px] bg-gradient-to-br from-[#FF7847] to-[#FF6A3D] rounded-xl flex items-center justify-center shadow-md">
        <span className="text-white font-bold text-lg tracking-tight">SpaceJam</span>
      </div>

      {/* Center Navigation - Pill style from Figma */}
      <nav className="flex items-center gap-1 bg-[#F3F4F6] rounded-full px-1 py-1">
        <button
          onClick={() => onNavChange?.("location")}
          className={`
            px-5 py-2 rounded-full text-sm font-medium transition-all duration-200
            ${activeNav === "location"
              ? "bg-[#FFF7ED] text-[#FF7847] underline underline-offset-4"
              : "text-[#4A5565] hover:bg-white"
            }
          `}
        >
          Location
        </button>
        <button
          onClick={() => onNavChange?.("floor-map")}
          className={`
            px-5 py-2 rounded-full text-sm font-medium transition-all duration-200
            ${activeNav === "floor-map"
              ? "bg-[#FFF7ED] text-[#FF7847] underline underline-offset-4"
              : "text-[#4A5565] hover:bg-white"
            }
          `}
        >
          Floor map
        </button>
        <button
          onClick={() => onNavChange?.("table-view")}
          className={`
            px-5 py-2 rounded-full text-sm font-medium transition-all duration-200
            ${activeNav === "table-view"
              ? "bg-[#FFF7ED] text-[#FF7847] underline underline-offset-4"
              : "text-[#4A5565] hover:bg-white"
            }
          `}
        >
          Table view
        </button>
      </nav>

      {/* User Profile Card - Figma style */}
      <div className="flex items-center gap-3">
        {/* Notification Icon */}
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative w-11 h-11 flex items-center justify-center bg-white rounded-full border border-gray-100 hover:bg-gray-50 transition-colors shadow-sm"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#4A5565" strokeWidth="1.5">
            <path d="M10 2C7.24 2 5 4.24 5 7V10L3 12V13H17V12L15 10V7C15 4.24 12.76 2 10 2Z" />
            <path d="M8 13V14C8 15.1 8.9 16 10 16C11.1 16 12 15.1 12 14V13" />
          </svg>
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#FF7847] rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
            3
          </span>
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 bg-white rounded-2xl px-3 py-2 border border-gray-100 shadow-sm">
          {/* Avatar */}
          <div className="w-11 h-11 bg-gradient-to-br from-[#FF7847] to-[#FF6A3D] rounded-full flex items-center justify-center shadow-sm">
            <span className="text-white font-semibold text-sm">RS</span>
          </div>

          {/* User Info */}
          <div className="flex flex-col items-start pr-3 border-r border-gray-200">
            <span className="text-sm font-semibold text-[#101828] leading-tight">Rahul Sharma</span>
            <span className="text-xs text-[#6A7282] leading-tight">Center Manager</span>
          </div>

          {/* Dropdown Arrow */}
          <button className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#99A1AF" strokeWidth="1.5">
              <path d="M4 6L8 10L12 6" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}