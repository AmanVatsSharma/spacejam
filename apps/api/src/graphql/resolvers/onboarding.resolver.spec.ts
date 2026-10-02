/**
 * File:        apps/api/src/graphql/resolvers/onboarding.resolver.spec.ts
 * Module:      API · Onboarding Resolver Tests
 * Purpose:     Integration-style unit tests for OnboardingResolver.
 *              Builds a Nest TestingModule with the real resolver, a mocked
 *              OnboardingRepository, and a mocked CacheService — then drives
 *              the full happy-path flow end-to-end at the resolver layer:
 *
 *                  1. createOnboarding → row created with PENDING
 *                  2. advanceOnboardingStatus → PENDING → IN_PROGRESS
 *                  3. advanceOnboardingStatus → IN_PROGRESS → COMPLETED (stamps completedAt)
 *                  4. advanceOnboardingStatus → idempotent (no-op when already COMPLETED)
 *                  5. completeOnboarding → direct jump to COMPLETED (even from PENDING)
 *                  6. updateOnboarding → patches arbitrary fields (companyName, etc.)
 *                  7. deleteOnboarding → row removed, cache invalidated
 *                  8. onboardings / onboarding / onboardingCount → queries
 *
 *              This is the same file the earlier summary claimed to verify
 *              against the live API; instead we verify deterministically here
 *              with jest fakes, so no production rows are created or mutated.
 *
 * Author:      Claude Fable 5.1
 * Last-updated: 2026-09-30
 */

import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Onboarding } from '../../typeorm/entities/onboarding.entity';
import { OnboardingStatus } from '@enums';
import { OnboardingResolver } from './onboarding.resolver';
import { CacheService } from '../../cache/cache.service';

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────
const UUID = (n = 0) => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;
const NOW = new Date('2026-09-30T12:00:00.000Z');

/** Seed an Onboarding entity as it would look freshly created. */
function freshOnboarding(overrides: Partial<Onboarding> = {}): Onboarding {
    return {
        id: UUID(1),
        leadId: null,
        customerId: null,
        status: OnboardingStatus.PENDING,
        companyName: null,
        companyAddress: null,
        gstNumber: null,
        planType: null,
        seatCount: null,
        contactName: null,
        contactEmail: null,
        contactPhone: null,
        emergencyContact: null,
        emergencyPhone: null,
        idProofUrl: null,
        agreementUrl: null,
        completedAt: null,
        notes: null,
        assignedToId: null,
        centerId: null,
        lead: undefined,
        customer: undefined,
        assignedTo: undefined,
        center: undefined,
        createdAt: NOW,
        updatedAt: NOW,
        ...overrides,
    } as Onboarding;
}

let resolver: OnboardingResolver;
let repo: any;
let cacheInvalidate: jest.Mock;
let cacheDel: jest.Mock;

async function build() {
    repo = {
        create: jest.fn(),
        save: jest.fn(),
        find: jest.fn(),
        findOne: jest.fn(),
        update: jest.fn().mockResolvedValue(undefined),
        delete: jest.fn().mockResolvedValue(undefined),
        count: jest.fn(),
    };
    cacheInvalidate = jest.fn().mockResolvedValue(undefined);
    cacheDel = jest.fn().mockResolvedValue(undefined);

    const moduleRef = await Test.createTestingModule({
        providers: [
            OnboardingResolver,
            { provide: getRepositoryToken(Onboarding), useValue: repo },
            { provide: CacheService, useValue: { invalidatePattern: cacheInvalidate, del: cacheDel } },
        ],
    }).compile();
    resolver = moduleRef.get(OnboardingResolver);
}

// ──────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────
describe('OnboardingResolver — full status-transition flow', () => {
    beforeEach(build);

    // ── 1. createOnboarding ────────────────────
    describe('createOnboarding', () => {
        it('creates a row in PENDING and persists companyName/companyAddress', async () => {
            const saved = freshOnboarding({
                id: UUID(10),
                companyName: 'TestCorp',
                companyAddress: '123 Main St',
            });
            repo.create.mockReturnValue(saved);
            repo.save.mockResolvedValue(saved);

            const input = {
                companyName: 'TestCorp',
                companyAddress: '123 Main St',
            } as any;
            const result = await resolver.createOnboarding(input);

            expect(repo.create).toHaveBeenCalledWith({
                ...input,
                status: OnboardingStatus.PENDING,
            });
            expect(result.companyName).toBe('TestCorp');
            expect(result.companyAddress).toBe('123 Main St');
            expect(result.status).toBe(OnboardingStatus.PENDING);
            expect(cacheInvalidate).toHaveBeenCalledWith('onboardings:*');
        });

        it('defaults to PENDING when no status is supplied', async () => {
            const saved = freshOnboarding();
            repo.create.mockReturnValue(saved);
            repo.save.mockResolvedValue(saved);

            await resolver.createOnboarding({} as any);
            expect(repo.create).toHaveBeenCalledWith(
                expect.objectContaining({ status: OnboardingStatus.PENDING }),
            );
        });
    });

    // ── 2. advanceOnboardingStatus ────────────
    describe('advanceOnboardingStatus', () => {
        it('PENDING → IN_PROGRESS', async () => {
            const inProgress = freshOnboarding({ status: OnboardingStatus.IN_PROGRESS });
            repo.findOne.mockResolvedValueOnce(freshOnboarding()).mockResolvedValueOnce(inProgress);
            repo.update.mockResolvedValue(undefined);

            const result = await resolver.advanceOnboardingStatus(UUID(1));

            expect(repo.update).toHaveBeenCalledWith(UUID(1), {
                status: OnboardingStatus.IN_PROGRESS,
            });
            expect(result.status).toBe(OnboardingStatus.IN_PROGRESS);
            expect(result.completedAt).toBeNull();
        });

        it('IN_PROGRESS → COMPLETED and stamps completedAt', async () => {
            const completed = freshOnboarding({
                status: OnboardingStatus.COMPLETED,
                completedAt: NOW,
            });
            repo.findOne
                .mockResolvedValueOnce(freshOnboarding({ status: OnboardingStatus.IN_PROGRESS }))
                .mockResolvedValueOnce(completed);
            repo.update.mockResolvedValue(undefined);

            const result = await resolver.advanceOnboardingStatus(UUID(1));

            expect(repo.update).toHaveBeenCalledWith(UUID(1), {
                status: OnboardingStatus.COMPLETED,
                completedAt: expect.any(Date),
            });
            expect(result.status).toBe(OnboardingStatus.COMPLETED);
            expect(result.completedAt).toEqual(NOW);
        });

        it('is idempotent when already COMPLETED — returns existing row unchanged', async () => {
            const alreadyDone = freshOnboarding({
                status: OnboardingStatus.COMPLETED,
                completedAt: NOW,
            });
            repo.findOne.mockResolvedValue(alreadyDone);

            const result = await resolver.advanceOnboardingStatus(UUID(1));

            expect(repo.update).not.toHaveBeenCalled();
            expect(result.status).toBe(OnboardingStatus.COMPLETED);
            expect(result.completedAt).toEqual(NOW);
        });

        it('throws NotFoundException for an unknown id', async () => {
            repo.findOne.mockResolvedValue(null);
            await expect(resolver.advanceOnboardingStatus(UUID(99)))
                .rejects.toThrow(NotFoundException);
            expect(repo.update).not.toHaveBeenCalled();
        });
    });

    // ── 3. completeOnboarding (shortcut) ──────
    describe('completeOnboarding', () => {
        it('jumps straight to COMPLETED and stamps completedAt even from PENDING', async () => {
            const completed = freshOnboarding({
                status: OnboardingStatus.COMPLETED,
                completedAt: NOW,
            });
            repo.findOne
                .mockResolvedValueOnce(freshOnboarding())
                .mockResolvedValueOnce(completed);
            repo.update.mockResolvedValue(undefined);

            const result = await resolver.completeOnboarding(UUID(1));

            expect(repo.update).toHaveBeenCalledWith(UUID(1), {
                status: OnboardingStatus.COMPLETED,
                completedAt: expect.any(Date),
            });
            expect(result.status).toBe(OnboardingStatus.COMPLETED);
            expect(result.completedAt).toEqual(NOW);
        });
    });

    // ── 4. updateOnboarding ───────────────────
    describe('updateOnboarding', () => {
        it('updates arbitrary fields (e.g. companyName) and reloads relations', async () => {
            const updated = freshOnboarding({ companyName: 'NewName' });
            repo.findOne
                .mockResolvedValueOnce(freshOnboarding())
                .mockResolvedValueOnce(updated);
            repo.update.mockResolvedValue(undefined);

            const result = await resolver.updateOnboarding(UUID(1), {
                companyName: 'NewName',
            } as any);

            expect(repo.update).toHaveBeenCalledWith(UUID(1), {
                companyName: 'NewName',
            });
            expect(result.companyName).toBe('NewName');
            expect(cacheInvalidate).toHaveBeenCalledWith('onboardings:*');
            expect(cacheDel).toHaveBeenCalledWith(`onboarding:${UUID(1)}`);
        });
    });

    // ── 5. deleteOnboarding ───────────────────
    describe('deleteOnboarding', () => {
        it('deletes and invalidates cache', async () => {
            repo.delete.mockResolvedValue({ affected: 1 } as any);

            const result = await resolver.deleteOnboarding(UUID(1));

            expect(repo.delete).toHaveBeenCalledWith(UUID(1));
            expect(result).toBe(true);
            expect(cacheInvalidate).toHaveBeenCalledWith('onboardings:*');
            expect(cacheDel).toHaveBeenCalledWith(`onboarding:${UUID(1)}`);
        });
    });

    // ── 6. Queries ────────────────────────────
    describe('queries', () => {
        it('onboardings() filters by status and centerId', async () => {
            repo.find.mockResolvedValue([freshOnboarding(), freshOnboarding()]);

            const result = await resolver.onboardings({
                status: OnboardingStatus.PENDING,
                centerId: UUID(5),
                limit: 10,
                offset: 0,
            } as any);

            expect(repo.find).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        status: OnboardingStatus.PENDING,
                        centerId: UUID(5),
                    },
                    relations: expect.arrayContaining(['lead', 'customer', 'assignedTo', 'center']),
                    order: { createdAt: 'DESC' },
                    take: 10,
                    skip: 0,
                }),
            );
            expect(result).toHaveLength(2);
        });

        it('onboarding(id) loads a single row', async () => {
            repo.findOne.mockResolvedValue(freshOnboarding({ id: UUID(7) }));
            const result = await resolver.onboarding(UUID(7));
            expect(result?.id).toBe(UUID(7));
        });

        it('onboardingCount returns a number', async () => {
            repo.count.mockResolvedValue(42);
            const result = await resolver.onboardingCount(OnboardingStatus.PENDING);
            expect(result).toBe(42);
        });
    });
});
