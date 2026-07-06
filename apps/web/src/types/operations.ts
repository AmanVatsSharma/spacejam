/**
 * File:        apps/web/src/types/operations.ts
 * Module:      Web · Types · Operations
 * Purpose:     Type definitions for operations (Meeting Rooms, Events, Requests)
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-02
 */

export type EventStatus = 'PENDING' | 'CONFIRMED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
export type EventType = 'MEETING_ROOM' | 'CONFERENCE' | 'WORKSHOP' | 'PRIVATE_EVENT';
export type RequestStatus = 'PENDING' | 'IN_PROGRESS' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';
export type RequestType = 'MAINTENANCE' | 'CLEANING' | 'IT_SUPPORT' | 'INTERNET_SUPPORT' | 'PRINTER_ACCESS' | 'SUPPLIES' | 'SECURITY' | 'FURNITURE_UPGRADE' | 'EVENT_BOOKING' | 'OTHER';

export interface MeetingRoom {
  id: string;
  name: string;
  type: string;
  capacity: number;
  status: string;
  locationName: string;
  floorId: string;
  centerId: string;
  minBookingDuration: number;
  maxBookingDuration: number;
  amenities: string[];
  hourlyRate: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  id: string;
  centerId: string;
  meetingRoomId: string;
  requestedById: string;
  title: string;
  description?: string;
  company: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  attendeesCount: number;
  type: EventType;
  status: EventStatus;
  specialRequests?: string;
  addons?: string[];
  cost?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Request {
  id: string;
  title: string;
  description: string;
  type: RequestType;
  status: RequestStatus;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  requestedById?: string;
  assignedToId?: string;
  assignedTo?: string;
  centerId: string;
  dueDate: string;
  completedDate?: string | null;
  resolution?: string | null;
  cost: number;
  attachedFile?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}
