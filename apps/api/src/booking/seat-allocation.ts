/**
 * File:        apps/api/src/booking/seat-allocation.ts
 * Module:      API · Booking · Seat allocation
 * Purpose:     Reserve inventory seats for a customer and persist their team
 *              members. Extracted from BookingResolver.allocateCustomerSeats so
 *              onboarding can run it INSIDE its provisioning transaction.
 *
 *              Concurrency: the candidate seats are read with a pessimistic
 *              write lock, so two onboardings in the same center can no longer
 *              both claim the same AVAILABLE seat (the old resolver read, then
 *              wrote, with nothing in between). Named seat requests are honoured
 *              first (case-insensitive), the rest are auto-assigned in name
 *              order; a shortfall is reported, never thrown.
 *
 * Author:      Claude Sonnet 5.5 (extracted from booking.resolver.ts)
 * Last-updated: 2026-10-02
 */
import { EntityManager } from 'typeorm';
import { BookingStatus, SeatStatus } from '@enums';
import { Seat } from '../typeorm/entities/seat.entity';
import { Booking } from '../typeorm/entities/booking.entity';
import { CustomerEmployee } from '../typeorm/entities/customer-employee.entity';

export interface SeatAllocationMember {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  department?: string | null;
  /** Preferred seat by name (e.g. "A-12"); falls back to the next free seat. */
  seatName?: string | null;
}

export interface SeatAllocationRequest {
  customerId: string;
  centerId: string;
  /** HOT_DESK | DEDICATED | CABIN | MEETING_ROOM — omit or 'ANY' for any type. */
  seatType?: string | null;
  /** Booking length in months. */
  months: number;
  /** Total seats wanted (members may be fewer — the extras are unnamed). */
  count: number;
  members?: SeatAllocationMember[];
  /** Recorded as the booking's userId (the staff member doing the onboarding). */
  actorId?: string | null;
  startDate?: Date;
  /** Appended to the booking note, e.g. "(onboarding 1a2b3c4d)". */
  noteSuffix?: string;
}

export interface AllocatedSeatInfo {
  seatId: string;
  seatName: string;
  employeeId: string | null;
  employeeName: string | null;
  bookingId: string;
}

export interface SeatAllocationOutcome {
  requested: number;
  booked: number;
  availableAtStart: number;
  /** requested − booked when inventory ran out; 0 otherwise. */
  shortfall: number;
  seats: AllocatedSeatInfo[];
  /** Sum of the monthly list price of the booked seats. */
  monthlySeatTotal: number;
}

export async function allocateSeats(
  manager: EntityManager,
  req: SeatAllocationRequest,
): Promise<SeatAllocationOutcome> {
  const seatRepo = manager.getRepository(Seat);
  const bookingRepo = manager.getRepository(Booking);
  const employeeRepo = manager.getRepository(CustomerEmployee);

  const where: Record<string, unknown> = {
    centerId: req.centerId,
    status: SeatStatus.AVAILABLE,
    active: true,
  };
  if (req.seatType && req.seatType !== 'ANY') where.seatType = req.seatType;

  const available = await seatRepo.find({
    where,
    order: { name: 'ASC' },
    lock: { mode: 'pessimistic_write' },
  });

  const outcome: SeatAllocationOutcome = {
    requested: req.count,
    booked: 0,
    availableAtStart: available.length,
    shortfall: 0,
    seats: [],
    monthlySeatTotal: 0,
  };

  const claimed = new Set<string>();
  const pick = (predicate: (s: Seat) => boolean): Seat | null => {
    const seat = available.find((s) => !claimed.has(s.id) && predicate(s));
    if (seat) claimed.add(seat.id);
    return seat ?? null;
  };

  const start = req.startDate ?? new Date();
  const end = new Date(start);
  end.setMonth(end.getMonth() + Math.max(1, req.months));
  const suffix = req.noteSuffix ? ` ${req.noteSuffix}` : '';

  const book = async (seat: Seat, memberName?: string | null) => {
    const booking = await bookingRepo.save(
      bookingRepo.create({
        userId: req.actorId ?? null,
        customerId: req.customerId,
        seatId: seat.id,
        centerId: req.centerId,
        startDate: start,
        endDate: end,
        status: BookingStatus.CONFIRMED,
        totalPrice: seat.price,
        notes: `Seat allocated during onboarding${memberName ? ` — ${memberName}` : ''}${suffix}`,
      } as any) as unknown as Booking,
    );
    await seatRepo.update(seat.id, { status: SeatStatus.RESERVED });
    outcome.monthlySeatTotal += Number(seat.price) || 0;
    return booking;
  };

  // 1) Members first: honour a named seat, otherwise the next free one.
  for (const member of req.members ?? []) {
    if (outcome.seats.length >= req.count) break;
    const wanted = member.seatName?.toLowerCase().trim();
    const named = wanted ? pick((s) => s.name.toLowerCase().trim() === wanted) : null;
    const chosen = named ?? pick(() => true);
    if (!chosen) break;

    const booking = await book(chosen, member.name);

    // A team member becomes a CustomerEmployee only when we can reach them.
    let employeeId: string | null = null;
    if (member.name && member.email) {
      const emp = await employeeRepo.save(
        employeeRepo.create({
          customerId: req.customerId,
          name: member.name,
          email: member.email,
          phone: member.phone ?? undefined,
          department: member.department ?? undefined,
          seatId: chosen.id,
          seatNumber: chosen.name,
        } as any) as unknown as CustomerEmployee,
      );
      employeeId = emp.id;
    }
    outcome.seats.push({
      seatId: chosen.id,
      seatName: chosen.name,
      employeeId,
      employeeName: member.name ?? null,
      bookingId: booking.id,
    });
  }

  // 2) Unnamed seats for whatever count is left.
  while (outcome.seats.length < req.count) {
    const chosen = pick(() => true);
    if (!chosen) break;
    const booking = await book(chosen);
    outcome.seats.push({
      seatId: chosen.id,
      seatName: chosen.name,
      employeeId: null,
      employeeName: null,
      bookingId: booking.id,
    });
  }

  outcome.booked = outcome.seats.length;
  outcome.shortfall = Math.max(0, outcome.requested - outcome.booked);
  return outcome;
}
