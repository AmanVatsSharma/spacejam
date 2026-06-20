/**
 * File:        apps/web/src/app/(auth)/reset-password/ResetPasswordClient.tsx
 * Module:      Web · Auth
 * Purpose:     Client-side reset-password content. Separated so the page can
 *              wrap it in a Suspense boundary (required by Next.js when a
 *              client component calls useSearchParams()).
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-20
 */
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import Logo from '@/assets/logo.png';
import { useAuth } from '@/contexts/auth-context';
import styles from '../auth.module.css';

export default function ResetPasswordClient() {
  const search = useSearchParams();
  const router = useRouter();
  const auth = useAuth();
  const token = search?.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (!token) {
      setError('Reset link is missing the token. Please request a new one.');
      return;
    }
    setSubmitting(true);
    try {
      const ok = await auth.resetPassword(token, password);
      if (!ok) {
        setError('This reset link is no longer valid. Request a new one.');
        return;
      }
      setDone(true);
      setTimeout(() => router.push('/signin'), 1500);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Reset failed';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.leftSide}>
        <div className={styles.shape1} />
        <div className={styles.shape2} />
        <div className={styles.shape3} />
        <div className={styles.shape4} />
        <div className={styles.shape5} />
        <div className={styles.shape6} />
        <div className={styles.shape7} />
        <div className={styles.shape8} />
        <div className={styles.shape9} />
        <div className={styles.shape10} />
        <div className={styles.logoContainer}>
          <Image src={Logo} alt="SpaceJam" className={styles.logoImage} />
        </div>
      </div>

      <div className={styles.rightSide}>
        <div className={styles.card}>
          <h1 className={styles.title}>Set a new password</h1>

          {done ? (
            <div
              className="rounded-xl border border-[#10B981]/30 bg-[#ECFDF5] p-4 text-sm text-[#065F46]"
              role="status"
            >
              Your password has been updated. Redirecting you to sign in…
            </div>
          ) : (
            <form onSubmit={onSubmit} className={styles.form}>
              <div className={styles.floatingInput}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="reset-password"
                  autoComplete="new-password"
                  placeholder=" "
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <label htmlFor="reset-password">New password</label>
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

              <div className={styles.floatingInput}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="reset-confirm"
                  autoComplete="new-password"
                  placeholder=" "
                  required
                  minLength={8}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
                <label htmlFor="reset-confirm">Confirm password</label>
              </div>

              {error && <p className="text-sm text-[#EF4444]">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className={styles.submitBtn}
              >
                {submitting ? 'Saving…' : 'Save password'}
              </button>
            </form>
          )}

          <p className={styles.footerText}>
            <Link href="/signin" className={styles.footerLink}>
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
