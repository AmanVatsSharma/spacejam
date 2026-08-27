/**
 * File:        apps/api/src/integrations/integrations-extensions.spec.ts
 * Module:      API · Integrations · Tests
 * Purpose:     Covers the integrations extensions: saveEmailConfig key
 *              writes + secret masking, email/whatsapp configured flags,
 *              WhatsAppService provider routing (twilio path with mocked
 *              fetch), the Razorpay webhook signature verification +
 *              invoice-PAID marking, verifyPayment invoice marking, and
 *              markInvoicePaid paymentMethod persistence.
 *
 * Author:      ZCode
 * Last-updated: 2026-08-27
 */
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { createHmac } from 'node:crypto';

import { IntegrationSettingsService } from './integration-settings.service';
import { IntegrationSettingsResolver } from './integration-settings.resolver';
import { WhatsAppService } from './whatsapp.service';
import { PaymentsWebhookController } from './payments-webhook.controller';
import { PaymentResolver } from './payment.resolver';
import { RazorpayService } from './razorpay.service';
import { EmailService } from '../auth/services/email.service';
import { AppSetting } from '../typeorm/entities/app-setting.entity';
import { Invoice } from '../typeorm/entities/invoice.entity';
import { InvoiceResolver } from '../graphql/resolvers/revenue.resolver';
import { CacheService } from '../cache/cache.service';
import { InvoiceStatus } from '../graphql/types/user.type';

/** Build a fake AppSetting repo backed by an in-memory map so the real
 *  IntegrationSettingsService cache + setMany/readGroup logic runs. */
function settingsRepo(initial: Record<string, { value: string; secret?: boolean }> = {}) {
  const rows = new Map<string, AppSetting>();
  const saved: any[] = [];
  for (const [key, entry] of Object.entries(initial)) {
    rows.set(key, { key, value: entry.value, secret: !!entry.secret, group: 'test' } as AppSetting);
  }
  return {
    rows,
    saved,
    find: jest.fn(async ({ where }: any = {}) => {
      const all = [...rows.values()];
      if (!where?.group) return all;
      return all.filter((r) => (r as any).group === where.group);
    }),
    findOne: jest.fn(async ({ where }: any) => rows.get(where.key) ?? null),
    create: jest.fn((o: any) => o),
    save: jest.fn(async (o: any) => {
      saved.push(o);
      rows.set(o.key, o);
      return o;
    }),
  };
}

function invoiceRepo() {
  return {
    findOne: jest.fn(),
    update: jest.fn().mockResolvedValue(undefined),
  };
}

describe('Integrations extensions', () => {
  describe('saveEmailConfig + masking', () => {
    it('writes all email.* keys, flags the password secret, and masks it on read', async () => {
      const repo = settingsRepo();
      const moduleRef = await Test.createTestingModule({
        providers: [
          IntegrationSettingsService,
          IntegrationSettingsResolver,
          WhatsAppService,
          { provide: getRepositoryToken(AppSetting), useValue: repo },
          { provide: EmailService, useValue: {} },
        ],
      }).compile();

      const resolver = moduleRef.get(IntegrationSettingsResolver);
      await resolver.saveEmailConfig({
        host: 'smtp.example.com',
        port: 465,
        secure: true,
        user: 'ops@example.com',
        password: 'super-secret-1234',
        from: 'billing@example.com',
      });

      const savedKeys = repo.saved.map((s: any) => [s.key, s.value, !!s.secret]);
      expect(savedKeys).toContainEqual(['email.host', 'smtp.example.com', false]);
      expect(savedKeys).toContainEqual(['email.port', '465', false]);
      expect(savedKeys).toContainEqual(['email.secure', 'true', false]);
      expect(savedKeys).toContainEqual(['email.user', 'ops@example.com', false]);
      expect(savedKeys).toContainEqual(['email.password', 'super-secret-1234', true]);
      expect(savedKeys).toContainEqual(['email.from', 'billing@example.com', false]);

      // Read back through readGroup: the password must be masked.
      const entries = await moduleRef.get(IntegrationSettingsService).readGroup('email');
      const pw = entries.find((e) => e.key === 'email.password')!;
      expect(pw.secret).toBe(true);
      expect(pw.value).toBe('••••1234');
      expect(pw.value).not.toContain('super-secret');
    });

    it('keeps the stored password when an empty or masked value is sent back', async () => {
      const repo = settingsRepo({
        'email.password': { value: 'stored-secret-9999', secret: true },
      });
      const moduleRef = await Test.createTestingModule({
        providers: [
          IntegrationSettingsService,
          IntegrationSettingsResolver,
          WhatsAppService,
          { provide: getRepositoryToken(AppSetting), useValue: repo },
          { provide: EmailService, useValue: {} },
        ],
      }).compile();

      const resolver = moduleRef.get(IntegrationSettingsResolver);
      await resolver.saveEmailConfig({
        host: 'smtp2.example.com',
        port: 587,
        password: '••••9999', // masked value round-tripped by the UI
      });

      const pwSave = repo.saved.find((s: any) => s.key === 'email.password')!;
      expect(pwSave.value).toBe('stored-secret-9999');
    });
  });

  describe('configured flags', () => {
    it('reports emailConfigured only when host+user+password are set', async () => {
      const withCreds = settingsRepo({
        'email.host': { value: 'smtp.example.com' },
        'email.user': { value: 'ops@example.com' },
        'email.password': { value: 'pw', secret: true },
      });
      const m1 = await Test.createTestingModule({
        providers: [
          IntegrationSettingsService,
          IntegrationSettingsResolver,
          WhatsAppService,
          { provide: getRepositoryToken(AppSetting), useValue: withCreds },
          { provide: EmailService, useValue: {} },
        ],
      }).compile();
      const status1 = await m1.get(IntegrationSettingsResolver).integrationStatus();
      expect(status1.emailConfigured).toBe(true);
      expect(status1.whatsappConfigured).toBe(false); // nothing configured

      const withoutCreds = settingsRepo({
        'email.host': { value: 'smtp.example.com' },
        // user + password missing
      });
      const m2 = await Test.createTestingModule({
        providers: [
          IntegrationSettingsService,
          IntegrationSettingsResolver,
          WhatsAppService,
          { provide: getRepositoryToken(AppSetting), useValue: withoutCreds },
          { provide: EmailService, useValue: {} },
        ],
      }).compile();
      const status2 = await m2.get(IntegrationSettingsService).isEmailConfigured();
      expect(status2).toBe(false);
    });

    it('reports whatsappConfigured only for a real provider + apiKey', async () => {
      const repo = settingsRepo({
        'whatsapp.provider': { value: 'twilio' },
        'whatsapp.apiKey': { value: 'SID:TOKEN', secret: true },
      });
      const moduleRef = await Test.createTestingModule({
        providers: [
          IntegrationSettingsService,
          IntegrationSettingsResolver,
          WhatsAppService,
          { provide: getRepositoryToken(AppSetting), useValue: repo },
          { provide: EmailService, useValue: {} },
        ],
      }).compile();
      const settings = moduleRef.get(IntegrationSettingsService);
      expect(await settings.isWhatsappConfigured()).toBe(true);

      const consoleRepo = settingsRepo({ 'whatsapp.provider': { value: 'console' } });
      const m2 = await Test.createTestingModule({
        providers: [
          IntegrationSettingsService,
          IntegrationSettingsResolver,
          WhatsAppService,
          { provide: getRepositoryToken(AppSetting), useValue: consoleRepo },
          { provide: EmailService, useValue: {} },
        ],
      }).compile();
      const status = await m2.get(IntegrationSettingsResolver).integrationStatus();
      expect(status.whatsappConfigured).toBe(false);
    });
  });

  describe('WhatsAppService', () => {
    async function build(repo: ReturnType<typeof settingsRepo>) {
      const moduleRef = await Test.createTestingModule({
        providers: [
          IntegrationSettingsService,
          WhatsAppService,
          { provide: getRepositoryToken(AppSetting), useValue: repo },
        ],
      }).compile();
      return moduleRef.get(WhatsAppService);
    }

    it('sends via Twilio with whatsapp:-prefixed To/From and Basic auth', async () => {
      const fetchMock = jest.fn(async () => ({ ok: true, text: async () => '' }) as any);
      const globalFetch = global.fetch;
      global.fetch = fetchMock as any;
      try {
        const service = await build(settingsRepo({
          'whatsapp.provider': { value: 'twilio' },
          'whatsapp.apiKey': { value: 'AC123:tok456', secret: true },
          'whatsapp.senderId': { value: '+14155238886' },
        }));
        await service.send('+919876543210', 'Hello from SpaceJam');
      } finally {
        global.fetch = globalFetch;
      }

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0] as [string, any];
      expect(url).toBe('https://api.twilio.com/2010-04-01/Accounts/AC123/Messages.json');
      expect(init.method).toBe('POST');
      expect(init.headers.Authorization).toBe(
        'Basic ' + Buffer.from('AC123:tok456').toString('base64'),
      );
      const body = init.body as URLSearchParams;
      expect(body.get('To')).toBe('whatsapp:+919876543210');
      expect(body.get('From')).toBe('whatsapp:+14155238886');
      expect(body.get('Body')).toBe('Hello from SpaceJam');
    });

    it('throws BadRequest (no silent console success) when unconfigured', async () => {
      const service = await build(settingsRepo({ 'whatsapp.provider': { value: 'console' } }));
      await expect(service.send('+919876543210', 'hi')).rejects.toThrow(BadRequestException);
      await expect(service.send('+919876543210', 'hi')).rejects.toThrow('WhatsApp is not configured.');
    });

    it('sendTestWhatsapp surfaces provider errors', async () => {
      const moduleRef = await Test.createTestingModule({
        providers: [
          IntegrationSettingsService,
          IntegrationSettingsResolver,
          WhatsAppService,
          { provide: getRepositoryToken(AppSetting), useValue: settingsRepo() },
          { provide: EmailService, useValue: {} },
        ],
      }).compile();
      const resolver = moduleRef.get(IntegrationSettingsResolver);
      await expect(resolver.sendTestWhatsapp('+919876543210', 'test')).rejects.toThrow(
        'WhatsApp is not configured.',
      );
    });
  });

  describe('sendTestEmail', () => {
    it('delegates to EmailService.sendTest', async () => {
      const sendTest = jest.fn().mockResolvedValue(undefined);
      const moduleRef = await Test.createTestingModule({
        providers: [
          IntegrationSettingsService,
          IntegrationSettingsResolver,
          WhatsAppService,
          { provide: getRepositoryToken(AppSetting), useValue: settingsRepo() },
          { provide: EmailService, useValue: { sendTest } },
        ],
      }).compile();

      const resolver = moduleRef.get(IntegrationSettingsResolver);
      await expect(resolver.sendTestEmail('ops@example.com')).resolves.toBe(true);
      expect(sendTest).toHaveBeenCalledWith('ops@example.com');
    });

    it('propagates the BadRequest from EmailService when unconfigured', async () => {
      const moduleRef = await Test.createTestingModule({
        providers: [
          IntegrationSettingsService,
          IntegrationSettingsResolver,
          WhatsAppService,
          { provide: getRepositoryToken(AppSetting), useValue: settingsRepo() },
          {
            provide: EmailService,
            useValue: {
              sendTest: jest.fn(() => Promise.reject(new BadRequestException('Email is not configured.'))),
            },
          },
        ],
      }).compile();
      await expect(moduleRef.get(IntegrationSettingsResolver).sendTestEmail('x@y.z')).rejects.toThrow(
        'Email is not configured.',
      );
    });
  });

  describe('payments webhook', () => {
    const WEBHOOK_SECRET = 'whsec_test_123';

    function capturedPayload(invoiceId: string) {
      return JSON.stringify({
        event: 'payment.captured',
        payload: {
          payment: {
            entity: { id: 'pay_123', notes: { invoiceId } },
          },
        },
      });
    }

    async function build(repo: ReturnType<typeof settingsRepo>, invoices: ReturnType<typeof invoiceRepo>) {
      const moduleRef = await Test.createTestingModule({
        providers: [
          IntegrationSettingsService,
          PaymentsWebhookController,
          { provide: getRepositoryToken(AppSetting), useValue: repo },
          { provide: getRepositoryToken(Invoice), useValue: invoices },
        ],
      }).compile();
      return moduleRef.get(PaymentsWebhookController);
    }

    function req(body: string, signature: string) {
      return {
        headers: { 'x-razorpay-signature': signature },
        rawBody: Buffer.from(body, 'utf8'),
      } as any;
    }

    it('accepts a valid signature and marks the invoice PAID (ONLINE)', async () => {
      const repo = settingsRepo({ 'razorpay.webhookSecret': { value: WEBHOOK_SECRET, secret: true } });
      const invoices = invoiceRepo();
      invoices.findOne.mockResolvedValue({ id: 'inv-1', status: InvoiceStatus.SENT });
      const controller = await build(repo, invoices);

      const body = capturedPayload('inv-1');
      const sig = createHmac('sha256', WEBHOOK_SECRET).update(body, 'utf8').digest('hex');
      const out = await controller.handleWebhook(req(body, sig));

      expect(out).toEqual({ received: true });
      expect(invoices.update).toHaveBeenCalledWith('inv-1', {
        status: InvoiceStatus.PAID,
        paidDate: expect.any(Date),
        paymentMethod: 'ONLINE',
      });
    });

    it('rejects an invalid signature with 401 and never touches the invoice', async () => {
      const repo = settingsRepo({ 'razorpay.webhookSecret': { value: WEBHOOK_SECRET, secret: true } });
      const invoices = invoiceRepo();
      const controller = await build(repo, invoices);

      const body = capturedPayload('inv-1');
      await expect(controller.handleWebhook(req(body, 'deadbeef'))).rejects.toThrow(
        UnauthorizedException,
      );
      expect(invoices.update).not.toHaveBeenCalled();
    });

    it('is idempotent: an already-PAID invoice is not updated again', async () => {
      const repo = settingsRepo({ 'razorpay.webhookSecret': { value: WEBHOOK_SECRET, secret: true } });
      const invoices = invoiceRepo();
      invoices.findOne.mockResolvedValue({ id: 'inv-1', status: InvoiceStatus.PAID });
      const controller = await build(repo, invoices);

      const body = capturedPayload('inv-1');
      const sig = createHmac('sha256', WEBHOOK_SECRET).update(body, 'utf8').digest('hex');
      await controller.handleWebhook(req(body, sig));
      expect(invoices.update).not.toHaveBeenCalled();
    });

    it('still returns 200 for a valid signature when the invoice is unknown', async () => {
      const repo = settingsRepo({ 'razorpay.webhookSecret': { value: WEBHOOK_SECRET, secret: true } });
      const invoices = invoiceRepo();
      invoices.findOne.mockResolvedValue(null);
      const controller = await build(repo, invoices);

      const body = capturedPayload('missing-inv');
      const sig = createHmac('sha256', WEBHOOK_SECRET).update(body, 'utf8').digest('hex');
      await expect(controller.handleWebhook(req(body, sig))).resolves.toEqual({ received: true });
      expect(invoices.update).not.toHaveBeenCalled();
    });
  });

  describe('verifyPayment marks invoice PAID', () => {
    it('marks the referenced invoice PAID with paymentMethod ONLINE on success', async () => {
      const invoices = invoiceRepo();
      invoices.findOne.mockResolvedValue({ id: 'inv-9', status: InvoiceStatus.SENT });
      const moduleRef = await Test.createTestingModule({
        providers: [
          PaymentResolver,
          {
            provide: RazorpayService,
            useValue: { verifyPayment: jest.fn().mockResolvedValue(true) },
          },
          { provide: IntegrationSettingsService, useValue: {} },
          { provide: getRepositoryToken(Invoice), useValue: invoices },
        ],
      }).compile();

      const resolver = moduleRef.get(PaymentResolver);
      const ok = await resolver.verifyPayment({
        razorpayOrderId: 'order_1',
        razorpayPaymentId: 'pay_1',
        razorpaySignature: 'sig',
        invoiceId: 'inv-9',
      });
      expect(ok).toBe(true);
      expect(invoices.update).toHaveBeenCalledWith('inv-9', {
        status: InvoiceStatus.PAID,
        paidDate: expect.any(Date),
        paymentMethod: 'ONLINE',
      });
    });

    it('returns false and skips the invoice when the signature is invalid', async () => {
      const invoices = invoiceRepo();
      const moduleRef = await Test.createTestingModule({
        providers: [
          PaymentResolver,
          {
            provide: RazorpayService,
            useValue: { verifyPayment: jest.fn().mockResolvedValue(false) },
          },
          { provide: IntegrationSettingsService, useValue: {} },
          { provide: getRepositoryToken(Invoice), useValue: invoices },
        ],
      }).compile();

      const ok = await moduleRef.get(PaymentResolver).verifyPayment({
        razorpayOrderId: 'order_1',
        razorpayPaymentId: 'pay_1',
        razorpaySignature: 'bad',
      });
      expect(ok).toBe(false);
      expect(invoices.update).not.toHaveBeenCalled();
    });
  });

  describe('markInvoicePaid persists paymentMethod', () => {
    it('passes the supplied paymentMethod through to the repo update', async () => {
      const invoices = invoiceRepo();
      invoices.findOne.mockResolvedValue({ id: 'inv-2', status: InvoiceStatus.PAID });
      const moduleRef = await Test.createTestingModule({
        providers: [
          InvoiceResolver,
          { provide: CacheService, useValue: { invalidatePattern: jest.fn(), del: jest.fn() } },
          { provide: getRepositoryToken(Invoice), useValue: invoices },
        ],
      }).compile();

      await moduleRef.get(InvoiceResolver).markInvoicePaid('inv-2', 'CHEQUE');
      expect(invoices.update).toHaveBeenCalledWith('inv-2', {
        status: InvoiceStatus.PAID,
        paidDate: expect.any(Date),
        paymentMethod: 'CHEQUE',
      });
    });

    it('omits paymentMethod when not supplied (existing behavior)', async () => {
      const invoices = invoiceRepo();
      invoices.findOne.mockResolvedValue({ id: 'inv-3', status: InvoiceStatus.PAID });
      const moduleRef = await Test.createTestingModule({
        providers: [
          InvoiceResolver,
          { provide: CacheService, useValue: { invalidatePattern: jest.fn(), del: jest.fn() } },
          { provide: getRepositoryToken(Invoice), useValue: invoices },
        ],
      }).compile();

      await moduleRef.get(InvoiceResolver).markInvoicePaid('inv-3');
      expect(invoices.update).toHaveBeenCalledWith('inv-3', {
        status: InvoiceStatus.PAID,
        paidDate: expect.any(Date),
      });
    });
  });
});
