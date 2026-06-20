/**
 * File:        apps/web/src/components/auth/signup-form.tsx
 * Module:      Web · Auth
 * Purpose:     Sign-up form. Creates an account via the GraphQL signup
 *              mutation and routes the user to the dashboard on success.
 *              Visually aligned with auth.module.css for the designed
 *              sign-up page.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-20
 */
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { useAuth } from '@/contexts/auth-context';
import styles from '@/app/(auth)/auth.module.css';

export interface SignupFormProps {
  defaultEmail?: string;
  defaultName?: string;
  nextHref?: string;
}

export function SignupForm({ defaultEmail, defaultName, nextHref }: SignupFormProps) {
  const router = useRouter();
  const search = useSearchParams();
  const target = nextHref ?? search?.get('next') ?? '/dashboard';
  const auth = useAuth();

  const [name, setName] = useState(defaultName ?? '');
  const [email, setEmail] = useState(defaultEmail ?? '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!agreeTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setSubmitting(true);
    try {
      await auth.signup({ email, password, name: name || undefined });
      router.push(target);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign-up failed';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className={styles.form}>
      <div className={styles.floatingInput}>
        <input
          type="text"
          id="signup-name"
          autoComplete="name"
          placeholder=" "
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <label htmlFor="signup-name">Full name</label>
      </div>

      <div className={styles.floatingInput}>
        <input
          type="email"
          id="signup-email"
          autoComplete="email"
          placeholder=" "
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <label htmlFor="signup-email">Email</label>
      </div>

      <div className={styles.floatingInput}>
        <input
          type="password"
          id="signup-password"
          autoComplete="new-password"
          placeholder=" "
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <label htmlFor="signup-password">Password (min 8)</label>
      </div>

      <div className={styles.floatingInput}>
        <input
          type="password"
          id="signup-confirm"
          autoComplete="new-password"
          placeholder=" "
          required
          minLength={8}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <label htmlFor="signup-confirm">Confirm password</label>
      </div>

      <div className={styles.checkboxRow}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
          />
          <span className={styles.checkboxText}>
            I agree to the{' '}
            <a href="#" className={styles.footerLink}>
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className={styles.footerLink}>
              Privacy Policy
            </a>
          </span>
        </label>
      </div>

      {error && <p className="text-sm text-[#EF4444]">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className={styles.submitBtn}
      >
        {submitting ? 'Creating account…' : 'Create account'}
      </button>
    </form>
  );
}

export default SignupForm;