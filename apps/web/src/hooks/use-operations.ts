'use client';

/**
 * File:        apps/web/src/hooks/use-operations.ts
 * Module:      Web · Hooks · Operations
 * Purpose:     Apollo-based data layer for operations (Meeting Rooms, Events, Bookings, Payments)
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-23
 */
import { useState } from 'react';
import { useQuery, useApolloClient, gql } from '@apollo/client';
import {
  GET_BOOKINGS,
  CANCEL_ROOM_BOOKING,
  BULK_UPDATE_STATUS,
  GET_EVENTS,
} from '@/lib/apollo/operations';
import { toast } from 'sonner';

// ═══════════════════════════════════════════════════════
// GraphQL Documents
// ═══════════════════════════════════════════════════════

const GET_BOOKING_BY_ID = gql`
  query GetBookingById($id: ID!) {
    booking(id: $id) {
      id
      startDate
      endDate
      status
      totalPrice
      notes
      createdAt
      updatedAt
      seat {
        id
        name
        seatType
        status
        price
        floor {
          id
          name
          centerId
        }
      }
      user {
        id
        name
        email
      }
      payment {
        id
        status
        method
        amount
      }
    }
  }
`;

const GET_EVENT_BY_ID = gql`
  query GetEventById($id: ID!) {
    event(id: $id) {
      id
      title
      description
      startDate
      endDate
      isRecurring
      recurrenceRule
      maxAttendees
      centerId
      eventType
      status
      startTime
      endTime
    }
  }
`;

const CREATE_EVENT = gql`
  mutation CreateEvent($input: CreateEventInput!) {
    createEvent(input: $input) {
      success
      error
      event {
        id
        title
        startTime
        endTime
        eventDate
        status
      }
    }
  }
`;

const UPDATE_EVENT = gql`
  mutation UpdateEvent($id: ID!, $input: UpdateEventInput!) {
    updateEvent(id: $id, input: $input) {
      success
      error
      event {
        id
        title
        startTime
        endTime
        eventDate
        status
      }
    }
  }
`;

const DELETE_EVENT = gql`
  mutation DeleteEvent($id: ID!) {
    deleteEvent(id: $id)
  }
`;

const CREATE_BOOKING = gql`
  mutation CreateBooking($input: CreateBookingInput!) {
    createBooking(input: $input) {
      id
      seatId
      userId
      status
      startTime
      endTime
      totalPrice
      paymentId
      customerId
    }
  }
`;

const UPDATE_BOOKING = gql`
  mutation UpdateBooking($id: ID!, $input: UpdateBookingInput!) {
    updateBooking(id: $id, input: $input) {
      id
      seatId
      userId
      status
      startTime
      endTime
      totalPrice
      paymentId
      customerId
    }
  }
`;

const PROCESS_PAYMENT = gql`
  mutation ProcessPayment($paymentId: ID!, $method: String!) {
    processPayment(paymentId: $paymentId, method: $method) {
      id
      bookingId
      status
      method
      amount
      transactionId
    }
  }
`;

const MEETING_ROOMS = gql`
  query MeetingRooms($filters: RoomFiltersInput) {
    meetingRooms(filters: $filters) {
      id
      name
      capacity
      status
      floorId
      centerId
      roomType
      hourlyRate
      minBookingDuration
      maxBookingDuration
      active
      center {
        id
        name
      }
    }
  }
`;

const MEETING_ROOM_BY_ID = gql`
  query MeetingRoom($id: ID!) {
    meetingRoom(id: $id) {
      id
      name
      capacity
      status
      floorId
      centerId
      roomType
      hourlyRate
      active
      center {
        id
        name
      }
      floor {
        id
        name
      }
    }
  }
`;

const CREATE_MEETING_ROOM = gql`
  mutation CreateMeetingRoom($input: CreateMeetingRoomInput!) {
    createMeetingRoom(input: $input) {
      id
      name
      capacity
      status
      floorId
      centerId
      roomType
      hourlyRate
      active
    }
  }
`;

const UPDATE_MEETING_ROOM = gql`
  mutation UpdateMeetingRoom($id: ID!, $input: UpdateMeetingRoomInput!) {
    updateMeetingRoom(id: $id, input: $input) {
      id
      name
      capacity
      status
      floorId
      centerId
      roomType
      hourlyRate
      active
    }
  }
`;

const DELETE_MEETING_ROOM = gql`
  mutation DeleteMeetingRoom($id: ID!) {
    deleteMeetingRoom(id: $id)
  }
`;

const BOOK_ROOM = gql`
  mutation BookRoom(
    $roomId: String!
    $centerId: String!
    $eventDate: String!
    $startTime: String!
    $endTime: String!
    $title: String!
    $requestedBy: String!
    $description: String
    $attendeesCount: Int
  ) {
    bookRoom(
      roomId: $roomId
      centerId: $centerId
      eventDate: $eventDate
      startTime: $startTime
      endTime: $endTime
      title: $title
      requestedBy: $requestedBy
      description: $description
      attendeesCount: $attendeesCount
    ) {
      id
      name
      status
    }
  }
`;

// ═══════════════════════════════════════════════════════
// Requests (service requests: maintenance, IT, etc.)
// ═══════════════════════════════════════════════════════

const GET_REQUESTS = gql`
  query GetRequests($filters: RequestFiltersInput) {
    requests(filters: $filters) {
      id
      title
      description
      requestType
      status
      centerId
      requestedById
      assignedToId
      urgency
      dueDate
      resolution
      cost
      createdAt
      updatedAt
      center {
        id
        name
      }
      requestedBy {
        id
        name
      }
      assignedTo {
        id
        name
      }
    }
  }
`;

const GET_REQUEST_STATS = gql`
  query GetRequestStats($centerId: String) {
    requestStats(centerId: $centerId) {
      totalRequests
      pendingRequests
      inProgressRequests
      completedRequests
      cancelledRequests
      highUrgencyRequests
    }
  }
`;

const APPROVE_REQUEST = gql`
  mutation ApproveRequest($id: ID!) {
    approveRequest(id: $id) {
      id
      title
      status
      updatedAt
    }
  }
`;

const REJECT_REQUEST = gql`
  mutation RejectRequest($id: ID!, $resolution: String!) {
    rejectRequest(id: $id, resolution: $resolution) {
      id
      title
      status
      updatedAt
    }
  }
`;

const COMPLETE_REQUEST = gql`
  mutation CompleteRequest($id: ID!, $resolution: String) {
    completeRequest(id: $id, resolution: $resolution) {
      id
      title
      status
      updatedAt
    }
  }
`;

const ASSIGN_REQUEST = gql`
  mutation AssignRequest($id: ID!, $assignedToId: String!) {
    assignRequest(id: $id, assignedToId: $assignedToId) {
      id
      title
      status
      assignedToId
      assignedToName
      updatedAt
    }
  }
`;

const CANCEL_REQUEST = gql`
  mutation CancelRequest($id: ID!) {
    cancelRequest(id: $id)
  }
`;

const UPDATE_REQUEST = gql`
  mutation UpdateRequest($id: ID!, $input: UpdateRequestInput!) {
    updateRequest(id: $id, input: $input) {
      id
      title
      description
      status
      priority
      urgency
      updatedAt
    }
  }
`;

const CREATE_REQUEST = gql`
  mutation CreateRequest($input: CreateRequestInput!) {
    createRequest(input: $input) {
      id
      title
      description
      type
      status
      priority
      urgency
      createdAt
    }
  }
`;

// ═══════════════════════════════════════════════════════
// Event status / stats
// ═══════════════════════════════════════════════════════

const GET_EVENT_STATS = gql`
  query GetEventStats($centerId: String) {
    eventStatistics(centerId: $centerId) {
      totalEvents
      pendingEvents
      confirmedEvents
      completedEvents
      cancelledEvents
    }
  }
`;

const UPDATE_EVENT_STATUS = gql`
  mutation UpdateEventStatus($id: ID!, $status: EventStatus!) {
    updateEventStatus(id: $id, status: $status) {
      id
      title
      status
      updatedAt
    }
  }
`;

const CANCEL_EVENT = gql`
  mutation CancelEvent($id: ID!) {
    cancelEvent(id: $id)
  }
`;

// ═══════════════════════════════════════════════════════
// Booking hooks
// ═══════════════════════════════════════════════════════

export function useBookings(filters?: {
  centerId?: string;
  userId?: string;
  customerId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery(GET_BOOKINGS, {
    variables: { filters },
    fetchPolicy: 'cache-and-network',
  });
}

export function useBookingById(id: string | null) {
  return useQuery(GET_BOOKING_BY_ID, {
    variables: { id },
    skip: !id,
    fetchPolicy: 'cache-and-network',
  });
}

export function useCreateBooking() {
  const [loading, setLoading] = useState(false);
  const client = useApolloClient();

  const create = async (input: any): Promise<any> => {
    setLoading(true);
    try {
      const { data } = await client.mutate({
        mutation: CREATE_BOOKING,
        variables: { input },
        refetchQueries: [{ query: GET_BOOKINGS }],
      });
      toast.success('Booking created successfully');
      return data?.createBooking;
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create booking');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { create, loading };
}

export function useUpdateBooking() {
  const [loading, setLoading] = useState(false);
  const client = useApolloClient();

  const update = async (id: string, input: any): Promise<any> => {
    setLoading(true);
    try {
      const { data } = await client.mutate({
        mutation: UPDATE_BOOKING,
        variables: { id, input },
      });
      toast.success('Booking updated successfully');
      return data?.updateBooking;
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update booking');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { update, loading };
}

export function useCancelBooking() {
  const [loading, setLoading] = useState(false);
  const client = useApolloClient();

  const cancel = async (id: string): Promise<any> => {
    setLoading(true);
    try {
      const { data } = await client.mutate({
        mutation: CANCEL_ROOM_BOOKING,
        variables: { bookingId: id },
        refetchQueries: [{ query: GET_BOOKINGS }],
      });
      toast.success('Booking cancelled successfully');
      return data?.cancelRoomBooking;
    } catch (err: any) {
      toast.error(err?.message || 'Failed to cancel booking');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { cancel, loading };
}

export function useProcessPayment() {
  const [loading, setLoading] = useState(false);
  const client = useApolloClient();

  const process = async (paymentId: string, method: string): Promise<any> => {
    setLoading(true);
    try {
      const { data } = await client.mutate({
        mutation: PROCESS_PAYMENT,
        variables: { paymentId, method },
        refetchQueries: [{ query: GET_BOOKINGS }],
      });
      toast.success('Payment processed successfully');
      return data?.processPayment;
    } catch (err: any) {
      toast.error(err?.message || 'Failed to process payment');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { process, loading };
}

export function useBulkUpdateStatus() {
  const [loading, setLoading] = useState(false);
  const client = useApolloClient();

  const bulkUpdate = async (ids: string[], status: string): Promise<any> => {
    setLoading(true);
    try {
      const { data } = await client.mutate({
        mutation: BULK_UPDATE_STATUS,
        variables: { roomIds: ids, status },
        refetchQueries: [{ query: GET_BOOKINGS }],
      });
      toast.success(`Updated ${ids.length} bookings`);
      return data?.bulkUpdateStatus;
    } catch (err: any) {
      toast.error(err?.message || 'Failed to bulk update');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { bulkUpdate, loading };
}

// ═══════════════════════════════════════════════════════
// Events
// ═══════════════════════════════════════════════════════

export function useEvents(filters?: { centerId?: string; status?: string }) {
  const result = useQuery(GET_EVENTS, {
    variables: { filters },
    fetchPolicy: 'cache-and-network',
  });
  const { data, loading, error } = result;
  return { events: data?.events ?? [], loading, error };
}

export function useEventById(id: string | null) {
  return useQuery(GET_EVENT_BY_ID, {
    variables: { id },
    skip: !id,
    fetchPolicy: 'cache-and-network',
  });
}

export function useCreateEvent() {
  const [loading, setLoading] = useState(false);
  const client = useApolloClient();

  const create = async (input: any): Promise<any> => {
    setLoading(true);
    try {
      const { data } = await client.mutate({
        mutation: CREATE_EVENT,
        variables: { input },
      });
      return data?.createEvent;
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { create, saving: loading };
}

export function useUpdateEvent() {
  const [loading, setLoading] = useState(false);
  const client = useApolloClient();

  const update = async (id: string, input: any): Promise<any> => {
    setLoading(true);
    try {
      const { data } = await client.mutate({
        mutation: UPDATE_EVENT,
        variables: { id, input },
      });
      return data?.updateEvent;
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { update, saving: loading };
}

export function useDeleteEvent() {
  const [loading, setLoading] = useState(false);
  const client = useApolloClient();

  const remove = async (id: string): Promise<any> => {
    setLoading(true);
    try {
      const { data } = await client.mutate({
        mutation: DELETE_EVENT,
        variables: { id },
      });
      toast.success('Event deleted successfully');
      return data?.deleteEvent;
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete event');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { remove, loading };
}

// ═══════════════════════════════════════════════════════
// Meeting Rooms
// ═══════════════════════════════════════════════════════

export function useMeetingRooms(filters?: {
  centerId?: string;
  floorId?: string;
  status?: string;
  minCapacity?: number;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const result = useQuery(MEETING_ROOMS, {
    variables: { filters },
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });
  const { data, loading, error, refetch } = result;
  return { rooms: data?.meetingRooms ?? [], loading, error, refetch };
}

export function useMeetingRoomById(id: string | null) {
  return useQuery(MEETING_ROOM_BY_ID, {
    variables: { id },
    skip: !id,
    fetchPolicy: 'cache-and-network',
  });
}

export function useCancelRoomBooking() {
  const [loading, setLoading] = useState(false);
  const client = useApolloClient();

  const cancel = async (bookingId: string, roomId: string): Promise<any> => {
    setLoading(true);
    try {
      const { data } = await client.mutate({
        mutation: CANCEL_ROOM_BOOKING,
        variables: { bookingId, roomId },
      });
      toast.success('Booking cancelled');
      return data?.cancelRoomBooking ?? true;
    } catch (err: any) {
      toast.error(err?.message || 'Failed to cancel booking');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { cancel, loading };
}

export function useCreateMeetingRoom() {
  const [loading, setLoading] = useState(false);
  const client = useApolloClient();

  const create = async (input: any): Promise<any> => {
    setLoading(true);
    try {
      const { data } = await client.mutate({
        mutation: CREATE_MEETING_ROOM,
        variables: { input },
      });
      toast.success('Room created successfully');
      return data?.createMeetingRoom;
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create room');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { create, loading };
}

export function useUpdateMeetingRoom() {
  const [loading, setLoading] = useState(false);
  const client = useApolloClient();

  const update = async (id: string, input: any): Promise<any> => {
    setLoading(true);
    try {
      const { data } = await client.mutate({
        mutation: UPDATE_MEETING_ROOM,
        variables: { id, input },
      });
      toast.success('Room updated successfully');
      return data?.updateMeetingRoom;
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update room');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { update, loading };
}

export function useDeleteMeetingRoom() {
  const [loading, setLoading] = useState(false);
  const client = useApolloClient();

  const remove = async (id: string): Promise<any> => {
    setLoading(true);
    try {
      const { data } = await client.mutate({
        mutation: DELETE_MEETING_ROOM,
        variables: { id },
      });
      toast.success('Room deleted');
      return data?.deleteMeetingRoom;
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete room');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { remove, loading };
}

export function useBookRoom() {
  const [loading, setLoading] = useState(false);
  const client = useApolloClient();

  const book = async (input: {
    roomId: string;
    centerId?: string;
    eventDate: string;
    startTime: string;
    endTime: string;
    title: string;
    requestedBy?: string;
    description?: string;
    attendeesCount?: number;
  }): Promise<any> => {
    setLoading(true);
    try {
      const { data } = await client.mutate({
        mutation: BOOK_ROOM,
        variables: {
          roomId: input.roomId,
          centerId: input.centerId ?? '',
          eventDate: input.eventDate,
          startTime: input.startTime,
          endTime: input.endTime,
          title: input.title,
          requestedBy: input.requestedBy ?? '',
          description: input.description,
          attendeesCount: input.attendeesCount,
        },
        refetchQueries: [{ query: MEETING_ROOMS }],
      });
      toast.success('Room booked successfully');
      return data?.bookRoom;
    } catch (err: any) {
      toast.error(err?.message || 'Failed to book room');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { book, booking: null, loading } as const;
}

export function useCreateRoomBooking() {
  const [loading, setLoading] = useState(false);
  const client = useApolloClient();

  return [
    async (input: any): Promise<any> => {
      setLoading(true);
      try {
        const { data } = await client.mutate({
          mutation: BOOK_ROOM,
          variables: {
            roomId: input.roomId,
            centerId: input.centerId ?? '',
            eventDate: input.eventDate,
            startTime: input.startTime,
            endTime: input.endTime,
            title: input.title,
            requestedBy: input.requestedBy ?? '',
            description: input.description,
            attendeesCount: input.attendeesCount,
          },
          refetchQueries: [{ query: MEETING_ROOMS }],
        });
        toast.success('Room booked successfully');
        return data?.bookRoom;
      } catch (err: any) {
        toast.error(err?.message || 'Failed to book room');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    loading,
  ] as const;
}

export function useUpdateRoomBooking() {
  const [loading, setLoading] = useState(false);
  const client = useApolloClient();

  return [
    async (id: string, input: any): Promise<any> => {
      setLoading(true);
      try {
        const { data } = await client.mutate({
          mutation: UPDATE_EVENT,
          variables: { id, input },
        });
        toast.success('Room booking updated');
        return data?.updateEvent;
      } catch (err: any) {
        toast.error(err?.message || 'Failed to update room booking');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    loading,
  ] as const;
}

// ═══════════════════════════════════════════════════════
// Requests (service requests: maintenance, IT, etc.)
// ═══════════════════════════════════════════════════════

export function useRequests(filters?: {
  centerId?: string;
  status?: string;
  type?: string;
  limit?: number;
  offset?: number;
}) {
  const result = useQuery(GET_REQUESTS, {
    variables: { filters },
    fetchPolicy: 'cache-and-network',
  });
  const { data, loading, error } = result;
  return { requests: data?.requests ?? [], loading, error };
}

export function useRequestStats(centerId?: string) {
  const result = useQuery(GET_REQUEST_STATS, {
    variables: { centerId },
    fetchPolicy: 'cache-and-network',
  });
  const { data, loading, error } = result;
  return { stats: data?.requestStats ?? {}, loading, error };
}

export function useApproveRequest() {
  const [loading, setLoading] = useState(false);
  const client = useApolloClient();

  const approve = async (id: string): Promise<any> => {
    setLoading(true);
    try {
      const { data } = await client.mutate({
        mutation: APPROVE_REQUEST,
        variables: { id },
        refetchQueries: [{ query: GET_REQUESTS }],
      });
      toast.success('Request approved');
      return data?.approveRequest;
    } catch (err: any) {
      toast.error(err?.message || 'Failed to approve request');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { approve, approving: loading };
}

export function useRejectRequest() {
  const [loading, setLoading] = useState(false);
  const client = useApolloClient();

  const reject = async (id: string, resolution: string): Promise<any> => {
    setLoading(true);
    try {
      const { data } = await client.mutate({
        mutation: REJECT_REQUEST,
        variables: { id, resolution },
        refetchQueries: [{ query: GET_REQUESTS }],
      });
      toast.success('Request rejected');
      return data?.rejectRequest;
    } catch (err: any) {
      toast.error(err?.message || 'Failed to reject request');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { reject, saving: loading };
}

export function useCompleteRequest() {
  const [loading, setLoading] = useState(false);
  const client = useApolloClient();

  const complete = async (id: string, resolution?: string): Promise<any> => {
    setLoading(true);
    try {
      const { data } = await client.mutate({
        mutation: COMPLETE_REQUEST,
        variables: { id, resolution },
        refetchQueries: [{ query: GET_REQUESTS }],
      });
      toast.success('Request completed');
      return data?.completeRequest;
    } catch (err: any) {
      toast.error(err?.message || 'Failed to complete request');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { complete, completing: loading };
}

export function useAssignRequest() {
  const [loading, setLoading] = useState(false);
  const client = useApolloClient();

  const assign = async (id: string, assignedToId: string): Promise<any> => {
    setLoading(true);
    try {
      const { data } = await client.mutate({
        mutation: ASSIGN_REQUEST,
        variables: { id, assignedToId },
        refetchQueries: [{ query: GET_REQUESTS }],
      });
      toast.success('Request assigned');
      return data?.assignRequest;
    } catch (err: any) {
      toast.error(err?.message || 'Failed to assign request');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { assign, assigning: loading };
}

export function useCancelRequest() {
  const [loading, setLoading] = useState(false);
  const client = useApolloClient();

  const cancel = async (id: string): Promise<boolean> => {
    setLoading(true);
    try {
      const { data } = await client.mutate({
        mutation: CANCEL_REQUEST,
        variables: { id },
        refetchQueries: [{ query: GET_REQUESTS }],
      });
      toast.success('Request cancelled');
      return data?.cancelRequest ?? true;
    } catch (err: any) {
      toast.error(err?.message || 'Failed to cancel request');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { cancel, cancelling: loading };
}

export function useUpdateRequest() {
  const [loading, setLoading] = useState(false);
  const client = useApolloClient();

  const update = async (id: string, input: any): Promise<any> => {
    setLoading(true);
    try {
      const { data } = await client.mutate({
        mutation: UPDATE_REQUEST,
        variables: { id, input },
        refetchQueries: [{ query: GET_REQUESTS }],
      });
      toast.success('Request updated');
      return data?.updateRequest;
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update request');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { update, saving: loading };
}

export function useCreateRequest() {
  const [loading, setLoading] = useState(false);
  const client = useApolloClient();

  const create = async (input: any): Promise<any> => {
    setLoading(true);
    try {
      const { data } = await client.mutate({
        mutation: CREATE_REQUEST,
        variables: { input },
        refetchQueries: [{ query: GET_REQUESTS }],
      });
      toast.success('Request created');
      return data?.createRequest;
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create request');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { create, saving: loading };
}

// ═══════════════════════════════════════════════════════
// Event stats / status
// ═══════════════════════════════════════════════════════

export function useEventStats(centerId?: string) {
  const result = useQuery(GET_EVENT_STATS, {
    variables: { centerId },
    fetchPolicy: 'cache-and-network',
  });
  const { data, loading, error } = result;
  return { stats: data?.eventStatistics ?? {}, loading, error };
}

export function useUpdateEventStatus() {
  const [loading, setLoading] = useState(false);
  const client = useApolloClient();

  const updateStatus = async (
    id: string,
    status: string,
  ): Promise<{ success: boolean; event?: any; error?: string }> => {
    setLoading(true);
    try {
      const { data } = await client.mutate({
        mutation: UPDATE_EVENT_STATUS,
        variables: { id, status },
      });
      toast.success('Event status updated');
      return { success: true, event: data?.updateEventStatus };
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update event status');
      return { success: false, error: err?.message };
    } finally {
      setLoading(false);
    }
  };

  return { updateStatus, updating: loading };
}

export function useCancelEvent() {
  const [loading, setLoading] = useState(false);
  const client = useApolloClient();

  const cancel = async (id: string): Promise<boolean> => {
    setLoading(true);
    try {
      const { data } = await client.mutate({
        mutation: CANCEL_EVENT,
        variables: { id },
      });
      toast.success('Event cancelled');
      return data?.cancelEvent ?? true;
    } catch (err: any) {
      toast.error(err?.message || 'Failed to cancel event');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { cancel, cancelling: loading };
}

// ═══════════════════════════════════════════════════════
// Type aliases
// ═══════════════════════════════════════════════════════

export type EventStatusType =
  'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'REJECTED';
export type EventTypeOption =
  | 'MEETING'
  | 'MEETING_ROOM'
  | 'CONFERENCE'
  | 'WORKSHOP'
  | 'TRAINING'
  | 'SOCIAL'
  | 'OTHER';
