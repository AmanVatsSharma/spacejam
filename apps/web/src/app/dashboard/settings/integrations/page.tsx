/**
 * File:        apps/web/src/app/dashboard/settings/integrations/page.tsx
 * Module:      Web · Dashboard · Settings · Integrations
 * Purpose:     Super-admin-only page to configure platform integrations:
 *              SMS provider (MSG91/Twilio) for OTP delivery, and Razorpay
 *              for payments. Shows connection status badges and save forms.
 *              The backend resolver guards every read/write with @Roles(SUPER_ADMIN).
 *
 * Author:      ZCode
 * Last-updated: 2026-08-09
 */
'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { toast } from 'sonner';
import {
  GET_INTEGRATION_STATUS,
  GET_INTEGRATION_SETTINGS,
  SAVE_SMS_CONFIG,
  SAVE_RAZORPAY_CONFIG,
} from '@/lib/apollo/operations';
import { useAuth } from '@/contexts/auth-context';

function keyValue(rows: { key: string; value: string; secret: boolean }[], key: string): string {
  return rows.find((r) => r.key === key)?.value ?? '';
}

export default function IntegrationsSettingsPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const { data: statusData, refetch: refetchStatus } = useQuery(GET_INTEGRATION_STATUS);
  const { data: smsData } = useQuery(GET_INTEGRATION_SETTINGS, { variables: { group: 'sms' } });
  const { data: payData } = useQuery(GET_INTEGRATION_SETTINGS, { variables: { group: 'payment' } });

  const [sms, setSms] = useState({ provider: 'console', apiKey: '', senderId: '', templateId: '' });
  const [rzp, setRzp] = useState({ keyId: '', keySecret: '', webhookSecret: '', mode: 'test' });

  useEffect(() => {
    if (smsData?.integrationSettings) {
      const r = smsData.integrationSettings as { key: string; value: string }[];
      setSms({
        provider: keyValue(r, 'sms.provider') || 'console',
        apiKey: keyValue(r, 'sms.apiKey'),
        senderId: keyValue(r, 'sms.senderId'),
        templateId: keyValue(r, 'sms.templateId'),
      });
    }
  }, [smsData]);

  useEffect(() => {
    if (payData?.integrationSettings) {
      const r = payData.integrationSettings as { key: string; value: string }[];
      setRzp({
        keyId: keyValue(r, 'razorpay.keyId'),
        keySecret: keyValue(r, 'razorpay.keySecret'),
        webhookSecret: keyValue(r, 'razorpay.webhookSecret'),
        mode: keyValue(r, 'razorpay.mode') || 'test',
      });
    }
  }, [payData]);

  const [saveSms, { loading: savingSms }] = useMutation(SAVE_SMS_CONFIG, {
    onCompleted: () => { toast.success('SMS configuration saved'); refetchStatus(); },
    onError: (e) => toast.error(e.message || 'Could not save SMS config'),
  });
  const [saveRzp, { loading: savingRzp }] = useMutation(SAVE_RAZORPAY_CONFIG, {
    onCompleted: () => { toast.success('Razorpay configuration saved'); refetchStatus(); },
    onError: (e) => toast.error(e.message || 'Could not save Razorpay config'),
  });

  if (!isSuperAdmin) {
    return (
      <div className="rounded-[14px] border border-[#E5E7EB] bg-white p-8">
        <h2 className="text-lg font-semibold text-[#1F1F1F]">Access restricted</h2>
        <p className="text-sm text-[#6A7282]">Only super-admins can configure platform integrations.</p>
      </div>
    );
  }

  const status = statusData?.integrationStatus;
  const StatusBadge = ({ ok, label }: { ok: boolean; label: string }) => (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${ok ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
      {ok ? `Connected · ${label}` : 'Not configured'}
    </span>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-[#1F1F1F]">Integrations</h1>
        <p className="text-sm text-[#6A7282]">Platform-level configuration for SMS (OTP) and payment gateway. Super-admin only.</p>
      </div>

      {/* SMS Provider */}
      <section className="space-y-4 rounded-[14px] border border-[#E5E7EB] bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#1F1F1F]">SMS Provider</h2>
            <p className="text-xs text-[#6A7282]">Used for phone OTP delivery. Without a provider, OTPs are logged server-side (dev only).</p>
          </div>
          <StatusBadge ok={status?.smsConfigured} label={status?.smsProvider} />
        </div>
        <div className="grid grid-cols-1 gap-4 compact:grid-cols-2">
          <label className="space-y-1">
            <span className="text-sm font-medium text-[#1F1F1F]">Provider</span>
            <select
              value={sms.provider}
              onChange={(e) => setSms({ ...sms, provider: e.target.value })}
              className="w-full rounded-[10px] border border-[#E5E7EB] px-3 py-2 text-sm"
            >
              <option value="console">Console (dev — no SMS sent)</option>
              <option value="msg91">MSG91</option>
              <option value="twilio">Twilio</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-[#1F1F1F]">API key / auth key</span>
            <input
              type="password"
              value={sms.apiKey.startsWith('••••') ? '' : sms.apiKey}
              onChange={(e) => setSms({ ...sms, apiKey: e.target.value })}
              placeholder={sms.apiKey.startsWith('••••') ? `${sms.apiKey} (enter new to replace)` : 'e.g. msg91 auth key / twilio sid:token'}
              className="w-full rounded-[10px] border border-[#E5E7EB] px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-[#1F1F1F]">Sender ID / From</span>
            <input
              value={sms.senderId}
              onChange={(e) => setSms({ ...sms, senderId: e.target.value })}
              placeholder="e.g. SPACEJ / +15000000000"
              className="w-full rounded-[10px] border border-[#E5E7EB] px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-[#1F1F1F]">Template ID (MSG91)</span>
            <input
              value={sms.templateId}
              onChange={(e) => setSms({ ...sms, templateId: e.target.value })}
              placeholder="optional"
              className="w-full rounded-[10px] border border-[#E5E7EB] px-3 py-2 text-sm"
            />
          </label>
        </div>
        <button
          onClick={() => saveSms({ variables: { input: sms } })}
          disabled={savingSms}
          className="rounded-[10px] bg-[#FF6A2F] px-4 py-2 text-sm font-medium text-white hover:bg-[#FE7A47] disabled:opacity-50"
        >
          {savingSms ? 'Saving…' : 'Save SMS config'}
        </button>
      </section>

      {/* Razorpay */}
      <section className="space-y-4 rounded-[14px] border border-[#E5E7EB] bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#1F1F1F]">Razorpay (Payment Gateway)</h2>
            <p className="text-xs text-[#6A7282]">Collect payments for bookings, wallet top-ups, and invoices. Get keys from the Razorpay dashboard.</p>
          </div>
          <StatusBadge ok={status?.razorpayConfigured} label={status?.razorpayMode} />
        </div>
        <div className="grid grid-cols-1 gap-4 compact:grid-cols-2">
          <label className="space-y-1">
            <span className="text-sm font-medium text-[#1F1F1F]">Key ID</span>
            <input
              value={rzp.keyId.startsWith('••••') ? '' : rzp.keyId}
              onChange={(e) => setRzp({ ...rzp, keyId: e.target.value })}
              placeholder={rzp.keyId.startsWith('••••') ? `${rzp.keyId} (enter new to replace)` : 'rzp_test_… / rzp_live_…'}
              className="w-full rounded-[10px] border border-[#E5E7EB] px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-[#1F1F1F]">Key Secret</span>
            <input
              type="password"
              value={rzp.keySecret.startsWith('••••') ? '' : rzp.keySecret}
              onChange={(e) => setRzp({ ...rzp, keySecret: e.target.value })}
              placeholder={rzp.keySecret.startsWith('••••') ? `${rzp.keySecret} (enter new to replace)` : 'secret'}
              className="w-full rounded-[10px] border border-[#E5E7EB] px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-[#1F1F1F]">Webhook Secret</span>
            <input
              type="password"
              value={rzp.webhookSecret.startsWith('••••') ? '' : rzp.webhookSecret}
              onChange={(e) => setRzp({ ...rzp, webhookSecret: e.target.value })}
              placeholder={rzp.webhookSecret.startsWith('••••') ? `${rzp.webhookSecret} (enter new to replace)` : 'wh_secret'}
              className="w-full rounded-[10px] border border-[#E5E7EB] px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-[#1F1F1F]">Mode</span>
            <select
              value={rzp.mode}
              onChange={(e) => setRzp({ ...rzp, mode: e.target.value })}
              className="w-full rounded-[10px] border border-[#E5E7EB] px-3 py-2 text-sm"
            >
              <option value="test">Test</option>
              <option value="live">Live</option>
            </select>
          </label>
        </div>
        <button
          onClick={() => saveRzp({ variables: { input: rzp } })}
          disabled={savingRzp}
          className="rounded-[10px] bg-[#FF6A2F] px-4 py-2 text-sm font-medium text-white hover:bg-[#FE7A47] disabled:opacity-50"
        >
          {savingRzp ? 'Saving…' : 'Save Razorpay config'}
        </button>
      </section>
    </div>
  );
}
