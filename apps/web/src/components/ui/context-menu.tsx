/**
 * File:        apps/web/src/components/ui/context-menu.tsx
 * Module:      Web · UI · Context Menu
 * Purpose:     Right-click context menu triggered by native onContextMenu
 *              event. Lightweight alternative to shadcn/radix — zero deps.
 *
 * Usage:
 *   const [menu, setMenu] = useState<{x: number, y: number} | null>(null);
 *   <div onContextMenu={(e) => { e.preventDefault(); setMenu({x: e.clientX, y: e.clientY}); }}>
 *     Right-click me
 *     {menu && <ContextMenu x={menu.x} y={menu.y} onClose={() => setMenu(null)} items={[...]} />}
 *   </div>
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-19
 */

"use client";

import React, { useEffect, useRef } from "react";

export interface ContextMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
  divider?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  items: ContextMenuItem[];
}

export function ContextMenu({ x, y, onClose, items }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  // Keep menu within viewport
  const style: React.CSSProperties = {
    position: "fixed",
    left: x,
    top: y,
    zIndex: 9999,
  };

  return (
    <div
      ref={ref}
      className="min-w-[180px] bg-white rounded-lg shadow-lg border border-gray-200 py-1"
      style={style}
      role="menu"
    >
      {items.map((item, i) =>
        item.divider ? (
          <div key={i} className="my-1 border-t border-gray-100" />
        ) : (
          <button
            key={i}
            role="menuitem"
            disabled={item.disabled}
            onClick={() => {
              if (!item.disabled) {
                item.onClick();
                onClose();
              }
            }}
            className={[
              "w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left",
              "transition-colors duration-100",
              item.destructive
                ? "text-red-600 hover:bg-red-50"
                : "text-gray-700 hover:bg-gray-100",
              item.disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer",
            ].join(" ")}
          >
            {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
            <span>{item.label}</span>
          </button>
        )
      )}
    </div>
  );
}
