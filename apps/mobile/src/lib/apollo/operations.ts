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
      twoFactorRequired
      challengeToken
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

export const VERIFY_TWO_FACTOR_MUTATION = gql`
  mutation VerifyTwoFactor($challengeToken: String!, $code: String!) {
    verifyTwoFactor(input: { challengeToken: $challengeToken, code: $code }) {
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

export const REFRESH_TOKENS_MUTATION = gql`
  mutation RefreshTokens($refreshToken: String!) {
    refreshTokens(refreshToken: $refreshToken) {
      accessToken
      refreshToken
    }
  }
`;

export const EXTEND_BOOKING_MUTATION = gql`
  mutation ExtendBooking($id: ID!, $endTime: DateTime!) {
    extendBooking(id: $id, endTime: $endTime) {
      id
      startDate
      endDate
      status
      seat {
        id
        name
        floor {
          name
        }
      }
      meetingRoom {
        id
        name
      }
      center {
        id
        name
      }
    }
  }
`;

// ──────────────────────────────────────────────
// Bookings
// ──────────────────────────────────────────────
export const GET_BOOKINGS = gql`
  query GetBookings($filters: BookingFiltersInput) {
    bookings(filters: $filters) {
      id
      startDate
      endDate
      status
      totalPrice
      notes
      createdAt
      user { id name email phone }
      seat {
        id
        name
        seatType
        status
        price
        floor { id name }
      }
      center { id name }
      meetingRoom { id name }
      payment { id status method transactionId }
    }
  }
`;

export const CREATE_BOOKING = gql`
  mutation CreateBooking($input: CreateBookingInput!) {
    createBooking(input: $input) {
      id
      startDate
      endDate
      status
      totalPrice
      createdAt
      updatedAt
      seat { id name seatType status price }
      center { id name }
      payment { id status }
    }
  }
`;

// ──────────────────────────────────────────────
// Meeting Rooms
// ──────────────────────────────────────────────
export const GET_MEETING_ROOMS = gql`
  query GetMeetingRooms($filters: RoomFiltersInput) {
    meetingRooms(filters: $filters) {
      id
      name
      capacity
      roomType
      status
      hourlyRate
      minBookingDuration
      maxBookingDuration
      amenities
      locationName
      locationFullAddress
      center { id name }
      active
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
      startDate
      endDate
      status
      totalPrice
      createdAt
      seat {
        id
        name
        seatType
        floor { id name }
      }
      center { id name }
      meetingRoom { id name }
    }
    invoices {
      id
      invoiceNumber
      customerName
      amount
      tax
      totalAmount
      status
      issueDate
      dueDate
    }
  }
`;

export const GET_MY_BOOKINGS = gql`
  query GetMyBookings {
    myBookings {
      id
      startDate
      endDate
      status
      totalPrice
      createdAt
      seat {
        id
        name
        seatType
        floor { id name }
      }
      center { id name }
      meetingRoom { id name }
      payment { id status method }
    }
  }
`;

export const GET_INVOICES = gql`
  query GetInvoices($filters: InvoiceFiltersInput) {
    invoices(filters: $filters) {
      id
      invoiceNumber
      customerId
      customerName
      customerEmail
      centerId
      planName
      amount
      tax
      totalAmount
      status
      issueDate
      dueDate
      paidDate
      paymentMethod
      notes
      createdAt
      updatedAt
    }
  }
`;

export const GET_SEATS = gql`
  query GetSeats($floorId: ID) {
    seats(floorId: $floorId) {
      id
      name
      seatType
      status
      price
      amenities
      location
      floor { id name }
    }
  }
`;

export const GET_EVENTS = gql`
  query GetEvents {
    upcomingEvents {
      id
      title
      description
      company
      eventDate
      startTime
      endTime
      durationMinutes
      attendeesCount
      eventType
      status
      cost
      meetingRoom { id name }
    }
    todayEvents {
      id
      title
      description
      company
      eventDate
      startTime
      endTime
      durationMinutes
      attendeesCount
      eventType
      status
      cost
      meetingRoom { id name }
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
      company
      eventDate
      startTime
      endTime
      durationMinutes
      attendeesCount
      eventType
      status
      cost
      notes
      addons
      meetingRoom { id name }
      requestedBy { id name email }
    }
  }
`;

export const GET_NOTIFICATIONS = gql`
  query GetNotifications($unreadOnly: Boolean, $limit: Int) {
    myNotifications(unreadOnly: $unreadOnly, limit: $limit) {
      id
      userId
      centerId
      title
      message
      type
      priority
      read
      actionUrl
      metadata
      createdAt
      updatedAt
    }
  }
`;

export const NOTIFICATION_STATS = gql`
  query NotificationStats {
    notificationStats {
      total
      unread
      booking
      payment
      deposit
      lead
      request
      event
      system
    }
  }
`;

export const MARK_ALL_NOTIFICATIONS_READ = gql`
  mutation MarkAllNotificationsRead {
    markAllNotificationsRead
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
      requestType
      status
      urgency
      description
      createdAt
    }
  }
`;

export const REGISTER_DEVICE_TOKEN_MUTATION = gql`
  mutation RegisterDeviceToken($token: String!) {
    registerDeviceToken(token: $token)
  }
`;

// ──────────────────────────────────────────────
// Centers (real data for LocationModal + HomeScreen)
// ──────────────────────────────────────────────
export const GET_MY_CENTERS = gql`
  query GetMyCenters {
    myCenters {
      id
      name
      status
      settings
      location { id name city }
      floors { id name }
    }
  }
`;

// ──────────────────────────────────────────────
// Booking lifecycle (existing backend ops)
// ──────────────────────────────────────────────
export const CANCEL_BOOKING_MUTATION = gql`
  mutation CancelBooking($id: ID!) {
    cancelBooking(id: $id) {
      id
      status
      updatedAt
    }
  }
`;

export const PROCESS_PAYMENT_MUTATION = gql`
  mutation ProcessPayment($paymentId: ID!, $method: String!) {
    processPayment(paymentId: $paymentId, method: $method) {
      id
      status
      method
      transactionId
    }
  }
`;

// Real room availability — drives BookingDetailsScreen time-slot grid
export const GET_AVAILABLE_ROOMS = gql`
  query GetAvailableRooms($centerId: String, $minCapacity: Int) {
    availableRooms(centerId: $centerId, capacity: $minCapacity) {
      id
      name
      capacity
      roomType
      status
      hourlyRate
      amenities
    }
  }
`;

// ──────────────────────────────────────────────
// Wallet transaction history (WalletScreen)
// ──────────────────────────────────────────────
export const GET_MY_WALLET_TRANSACTIONS = gql`
  query GetMyWalletTransactions($limit: Int, $offset: Int, $type: String) {
    myWalletTransactions(limit: $limit, offset: $offset, type: $type) {
      id
      type
      amount
      balanceAfter
      reference
      description
      createdAt
    }
  }
`;

// ──────────────────────────────────────────────
// Print jobs (PrintPreview / MyPrintDetails / PrintUpload)
// ──────────────────────────────────────────────
export const GET_MY_PRINT_JOBS = gql`
  query GetMyPrintJobs($limit: Int) {
    myPrintJobs(limit: $limit) {
      id
      fileUrl
      fileName
      pages
      copies
      color
      paperSize
      sides
      cost
      status
      notes
      createdAt
      updatedAt
    }
  }
`;

export const GET_PRINT_JOB = gql`
  query GetPrintJob($id: ID!) {
    printJob(id: $id) {
      id
      fileUrl
      fileName
      pages
      copies
      color
      paperSize
      sides
      cost
      status
      notes
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_PRINT_JOB = gql`
  mutation CreatePrintJob($input: CreatePrintJobInput!) {
    createPrintJob(input: $input) {
      id
      fileUrl
      fileName
      pages
      copies
      color
      cost
      status
      createdAt
    }
  }
`;

// ──────────────────────────────────────────────
// Offers / promo codes (OffersScreen)
// ──────────────────────────────────────────────
export const GET_ACTIVE_OFFERS = gql`
  query GetActiveOffers {
    activeOffers {
      id
      code
      title
      description
      type
      value
      minOrderAmount
      maxDiscount
      validFrom
      validUntil
      isActive
      usageCount
      usageLimit
    }
  }
`;

export const VALIDATE_OFFER = gql`
  query ValidateOffer($code: String!, $orderAmount: Float!) {
    validateOffer(code: $code, orderAmount: $orderAmount)
  }
`;

export const REDEEM_OFFER = gql`
  mutation RedeemOffer($code: String!, $bookingId: ID, $orderAmount: Float) {
    redeemOffer(code: $code, bookingId: $bookingId, orderAmount: $orderAmount) {
      id
      offerId
      userId
      bookingId
      discountAmount
      redeemedAt
    }
  }
`;

// ──────────────────────────────────────────────
// Support tickets (SupportScreen)
// ──────────────────────────────────────────────
export const GET_MY_SUPPORT_TICKETS = gql`
  query GetMySupportTickets {
    mySupportTickets {
      id
      subject
      description
      category
      priority
      status
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_SUPPORT_TICKET = gql`
  mutation CreateSupportTicket($input: CreateSupportTicketInput!) {
    createSupportTicket(input: $input) {
      id
      subject
      description
      category
      priority
      status
      createdAt
    }
  }
`;

export const ADD_SUPPORT_MESSAGE = gql`
  mutation AddSupportMessage($ticketId: ID!, $message: String!) {
    addSupportMessage(ticketId: $ticketId, message: $message) {
      id
      ticketId
      userId
      isAdmin
      message
      createdAt
    }
  }
`;

// ──────────────────────────────────────────────
// Statements (StatementModal)
// ──────────────────────────────────────────────
export const GET_MY_STATEMENT = gql`
  query GetMyStatement($fromDate: String!, $toDate: String!) {
    myStatement(fromDate: $fromDate, toDate: $toDate) {
      fromDate
      toDate
      openingBalance
      closingBalance
      totalCredits
      totalDebits
      transactions {
        id
        date
        description
        credit
        debit
        balanceAfter
      }
    }
  }
`;

// ──────────────────────────────────────────────
// Referrals (ReferAndEarnScreen)
// ──────────────────────────────────────────────
export const GET_MY_REFERRALS = gql`
  query GetMyReferrals {
    myReferrals {
      id
      referrerId
      referredEmail
      referredUserId
      code
      status
      rewardAmount
      rewardedAt
      createdAt
    }
  }
`;

export const GET_MY_REFERRAL_STATS = gql`
  query GetMyReferralStats {
    myReferralStats {
      successful
      pending
      totalEarned
      referralCode
    }
  }
`;

export const CREATE_REFERRAL = gql`
  mutation CreateReferral($referredEmail: String!) {
    createReferral(referredEmail: $referredEmail) {
      id
      referredEmail
      code
      status
      createdAt
    }
  }
`;

// ──────────────────────────────────────────────
// Notification preferences (NotificationSettingsScreen)
// ──────────────────────────────────────────────
export const GET_MY_NOTIFICATION_PREFERENCES = gql`
  query GetMyNotificationPreferences {
    myNotificationPreferences {
      id
      userId
      meetingReminders
      billingAlerts
      specialOffers
      eventUpdates
      updatedAt
    }
  }
`;

export const UPDATE_NOTIFICATION_PREFERENCES = gql`
  mutation UpdateNotificationPreferences($input: UpdateNotificationPreferencesInput!) {
    updateNotificationPreferences(input: $input) {
      id
      meetingReminders
      billingAlerts
      specialOffers
      eventUpdates
      updatedAt
    }
  }
`;
