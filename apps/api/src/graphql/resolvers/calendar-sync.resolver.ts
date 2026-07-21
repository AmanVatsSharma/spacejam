/**
 * File:        apps/api/src/graphql/resolvers/calendar-sync.resolver.ts
 * Module:      API · GraphQL Resolvers
 * Purpose:     Calendar connection and sync — OAuth connect/disconnect,
 *              manual sync trigger, connection status.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-20
 */
import { Resolver, Query, Args, Mutation, ID } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CalendarConnection, CalendarProvider } from '../../typeorm/entities/calendar-connection.entity';
import { User } from '../../typeorm/entities/user.entity';
import { CalendarSyncService } from '../../enterprise/calendar-sync.service';

@Resolver(() => CalendarConnection)
export class CalendarSyncResolver {
  constructor(
    private calendarService: CalendarSyncService,
    @InjectRepository(CalendarConnection)
    private repo: Repository<CalendarConnection>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  @Query(() => [CalendarConnection])
  async calendarConnections(
    @Args('userId', { type: () => ID }) userId: string,
  ): Promise<CalendarConnection[]> {
    return this.repo.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  @Query(() => CalendarConnection, { nullable: true })
  async calendarConnection(
    @Args('userId', { type: () => ID }) userId: string,
    @Args('provider', { type: () => CalendarProvider }) provider: CalendarProvider,
  ): Promise<CalendarConnection | null> {
    return this.repo.findOne({ where: { userId, provider } });
  }

  @Mutation(() => CalendarConnection)
  async connectCalendar(
    @Args('userId', { type: () => ID }) userId: string,
    @Args('provider', { type: () => CalendarProvider }) provider: CalendarProvider,
    @Args('accessToken') accessToken: string,
    @Args('refreshToken') refreshToken: string,
    @Args('expiresAt', { type: () => Date }) expiresAt: Date,
    @Args('externalCalendarId', { nullable: true }) externalCalendarId?: string,
    @Args('email', { nullable: true }) email?: string,
  ): Promise<CalendarConnection> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const existing = await this.repo.findOne({ where: { userId, provider } });
    if (existing) {
      await this.repo.update(existing.id, { accessToken, refreshToken, expiresAt, lastSyncedAt: null });
      const updated = await this.repo.findOne({ where: { id: existing.id } });
      if (!updated) throw new Error('Connection not found after update');
      return updated;
    }

    const conn = this.repo.create({ userId, provider, accessToken, refreshToken, expiresAt, externalCalendarId, email });
    return this.repo.save(conn);
  }

  @Mutation(() => Boolean)
  async disconnectCalendar(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    const result = await this.repo.delete(id);
    return (result.affected ?? 0) > 0;
  }

  @Mutation(() => Boolean)
  async syncCalendar(@Args('id', { type: () => ID }) id: string): Promise<boolean> {
    return this.calendarService.sync(id);
  }

  @Mutation(() => Boolean)
  async toggleSync(@Args('id', { type: () => ID }) id: string, @Args('enabled') enabled: boolean): Promise<boolean> {
    await this.repo.update(id, { syncEnabled: enabled });
    return true;
  }
}
