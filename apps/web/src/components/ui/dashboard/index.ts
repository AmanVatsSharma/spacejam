/**
 * File:        apps/web/src/components/ui/dashboard/index.ts
 * Module:      Web · UI · Dashboard Components
 * Purpose:     Export all dashboard UI components
 *
 * Author:      Claude Code
 * Last-updated: 2026-07-19
 */

// KPI Cards
export { TotalLeadCard, TotalLeadCardDemo } from "./total-lead-card";
export { ApprovalQueueCard, ApprovalQueueCardDemo } from "./approval-queue-card";
export { PaymentHealthCard, PaymentHealthCardDemo } from "./payment-health-card";
export { TasksComplianceCard, TasksComplianceCardDemo } from "./tasks-compliance-card";

// Metric Cards - second stack
export { MetricCard, DepositHeldCardDemo, EventTodayCardDemo } from "./metric-cards";

// KPI Card with sparklines
export { KPICard } from "./kpi-card";

// Room availability & booking
export { RoomAvailabilityCircleCard } from "./room-availability-circle-card";
export { MeetingRoomBookingGrid } from "./meeting-room-booking-grid";

// Modals
export * from './add-lead-modal';
export * from './schedule-visit-modal';
export * from './send-proposal-modal';
export * from './add-client-modal';
export * from './pending-approvals-modal';
export * from './set-up-center-modal';
export * from './floor-setup-modal';
