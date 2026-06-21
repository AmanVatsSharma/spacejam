/**
 * File:        apps/web/src/app/(auth)/signin/magic-link/MagicLinkRequestClient.tsx
 * Module:      Web · Auth
 * Purpose:     Client-side content for the magic-link request page.
 *              Uses the auth context's requestMagicLink helper.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-21
 */
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, type FormEvent } from 'react';

import Logo from '@/assets/logo.png';
import { useAuth } from '@/contexts/auth-context';
import styles from '../../auth.module.css';

type Status = 'idle' | 'busy' | 'sent';

export default function MagicLinkRequestClient() {
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatus('busy');
    try {
      await auth.requestMagicLink(email);
      setStatus('sent');
    } catch (err) {
      // Even on error, prefer the "sent" message to avoid email
      // enumeration. The real failure gets logged but not shown.
      // eslint-disable-next-line no-console
      console.error('requestMagicLink failed', err);
      setStatus('sent');
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
          <h1 className={styles.title}>Sign in with a magic link</h1>
          <p className="text-sm text-[#4A5565] mb-4">
            Enter your email and we&apos;ll send you a one-time sign-in link. No password needed.
          </p>

          {status === 'sent' ? (
            <>
              <div
                className="rounded-xl border border-[#10B981]/30 bg-[#ECFDF5] p-4 text-sm text-[#065F46] mb-4"
                role="status"
              >
                If an account exists for <strong>{email}</strong>, a sign-in link is on its way.
                The link expires in 15 minutes.
              </div>
              <Link href="/signin" className={styles.forgotLink}>
                Back to sign in
              </Link>
            </>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="magic-email" className={styles.label}>
                  Email
                </label>
                <input
                  id="magic-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.input}
                  placeholder="you@example.com"
                />
              </div>
              {error && <p className="text-sm text-[#EF4444] mb-3">{error}</p>}
              <button
                type="submit"
                disabled={status === 'busy'}
                className={styles.submitBtn}
              >
                {status === 'busy' ? 'Sending…' : 'Send magic link'}
              </button>
              <div className="mt-3 text-center">
                <Link href="/signin" className={styles.forgotLink}>
                  Back to password sign in
                </Link>
              </div>
            </form>
          )}

          <p className={styles.footerText}>
            Don&apos;t have an account?{' '}
            <Link href="/signup" className={styles.footerLink}>
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
