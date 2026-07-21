/**
 * File:        apps/web/src/lib/apollo/operations.ts
 * Module:      Web · Apollo · Operations
 * Purpose:     Reusable GraphQL operations (queries + mutations) for auth
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-20
 */
import { gql } from '@apollo/client';

export const SIGNIN_MUTATION = gql`
  mutation Signin($input: SigninInput!) {
    signin(input: $input) {
      accessToken
      refreshToken
      accessTokenExpiresAt
      refreshTokenExpiresAt
      twoFactorRequired
      challengeToken
      user {
        id
        email
        name
        role
        active
        emailVerified
      }
    }
  }
`;

export const SIGNUP_MUTATION = gql`
  mutation Signup($input: SignupInput!) {
    signup(input: $input) {
      accessToken
      refreshToken
      accessTokenExpiresAt
      refreshTokenExpiresAt
      twoFactorRequired
      challengeToken
      user {
        id
        email
        name
        role
        active
        emailVerified
      }
    }
  }
`;

export const VERIFY_TWO_FACTOR = gql`
  mutation VerifyTwoFactor($input: VerifyTwoFactorInput!) {
    verifyTwoFactor(input: $input) {
      accessToken
      refreshToken
      accessTokenExpiresAt
      refreshTokenExpiresAt
      user {
        id
        email
        name
        role
      }
    }
  }
`;

export const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout
  }
`;

export const REQUEST_PASSWORD_RESET = gql`
  mutation RequestPasswordReset($input: ForgotPasswordInput!) {
    requestPasswordReset(input: $input)
  }
`;

export const RESET_PASSWORD = gql`
  mutation ResetPassword($input: ResetPasswordInput!) {
    resetPassword(input: $input)
  }
`;

export const ME_QUERY = gql`
  query Me {
    me {
      id
      email
      name
      role
      active
      emailVerified
      lastLoginAt
      createdAt
    }
  }
`;

export const VERIFY_EMAIL = gql`
  mutation VerifyEmail($token: String!) {
    verifyEmail(token: $token) {
      ok
      message
    }
  }
`;

export const RESEND_VERIFICATION = gql`
  mutation ResendVerification {
    resendVerification
  }
`;

/**
 * Change the password for the currently-authenticated user. Used by
 * the in-app "change password" surface (different from reset-password,
 * which is for users who forgot theirs and use a one-time link).
 */
export const CHANGE_PASSWORD = gql`
  mutation ChangePassword($input: ChangePasswordInput!) {
    changePassword(input: $input)
  }
`;

/**
 * Request a magic link to be sent to the given email. The link lets
 * the user sign in without a password, just by clicking the URL in
 * their inbox. Always returns ok: true (to avoid email enumeration).
 */
export const REQUEST_MAGIC_LINK = gql`
  mutation RequestMagicLink($input: ForgotPasswordInput!) {
    requestMagicLink(input: $input)
  }
`;

/**
 * Verify a magic-link token (from the URL the user clicked in email).
 * Returns the same AuthPayload as signin on success.
 */
export const VERIFY_MAGIC_LINK = gql`
  mutation VerifyMagicLink($input: VerifyMagicLinkInput!) {
    verifyMagicLink(input: $input) {
      accessToken
      refreshToken
      accessTokenExpiresAt
      refreshTokenExpiresAt
      twoFactorRequired
      user {
        id
        email
        name
        role
        active
        emailVerified
        avatar
        lastLoginAt
        createdAt
      }
    }
  }
`;

/**
 * How many one-time recovery codes the current user has left.
 * Returns 0 once they're all used; the UI should prompt the user to
 * regenerate when this drops below 3.
 */
export const RECOVERY_CODES_REMAINING = gql`
  query RecoveryCodesRemaining {
    recoveryCodesRemaining
  }
`;

/**
 * Regenerate the user's one-time recovery codes. Returns the fresh
 * codes as a string array — the UI must show them once and never
 * again. The old codes are invalidated immediately.
 */
export const REGENERATE_RECOVERY_CODES = gql`
  mutation RegenerateRecoveryCodes {
    regenerateRecoveryCodes
  }
`;

/* ========================= Security — Session Management ========================= */

export const GET_USER_SESSIONS = gql`
  query GetUserSessions {
    myActiveSessions {
      id
      ipAddress
      userAgent
      isActive
      expiresAt
      createdAt
    }
  }
`;

export const LOGOUT_DEVICE = gql`
  mutation LogoutDevice($id: ID!) {
    logoutDevice(id: $id)
  }
`;

export const LOGOUT_ALL_DEVICES = gql`
  mutation LogoutAllDevices {
    logoutAllDevices
  }
`;

/* ========================= CRM — Leads ========================= */

export const GET_LEAD = gql`
  query GetLead($id: ID!) {
    lead(id: $id) {
      id
      name
      email
      phone
      company
      source
      requirement
      budget
      location
      status
      lastContact
      notes
      assignedTo {
        id
        name
        email
      }
      center {
        id
        name
      }
      createdAt
      updatedAt
    }
  }
`;

export const GET_LEADS = gql`
  query GetLeads($filters: LeadFiltersInput) {
    leads(filters: $filters) {
      id
      name
      email
      phone
      company
      source
      requirement
      budget
      location
      status
      lastContact
      assignedTo {
        id
        name
        email
      }
    }
  }
`;

export const CREATE_LEAD = gql`
  mutation CreateLead($input: CreateLeadInput!) {
    createLead(input: $input) {
      id
      name
      email
      phone
      company
      source
      requirement
      budget
      location
      status
      lastContact
    }
  }
`;

export const UPDATE_LEAD = gql`
  mutation UpdateLead($id: ID!, $input: UpdateLeadInput!) {
    updateLead(id: $id, input: $input) {
      id
      name
      email
      phone
      company
      source
      requirement
      budget
      location
      status
      lastContact
    }
  }
`;

export const CONVERT_LEAD = gql`
  mutation ConvertLead($id: ID!) {
    convertLead(id: $id) {
      id
      status
    }
  }
`;

export const DELETE_LEAD = gql`
  mutation DeleteLead($id: ID!) {
    deleteLead(id: $id)
  }
`;

export const LEAD_COUNT = gql`
  query LeadCount($status: LeadStatus) {
    leadCount(status: $status)
  }
`;

/* ========================= Revenue — Invoices ========================= */

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

export const GET_INVOICE = gql`
  query GetInvoice($id: ID!) {
    invoice(id: $id) {
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

export const CREATE_INVOICE = gql`
  mutation CreateInvoice($input: CreateInvoiceInput!) {
    createInvoice(input: $input) {
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

export const UPDATE_INVOICE = gql`
  mutation UpdateInvoice($id: ID!, $input: UpdateInvoiceInput!) {
    updateInvoice(id: $id, input: $input) {
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

export const DELETE_INVOICE = gql`
  mutation DeleteInvoice($id: ID!) {
    deleteInvoice(id: $id)
  }
`;

export const MARK_INVOICE_PAID = gql`
  mutation MarkInvoicePaid($id: ID!, $paymentMethod: PaymentMethod) {
    markInvoicePaid(id: $id, paymentMethod: $paymentMethod) {
      id
      invoiceNumber
      status
      paidDate
      paymentMethod
      updatedAt
    }
  }
`;

export const INVOICE_COUNT = gql`
  query InvoiceCount($status: InvoiceStatus) {
    invoiceCount(status: $status)
  }
`;

/* ========================= Revenue — Deposits ========================= */

export const GET_DEPOSITS = gql`
  query GetDeposits($filters: DepositFiltersInput) {
    deposits(filters: $filters) {
      id
      customerId
      customerName
      centerId
      center {
        id
        name
      }
      amount
      depositType
      status
      referenceNumber
      receivedDate
      releasedDate
      notes
      createdAt
      updatedAt
    }
  }
`;

export const GET_DEPOSIT = gql`
  query GetDeposit($id: ID!) {
    deposit(id: $id) {
      id
      customerId
      customerName
      centerId
      center {
        id
        name
      }
      amount
      depositType
      status
      referenceNumber
      receivedDate
      releasedDate
      notes
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_DEPOSIT = gql`
  mutation CreateDeposit($input: CreateDepositInput!) {
    createDeposit(input: $input) {
      id
      customerId
      customerName
      centerId
      amount
      status
      referenceNumber
      receivedDate
      releasedDate
      notes
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_DEPOSIT = gql`
  mutation UpdateDeposit($id: ID!, $input: UpdateDepositInput!) {
    updateDeposit(id: $id, input: $input) {
      id
      customerId
      customerName
      centerId
      amount
      status
      referenceNumber
      receivedDate
      releasedDate
      notes
      createdAt
      updatedAt
    }
  }
`;

export const RELEASE_DEPOSIT = gql`
  mutation ReleaseDeposit($id: ID!) {
    releaseDeposit(id: $id) {
      id
      status
      releasedDate
      updatedAt
    }
  }
`;

export const DELETE_DEPOSIT = gql`
  mutation DeleteDeposit($id: ID!) {
    deleteDeposit(id: $id)
  }
`;

export const FREEZE_DEPOSIT = gql`
  mutation FreezeDeposit($id: ID!) {
    freezeDeposit(id: $id) {
      id
      status
      frozen
      updatedAt
    }
  }
`;

export const UNFREEZE_DEPOSIT = gql`
  mutation UnfreezeDeposit($id: ID!) {
    unfreezeDeposit(id: $id) {
      id
      status
      frozen
      updatedAt
    }
  }
`;

export const REQUEST_DEPOSIT_RELEASE = gql`
  mutation RequestDepositRelease($id: ID!, $reason: String) {
    requestDepositRelease(id: $id, reason: $reason) {
      id
      status
      releaseRequestedDate
      releaseReason
      updatedAt
    }
  }
`;

export const APPROVE_DEPOSIT_RELEASE = gql`
  mutation ApproveDepositRelease($id: ID!) {
    approveDepositRelease(id: $id) {
      id
      status
      releasedDate
      updatedAt
    }
  }
`;

export const SEND_DEPOSIT_REMINDER = gql`
  mutation SendDepositReminder($id: ID!, $reminderType: String!) {
    sendDepositReminder(id: $id, reminderType: $reminderType)
  }
`;

export const EXPORT_DEPOSITS = gql`
  mutation ExportDeposits($format: String) {
    exportDeposits(format: $format)
  }
`;

/* ========================= Revenue — Contracts ========================= */

export const GET_CONTRACTS = gql`
  query GetContracts($filters: ContractFiltersInput) {
    contracts(filters: $filters) {
      id
      contractNumber
      customerId
      customerName
      centerId
      planName
      startDate
      endDate
      status
      amount
      paymentFrequency
      autoRenew
      terms
      createdAt
      updatedAt
    }
  }
`;

export const GET_CONTRACT = gql`
  query GetContract($id: ID!) {
    contract(id: $id) {
      id
      contractNumber
      customerId
      customerName
      centerId
      planName
      startDate
      endDate
      status
      amount
      paymentFrequency
      autoRenew
      terms
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_CONTRACT = gql`
  mutation CreateContract($input: CreateContractInput!) {
    createContract(input: $input) {
      id
      contractNumber
      customerId
      customerName
      centerId
      planName
      startDate
      endDate
      status
      amount
      paymentFrequency
      autoRenew
      terms
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_CONTRACT = gql`
  mutation UpdateContract($id: ID!, $input: UpdateContractInput!) {
    updateContract(id: $id, input: $input) {
      id
      contractNumber
      customerId
      customerName
      centerId
      planName
      startDate
      endDate
      status
      amount
      paymentFrequency
      autoRenew
      terms
      createdAt
      updatedAt
    }
  }
`;

export const TERMINATE_CONTRACT = gql`
  mutation TerminateContract($id: ID!) {
    terminateContract(id: $id) {
      id
      status
      updatedAt
    }
  }
`;

export const RENEW_CONTRACT = gql`
  mutation RenewContract($id: ID!, $newEndDate: DateTime!) {
    renewContract(id: $id, newEndDate: $newEndDate) {
      id
      endDate
      status
      updatedAt
    }
  }
`;

/* ========================= Revenue — Discounts ========================= */

export const GET_DISCOUNTS = gql`
  query GetDiscounts($centerId: ID) {
    discounts(centerId: $centerId) {
      id
      code
      percentage
      maxAmount
      description
      isActive
      validFrom
      validUntil
      minOrderAmount
      usageLimit
      usedCount
      applicableTo
      centerId
      createdAt
      updatedAt
    }
  }
`;

export const GET_DISCOUNT = gql`
  query GetDiscount($id: ID!) {
    discount(id: $id) {
      id
      code
      percentage
      maxAmount
      description
      isActive
      validFrom
      validUntil
      minOrderAmount
      usageLimit
      usedCount
      applicableTo
      centerId
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_DISCOUNT = gql`
  mutation CreateDiscount($input: CreateDiscountInput!) {
    createDiscount(input: $input) {
      id
      code
      percentage
      maxAmount
      description
      isActive
      validFrom
      validUntil
      minOrderAmount
      usageLimit
      usedCount
      applicableTo
      centerId
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_DISCOUNT = gql`
  mutation UpdateDiscount($id: ID!, $input: UpdateDiscountInput!) {
    updateDiscount(id: $id, input: $input) {
      id
      code
      percentage
      maxAmount
      description
      isActive
      validFrom
      validUntil
      minOrderAmount
      usageLimit
      usedCount
      applicableTo
      centerId
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_DISCOUNT = gql`
  mutation DeleteDiscount($id: ID!) {
    deleteDiscount(id: $id)
  }
`;

/* ========================= CRM — Customers ========================= */

export const GET_CUSTOMERS = gql`
  query GetCustomers($filters: CustomerFiltersInput) {
    customers(filters: $filters) {
      id
      name
      email
      phone
      company
      status
      totalBookings
      totalSpent
      lastBooking
      location
      centerId
      teamSize
      joinDate
      notes
      createdAt
      updatedAt
    }
  }
`;

export const GET_CUSTOMER = gql`
  query GetCustomer($id: ID!) {
    customer(id: $id) {
      id
      name
      email
      phone
      company
      status
      totalBookings
      totalSpent
      lastBooking
      location
      teamSize
      joinDate
      notes
      createdAt
    }
  }
`;

export const CREATE_CUSTOMER = gql`
  mutation CreateCustomer($input: CreateCustomerInput!) {
    createCustomer(input: $input) {
      id
      name
      email
      phone
      company
      status
      totalBookings
      totalSpent
      lastBooking
      createdAt
    }
  }
`;

export const UPDATE_CUSTOMER = gql`
  mutation UpdateCustomer($id: ID!, $input: UpdateCustomerInput!) {
    updateCustomer(id: $id, input: $input) {
      id
      name
      email
      phone
      company
      status
      totalBookings
      totalSpent
      lastBooking
      createdAt
    }
  }
`;

export const DELETE_CUSTOMER = gql`
  mutation DeleteCustomer($id: ID!) {
    deleteCustomer(id: $id)
  }
`;

/* ========================= CRM — Customer financial detail ========================= */

export const GET_CUSTOMER_DEPOSITS = gql`
  query GetCustomerDeposits($customerId: ID!) {
    customerDeposits(customerId: $customerId) {
      id
      customerId
      customerName
      amount
      depositType
      status
      referenceNumber
      receivedDate
      releasedDate
      freezeReason: releaseReason
      notes
    }
  }
`;

export const GET_CUSTOMER_CONTRACTS = gql`
  query GetCustomerContracts($customerId: ID!) {
    customerContracts(customerId: $customerId) {
      id
      contractNumber
      customerId
      customerName
      planName
      amount
      paymentFrequency
      status
      startDate
      endDate
      autoRenew
    }
  }
`;

export const GET_CUSTOMER_INVOICES = gql`
  query GetCustomerInvoices($customerId: ID!) {
    customerInvoices(customerId: $customerId) {
      id
      invoiceNumber
      customerId
      customerName
      amount
      tax
      totalAmount
      status
      issueDate
      dueDate
      paidDate
      paymentMethod
    }
  }
`;

export const TERMINATE_CONTRACT = gql`
  mutation TerminateContract($id: ID!) {
    terminateContract(id: $id) {
      id
      status
      endDate
    }
  }
`;

export const RENEW_CONTRACT = gql`
  mutation RenewContract($id: ID!, $newEndDate: DateTime!) {
    renewContract(id: $id, newEndDate: $newEndDate) {
      id
      endDate
      status
    }
  }
`;

export const FREEZE_DEPOSIT = gql`
  mutation FreezeDeposit($id: ID!) {
    freezeDeposit(id: $id) {
      id
      status
      frozen
    }
  }
`;

export const UNFREEZE_DEPOSIT = gql`
  mutation UnfreezeDeposit($id: ID!) {
    unfreezeDeposit(id: $id) {
      id
      status
      frozen
    }
  }
`;

export const RELEASE_DEPOSIT = gql`
  mutation ReleaseDeposit($id: ID!) {
    releaseDeposit(id: $id) {
      id
      status
      releasedDate
    }
  }
`;

export const REQUEST_DEPOSIT_RELEASE = gql`
  mutation RequestDepositRelease($id: ID!, $reason: String) {
    requestDepositRelease(id: $id, reason: $reason) {
      id
      status
      releaseRequestedDate
    }
  }
`;

export const SEND_DEPOSIT_REMINDER = gql`
  mutation SendDepositReminder($id: ID!, $reminderType: String!) {
    sendDepositReminder(id: $id, reminderType: $reminderType)
  }
`;

export const MARK_INVOICE_PAID = gql`
  mutation MarkInvoicePaid($id: ID!, $paymentMethod: PaymentMethod) {
    markInvoicePaid(id: $id, paymentMethod: $paymentMethod) {
      id
      status
      paidDate
    }
  }
`;

/* ========================= Analytics — Dashboard ========================= */

export const GET_DASHBOARD_METRICS = gql`
  query GetDashboardMetrics($centerId: ID) {
    dashboardMetrics(centerId: $centerId) {
      totalRevenue
      occupancyRate
      activeBookings
      pendingPayments
      totalSeats
      availableSeats
      revenueTrend {
        value
        direction
      }
      occupancyTrend {
        value
        direction
      }
      bookingsTrend {
        value
        direction
      }
    }
  }
`;

export const GET_REVENUE_REPORT = gql`
  query GetRevenueReport($centerId: ID, $period: TimePeriod) {
    revenueReport(centerId: $centerId, period: $period) {
      total
      byMonth {
        month
        revenue
        target
      }
      growth
    }
  }
`;

export const GET_OCCUPANCY_REPORT = gql`
  query GetOccupancyReport($centerId: ID!, $period: TimePeriod) {
    occupancyReport(centerId: $centerId, period: $period) {
      centerId
      byDay {
        date
        totalBookings
        occupancyRate
        revenue
      }
      bySeatType {
        type
        count
        occupancyRate
      }
      averageRate
    }
  }
`;

/* ========================= Centers / Floors / Seats ========================= */

export const GET_CENTERS = gql`
  query GetCenters {
    centers {
      id
      name
      status
      settings
      createdAt
      updatedAt
      location {
        id
        name
        city
        state
        country
        fullAddress
      }
      floors {
        id
        name
      }
    }
  }
`;

export const GET_CENTER = gql`
  query GetCenter($id: ID!) {
    center(id: $id) {
      id
      name
      status
      settings
      createdAt
      updatedAt
      location {
        id
        name
        city
        state
        country
        fullAddress
      }
      floors {
        id
        name
      }
    }
  }
`;

export const GET_MY_CENTERS = gql`
  query GetMyCenters {
    myCenters {
      id
      name
      status
      settings
      createdAt
      updatedAt
      location {
        id
        name
        city
      }
      floors {
        id
        name
      }
    }
  }
`;

export const CREATE_CENTER = gql`
  mutation CreateCenter($input: CreateCenterInput!) {
    createCenter(input: $input) {
      id
      name
      status
      settings
      createdAt
    }
  }
`;

export const UPDATE_CENTER = gql`
  mutation UpdateCenter($id: ID!, $input: UpdateCenterInput!) {
    updateCenter(id: $id, input: $input) {
      id
      name
      status
      settings
      updatedAt
    }
  }
`;

export const GET_FLOORS = gql`
  query GetFloors($centerId: ID) {
    floors(centerId: $centerId) {
      id
      name
      layout
      createdAt
      updatedAt
      seats {
        id
        name
        seatType
        status
        price
        amenities
        location
      }
    }
  }
`;

export const GET_SEATS = gql`
  query GetSeats($floorId: ID) {
    seats(floorId: $floorId) {
      id
      number
      seatType
      features
      status
      price
      location
      createdAt
      updatedAt
      floor {
        id
        name
      }
    }
  }
`;

export const CREATE_SEAT = gql`
  mutation CreateSeat($input: CreateSeatInput!) {
    createSeat(input: $input) {
      id
      name
      seatType
      status
      price
    }
  }
`;

export const CREATE_MEETING_ROOM = gql`
  mutation CreateMeetingRoom($input: CreateMeetingRoomInput!) {
    createMeetingRoom(input: $input) {
      id
      name
      roomType
      capacity
      status
      hourlyRate
      amenities
      centerId
      floorId
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_MEETING_ROOM = gql`
  mutation UpdateMeetingRoom($id: ID!, $input: UpdateMeetingRoomInput!) {
    updateMeetingRoom(id: $id, input: $input) {
      id
      name
      roomType
      capacity
      status
      hourlyRate
      amenities
      centerId
      floorId
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_MEETING_ROOM = gql`
  mutation DeleteMeetingRoom($id: ID!) {
    deleteMeetingRoom(id: $id)
  }
`;

export const CREATE_FLOOR = gql`
  mutation CreateFloor($input: CreateFloorInput!) {
    createFloor(input: $input) {
      id
      name
      layout
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_SEAT = gql`
  mutation UpdateSeat($id: ID!, $input: UpdateSeatInput!) {
    updateSeat(id: $id, input: $input) {
      id
      number
      seatType
      status
      price
    }
  }
`;

export const DELETE_FLOOR = gql`
  mutation DeleteFloor($id: ID!) {
    deleteFloor(id: $id)
  }
`;

export const DELETE_SEAT = gql`
  mutation DeleteSeat($id: ID!) {
    deleteSeat(id: $id)
  }
`;

export const UPDATE_FLOOR = gql`
  mutation UpdateFloor($id: ID!, $input: UpdateFloorInput!) {
    updateFloor(id: $id, input: $input) {
      id
      name
      layout
      createdAt
      updatedAt
    }
  }
`;

/* ========================= Operations — Bookings ========================= */

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
      updatedAt
      user {
        id
        name
        email
        phone
      }
      seat {
        id
        number
        seatType
        status
        price
        floor {
          id
          name
        }
      }
      center {
        id
        name
      }
      meetingRoom {
        id
        name
        type
      }
      payment {
        id
        status
        method
        transactionId
      }
    }
  }
`;

export const GET_BOOKING = gql`
  query GetBooking($id: ID!) {
    booking(id: $id) {
      id
      startDate
      endDate
      status
      totalPrice
      notes
      createdAt
      updatedAt
      user {
        id
        name
        email
        phone
      }
      seat {
        id
        number
        seatType
        status
        price
        floor {
          id
          name
        }
      }
      center {
        id
        name
      }
      meetingRoom {
        id
        name
        type
      }
      payment {
        id
        status
        method
        transactionId
      }
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
        number
        seatType
        floor {
          id
          name
        }
      }
      center {
        id
        name
      }
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
      notes
      createdAt
      updatedAt
      user {
        id
        name
        email
      }
      seat {
        id
        number
        seatType
        status
        price
      }
      center {
        id
        name
      }
      meetingRoom {
        id
        name
        type
      }
      payment {
        id
        status
      }
    }
  }
`;

export const CANCEL_BOOKING = gql`
  mutation CancelBooking($id: ID!) {
    cancelBooking(id: $id) {
      id
      status
      updatedAt
    }
  }
`;

export const CANCEL_ROOM_BOOKING = gql`
  mutation CancelRoomBooking($bookingId: String!, $roomId: String!) {
    cancelRoomBooking(bookingId: $bookingId, roomId: $roomId)
  }
`;

export const BULK_UPDATE_STATUS = gql`
  mutation BulkUpdateStatus($roomIds: [String!]!, $status: String!) {
    bulkUpdateStatus(roomIds: $roomIds, status: $status)
  }
`;

export const UPDATE_BOOKING = gql`
  mutation UpdateBooking($id: ID!, $input: UpdateBookingInput!) {
    updateBooking(id: $id, input: $input) {
      id
      startDate
      endDate
      status
      totalPrice
      notes
      updatedAt
      seat {
        id
        number
        seatType
        status
        price
      }
      payment {
        id
        status
      }
    }
  }
`;

export const CHECK_IN_BOOKING = gql`
  mutation CheckInBooking($id: ID!) {
    checkInBooking(id: $id) {
      id
      status
      updatedAt
    }
  }
`;

export const CHECK_OUT_BOOKING = gql`
  mutation CheckOutBooking($id: ID!) {
    checkOutBooking(id: $id) {
      id
      status
      updatedAt
    }
  }
`;

export const PROCESS_PAYMENT = gql`
  mutation ProcessPayment($paymentId: ID!, $method: String!) {
    processPayment(paymentId: $paymentId, method: $method) {
      id
      status
      method
      transactionId
      updatedAt
    }
  }
`;

/* ========================= Users ========================= */

export const GET_USERS = gql`
  query GetUsers($limit: Int, $offset: Int) {
    users(limit: $limit, offset: $offset) {
      id
      name
      email
      role
      phone
      centerId
      center {
        id
        name
      }
      active
      emailVerified
      lastLoginAt
      createdAt
    }
  }
`;

/* ========================= Users — mutations ========================= */

export const UPDATE_PROFILE = gql`
  mutation UpdateProfile($name: String) {
    updateProfile(name: $name) {
      id
      name
      email
      role
      updatedAt
    }
  }
`;

export const DELETE_USER = gql`
  mutation DeleteUser($id: ID!) {
    deleteUser(id: $id)
  }
`;

export const SET_USER_ROLE = gql`
  mutation SetUserRole($id: ID!, $role: UserRole!) {
    setUserRole(id: $id, role: $role)
  }
`;

export const SET_USER_ACTIVE = gql`
  mutation SetUserActive($id: ID!, $active: Boolean!) {
    setUserActive(id: $id, active: $active)
  }
`;

/* ========================= Events (today/upcoming) ========================= */

export const GET_TODAY_EVENTS = gql`
  query GetTodayEvents($centerId: String) {
    todayEvents(centerId: $centerId) {
      id
      centerId
      meetingRoomId
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
      createdAt
      updatedAt
      meetingRoom { id name }
      requestedBy { id name email }
    }
  }
`;

export const GET_UPCOMING_EVENTS = gql`
  query GetUpcomingEvents($centerId: String) {
    upcomingEvents(centerId: $centerId) {
      id
      centerId
      meetingRoomId
      title
      eventDate
      startTime
      endTime
      eventType
      status
      meetingRoom { id name }
    }
  }
`;

/* ========================= Center Settings ========================= */

export const GET_CENTER_SETTINGS = gql`
  query GetCenterSettings($centerId: ID!) {
    centerSettings(centerId: $centerId)
  }
`;

export const UPDATE_CENTER_SETTINGS = gql`
  mutation UpdateCenterSettings($centerId: ID!, $settings: String!) {
    updateCenterSettings(centerId: $centerId, settings: $settings)
  }
`;

/* ========================= Notifications ========================= */

export const GET_NOTIFICATIONS = gql`
  query GetNotifications($filters: NotificationFiltersInput) {
    notifications(filters: $filters) {
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
      user { id name email }
      center { id name }
    }
  }
`;

export const GET_NOTIFICATION = gql`
  query GetNotification($id: ID!) {
    notification(id: $id) {
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
  query NotificationStats($userId: ID, $centerId: ID) {
    notificationStats(userId: $userId, centerId: $centerId) {
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

export const MY_NOTIFICATIONS = gql`
  query MyNotifications($unreadOnly: Boolean, $limit: Int) {
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

export const CREATE_NOTIFICATION = gql`
  mutation CreateNotification($input: CreateNotificationInput!) {
    createNotification(input: $input) {
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
    }
  }
`;

export const SEND_NOTIFICATION = gql`
  mutation SendNotification($input: SendNotificationInput!) {
    sendNotification(input: $input)
  }
`;

export const MARK_NOTIFICATION_READ = gql`
  mutation MarkNotificationRead($id: ID!, $read: Boolean) {
    markNotificationRead(id: $id, read: $read) {
      id
      read
      updatedAt
    }
  }
`;

export const MARK_ALL_NOTIFICATIONS_READ = gql`
  mutation MarkAllNotificationsRead($userId: ID, $centerId: ID) {
    markAllNotificationsRead(userId: $userId, centerId: $centerId)
  }
`;

export const DELETE_NOTIFICATION = gql`
  mutation DeleteNotification($id: ID!) {
    deleteNotification(id: $id)
  }
`;
