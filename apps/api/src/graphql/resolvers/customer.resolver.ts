/**
 * File:        apps/api/src/graphql/resolvers/customer.resolver.ts
 * Module:      API · GraphQL Resolvers
 * Purpose:     Customer management resolvers (onboarded clients)
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-06
 */
import { Resolver, Query, Args, Mutation, Int } from '@nestjs/graphql';
import { NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { CustomerStatus } from '../types/user.type';
import { Customer as CustomerEntity } from '../../typeorm/entities/customer.entity';
import {
    CreateCustomerInput,
    UpdateCustomerInput,
    CustomerFiltersInput,
} from '../inputs/customer.input';
import { CacheService } from '../../cache/cache.service';

@Resolver(() => CustomerEntity)
export class CustomerResolver {
    constructor(
        private cache: CacheService,
        @InjectRepository(CustomerEntity)
        private customerRepo: Repository<CustomerEntity>,
    ) { }

    @Query(() => [CustomerEntity])
    async customers(
        @Args('filters', { nullable: true }) filters?: CustomerFiltersInput,
    ): Promise<CustomerEntity[]> {
        const where: any = {};

        if (filters) {
            if (filters.status) where.status = filters.status;
            if (filters.centerId) where.centerId = filters.centerId;
            if (filters.search) {
                where.name = Like(`%${filters.search}%`);
            }
        }

        return this.customerRepo.find({
            where,
            relations: ['center'],
            order: { createdAt: 'DESC' },
            take: filters?.limit ?? 50,
            skip: filters?.offset ?? 0,
        });
    }

    @Query(() => CustomerEntity, { nullable: true })
    async customer(@Args('id') id: string): Promise<CustomerEntity | null> {
        return this.customerRepo.findOne({
            where: { id },
            relations: ['center'],
        });
    }

    @Mutation(() => CustomerEntity)
    async createCustomer(
        @Args('input') input: CreateCustomerInput,
    ): Promise<CustomerEntity> {
        const newCustomer = this.customerRepo.create({
            ...input,
            status: input.status ?? CustomerStatus.ACTIVE,
            joinDate: input.joinDate ?? new Date(),
        });
        const customer = await this.customerRepo.save(newCustomer);
        await this.cache.invalidatePattern('customers:*');
        return customer;
    }

    @Mutation(() => CustomerEntity)
    async updateCustomer(
        @Args('id') id: string,
        @Args('input') input: UpdateCustomerInput,
    ): Promise<CustomerEntity> {
        await this.customerRepo.update(id, input);
        const customer = await this.customerRepo.findOne({
            where: { id },
            relations: ['center'],
        });
        if (!customer) throw new NotFoundException('Customer not found');
        await this.cache.invalidatePattern('customers:*');
        await this.cache.del(`customer:${id}`);
        return customer;
    }

    @Mutation(() => Boolean)
    async deleteCustomer(@Args('id') id: string): Promise<boolean> {
        await this.customerRepo.delete(id);
        await this.cache.invalidatePattern('customers:*');
        await this.cache.del(`customer:${id}`);
        return true;
    }

    @Query(() => Int, {
        description: 'Get count of customers, optionally filtered by status',
    })
    async customerCount(
        @Args('status', {
            nullable: true,
            type: () => CustomerStatus,
        })
        status?: CustomerStatus,
    ): Promise<number> {
        const where = status ? { status } : {};
        return this.customerRepo.count({ where });
    }
}
