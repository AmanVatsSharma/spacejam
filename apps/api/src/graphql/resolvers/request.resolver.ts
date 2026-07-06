/**
 * File:        apps/api/src/graphql/resolvers/request.resolver.ts
 * Module:      API · GraphQL Resolvers
 * Purpose:     Request management resolvers
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-02
 */

import { Resolver, Query, Args, Mutation, Context, ID, Int } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request } from '../../typeorm/entities/request.entity';
import { RequestStatus, RequestType } from '../types/user.type';
import { CreateRequestInput, UpdateRequestInput, RequestFiltersInput, RequestStatistics, CreateRequestPayload } from '../inputs/request.input';
import { CacheService } from '../../cache/cache.service';

@Resolver(() => Request)
export class RequestResolver {
  constructor(
    private cache: CacheService,
    @InjectRepository(Request)
    private requestRepo: Repository<Request>,
  ) {}

  @Query(() => [Request])
  async requests(
    @Args('filters', { nullable: true }) filters?: RequestFiltersInput,
  ): Promise<Request[]> {
    const where: any = {};

    if (filters) {
      if (filters.status) where.status = filters.status;
      if (filters.type) where.type = filters.type;
      if (filters.centerId) where.centerId = filters.centerId;
      if (filters.assignedToId) where.assignedToId = filters.assignedToId;
      if (filters.requestedById) where.requestedById = filters.requestedById;
      if (filters.urgency) where.urgency = filters.urgency;
      if (filters.search) {
        where.title = (await import('typeorm')).Like(`%${filters.search}%`);
      }
      if (filters.pendingOnly) where.status = RequestStatus.PENDING;
    }

    const relations = ['center', 'requestedBy', 'assignedTo'];

    return this.requestRepo.find({
      where,
      relations,
      order: { createdAt: 'DESC' },
      take: filters?.limit ?? 50,
      skip: filters?.offset ?? 0,
    });
  }

  @Query(() => Request, { nullable: true })
  async request(@Args('id', { type: () => ID }) id: string): Promise<Request | null> {
    return this.requestRepo.findOne({
      where: { id },
      relations: ['center', 'requestedBy', 'assignedTo'],
    });
  }

  @Query(() => RequestStatistics)
  async requestStats(
    @Args('centerId', { nullable: true }) centerId?: string,
  ): Promise<any> {
    const where = centerId ? { centerId } : {};

    const total = await this.requestRepo.count({ where });
    const pending = await this.requestRepo.count({
      where: { ...where, status: RequestStatus.PENDING },
    });
    const inProgress = await this.requestRepo.count({
      where: { ...where, status: RequestStatus.IN_PROGRESS },
    });
    const completed = await this.requestRepo.count({
      where: { ...where, status: RequestStatus.COMPLETED },
    });
    const cancelled = await this.requestRepo.count({
      where: { ...where, status: RequestStatus.CANCELLED },
    });
    const highUrgency = await this.requestRepo.count({
      where: { ...where, urgency: 'HIGH', status: RequestStatus.PENDING },
    });

    return {
      totalRequests: total,
      pendingRequests: pending,
      inProgressRequests: inProgress,
      completedRequests: completed,
      cancelledRequests: cancelled,
      highUrgencyRequests: highUrgency,
    };
  }

  @Query(() => [Request])
  async myRequests(
    @Args('requestedBy') requestedBy: string,
    @Args('status', { type: () => RequestStatus, nullable: true }) status?: RequestStatus,
  ): Promise<Request[]> {
    const where: any = { requestedById: requestedBy };
    if (status) where.status = status;

    return this.requestRepo.find({
      where,
      relations: ['center', 'requestedBy', 'assignedTo'],
      order: { createdAt: 'DESC' },
    });
  }

  @Query(() => [Request])
  async pendingRequests(
    @Args('centerId', { nullable: true }) centerId?: string,
    @Args('urgency', { nullable: true }) urgency?: string,
  ): Promise<Request[]> {
    const where: any = { status: RequestStatus.PENDING };
    if (centerId) where.centerId = centerId;
    if (urgency) where.urgency = urgency;

    return this.requestRepo.find({
      where,
      relations: ['center', 'requestedBy'],
      order: { urgency: 'DESC', createdAt: 'ASC' },
    });
  }

  @Query(() => [Request])
  async requestsByType(
    @Args('type', { type: () => RequestType }) type: RequestType,
    @Args('centerId', { nullable: true }) centerId?: string,
  ): Promise<Request[]> {
    const where: any = { type };
    if (centerId) where.centerId = centerId;

    return this.requestRepo.find({
      where,
      relations: ['center', 'requestedBy', 'assignedTo'],
      order: { createdAt: 'DESC' },
    });
  }

  @Query(() => [Request])
  async highPriorityRequests(
    @Args('centerId', { nullable: true }) centerId?: string,
  ): Promise<Request[]> {
    const where: any = {
      status: RequestStatus.PENDING,
      urgency: 'HIGH',
    };
    if (centerId) where.centerId = centerId;

    return this.requestRepo.find({
      where,
      relations: ['center', 'requestedBy'],
      order: { createdAt: 'ASC' },
    });
  }

  @Query(() => [Request])
  async overdueRequests(
    @Args('centerId', { nullable: true }) centerId?: string,
  ): Promise<Request[]> {
    const where: any = {
      dueDate: (await import('typeorm')).LessThan(new Date().toISOString().split('T')[0]),
      status: RequestStatus.PENDING,
    };
    if (centerId) where.centerId = centerId;

    return this.requestRepo.find({
      where,
      relations: ['center', 'requestedBy'],
      order: { dueDate: 'ASC' },
    });
  }

  @Mutation(() => Request)
  async createRequest(
    @Args('input') input: CreateRequestInput,
    @Context() context: any,
  ): Promise<Request> {
    const user = context.req?.user;

    const request = this.requestRepo.create({
      ...input,
      requestedById: user?.id,
      status: RequestStatus.PENDING,
    });

    const saved = await this.requestRepo.save(request);

    const fullRequest = await this.requestRepo.findOne({
      where: { id: saved.id },
      relations: ['center', 'requestedBy', 'assignedTo'],
    });

    await this.cache.invalidatePattern('requests:*');

    return fullRequest!;
  }

  @Mutation(() => Request)
  async updateRequest(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateRequestInput,
  ): Promise<Request> {
    await this.requestRepo.update(id, input);

    const updated = await this.requestRepo.findOne({
      where: { id },
      relations: ['center', 'requestedBy', 'assignedTo'],
    });

    await this.cache.invalidatePattern('requests:*');
    await this.cache.invalidate(`request:${id}`);

    return updated!;
  }

  @Mutation(() => Request)
  async assignRequest(
    @Args('id', { type: () => ID }) id: string,
    @Args('assignedToId') assignedToId: string,
  ): Promise<Request> {
    await this.requestRepo.update(id, {
      assignedToId,
      status: RequestStatus.IN_PROGRESS,
    });

    const updated = await this.requestRepo.findOne({
      where: { id },
      relations: ['center', 'requestedBy', 'assignedTo'],
    });

    await this.cache.invalidatePattern('requests:*');
    await this.cache.invalidate(`request:${id}`);

    return updated!;
  }

  @Mutation(() => Request)
  async approveRequest(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<Request> {
    await this.requestRepo.update(id, {
      status: RequestStatus.IN_PROGRESS,
    });

    const updated = await this.requestRepo.findOne({
      where: { id },
      relations: ['center', 'requestedBy', 'assignedTo'],
    });

    await this.cache.invalidatePattern('requests:*');
    await this.cache.invalidate(`request:${id}`);

    return updated!;
  }

  @Mutation(() => Request)
  async rejectRequest(
    @Args('id', { type: () => ID }) id: string,
    @Args('resolution') resolution: string,
  ): Promise<Request> {
    await this.requestRepo.update(id, {
      status: RequestStatus.REJECTED,
      resolution,
    });

    const updated = await this.requestRepo.findOne({
      where: { id },
      relations: ['center', 'requestedBy', 'assignedTo'],
    });

    await this.cache.invalidatePattern('requests:*');
    await this.cache.invalidate(`request:${id}`);

    return updated!;
  }

  @Mutation(() => Request)
  async completeRequest(
    @Args('id', { type: () => ID }) id: string,
    @Args('resolution', { nullable: true }) resolution?: string,
  ): Promise<Request> {
    const completedDate = new Date().toISOString().split('T')[0];

    await this.requestRepo.update(id, {
      status: RequestStatus.COMPLETED,
      completedDate,
      ...(resolution && { resolution }),
    });

    const updated = await this.requestRepo.findOne({
      where: { id },
      relations: ['center', 'requestedBy', 'assignedTo'],
    });

    await this.cache.invalidatePattern('requests:*');
    await this.cache.invalidate(`request:${id}`);

    return updated!;
  }

  @Mutation(() => Boolean)
  async cancelRequest(@Args('id', { type: () => ID }) id: string): Promise<boolean> {
    await this.requestRepo.update(id, {
      status: RequestStatus.CANCELLED,
    });

    await this.cache.invalidatePattern('requests:*');
    await this.cache.invalidate(`request:${id}`);

    return true;
  }

  @Mutation(() => Boolean)
  async deleteRequest(@Args('id', { type: () => ID }) id: string): Promise<boolean> {
    await this.requestRepo.delete(id);

    await this.cache.invalidatePattern('requests:*');
    await this.cache.invalidate(`request:${id}`);

    return true;
  }

  @Query(() => [Request])
  async requestsByCenter(
    @Args('centerId') centerId: string,
    @Args('limit', { nullable: true, type: () => Int }) limit?: number,
  ): Promise<Request[]> {
    return this.requestRepo.find({
      where: { centerId },
      relations: ['center', 'requestedBy', 'assignedTo'],
      order: { createdAt: 'DESC' },
      take: limit ?? 20,
    });
  }

  @Mutation(() => Request)
  async escalateRequest(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<Request> {
    await this.requestRepo.update(id, { urgency: 'HIGH' });

    const updated = await this.requestRepo.findOne({
      where: { id },
      relations: ['center', 'requestedBy', 'assignedTo'],
    });

    await this.cache.invalidatePattern('requests:*');
    await this.cache.invalidate(`request:${id}`);

    return updated!;
  }
}