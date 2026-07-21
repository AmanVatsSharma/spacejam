/**
 * File:        apps/web/src/hooks/use-enterprise.ts
 * Module:      Web · Dashboard · Enterprise Hooks
 * Purpose:     React hooks for enterprise features — audit log, equipment,
 *              event attendees, ticket tiers, recurring bookings,
 *              scheduled reports, calendar sync.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-20
 */
import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useApolloClient } from '@apollo/client';
import {
  AUDIT_LOG_QUERY,
  EQUIPMENT_QUERY,
  EQUIPMENT_LIST_QUERY,
  CREATE_EQUIPMENT_MUTATION,
  UPDATE_EQUIPMENT_MUTATION,
  ASSIGN_EQUIPMENT_MUTATION,
  UNASSIGN_EQUIPMENT_MUTATION,
  SET_EQUIPMENT_STATUS_MUTATION,
  DELETE_EQUIPMENT_MUTATION,
  EVENT_ATTENDEES_QUERY,
  EVENT_ATTENDEE_COUNT_QUERY,
  ADD_ATTENDEE_MUTATION,
  REMOVE_ATTENDEE_MUTATION,
  CHECK_IN_MUTATION,
  CHECK_OUT_MUTATION,
  BULK_CHECK_IN_MUTATION,
  TICKET_TIERS_QUERY,
  CREATE_TICKET_TIER_MUTATION,
  UPDATE_TICKET_TIER_MUTATION,
  DELETE_TICKET_TIER_MUTATION,
  INCREMENT_TIER_SOLD_MUTATION,
  RECURRING_BOOKINGS_QUERY,
  RECURRING_BOOKING_QUERY,
  CREATE_RECURRING_BOOKING_MUTATION,
  EXPAND_RECURRING_MUTATION,
  CANCEL_RECURRING_BOOKING_MUTATION,
  COUNT_RECURRING_OCCURRENCES_MUTATION,
  SCHEDULED_REPORTS_QUERY,
  SCHEDULED_REPORT_QUERY,
  CREATE_SCHEDULED_REPORT_MUTATION,
  UPDATE_SCHEDULED_REPORT_MUTATION,
  DELETE_SCHEDULED_REPORT_MUTATION,
  RUN_SCHEDULED_REPORT_MUTATION,
  CALENDAR_CONNECTIONS_QUERY,
  CALENDAR_CONNECTION_QUERY,
  CONNECT_CALENDAR_MUTATION,
  DISCONNECT_CALENDAR_MUTATION,
  SYNC_CALENDAR_MUTATION,
  TOGGLE_CALENDAR_SYNC_MUTATION,
} from '@/lib/apollo/enterprise-operations';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────
export type AuditLogFilters = {
  userId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  fromDate?: string;
  toDate?: string;
};

export type AttendeeFilters = {
  eventId?: string;
  userId?: string;
  checkedIn?: boolean;
  limit?: number;
  offset?: number;
};

export const EquipmentStatuses = ['AVAILABLE', 'ASSIGNED', 'MAINTENANCE', 'RETIRED'] as const;
export type EquipmentStatus = typeof EquipmentStatuses[number];
export const EquipmentTypes = ['LAPTOP', 'MONITOR', 'PRINTER', 'PROJECTOR', 'PHONE', 'OTHER'] as const;
export type EquipmentType = typeof EquipmentTypes[number];

export type CalendarProvider = 'GOOGLE' | 'OUTLOOK' | 'APPLE';

// ─── Audit Log ────────────────────────────────────────────────
export function useAuditLog(filters?: AuditLogFilters, limit = 100, offset = 0) {
  const { data, loading, error, refetch } = useQuery(AUDIT_LOG_QUERY, {
    variables: { filters, limit, offset },
    fetchPolicy: 'cache-and-network',
  });
  return { logs: data?.auditLog ?? [], loading, error, refetch };
}

// ─── Equipment ────────────────────────────────────────────────
export function useEquipment(id: string) {
  const { data, loading, error, refetch } = useQuery(EQUIPMENT_QUERY, {
    variables: { id },
    skip: !id,
    fetchPolicy: 'cache-and-network',
  });
  return { equipment: data?.equipment, loading, error, refetch };
}

export function useEquipmentList(centerId?: string, status?: EquipmentStatus) {
  const { data, loading, error, refetch } = useQuery(EQUIPMENT_LIST_QUERY, {
    variables: { centerId, status },
    fetchPolicy: 'cache-and-network',
  });
  return { items: data?.equipmentList ?? [], loading, error, refetch };
}

export function useEquipmentMutations() {
  const client = useApolloClient();
  const [createMu] = useMutation(CREATE_EQUIPMENT_MUTATION);
  const [updateMu] = useMutation(UPDATE_EQUIPMENT_MUTATION);
  const [assignMu] = useMutation(ASSIGN_EQUIPMENT_MUTATION);
  const [unassignMu] = useMutation(UNASSIGN_EQUIPMENT_MUTATION);
  const [statusMu] = useMutation(SET_EQUIPMENT_STATUS_MUTATION);
  const [deleteMu] = useMutation(DELETE_EQUIPMENT_MUTATION);

  const create = useCallback(async (input: any) => {
    const r = await createMu({ variables: { input } });
    toast.success('Equipment created');
    return r.data?.createEquipment;
  }, [createMu]);

  const update = useCallback(async (id: string, input: any) => {
    const r = await updateMu({ variables: { id, input } });
    toast.success('Equipment updated');
    return r.data?.updateEquipment;
  }, [updateMu]);

  const assign = useCallback(async (id: string, userId: string) => {
    const r = await assignMu({ variables: { id, userId } });
    toast.success('Equipment assigned');
    return r.data?.assignEquipment;
  }, [assignMu]);

  const unassign = useCallback(async (id: string) => {
    const r = await unassignMu({ variables: { id } });
    toast.success('Equipment unassigned');
    return r.data?.unassignEquipment;
  }, [unassignMu]);

  const setStatus = useCallback(async (id: string, status: EquipmentStatus) => {
    const r = await statusMu({ variables: { id, status } });
    toast.success('Status updated');
    return r.data?.setEquipmentStatus;
  }, [statusMu]);

  const remove = useCallback(async (id: string) => {
    const r = await deleteMu({ variables: { id } });
    toast.success('Equipment deleted');
    return r.data?.deleteEquipment;
  }, [deleteMu]);

  return { create, update, assign, unassign, setStatus, remove };
}

// ─── Event Attendees ──────────────────────────────────────────
export function useEventAttendees(filters?: AttendeeFilters) {
  const { data, loading, error, refetch } = useQuery(EVENT_ATTENDEES_QUERY, {
    variables: { filters },
    skip: !filters?.eventId && !filters?.userId,
    fetchPolicy: 'cache-and-network',
  });
  return { attendees: data?.eventAttendees ?? [], loading, error, refetch };
}

export function useAttendeeCounts(eventId: string) {
  const { data, loading, error } = useQuery(EVENT_ATTENDEE_COUNT_QUERY, {
    variables: { eventId },
    skip: !eventId,
  });
  return {
    total: data?.attendeeCount ?? 0,
    checkedIn: data?.checkedInCount ?? 0,
    loading,
    error,
  };
}

export function useAttendeeMutations() {
  const [addMu] = useMutation(ADD_ATTENDEE_MUTATION);
  const [removeMu] = useMutation(REMOVE_ATTENDEE_MUTATION);
  const [checkInMu] = useMutation(CHECK_IN_MUTATION);
  const [checkOutMu] = useMutation(CHECK_OUT_MUTATION);
  const [bulkMu] = useMutation(BULK_CHECK_IN_MUTATION);

  const add = useCallback(async (input: any) => {
    const r = await addMu({ variables: { input } });
    toast.success('Attendee added');
    return r.data?.addAttendee;
  }, [addMu]);

  const remove = useCallback(async (eventId: string, userId: string) => {
    await removeMu({ variables: { eventId, userId } });
    toast.success('Attendee removed');
  }, [removeMu]);

  const checkIn = useCallback(async (eventId: string, userId: string) => {
    const r = await checkInMu({ variables: { eventId, userId } });
    return r.data?.checkInAttendee;
  }, [checkInMu]);

  const checkOut = useCallback(async (eventId: string, userId: string) => {
    const r = await checkOutMu({ variables: { eventId, userId } });
    return r.data?.checkOutAttendee;
  }, [checkOutMu]);

  const bulkCheckIn = useCallback(async (eventId: string) => {
    const r = await bulkMu({ variables: { eventId } });
    toast.success(`Checked in ${r.data?.bulkCheckIn ?? 0} attendees`);
    return r.data?.bulkCheckIn;
  }, [bulkMu]);

  return { add, remove, checkIn, checkOut, bulkCheckIn };
}

// ─── Ticket Tiers ─────────────────────────────────────────────
export function useTicketTiers(eventId: string) {
  const { data, loading, error, refetch } = useQuery(TICKET_TIERS_QUERY, {
    variables: { eventId },
    skip: !eventId,
    fetchPolicy: 'cache-and-network',
  });
  return { tiers: data?.ticketTiers ?? [], loading, error, refetch };
}

export function useTicketTierMutations() {
  const [createMu] = useMutation(CREATE_TICKET_TIER_MUTATION);
  const [updateMu] = useMutation(UPDATE_TICKET_TIER_MUTATION);
  const [deleteMu] = useMutation(DELETE_TICKET_TIER_MUTATION);
  const [incrementMu] = useMutation(INCREMENT_TIER_SOLD_MUTATION);

  const create = useCallback(async (input: any) => {
    const r = await createMu({ variables: { input } });
    toast.success('Ticket tier created');
    return r.data?.createTicketTier;
  }, [createMu]);

  const update = useCallback(async (id: string, input: any) => {
    const r = await updateMu({ variables: { id, input } });
    toast.success('Ticket tier updated');
    return r.data?.updateTicketTier;
  }, [updateMu]);

  const remove = useCallback(async (id: string) => {
    await deleteMu({ variables: { id } });
    toast.success('Ticket tier deleted');
  }, [deleteMu]);

  const incrementSold = useCallback(async (id: string, count = 1) => {
    const r = await incrementMu({ variables: { id, count } });
    return r.data?.incrementTierSold;
  }, [incrementMu]);

  return { create, update, remove, incrementSold };
}

// ─── Recurring Bookings ───────────────────────────────────────
export function useRecurringBookings(roomId?: string) {
  const { data, loading, error, refetch } = useQuery(RECURRING_BOOKINGS_QUERY, {
    variables: { roomId },
    fetchPolicy: 'cache-and-network',
  });
  return { bookings: data?.recurringBookings ?? [], loading, error, refetch };
}

export function useRecurringBooking(id: string) {
  const { data, loading, error, refetch } = useQuery(RECURRING_BOOKING_QUERY, {
    variables: { id },
    skip: !id,
    fetchPolicy: 'cache-and-network',
  });
  return { booking: data?.recurringBooking, loading, error, refetch };
}

export function useRecurringBookingMutations() {
  const client = useApolloClient();
  const [createMu] = useMutation(CREATE_RECURRING_BOOKING_MUTATION);
  const [expandMu] = useMutation(EXPAND_RECURRING_MUTATION);
  const [cancelMu] = useMutation(CANCEL_RECURRING_BOOKING_MUTATION);
  const [countMu] = useMutation(COUNT_RECURRING_OCCURRENCES_MUTATION);

  const create = useCallback(async (input: any) => {
    const r = await createMu({ variables: { input } });
    toast.success('Recurring booking created');
    return r.data?.createRecurringBooking;
  }, [createMu]);

  const expand = useCallback(async (id: string) => {
    const r = await expandMu({ variables: { id } });
    toast.success(`Expanded ${r.data?.expandRecurring?.length ?? 0} occurrences`);
    return r.data?.expandRecurring;
  }, [expandMu]);

  const cancel = useCallback(async (id: string) => {
    const r = await cancelMu({ variables: { id } });
    toast.success('Recurring booking cancelled');
    return r.data?.cancelRecurringBooking;
  }, [cancelMu]);

  const countOccurrences = useCallback(async (id: string) => {
    const r = await countMu({ variables: { id } });
    return r.data?.countRecurringOccurrences;
  }, [countMu]);

  return { create, expand, cancel, countOccurrences };
}

// ─── Scheduled Reports ────────────────────────────────────────
export function useScheduledReports(userId?: string) {
  const { data, loading, error, refetch } = useQuery(SCHEDULED_REPORTS_QUERY, {
    variables: { userId },
    fetchPolicy: 'cache-and-network',
  });
  return { reports: data?.scheduledReports ?? [], loading, error, refetch };
}

export function useScheduledReport(id: string) {
  const { data, loading, error, refetch } = useQuery(SCHEDULED_REPORT_QUERY, {
    variables: { id },
    skip: !id,
    fetchPolicy: 'cache-and-network',
  });
  return { report: data?.scheduledReport, loading, error, refetch };
}

export function useScheduledReportMutations() {
  const [createMu] = useMutation(CREATE_SCHEDULED_REPORT_MUTATION);
  const [updateMu] = useMutation(UPDATE_SCHEDULED_REPORT_MUTATION);
  const [deleteMu] = useMutation(DELETE_SCHEDULED_REPORT_MUTATION);
  const [runMu] = useMutation(RUN_SCHEDULED_REPORT_MUTATION);

  const create = useCallback(async (input: any) => {
    const r = await createMu({ variables: { input } });
    toast.success('Scheduled report created');
    return r.data?.createScheduledReport;
  }, [createMu]);

  const update = useCallback(async (id: string, input: any) => {
    const r = await updateMu({ variables: { id, input } });
    toast.success('Report updated');
    return r.data?.updateScheduledReport;
  }, [updateMu]);

  const remove = useCallback(async (id: string) => {
    await deleteMu({ variables: { id } });
    toast.success('Report deleted');
  }, [deleteMu]);

  const runNow = useCallback(async (id: string) => {
    const r = await runMu({ variables: { id } });
    toast.success(r.data?.runScheduledReportNow ? 'Report sent' : 'Failed to send report');
    return r.data?.runScheduledReportNow;
  }, [runMu]);

  return { create, update, remove, runNow };
}

// ─── Calendar Sync ────────────────────────────────────────────
export function useCalendarConnections(userId: string) {
  const { data, loading, error, refetch } = useQuery(CALENDAR_CONNECTIONS_QUERY, {
    variables: { userId },
    skip: !userId,
    fetchPolicy: 'cache-and-network',
  });
  return { connections: data?.calendarConnections ?? [], loading, error, refetch };
}

export function useCalendarSyncMutations() {
  const client = useApolloClient();
  const [connectMu] = useMutation(CONNECT_CALENDAR_MUTATION);
  const [disconnectMu] = useMutation(DISCONNECT_CALENDAR_MUTATION);
  const [syncMu] = useMutation(SYNC_CALENDAR_MUTATION);
  const [toggleMu] = useMutation(TOGGLE_CALENDAR_SYNC_MUTATION);

  const connect = useCallback(async (vars: any) => {
    const r = await connectMu({ variables: vars });
    toast.success('Calendar connected');
    return r.data?.connectCalendar;
  }, [connectMu]);

  const disconnect = useCallback(async (id: string) => {
    await disconnectMu({ variables: { id } });
    toast.success('Calendar disconnected');
  }, [disconnectMu]);

  const sync = useCallback(async (id: string) => {
    const r = await syncMu({ variables: { id } });
    toast.success(r.data?.syncCalendar ? 'Calendar synced' : 'Sync failed');
    return r.data?.syncCalendar;
  }, [syncMu]);

  const toggle = useCallback(async (id: string, enabled: boolean) => {
    const r = await toggleMu({ variables: { id, enabled } });
    return r.data?.toggleSync;
  }, [toggleMu]);

  return { connect, disconnect, sync, toggle };
}