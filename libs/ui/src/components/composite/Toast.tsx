/**
 * File:        libs/ui/src/components/composite/Toast.tsx
 * Module:      Libs · UI · Composite
 * Purpose:     Toast notification system with auto-dismiss and animations
 *
 * Features:
 *   - Multiple toast types (success, error, warning, info)
 *   - Auto-dismiss with progress bar
 *   - Slide-in animations
 *   - Container for multiple toasts
 *   - useToast hook for state management
 *
 * Design System Colors:
 *   - Success: #10B981 (bg: #ECFDF5)
 *   - Error: #EF4444 (bg: #FEF2F2)
 *   - Warning: #F59E0B (bg: #FFFBEB)
 *   - Info: #FF6A2F (bg: #FFF7ED)
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-07
 */

"use client";

import * as React from "react";
import { cn } from "../../lib/utils";
import { createPortal } from "react-dom";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastData {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastProps {
  type: ToastType;
  title: string;
  message?: string;
  onDismiss: () => void;
  duration?: number;
  className?: string;
}

// ---------------------------------------------------------------------------
// Toast style configurations
// ---------------------------------------------------------------------------

const toastStyles: Record<
  ToastType,
  { icon: string; bg: string; border: string; iconColor: string }
> = {
  success: {
    icon: "✓",
    bg: "#ECFDF5",
    border: "#10B981",
    iconColor: "#10B981",
  },
  error: {
    icon: "✕",
    bg: "#FEF2F2",
    border: "#EF4444",
    iconColor: "#EF4444",
  },
  warning: {
    icon: "⚠",
    bg: "#FFFBEB",
    border: "#F59E0B",
    iconColor: "#F59E0B",
  },
  info: {
    icon: "ℹ",
    bg: "#FFF7ED",
    border: "#FF6A2F",
    iconColor: "#FF6A2F",
  },
};

// ---------------------------------------------------------------------------
// Individual Toast Component
// ---------------------------------------------------------------------------

export const Toast = ({
  type = "info",
  title,
  message,
  onDismiss,
  duration = 5000,
  className,
}: ToastProps) => {
  const [isExiting, setIsExiting] = React.useState(false);
  const [progress, setProgress] = React.useState(100);

  const style = toastStyles[type];

  // Auto-dismiss timer
  React.useEffect(() => {
    if (duration <= 0) return;

    const startTime = Date.now();

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);

      if (remaining <= 0) {
        handleDismiss();
      } else {
        requestAnimationFrame(updateProgress);
      }
    };

    const frameId = requestAnimationFrame(updateProgress);
    return () => cancelAnimationFrame(frameId);
  }, [duration]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(onDismiss, 200);
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border bg-white shadow-lg",
        className
      )}
      style={{
        borderLeftWidth: "4px",
        borderLeftColor: style.border,
        backgroundColor: style.bg,
        animation: isExiting
          ? "slideOut 0.2s ease-in forwards"
          : "slideIn 0.3s ease-out",
      }}
    >
      <div className="flex items-start gap-3 p-4">
        {/* Icon indicator */}
        <div
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-bold"
          style={{ color: style.iconColor }}
        >
          {style.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-[#1F1F1F] text-sm">{title}</h4>
          {message && (
            <p className="mt-1 text-sm text-[#4A5565]">{message}</p>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="shrink-0 p-1 text-[#6A7282] hover:text-[#1F1F1F] transition-colors"
          aria-label="Dismiss"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Progress bar */}
      {duration > 0 && (
        <div
          className="h-1 w-full"
          style={{
            backgroundColor: style.border,
            opacity: 0.3,
          }}
        >
          <div
            className="h-full transition-all duration-100 ease-linear"
            style={{
              width: `${progress}%`,
              backgroundColor: style.border,
            }}
          />
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Toast Container Component
// ---------------------------------------------------------------------------

export interface ToastContainerProps {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
}

export const ToastContainer = ({ toasts, onDismiss }: ToastContainerProps) => {
  const [containerRef, setContainerRef] = React.useState<HTMLElement | null>(null);

  React.useEffect(() => {
    if (typeof document !== "undefined") {
      setContainerRef(document.body);
    }
  }, []);

  if (!containerRef || toasts.length === 0) return null;

  return createPortal(
    <div className="fixed right-4 top-4 z-[100] flex w-80 flex-col gap-3">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          type={toast.type}
          title={toast.title}
          message={toast.message}
          duration={toast.duration}
          onDismiss={() => onDismiss(toast.id)}
        />
      ))}
      {/* Inject animations */}
      <style>
        {`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateX(100%);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          @keyframes slideOut {
            from {
              opacity: 1;
              transform: translateX(0);
            }
            to {
              opacity: 0;
              transform: translateX(100%);
            }
          }
        `}
      </style>
    </div>,
    containerRef
  );
};

// ---------------------------------------------------------------------------
// useToast Hook
// ---------------------------------------------------------------------------

interface UseToastReturn {
  toasts: ToastData[];
  showToast: (
    type: ToastType,
    title: string,
    message?: string,
    duration?: number
  ) => string;
  dismissToast: (id: string) => void;
}

export function useToast(): UseToastReturn {
  const [toasts, setToasts] = React.useState<ToastData[]>([]);

  const showToast = React.useCallback(
    (
      type: ToastType,
      title: string,
      message?: string,
      duration: number = 5000
    ): string => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

      setToasts((prev) => [
        ...prev,
        {
          id,
          type,
          title,
          message,
          duration,
        },
      ]);

      return id;
    },
    []
  );

  const dismissToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return {
    toasts,
    showToast,
    dismissToast,
  };
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

// (Toast, ToastContainer, useToast are already exported above)