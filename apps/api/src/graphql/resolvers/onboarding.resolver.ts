/**
 * File:        apps/api/src/graphql/resolvers/onboarding.resolver.ts
 * Module:      API · GraphQL Resolvers
 * Purpose:     Onboarding management — CRUD + status transitions.
 *              Bridges leads → customers with all paperwork fields
 *              collected in one place.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-22
 */
import { Resolver, Query, Args, Mutation, ID, Int } from '@nestjs/graphql';
import { NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { OnboardingStatus } from '../types/user.type';
import { Onboarding } from '../../typeorm/entities/onboarding.entity';
import {
    CreateOnboardingInput,
    UpdateOnboardingInput,
    OnboardingFiltersInput,
} from '../inputs/onboarding.input';
import { CacheService } from '../../cache/cache.service';

@Resolver(() => Onboarding)
export class OnboardingResolver {
    constructor(
        private cache: CacheService,
        @InjectRepository(Onboarding)
        private onboardingRepo: Repository<Onboarding>,
    ) {}

    @Query(() => [Onboarding])
    async onboardings(
        @Args('filters', { nullable: true }) filters?: OnboardingFiltersInput,
    ): Promise<Onboarding[]> {
        const where: any = {};
        if (filters) {
            if (filters.status) where.status = filters.status;
            if (filters.centerId) where.centerId = filters.centerId;
            if (filters.assignedToId) where.assignedToId = filters.assignedToId;
            if (filters.search) {
                where.companyName = Like(`%${filters.search}%`);
            }
        }
        return this.onboardingRepo.find({
            where,
            relations: ['lead', 'customer', 'assignedTo', 'center'],
            order: { createdAt: 'DESC' },
            take: filters?.limit ?? 50,
            skip: filters?.offset ?? 0,
        });
    }

    @Query(() => Onboarding, { nullable: true })
    async onboarding(
        @Args('id', { type: () => ID }) id: string,
    ): Promise<Onboarding | null> {
        return this.onboardingRepo.findOne({
            where: { id },
            relations: ['lead', 'customer', 'assignedTo', 'center'],
        });
    }

    @Query(() => Int, {
        description: 'Count of onboardings, optionally filtered by status',
    })
    async onboardingCount(
        @Args('status', { nullable: true, type: () => OnboardingStatus })
        status?: OnboardingStatus,
    ): Promise<number> {
        return this.onboardingRepo.count({ where: status ? { status } : {} });
    }

    @Mutation(() => Onboarding)
    async createOnboarding(
        @Args('input') input: CreateOnboardingInput,
    ): Promise<Onboarding> {
        const onboarding = this.onboardingRepo.create({
            ...input,
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
    ): Promise<Onboarding> {
        const existing = await this.onboardingRepo.findOne({ where: { id } });
        if (!existing) throw new NotFoundException('Onboarding not found');

        await this.onboardingRepo.update(id, input);
        const updated = await this.onboardingRepo.findOne({
            where: { id },
            relations: ['lead', 'customer', 'assignedTo', 'center'],
        });
        if (!updated) throw new NotFoundException('Onboarding not found');

        await this.cache.invalidatePattern('onboardings:*');
        await this.cache.del(`onboarding:${id}`);
        return updated;
    }

    @Mutation(() => Onboarding)
    async completeOnboarding(
        @Args('id', { type: () => ID }) id: string,
    ): Promise<Onboarding> {
        const existing = await this.onboardingRepo.findOne({ where: { id } });
        if (!existing) throw new NotFoundException('Onboarding not found');

        await this.onboardingRepo.update(id, {
            status: OnboardingStatus.COMPLETED,
            completedAt: new Date(),
        });
        const updated = await this.onboardingRepo.findOne({
            where: { id },
            relations: ['lead', 'customer', 'assignedTo', 'center'],
        });
        if (!updated) throw new NotFoundException('Onboarding not found');

        await this.cache.invalidatePattern('onboardings:*');
        await this.cache.del(`onboarding:${id}`);
        return updated;
    }

    @Mutation(() => Onboarding)
    async advanceOnboardingStatus(
        @Args('id', { type: () => ID }) id: string,
    ): Promise<Onboarding> {
        const existing = await this.onboardingRepo.findOne({ where: { id } });
        if (!existing) throw new NotFoundException('Onboarding not found');

        const flow: Record<OnboardingStatus, OnboardingStatus | null> = {
            [OnboardingStatus.PENDING]: OnboardingStatus.IN_PROGRESS,
            [OnboardingStatus.IN_PROGRESS]: OnboardingStatus.COMPLETED,
            [OnboardingStatus.COMPLETED]: null,
        };

        const next = flow[existing.status];
        if (!next) return existing; // already done — idempotent

        await this.onboardingRepo.update(id, {
            status: next,
            ...(next === OnboardingStatus.COMPLETED ? { completedAt: new Date() } : {}),
        });
        const updated = await this.onboardingRepo.findOne({
            where: { id },
            relations: ['lead', 'customer', 'assignedTo', 'center'],
        });
        if (!updated) throw new NotFoundException('Onboarding not found');

        await this.cache.invalidatePattern('onboardings:*');
        await this.cache.del(`onboarding:${id}`);
        return updated;
    }

    @Mutation(() => Boolean)
    async deleteOnboarding(
        @Args('id', { type: () => ID }) id: string,
    ): Promise<boolean> {
        await this.onboardingRepo.delete(id);
        await this.cache.invalidatePattern('onboardings:*');
        await this.cache.del(`onboarding:${id}`);
        return true;
    }
}
