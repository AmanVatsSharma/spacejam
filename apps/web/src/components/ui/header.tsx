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

import React from "react";

interface HeaderProps {
  activeNav?: "location" | "floor-map" | "table-view";
  onNavChange?: (nav: "location" | "floor-map" | "table-view") => void;
}

export function Header({ activeNav = "table-view", onNavChange }: HeaderProps) {
  return (
    <header className="flex justify-between items-center px-8 py-4">
      {/* Logo */}
      <div className="w-[103px] h-[51px] bg-[var(--color-primary)] rounded flex items-center justify-center">
        <span className="text-white font-bold text-lg">SpaceJam</span>
      </div>

      {/* Center Navigation */}
      <nav className="flex items-center gap-2 bg-white rounded-full px-2 py-1.5 shadow-sm">
        <button
          onClick={() => onNavChange?.("location")}
          className={`
            px-4 py-1.5 rounded-full text-sm font-medium transition-colors
            ${activeNav === "location"
              ? "bg-[#FFF7ED] text-[#FF7847] underline"
              : "text-gray-600 hover:bg-gray-50"
            }
          `}
        >
          Location
        </button>
        <button
          onClick={() => onNavChange?.("floor-map")}
          className={`
            px-4 py-1.5 rounded-full text-sm font-medium transition-colors
            ${activeNav === "floor-map"
              ? "bg-[#FFF7ED] text-[#FF7847] underline"
              : "text-gray-600 hover:bg-gray-50"
            }
          `}
        >
          Floor map
        </button>
        <button
          onClick={() => onNavChange?.("table-view")}
          className={`
            px-4 py-1.5 rounded-full text-sm font-medium transition-colors
            ${activeNav === "table-view"
              ? "bg-[#FFF7ED] text-[#FF7847] underline"
              : "text-gray-600 hover:bg-gray-50"
            }
          `}
        >
          Table view
        </button>
      </nav>

      {/* User Profile */}
      <div className="flex items-center bg-white rounded-full px-2 py-1 shadow-sm">
        <div className="w-9 h-9 bg-gray-300 rounded-full" />
        <div className="flex flex-col items-start px-2">
          <span className="text-sm font-semibold text-gray-800">Rahul Sharma</span>
          <span className="text-xs text-gray-500">Center Manager</span>
        </div>
        <button className="w-4 h-4 text-gray-400 ml-2">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 6L8 10L12 6" />
          </svg>
        </button>
        <div className="relative">
          <div className="w-5 h-5 bg-[#FF7847] rounded-full flex items-center justify-center ml-2">
            <span className="text-[10px] font-bold text-white">3</span>
          </div>
        </div>
      </div>
    </header>
  );
}
