/**
 * File:        apps/api/src/integrations/integrations-extensions.spec.ts
 * Module:      API · Integrations · Tests
 * Purpose:     Covers the integrations extensions: saveEmailConfig key
 *              writes + secret masking, email/whatsapp configured flags,
 *              WhatsAppService provider routing (twilio path with mocked
 *              fetch), and markInvoicePaid paymentMethod persistence.
 *
 *              The Razorpay webhook and verifyPayment tests that used to live
 *              here asserted the old behaviour (trusting `notes.invoiceId` and
 *              any client-supplied invoiceId). That logic now settles through
 *              the payment_orders ledger and is covered by
 *              payments-webhook.controller.spec.ts, payment-orders.service.spec.ts,
 *              payment.resolver.spec.ts and razorpay.service.spec.ts.
 *
 * Author:      ZCode · Claude Sonnet 5.5 (2026-10-02 update)
 * Last-updated: 2026-10-02
 */
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';

import { IntegrationSettingsService } from './integration-settings.service';
import { IntegrationSettingsResolver } from './integration-settings.resolver';
import { WhatsAppService } from './whatsapp.service';
import { RazorpayService } from './razorpay.service';
import { EmailService } from '../auth/services/email.service';
import { AuditService } from '../auth/services/audit.service';
import { AppSetting } from '../typeorm/entities/app-setting.entity';
import { Invoice } from '../typeorm/entities/invoice.entity';
import { InvoiceResolver } from '../graphql/resolvers/revenue.resolver';
import { CacheService } from '../cache/cache.service';
import { InvoiceStatus } from '@enums';

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
          RazorpayService,
          { provide: AuditService, useValue: { record: jest.fn() } },
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
          RazorpayService,
          { provide: AuditService, useValue: { record: jest.fn() } },
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
          RazorpayService,
          { provide: AuditService, useValue: { record: jest.fn() } },
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
          RazorpayService,
          { provide: AuditService, useValue: { record: jest.fn() } },
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
          RazorpayService,
          { provide: AuditService, useValue: { record: jest.fn() } },
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
          RazorpayService,
          { provide: AuditService, useValue: { record: jest.fn() } },
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
          RazorpayService,
          { provide: AuditService, useValue: { record: jest.fn() } },
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
          RazorpayService,
          { provide: AuditService, useValue: { record: jest.fn() } },
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
          RazorpayService,
          { provide: AuditService, useValue: { record: jest.fn() } },
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

    describe('authorization (offline "mark paid" moves real money records)', () => {
      const build = async (invoice: any) => {
        const invoices = invoiceRepo();
        invoices.findOne.mockResolvedValue(invoice);
        const moduleRef = await Test.createTestingModule({
          providers: [
            InvoiceResolver,
            { provide: CacheService, useValue: { invalidatePattern: jest.fn(), del: jest.fn() } },
            { provide: getRepositoryToken(Invoice), useValue: invoices },
          ],
        }).compile();
        return { resolver: moduleRef.get(InvoiceResolver), invoices };
      };
      const manager = (centerId: string): any => ({ sub: 'm', email: 'm@x.test', role: 'CENTER_MANAGER', centerId, sid: 's', typ: 'access' });

      it('is staff-only (SUPER_ADMIN, CENTER_MANAGER) — a MEMBER can no longer mark invoices paid', () => {
        const proto: any = InvoiceResolver.prototype;
        expect(Reflect.getMetadata('roles', proto.markInvoicePaid)).toEqual(['SUPER_ADMIN', 'CENTER_MANAGER']);
      });

      it('a center manager cannot mark another center\'s invoice paid', async () => {
        const { resolver, invoices } = await build({ id: 'inv-x', status: InvoiceStatus.SENT, centerId: 'center-b' });
        await expect(resolver.markInvoicePaid('inv-x', undefined, undefined, manager('center-a'))).rejects.toThrow(/different center/);
        expect(invoices.update).not.toHaveBeenCalled();
      });

      it('allows a manager on their own center\'s invoice', async () => {
        const { resolver, invoices } = await build({ id: 'inv-x', status: InvoiceStatus.SENT, centerId: 'center-a' });
        await resolver.markInvoicePaid('inv-x', 'CHEQUE' as any, '123456', manager('center-a'));
        expect(invoices.update).toHaveBeenCalledWith('inv-x', expect.objectContaining({ status: InvoiceStatus.PAID, paymentMethod: 'CHEQUE', paymentReference: '123456' }));
      });

      it('refuses a cancelled invoice and an unknown one', async () => {
        const cancelled = await build({ id: 'inv-c', status: InvoiceStatus.CANCELLED });
        await expect(cancelled.resolver.markInvoicePaid('inv-c')).rejects.toThrow(/cancelled invoice/);
        expect(cancelled.invoices.update).not.toHaveBeenCalled();

        const missing = await build(null);
        await expect(missing.resolver.markInvoicePaid('nope')).rejects.toThrow(/Invoice not found/);
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
