/**
 * File:        libs/ui/src/components/composite/Dialog.tsx
 * Module:      Libs · UI · Composite
 * Purpose:     Modal/Dialog component with accessibility features and animations
 *
 * Features:
 *   - Portal rendering to body
 *   - Focus trapping within dialog
 *   - Close on Escape key
 *   - Close on overlay click (configurable)
 *   - Prevent body scroll when open
 *   - Entrance animations (scale + opacity)
 *   - Fully accessible (aria attributes)
 *   - Multiple size variants
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-07
 */

"use client";

import * as React from "react";
import { cn } from "../../lib/utils";
import { createPortal } from "react-dom";

export interface DialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Dialog title */
  title: string;
  /** Optional description */
  description?: string;
  /** Body content */
  children: React.ReactNode;
  /** Footer content (action buttons) */
  footer?: React.ReactNode;
  /** Size variant */
  size?: "sm" | "md" | "lg" | "xl";
  /** Close on overlay click */
  closeOnOverlay?: boolean;
  /** Additional classes for the dialog panel */
  className?: string;
}

const sizeClasses = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

const Dialog = React.forwardRef<HTMLDivElement, DialogProps>(
  (
    {
      open,
      onOpenChange,
      title,
      description,
      children,
      footer,
      size = "md",
      closeOnOverlay = true,
      className,
    },
    ref
  ) => {
    const [isAnimating, setIsAnimating] = React.useState(false);

    // Focus trapping
    const dialogRef = React.useRef<HTMLDivElement>(null);

    // Prevent body scroll
    React.useEffect(() => {
      if (open) {
        document.body.style.overflow = "hidden";
        return () => {
          document.body.style.overflow = "";
        };
      }
      return undefined;
    }, [open]);

    // Animation state
    React.useEffect(() => {
      if (open) {
        setIsAnimating(true);
        return undefined;
      } else {
        const timer = setTimeout(() => setIsAnimating(false), 200);
        return () => clearTimeout(timer);
      }
    }, [open]);

    // Focus management
    React.useEffect(() => {
      if (open && dialogRef.current) {
        const focusableElements = dialogRef.current.querySelectorAll(
          "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
        );
        const firstElement = focusableElements[0] as HTMLElement;

        if (firstElement) {
          firstElement.focus();
        }

        // Create focus trap
        const handleTab = (e: KeyboardEvent) => {
          if (e.key !== "Tab") return;

          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              lastElement?.focus();
              e.preventDefault();
            }
          } else {
            if (document.activeElement === lastElement) {
              firstElement?.focus();
              e.preventDefault();
            }
          }
        };

        dialogRef.current.addEventListener("keydown", handleTab);
        return () => {
          if (dialogRef.current) {
            dialogRef.current.removeEventListener("keydown", handleTab);
          }
        };
      }
      return undefined;
    }, [open]);

    // Close on Escape
    React.useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape" && open) {
          onOpenChange(false);
        }
      };

      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }, [open, onOpenChange]);

    const handleOverlayClick = () => {
      if (closeOnOverlay && open) {
        onOpenChange(false);
      }
    };

    if (!open) return null;

    return createPortal(
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{
          animation: "fadeIn 0.2s ease-out",
        }}
      >
        {/* Overlay */}
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={handleOverlayClick}
          style={{
            animation: "fadeIn 0.2s ease-out",
          }}
        />

        {/* Dialog */}
        <div
          ref={ref}
          className={cn(
            "relative bg-white rounded-2xl shadow-xl max-h-full flex flex-col",
            sizeClasses[size],
            className
          )}
          style={{
            animation: isAnimating
              ? "scaleIn 0.2s ease-out, fadeIn 0.2s ease-out"
              : "",
          }}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="dialog-title"
          aria-describedby={description ? "dialog-description" : undefined}
        >
          {/* Header */}
          <div className="flex-shrink-0 p-6 border-b border-[#E5E7EB] rounded-t-2xl">
            <h2
              id="dialog-title"
              className="text-xl font-semibold text-[#1F1F1F]"
            >
              {title}
            </h2>
            {description && (
              <p
                id="dialog-description"
                className="mt-2 text-sm text-[#4A5565]"
              >
                {description}
              </p>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="flex-shrink-0 p-6 border-t border-[#E5E7EB] rounded-b-2xl">
              {footer}
            </div>
          )}
        </div>

        {/* Inject styles for animations */}
        <style>
          {`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes scaleIn {
              from {
                opacity: 0;
                transform: scale(0.95);
              }
              to {
                opacity: 1;
                transform: scale(1);
              }
            }
          `}
        </style>
      </div>,
      document.body
    );
  }
);

Dialog.displayName = "Dialog";

export { Dialog };