"use client";

/**
 * File:        apps/web/src/hooks/use-settings.ts
 * Module:      Web · Hooks · Center Settings
 * Purpose:     Apollo data layer for the Center.settings jsonb blob,
 *              which backs every Settings page (finance, notifications,
 *              security, operations, permissions). Settings are stored as
 *              nested groups under settings.<groupName>.<key>.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-11
 */
import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useApolloClient } from '@apollo/client';
import { GET_CENTER_SETTINGS, UPDATE_CENTER_SETTINGS, GET_MY_CENTERS } from '@/lib/apollo/operations';
import { toast } from 'sonner';

export type CenterSettings = Record<string, any>;

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

  let settings: CenterSettings = {};
  if (data?.centerSettings) {
    try {
      settings = typeof data.centerSettings === 'string'
        ? JSON.parse(data.centerSettings)
        : data.centerSettings;
    } catch {
      settings = {};
    }
  }

  return { settings, loading, error, refetch };
}

/**
 * Persist a partial settings object. The backend deep-merges it into the
 * existing Center.settings, so callers should pass a group-scoped object
 * such as { finance: { verificationRequired: true } }.
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
        // Update the cached query so useCenterSettings consumers re-render.
        client.writeQuery({
          query: GET_CENTER_SETTINGS,
          variables: { centerId },
          data: { centerSettings: result.data?.updateCenterSettings ?? '{}' },
        });
        try {
          return JSON.parse(result.data?.updateCenterSettings ?? '{}');
        } catch {
          return {};
        }
      } finally {
        setSaving(false);
      }
    },
    [client, mutation],
  );

  return { update, saving };
}

/**
 * Convenience hook for a single Settings page. Each page (finance,
 * notifications, security, operations, permissions) owns one "group"
 * inside Center.settings. This hook:
 *   - resolves the active centerId from the user's first owned center
 *     (AuthUser has no centerId, so we load myCenters)
 *   - loads the page's group object
 *   - seeds local draft state and re-seeds when the server value arrives
 *   - exposes saveDraft() (persist) and resetDraft() (discard)
 *
 * Usage:
 *   const { draft, set, save, reset, loading, saving } =
 *     useSettingsGroup('finance', { verificationRequired: true, ... });
 */
export function useSettingsGroup<T extends Record<string, any>>(
  groupName: string,
  defaults: T,
) {
  const client = useApolloClient();
  const { loading, data } = useQuery(GET_MY_CENTERS, {
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });
  const { update, saving } = useUpdateCenterSettings();

  const centerId: string | undefined = data?.myCenters?.[0]?.id;

  const { settings } = useCenterSettings(centerId);
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
  }, [defaults, serverGroup]);

  return {
    draft,
    set,
    setDraft,
    save,
    reset,
    loading,
    saving,
    centerId,
  };
}
