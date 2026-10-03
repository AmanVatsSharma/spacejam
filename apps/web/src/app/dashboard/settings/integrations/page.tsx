/**
 * File:        apps/web/src/app/dashboard/settings/integrations/page.tsx
 * Module:      Web · Dashboard · Settings · Integrations
 * Purpose:     Super-admin-only page to configure platform integrations:
 *              SMS provider (MSG91/Twilio) for OTP delivery; Razorpay for
 *              payments (with a live "Test connection" and the webhook URL to
 *              register); the receiving bank account and the cheque payee that
 *              the onboarding payment step shows to staff. Shows connection
 *              status badges and save forms.
 *              The backend resolver guards every read/write with @Roles(SUPER_ADMIN).
 *
 * Author:      ZCode
 * Last-updated: 2026-10-03
 */
'use client';

import { useEffect, useState } from 'react';
import { getAccessToken } from '@/lib/apollo/token-storage';
import { useQuery, useMutation } from '@apollo/client';
import { toast } from 'sonner';
import {
  GET_INTEGRATION_STATUS,
  GET_INTEGRATION_SETTINGS,
  SAVE_SMS_CONFIG,
  SAVE_RAZORPAY_CONFIG,
  SAVE_QR_PAYMENT_CONFIG,
  SAVE_EMAIL_CONFIG,
  SAVE_WHATSAPP_CONFIG,
  SAVE_BANK_ACCOUNT_CONFIG,
  SAVE_CHEQUE_CONFIG,
  TEST_RAZORPAY_CONNECTION,
  SEND_TEST_EMAIL,
  SEND_TEST_WHATSAPP,
} from '@/lib/apollo/operations';
import { useAuth } from '@/contexts/auth-context';
import { errorMessage } from '@/hooks/use-onboarding-payments';

function keyValue(rows: { key: string; value: string }[], key: string): string {
  return rows.find((r) => r.key === key)?.value ?? '';
}

export default function IntegrationsSettingsPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const { data: statusData, refetch: refetchStatus } = useQuery(GET_INTEGRATION_STATUS);
  const { data: smsData } = useQuery(GET_INTEGRATION_SETTINGS, { variables: { group: 'sms' } });
  const { data: payData, refetch: refetchPay } = useQuery(GET_INTEGRATION_SETTINGS, { variables: { group: 'payment' } });
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

  // ── Razorpay connection test + webhook URL, receiving bank account, cheque payee ──
  // These feed the onboarding payment step: staff see the bank account / cheque payee
  // there, and online payments are verified with the keys + webhook configured here.
  const [bank, setBank] = useState({ accountName: '', accountNumber: '', ifsc: '', bankName: '', branch: '' });
  const [cheque, setCheque] = useState({ payeeName: '', instructions: '' });
  const [rzpCheck, setRzpCheck] = useState<{ ok: boolean; message: string; mode: string } | null>(null);
  const [origin, setOrigin] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    const r = (payData?.integrationSettings ?? []) as { key: string; value: string }[];
    if (!r.length) return;
    setBank({
      accountName: keyValue(r, 'payment.bank.accountName'),
      accountNumber: keyValue(r, 'payment.bank.accountNumber'),
      ifsc: keyValue(r, 'payment.bank.ifsc'),
      bankName: keyValue(r, 'payment.bank.bankName'),
      branch: keyValue(r, 'payment.bank.branch'),
    });
    setCheque({
      payeeName: keyValue(r, 'payment.cheque.payeeName'),
      instructions: keyValue(r, 'payment.cheque.instructions'),
    });
  }, [payData]);

  const afterPaymentSave = (message: string) => {
    toast.success(message);
    refetchStatus();
    refetchPay();
  };
  const [saveBank, { loading: savingBank }] = useMutation(SAVE_BANK_ACCOUNT_CONFIG, {
    onCompleted: () => afterPaymentSave('Bank account saved'),
    onError: (e) => toast.error(errorMessage(e)),
  });
  const [saveCheque, { loading: savingCheque }] = useMutation(SAVE_CHEQUE_CONFIG, {
    onCompleted: () => afterPaymentSave('Cheque payee saved'),
    onError: (e) => toast.error(errorMessage(e)),
  });
  const [testRzp, { loading: testingRzp }] = useMutation(TEST_RAZORPAY_CONNECTION);

  const isMasked = (v: string) => v.startsWith('••••');

  /** Check the key pair against Razorpay without saving. Untouched (masked) fields test the stored values. */
  const handleTestRazorpay = async () => {
    setRzpCheck(null);
    try {
      const { data } = await testRzp({
        variables: {
          keyId: !rzp.keyId.trim() || isMasked(rzp.keyId) ? null : rzp.keyId.trim(),
          keySecret: !rzp.keySecret.trim() || isMasked(rzp.keySecret) ? null : rzp.keySecret.trim(),
        },
      });
      setRzpCheck(data.testRazorpayConnection);
    } catch (e) {
      setRzpCheck({ ok: false, message: errorMessage(e), mode: '' });
    }
  };

  // Typing a key id picks the matching mode so "test key + live mode" can't be saved by accident.
  const handleKeyIdChange = (value: string) => {
    const mode = value.startsWith('rzp_live_') ? 'live' : value.startsWith('rzp_test_') ? 'test' : rzp.mode;
    setRzp({ ...rzp, keyId: value, mode });
    setRzpCheck(null);
  };

  // Same rules as the API (SaveBankAccountConfigInput) — the server stays the authority.
  const handleSaveBank = () => {
    const accountName = bank.accountName.trim();
    const accountNumber = bank.accountNumber.replace(/\s/g, '');
    const ifsc = bank.ifsc.trim().toUpperCase();
    if (accountName.length < 2) { toast.error('Enter the account holder name'); return; }
    if (!/^\d{9,18}$/.test(accountNumber)) { toast.error('Account number must be 9–18 digits'); return; }
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) { toast.error('IFSC must look like HDFC0001234'); return; }
    saveBank({
      variables: {
        input: { accountName, accountNumber, ifsc, bankName: bank.bankName.trim() || null, branch: bank.branch.trim() || null },
      },
    });
  };

  const handleSaveCheque = () => {
    const payeeName = cheque.payeeName.trim();
    if (payeeName.length < 2) { toast.error('Enter who cheques should be made out to'); return; }
    saveCheque({ variables: { input: { payeeName, instructions: cheque.instructions.trim() || null } } });
  };

  const webhookUrl = `${origin}/api/payments/webhook`;
  const copyWebhookUrl = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Copy failed — select the URL and copy it manually');
    }
  };

  // ── Manual UPI QR payment config ─────────────────────────────────────────
  const [qr, setQr] = useState({ upiId: '', payeeName: '', imagePath: '' });
  const [qrUploading, setQrUploading] = useState(false);
  const [saveQr, { loading: savingQr }] = useMutation(SAVE_QR_PAYMENT_CONFIG, {
    refetchQueries: ['GetIntegrationStatus'],
    onCompleted: () => toast.success('UPI QR settings saved'),
    onError: (e) => toast.error(e.message || 'Could not save QR settings'),
  });

  // QR keys live in the same 'payment' group the Razorpay section loads.
  useEffect(() => {
    const entries = payData?.integrationSettings ?? [];
    const getVal = (key: string) => entries.find((e: any) => e.key === key)?.value;
    if (entries.length) {
      setQr((prev) => ({
        ...prev,
        upiId: getVal('payment.qr.upiId') || prev.upiId,
        payeeName: getVal('payment.qr.payeeName') || prev.payeeName,
        imagePath: getVal('payment.qr.imagePath') || prev.imagePath,
      }));
    }
  }, [payData]);

  const handleQrImageUpload = async (file: File) => {
    if (!/^\.(png|jpe?g|webp)$/i.test(file.name.slice(file.name.lastIndexOf('.')))) {
      toast.error('QR image must be PNG, JPG or WEBP');
      return;
    }
    setQrUploading(true);
    try {
      const body = new FormData();
      body.append('file', file);
      const token = getAccessToken();
      const res = await fetch('/api/print/upload', {
        method: 'POST',
        body,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.path) throw new Error(json?.message || `Upload failed (${res.status})`);
      setQr((prev) => ({ ...prev, imagePath: json.path }));
      toast.success('QR image uploaded — remember to Save');
    } catch (e: any) {
      toast.error(e?.message || 'QR image upload failed');
    } finally {
      setQrUploading(false);
    }
  };

  const handleSaveQr = () => {
    if (!qr.upiId.trim() || !qr.upiId.includes('@')) {
      toast.error('Enter a valid UPI ID, e.g. spacejam@upi');
      return;
    }
    saveQr({ variables: { upiId: qr.upiId.trim(), imagePath: qr.imagePath || null, payeeName: qr.payeeName.trim() || null } });
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
        <p className="text-sm text-[#6A7282]">Platform-level configuration for SMS (OTP), email, WhatsApp, the payment gateway, and the bank account and cheque details used when onboarding clients. Super-admin only.</p>
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
              onChange={(e) => handleKeyIdChange(e.target.value)}
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
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => saveRzp({ variables: { input: rzp } })}
            disabled={savingRzp}
            data-testid="rzp-save"
            className="rounded-[10px] bg-[#FF6A2F] px-4 py-2 text-sm font-medium text-white hover:bg-[#FE7A47] disabled:opacity-50"
          >
            {savingRzp ? 'Saving…' : 'Save Razorpay config'}
          </button>
          <button
            type="button"
            onClick={handleTestRazorpay}
            disabled={testingRzp}
            data-testid="rzp-test"
            className="rounded-[10px] border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-medium text-[#1F1F1F] hover:bg-[#FBF6F4] disabled:opacity-50"
          >
            {testingRzp ? 'Checking with Razorpay…' : 'Test connection'}
          </button>
          <span className="text-xs text-[#6A7282]">Saving also verifies new keys with Razorpay first, so a typo can't break payments.</span>
        </div>
        {rzpCheck && (
          <div
            data-testid="rzp-test-result"
            className={`rounded-[10px] border px-3 py-2 text-sm ${
              rzpCheck.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {rzpCheck.ok ? '✓ ' : ''}
            {rzpCheck.message}
          </div>
        )}

        {/* Webhook: lets Razorpay confirm a payment even when the customer closes the tab mid-way. */}
        <div className="space-y-2 rounded-[10px] border border-[#E5E7EB] bg-[#FBF6F4] p-4" data-testid="rzp-webhook">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-[#1F1F1F]">Webhook (recommended)</span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                status?.razorpayWebhookConfigured ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'
              }`}
            >
              {status?.razorpayWebhookConfigured ? 'Secret saved' : 'Secret not set'}
            </span>
          </div>
          <p className="text-xs text-[#4A5565]">
            In the Razorpay Dashboard go to Settings → Webhooks → Add new webhook. Use the URL below, enter the Webhook Secret from above, and enable{' '}
            <b>payment.captured</b>, <b>order.paid</b> and <b>payment.failed</b>.
          </p>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={webhookUrl}
              data-testid="rzp-webhook-url"
              onFocus={(e) => e.currentTarget.select()}
              className="w-full rounded-[10px] border border-[#E5E7EB] bg-white px-3 py-2 font-mono text-xs text-[#1F1F1F]"
            />
            <button
              type="button"
              onClick={copyWebhookUrl}
              className="shrink-0 rounded-[10px] border border-[#E5E7EB] bg-white px-3 py-2 text-xs font-medium text-[#1F1F1F] hover:bg-gray-50"
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          {status?.razorpayConfigured && !status?.razorpayWebhookConfigured && (
            <p className="text-xs text-amber-800">
              Without the webhook, a payment made after the customer closes the browser tab is only matched when staff retry it from Pending payments.
            </p>
          )}
        </div>
      </section>

      {/* Receiving bank account (NEFT / RTGS / IMPS) */}
      <section className="space-y-4 rounded-[14px] border border-[#E5E7EB] bg-white p-6" data-testid="bank-config">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[#1F1F1F]">Bank account (NEFT / RTGS / IMPS)</h2>
            <p className="text-xs text-[#6A7282]">
              Shown to staff when a client pays the onboarding deposit by bank transfer, so they can share the right account. The client's UTR is recorded as the payment reference.
            </p>
          </div>
          <StatusBadge ok={status?.bankConfigured} label="Bank account" />
        </div>
        <div className="grid grid-cols-1 gap-4 compact:grid-cols-2">
          <label className="space-y-1">
            <span className="text-sm font-medium text-[#1F1F1F]">Account holder name</span>
            <input
              value={bank.accountName}
              onChange={(e) => setBank({ ...bank, accountName: e.target.value })}
              placeholder="As printed on the bank account"
              data-testid="bank-account-name"
              className="w-full rounded-[10px] border border-[#E5E7EB] px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-[#1F1F1F]">Account number</span>
            <input
              value={bank.accountNumber}
              inputMode="numeric"
              onChange={(e) => setBank({ ...bank, accountNumber: e.target.value.replace(/[^\d\s]/g, '') })}
              placeholder="9–18 digits"
              data-testid="bank-account-number"
              className="w-full rounded-[10px] border border-[#E5E7EB] px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-[#1F1F1F]">IFSC code</span>
            <input
              value={bank.ifsc}
              maxLength={11}
              onChange={(e) => setBank({ ...bank, ifsc: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })}
              placeholder="e.g. HDFC0001234"
              data-testid="bank-ifsc"
              className="w-full rounded-[10px] border border-[#E5E7EB] px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-[#1F1F1F]">Bank name</span>
            <input
              value={bank.bankName}
              onChange={(e) => setBank({ ...bank, bankName: e.target.value })}
              placeholder="optional"
              data-testid="bank-name"
              className="w-full rounded-[10px] border border-[#E5E7EB] px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-[#1F1F1F]">Branch</span>
            <input
              value={bank.branch}
              onChange={(e) => setBank({ ...bank, branch: e.target.value })}
              placeholder="optional"
              data-testid="bank-branch"
              className="w-full rounded-[10px] border border-[#E5E7EB] px-3 py-2 text-sm"
            />
          </label>
        </div>
        <button
          onClick={handleSaveBank}
          disabled={savingBank}
          data-testid="bank-save"
          className="rounded-[10px] bg-[#FF6A2F] px-4 py-2 text-sm font-medium text-white hover:bg-[#FE7A47] disabled:opacity-50"
        >
          {savingBank ? 'Saving…' : 'Save bank account'}
        </button>
      </section>

      {/* Cheque payee */}
      <section className="space-y-4 rounded-[14px] border border-[#E5E7EB] bg-white p-6" data-testid="cheque-config">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[#1F1F1F]">Cheques</h2>
            <p className="text-xs text-[#6A7282]">
              Who cheques are made out to, and how to hand them in. A client who pays by cheque is saved as a Cold lead and becomes a client only after staff confirm the cheque cleared.
            </p>
          </div>
          <StatusBadge ok={status?.chequeConfigured} label="Cheque payee" />
        </div>
        <div className="grid grid-cols-1 gap-4 compact:grid-cols-2">
          <label className="space-y-1">
            <span className="text-sm font-medium text-[#1F1F1F]">Payee name</span>
            <input
              value={cheque.payeeName}
              onChange={(e) => setCheque({ ...cheque, payeeName: e.target.value })}
              placeholder="e.g. SpaceJam Workspaces Pvt Ltd"
              data-testid="cheque-payee"
              className="w-full rounded-[10px] border border-[#E5E7EB] px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1 compact:col-span-2">
            <span className="text-sm font-medium text-[#1F1F1F]">Instructions for clients (optional)</span>
            <textarea
              value={cheque.instructions}
              maxLength={500}
              rows={3}
              onChange={(e) => setCheque({ ...cheque, instructions: e.target.value })}
              placeholder="e.g. Hand it in at the front desk of any center, Mon–Sat 10am–6pm. Write the company name on the back."
              data-testid="cheque-instructions"
              className="w-full rounded-[10px] border border-[#E5E7EB] px-3 py-2 text-sm"
            />
          </label>
        </div>
        <button
          onClick={handleSaveCheque}
          disabled={savingCheque}
          data-testid="cheque-save"
          className="rounded-[10px] bg-[#FF6A2F] px-4 py-2 text-sm font-medium text-white hover:bg-[#FE7A47] disabled:opacity-50"
        >
          {savingCheque ? 'Saving…' : 'Save cheque settings'}
        </button>
      </section>

      {/* Manual UPI QR Code */}
      <section className="space-y-4 rounded-[14px] border border-[#E5E7EB] bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#1F1F1F]">UPI QR Code (manual payments)</h2>
            <p className="text-xs text-[#6A7282]">
              Upload your UPI QR image and ID — admins can then accept manual QR payments with an optional transaction reference as proof.
            </p>
          </div>
          <StatusBadge ok={status?.qrConfigured} label="UPI QR" />
        </div>
        <div className="grid grid-cols-1 gap-4 compact:grid-cols-2">
          <label className="space-y-1">
            <span className="text-sm font-medium text-[#1F1F1F]">UPI ID</span>
            <input
              value={qr.upiId}
              onChange={(e) => setQr({ ...qr, upiId: e.target.value })}
              placeholder="e.g. spacejam@upi"
              className="w-full rounded-[10px] border border-[#E5E7EB] px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-[#1F1F1F]">Payee name (shown on the pay screen)</span>
            <input
              value={qr.payeeName}
              onChange={(e) => setQr({ ...qr, payeeName: e.target.value })}
              placeholder="e.g. SpaceJam Coworking"
              className="w-full rounded-[10px] border border-[#E5E7EB] px-3 py-2 text-sm"
            />
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {qr.imagePath ? (
            <img
              src={qr.imagePath}
              alt="UPI QR code"
              className="h-32 w-32 rounded-[10px] border border-[#E5E7EB] object-contain"
            />
          ) : (
            <div className="flex h-32 w-32 items-center justify-center rounded-[10px] border border-dashed border-[#E5E7EB] text-xs text-[#9CA3AF]">
              No QR uploaded
            </div>
          )}
          <div className="space-y-2">
            <label className="inline-block cursor-pointer rounded-[10px] border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-medium text-[#374151] hover:bg-gray-50">
              {qrUploading ? 'Uploading…' : 'Upload QR image'}
              <input
                type="file"
                accept=".png,.jpg,.jpeg,.webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleQrImageUpload(f);
                  e.target.value = '';
                }}
              />
            </label>
            {qr.imagePath && (
              <button
                type="button"
                onClick={() => setQr({ ...qr, imagePath: '' })}
                className="block text-xs text-[#DC2626] hover:underline"
              >
                Remove image
              </button>
            )}
            <p className="text-xs text-[#9CA3AF]">PNG / JPG · max 10 MB. Saved on the server, shown on the invoice pay screen.</p>
          </div>
        </div>
        <button
          onClick={handleSaveQr}
          disabled={savingQr}
          className="rounded-[10px] bg-[#FF6A2F] px-4 py-2 text-sm font-medium text-white hover:bg-[#FE7A47] disabled:opacity-50"
        >
          {savingQr ? 'Saving…' : 'Save UPI QR config'}
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
