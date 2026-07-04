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
        twoFactorEnabled
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
        twoFactorEnabled
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
      twoFactorEnabled
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
    resendVerification {
      ok
      message
    }
  }
`;

/**
 * Change the password for the currently-authenticated user. Used by
 * the in-app "change password" surface (different from reset-password,
 * which is for users who forgot theirs and use a one-time link).
 */
export const CHANGE_PASSWORD = gql`
  mutation ChangePassword($currentPassword: String!, $newPassword: String!) {
    changePassword(currentPassword: $currentPassword, newPassword: $newPassword) {
      ok
      message
    }
  }
`;

/**
 * Request a magic link to be sent to the given email. The link lets
 * the user sign in without a password, just by clicking the URL in
 * their inbox. Always returns ok: true (to avoid email enumeration).
 */
export const REQUEST_MAGIC_LINK = gql`
  mutation RequestMagicLink($email: String!) {
    requestMagicLink(email: $email) {
      ok
      message
    }
  }
`;

/**
 * Verify a magic-link token (from the URL the user clicked in email).
 * Returns the same AuthPayload as signin on success.
 */
export const VERIFY_MAGIC_LINK = gql`
  mutation VerifyMagicLink($token: String!) {
    verifyMagicLink(token: $token) {
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
        twoFactorEnabled
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

/* ========================= CRM — Leads ========================= */

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
  mutation MarkInvoicePaid($id: ID!, $paymentMethod: String) {
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
      amount
      type
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
      amount
      type
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
      type
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
      type
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
      createdAt
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
