/**
 * File:        apps/api/src/graphql/resolvers/calendar.resolver.ts
 * Module:      API · GraphQL Resolvers
 * Purpose:     Unified calendar feed — aggregates events, bookings, visits,
 *              and birthdays into a single date-ranged list so the calendar
 *              page needs one network call per month/week/day range.
 *              Center-scoped via centerScope (CENTER_MANAGER sees only their
 *              own center).
 *
 * Author:      ZCode
 * Last-updated: 2026-08-13
 */
import { UseGuards } from '@nestjs/common';
import { Resolver, Query, Args, ID, ObjectType, Field } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';

import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../../auth/types/jwt-payload.type';
import { centerScope } from '../../auth/helpers/center-scope.helper';

import { Event } from '../../typeorm/entities/event.entity';
import { Booking } from '../../typeorm/entities/booking.entity';
import { Visit } from '../../typeorm/entities/visit.entity';
import { Customer } from '../../typeorm/entities/customer.entity';
import { VisitStatus } from '../enums/visit.enums';

/** The kind of calendar entry. Drives the pill color on the frontend. */
export enum CalendarItemKind {
  EVENT = 'EVENT',
  BOOKING = 'BOOKING',
  VISIT = 'VISIT',
  BIRTHDAY = 'BIRTHDAY',
}

@ObjectType('CalendarItem')
export class CalendarItem {
  @Field()
  id!: string;

  @Field()
  kind!: CalendarItemKind;

  @Field()
  title!: string;

  /** ISO date string (YYYY-MM-DD) for grid placement. */
  @Field()
  date!: string;

  @Field({ nullable: true })
  startTime?: string;

  @Field({ nullable: true })
  endTime?: string;

  @Field({ nullable: true })
  status?: string;

  /** Suggested pill color: purple (event), grey (booking), blue (visit), pink (birthday). */
  @Field({ nullable: true })
  color?: string;

  /** The source entity id — used by the frontend to open the right edit modal. */
  @Field(() => ID, { nullable: true })
  referenceId?: string;

  /** Freeform metadata (subtype, company, partySize, visitorPhone, etc.). */
  @Field(() => String, { nullable: true })
  meta?: string;
}

const ALL_KINDS = new Set<string>([
  CalendarItemKind.EVENT,
  CalendarItemKind.BOOKING,
  CalendarItemKind.VISIT,
  CalendarItemKind.BIRTHDAY,
]);

@Resolver(() => CalendarItem)
@UseGuards(GqlAuthGuard)
export class CalendarResolver {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(Visit)
    private readonly visitRepo: Repository<Visit>,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
  ) {}

  /**
   * Return a unified feed of calendar entries for [startDate, endDate].
   * `types` (optional) filters to a subset of EVENT|BOOKING|VISIT|BIRTHDAY.
   */
  @Query(() => [CalendarItem], {
    description: 'Unified calendar feed: events + bookings + visits + birthdays',
  })
  async calendarFeed(
    @Args('startDate') startDate: string,
    @Args('endDate') endDate: string,
    @Args('centerId', { type: () => ID, nullable: true }) centerId: string | null,
    @Args('types', () => [String], { nullable: true }) types: string[] | null,
    @CurrentUser() caller?: JwtPayload,
  ): Promise<CalendarItem[]> {
    const scope = caller ? centerScope(caller) : undefined;
    const effectiveCenterId = scope ?? centerId ?? undefined;
    const wanted = types && types.length ? new Set(types) : ALL_KINDS;

    const start = new Date(startDate);
    const end = new Date(endDate);
    // Cover the whole end day.
    end.setHours(23, 59, 59, 999);

    const items: CalendarItem[] = [];

    if (wanted.has(CalendarItemKind.EVENT)) {
      items.push(...(await this.collectEvents(start, end, effectiveCenterId)));
    }
    if (wanted.has(CalendarItemKind.BOOKING)) {
      items.push(...(await this.collectBookings(start, end, effectiveCenterId)));
    }
    if (wanted.has(CalendarItemKind.VISIT)) {
      items.push(...(await this.collectVisits(start, end, effectiveCenterId)));
    }
    if (wanted.has(CalendarItemKind.BIRTHDAY)) {
      items.push(...(await this.collectBirthdays(start, end, effectiveCenterId)));
    }

    // Sort by date then start time; birthdays (no time) sort after timed items.
    return items.sort((a, b) => {
      const byDate = a.date.localeCompare(b.date);
      if (byDate !== 0) return byDate;
      return (a.startTime ?? '99:99').localeCompare(b.startTime ?? '99:99');
    });
  }

  // ─── Collectors ────────────────────────────────────────────────────────────

  private async collectEvents(start: Date, end: Date, centerId?: string): Promise<CalendarItem[]> {
    const where: any = { eventDate: Between(start, end) };
    if (centerId) where.centerId = centerId;
    const events = await this.eventRepo.find({
      where,
      relations: ['meetingRoom'],
    });
    return events.map((e) => ({
      id: `event-${e.id}`,
      kind: CalendarItemKind.EVENT,
      title: e.title,
      date: this.toDateStr(e.eventDate),
      startTime: e.startTime,
      endTime: e.endTime,
      status: e.status,
      color: 'purple',
      referenceId: e.id,
      meta: JSON.stringify({
        eventType: e.eventType,
        attendeesCount: e.attendeesCount,
        meetingRoomId: e.meetingRoomId,
        company: e.company,
      }),
    }));
  }

  private async collectBookings(start: Date, end: Date, centerId?: string): Promise<CalendarItem[]> {
    const where: any = { startDate: Between(start, end) };
    if (centerId) where.centerId = centerId;
    const bookings = await this.bookingRepo.find({
      where,
      relations: ['seat', 'user'],
    });
    return bookings.map((b) => ({
      id: `booking-${b.id}`,
      kind: CalendarItemKind.BOOKING,
      title: b.seat ? `Seat ${b.seat.label ?? b.seatId}` : 'Booking',
      date: this.toDateStr(b.startDate),
      startTime: this.timeFromDate(b.startDate),
      endTime: this.timeFromDate(b.endDate),
      status: b.status,
      color: 'grey',
      referenceId: b.id,
      meta: JSON.stringify({
        seatId: b.seatId,
        userId: b.userId,
        seatType: (b.seat as any)?.seatType,
      }),
    }));
  }

  private async collectVisits(start: Date, end: Date, centerId?: string): Promise<CalendarItem[]> {
    const where: any = { visitDate: Between(start, end) };
    if (centerId) where.centerId = centerId;
    // Cancelled visits are filtered out below (kept out of the calendar).
    const visits = await this.visitRepo.find({ where });
    return visits
      .filter((v) => v.status !== VisitStatus.CANCELLED)
      .map((v) => ({
        id: `visit-${v.id}`,
        kind: CalendarItemKind.VISIT,
        title: `Visit: ${v.visitorName}`,
        date: this.toDateStr(v.visitDate),
        startTime: v.startTime,
        endTime: v.endTime,
        status: v.status,
        color: 'blue',
        referenceId: v.id,
        meta: JSON.stringify({
          visitorPhone: v.visitorPhone,
          company: v.company,
          tourType: v.tourType,
          partySize: v.partySize,
          leadId: v.leadId,
        }),
      }));
  }

  private async collectBirthdays(start: Date, end: Date, centerId?: string): Promise<CalendarItem[]> {
    // Customer.dob is a date; pull all customers and filter by month/day in
    // the range. A single range spans at most two months in month view, so
    // the per-row filter is cheap.
    const where: any = {};
    if (centerId) where.centerId = centerId;
    const customers = await this.customerRepo.find({
      where,
      select: ['id', 'name', 'dob', 'centerId'],
    });

    const items: CalendarItem[] = [];
    const startMonth = start.getMonth();
    const endMonth = end.getMonth();
    for (const c of customers) {
      const dob = (c as any).dob as Date | null | undefined;
      if (!dob) continue;
      const m = dob.getMonth();
      const d = dob.getDate();
      // Match if the birthday's month is within the range's month span.
      // (Range crosses a year boundary only in rare Dec→Jan views; handle that too.)
      const inRange =
        endMonth >= startMonth
          ? m >= startMonth && m <= endMonth
          : m >= startMonth || m <= endMonth;
      if (!inRange) continue;

      // Build the date string within the range's year for grid placement.
      // Use the start year, and if the birthday month is Jan but range starts
      // in Dec, use the next year.
      const year = start.getFullYear() + (m < startMonth ? 1 : 0);
      const dateStr = `${year}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

      items.push({
        id: `birthday-${c.id}-${dateStr}`,
        kind: CalendarItemKind.BIRTHDAY,
        title: `${c.name}'s Birthday`,
        date: dateStr,
        startTime: undefined,
        endTime: undefined,
        status: undefined,
        color: 'pink',
        referenceId: c.id,
        meta: JSON.stringify({ customerId: c.id, name: c.name, birthMonth: m, birthDay: d }),
      });
    }
    return items;
  }

  private toDateStr(d: Date | string): string {
    const date = d instanceof Date ? d : new Date(d);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
      date.getDate(),
    ).padStart(2, '0')}`;
  }

  private timeFromDate(d: Date | string | null | undefined): string | undefined {
    if (!d) return undefined;
    const date = d instanceof Date ? d : new Date(d);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }
}
