/**
 * File:        apps/web/src/components/settings/security-panel.tsx
 * Module:      Web · Settings · Security
 * Purpose:     In-app security controls:
 *                - Change password (authenticated)
 *                - Recovery codes remaining + regenerate (authenticated)
 *                - Send a magic link to the user's email (always works,
 *                  mirrors the public /signin/magic-link page so the
 *                  user has a single path no matter where they start)
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-21
 */
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';

type Status =
  | { kind: 'idle' }
  | { kind: 'busy' }
  | { kind: 'ok'; message: string }
  | { kind: 'error'; message: string };

export default function SecurityPanel() {
  const auth = useAuth();

  // Change-password form state
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [changeStatus, setChangeStatus] = useState<Status>({ kind: 'idle' });

  // Recovery codes state
  const [codesRemaining, setCodesRemaining] = useState<number | null>(null);
  const [codes, setCodes] = useState<string[]>([]);
  const [codesStatus, setCodesStatus] = useState<Status>({ kind: 'idle' });

  // Magic-link state (used from settings too, so the user doesn't have
  // to leave the dashboard to grab a link)
  const [magicEmail, setMagicEmail] = useState(auth.user?.email ?? '');
  const [magicStatus, setMagicStatus] = useState<Status>({ kind: 'idle' });

  const refreshRemaining = useCallback(async () => {
    try {
      const n = await auth.recoveryCodesRemaining();
      setCodesRemaining(n);
    } catch {
      // It's possible the user has never enabled recovery codes (no
      // rows yet). Treat as 0 rather than blowing up the page.
      setCodesRemaining(0);
    }
  }, [auth]);

  useEffect(() => {
    if (auth.isAuthenticated) {
      void refreshRemaining();
    }
  }, [auth.isAuthenticated, refreshRemaining]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwd.length < 12) {
      setChangeStatus({ kind: 'error', message: 'New password must be at least 12 characters.' });
      return;
    }
    if (newPwd !== confirmPwd) {
      setChangeStatus({ kind: 'error', message: 'New passwords do not match.' });
      return;
    }
    setChangeStatus({ kind: 'busy' });
    try {
      const res = await auth.changePassword(currentPwd, newPwd);
      if (res.ok) {
        setChangeStatus({ kind: 'ok', message: 'Password updated.' });
        setCurrentPwd('');
        setNewPwd('');
        setConfirmPwd('');
      } else {
        setChangeStatus({ kind: 'error', message: res.message || 'Could not change password.' });
      }
    } catch (err) {
      setChangeStatus({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Could not change password.',
      });
    }
  };

  const handleRegenerate = async () => {
    if (
      typeof window !== 'undefined' &&
      !window.confirm(
        'Regenerating will invalidate all existing recovery codes. Continue?',
      )
    ) {
      return;
    }
    setCodesStatus({ kind: 'busy' });
    try {
      const fresh = await auth.regenerateRecoveryCodes();
      setCodes(fresh);
      setCodesRemaining(fresh.length);
      setCodesStatus({ kind: 'ok', message: `Generated ${fresh.length} new codes. Save them now — they will not be shown again.` });
    } catch (err) {
      setCodesStatus({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Could not regenerate codes.',
      });
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setMagicStatus({ kind: 'busy' });
    try {
      const res = await auth.requestMagicLink(magicEmail);
      setMagicStatus({
        kind: 'ok',
        message: res.message || 'If an account exists, a magic link has been sent.',
      });
    } catch (err) {
      setMagicStatus({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Could not send magic link.',
      });
    }
  };

  const statusBanner = (s: Status) => {
    if (s.kind === 'idle') return null;
    if (s.kind === 'busy') {
      return (
        <div className="mt-3 text-sm text-gray-500" role="status" aria-live="polite">
          Working...
        </div>
      );
    }
    const cls =
      s.kind === 'ok'
        ? 'bg-green-50 border border-green-200 text-green-700'
        : 'bg-red-50 border border-red-200 text-red-700';
    return (
      <div
        className={`mt-3 text-sm rounded-lg px-3 py-2 ${cls}`}
        role={s.kind === 'error' ? 'alert' : 'status'}
      >
        {s.message}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Change password */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-[#101828] mb-1">Change password</h3>
        <p className="text-sm text-gray-500 mb-4">
          Must be at least 12 characters and not a known breached password.
        </p>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-600 mb-2 block">Current password</label>
            <input
              type="password"
              value={currentPwd}
              onChange={(e) => setCurrentPwd(e.target.value)}
              autoComplete="current-password"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#FF6A2F]"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600 mb-2 block">New password</label>
              <input
                type="password"
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                autoComplete="new-password"
                minLength={12}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#FF6A2F]"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 mb-2 block">Confirm new password</label>
              <input
                type="password"
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
                autoComplete="new-password"
                minLength={12}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#FF6A2F]"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={changeStatus.kind === 'busy'}
            className="bg-[#FF6A2F] text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-[#E5551F] transition-colors disabled:opacity-60"
          >
            Update password
          </button>
        </form>
        {statusBanner(changeStatus)}
      </div>

      {/* Recovery codes */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-[#101828] mb-1">Recovery codes</h3>
        <p className="text-sm text-gray-500 mb-4">
          One-time codes you can use to sign in if you lose access to your authenticator app.
        </p>
        <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4 mb-4">
          <div>
            <p className="text-sm text-gray-500">Remaining</p>
            <p className="text-2xl font-semibold text-[#101828]">
              {codesRemaining === null ? '—' : codesRemaining}
            </p>
          </div>
          {codesRemaining !== null && codesRemaining <= 3 && (
            <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-1">
              Running low — regenerate soon
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={handleRegenerate}
          disabled={codesStatus.kind === 'busy'}
          className="bg-white border border-gray-200 text-[#101828] px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors disabled:opacity-60"
        >
          Regenerate codes
        </button>
        {statusBanner(codesStatus)}

        {codes.length > 0 && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-sm font-medium text-amber-800 mb-2">
              Your new recovery codes — copy them now. They will not be shown again.
            </p>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-sm text-amber-900">
              {codes.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Magic link */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-[#101828] mb-1">Email me a magic link</h3>
        <p className="text-sm text-gray-500 mb-4">
          Sign in without a password. We&apos;ll email you a one-time link.
        </p>
        <form onSubmit={handleMagicLink} className="flex gap-3">
          <input
            type="email"
            value={magicEmail}
            onChange={(e) => setMagicEmail(e.target.value)}
            required
            placeholder="you@example.com"
            className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#FF6A2F]"
          />
          <button
            type="submit"
            disabled={magicStatus.kind === 'busy'}
            className="bg-[#FF6A2F] text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-[#E5551F] transition-colors disabled:opacity-60"
          >
            Send link
          </button>
        </form>
        {statusBanner(magicStatus)}
      </div>
    </div>
  );
}