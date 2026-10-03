/**
 * File:        apps/api/src/graphql/resolvers/onboarding.resolver.ts
 * Module:      API · GraphQL Resolvers
 * Purpose:     Onboarding management.
 *
 *              Lifecycle mutations (delegating to OnboardingService):
 *                submitOnboarding          — the whole wizard in one atomic call
 *                confirmOnboardingPayment  — Razorpay Checkout result
 *                collectOnboardingPayment  — retry / switch payment method
 *                confirmChequeCleared      — cheque cleared → client provisioned
 *                markChequeBounced         — cheque bounced → stays a cold lead
 *                cancelOnboarding          — abandon a pending application
 *
 *              The older CRUD surface is kept for compatibility but hardened:
 *              staff only (SUPER_ADMIN, CENTER_MANAGER), center-scoped, a
 *              capped page size, and an onboarding can only be COMPLETED once
 *              its client exists and its payment is settled — previously any
 *              signed-in user could mark any onboarding complete (or delete it).
 *
 * Author:      AmanVatsSharma (original) · Claude Sonnet 5.5 (payment lifecycle)
 * Last-updated: 2026-10-02
 */
import { Resolver, Query, Args, Mutation, ID, Int } from '@nestjs/graphql';
import { BadRequestException, ForbiddenException, NotFoundException, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, IsNull, Repository } from 'typeorm';
import { OnboardingStatus, UserRole } from '@enums';
import { Onboarding } from '../../typeorm/entities/onboarding.entity';
import {
    CreateOnboardingInput,
    UpdateOnboardingInput,
    OnboardingFiltersInput,
} from '../inputs/onboarding.input';
import {
    ConfirmOnboardingPaymentInput,
    OnboardingPaymentInput,
    SubmitOnboardingInput,
} from '../inputs/onboarding-submit.input';
import { SubmitOnboardingResult } from '../types/onboarding-submit.type';
import { OnboardingPaymentStatus } from '../enums/onboarding-payment.enums';
import { CacheService } from '../../cache/cache.service';
import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../../auth/types/jwt-payload.type';
import { centerScope } from '../../auth/helpers/center-scope.helper';
import { OnboardingService } from '../../crm/onboarding.service';
import { escapeLike } from '../../crm/onboarding-application';

const RELATIONS = ['lead', 'customer', 'assignedTo', 'center'];
const MAX_PAGE = 200;

@Resolver(() => Onboarding)
@UseGuards(GqlAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.CENTER_MANAGER)
export class OnboardingResolver {
    constructor(
        private cache: CacheService,
        @InjectRepository(Onboarding)
        private onboardingRepo: Repository<Onboarding>,
        private readonly service: OnboardingService,
    ) {}

    // ── Queries ───────────────────────────────────────────────────────────

    @Query(() => [Onboarding])
    async onboardings(
        @Args('filters', { nullable: true }) filters?: OnboardingFiltersInput,
        @CurrentUser() caller?: JwtPayload,
    ): Promise<Onboarding[]> {
        const base: FindOptionsWhere<Onboarding> = {};
        // A center manager only ever sees their own center, whatever the client sends.
        const centerId = (caller ? centerScope(caller) : undefined) ?? filters?.centerId;
        if (centerId) base.centerId = centerId;
        if (filters?.status) base.status = filters.status;
        if (filters?.paymentStatus) base.paymentStatus = filters.paymentStatus;
        if (filters?.assignedToId) base.assignedToId = filters.assignedToId;
        if (!filters?.includeCancelled) base.cancelledAt = IsNull();

        const term = filters?.search?.trim();
        const where: FindOptionsWhere<Onboarding> | FindOptionsWhere<Onboarding>[] = term
            ? ['companyName', 'contactName', 'contactEmail'].map((field) => ({
                  ...base,
                  [field]: ILike(`%${escapeLike(term)}%`),
              }))
            : base;

        return this.onboardingRepo.find({
            where,
            relations: RELATIONS,
            order: { createdAt: 'DESC' },
            take: Math.min(Math.max(filters?.limit ?? 50, 1), MAX_PAGE),
            skip: Math.max(filters?.offset ?? 0, 0),
        });
    }

    @Query(() => Onboarding, { nullable: true })
    async onboarding(
        @Args('id', { type: () => ID }) id: string,
        @CurrentUser() caller?: JwtPayload,
    ): Promise<Onboarding | null> {
        const row = await this.onboardingRepo.findOne({ where: { id }, relations: RELATIONS });
        if (row && caller) this.assertCenterAccess(caller, row.centerId);
        return row;
    }

    @Query(() => Int, {
        description: 'Count of (non-cancelled) onboardings, optionally filtered by status. Center-scoped.',
    })
    async onboardingCount(
        @Args('status', { nullable: true, type: () => OnboardingStatus })
        status?: OnboardingStatus,
        @CurrentUser() caller?: JwtPayload,
    ): Promise<number> {
        const where: FindOptionsWhere<Onboarding> = { cancelledAt: IsNull() };
        if (status) where.status = status;
        const scope = caller ? centerScope(caller) : undefined;
        if (scope) where.centerId = scope;
        return this.onboardingRepo.count({ where });
    }

    // ── Payment lifecycle ─────────────────────────────────────────────────

    @Mutation(() => SubmitOnboardingResult, {
        description:
            'Onboard a client in ONE atomic, idempotent call. Razorpay: saves the application and returns an order — the client is created only after the payment is verified. Bank transfer: needs the UTR; the client is created now with a paid invoice. Cheque: the lead is saved as COLD and the client is NOT created until the cheque clears (confirmChequeCleared). Safe to retry with the same idempotencyKey.',
    })
    submitOnboarding(
        @Args('input') input: SubmitOnboardingInput,
        @CurrentUser() caller: JwtPayload,
    ): Promise<SubmitOnboardingResult> {
        return this.service.submit(input, caller);
    }

    @Mutation(() => SubmitOnboardingResult, {
        description: 'Finish an online onboarding payment: verifies the Razorpay signature, settles the order, and provisions the client.',
    })
    confirmOnboardingPayment(
        @Args('input') input: ConfirmOnboardingPaymentInput,
        @CurrentUser() caller: JwtPayload,
    ): Promise<SubmitOnboardingResult> {
        return this.service.confirmOnlinePayment(
            {
                onboardingId: input.onboardingId,
                razorpayOrderId: input.razorpayOrderId,
                razorpayPaymentId: input.razorpayPaymentId,
                razorpaySignature: input.razorpaySignature,
            },
            caller,
        );
    }

    @Mutation(() => SubmitOnboardingResult, {
        description: 'Take payment again on a pending application — after a failed online payment or bounced cheque, or to pay another way.',
    })
    collectOnboardingPayment(
        @Args('onboardingId', { type: () => ID }) onboardingId: string,
        @Args('payment') payment: OnboardingPaymentInput,
        @CurrentUser() caller: JwtPayload,
    ): Promise<SubmitOnboardingResult> {
        return this.service.collectPayment(onboardingId, payment, caller);
    }

    @Mutation(() => SubmitOnboardingResult, {
        description: 'Confirm the bank cleared the cheque. This is what converts the cold lead into a client (login, seats, deposit, paid invoice, contract).',
    })
    confirmChequeCleared(
        @Args('onboardingId', { type: () => ID }) onboardingId: string,
        @Args('clearedOn', { type: () => String, nullable: true }) clearedOn: string | undefined,
        @Args('remarks', { type: () => String, nullable: true }) remarks: string | undefined,
        @CurrentUser() caller: JwtPayload,
    ): Promise<SubmitOnboardingResult> {
        return this.service.confirmChequeCleared(onboardingId, { clearedOn, remarks }, caller);
    }

    @Mutation(() => Onboarding, {
        description: 'Mark a cheque as bounced. Nothing is provisioned; the lead stays COLD and another payment can be collected.',
    })
    markChequeBounced(
        @Args('onboardingId', { type: () => ID }) onboardingId: string,
        @Args('reason') reason: string,
        @CurrentUser() caller: JwtPayload,
    ): Promise<Onboarding> {
        return this.service.markChequeBounced(onboardingId, reason, caller);
    }

    @Mutation(() => Onboarding, {
        description: 'Abandon a pending application. A client that is already onboarded cannot be cancelled here.',
    })
    cancelOnboarding(
        @Args('onboardingId', { type: () => ID }) onboardingId: string,
        @Args('reason', { type: () => String, nullable: true }) reason: string | undefined,
        @CurrentUser() caller: JwtPayload,
    ): Promise<Onboarding> {
        return this.service.cancel(onboardingId, reason, caller);
    }

    // ── Legacy CRUD (hardened) ────────────────────────────────────────────

    @Mutation(() => Onboarding, {
        description: 'Create a bare onboarding record (legacy). Prefer submitOnboarding.',
    })
    async createOnboarding(
        @Args('input') input: CreateOnboardingInput,
        @CurrentUser() caller?: JwtPayload,
    ): Promise<Onboarding> {
        const scope = caller ? centerScope(caller) : undefined;
        if (scope && input.centerId && input.centerId !== scope) {
            throw new ForbiddenException('You can only create onboardings in your own center.');
        }
        if (input.status === OnboardingStatus.COMPLETED) {
            throw new BadRequestException('An onboarding cannot be created as completed.');
        }
        const onboarding = this.onboardingRepo.create({
            ...input,
            centerId: scope ?? input.centerId,
            status: input.status ?? OnboardingStatus.PENDING,
        });
        const saved = await this.onboardingRepo.save(onboarding);
        await this.cache.invalidatePattern('onboardings:*');
        return saved;
    }

    @Mutation(() => Onboarding)
    async updateOnboarding(
        @Args('id', { type: () => ID }) id: string,
        @Args('input') input: UpdateOnboardingInput,
        @CurrentUser() caller?: JwtPayload,
    ): Promise<Onboarding> {
        const existing = await this.onboardingRepo.findOne({ where: { id } });
        if (!existing) throw new NotFoundException('Onboarding not found');
        if (caller) this.assertCenterAccess(caller, existing.centerId);

        // centerId is never editable here (it would move the record between
        // centers), and COMPLETED has to be earned through payment.
        const { centerId: _ignored, ...patch } = input;
        void _ignored;
        if (patch.status === OnboardingStatus.COMPLETED) this.assertCompletable(existing);

        if (Object.keys(patch).length > 0) await this.onboardingRepo.update(id, patch);
        return this.reload(id);
    }

    @Mutation(() => Onboarding)
    async completeOnboarding(
        @Args('id', { type: () => ID }) id: string,
        @CurrentUser() caller?: JwtPayload,
    ): Promise<Onboarding> {
        const existing = await this.onboardingRepo.findOne({ where: { id } });
        if (!existing) throw new NotFoundException('Onboarding not found');
        if (caller) this.assertCenterAccess(caller, existing.centerId);
        if (existing.status === OnboardingStatus.COMPLETED) return this.reload(id);
        this.assertCompletable(existing);

        await this.onboardingRepo.update(id, {
            status: OnboardingStatus.COMPLETED,
            completedAt: new Date(),
        });
        return this.reload(id);
    }

    @Mutation(() => Onboarding)
    async advanceOnboardingStatus(
        @Args('id', { type: () => ID }) id: string,
        @CurrentUser() caller?: JwtPayload,
    ): Promise<Onboarding> {
        const existing = await this.onboardingRepo.findOne({ where: { id } });
        if (!existing) throw new NotFoundException('Onboarding not found');
        if (caller) this.assertCenterAccess(caller, existing.centerId);

        const flow: Record<OnboardingStatus, OnboardingStatus | null> = {
            [OnboardingStatus.PENDING]: OnboardingStatus.IN_PROGRESS,
            [OnboardingStatus.IN_PROGRESS]: OnboardingStatus.COMPLETED,
            [OnboardingStatus.COMPLETED]: null,
        };
        const next = flow[existing.status];
        if (!next) return existing; // already done — idempotent
        if (next === OnboardingStatus.COMPLETED) this.assertCompletable(existing);

        await this.onboardingRepo.update(id, {
            status: next,
            ...(next === OnboardingStatus.COMPLETED ? { completedAt: new Date() } : {}),
        });
        return this.reload(id);
    }

    @Mutation(() => Boolean, {
        description: 'Delete an onboarding that never produced a client or took payment. Otherwise cancel it (the audit trail is kept).',
    })
    async deleteOnboarding(
        @Args('id', { type: () => ID }) id: string,
        @CurrentUser() caller?: JwtPayload,
    ): Promise<boolean> {
        const existing = await this.onboardingRepo.findOne({ where: { id } });
        if (!existing) throw new NotFoundException('Onboarding not found');
        if (caller) this.assertCenterAccess(caller, existing.centerId);
        if (existing.customerId || existing.paymentStatus === OnboardingPaymentStatus.PAID) {
            throw new BadRequestException('This onboarding produced a client or took payment and cannot be deleted.');
        }
        if (existing.paymentStatus === OnboardingPaymentStatus.AWAITING_CLEARANCE) {
            throw new BadRequestException('A cheque is awaiting clearance — cancel the onboarding instead of deleting it.');
        }
        await this.onboardingRepo.delete(id);
        await this.cache.invalidatePattern('onboardings:*');
        await this.cache.del(`onboarding:${id}`);
        return true;
    }

    // ── helpers ───────────────────────────────────────────────────────────

    private async reload(id: string): Promise<Onboarding> {
        const updated = await this.onboardingRepo.findOne({ where: { id }, relations: RELATIONS });
        if (!updated) throw new NotFoundException('Onboarding not found');
        await this.cache.invalidatePattern('onboardings:*');
        await this.cache.del(`onboarding:${id}`);
        return updated;
    }

    /** COMPLETED means the client exists and the money (if any) is in. */
    private assertCompletable(row: Onboarding): void {
        const settled =
            row.paymentStatus === OnboardingPaymentStatus.PAID ||
            row.paymentStatus === OnboardingPaymentStatus.NOT_REQUIRED;
        if (!row.customerId || !settled) {
            throw new BadRequestException(
                'This onboarding cannot be completed yet — the client has not been created or the payment is not confirmed.',
            );
        }
    }

    private assertCenterAccess(caller: JwtPayload, recordCenterId?: string | null): void {
        const scope = centerScope(caller);
        if (scope && recordCenterId && recordCenterId !== scope) {
            throw new ForbiddenException('This onboarding belongs to a different center.');
        }
    }
}
