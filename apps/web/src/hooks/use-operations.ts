"use client";

/**
 * File:        apps/web/src/hooks/use-operations.ts
 * Module:      Web · Hooks · Operations
 * Purpose:     Apollo-based data layer for operations (Meeting Rooms, Events, Requests)
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-02
 */
import { useState } from 'react';
import { useQuery, useMutation, useApolloClient, gql } from '@apollo/client';
import {
  GET_BOOKINGS,
  CANCEL_ROOM_BOOKING,
  BULK_UPDATE_STATUS,
} from '@/lib/apollo/operations';

// ═══════════════════════════════════════════════════════
// GraphQL Documents
// ═══════════════════════════════════════════════════════

const GET_MEETING_ROOMS = gql`
  query GetMeetingRooms($filters: RoomFiltersInput) {
    meetingRooms(filters: $filters) {
      id name roomType capacity status locationName floorId centerId
      minBookingDuration maxBookingDuration amenities hourlyRate active
      createdAt updatedAt
    }
  }
`;

const GET_MEETING_ROOM = gql`
  query GetMeetingRoom($id: ID!) {
    meetingRoom(id: $id) {
      id name roomType capacity status locationName floorId centerId
      minBookingDuration maxBookingDuration amenities hourlyRate active
      center { id name }
      bookings { id startDate endDate status }
    }
  }
`;

const GET_AVAILABLE_ROOMS = gql`
  query GetAvailableRooms($centerId: String, $capacity: Int) {
    availableRooms(centerId: $centerId, capacity: $capacity) {
      id name roomType capacity status locationName amenities hourlyRate
    }
  }
`;

const GET_ROOM_AVAILABILITY = gql`
  query GetRoomAvailability($centerId: String!, $floorId: String!, $eventDate: String!, $startTime: String!, $endTime: String!) {
    roomAvailability(centerId: $centerId, floorId: $floorId, eventDate: $eventDate, startTime: $startTime, endTime: $endTime) {
      id name roomType capacity status amenities hourlyRate
    }
  }
`;

const GET_EVENTS = gql`
  query GetEvents($filters: EventFiltersInput) {
    events(filters: $filters) {
      id centerId meetingRoomId requestedById title description company
      eventDate startTime endTime durationMinutes attendeesCount
      eventType status specialRequests addons cost notes
      createdAt updatedAt
      meetingRoom { id name }
      requestedBy { id name email }
    }
  }
`;

const GET_EVENT = gql`
  query GetEvent($id: ID!) {
    event(id: $id) {
      id centerId meetingRoomId requestedById title description company
      eventDate startTime endTime durationMinutes attendeesCount
      eventType status specialRequests addons cost notes
      meetingRoom { id name roomType capacity }
      requestedBy { id name email }
    }
  }
`;

const GET_EVENT_STATISTICS = gql`
  query GetEventStatistics($centerId: String) {
    eventStatistics(centerId: $centerId) {
      totalEvents pendingEvents confirmedEvents completedEvents cancelledEvents
    }
  }
`;

const GET_REQUESTS = gql`
  query GetRequests($filters: RequestFiltersInput) {
    requests(filters: $filters) {
      id centerId requestedById assignedToId requestType title description
      urgency status dueDate completedDate resolution cost attachedFile
      createdAt updatedAt
      requestedBy { id name }
      assignedTo { id name }
    }
  }
`;

const GET_REQUEST = gql`
  query GetRequest($id: ID!) {
    request(id: $id) {
      id centerId requestedById assignedToId requestType title description
      urgency status dueDate completedDate resolution cost attachedFile
      createdAt updatedAt
      requestedBy { id name }
      assignedTo { id name }
    }
  }
`;

const GET_REQUEST_STATISTICS = gql`
  query GetRequestStatistics($centerId: String) {
    requestStats(centerId: $centerId) {
      totalRequests pendingRequests inProgressRequests completedRequests cancelledRequests highUrgencyRequests
    }
  }
`;

// ═══════════════════════════════════════════════════════
// Mutations — Meeting Rooms
// ═══════════════════════════════════════════════════════

const CREATE_MEETING_ROOM = gql`
  mutation CreateMeetingRoom($input: CreateMeetingRoomInput!) {
    createMeetingRoom(input: $input) {
      id name roomType capacity status locationName floorId amenities hourlyRate active
    }
  }
`;

const UPDATE_MEETING_ROOM = gql`
  mutation UpdateMeetingRoom($id: ID!, $input: UpdateMeetingRoomInput!) {
    updateMeetingRoom(id: $id, input: $input) {
      id name roomType capacity status locationName floorId amenities hourlyRate active
    }
  }
`;

const UPDATE_ROOM_STATUS = gql`
  mutation UpdateRoomStatus($id: ID!, $status: String!) {
    updateRoomStatus(id: $id, status: $status) {
      id name status
    }
  }
`;

const DELETE_MEETING_ROOM = gql`
  mutation DeleteMeetingRoom($id: ID!) {
    deleteMeetingRoom(id: $id)
  }
`;

const BOOK_ROOM = gql`
  mutation BookRoom($roomId: String!, $centerId: String!, $eventDate: String!, $startTime: String!, $endTime: String!, $title: String!, $requestedBy: String) {
    bookRoom(roomId: $roomId, centerId: $centerId, eventDate: $eventDate, startTime: $startTime, endTime: $endTime, title: $title, requestedBy: $requestedBy) {
      id name status
    }
  }
`;

// ═══════════════════════════════════════════════════════
// Mutations — Events
// ═══════════════════════════════════════════════════════

const CREATE_EVENT = gql`
  mutation CreateEvent($input: CreateEventInput!) {
    createEvent(input: $input) {
      success event { id title eventDate startTime endTime status cost }
      error
    }
  }
`;

const UPDATE_EVENT = gql`
  mutation UpdateEvent($id: ID!, $input: UpdateEventInput!) {
    updateEvent(id: $id, input: $input) {
      success event { id title eventDate startTime endTime status cost }
      error
    }
  }
`;

const UPDATE_EVENT_STATUS = gql`
  mutation UpdateEventStatus($id: ID!, $status: EventStatus!) {
    updateEventStatus(id: $id, status: $status) {
      success event { id title eventDate startTime endTime status cost }
      error
    }
  }
`;

const CANCEL_EVENT = gql`
  mutation CancelEvent($id: ID!) {
    cancelEvent(id: $id)
  }
`;

const DELETE_EVENT = gql`
  mutation DeleteEvent($id: ID!) {
    deleteEvent(id: $id)
  }
`;

// ═══════════════════════════════════════════════════════
// Mutations — Requests
// ═══════════════════════════════════════════════════════

const CREATE_REQUEST = gql`
  mutation CreateRequest($input: CreateRequestInput!) {
    createRequest(input: $input) {
      id title requestType urgency status dueDate cost
    }
  }
`;

const UPDATE_REQUEST = gql`
  mutation UpdateRequest($id: ID!, $input: UpdateRequestInput!) {
    updateRequest(id: $id, input: $input) {
      id title requestType urgency status dueDate resolution cost
    }
  }
`;

const ASSIGN_REQUEST = gql`
  mutation AssignRequest($id: ID!, $assignedToId: String!) {
    assignRequest(id: $id, assignedToId: $assignedToId) {
      id title urgency status assignedTo { id name }
    }
  }
`;

const APPROVE_REQUEST = gql`
  mutation ApproveRequest($id: ID!) {
    approveRequest(id: $id) {
      id title status requestType urgency
    }
  }
`;

const COMPLETE_REQUEST = gql`
  mutation CompleteRequest($id: ID!, $resolution: String) {
    completeRequest(id: $id, resolution: $resolution) {
      id title status completedDate resolution
    }
  }
`;

const REJECT_REQUEST = gql`
  mutation RejectRequest($id: ID!, $resolution: String!) {
    rejectRequest(id: $id, resolution: $resolution) {
      id title status resolution
    }
  }
`;

const CANCEL_REQUEST = gql`
  mutation CancelRequest($id: ID!) {
    cancelRequest(id: $id)
  }
`;

const DELETE_REQUEST = gql`
  mutation DeleteRequest($id: ID!) {
    deleteRequest(id: $id)
  }
`;

// ═══════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════

export type RoomStatus = 'AVAILABLE' | 'BOOKED' | 'OCCUPIED' | 'MAINTENANCE';
export type EventStatusType = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'REJECTED';
export type EventTypeOption = 'MEETING' | 'CONFERENCE' | 'WORKSHOP' | 'TRAINING' | 'SOCIAL' | 'OTHER';
export type RequestStatusType = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';
export type RequestTypeOption = 'PRINTER' | 'UPGRADE' | 'SERVICES' | 'EVENTS' | 'MAINTENANCE' | 'CLEANING' | 'SECURITY' | 'OTHER';
export type UrgencyType = 'LOW' | 'MEDIUM' | 'HIGH';

export interface RoomFilters {
  centerId?: string;
  floorId?: string;
  type?: string;
  status?: RoomStatus;
  minCapacity?: number;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface EventFilters {
  status?: EventStatusType;
  type?: EventTypeOption;
  centerId?: string;
  meetingRoomId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface RequestFilters {
  status?: RequestStatusType;
  type?: RequestTypeOption;
  centerId?: string;
  assignedToId?: string;
  requestedById?: string;
  urgency?: UrgencyType;
  search?: string;
  pendingOnly?: boolean;
  limit?: number;
  offset?: number;
}

// ═══════════════════════════════════════════════════════
// Hooks — Meeting Rooms
// ═══════════════════════════════════════════════════════

export function useMeetingRooms(filters?: RoomFilters) {
  const { data, loading, error, refetch } = useQuery(GET_MEETING_ROOMS, {
    variables: { filters },
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });

  return {
    rooms: data?.meetingRooms ?? [],
    loading,
    error,
    refetch,
  };
}

export function useMeetingRoom(id: string) {
  const { data, loading, error } = useQuery(GET_MEETING_ROOM, {
    variables: { id },
    skip: !id,
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });

  return {
    room: data?.meetingRoom ?? null,
    loading,
    error,
  };
}

export function useAvailableRooms(centerId?: string, minCapacity?: number) {
  const { data, loading, error, refetch } = useQuery(GET_AVAILABLE_ROOMS, {
    variables: { centerId, capacity: minCapacity },
    skip: !centerId,
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });

  return {
    rooms: data?.availableRooms ?? [],
    loading,
    error,
    refetch,
  };
}

export function useRoomAvailability(
  centerId: string,
  floorId: string,
  eventDate: string,
  startTime: string,
  endTime: string,
) {
  const { data, loading, error, refetch } = useQuery(GET_ROOM_AVAILABILITY, {
    variables: { centerId, floorId, eventDate, startTime, endTime },
    skip: !centerId,
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });

  return {
    availableRooms: data?.roomAvailability ?? [],
    loading,
    error,
    refetch,
  };
}

export function useCreateMeetingRoom() {
  const client = useApolloClient();
  const [saving, setSaving] = useState(false);

  const [mutation] = useMutation(CREATE_MEETING_ROOM, {
    errorPolicy: 'all',
  });

  async function create(input: Record<string, unknown>) {
    setSaving(true);
    try {
      const result = await mutation({ variables: { input } });
      await client.refetchQueries({ include: ['GetMeetingRooms'] });
      return result.data?.createMeetingRoom ?? null;
    } finally {
      setSaving(false);
    }
  }

  return { create, saving };
}

export function useUpdateMeetingRoom() {
  const client = useApolloClient();
  const [saving, setSaving] = useState(false);

  const [mutation] = useMutation(UPDATE_MEETING_ROOM, {
    errorPolicy: 'all',
  });

  async function update(id: string, input: Record<string, unknown>) {
    setSaving(true);
    try {
      const result = await mutation({ variables: { id, input } });
      await client.refetchQueries({ include: ['GetMeetingRooms'] });
      return result.data?.updateMeetingRoom ?? null;
    } finally {
      setSaving(false);
    }
  }

  return { update, saving };
}

export function useUpdateRoomStatus() {
  const client = useApolloClient();
  const [updating, setUpdating] = useState(false);

  const [mutation] = useMutation(UPDATE_ROOM_STATUS, {
    errorPolicy: 'all',
  });

  async function updateStatus(id: string, status: string) {
    setUpdating(true);
    try {
      const result = await mutation({ variables: { id, status } });
      await client.refetchQueries({ include: ['GetMeetingRooms'] });
      return result.data?.updateRoomStatus ?? null;
    } finally {
      setUpdating(false);
    }
  }

  return { updateStatus, updating };
}

export function useDeleteMeetingRoom() {
  const client = useApolloClient();
  const [deleting, setDeleting] = useState(false);

  const [mutation] = useMutation(DELETE_MEETING_ROOM, {
    errorPolicy: 'all',
  });

  async function remove(id: string) {
    setDeleting(true);
    try {
      await mutation({ variables: { id } });
      await client.refetchQueries({ include: ['GetMeetingRooms'] });
      return true;
    } catch {
      return false;
    } finally {
      setDeleting(false);
    }
  }

  return { deleteRoom: remove, deleting };
}

export function useBookRoom() {
  const client = useApolloClient();
  const [booking, setBooking] = useState(false);

  const [mutation] = useMutation(BOOK_ROOM, {
    errorPolicy: 'all',
  });

  async function book(vars: {
    roomId: string;
    centerId: string;
    eventDate: string;
    startTime: string;
    endTime: string;
    title: string;
    requestedBy?: string;
  }) {
    setBooking(true);
    try {
      const result = await mutation({ variables: vars });
      await client.refetchQueries({ include: ['GetMeetingRooms', 'GetEvents'] });
      return result.data?.bookRoom ?? null;
    } finally {
      setBooking(false);
    }
  }

  return { book, booking };
}

export function useCancelRoomBooking() {
  const client = useApolloClient();
  const [cancelling, setCancelling] = useState(false);
  const [cancel] = useMutation(CANCEL_ROOM_BOOKING, {
    refetchQueries: ['GetMeetingRooms', 'GetTodayEvents', 'GetUpcomingEvents'],
  });
  async function cancelBooking(bookingId: string, roomId: string) {
    setCancelling(true);
    try {
      await cancel({ variables: { bookingId, roomId } });
      await client.refetchQueries({ include: ['GetMeetingRooms', 'GetTodayEvents', 'GetUpcomingEvents'] });
    } finally {
      setCancelling(false);
    }
  }
  return { cancelBooking, cancelling };
}

export function useBulkUpdateStatus() {
  const client = useApolloClient();
  const [updating, setUpdating] = useState(false);
  const [bulkUpdate] = useMutation(BULK_UPDATE_STATUS, {
    refetchQueries: ['GetMeetingRooms'],
  });
  async function update(roomIds: string[], status: string) {
    setUpdating(true);
    try {
      await bulkUpdate({ variables: { roomIds, status } });
      await client.refetchQueries({ include: ['GetMeetingRooms'] });
    } finally {
      setUpdating(false);
    }
  }
  return { update, updating };
}


// ═══════════════════════════════════════════════════════
// Hooks — Events
// ═══════════════════════════════════════════════════════

export function useEvents(filters?: EventFilters) {
  const { data, loading, error, refetch } = useQuery(GET_EVENTS, {
    variables: { filters },
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });

  return {
    events: data?.events ?? [],
    data,
    loading,
    error,
    refetch,
  };
}

export function useEvent(id: string) {
  const { data, loading, error } = useQuery(GET_EVENT, {
    variables: { id },
    skip: !id,
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });

  return {
    event: data?.event ?? null,
    loading,
    error,
  };
}

export function useEventStats(centerId?: string) {
  const { data, loading, error } = useQuery(GET_EVENT_STATISTICS, {
    variables: { centerId },
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });

  return {
    stats: data?.eventStatistics ?? {
      totalEvents: 0,
      pendingEvents: 0,
      confirmedEvents: 0,
      completedEvents: 0,
      cancelledEvents: 0,
    },
    loading,
    error,
  };
}

export function useCreateEvent() {
  const client = useApolloClient();
  const [saving, setSaving] = useState(false);

  const [mutation] = useMutation(CREATE_EVENT, {
    errorPolicy: 'all',
  });

  async function create(input: Record<string, unknown>) {
    setSaving(true);
    try {
      const result = await mutation({ variables: { input } });
      if (result.errors?.length) {
        return { success: false, error: result.errors[0].message, event: null };
      }
      await client.refetchQueries({ include: ['GetEvents'] });
      return result.data?.createEvent ?? { success: false, error: 'Unknown error', event: null };
    } finally {
      setSaving(false);
    }
  }

  return { create, saving };
}

export function useUpdateEvent() {
  const client = useApolloClient();
  const [saving, setSaving] = useState(false);

  const [mutation] = useMutation(UPDATE_EVENT, {
    errorPolicy: 'all',
  });

  async function update(id: string, input: Record<string, unknown>) {
    setSaving(true);
    try {
      const result = await mutation({ variables: { id, input } });
      await client.refetchQueries({ include: ['GetEvents'] });
      return result.data?.updateEvent ?? { success: false, error: 'Unknown error', event: null };
    } finally {
      setSaving(false);
    }
  }

  return { update, saving };
}

export function useUpdateEventStatus() {
  const client = useApolloClient();
  const [saving, setSaving] = useState(false);

  const [mutation] = useMutation(UPDATE_EVENT_STATUS, {
    errorPolicy: 'all',
  });

  async function updateStatus(id: string, status: EventStatusType) {
    setSaving(true);
    try {
      const result = await mutation({ variables: { id, status } });
      await client.refetchQueries({ include: ['GetEvents'] });
      return result.data?.updateEventStatus ?? { success: false, error: 'Unknown error', event: null };
    } finally {
      setSaving(false);
    }
  }

  return { updateStatus, saving };
}

export function useCancelEvent() {
  const client = useApolloClient();
  const [cancelling, setCancelling] = useState(false);

  const [mutation] = useMutation(CANCEL_EVENT, {
    errorPolicy: 'all',
  });

  async function cancel(id: string) {
    setCancelling(true);
    try {
      const result = await mutation({ variables: { id } });
      await client.refetchQueries({ include: ['GetEvents'] });
      return !result.errors?.length;
    } catch {
      return false;
    } finally {
      setCancelling(false);
    }
  }

  return { cancel, cancelling };
}

// ═══════════════════════════════════════════════════════
// Hooks — Requests
// ═══════════════════════════════════════════════════════

export function useRequests(filters?: RequestFilters) {
  const { data, loading, error, refetch } = useQuery(GET_REQUESTS, {
    variables: { filters },
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });

  return {
    requests: data?.requests ?? [],
    loading,
    error,
    refetch,
  };
}

export function useRequest(id: string) {
  const { data, loading, error } = useQuery(GET_REQUEST, {
    variables: { id },
    skip: !id,
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });

  return {
    request: data?.request ?? null,
    loading,
    error,
  };
}

export function useRequestStats(centerId?: string) {
  const { data, loading, error } = useQuery(GET_REQUEST_STATISTICS, {
    variables: { centerId },
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });

  return {
    stats: data?.requestStats ?? {
      totalRequests: 0,
      pendingRequests: 0,
      inProgressRequests: 0,
      completedRequests: 0,
      cancelledRequests: 0,
      highUrgencyRequests: 0,
    },
    loading,
    error,
  };
}

export function useCreateRequest() {
  const client = useApolloClient();
  const [saving, setSaving] = useState(false);

  const [mutation] = useMutation(CREATE_REQUEST, {
    errorPolicy: 'all',
  });

  async function create(input: Record<string, unknown>) {
    setSaving(true);
    try {
      const result = await mutation({ variables: { input } });
      await client.refetchQueries({ include: ['GetRequests'] });
      return result.data?.createRequest ?? null;
    } finally {
      setSaving(false);
    }
  }

  return { create, saving };
}

export function useUpdateRequest() {
  const client = useApolloClient();
  const [saving, setSaving] = useState(false);

  const [mutation] = useMutation(UPDATE_REQUEST, {
    errorPolicy: 'all',
  });

  async function update(id: string, input: Record<string, unknown>) {
    setSaving(true);
    try {
      const result = await mutation({ variables: { id, input } });
      await client.refetchQueries({ include: ['GetRequests'] });
      return result.data?.updateRequest ?? null;
    } finally {
      setSaving(false);
    }
  }

  return { update, saving };
}

export function useAssignRequest() {
  const client = useApolloClient();
  const [assigning, setAssigning] = useState(false);

  const [mutation] = useMutation(ASSIGN_REQUEST, {
    errorPolicy: 'all',
  });

  async function assign(id: string, assignedToId: string) {
    setAssigning(true);
    try {
      const result = await mutation({ variables: { id, assignedToId } });
      await client.refetchQueries({ include: ['GetRequests'] });
      return result.data?.assignRequest ?? null;
    } finally {
      setAssigning(false);
    }
  }

  return { assign, assigning };
}

export function useApproveRequest() {
  const client = useApolloClient();
  const [approving, setApproving] = useState(false);

  const [mutation] = useMutation(APPROVE_REQUEST, {
    errorPolicy: 'all',
  });

  async function approve(id: string) {
    setApproving(true);
    try {
      const result = await mutation({ variables: { id } });
      await client.refetchQueries({ include: ['GetRequests'] });
      return result.data?.approveRequest ?? null;
    } finally {
      setApproving(false);
    }
  }

  return { approve, approving };
}

export function useCompleteRequest() {
  const client = useApolloClient();
  const [saving, setSaving] = useState(false);

  const [mutation] = useMutation(COMPLETE_REQUEST, {
    errorPolicy: 'all',
  });

  async function complete(id: string, resolution?: string) {
    setSaving(true);
    try {
      const result = await mutation({ variables: { id, resolution } });
      await client.refetchQueries({ include: ['GetRequests'] });
      return result.data?.completeRequest ?? null;
    } finally {
      setSaving(false);
    }
  }

  return { complete, saving };
}

export function useRejectRequest() {
  const client = useApolloClient();
  const [saving, setSaving] = useState(false);

  const [mutation] = useMutation(REJECT_REQUEST, {
    errorPolicy: 'all',
  });

  async function reject(id: string, resolution: string) {
    setSaving(true);
    try {
      const result = await mutation({ variables: { id, resolution } });
      await client.refetchQueries({ include: ['GetRequests'] });
      return result.data?.rejectRequest ?? null;
    } finally {
      setSaving(false);
    }
  }

  return { reject, saving };
}

export function useCancelRequest() {
  const client = useApolloClient();
  const [cancelling, setCancelling] = useState(false);

  const [mutation] = useMutation(CANCEL_REQUEST, {
    errorPolicy: 'all',
  });

  async function cancel(id: string) {
    setCancelling(true);
    try {
      await mutation({ variables: { id } });
      await client.refetchQueries({ include: ['GetRequests'] });
      return true;
    } catch {
      return false;
    } finally {
      setCancelling(false);
    }
  }

  return { cancelRequest: cancel, cancelling };

}

export function useDeleteRequest() {
  const client = useApolloClient();
  const [deleting, setDeleting] = useState(false);

  const [mutation] = useMutation(DELETE_REQUEST, {
    errorPolicy: 'all',
  });

  async function remove(id: string) {
    setDeleting(true);
    try {
      await mutation({ variables: { id } });
      await client.refetchQueries({ include: ['GetRequests'] });
      return true;
    } catch {
      return false;
    } finally {
      setDeleting(false);
    }
  }

  return { deleteRequest: remove, deleting };
}
