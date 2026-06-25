/**
 * File:        libs/ui/src/components/primitives/Card.tsx
 * Module:      Libs · UI · Primitives
 * Purpose:     Production-grade Card component with header, body, footer
 *
 * Features:
 *   - Header, body, footer sections
 *   - Multiple variants (default, outlined, elevated)
 *   - Action buttons for header/footer
 *   - Hover/click states
 *   - Border radius consistency
 *   - Padding options
 *   - Optional hover effect
 *   - Click handler (like a button)
 *   - Accessible focus states
 *   - Zero runtime dependencies
 *
 * Design System Alignment:
 *   - Default: white background, subtle shadow
 *   - Outlined: border, no shadow
 *   - Elevated: larger shadow
 *   - Hover: smooth transition on background
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
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Visual variant */
  variant?: "default" | "outlined" | "elevated";
  /** Hover effect */
  hoverable?: boolean;
  /** Click handler (makes it feel like a button) */
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  /** Padding size */
  padding?: "none" | "sm" | "md" | "lg";
}

// Header props
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional left action slot */
  leftAction?: React.ReactNode;
  /** Optional right action slot */
  rightAction?: React.ReactNode;
}

// Footer props
export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional left action slot */
  leftAction?: React.ReactNode;
  /** Optional right action slot */
  rightAction?: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Variant configuration
// ---------------------------------------------------------------------------
const variantStyles = {
  default: "bg-white border border-[#E5E7EB] shadow-[0px_1px_2px_rgba(0,0,0,0.05)]",
  outlined: "bg-white border border-[#E5E7EB]",
  elevated: "bg-white border border-[#E5E7EB] shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-1px_rgba(0,0,0,0.06)]",
};

const paddingStyles = {
  none: "",
  sm: "p-3",
  md: "p-5",
  lg: "p-8",
};

// ---------------------------------------------------------------------------
// Component: Card
// ---------------------------------------------------------------------------
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = "default",
      hoverable = false,
      padding = "md",
      onClick,
      children,
      ...props
    },
    ref
  ) => {
    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      onClick?.(e);
    };

    const cardClasses = cn(
      // Layout
      "rounded-2xl",
      "transition-all duration-200",
      hoverable && "hover:bg-[#FBF6F4] cursor-pointer",
      onClick && "active:scale-[0.98] active:bg-[#F9FAFB]",

      // Variant + padding
      variantStyles[variant],
      paddingStyles[padding],

      className
    );

    if (onClick) {
      return (
        <div
          ref={ref}
          className={cardClasses}
          onClick={handleClick}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleClick(e as unknown as React.MouseEvent<HTMLDivElement>);
            }
          }}
          {...props}
        >
          {children}
        </div>
      );
    }

    return (
      <div ref={ref} className={cardClasses} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

// ---------------------------------------------------------------------------
// Component: CardHeader
// ---------------------------------------------------------------------------
const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, leftAction, rightAction, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-between gap-4 border-b border-[#F3F4F6] pb-4",
          leftAction || rightAction ? "justify-between" : "",
          className
        )}
        {...props}
      >
        {leftAction && <div className="flex items-center">{leftAction}</div>}
        <div className="flex-1 min-w-0">{children}</div>
        {rightAction && <div className="flex items-center">{rightAction}</div>}
      </div>
    );
  }
);

CardHeader.displayName = "CardHeader";

// ---------------------------------------------------------------------------
// Component: CardTitle
// ---------------------------------------------------------------------------
const CardTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={cn(
          "text-lg font-semibold text-[#1F1F1F] leading-6",
          className
        )}
        {...props}
      >
        {children}
      </h3>
    );
  }
);

CardTitle.displayName = "CardTitle";

// ---------------------------------------------------------------------------
// Component: CardDescription
// ---------------------------------------------------------------------------
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn(
        "text-sm text-[#6B7280] leading-relaxed",
        className
      )}
      {...props}
    >
      {children}
    </p>
  );
});

CardDescription.displayName = "CardDescription";

// ---------------------------------------------------------------------------
// Component: CardBody
// ---------------------------------------------------------------------------
const CardBody = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("", className)} {...props}>
        {children}
      </div>
    );
  }
);

CardBody.displayName = "CardBody";

// ---------------------------------------------------------------------------
// Component: CardFooter
// ---------------------------------------------------------------------------
const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, leftAction, rightAction, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-between gap-4 pt-4 border-t border-[#F3F4F6]",
          leftAction || rightAction ? "justify-between" : "",
          className
        )}
        {...props}
      >
        {leftAction && <div className="flex items-center">{leftAction}</div>}
        <div className="flex-1 min-w-0">{children}</div>
        {rightAction && <div className="flex items-center">{rightAction}</div>}
      </div>
    );
  }
);

CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter };
