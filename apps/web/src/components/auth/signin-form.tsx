/**
 * File:        apps/web/src/components/auth/signin-form.tsx
 * Module:      Web · Auth
 * Purpose:     Sign-in form. Calls the GraphQL signin mutation through the
 *              AuthContext and shows a 2FA-code step when the backend
 *              requires it. Visually aligned with auth.module.css so it
 *              lives inside the designed sign-in page.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-20
 */
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';

import { useAuth } from '@/contexts/auth-context';
import styles from '@/app/(auth)/auth.module.css';
import { toast } from 'sonner';

type Step = 'credentials' | 'twoFactor' | 'submitting' | 'error';

export interface SigninFormProps {
  nextHref?: string;
  defaultEmail?: string;
}

export function SigninForm({ nextHref, defaultEmail }: SigninFormProps) {
  const router = useRouter();
  const search = useSearchParams();
  const fallbackNext = search?.get('next') ?? '/dashboard';
  const target = nextHref ?? fallbackNext;

  const auth = useAuth();
  const [email, setEmail] = useState(defaultEmail ?? '');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [code, setCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<Step>('credentials');
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // `auth.isDevLoginAvailable` is computed from `window.location` in the
  // AuthContext, which means it is always `false` on the server and `true`
  // on the client when running on localhost. Rendering the dev-login block
  // directly off that flag causes a hydration mismatch that blanks the page.
  // Defer it to a post-mount state so SSR and the first client render match.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const onSubmitCredentials = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setStep('submitting');
    try {
      const res = await auth.signin({ email, password, rememberMe: remember });
      if (res.twoFactorRequired) {
        setChallengeToken(res.challengeToken ?? null);
        setStep('twoFactor');
        return;
      }
      router.push(target);
    } catch (err) {
      let message = err instanceof Error ? err.message : 'Sign-in failed';
      message = message.replace(/^(GraphQL error:|ApolloError:)\s*/i, '').trim();
      setError(message);
      setStep('error');
      toast.error(message);
    }
  };

  const onSubmitTwoFactor = async (e: FormEvent) => {
    e.preventDefault();
    if (!challengeToken) {
      setError('Missing 2FA challenge token — please sign in again');
      setStep('credentials');
      return;
    }
    setError(null);
    setStep('submitting');
    try {
      await auth.verifyTwoFactor(code, challengeToken);
      router.push(target);
    } catch (err) {
      let message = err instanceof Error ? err.message : 'Invalid code';
      message = message.replace(/^(GraphQL error:|ApolloError:)\s*/i, '').trim();
      setError(message);
      setStep('twoFactor');
    }
  };

  if (step === 'twoFactor' || (step === 'submitting' && challengeToken)) {
    return (
      <form onSubmit={onSubmitTwoFactor} className={styles.form}>
        <p className={styles.label}>Two-factor authentication</p>
        <p className="text-sm text-[#6A7282]">
          Enter the 6-digit code from your authenticator app.
        </p>
        <div className={styles.floatingInput}>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder=" "
            pattern="[0-9]*"
            maxLength={6}
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          />
          <label>123456</label>
        </div>
        {error && <p className="text-sm text-[#EF4444]">{error}</p>}
        <button
          type="submit"
          disabled={step === 'submitting' || code.length !== 6}
          className={styles.submitBtn}
        >
          {step === 'submitting' ? 'Verifying…' : 'Verify code'}
        </button>
        <button
          type="button"
          onClick={() => {
            setChallengeToken(null);
            setCode('');
            setStep('credentials');
          }}
          className={styles.forgotLink}
        >
          Use a different account
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={onSubmitCredentials} className={styles.form}>
      <div className={styles.floatingInput}>
        <input
          type="email"
          id="signin-email"
          autoComplete="email"
          placeholder=" "
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <label htmlFor="signin-email">Email</label>
      </div>

      <div className={styles.floatingInput}>
        <input
          type={showPassword ? 'text' : 'password'}
          id="signin-password"
          autoComplete="current-password"
          placeholder=" "
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <label htmlFor="signin-password">Password</label>
        <button
          type="button"
          className={styles.passwordToggle}
          onClick={() => setShowPassword((v) => !v)}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6A7282" strokeWidth="2">
              <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a21.77 21.77 0 015.06 5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a21.77 21.77 0 01-5.06 5.94M14.12 14.12a3 3 0 11-4.24-4.24M1 1l22 22" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6A7282" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>

      <div className={styles.checkboxRow}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          <span className={styles.checkboxText}>Remember me</span>
        </label>
        <Link href="/forgot-password" className={styles.forgotLink}>
          Forgot password?
        </Link>
      </div>

      <div className="text-center mt-2">
        <Link href="/signin/magic-link" className="text-sm text-[#4A5565] hover:text-[#101828]">
          Sign in with a magic link instead
        </Link>
      </div>

      {error && (
        <div className="mt-4 p-3 rounded-lg border border-red-200 bg-red-50 flex items-start gap-2 text-sm text-red-600">
          <svg className="w-5 h-5 flex-shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="font-medium">{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={step === 'submitting'}
        className={styles.submitBtn}
      >
        {step === 'submitting' ? 'Signing in…' : 'Sign in'}
      </button>

      {mounted && auth.isDevLoginAvailable && (
        <div className="mt-1 rounded-xl border border-dashed border-[#FF7847]/40 bg-[#FFF7F2] p-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[#FF7847]">
            Dev login (no DB)
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                auth.devSignIn('ADMIN');
                router.push(target);
              }}
              className="flex-1 rounded-lg border border-[#FF7847] bg-white px-3 py-2 text-xs font-medium text-[#FF7847] transition hover:bg-[#FF7847] hover:text-white"
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => {
                auth.devSignIn('CENTER_MANAGER');
                router.push(target);
              }}
              className="flex-1 rounded-lg border border-[#FF7847] bg-white px-3 py-2 text-xs font-medium text-[#FF7847] transition hover:bg-[#FF7847] hover:text-white"
            >
              Center Mgr
            </button>
            <button
              type="button"
              onClick={() => {
                auth.devSignIn('MEMBER');
                router.push(target);
              }}
              className="flex-1 rounded-lg border border-[#FF7847] bg-white px-3 py-2 text-xs font-medium text-[#FF7847] transition hover:bg-[#FF7847] hover:text-white"
            >
              Member
            </button>
          </div>
        </div>
      )}
    </form>
  );
}

export default SigninForm;