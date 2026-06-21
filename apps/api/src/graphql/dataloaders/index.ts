/**
 * File:        apps/api/src/graphql/dataloaders/index.ts
 * Module:      API · GraphQL · DataLoaders
 * Purpose:     Per-request DataLoaders that batch and cache the
 *              high-cardinality lookups our resolvers do (User, Center,
 *              Seat, Booking). Solves the N+1 query problem when a single
 *              GraphQL request returns a list of objects each carrying
 *              relations.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-21
 */
import DataLoader from 'dataloader';
import { Injectable, Scope } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { User } from '../../typeorm/entities/user.entity';
import { Center } from '../../typeorm/entities/center.entity';
import { Seat } from '../../typeorm/entities/seat.entity';
import { Booking } from '../../typeorm/entities/booking.entity';

@Injectable({ scope: Scope.REQUEST })
export class GqlDataLoaders {
  public readonly userById: DataLoader<string, User | null>;
  public readonly centerById: DataLoader<string, Center | null>;
  public readonly seatById: DataLoader<string, Seat | null>;
  public readonly seatsByFloor: DataLoader<string, Seat[]>;
  public readonly bookingsByUser: DataLoader<string, Booking[]>;

  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Center) private readonly centerRepo: Repository<Center>,
    @InjectRepository(Seat) private readonly seatRepo: Repository<Seat>,
    @InjectRepository(Booking) private readonly bookingRepo: Repository<Booking>,
  ) {
    this.userById = new DataLoader<string, User | null>(async (ids) => {
      const rows = await this.userRepo.find({ where: { id: In([...ids]) } });
      const byId = new Map(rows.map((r) => [r.id, r]));
      return ids.map((id) => byId.get(id) ?? null);
    });

    this.centerById = new DataLoader<string, Center | null>(async (ids) => {
      const rows = await this.centerRepo.find({ where: { id: In([...ids]) } });
      const byId = new Map(rows.map((r) => [r.id, r]));
      return ids.map((id) => byId.get(id) ?? null);
    });

    this.seatById = new DataLoader<string, Seat | null>(async (ids) => {
      const rows = await this.seatRepo.find({ where: { id: In([...ids]) } });
      const byId = new Map(rows.map((r) => [r.id, r]));
      return ids.map((id) => byId.get(id) ?? null);
    });

    this.seatsByFloor = new DataLoader<string, Seat[]>(async (floorIds) => {
      const rows = await this.seatRepo.find({ where: { floorId: In([...floorIds]) } });
      const byFloor = new Map<string, Seat[]>();
      for (const r of rows) {
        const arr = byFloor.get(r.floorId) ?? [];
        arr.push(r);
        byFloor.set(r.floorId, arr);
      }
      return floorIds.map((id) => byFloor.get(id) ?? []);
    });

    this.bookingsByUser = new DataLoader<string, Booking[]>(async (userIds) => {
      const rows = await this.bookingRepo.find({ where: { userId: In([...userIds]) } });
      const byUser = new Map<string, Booking[]>();
      for (const r of rows) {
        const arr = byUser.get(r.userId) ?? [];
        arr.push(r);
        byUser.set(r.userId, arr);
      }
      return userIds.map((id) => byUser.get(id) ?? []);
    });
  }
}
