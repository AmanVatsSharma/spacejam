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

// Metric Cards - second stack
export { MetricCard, DepositHeldCardDemo, EventTodayCardDemo } from "./metric-cards";

// KPI Card with sparklines
export { KPICard } from "./kpi-card";