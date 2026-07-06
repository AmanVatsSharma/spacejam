/**
 * File:        apps/mobile/src/lib/apollo/operations.ts
 * Module:      Mobile · GraphQL Operations
 * Purpose:     Shared GQL queries/mutations — same queries as the web app
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-06
 */
import { gql } from '@apollo/client';

// Add your queries and mutations here as screens are built.
// These should mirror the operations in apps/web/src/lib/apollo/operations.ts

// ──────────────────────────────────────────────
// Auth
// ──────────────────────────────────────────────
export const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      accessToken
      refreshToken
      user {
        id
        email
        name
        role
      }
    }
  }
`;

// ──────────────────────────────────────────────
// Bookings
// ──────────────────────────────────────────────
export const GET_BOOKINGS = gql`
  query GetBookings($centerId: String, $status: BookingStatus) {
    bookings(centerId: $centerId, status: $status) {
      id
      date
      startTime
      endTime
      status
      seat {
        id
        name
        floor {
          name
          center { name }
        }
      }
      user { id name email }
    }
  }
`;

export const CREATE_BOOKING = gql`
  mutation CreateBooking($input: CreateBookingInput!) {
    createBooking(input: $input) {
      id
      status
      date
    }
  }
`;

// ──────────────────────────────────────────────
// Meeting Rooms
// ──────────────────────────────────────────────
export const GET_MEETING_ROOMS = gql`
  query GetMeetingRooms($centerId: String) {
    meetingRooms(centerId: $centerId) {
      id
      name
      capacity
      floor {
        name
        center { name }
      }
    }
  }
`;

// ──────────────────────────────────────────────
// User Profile
// ──────────────────────────────────────────────
export const GET_ME = gql`
  query GetMe {
    me {
      id
      email
      name
      phone
      role
      center { id name }
    }
  }
`;
