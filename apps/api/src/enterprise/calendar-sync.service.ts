/**
 * File:        apps/api/src/enterprise/calendar-sync.service.ts
 * Module:      API · Enterprise Services
 * Purpose:     Two-way calendar sync — pulls events from Google/Outlook
 *              providers and pushes our bookings to them. Stubs the
 *              provider-specific HTTP calls so the integration point
 *              is clear and tests can mock it.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-20
 */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CalendarConnection } from '../typeorm/entities/calendar-connection.entity';
import { Event } from '../typeorm/entities/event.entity';

@Injectable()
export class CalendarSyncService {
  constructor(
    @InjectRepository(CalendarConnection)
    private connRepo: Repository<CalendarConnection>,
    @InjectRepository(Event)
    private eventRepo: Repository<Event>,
  ) {}

  /**
   * Pull events from external calendar and create internal Events.
   * Stub — real implementation calls Google/Outlook APIs.
   */
  async sync(connectionId: string): Promise<boolean> {
    const conn = await this.connRepo.findOne({ where: { id: connectionId } });
    if (!conn || !conn.syncEnabled) return false;

    try {
      const externalEvents = await this.fetchExternal(conn);
      await this.upsertInternal(conn, externalEvents);
      await this.connRepo.update(connectionId, { lastSyncedAt: new Date() });
      return true;
    } catch (err) {
      console.error(`Calendar sync ${connectionId} failed:`, err);
      return false;
    }
  }

  /** Stub — returns empty list. Real impl would call provider API. */
  private async fetchExternal(_conn: CalendarConnection): Promise<any[]> {
    return [];
  }

  /** Stub — no-op until fetchExternal returns data. */
  private async upsertInternal(_conn: CalendarConnection, _events: any[]): Promise<void> {
    return;
  }

  /**
   * Push an internal Event to the connected external calendar. Called
   * from event creation flow when user has sync enabled.
   */
  async pushEvent(connectionId: string, eventId: string): Promise<boolean> {
    const conn = await this.connRepo.findOne({ where: { id: connectionId } });
    if (!conn || !conn.syncEnabled) return false;

    const event = await this.eventRepo.findOne({ where: { id: eventId } });
    if (!event) return false;

    try {
      console.log(`[CalendarSync] pushEvent ${eventId} → ${conn.provider}`);
      return true;
    } catch (err) {
      console.error(`CalendarSync.pushEvent failed:`, err);
      return false;
    }
  }
}
