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
