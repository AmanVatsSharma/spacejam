/**
 * File:        apps/web/src/lib/apollo/enterprise-operations.ts
 * Module:      Web · Apollo · Enterprise Operations
 * Purpose:     GraphQL operations for enterprise features: equipment,
 *              event attendees, ticket tiers, recurring bookings,
 *              scheduled reports, calendar sync, audit log.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-20
 */
import { gql } from '@apollo/client';

// ─── Audit Log ────────────────────────────────────────────────
export const AUDIT_LOG_QUERY = gql`
  query AuditLog($filters: AuditLogFiltersInput, $limit: Int, $offset: Int) {
    auditLog(filters: $filters, limit: $limit, offset: $offset) {
      id
      action
      entityType
      entityId
      changes
      ipAddress
      createdAt
      user { id name email }
    }
  }
`;

// ─── Equipment ────────────────────────────────────────────────
export const EQUIPMENT_QUERY = gql`
  query Equipment($id: ID!) {
    equipment(id: $id) {
      id name type status description centerId assignedTo serialNumber purchaseDate warrantyExpiry assignedAt
      center { id name }
      assignedUser: user { id name email }
    }
  }
`;
export const EQUIPMENT_LIST_QUERY = gql`
  query EquipmentList($centerId: ID, $status: EquipmentStatus, $limit: Int, $offset: Int) {
    equipmentList(centerId: $centerId, status: $status, limit: $limit, offset: $offset) {
      id name type status description centerId assignedTo serialNumber purchaseDate warrantyExpiry assignedAt
      center { id name }
      assignedUser: user { id name }
    }
  }
`;
export const CREATE_EQUIPMENT_MUTATION = gql`
  mutation CreateEquipment($input: CreateEquipmentInput!) {
    createEquipment(input: $input) { id name type status description centerId assignedTo serialNumber purchaseDate warrantyExpiry assignedAt }
  }
`;
export const UPDATE_EQUIPMENT_MUTATION = gql`
  mutation UpdateEquipment($id: ID!, $input: UpdateEquipmentInput!) {
    updateEquipment(id: $id, input: $input) { id name type status description centerId assignedTo serialNumber purchaseDate warrantyExpiry assignedAt }
  }
`;
export const ASSIGN_EQUIPMENT_MUTATION = gql`
  mutation AssignEquipment($id: ID!, $userId: ID!, $assignedAt: String) {
    assignEquipment(id: $id, userId: $userId, assignedAt: $assignedAt) { id assignedTo assignedAt status }
  }
`;
export const UNASSIGN_EQUIPMENT_MUTATION = gql`
  mutation UnassignEquipment($id: ID!) {
    unassignEquipment(id: $id) { id assignedTo assignedAt status }
  }
`;
export const SET_EQUIPMENT_STATUS_MUTATION = gql`
  mutation SetEquipmentStatus($id: ID!, $status: EquipmentStatus!) {
    setEquipmentStatus(id: $id, status: $status) { id status }
  }
`;
export const DELETE_EQUIPMENT_MUTATION = gql`
  mutation DeleteEquipment($id: ID!) {
    deleteEquipment(id: $id)
  }
`;

// ─── Event Attendees ──────────────────────────────────────────
export const EVENT_ATTENDEES_QUERY = gql`
  query EventAttendees($filters: AttendeeFiltersInput) {
    eventAttendees(filters: $filters) {
      id eventId userId ticketTier seatNumber checkedIn checkInTime notes
      user { id name email }
    }
  }
`;
export const EVENT_ATTENDEE_COUNT_QUERY = gql`
  query AttendeeCount($eventId: ID!) {
    attendeeCount(eventId: $eventId)
    checkedInCount(eventId: $eventId)
  }
`;
export const ADD_ATTENDEE_MUTATION = gql`
  mutation AddAttendee($input: AddAttendeeInput!) {
    addAttendee(input: $input) { id eventId userId ticketTier seatNumber checkedIn checkInTime notes }
  }
`;
export const REMOVE_ATTENDEE_MUTATION = gql`
  mutation RemoveAttendee($eventId: ID!, $userId: ID!) {
    removeAttendee(eventId: $eventId, userId: $userId)
  }
`;
export const CHECK_IN_MUTATION = gql`
  mutation CheckInAttendee($eventId: ID!, $userId: ID!) {
    checkInAttendee(eventId: $eventId, userId: $userId) { id checkedIn checkInTime }
  }
`;
export const CHECK_OUT_MUTATION = gql`
  mutation CheckOutAttendee($eventId: ID!, $userId: ID!) {
    checkOutAttendee(eventId: $eventId, userId: $userId) { id checkedIn checkInTime }
  }
`;
export const BULK_CHECK_IN_MUTATION = gql`
  mutation BulkCheckIn($eventId: ID!) {
    bulkCheckIn(eventId: $eventId)
  }
`;

// ─── Ticket Tiers ─────────────────────────────────────────────
export const TICKET_TIERS_QUERY = gql`
  query TicketTiers($eventId: ID!) {
    ticketTiers(eventId: $eventId) {
      id eventId name price quantity soldCount earlyBirdEndDate description active
    }
  }
`;
export const CREATE_TICKET_TIER_MUTATION = gql`
  mutation CreateTicketTier($input: CreateTicketTierInput!) {
    createTicketTier(input: $input) { id eventId name price quantity soldCount earlyBirdEndDate description active }
  }
`;
export const UPDATE_TICKET_TIER_MUTATION = gql`
  mutation UpdateTicketTier($id: ID!, $input: UpdateTicketTierInput!) {
    updateTicketTier(id: $id, input: $input) { id name price quantity soldCount earlyBirdEndDate description active }
  }
`;
export const DELETE_TICKET_TIER_MUTATION = gql`
  mutation DeleteTicketTier($id: ID!) {
    deleteTicketTier(id: $id)
  }
`;
export const INCREMENT_TIER_SOLD_MUTATION = gql`
  mutation IncrementTierSold($id: ID!, $count: Int) {
    incrementTierSold(id: $id, count: $count) { id soldCount quantity }
  }
`;

// ─── Recurring Bookings ───────────────────────────────────────
export const RECURRING_BOOKINGS_QUERY = gql`
  query RecurringBookings($roomId: ID) {
    recurringBookings(roomId: $roomId) {
      id title roomId centerId userId pattern daysOfWeek startDate endDate startTime endTime occurrencesCreated active notes createdAt
      room { id name }
      center { id name }
      user { id name }
    }
  }
`;
export const RECURRING_BOOKING_QUERY = gql`
  query RecurringBooking($id: ID!) {
    recurringBooking(id: $id) { id title roomId centerId userId pattern daysOfWeek startDate endDate startTime endTime occurrencesCreated active notes }
  }
`;
export const CREATE_RECURRING_BOOKING_MUTATION = gql`
  mutation CreateRecurringBooking($input: CreateRecurringBookingInput!) {
    createRecurringBooking(input: $input) { id title roomId centerId userId pattern daysOfWeek startDate endDate startTime endTime occurrencesCreated active notes }
  }
`;
export const EXPAND_RECURRING_MUTATION = gql`
  mutation ExpandRecurring($id: ID!) {
    expandRecurring(id: $id) { id title eventDate startTime endTime status }
  }
`;
export const CANCEL_RECURRING_BOOKING_MUTATION = gql`
  mutation CancelRecurringBooking($id: ID!) {
    cancelRecurringBooking(id: $id) { id active }
  }
`;
export const COUNT_RECURRING_OCCURRENCES_MUTATION = gql`
  mutation CountRecurringOccurrences($id: ID!) {
    countRecurringOccurrences(id: $id)
  }
`;

// ─── Scheduled Reports ────────────────────────────────────────
export const SCHEDULED_REPORTS_QUERY = gql`
  query ScheduledReports($userId: ID) {
    scheduledReports(userId: $userId) {
      id userId centerId reportType frequency dayOfPeriod recipients filters enabled lastSentAt createdAt
      user { id name }
      center { id name }
    }
  }
`;
export const SCHEDULED_REPORT_QUERY = gql`
  query ScheduledReport($id: ID!) {
    scheduledReport(id: $id) { id userId centerId reportType frequency dayOfPeriod recipients filters enabled lastSentAt createdAt }
  }
`;
export const CREATE_SCHEDULED_REPORT_MUTATION = gql`
  mutation CreateScheduledReport($input: CreateScheduledReportInput!) {
    createScheduledReport(input: $input) { id userId centerId reportType frequency dayOfPeriod recipients filters enabled lastSentAt createdAt }
  }
`;
export const UPDATE_SCHEDULED_REPORT_MUTATION = gql`
  mutation UpdateScheduledReport($id: ID!, $input: UpdateScheduledReportInput!) {
    updateScheduledReport(id: $id, input: $input) { id enabled lastSentAt }
  }
`;
export const DELETE_SCHEDULED_REPORT_MUTATION = gql`
  mutation DeleteScheduledReport($id: ID!) {
    deleteScheduledReport(id: $id)
  }
`;
export const RUN_SCHEDULED_REPORT_MUTATION = gql`
  mutation RunScheduledReportNow($id: ID!) {
    runScheduledReportNow(id: $id)
  }
`;

// ─── Calendar Sync ────────────────────────────────────────────
export const CALENDAR_CONNECTIONS_QUERY = gql`
  query CalendarConnections($userId: ID!) {
    calendarConnections(userId: $userId) {
      id userId provider externalCalendarId email syncEnabled lastSyncedAt createdAt
    }
  }
`;
export const CALENDAR_CONNECTION_QUERY = gql`
  query CalendarConnection($userId: ID!, $provider: CalendarProvider!) {
    calendarConnection(userId: $userId, provider: $provider) { id userId provider externalCalendarId email syncEnabled lastSyncedAt }
  }
`;
export const CONNECT_CALENDAR_MUTATION = gql`
  mutation ConnectCalendar($userId: ID!, $provider: CalendarProvider!, $accessToken: String!, $refreshToken: String!, $expiresAt: String!, $externalCalendarId: String, $email: String) {
    connectCalendar(userId: $userId, provider: $provider, accessToken: $accessToken, refreshToken: $refreshToken, expiresAt: $expiresAt, externalCalendarId: $externalCalendarId, email: $email) { id userId provider externalCalendarId email syncEnabled lastSyncedAt }
  }
`;
export const DISCONNECT_CALENDAR_MUTATION = gql`
  mutation DisconnectCalendar($id: ID!) {
    disconnectCalendar(id: $id)
  }
`;
export const SYNC_CALENDAR_MUTATION = gql`
  mutation SyncCalendar($id: ID!) {
    syncCalendar(id: $id)
  }
`;
export const TOGGLE_CALENDAR_SYNC_MUTATION = gql`
  mutation ToggleSync($id: ID!, $enabled: Boolean!) {
    toggleSync(id: $id, enabled: $enabled)
  }
`;
