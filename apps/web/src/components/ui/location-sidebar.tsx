/**
 * File:        apps/web/src/components/ui/location-sidebar.tsx
 * Module:      Web · UI · Location Sidebar
 * Purpose:     Right sidebar showing location hierarchy (City > Center)
 *
 * Exports:
 *   - LocationSidebar — right sidebar with location tree
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-05-28
 */

"use client";

import { useState, useEffect } from "react";

interface Location {
  id: string;
  name: string;
  centers: { id: string; name: string; selected?: boolean }[];
  expanded?: boolean;
}

interface LocationSidebarProps {
  locations: Location[];
  onLocationSelect?: (locationId: string, centerId?: string) => void;
  onAddSubLocation?: () => void;
}

export function LocationSidebar({ locations, onLocationSelect, onAddSubLocation }: LocationSidebarProps) {
  const [expandedLocations, setExpandedLocations] = useState<Record<string, boolean>>(
    Object.fromEntries(locations.map((l) => [l.id, l.expanded ?? false]))
  );

  useEffect(() => {
    setExpandedLocations(
      Object.fromEntries(locations.map((l) => [l.id, l.expanded ?? false]))
    );
  }, [locations]);

  const toggleLocation = (locationId: string) => {
    setExpandedLocations((prev) => ({
      ...prev,
      [locationId]: !prev[locationId],
    }));
    onLocationSelect?.(locationId);
  };

  return (
    <aside className="flex flex-col items-start py-6 px-6 compact:py-4 compact:px-3 compact:gap-3 bg-white rounded-2xl shadow-sm w-[320px] compact:w-[200px] h-[859px] compact:h-[480px] overflow-y-auto">
      <div className="flex flex-col gap-6 self-stretch">
        {locations.map((location) => (
          <div key={location.id} className="flex flex-col gap-2 self-stretch">
            {/* City Button */}
            <button
              onClick={() => toggleLocation(location.id)}
              className="flex items-center gap-2 w-[272px] compact:w-full h-[40px] compact:h-[36px] px-3 compact:px-2 rounded-xl bg-[#FFF5F2] hover:bg-[#FFEDE6] transition-all duration-200 text-sm compact:text-xs active:scale-[0.97]"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="#6A7282"
                strokeWidth="1.5"
              >
                <path d="M3 6L8 11L13 6" />
              </svg>
              <span className="text-sm font-medium text-gray-800">{location.name}</span>
            </button>

            {/* Centers (shown when expanded) */}
            {expandedLocations[location.id] && (
              <div className="flex flex-col gap-1 pl-6 transition-all duration-200 origin-top">
                {location.centers.map((center) => (
                  <button
                    key={center.id}
                    onClick={() => onLocationSelect?.(location.id, center.id)}
                    className={`
                      flex items-center gap-2 w-[325.8px] compact:w-full h-[40px] compact:h-[36px] px-3 compact:px-2 rounded-xl transition-colors text-left
                      ${center.selected
                        ? "bg-[#FFF5F2] text-[#FF6A3D] font-medium"
                        : "text-gray-500 hover:bg-gray-50"
                      }
                    `}
                  >
                    <span>•</span>
                    <span className={center.selected ? "text-[#FF6A3D]" : ""}>
                      {center.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Sub-location Button */}
      <button
        onClick={() => onAddSubLocation?.()}
        className="flex items-center justify-center gap-2 w-full h-[50px] bg-white border border-[#EAEAEA] rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all duration-200 active:scale-[0.97]">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M8 3V13M3 8H13" />
        </svg>
        <span>Add Sub-location</span>
      </button>
    </aside>
  );
}