/**
 * File:        apps/web/src/components/ui/dashboard/index.ts
 * Module:      Web · UI · Dashboard Components
 * Purpose:     Export all dashboard UI components
 *
 * Exports:
 *   - TotalLeadCard - KPI card showing total leads with trend
 *   - ApprovalQueueCard - Card showing pending approvals
 *   - PaymentHealthCard - Card showing payment metrics
 *   - TasksComplianceCard - Card showing tasks and compliance
 *   - MeetingRoomBookingCard - Card showing room bookings
 *   - RoomAvailabilityCard - Card showing room availability
 *
 * Author:      Claude Code
 * Last-updated: 2026-05-29
 */

// KPI Cards
export { TotalLeadCard, TotalLeadCardDemo } from "./total-lead-card";
export { ApprovalQueueCard, ApprovalQueueCardDemo } from "./approval-queue-card";
export { PaymentHealthCard, PaymentHealthCardDemo } from "./payment-health-card";
export { TasksComplianceCard, TasksComplianceCardDemo } from "./tasks-compliance-card";

// Room Management Cards
export {
  MeetingRoomBookingCard,
  MeetingRoomBookingCardDemo,
  type BookingStatus,
} from "./meeting-room-booking-card";

export {
  RoomAvailabilityCard,
  RoomAvailabilityGrid,
  RoomAvailabilityDemo,
  type AvailabilityStatus,
} from "./room-availability-card";

// New Figma-style cards
export {
  RoomAvailabilityCircleCard,
  RoomAvailabilityCircleCardDemo,
  type RoomSubStat,
} from "./room-availability-circle-card";

export {
  MeetingRoomBookingGrid,
  MeetingRoomBookingGridDemo,
  type MeetingRoom,
  type RoomStatus,
} from "./meeting-room-booking-grid";

// Metric Cards - second stack
export { MetricCard, DepositHeldCardDemo, EventTodayCardDemo } from "./metric-cards";

// KPI Card with sparklines
export { KPICard } from "./kpi-card";

// Modals
export * from './add-lead-modal';
export * from './schedule-visit-modal';
export * from './send-proposal-modal';
export * from './add-client-modal';
export * from './book-room-modal';
export * from './pending-approvals-modal';
export * from './set-up-center-modal';
export * from './floor-setup-modal';
