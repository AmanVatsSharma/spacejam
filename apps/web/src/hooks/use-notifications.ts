"use client";

/**
 * File:        apps/web/src/hooks/use-notifications.ts
 * Module:      Web · Hooks · Notifications
 * Purpose:     Apollo-based data layer for the notifications feature.
 *              Mirrors the conventions of use-operations.ts:
 *                - cache-and-network fetch policy
 *                - errorPolicy: 'all' (graceful on partial failures)
 *                - mutations refetch the relevant queries
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-11
 */
import { useState } from 'react';
import { useQuery, useMutation, useApolloClient } from '@apollo/client';
import {
  GET_NOTIFICATIONS,
  GET_NOTIFICATION,
  NOTIFICATION_STATS,
  MY_NOTIFICATIONS,
  CREATE_NOTIFICATION,
  SEND_NOTIFICATION,
  MARK_NOTIFICATION_READ,
  MARK_ALL_NOTIFICATIONS_READ,
  DELETE_NOTIFICATION,
} from '@/lib/apollo/operations';

// ────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────

export type NotificationTypeT =
  | 'BOOKING'
  | 'PAYMENT'
  | 'DEPOSIT'
  | 'LEAD'
  | 'SYSTEM'
  | 'REQUEST'
  | 'EVENT';

export type NotificationPriorityT = 'LOW' | 'MEDIUM' | 'HIGH';

export interface NotificationItem {
  id: string;
  userId?: string | null;
  centerId?: string | null;
  title: string;
  message: string;
  type: NotificationTypeT;
  priority: NotificationPriorityT;
  read: boolean;
  actionUrl?: string | null;
  metadata?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; name?: string; email?: string } | null;
  center?: { id: string; name?: string } | null;
}

export interface NotificationStats {
  total: number;
  unread: number;
  booking: number;
  payment: number;
  deposit: number;
  lead: number;
  request: number;
  event: number;
  system: number;
}

export interface NotificationFilters {
  userId?: string;
  centerId?: string;
  type?: NotificationTypeT;
  priority?: NotificationPriorityT;
  read?: boolean;
  unreadOnly?: boolean;
  limit?: number;
  offset?: number;
}

export interface CreateNotificationInput {
  userId?: string;
  centerId?: string;
  title: string;
  message: string;
  type?: NotificationTypeT;
  priority?: NotificationPriorityT;
  actionUrl?: string;
  metadata?: string;
}

export interface SendNotificationInput {
  sendTo?: string;
  recipientIds?: string[];
  centerId?: string;
  title: string;
  message: string;
  type?: NotificationTypeT;
  priority?: NotificationPriorityT;
  template?: string;
  metadata?: string;
}

const NOTIF_QUERIES = [
  'GetNotifications',
  'NotificationStats',
  'MyNotifications',
];

// ────────────────────────────────────────────────────────
// Query hooks
// ────────────────────────────────────────────────────────

export function useNotifications(filters?: NotificationFilters) {
  const { data, loading, error, refetch } = useQuery(GET_NOTIFICATIONS, {
    variables: { filters },
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });

  return {
    notifications: (data?.notifications ?? []) as NotificationItem[],
    loading,
    error,
    refetch,
  };
}

export function useNotification(id: string) {
  const { data, loading, error } = useQuery(GET_NOTIFICATION, {
    variables: { id },
    skip: !id,
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });

  return {
    notification: (data?.notification ?? null) as NotificationItem | null,
    loading,
    error,
  };
}

export function useNotificationStats(userId?: string, centerId?: string) {
  const { data, loading, error } = useQuery(NOTIFICATION_STATS, {
    variables: { userId, centerId },
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });

  const fallback: NotificationStats = {
    total: 0,
    unread: 0,
    booking: 0,
    payment: 0,
    deposit: 0,
    lead: 0,
    request: 0,
    event: 0,
    system: 0,
  };

  return {
    stats: (data?.notificationStats ?? fallback) as NotificationStats,
    loading,
    error,
  };
}

export function useMyNotifications(unreadOnly = false, limit = 50) {
  const { data, loading, error, refetch } = useQuery(MY_NOTIFICATIONS, {
    variables: { unreadOnly, limit },
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });

  return {
    notifications: (data?.myNotifications ?? []) as NotificationItem[],
    loading,
    error,
    refetch,
  };
}

// ────────────────────────────────────────────────────────
// Mutation hooks
// ────────────────────────────────────────────────────────

export function useCreateNotification() {
  const client = useApolloClient();
  const [saving, setSaving] = useState(false);
  const [mutation] = useMutation(CREATE_NOTIFICATION, { errorPolicy: 'all' });

  async function create(input: CreateNotificationInput) {
    setSaving(true);
    try {
      const result = await mutation({ variables: { input } });
      await client.refetchQueries({ include: NOTIF_QUERIES });
      return (result.data?.createNotification ?? null) as NotificationItem | null;
    } finally {
      setSaving(false);
    }
  }

  return { create, saving };
}

/**
 * Broadcast a notification (used by the Send Notification dialog).
 * Returns the number of recipients it was created for.
 */
export function useSendNotification() {
  const client = useApolloClient();
  const [sending, setSending] = useState(false);
  const [mutation] = useMutation(SEND_NOTIFICATION, { errorPolicy: 'all' });

  async function send(input: SendNotificationInput) {
    setSending(true);
    try {
      const result = await mutation({ variables: { input } });
      await client.refetchQueries({ include: NOTIF_QUERIES });
      return (result.data?.sendNotification ?? 0) as number;
    } finally {
      setSending(false);
    }
  }

  return { send, sending };
}

export function useMarkNotificationRead() {
  const client = useApolloClient();
  const [updating, setUpdating] = useState(false);
  const [mutation] = useMutation(MARK_NOTIFICATION_READ, { errorPolicy: 'all' });

  async function markRead(id: string, read = true) {
    setUpdating(true);
    try {
      const result = await mutation({ variables: { id, read } });
      await client.refetchQueries({ include: NOTIF_QUERIES });
      return result.data?.markNotificationRead ?? null;
    } finally {
      setUpdating(false);
    }
  }

  return { markRead, updating };
}

export function useMarkAllNotificationsRead() {
  const client = useApolloClient();
  const [updating, setUpdating] = useState(false);
  const [mutation] = useMutation(MARK_ALL_NOTIFICATIONS_READ, {
    errorPolicy: 'all',
  });

  async function markAllRead(userId?: string, centerId?: string) {
    setUpdating(true);
    try {
      const result = await mutation({ variables: { userId, centerId } });
      await client.refetchQueries({ include: NOTIF_QUERIES });
      return (result.data?.markAllNotificationsRead ?? 0) as number;
    } finally {
      setUpdating(false);
    }
  }

  return { markAllRead, updating };
}

export function useDeleteNotification() {
  const client = useApolloClient();
  const [deleting, setDeleting] = useState(false);
  const [mutation] = useMutation(DELETE_NOTIFICATION, { errorPolicy: 'all' });

  async function remove(id: string) {
    setDeleting(true);
    try {
      await mutation({ variables: { id } });
      await client.refetchQueries({ include: NOTIF_QUERIES });
      return true;
    } catch {
      return false;
    } finally {
      setDeleting(false);
    }
  }

  return { deleteNotification: remove, deleting };
}
