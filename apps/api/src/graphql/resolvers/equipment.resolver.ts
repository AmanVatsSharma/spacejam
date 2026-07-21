/**
 * File:        apps/api/src/graphql/resolvers/equipment.resolver.ts
 * Module:      API · GraphQL Resolvers
 * Purpose:     Equipment CRUD — create, update, assign/unassign,
 *              change status, delete, list with filters.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-20
 */
import { Resolver, Query, Args, Mutation, ID, Int } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { Equipment, EquipmentStatus } from '../../typeorm/entities/equipment.entity';
import { CreateEquipmentInput, UpdateEquipmentInput, EquipmentFiltersInput } from '../inputs/equipment.input';

@Resolver(() => Equipment)
export class EquipmentResolver {
  constructor(
    @InjectRepository(Equipment)
    private repo: Repository<Equipment>,
  ) {}

  @Query(() => [Equipment])
  async equipments(
    @Args('filters', { nullable: true }) filters?: EquipmentFiltersInput,
  ): Promise<Equipment[]> {
    const where: FindOptionsWhere<Equipment> = {};
    if (filters?.centerId) where.centerId = filters.centerId;
    if (filters?.type) where.type = filters.type;
    if (filters?.status) where.status = filters.status;
    if (filters?.assignedTo) where.assignedTo = filters.assignedTo;
    if (filters?.search) where.name = Like(`%${filters.search}%`);

    return this.repo.find({
      where,
      relations: ['center', 'assignedUser'],
      order: { createdAt: 'DESC' },
      take: filters?.limit ?? 100,
      skip: filters?.offset ?? 0,
    });
  }

  @Query(() => Equipment)
  async equipment(@Args('id', { type: () => ID }) id: string): Promise<Equipment> {
    const eq = await this.repo.findOne({ where: { id }, relations: ['center', 'assignedUser'] });
    if (!eq) throw new Error('Equipment not found');
    return eq;
  }

  @Query(() => Int)
  async equipmentCount(@Args('centerId', { type: () => ID }) centerId: string): Promise<number> {
    return this.repo.count({ where: { centerId } });
  }

  @Mutation(() => Equipment)
  async createEquipment(@Args('input') input: CreateEquipmentInput): Promise<Equipment> {
    const eq = this.repo.create(input);
    return this.repo.save(eq);
  }

  @Mutation(() => Equipment)
  async updateEquipment(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateEquipmentInput,
  ): Promise<Equipment> {
    await this.repo.update(id, input);
    const eq = await this.repo.findOne({ where: { id }, relations: ['center', 'assignedUser'] });
    if (!eq) throw new Error('Equipment not found');
    return eq;
  }

  @Mutation(() => Equipment)
  async assignEquipment(
    @Args('id', { type: () => ID }) id: string,
    @Args('userId', { type: () => ID }) userId: string,
    @Args('assignedAt', { type: () => String, nullable: true }) assignedAt?: string,
  ): Promise<Equipment> {
    await this.repo.update(id, {
      assignedTo: userId,
      assignedAt: assignedAt ?? new Date().toISOString().split('T')[0],
      status: EquipmentStatus.ASSIGNED,
    });
    const eq = await this.repo.findOne({ where: { id }, relations: ['center', 'assignedUser'] });
    if (!eq) throw new Error('Equipment not found');
    return eq;
  }

  @Mutation(() => Equipment)
  async unassignEquipment(@Args('id', { type: () => ID }) id: string): Promise<Equipment> {
    await this.repo.update(id, {
      assignedTo: null,
      assignedAt: null,
      status: EquipmentStatus.AVAILABLE,
    });
    const eq = await this.repo.findOne({ where: { id }, relations: ['center', 'assignedUser'] });
    if (!eq) throw new Error('Equipment not found');
    return eq;
  }

  @Mutation(() => Equipment)
  async setEquipmentStatus(
    @Args('id', { type: () => ID }) id: string,
    @Args('status', { type: () => EquipmentStatus }) status: EquipmentStatus,
  ): Promise<Equipment> {
    await this.repo.update(id, { status });
    const eq = await this.repo.findOne({ where: { id }, relations: ['center', 'assignedUser'] });
    if (!eq) throw new Error('Equipment not found');
    return eq;
  }

  @Mutation(() => Boolean)
  async deleteEquipment(@Args('id', { type: () => ID }) id: string): Promise<boolean> {
    const result = await this.repo.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
