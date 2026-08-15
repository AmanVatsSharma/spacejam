"use client";

/**
 * File:        apps/web/src/hooks/use-settings.ts
 * Module:      Web · Hooks · Center & User Settings
 * Purpose:     Apollo data layer for the settings blobs:
 *              - Center.settings jsonb — center-wide policy that backs the
 *                admin Settings pages (finance, notifications, security,
 *                operations, center defaults…). Stored as nested groups
 *                under settings.<groupName>.<key>.
 *              - User.settings jsonb — per-user groups (permissions matrix,
 *                personal security/notification prefs) that back the Teams
 *                page per-user tabs.
 *
 *              The active center comes from ActiveCenterContext (shared,
 *              persisted selection) instead of the old `myCenters[0]`,
 *              which was arbitrary for multi-center super admins.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-08-14
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery, useMutation, useApolloClient } from '@apollo/client';
import {
  GET_CENTER_SETTINGS,
  UPDATE_CENTER_SETTINGS,
  GET_MY_CENTERS,
  GET_USER_SETTINGS,
  UPDATE_USER_SETTINGS,
} from '@/lib/apollo/operations';
import { useActiveCenter } from '@/contexts/active-center-context';
import { toast } from 'sonner';

export type CenterSettings = Record<string, any>;

/** Parse a settings blob that the API may return as a JSON string or object. */
function parseSettingsBlob(value: unknown): CenterSettings {
  if (!value) return {};
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }
  return value as CenterSettings;
}

/**
 * Load the full settings object for a center. Returns an empty object
 * until the query resolves (so consumers can default safely).
 */
export function useCenterSettings(centerId?: string) {
  const { data, loading, error, refetch } = useQuery(GET_CENTER_SETTINGS, {
    variables: { centerId },
    skip: !centerId,
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });

  const settings = parseSettingsBlob(data?.centerSettings);

  return { settings, loading, error, refetch };
}

/**
 * Persist a partial settings object. The backend deep-merges it into the
 * existing Center.settings, so callers should pass a group-scoped object
 * such as { finance: { verificationRequired: true } }. Also patches the
 * GET_MY_CENTERS cache so components reading center.settings directly
 * (the manager config pages) see the saved values immediately.
 */
export function useUpdateCenterSettings() {
  const client = useApolloClient();
  const [saving, setSaving] = useState(false);
  const [mutation] = useMutation(UPDATE_CENTER_SETTINGS, { errorPolicy: 'all' });

  const update = useCallback(
    async (centerId: string, partial: CenterSettings): Promise<CenterSettings> => {
      setSaving(true);
      try {
        const result = await mutation({
          variables: { centerId, settings: JSON.stringify(partial) },
        });
        if (result.errors?.length) {
          throw new Error(result.errors[0].message);
        }
        const merged = parseSettingsBlob(result.data?.updateCenterSettings);

        // Keep both cache views coherent.
        client.writeQuery({
          query: GET_CENTER_SETTINGS,
          variables: { centerId },
          data: { centerSettings: JSON.stringify(merged) },
        });
        client.cache.updateQuery({ query: GET_MY_CENTERS }, (cached: any) => {
          if (!cached?.myCenters) return cached;
          return {
            myCenters: cached.myCenters.map((c: any) =>
              c.id === centerId ? { ...c, settings: merged } : c,
            ),
          };
        });

        return merged;
      } finally {
        setSaving(false);
      }
    },
    [client, mutation],
  );

  return { update, saving };
}

/**
 * Convenience hook for a single center-wide Settings page. Each page
 * (finance, notifications, security, operations, permissions…) owns one
 * "group" inside Center.settings. This hook:
 *   - resolves the active center from ActiveCenterContext (shared,
 *     persisted selection — not myCenters[0])
 *   - loads the page's group object
 *   - seeds local draft state and re-seeds when the server value arrives
 *   - exposes save() (persist) and reset() (discard)
 *
 * Usage:
 *   const { draft, set, save, reset, loading, saving } =
 *     useSettingsGroup('finance', { verificationRequired: true, ... });
 */
export function useSettingsGroup<T extends Record<string, any>>(
  groupName: string,
  defaults: T,
) {
  const { activeCenter, loading: centersLoading } = useActiveCenter();
  const centerId: string | undefined = activeCenter?.id;

  const { settings, loading, refetch } = useCenterSettings(centerId);
  const serverGroup = (settings?.[groupName] ?? {}) as Partial<T>;

  const [draft, setDraft] = useState<T>({ ...defaults });

  // Re-seed local draft whenever the server group changes (first load).
  useEffect(() => {
    setDraft({ ...defaults, ...serverGroup });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centerId, JSON.stringify(serverGroup)]);

  const set = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }, []);

  const { update, saving } = useUpdateCenterSettings();

  const save = useCallback(async () => {
    if (!centerId) {
      toast.error('No active center found for these settings.');
      return false;
    }
    try {
      await update(centerId, { [groupName]: draft });
      toast.success('Settings saved');
      return true;
    } catch {
      toast.error('Could not save settings');
      return false;
    }
  }, [centerId, groupName, draft, update]);

  const reset = useCallback(() => {
    setDraft({ ...defaults, ...serverGroup });
    toast.info('Reverted to saved settings');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaults, JSON.stringify(serverGroup)]);

  return {
    draft,
    set,
    setDraft,
    save,
    reset,
    loading: loading || centersLoading,
    saving,
    centerId,
    refetch,
  };
}

/**
 * Per-user counterpart of useSettingsGroup, backed by User.settings.
 * `userId` is required — pass the selected user from the Teams page (or
 * the current user for self-service pages).
 */
export function useUserSettingsGroup<T extends Record<string, any>>(
  userId: string | null | undefined,
  groupName: string,
  defaults: T,
) {
  const client = useApolloClient();
  const { data, loading, error } = useQuery(GET_USER_SETTINGS, {
    variables: { userId: userId ?? '' },
    skip: !userId,
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });

  const settings = parseSettingsBlob(data?.userSettings);
  const serverGroup = (settings?.[groupName] ?? {}) as Partial<T>;

  const [draft, setDraft] = useState<T>({ ...defaults });

  useEffect(() => {
    setDraft({ ...defaults, ...serverGroup });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, JSON.stringify(serverGroup)]);

  const set = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }, []);

  const [saving, setSaving] = useState(false);
  const [mutation] = useMutation(UPDATE_USER_SETTINGS, { errorPolicy: 'all' });

  const save = useCallback(async () => {
    if (!userId) {
      toast.error('Select a user first.');
      return false;
    }
    setSaving(true);
    try {
      const result = await mutation({
        variables: { userId, settings: JSON.stringify({ [groupName]: draft }) },
      });
      if (result.errors?.length) throw new Error(result.errors[0].message);
      const merged = parseSettingsBlob(result.data?.updateUserSettings);
      client.writeQuery({
        query: GET_USER_SETTINGS,
        variables: { userId },
        data: { userSettings: JSON.stringify(merged) },
      });
      toast.success('Settings saved');
      return true;
    } catch {
      toast.error('Could not save settings');
      return false;
    } finally {
      setSaving(false);
    }
  }, [userId, groupName, draft, mutation, client]);

  const reset = useCallback(() => {
    setDraft({ ...defaults, ...serverGroup });
    toast.info('Reverted to saved settings');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaults, JSON.stringify(serverGroup)]);

  return { draft, set, setDraft, save, reset, loading, saving, error };
}

/**
 * Auto-saving config hook for the Center Manager settings pages
 * (finance / notification / operations). Those pages have no Save button
 * by design, so correctness here matters:
 *
 *   - hydrates the draft once from the active center's saved group
 *   - auto-saves (debounced) ONLY when the draft actually differs from
 *     the last saved snapshot — never on mount/load, which previously
 *     overwrote saved settings with defaults
 *   - keeps the lastSaved snapshot in sync after each successful save
 *
 * @param groupName top-level group in Center.settings (e.g. 'managerConfig')
 * @param subKey    nested key inside the group (e.g. 'finance'), or null
 *                  to treat the whole group as the draft.
 */
export function useManagerCenterConfig<T extends Record<string, any>>(
  groupName: string,
  subKey: string | null,
  defaults: T,
) {
  const { activeCenter, loading: centersLoading } = useActiveCenter();
  const centerId = activeCenter?.id;

  // Saved group from the GET_MY_CENTERS payload (kept fresh by
  // useUpdateCenterSettings patching the cache after every save).
  const group = (activeCenter?.settings as CenterSettings | null)?.[groupName] ?? null;
  const saved = (subKey ? group?.[subKey] : group) ?? null;

  const [draft, setDraft] = useState<T>({ ...defaults });
  // Snapshot of what the server last returned — the diff target.
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const hydratedFor = useRef<string | null>(null);
  const { update, saving } = useUpdateCenterSettings();

  // Hydrate once per (centerId + saved payload). Re-runs when the server
  // value changes underneath us (e.g. first load, or center switch).
  const savedKey = centerId ? `${centerId}:${JSON.stringify(saved)}` : null;
  useEffect(() => {
    if (!savedKey || hydratedFor.current === savedKey) return;
    hydratedFor.current = savedKey;
    setDraft({ ...defaults, ...(saved ?? {}) });
    setLastSaved(JSON.stringify(saved ?? {}));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedKey]);

  const set = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }, []);

  const draftJson = JSON.stringify(draft);
  const dirty = lastSaved !== null && draftJson !== lastSaved;

  // Debounced auto-save, only when dirty and not already saving.
  useEffect(() => {
    if (!centerId || !dirty || saving) return;
    const timer = setTimeout(async () => {
      try {
        const payload = subKey ? { [groupName]: { [subKey]: draft } } : { [groupName]: draft };
        await update(centerId, payload);
        setLastSaved(JSON.stringify(draft));
        toast.success('Changes saved');
      } catch {
        toast.error('Could not save settings');
      }
    }, 1000);
    return () => clearTimeout(timer);
    // draft intentionally read via draftJson to keep deps stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centerId, dirty, draftJson, saving, groupName, subKey]);

  return {
    draft,
    set,
    setDraft,
    saving,
    dirty,
    loading: centersLoading,
    centerId,
  };
}
