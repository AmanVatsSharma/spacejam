/**
 * File:        libs/ui/src/components/accessibility/useFocusTrap.ts
 * Module:      Libs · UI · Accessibility
 * Purpose:     Custom hook for focus trapping
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-07
 */

'use client';

import React, { useRef, useEffect } from 'react';

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector = [
    'button:not([disabled])',
    'a[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
  ].join(', ');

  return Array.from(container.querySelectorAll(selector));
}

export interface UseFocusTrapOptions {
  active: boolean;
  onEscape?: () => void;
}

export function useFocusTrap(
  { active, onEscape }: UseFocusTrapOptions = { active: true }
): React.RefObject<HTMLDivElement | null> {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) {
      if (previousActiveElementRef.current) {
        previousActiveElementRef.current.focus();
      }
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    // Store the currently focused element
    previousActiveElementRef.current = document.activeElement as HTMLElement;

    // Get all focusable elements within the container
    const focusableElements = getFocusableElements(container);
    if (focusableElements.length === 0) return;

    // Focus the first element
    focusableElements[0].focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      const focusableElements = getFocusableElements(container);
      if (focusableElements.length === 0) return;

      if (event.key === 'Tab') {
        event.preventDefault();

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
          }
        }
      } else if (event.key === 'Escape' && onEscape) {
        event.preventDefault();
        onEscape();
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [active, onEscape]);

  return containerRef;
}