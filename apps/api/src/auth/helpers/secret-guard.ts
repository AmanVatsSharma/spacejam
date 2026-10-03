/**
 * File:        apps/api/src/auth/helpers/secret-guard.ts
 * Module:      API · Auth · Startup guard
 * Purpose:     Fail closed in production. The auth code reads JWT_SECRET /
 *              REFRESH_TOKEN_SECRET with hard-coded dev fallbacks
 *              ('dev-jwt-secret', 'dev-refresh-secret'), so a missing or
 *              placeholder value in production would silently let anyone who
 *              has read the repository forge a valid admin token. Refuse to
 *              start instead, and refuse the OTP dev bypass (code 000000).
 *
 *              The message names the variable and the problem — never the value.
 *
 * Author:      Claude Sonnet 5.5
 * Last-updated: 2026-10-03
 */

export const MIN_SECRET_LENGTH = 32;

/** Obvious placeholders that must never sign production tokens. */
const WEAK_PATTERNS: RegExp[] = [/^dev[-_]/i, /change[-_]?me/i, /^(secret|password|jwt|token|test|default)$/i];

/** Why a signing secret is unacceptable, or null when it is fine. */
export function secretProblem(value: string | undefined | null): string | null {
  if (value === undefined || value === null || !value.trim()) return 'is not set';
  if (value.length < MIN_SECRET_LENGTH) return `is too short (${value.length} < ${MIN_SECRET_LENGTH} characters)`;
  if (WEAK_PATTERNS.some((re) => re.test(value))) return 'looks like a placeholder';
  return null;
}

/**
 * Throws when NODE_ENV=production and a signing secret is missing/weak, or the
 * OTP dev bypass is on. A no-op in every other environment.
 */
export function assertProductionSecrets(env: NodeJS.ProcessEnv = process.env): void {
  if (env.NODE_ENV !== 'production') return;

  const problems: string[] = [];
  const jwt = secretProblem(env.JWT_SECRET);
  if (jwt) problems.push(`JWT_SECRET ${jwt}`);

  // REFRESH_TOKEN_SECRET falls back to JWT_SECRET when unset, so it is only checked when provided.
  if (env.REFRESH_TOKEN_SECRET !== undefined && env.REFRESH_TOKEN_SECRET !== '') {
    const refresh = secretProblem(env.REFRESH_TOKEN_SECRET);
    if (refresh) problems.push(`REFRESH_TOKEN_SECRET ${refresh}`);
  }

  if (env.OTP_DEV_BYPASS === 'true') {
    problems.push('OTP_DEV_BYPASS=true would let anyone log in with the code 000000');
  }

  if (problems.length > 0) {
    throw new Error(
      `Refusing to start in production: ${problems.join('; ')}. Set strong random values (for example: openssl rand -hex 48).`,
    );
  }
}
