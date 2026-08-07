/**
 * File:        apps/api/src/graphql/resolvers/customer.resolver.ts
 * Module:      API · GraphQL Resolvers
 * Purpose:     Customer management resolvers (onboarded clients)
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-06
 */
import { Resolver, Query, Args, Mutation, Int, ID } from '@nestjs/graphql';
import { NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, DataSource } from 'typeorm';
// @ts-ignore
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { CustomerStatus, OnboardingStatus, UserRole } from '../types/user.type';
import { Customer as CustomerEntity } from '../../typeorm/entities/customer.entity';
import { Onboarding as OnboardingEntity } from '../../typeorm/entities/onboarding.entity';
import { User as UserEntity } from '../../typeorm/entities/user.entity';
import { Deposit as DepositEntity } from '../../typeorm/entities/deposit.entity';
import { Contract as ContractEntity } from '../../typeorm/entities/contract.entity';
import { Invoice as InvoiceEntity } from '../../typeorm/entities/invoice.entity';
import {
    CreateCustomerInput,
    UpdateCustomerInput,
    CustomerFiltersInput,
} from '../inputs/customer.input';
import { CacheService } from '../../cache/cache.service';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../../auth/types/jwt-payload.type';
import { centerScope } from '../../auth/helpers/center-scope.helper';

@Resolver(() => CustomerEntity)
export class CustomerResolver {
    private readonly logger = new Logger(CustomerResolver.name);

    constructor(
        private cache: CacheService,
        private dataSource: DataSource,
        @InjectRepository(CustomerEntity)
        private customerRepo: Repository<CustomerEntity>,
        @InjectRepository(OnboardingEntity)
        private onboardingRepo: Repository<OnboardingEntity>,
    ) { }

    @Query(() => [CustomerEntity])
    async customers(
        @Args('filters', { nullable: true }) filters?: CustomerFiltersInput,
        @CurrentUser() caller?: JwtPayload,
    ): Promise<CustomerEntity[]> {
        const where: any = {};
        const scope = caller ? centerScope(caller) : undefined;
        const effectiveCenterId = scope ?? filters?.centerId;
        if (effectiveCenterId) where.centerId = effectiveCenterId;

        if (filters) {
            if (filters.status) where.status = filters.status;
            if (filters.search) {
                where.name = Like(`%${filters.search}%`);
            }
        }

        return this.customerRepo.find({
            where,
            relations: ['center', 'deposits', 'contracts', 'invoices'],
            order: { createdAt: 'DESC' },
            take: filters?.limit ?? 50,
            skip: filters?.offset ?? 0,
        });
    }

    @Query(() => CustomerEntity, { nullable: true })
    async customer(@Args('id', { type: () => ID }) id: string): Promise<CustomerEntity | null> {
        return this.customerRepo.findOne({
            where: { id },
            relations: ['center', 'deposits', 'contracts', 'invoices'],
        });
    }

    @Mutation(() => CustomerEntity)
    async createCustomer(
        @Args('input') input: CreateCustomerInput,
    ): Promise<CustomerEntity> {
        // Create Customer + Onboarding + (optional) login User inside one
        // transaction so the direct-create path (no lead) matches the
        // convertLeadWithOnboarding path: every customer has an Onboarding
        // record in its pipeline and, where possible, a self-service login.
        const savedId = await this.dataSource.transaction(async (manager) => {
            // Provision (or reuse) a login user for this customer.
            let linkedUserId: string | null = null;
            if (input.email) {
                const normalized = input.email.toLowerCase().trim();
                const existing = await manager.findOne(UserEntity, {
                    where: { email: normalized },
                });
                if (existing) {
                    linkedUserId = existing.id;
                } else {
                    const tempPassword = crypto.randomBytes(12).toString('base64url');
                    const passwordHash = await bcrypt.hash(tempPassword, 12);
                    const user = manager.create(UserEntity, {
                        email: normalized,
                        name: input.name ?? normalized.split('@')[0],
                        passwordHash,
                        role: UserRole.MEMBER,
                        active: true,
                        emailVerified: false,
                        ...(input.phone ? { phone: input.phone } : {}),
                        ...(input.centerId ? { centerId: input.centerId } : {}),
                    } as any);
                    const savedUser = await manager.save(user);
                    linkedUserId = savedUser.id;
                    this.logger.log(
                        `provisioned login user ${savedUser.id} (${savedUser.email}) for new customer`,
                    );
                }
            }

            const newCustomer = manager.create(CustomerEntity, {
                ...input,
                status: input.status ?? CustomerStatus.ACTIVE,
                joinDate: input.joinDate ?? new Date(),
                ...(linkedUserId ? { userId: linkedUserId } : {}),
            } as any);
            const customer = await manager.save(newCustomer);

            // Mirror the convertLeadWithOnboarding path: seed an Onboarding
            // row so this customer appears in the onboarding pipeline too.
            const onboarding = manager.create(OnboardingEntity, {
                customerId: customer.id,
                status: OnboardingStatus.IN_PROGRESS,
                companyName: input.company,
                companyAddress: input.location,
                contactName: input.name,
                contactEmail: input.email,
                contactPhone: input.phone,
                centerId: input.centerId,
                notes: input.notes,
            } as any);
            await manager.save(onboarding);

            return customer.id;
        });

        const result = await this.customerRepo.findOne({
            where: { id: savedId },
            relations: ['center'],
        });
        await this.cache.invalidatePattern('customers:*');
        await this.cache.invalidatePattern('onboardings:*');
        return result!;
    }

    @Mutation(() => CustomerEntity)
    async updateCustomer(
        @Args('id', { type: () => ID }) id: string,
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
    async deleteCustomer(@Args('id', { type: () => ID }) id: string): Promise<boolean> {
        // Clean up Onboarding rows that reference this customer so we don't
        // leave orphaned paperwork behind (the DB FK cascade added by the
        // 20260807000000 migration will also catch this, but we do it here
        // to stay correct even before that migration runs).
        await this.onboardingRepo.delete({ customerId: id });
        await this.customerRepo.delete(id);
        await this.cache.invalidatePattern('customers:*');
        await this.cache.invalidatePattern('onboardings:*');
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

    @Query(() => [DepositEntity])
    async customerDeposits(
        @Args('customerId', { type: () => ID }) customerId: string,
    ): Promise<DepositEntity[]> {
        return this.customerRepo
            .createQueryBuilder('customer')
            .leftJoinAndSelect('customer.deposits', 'deposit')
            .leftJoinAndSelect('deposit.center', 'center')
            .where('customer.id = :customerId', { customerId })
            .orderBy('deposit.createdAt', 'DESC')
            .getMany()
            .then((results) => results[0]?.deposits ?? []);
    }

    @Query(() => [ContractEntity])
    async customerContracts(
        @Args('customerId', { type: () => ID }) customerId: string,
    ): Promise<ContractEntity[]> {
        return this.customerRepo
            .createQueryBuilder('customer')
            .leftJoinAndSelect('customer.contracts', 'contract')
            .leftJoinAndSelect('contract.center', 'center')
            .where('customer.id = :customerId', { customerId })
            .orderBy('contract.createdAt', 'DESC')
            .getMany()
            .then((results) => results[0]?.contracts ?? []);
    }

    @Query(() => [InvoiceEntity])
    async customerInvoices(
        @Args('customerId', { type: () => ID }) customerId: string,
    ): Promise<InvoiceEntity[]> {
        return this.customerRepo
            .createQueryBuilder('customer')
            .leftJoinAndSelect('customer.invoices', 'invoice')
            .leftJoinAndSelect('invoice.center', 'center')
            .where('customer.id = :customerId', { customerId })
            .orderBy('invoice.createdAt', 'DESC')
            .getMany()
            .then((results) => results[0]?.invoices ?? []);
    }
}
