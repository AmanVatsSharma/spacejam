/**
 * File:        apps/api/src/graphql/resolvers/audit-log.resolver.ts
 * Module:      API · GraphQL Resolvers
 * Purpose:     Audit log query/mutation resolvers — search, filter,
 *              aggregation, and a write helper used by other resolvers.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-20
 */
import { Resolver, Query, Args, ID, Int, Mutation } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like, FindOptionsWhere } from 'typeorm';
import { AuditLog } from '../../typeorm/entities/audit-log.entity';
import { ObjectType, Field, InputType } from '@nestjs/graphql';

@InputType()
export class AuditLogFiltersInput {
  @Field(() => ID, { nullable: true }) userId?: string;
  @Field({ nullable: true }) action?: string;
  @Field({ nullable: true }) entityType?: string;
  @Field({ nullable: true }) startDate?: string;
  @Field({ nullable: true }) endDate?: string;
  @Field({ nullable: true }) search?: string;
  @Field(() => Int, { nullable: true }) limit?: number;
  @Field(() => Int, { nullable: true }) offset?: number;
}

@ObjectType()
export class AuditLogStatistics {
  @Field(() => Int) total!: number;
  @Field(() => Int) todayCount!: number;
  @Field(() => Int) uniqueActors!: number;
}

@Resolver(() => AuditLog)
export class AuditLogResolver {
  constructor(
    @InjectRepository(AuditLog)
    private repo: Repository<AuditLog>,
  ) {}

  @Query(() => [AuditLog])
  async auditLogs(
    @Args('filters', { nullable: true }) filters?: AuditLogFiltersInput,
  ): Promise<AuditLog[]> {
    const where: FindOptionsWhere<AuditLog> = {};
    if (filters?.userId) where.userId = filters.userId;
    if (filters?.action) where.action = filters.action;
    if (filters?.entityType) where.entityType = filters.entityType;
    if (filters?.startDate && filters?.endDate) {
      where.createdAt = Between(new Date(filters.startDate), new Date(filters.endDate));
    } else if (filters?.startDate) {
      where.createdAt = Between(new Date(filters.startDate), new Date());
    }
    if (filters?.search) {
      where.action = Like(`%${filters.search}%`);
    }
    return this.repo.find({
      where,
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: filters?.limit ?? 50,
      skip: filters?.offset ?? 0,
    });
  }

  @Query(() => Int)
  async auditLogCount(
    @Args('filters', { nullable: true }) filters?: AuditLogFiltersInput,
  ): Promise<number> {
    const where: FindOptionsWhere<AuditLog> = {};
    if (filters?.userId) where.userId = filters.userId;
    if (filters?.action) where.action = filters.action;
    if (filters?.entityType) where.entityType = filters.entityType;
    if (filters?.startDate && filters?.endDate) {
      where.createdAt = Between(new Date(filters.startDate), new Date(filters.endDate));
    }
    return this.repo.count({ where });
  }

  @Query(() => AuditLogStatistics)
  async auditLogStatistics(): Promise<AuditLogStatistics> {
    const total = await this.repo.count();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayCount = await this.repo.count({ where: { createdAt: Between(todayStart, new Date()) } });
    const actors = await this.repo
      .createQueryBuilder('a')
      .select('COUNT(DISTINCT a.userId)', 'count')
      .where('a.userId IS NOT NULL')
      .andWhere('a.createdAt >= :start', { start: todayStart })
      .getRawOne();
    return {
      total,
      todayCount,
      uniqueActors: parseInt(actors?.count ?? '0', 10),
    };
  }

  @Mutation(() => Boolean)
  async pruneAuditLogs(
    @Args('olderThanDays', { type: () => Int }) olderThanDays: number,
  ): Promise<boolean> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - olderThanDays);
    const result = await this.repo.delete({ createdAt: Between(new Date(0), cutoff) });
    return (result.affected ?? 0) >= 0;
  }
}
