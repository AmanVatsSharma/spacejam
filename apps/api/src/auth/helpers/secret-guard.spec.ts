/**
 * File:        apps/api/src/auth/helpers/secret-guard.spec.ts
 * Module:      API · Auth · Startup guard (tests)
 * Purpose:     Production must refuse to boot with missing / placeholder signing
 *              secrets or the OTP dev bypass; other environments are untouched;
 *              error messages never contain the secret values.
 *
 * Author:      Claude Sonnet 5.5
 * Last-updated: 2026-10-03
 */
import { describe, it, expect } from 'vitest';
import { assertProductionSecrets, secretProblem, MIN_SECRET_LENGTH } from './secret-guard';

const STRONG = 'a3f9c2d17b8e4a6f90c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3'; // 64 hex chars
const prod = (over: Record<string, string | undefined> = {}) => ({ NODE_ENV: 'production', JWT_SECRET: STRONG, ...over }) as NodeJS.ProcessEnv;

describe('secretProblem', () => {
  it('accepts a long random value', () => {
    expect(secretProblem(STRONG)).toBeNull();
  });

  it.each([undefined, null, '', '   '])('rejects a missing value (%j)', (v) => {
    expect(secretProblem(v as any)).toBe('is not set');
  });

  it('rejects short values', () => {
    expect(secretProblem('x'.repeat(MIN_SECRET_LENGTH - 1))).toMatch(/too short/);
  });

  it.each([
    'dev-jwt-secret-padded-to-be-long-enough-xxxxxxxx',
    'production-jwt-key-change-me-and-more-padding-here',
    'CHANGEME-CHANGEME-CHANGEME-CHANGEME-CHANGEME',
  ])('rejects placeholder-looking values (%s)', (v) => {
    expect(secretProblem(v)).toBe('looks like a placeholder');
  });
});

describe('assertProductionSecrets', () => {
  it('does nothing outside production, even with weak secrets', () => {
    expect(() => assertProductionSecrets({ NODE_ENV: 'development', JWT_SECRET: 'dev-jwt-secret' } as NodeJS.ProcessEnv)).not.toThrow();
    expect(() => assertProductionSecrets({} as NodeJS.ProcessEnv)).not.toThrow();
    expect(() => assertProductionSecrets({ NODE_ENV: 'test', OTP_DEV_BYPASS: 'true' } as NodeJS.ProcessEnv)).not.toThrow();
  });

  it('passes in production with a strong JWT secret', () => {
    expect(() => assertProductionSecrets(prod())).not.toThrow();
  });

  it('refuses a missing JWT_SECRET in production', () => {
    expect(() => assertProductionSecrets(prod({ JWT_SECRET: undefined }))).toThrow(/JWT_SECRET is not set/);
  });

  it('refuses a short or placeholder JWT_SECRET in production', () => {
    expect(() => assertProductionSecrets(prod({ JWT_SECRET: 'production-jwt-key-change-me' }))).toThrow(/JWT_SECRET/);
    expect(() => assertProductionSecrets(prod({ JWT_SECRET: 'short' }))).toThrow(/too short/);
  });

  it('checks REFRESH_TOKEN_SECRET only when it is provided', () => {
    expect(() => assertProductionSecrets(prod({ REFRESH_TOKEN_SECRET: undefined }))).not.toThrow();
    expect(() => assertProductionSecrets(prod({ REFRESH_TOKEN_SECRET: '' }))).not.toThrow();
    expect(() => assertProductionSecrets(prod({ REFRESH_TOKEN_SECRET: 'dev-refresh-secret' }))).toThrow(/REFRESH_TOKEN_SECRET/);
    expect(() => assertProductionSecrets(prod({ REFRESH_TOKEN_SECRET: STRONG.split('').reverse().join('') }))).not.toThrow();
  });

  it('refuses the OTP dev bypass in production', () => {
    expect(() => assertProductionSecrets(prod({ OTP_DEV_BYPASS: 'true' }))).toThrow(/OTP_DEV_BYPASS/);
    expect(() => assertProductionSecrets(prod({ OTP_DEV_BYPASS: 'false' }))).not.toThrow();
  });

  it('reports every problem at once', () => {
    let message = '';
    try {
      assertProductionSecrets(prod({ JWT_SECRET: undefined, REFRESH_TOKEN_SECRET: 'x', OTP_DEV_BYPASS: 'true' }));
    } catch (e) {
      message = (e as Error).message;
    }
    expect(message).toMatch(/JWT_SECRET is not set/);
    expect(message).toMatch(/REFRESH_TOKEN_SECRET is too short/);
    expect(message).toMatch(/OTP_DEV_BYPASS/);
  });

  it('never puts a secret value into the error message', () => {
    const weak = 'dev-jwt-secret-with-a-very-recognisable-marker';
    let message = '';
    try {
      assertProductionSecrets(prod({ JWT_SECRET: weak }));
    } catch (e) {
      message = (e as Error).message;
    }
    expect(message).toMatch(/JWT_SECRET/);
    expect(message).not.toContain('recognisable-marker');
  });
});
