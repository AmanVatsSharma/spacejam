"use client";

/**
 * File:        apps/web/src/components/ui/confirm-dialog.tsx
 * Module:      Web · Shared UI
 * Purpose:     Tiny confirmation modal — replaces window.confirm with proper UI
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-19
 */

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "primary",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  const handleConfirm = async () => {
    await onConfirm();
  };

  const confirmCls =
    variant === "danger"
      ? "bg-red-500 hover:bg-red-600 text-white"
      : "bg-orange-500 hover:bg-orange-600 text-white";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onCancel}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {description && <p className="text-sm text-gray-500 mt-1.5">{description}</p>}
        </div>
        <div className="px-6 py-4 flex justify-end gap-2 bg-gray-50">
          <button
            type="button"
            onClick={onCancel}
            className="bg-white hover:bg-gray-100 text-gray-700 text-sm font-medium py-2 px-5 rounded-lg border border-gray-200 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={`${confirmCls} text-sm font-medium py-2 px-5 rounded-lg transition-colors`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
