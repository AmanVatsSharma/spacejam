/**
 * File:        apps/api/src/graphql/resolvers/visit.resolver.ts
 * Module:      API · GraphQL Resolvers
 * Purpose:     Visit queries/mutations — scheduled center tours / site visits.
 *              Center-scoped: a CENTER_MANAGER sees only their own center's
 *              visits. SUPER_ADMIN can see/manage all. Modeled on the event
 *              resolver + the auth-foundation conventions (@Roles +
 *              centerScope + @CurrentUser).
 *
 * Author:      ZCode
 * Last-updated: 2026-08-13
 */
import { UseGuards, NotFoundException } from '@nestjs/common';
import { Args, ID, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual, FindOptionsWhere } from 'typeorm';

import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { UserRole } from '../types/user.type';
import type { JwtPayload } from '../../auth/types/jwt-payload.type';
import { centerScope } from '../../auth/helpers/center-scope.helper';

import { Visit } from '../../typeorm/entities/visit.entity';
import { TourType, VisitStatus } from '../enums/visit.enums';
import {
  CreateVisitInput,
  UpdateVisitInput,
  VisitFiltersInput,
} from '../inputs/visit.input';

@Resolver(() => Visit)
@UseGuards(GqlAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.CENTER_OWNER, UserRole.CENTER_MANAGER)
export class VisitResolver {
  constructor(
    @InjectRepository(Visit)
    private readonly visitRepo: Repository<Visit>,
  ) {}

  @Query(() => [Visit], { description: 'List visits, center-scoped for CENTER_MANAGER' })
  async visits(
    @CurrentUser() caller: JwtPayload,
    @Args('filters', { nullable: true }) filters?: VisitFiltersInput,
  ): Promise<Visit[]> {
    const where: FindOptionsWhere<Visit> = {};

    // CENTER_MANAGER is locked to their center; SUPER_ADMIN can filter by any.
    const scope = centerScope(caller);
    where.centerId = scope ?? filters?.centerId;

    if (filters?.leadId) where.leadId = filters.leadId;
    if (filters?.status) where.status = filters.status;
    if (filters?.tourType) where.tourType = filters.tourType;

    if (filters?.startDate && filters?.endDate) {
      where.visitDate = Between(new Date(filters.startDate), new Date(filters.endDate));
    } else if (filters?.startDate) {
      where.visitDate = MoreThanOrEqual(new Date(filters.startDate));
    } else if (filters?.endDate) {
      where.visitDate = LessThanOrEqual(new Date(filters.endDate));
    }

    return this.visitRepo.find({
      where,
      relations: ['center', 'requestedBy', 'assignedTo', 'lead'],
      order: { visitDate: 'ASC', startTime: 'ASC' },
      take: Math.min(filters?.limit ?? 100, 500),
      skip: filters?.offset ?? 0,
    });
  }

  @Query(() => Visit, { nullable: true, description: 'Fetch a single visit by id' })
  async visit(@Args('id', { type: () => ID }) id: string): Promise<Visit | null> {
    return this.visitRepo.findOne({
      where: { id },
      relations: ['center', 'requestedBy', 'assignedTo', 'lead'],
    });
  }

  @Mutation(() => Visit, { description: 'Schedule a new visit' })
  async createVisit(
    @Args('input') input: CreateVisitInput,
    @CurrentUser() caller: JwtPayload,
  ): Promise<Visit> {
    // CENTER_MANAGER: lock to their center regardless of input.
    // SUPER_ADMIN: use the provided centerId, or fall back to first center.
    const scope = centerScope(caller);
    const centerId = scope ?? input.centerId;

    const visit = this.visitRepo.create({
      centerId: centerId ?? null,
      leadId: input.leadId ?? null,
      requestedById: caller.sub ?? null,
      assignedToId: input.assignedToId ?? null,
      visitorName: input.visitorName,
      visitorPhone: input.visitorPhone,
      visitorEmail: input.visitorEmail ?? null,
      company: input.company ?? null,
      visitDate: new Date(input.visitDate),
      startTime: input.startTime,
      endTime: input.endTime,
      tourType: input.tourType ?? TourType.SCHEDULED_TOUR,
      interestedPlan: input.interestedPlan ?? null,
      partySize: input.partySize ?? 1,
      status: VisitStatus.SCHEDULED,
      notes: input.notes ?? null,
    });

    const saved = await this.visitRepo.save(visit);
    return this.visitRepo.findOne({
      where: { id: saved.id },
      relations: ['center', 'requestedBy', 'assignedTo', 'lead'],
    }) as Promise<Visit>;
  }

  @Mutation(() => Visit, { description: 'Update visit details' })
  async updateVisit(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateVisitInput,
  ): Promise<Visit> {
    const patch: Partial<Visit> = { ...input };
    if (input.visitDate) patch.visitDate = new Date(input.visitDate) as any;
    await this.visitRepo.update(id, patch as any);
    const updated = await this.visitRepo.findOne({
      where: { id },
      relations: ['center', 'requestedBy', 'assignedTo', 'lead'],
    });
    if (!updated) throw new NotFoundException('Visit not found');
    return updated;
  }

  @Mutation(() => Visit, { description: 'Change a visit status (confirm/complete/no-show)' })
  async updateVisitStatus(
    @Args('id', { type: () => ID }) id: string,
    @Args('status', { type: () => VisitStatus }) status: VisitStatus,
  ): Promise<Visit> {
    await this.visitRepo.update(id, { status });
    const updated = await this.visitRepo.findOne({
      where: { id },
      relations: ['center', 'requestedBy', 'assignedTo', 'lead'],
    });
    if (!updated) throw new NotFoundException('Visit not found');
    return updated;
  }

  @Mutation(() => Visit, { description: 'Cancel a scheduled visit' })
  async cancelVisit(@Args('id', { type: () => ID }) id: string): Promise<Visit> {
    await this.visitRepo.update(id, { status: VisitStatus.CANCELLED });
    const updated = await this.visitRepo.findOne({
      where: { id },
      relations: ['center', 'requestedBy', 'assignedTo', 'lead'],
    });
    if (!updated) throw new NotFoundException('Visit not found');
    return updated;
  }

  @Mutation(() => Boolean, { description: 'Delete a visit (hard delete)' })
  async deleteVisit(@Args('id', { type: () => ID }) id: string): Promise<boolean> {
    const result = await this.visitRepo.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
