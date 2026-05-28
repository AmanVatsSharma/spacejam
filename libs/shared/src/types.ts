/**
 * File:        libs/shared/src/types.ts
 * Module:      Shared · Types
 * Purpose:     TypeScript types for SpaceJam domain models
 *
 * Exports:
 *   - Location, Center, Floor, Seat, Cabin, Booking, User, SeatStatus, CenterStatus
 *
 * Depends on:
 *   - None (pure types)
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-05-28
 */

export type SeatStatus = "available" | "occupied" | "maintenance" | "reserved";
export type CenterStatus = "active" | "full" | "maintenance";

export interface Location {
  id: string;
  name: string;
  city: string;
  centers: Center[];
}

export interface Center {
  id: string;
  name: string;
  locationId: string;
  floors: Floor[];
  status: CenterStatus;
}

export interface Floor {
  id: string;
  name: string;
  centerId: string;
  totalSeats: number;
  openSeats: number;
  cabins: number;
  occupancy: number;
  status: CenterStatus;
}

export interface Seat {
  id: string;
  number: string;
  floorId: string;
  type: "hot-desk" | "dedicated" | "cabin";
  status: SeatStatus;
  currentUserId?: string;
}

export interface Cabin extends Seat {
  type: "cabin";
  capacity: number;
}

export interface Booking {
  id: string;
  seatId: string;
  userId: string;
  startDate: Date;
  endDate?: Date;
  status: "confirmed" | "pending" | "cancelled";
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "center-manager" | "member";
  centerId?: string;
}
