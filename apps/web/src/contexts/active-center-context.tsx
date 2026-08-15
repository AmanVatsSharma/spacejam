/**
 * File:        apps/web/src/contexts/active-center-context.tsx
 * Module:      Web · Contexts · Active Center
 * Purpose:     Shared "which center am I working on" state for every
 *              settings surface. Loads GET_MY_CENTERS once, persists the
 *              user's explicit selection to localStorage, and exposes
 *              { centers, activeCenter, setActiveCenter, loading }.
 *
 *              Why: settings groups live under Center.settings, but a
 *              multi-center super admin previously got `myCenters[0]` — an
 *              arbitrary center that could silently change when centers are
 *              added. Single-center users (e.g. CENTER_MANAGER) never see a
 *              picker; the sole center is always active.
 *
 * Author:      ZCode
 * Last-updated: 2026-08-14
 */
'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
  useCallback,
} from 'react';
import { useQuery } from '@apollo/client';
import { GET_MY_CENTERS } from '@/lib/apollo/operations';

export interface ActiveCenter {
  id: string;
  name: string;
  status?: string;
  settings?: Record<string, any> | null;
}

const STORAGE_KEY = 'spacejam.activeCenterId';

interface ActiveCenterContextValue {
  /** All centers the caller may access (scoped server-side). */
  centers: ActiveCenter[];
  /** The center settings pages operate on. Undefined until loaded / if none. */
  activeCenter?: ActiveCenter;
  /** True while GET_MY_CENTERS is in flight. */
  loading: boolean;
  /** Switch the active center (persisted). No-op for unknown ids. */
  setActiveCenter: (centerId: string) => void;
}

const ActiveCenterContext = createContext<ActiveCenterContextValue | null>(null);

export function ActiveCenterProvider({ children }: { children: ReactNode }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [restored, setRestored] = useState(false);

  // Restore the persisted selection once on mount (client only).
  useEffect(() => {
    try {
      setSelectedId(window.localStorage.getItem(STORAGE_KEY));
    } catch {
      /* private mode / disabled storage — fall back to first center */
    }
    setRestored(true);
  }, []);

  const { data, loading } = useQuery(GET_MY_CENTERS, {
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });

  const centers: ActiveCenter[] = useMemo(
    () =>
      (data?.myCenters ?? []).map((c: any) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        settings: c.settings ?? null,
      })),
    [data],
  );

  // Resolve the active center: explicit selection if still valid, else first.
  const activeCenter = useMemo(() => {
    if (selectedId) {
      const found = centers.find((c) => c.id === selectedId);
      if (found) return found;
    }
    return centers[0];
  }, [centers, selectedId]);

  const setActiveCenter = useCallback((centerId: string) => {
    setSelectedId(centerId);
    try {
      window.localStorage.setItem(STORAGE_KEY, centerId);
    } catch {
      /* non-fatal */
    }
  }, []);

  // Keep storage in sync when the implicit (first) center becomes active so
  // a later page load resolves to the same center.
  useEffect(() => {
    if (!restored || !activeCenter) return;
    try {
      if (window.localStorage.getItem(STORAGE_KEY) !== activeCenter.id) {
        window.localStorage.setItem(STORAGE_KEY, activeCenter.id);
      }
    } catch {
      /* non-fatal */
    }
  }, [restored, activeCenter]);

  const value = useMemo(
    () => ({
      centers,
      activeCenter,
      loading: loading || !restored,
      setActiveCenter,
    }),
    [centers, activeCenter, loading, restored, setActiveCenter],
  );

  return (
    <ActiveCenterContext.Provider value={value}>
      {children}
    </ActiveCenterContext.Provider>
  );
}

export function useActiveCenter(): ActiveCenterContextValue {
  const ctx = useContext(ActiveCenterContext);
  if (!ctx) {
    throw new Error('useActiveCenter must be used within ActiveCenterProvider');
  }
  return ctx;
}
