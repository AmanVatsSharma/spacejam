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
export const SIGNIN_MUTATION = gql`
  mutation Signin($email: String!, $password: String!) {
    signin(input: { email: $email, password: $password }) {
      accessToken
      refreshToken
      user {
        id
        email
        name
        role
        tokenBalance
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
      tokenBalance
      center { id name }
    }
  }
`;

export const UPDATE_PROFILE_MUTATION = gql`
  mutation UpdateProfile($name: String) {
    updateProfile(name: $name) {
      id
      name
      email
    }
  }
`;

export const GET_HOME_DATA = gql`
  query GetHomeData {
    me {
      id
      name
      tokenBalance
    }
    myBookings {
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
    }
    invoices {
      id
      amount
      status
      dueDate
    }
  }
`;

export const GET_MY_BOOKINGS = gql`
  query GetMyBookings {
    myBookings {
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
    }
  }
`;

export const GET_INVOICES = gql`
  query GetInvoices {
    invoices {
      id
      amount
      status
      dueDate
      booking {
        id
        seat {
          name
        }
      }
    }
  }
`;

export const GET_SEATS = gql`
  query GetSeats {
    seats {
      id
      name
      type
      pricing {
        hourly
        daily
        monthly
      }
      floor {
        id
        name
        center {
          id
          name
        }
      }
    }
  }
`;

export const GET_EVENTS = gql`
  query GetEvents {
    upcomingEvents {
      id
      title
      description
      date
      startTime
      endTime
      status
    }
    todayEvents {
      id
      title
      description
      date
      startTime
      endTime
      status
    }
  }
`;

export const BOOK_ROOM_MUTATION = gql`
  mutation BookRoom(
    $roomId: String!
    $centerId: String!
    $eventDate: String!
    $startTime: String!
    $endTime: String!
    $title: String!
  ) {
    bookRoom(
      roomId: $roomId
      centerId: $centerId
      eventDate: $eventDate
      startTime: $startTime
      endTime: $endTime
      title: $title
    ) {
      id
    }
  }
`;

export const GET_EVENT = gql`
  query GetEvent($id: ID!) {
    event(id: $id) {
      id
      title
      description
      date
      startTime
      endTime
      status
    }
  }
`;

export const GET_NOTIFICATIONS = gql`
  query GetNotifications {
    myNotifications {
      id
      title
      body
      type
      read
      createdAt
    }
  }
`;

export const MARK_NOTIFICATION_READ = gql`
  mutation MarkNotificationRead($id: ID!) {
    markNotificationRead(id: $id, read: true) {
      id
      read
    }
  }
`;

export const RECHARGE_WALLET_MUTATION = gql`
  mutation RechargeWallet($amount: Int!) {
    rechargeWallet(amount: $amount) {
      id
      tokenBalance
    }
  }
`;
export const CREATE_REQUEST_MUTATION = gql`
  mutation CreateRequest($input: CreateRequestInput!) {
    createRequest(input: $input) {
      id
      title
      type
      status
    }
  }
`;

export const REGISTER_DEVICE_TOKEN_MUTATION = gql`
  mutation RegisterDeviceToken($token: String!) {
    registerDeviceToken(token: $token)
  }
`;
