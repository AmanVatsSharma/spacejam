/**
 * File:        apps/web/src/components/ui/header.tsx
 * Module:      Web · UI · Header
 * Purpose:     Top header with logo, nav buttons, and user profile
 *
 * Exports:
 *   - Header — top header component
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-05-29
 */

"use client";

import { useState } from "react";
import Image from "next/image";
import Logo from "@/assets/logo.png";
import Avatar from "@/assets/avatar.png";

interface HeaderProps {
  activeNav?: "location" | "floor-map" | "table-view";
  onNavChange?: (nav: "location" | "floor-map" | "table-view") => void;
  onSetUpNewCenter?: () => void;
}

export function Header({ activeNav = "table-view", onNavChange, onSetUpNewCenter }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="h-[83px] flex justify-between items-center px-8 bg-[#FBF6F4] sticky top-0 z-50">
      {/* Logo */}
      <div className="w-[120px] h-[50px]">
        <Image
          src={Logo}
          alt="SpaceJam Logo"
          width={120}
          height={50}
          className="object-contain"
        />
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

      {/* Set Up New Center Button */}
      <button
        onClick={onSetUpNewCenter}
        className="flex items-center gap-2 px-4 py-2.5 bg-[#FF6A2F] text-white rounded-xl font-medium text-sm hover:bg-[#E55A26] transition-colors shadow-sm"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <line x1="8" y1="2" x2="8" y2="14" />
          <line x1="2" y1="8" x2="14" y2="8" />
        </svg>
        Set Up New Center
      </button>

      {/* Notifications & User Profile */}
      <div className="flex items-center gap-3">
        {/* Notification Icon */}
        <button
          onClick={() => setShowNotifications(!showNotifications)}
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

        {/* User Profile Card - Figma exact dimensions */}
        <div className="flex items-center h-11 px-1 bg-white rounded-full shadow-[0px_1px_2px_rgba(0,0,0,0.1)]">
          {/* Avatar - 36x36px */}
          <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0">
            <Image
              src={Avatar}
              alt="User Avatar"
              width={36}
              height={36}
              className="object-cover"
            />
          </div>

          {/* User Info */}
          <div className="flex flex-col justify-center px-3 h-9">
            <span className="text-sm font-semibold text-[#1F2937] leading-[17px]">Rahul Sharma</span>
            <span className="text-xs font-normal text-[#6B7280] leading-[15px]">Center Manager</span>
          </div>

          {/* Dropdown Arrow */}
          <button className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 rounded-full transition-colors flex-shrink-0">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#9CA3AF" strokeWidth="1.5">
              <path d="M3 4.5L6 7.5L9 4.5" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
