/**
 * File:        apps/web/src/app/(auth)/verify-email/page.tsx
 * Module:      Web · Auth
 * Purpose:     Email-verification landing page. The backend's verify-email
 *              mutation is called with the ?token=… in the URL, and the UI
 *              shows the outcome (success → resend banner / sign-in link,
 *              failure → "request a new link" CTA).
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-20
 */
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useApolloClient } from '@apollo/client';

import Logo from '@/assets/logo.png';
import { VERIFY_EMAIL } from '@/lib/apollo/operations';
import styles from '../auth.module.css';

type Status = 'pending' | 'success' | 'error';

export default function VerifyEmailPage() {
  const search = useSearchParams();
  const client = useApolloClient();
  const token = search?.get('token') ?? '';

  const [status, setStatus] = useState<Status>('pending');
  const [message, setMessage] = useState<string>('Verifying your email…');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Verification link is missing the token. Please request a new one.');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await client.mutate<{ verifyEmail: { ok: boolean; message?: string | null } }>({
          mutation: VERIFY_EMAIL,
          variables: { token },
        });
        if (cancelled) return;
        const payload = res.data?.verifyEmail;
        if (payload?.ok) {
          setStatus('success');
          setMessage(payload.message ?? 'Your email is verified. You can sign in now.');
        } else {
          setStatus('error');
          setMessage(payload?.message ?? 'This verification link is invalid or has expired.');
        }
      } catch (err) {
        if (cancelled) return;
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Verification failed');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, client]);

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
          <h1 className={styles.title}>Verify your email</h1>

          {status === 'pending' && (
            <div className="flex items-center gap-3 text-sm text-[#4A5565]">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#FF6A2F] border-t-transparent" />
              {message}
            </div>
          )}

          {status === 'success' && (
            <>
              <div
                className="rounded-xl border border-[#10B981]/30 bg-[#ECFDF5] p-4 text-sm text-[#065F46]"
                role="status"
              >
                {message}
              </div>
              <Link href="/signin" className={`${styles.submitBtn} mt-4 inline-flex items-center justify-center`}>
                Continue to sign in
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div
                className="rounded-xl border border-[#EF4444]/30 bg-[#FEF2F2] p-4 text-sm text-[#991B1B]"
                role="alert"
              >
                {message}
              </div>
              <Link href="/signin" className={`${styles.submitBtn} mt-4 inline-flex items-center justify-center`}>
                Back to sign in
              </Link>
            </>
          )}

          <p className={styles.footerText}>
            Need help?{' '}
            <Link href="/signin" className={styles.footerLink}>
              Contact support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}