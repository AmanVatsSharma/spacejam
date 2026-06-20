/**
 * File:        apps/web/src/components/ui/action-menu.tsx
 * Module:      Web · UI · ActionMenu
 * Purpose:     Lightweight popover menu used by table row actions and
 *              anywhere a compact "..." menu needs a list of choices.
 *              Closes on outside click and on Escape.
 *
 * Exports:
 *   - ActionMenu — trigger + popover
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-20
 */
"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export interface ActionMenuItem {
  label: string;
  onClick?: () => void;
  /** Visually mark the item as destructive (red text). */
  destructive?: boolean;
  /** Render as a non-interactive divider instead of a clickable item. */
  divider?: boolean;
}

interface ActionMenuProps {
  items: ActionMenuItem[];
  /** The element that opens the menu on click. */
  trigger: ReactNode;
  /** Where to anchor the popover relative to the trigger. */
  align?: "left" | "right";
}

export function ActionMenu({ items, trigger, align = "right" }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative inline-block">
      <span
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((v) => !v);
          }
        }}
        className="inline-flex cursor-pointer"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {trigger}
      </span>

      {open && (
        <div
          role="menu"
          className={`absolute z-50 mt-1 min-w-[160px] rounded-xl border border-gray-100 bg-white py-1 shadow-lg ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {items.map((item, i) =>
            item.divider ? (
              <div key={`divider-${i}`} className="my-1 h-px bg-gray-100" role="separator" />
            ) : (
              <button
                key={`${item.label}-${i}`}
                type="button"
                role="menuitem"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  item.onClick?.();
                }}
                className={`block w-full px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50 ${
                  item.destructive ? "text-[#EF4444]" : "text-[#101828]"
                }`}
              >
                {item.label}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}

export default ActionMenu;
