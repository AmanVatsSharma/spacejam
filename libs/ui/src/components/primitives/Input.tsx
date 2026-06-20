/**
 * File:        libs/ui/src/components/primitives/Input.tsx
 * Module:      Libs · UI · Primitives
 * Purpose:     Production-grade Input component with validation, states, icons
 *
 * Features:
 *   - Text, password, email, tel, number types
 *   - Error/warning states with optional helper text
 *   - Leading/trailing icons
 *   - Optional label
 *   - Disabled state
 *   - Read-only mode
 *   - Required/optional field marking
 *   - Clear button for text inputs
 *   - Accessible (aria-describedby, aria-invalid, inputId)
 *   - Forward ref
 *   - Zero runtime dependencies
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-07
 */

"use client";

import * as React from "react";
import { cn } from "../../lib/utils";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Label for the input */
  label?: string;
  /** Error message */
  error?: string;
  /** Warning message */
  warning?: string;
  /** Description text */
  description?: string;
  /** Leading icon */
  leftIcon?: React.ReactNode;
  /** Trailing icon */
  rightIcon?: React.ReactNode;
  /** Show clear button */
  clearable?: boolean;
  /** Mark field as required */
  required?: boolean;
  /** Id for input and label association */
  inputId?: string;
}

// ---------------------------------------------------------------------------
// Clear button icon (SVG, no external deps)
// ---------------------------------------------------------------------------
const ClearButton = ({ onClick }: { onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="text-[#9CA3AF] hover:text-[#6B7280] transition-colors p-0.5"
    aria-label="Clear input"
  >
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M6 18L18 6M6 6l12 12" />
    </svg>
  </button>
);

// ---------------------------------------------------------------------------
// Error icon (SVG)
// ---------------------------------------------------------------------------
const ErrorIcon = () => (
  <svg
    className="h-4 w-4 text-[#EF4444]"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v4m0 4h0.01" />
  </svg>
);

// ---------------------------------------------------------------------------
// Warning icon (SVG)
// ---------------------------------------------------------------------------
const WarningIcon = () => (
  <svg
    className="h-4 w-4 text-[#F59E0B]"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4m0 4h.01" />
  </svg>
);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = "text",
      label,
      error,
      warning,
      description,
      leftIcon,
      rightIcon,
      clearable,
      required,
      inputId,
      value: controlledValue,
      defaultValue,
      onChange,
      ...props
    },
    ref
  ) => {
    const [value, setValue] = React.useState(defaultValue || "");
    const isControlled = controlledValue !== undefined;
    const currentValue = isControlled ? controlledValue : value;

    const inputIdFinal = inputId || `input-${React.useId()}`;
    const descriptionId = description ? `${inputIdFinal}-description` : undefined;
    const errorId = error ? `${inputIdFinal}-error` : undefined;
    const warningId = warning ? `${inputIdFinal}-warning` : undefined;

    const hasError = !!error;
    const hasWarning = !!warning && !hasError;
    const showClearButton = clearable && currentValue && type === "text";

    const handleClear = () => {
      const newValue = "";
      if (!isControlled) setValue(newValue);
      onChange?.({ target: { value: newValue } } as React.ChangeEvent<HTMLInputElement>);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value);
      onChange?.(e);
    };

    return (
      <div className="space-y-1.5">
        {/* Label */}
        {label && (
          <div className="flex items-center gap-1.5">
            <label
              htmlFor={inputIdFinal}
              className={cn(
                "text-sm font-medium",
                hasError ? "text-[#EF4444]" : hasWarning ? "text-[#F59E0B]" : "text-[#1F1F1F]"
              )}
            >
              {label}
              {required && <span className="text-[#EF4444] ml-0.5">*</span>}
            </label>
          </div>
        )}

        {/* Input wrapper */}
        <div className="relative">
          {/* Leading icon */}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none">
              {leftIcon}
            </div>
          )}

          {/* Input field */}
          <input
            ref={ref}
            id={inputIdFinal}
            type={type}
            value={currentValue}
            onChange={handleChange}
            aria-describedby={descriptionId}
            aria-invalid={hasError}
            aria-describedby={hasError ? errorId : hasWarning ? warningId : undefined}
            className={cn(
              "w-full px-4 py-2.5 rounded-lg border transition-colors outline-none",
              "focus:ring-2 focus:ring-offset-0",
              leftIcon && "pl-10",
              (showClearButton || rightIcon) && "pr-10",
              hasError
                ? "border-[#EF4444] focus:ring-[#EF4444] bg-[#FEF2F2]"
                : hasWarning
                ? "border-[#F59E0B] focus:ring-[#F59E0B] bg-[#FFFBEB]"
                : "border-[#E5E7EB] focus:ring-[#FF6A2F] bg-white hover:border-[#D1D5DB]"
            )}
            {...props}
          />

          {/* Clear button */}
          {showClearButton && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <ClearButton onClick={handleClear} />
            </div>
          )}

          {/* Right icon/validation */}
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {rightIcon}
            </div>
          )}

          {/* Floating validation icon */}
          {(hasError || hasWarning) && !rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {hasError ? <ErrorIcon /> : <WarningIcon />}
            </div>
          )}
        </div>

        {/* Helper text */}
        {description && !error && !warning && (
          <p id={descriptionId} className="text-xs text-[#6B7280]">
            {description}
          </p>
        )}

        {/* Error message */}
        {error && (
          <p id={errorId} className="text-xs text-[#EF4444] flex items-center gap-1.5">
            <ErrorIcon />
            {error}
          </p>
        )}

        {/* Warning message */}
        {warning && !error && (
          <p id={warningId} className="text-xs text-[#F59E0B] flex items-center gap-1.5">
            <WarningIcon />
            {warning}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
