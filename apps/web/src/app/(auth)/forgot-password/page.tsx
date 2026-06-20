/**
 * File:        apps/web/src/app/(auth)/forgot-password/page.tsx
 * Module:      Web · Auth
 * Purpose:     Password-reset request page. Always shows a success state
 *              after submit to avoid leaking which emails are registered.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-20
 */
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, type FormEvent } from 'react';

import Logo from '@/assets/logo.png';
import { useAuth } from '@/contexts/auth-context';
import styles from '../auth.module.css';

export default function ForgotPasswordPage() {
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await auth.requestPasswordReset(email);
    } catch {
      // Swallow — the success state is the same regardless of whether the
      // email exists, so attackers can't enumerate accounts.
    } finally {
      setSubmitting(false);
      setDone(true);
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
          <h1 className={styles.title}>Reset your password</h1>

          {done ? (
            <>
              <div
                className="rounded-xl border border-[#10B981]/30 bg-[#ECFDF5] p-4 text-sm text-[#065F46]"
                role="status"
              >
                If an account exists for that email, we&apos;ve sent password-reset
                instructions. Check your inbox and spam folder.
              </div>
              <Link
                href="/signin"
                className={`${styles.submitBtn} mt-4 inline-flex items-center justify-center`}
              >
                Back to sign in
              </Link>
            </>
          ) : (
            <form onSubmit={onSubmit} className={styles.form}>
              <p className="text-sm text-[#4A5565]">
                Enter the email associated with your account and we&apos;ll send a
                link to reset your password.
              </p>
              <div className={styles.floatingInput}>
                <input
                  type="email"
                  id="forgot-email"
                  autoComplete="email"
                  placeholder=" "
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <label htmlFor="forgot-email">Email</label>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className={styles.submitBtn}
              >
                {submitting ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
          )}

          <p className={styles.footerText}>
            Remembered it?{' '}
            <Link href="/signin" className={styles.footerLink}>
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}