/**
 * File:        apps/api/src/graphql/resolvers/print-job.resolver.ts
 * Module:      API · GraphQL Resolvers
 * Purpose:     Print job lifecycle (cost computed server-side, not client)
 *
 * Author:      Developer
 * Last-updated: 2026-08-05
 *
 * Pricing: BW = 2/page, Color = 10/page. Cost = pages * copies * rate.
 * (Rate table is centralized here so the mobile client never fabricates it.)
 */
import { UseGuards, NotFoundException } from '@nestjs/common';
import { Args, ID, Int, Query, Mutation, Resolver } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../../auth/types/jwt-payload.type';

import { PrintJob } from '../../typeorm/entities/print-job.entity';
import { CreatePrintJobInput } from '../inputs/print-job.input';

const RATE_BW = 2;
const RATE_COLOR = 10;

@Resolver(() => PrintJob)
@UseGuards(GqlAuthGuard)
export class PrintJobResolver {
  constructor(
    @InjectRepository(PrintJob)
    private readonly jobRepo: Repository<PrintJob>,
  ) {}

  /** Server-authoritative cost preview so clients never fabricate it. */
  computeCost(pages: number, copies: number, color: boolean): number {
    const rate = color ? RATE_COLOR : RATE_BW;
    return pages * Math.max(copies, 1) * rate;
  }

  @Query(() => [PrintJob], {
    description: 'Print jobs submitted by the current user',
  })
  async myPrintJobs(
    @CurrentUser() current: JwtPayload,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 50 })
    limit: number,
  ): Promise<PrintJob[]> {
    return this.jobRepo.find({
      where: { userId: current.sub },
      order: { createdAt: 'DESC' },
      take: Math.min(limit, 200),
    });
  }

  @Query(() => PrintJob, { nullable: true })
  async printJob(
    @CurrentUser() current: JwtPayload,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<PrintJob | null> {
    const job = await this.jobRepo.findOne({ where: { id, userId: current.sub } });
    if (!job) throw new NotFoundException('Print job not found');
    return job;
  }

  @Mutation(() => PrintJob, { description: 'Create a print job (cost computed server-side)' })
  async createPrintJob(
    @CurrentUser() current: JwtPayload,
    @Args('input') input: CreatePrintJobInput,
  ): Promise<PrintJob> {
    const cost = this.computeCost(input.pages, input.copies ?? 1, input.color ?? false);
    return this.jobRepo.save({
      userId: current.sub,
      fileUrl: input.fileUrl,
      fileName: input.fileName,
      pages: input.pages,
      copies: input.copies ?? 1,
      color: input.color ?? false,
      paperSize: input.paperSize ?? 'A4',
      sides: input.sides ?? 'single',
      cost,
      notes: input.notes,
      status: 'PENDING',
    });
  }
}
