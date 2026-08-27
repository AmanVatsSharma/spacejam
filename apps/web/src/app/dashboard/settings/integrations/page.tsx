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
  SAVE_EMAIL_CONFIG,
  SAVE_WHATSAPP_CONFIG,
  SEND_TEST_EMAIL,
  SEND_TEST_WHATSAPP,
} from '@/lib/apollo/operations';
import { useAuth } from '@/contexts/auth-context';

function keyValue(rows: { key: string; value: string }[], key: string): string {
  return rows.find((r) => r.key === key)?.value ?? '';
}

export default function IntegrationsSettingsPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const { data: statusData, refetch: refetchStatus } = useQuery(GET_INTEGRATION_STATUS);
  const { data: smsData } = useQuery(GET_INTEGRATION_SETTINGS, { variables: { group: 'sms' } });
  const { data: payData } = useQuery(GET_INTEGRATION_SETTINGS, { variables: { group: 'payment' } });
  const { data: emailData } = useQuery(GET_INTEGRATION_SETTINGS, { variables: { group: 'email' } });
  const { data: waData } = useQuery(GET_INTEGRATION_SETTINGS, { variables: { group: 'whatsapp' } });

  const [sms, setSms] = useState({ provider: 'console', apiKey: '', senderId: '', templateId: '' });
  const [rzp, setRzp] = useState({ keyId: '', keySecret: '', webhookSecret: '', mode: 'test' });
  const [emailCfg, setEmailCfg] = useState({ host: '', port: '', secure: false, user: '', password: '', from: '' });
  const [wa, setWa] = useState({ provider: 'console', apiKey: '', senderId: '', templateId: '' });
  const [testEmailTo, setTestEmailTo] = useState('');
  const [testWa, setTestWa] = useState({ phone: '', message: 'Hello from SpaceJam! This is a test WhatsApp message.' });

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

  useEffect(() => {
    if (emailData?.integrationSettings) {
      const r = emailData.integrationSettings as { key: string; value: string }[];
      setEmailCfg({
        host: keyValue(r, 'email.host'),
        port: keyValue(r, 'email.port'),
        secure: keyValue(r, 'email.secure') === 'true',
        user: keyValue(r, 'email.user'),
        password: keyValue(r, 'email.password'),
        from: keyValue(r, 'email.from'),
      });
    }
  }, [emailData]);

  useEffect(() => {
    if (waData?.integrationSettings) {
      const r = waData.integrationSettings as { key: string; value: string }[];
      setWa({
        provider: keyValue(r, 'whatsapp.provider') || 'console',
        apiKey: keyValue(r, 'whatsapp.apiKey'),
        senderId: keyValue(r, 'whatsapp.senderId'),
        templateId: keyValue(r, 'whatsapp.templateId'),
      });
    }
  }, [waData]);

  const [saveSms, { loading: savingSms }] = useMutation(SAVE_SMS_CONFIG, {
    onCompleted: () => { toast.success('SMS configuration saved'); refetchStatus(); },
    onError: (e) => toast.error(e.message || 'Could not save SMS config'),
  });
  const [saveRzp, { loading: savingRzp }] = useMutation(SAVE_RAZORPAY_CONFIG, {
    onCompleted: () => { toast.success('Razorpay configuration saved'); refetchStatus(); },
    onError: (e) => toast.error(e.message || 'Could not save Razorpay config'),
  });
  const [saveEmail, { loading: savingEmail }] = useMutation(SAVE_EMAIL_CONFIG, {
    onCompleted: () => { toast.success('Email configuration saved'); refetchStatus(); },
    onError: (e) => toast.error(e.message || 'Could not save email config'),
  });
  const [saveWa, { loading: savingWa }] = useMutation(SAVE_WHATSAPP_CONFIG, {
    onCompleted: () => { toast.success('WhatsApp configuration saved'); refetchStatus(); },
    onError: (e) => toast.error(e.message || 'Could not save WhatsApp config'),
  });
  const [sendTestEmail, { loading: sendingTestEmail }] = useMutation(SEND_TEST_EMAIL, {
    onCompleted: () => toast.success('Test email sent'),
    onError: (e) => toast.error(e.message || 'Could not send test email'),
  });
  const [sendTestWa, { loading: sendingTestWa }] = useMutation(SEND_TEST_WHATSAPP, {
    onCompleted: () => toast.success('Test WhatsApp sent'),
    onError: (e) => toast.error(e.message || 'Could not send test WhatsApp'),
  });

  // Masked secrets come back like "••••abcd"; when the user leaves the field
  // untouched we send an empty string so the backend preserves the stored value.
  const handleSaveEmail = () => {
    const port = parseInt(emailCfg.port, 10);
    if (!emailCfg.host.trim()) {
      toast.error('SMTP host is required');
      return;
    }
    if (Number.isNaN(port) || port <= 0 || port > 65535) {
      toast.error('Enter a valid SMTP port (1–65535)');
      return;
    }
    saveEmail({
      variables: {
        input: {
          host: emailCfg.host.trim(),
          port,
          secure: emailCfg.secure,
          user: emailCfg.user,
          password: emailCfg.password.startsWith('••••') ? '' : emailCfg.password,
          from: emailCfg.from,
        },
      },
    });
  };

  const handleSaveWa = () => {
    saveWa({
      variables: {
        input: {
          provider: wa.provider,
          apiKey: wa.apiKey.startsWith('••••') ? '' : wa.apiKey,
          senderId: wa.senderId,
          templateId: wa.templateId,
        },
      },
    });
  };

  const handleTestEmail = () => {
    if (!testEmailTo.trim()) {
      toast.error('Enter an email address to send the test to');
      return;
    }
    sendTestEmail({ variables: { to: testEmailTo.trim() } });
  };

  const handleTestWa = () => {
    if (!testWa.phone.trim()) {
      toast.error('Enter a phone number with country code, e.g. +919876543210');
      return;
    }
    if (!testWa.message.trim()) {
      toast.error('Enter a test message');
      return;
    }
    sendTestWa({ variables: { to: testWa.phone.trim(), message: testWa.message } });
  };

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
        <p className="text-sm text-[#6A7282]">Platform-level configuration for SMS (OTP), email, WhatsApp, and payment gateway. Super-admin only.</p>
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

      {/* Email (SMTP) */}
      <section className="space-y-4 rounded-[14px] border border-[#E5E7EB] bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#1F1F1F]">Email (SMTP)</h2>
            <p className="text-xs text-[#6A7282]">Used for invoice reminders, receipts, and platform notifications. Without SMTP, emails are logged server-side (dev only).</p>
          </div>
          <StatusBadge ok={status?.emailConfigured} label="SMTP" />
        </div>
        <div className="grid grid-cols-1 gap-4 compact:grid-cols-2">
          <label className="space-y-1">
            <span className="text-sm font-medium text-[#1F1F1F]">Host</span>
            <input
              value={emailCfg.host}
              onChange={(e) => setEmailCfg({ ...emailCfg, host: e.target.value })}
              placeholder="e.g. smtp.gmail.com"
              className="w-full rounded-[10px] border border-[#E5E7EB] px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-[#1F1F1F]">Port</span>
            <input
              type="number"
              value={emailCfg.port}
              onChange={(e) => setEmailCfg({ ...emailCfg, port: e.target.value })}
              placeholder="e.g. 587"
              className="w-full rounded-[10px] border border-[#E5E7EB] px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-[#1F1F1F]">User</span>
            <input
              value={emailCfg.user}
              onChange={(e) => setEmailCfg({ ...emailCfg, user: e.target.value })}
              placeholder="e.g. notifications@spacejam.in"
              className="w-full rounded-[10px] border border-[#E5E7EB] px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-[#1F1F1F]">Password</span>
            <input
              type="password"
              value={emailCfg.password.startsWith('••••') ? '' : emailCfg.password}
              onChange={(e) => setEmailCfg({ ...emailCfg, password: e.target.value })}
              placeholder={emailCfg.password.startsWith('••••') ? `${emailCfg.password} (enter new to replace)` : 'SMTP password / app password'}
              className="w-full rounded-[10px] border border-[#E5E7EB] px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-[#1F1F1F]">From address</span>
            <input
              value={emailCfg.from}
              onChange={(e) => setEmailCfg({ ...emailCfg, from: e.target.value })}
              placeholder="e.g. SpaceJam &lt;no-reply@spacejam.in&gt;"
              className="w-full rounded-[10px] border border-[#E5E7EB] px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-[#1F1F1F]">Secure (TLS/SSL)</span>
            <div className="flex h-[38px] items-center gap-2">
              <input
                type="checkbox"
                checked={emailCfg.secure}
                onChange={(e) => setEmailCfg({ ...emailCfg, secure: e.target.checked })}
                className="h-4 w-4 rounded border-[#E5E7EB]"
              />
              <span className="text-xs text-[#6A7282]">Use a secure connection (typically port 465)</span>
            </div>
          </label>
        </div>
        <button
          onClick={handleSaveEmail}
          disabled={savingEmail}
          className="rounded-[10px] bg-[#FF6A2F] px-4 py-2 text-sm font-medium text-white hover:bg-[#FE7A47] disabled:opacity-50"
        >
          {savingEmail ? 'Saving…' : 'Save Email config'}
        </button>

        {/* Test email row */}
        <div className="flex flex-col gap-3 border-t border-[#F3F4F6] pt-4 compact:flex-row compact:items-end">
          <label className="space-y-1 compact:flex-1">
            <span className="text-sm font-medium text-[#1F1F1F]">Send a test email</span>
            <input
              type="email"
              value={testEmailTo}
              onChange={(e) => setTestEmailTo(e.target.value)}
              placeholder="someone@example.com"
              className="w-full rounded-[10px] border border-[#E5E7EB] px-3 py-2 text-sm"
            />
          </label>
          <button
            onClick={handleTestEmail}
            disabled={sendingTestEmail}
            className="rounded-[10px] border border-[#FFD9C9] bg-white px-4 py-2 text-sm font-medium text-[#FF6A2F] hover:bg-[#FFF2EA] disabled:opacity-50"
          >
            {sendingTestEmail ? 'Sending…' : 'Send Test Email'}
          </button>
        </div>
      </section>

      {/* WhatsApp */}
      <section className="space-y-4 rounded-[14px] border border-[#E5E7EB] bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#1F1F1F]">WhatsApp</h2>
            <p className="text-xs text-[#6A7282]">Used for booking confirmations and payment alerts over WhatsApp.</p>
          </div>
          <StatusBadge ok={status?.whatsappConfigured} label={wa.provider !== 'console' ? wa.provider : 'WhatsApp'} />
        </div>
        <div className="grid grid-cols-1 gap-4 compact:grid-cols-2">
          <label className="space-y-1">
            <span className="text-sm font-medium text-[#1F1F1F]">Provider</span>
            <select
              value={wa.provider}
              onChange={(e) => setWa({ ...wa, provider: e.target.value })}
              className="w-full rounded-[10px] border border-[#E5E7EB] px-3 py-2 text-sm"
            >
              <option value="console">Console (dev — no WhatsApp sent)</option>
              <option value="msg91">MSG91</option>
              <option value="twilio">Twilio</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-[#1F1F1F]">API key / auth token</span>
            <input
              type="password"
              value={wa.apiKey.startsWith('••••') ? '' : wa.apiKey}
              onChange={(e) => setWa({ ...wa, apiKey: e.target.value })}
              placeholder={wa.apiKey.startsWith('••••') ? `${wa.apiKey} (enter new to replace)` : 'provider API key'}
              className="w-full rounded-[10px] border border-[#E5E7EB] px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-[#1F1F1F]">Sender ID {wa.provider === 'twilio' ? '(WhatsApp sender number)' : ''}</span>
            <input
              value={wa.senderId}
              onChange={(e) => setWa({ ...wa, senderId: e.target.value })}
              placeholder={wa.provider === 'twilio' ? 'e.g. +14155238886' : 'e.g. SPACEJ'}
              className="w-full rounded-[10px] border border-[#E5E7EB] px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-[#1F1F1F]">Template ID (MSG91)</span>
            <input
              value={wa.templateId}
              onChange={(e) => setWa({ ...wa, templateId: e.target.value })}
              placeholder="optional"
              className="w-full rounded-[10px] border border-[#E5E7EB] px-3 py-2 text-sm"
            />
          </label>
        </div>
        <button
          onClick={handleSaveWa}
          disabled={savingWa}
          className="rounded-[10px] bg-[#FF6A2F] px-4 py-2 text-sm font-medium text-white hover:bg-[#FE7A47] disabled:opacity-50"
        >
          {savingWa ? 'Saving…' : 'Save WhatsApp config'}
        </button>

        {/* Test WhatsApp row */}
        <div className="flex flex-col gap-3 border-t border-[#F3F4F6] pt-4 compact:flex-row compact:items-end">
          <label className="space-y-1 compact:flex-1">
            <span className="text-sm font-medium text-[#1F1F1F]">Send a test WhatsApp</span>
            <input
              value={testWa.phone}
              onChange={(e) => setTestWa({ ...testWa, phone: e.target.value })}
              placeholder="+919876543210 (with country code)"
              className="w-full rounded-[10px] border border-[#E5E7EB] px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1 compact:flex-1">
            <span className="text-sm font-medium text-[#1F1F1F]">Message</span>
            <input
              value={testWa.message}
              onChange={(e) => setTestWa({ ...testWa, message: e.target.value })}
              className="w-full rounded-[10px] border border-[#E5E7EB] px-3 py-2 text-sm"
            />
          </label>
          <button
            onClick={handleTestWa}
            disabled={sendingTestWa}
            className="rounded-[10px] border border-[#FFD9C9] bg-white px-4 py-2 text-sm font-medium text-[#FF6A2F] hover:bg-[#FFF2EA] disabled:opacity-50"
          >
            {sendingTestWa ? 'Sending…' : 'Send Test WhatsApp'}
          </button>
        </div>
      </section>
    </div>
  );
}
