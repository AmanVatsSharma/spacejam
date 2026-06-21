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
