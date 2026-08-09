/**
 * File:        apps/api/src/graphql/resolvers/scheduled-report.resolver.ts
 * Module:      API · GraphQL Resolvers
 * Purpose:     Scheduled report CRUD — daily/weekly/monthly report
 *              generation with email delivery.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-20
 */
import { Resolver, Query, Args, Mutation, ID } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScheduledReport } from '../../typeorm/entities/scheduled-report.entity';
import { CreateScheduledReportInput, UpdateScheduledReportInput } from '../inputs/scheduled-report.input';
import { ScheduledReportsService } from '../../enterprise/scheduled-reports.service';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../../auth/types/jwt-payload.type';
import { centerScope } from '../../auth/helpers/center-scope.helper';

@Resolver(() => ScheduledReport)
export class ScheduledReportResolver {
  constructor(
    private service: ScheduledReportsService,
    @InjectRepository(ScheduledReport)
    private repo: Repository<ScheduledReport>,
  ) {}

  @Query(() => [ScheduledReport])
  async scheduledReports(
    @Args('userId', { type: () => ID, nullable: true }) userId?: string,
    @CurrentUser() caller?: JwtPayload,
  ): Promise<ScheduledReport[]> {
    const where: any = userId ? { userId } : {};
    // Center managers see only their center's scheduled reports.
    const scope = caller ? centerScope(caller) : undefined;
    if (scope) where.centerId = scope;
    return this.repo.find({ where, relations: ['user', 'center'], order: { createdAt: 'DESC' } });
  }

  @Query(() => ScheduledReport)
  async scheduledReport(@Args('id', { type: () => ID }) id: string): Promise<ScheduledReport> {
    const r = await this.repo.findOne({ where: { id }, relations: ['user', 'center'] });
    if (!r) throw new Error('Scheduled report not found');
    return r;
  }

  @Mutation(() => ScheduledReport)
  async createScheduledReport(@Args('input') input: CreateScheduledReportInput): Promise<ScheduledReport> {
    const report = this.repo.create(input as any);
    const saved = await this.repo.save(report);
    return saved as unknown as ScheduledReport;
  }

  @Mutation(() => ScheduledReport)
  async updateScheduledReport(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateScheduledReportInput,
  ): Promise<ScheduledReport> {
    await this.repo.update(id, input as any);
    const r = await this.repo.findOne({ where: { id }, relations: ['user', 'center'] });
    if (!r) throw new Error('Scheduled report not found');
    return r;
  }

  @Mutation(() => Boolean)
  async deleteScheduledReport(@Args('id', { type: () => ID }) id: string): Promise<boolean> {
    const result = await this.repo.delete(id);
    return (result.affected ?? 0) > 0;
  }

  @Mutation(() => Boolean)
  async runScheduledReportNow(@Args('id', { type: () => ID }) id: string): Promise<boolean> {
    return this.service.runReport(id);
  }
}