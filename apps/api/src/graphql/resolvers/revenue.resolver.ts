/**
 * File:        apps/api/src/graphql/resolvers/revenue.resolver.ts
 * Module:      API · GraphQL Resolvers
 * Purpose:     Revenue management resolvers (Invoices, Deposits, Contracts)
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-02
 */
import { Resolver, Query, Args, Mutation, Context } from '@nestjs/graphql';
import { NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InvoiceStatus, DepositStatus, ContractStatus } from '../types/user.type';
import { Invoice as InvoiceEntity } from '../../typeorm/entities/invoice.entity';
import { Deposit as DepositEntity } from '../../typeorm/entities/deposit.entity';
import { Contract as ContractEntity } from '../../typeorm/entities/contract.entity';
import {
  CreateInvoiceInput,
  UpdateInvoiceInput,
  InvoiceFiltersInput,
  CreateDepositInput,
  UpdateDepositInput,
  DepositFiltersInput,
  CreateContractInput,
  UpdateContractInput,
  ContractFiltersInput,
} from '../inputs/revenue.input';
import { CacheService } from '../../cache/cache.service';

@Resolver(() => InvoiceEntity)
export class InvoiceResolver {
  constructor(
    private cache: CacheService,
    @InjectRepository(InvoiceEntity)
    private invoiceRepo: Repository<InvoiceEntity>,
  ) {}

  @Query(() => [InvoiceEntity])
  async invoices(
    @Args('filters', { nullable: true }) filters?: InvoiceFiltersInput
  ): Promise<InvoiceEntity[]> {
    const where: any = {};

    if (filters) {
      if (filters.status) where.status = filters.status;
      if (filters.centerId) where.centerId = filters.centerId;
      if (filters.customerId) where.customerId = filters.customerId;
      if (filters.dateFrom) where.issueDate = { gte: filters.dateFrom };
      if (filters.dateTo) where.issueDate = { ...(where.issueDate ?? {}), lte: filters.dateTo };
    }

    const invoices = await this.invoiceRepo.find({
      where,
      relations: ['customer', 'center'],
      order: { createdAt: 'DESC' },
      take: filters?.limit ?? 50,
      skip: filters?.offset ?? 0,
    });

    return invoices;
  }

  @Query(() => InvoiceEntity, { nullable: true })
  async invoice(@Args('id') id: string): Promise<InvoiceEntity | null> {
    const invoice = await this.invoiceRepo.findOne({
      where: { id },
      relations: ['customer', 'center'],
    });
    return invoice;
  }

  @Mutation(() => InvoiceEntity)
  async createInvoice(
    @Args('input') input: CreateInvoiceInput,
  ): Promise<InvoiceEntity> {
    const totalAmount = input.totalAmount ?? (input.amount + (input.tax ?? 0));
    const invoiceNumber = `INV-${Date.now()}`;

    const newInvoice = this.invoiceRepo.create({
      ...input,
      invoiceNumber,
      totalAmount,
      status: input.status ?? InvoiceStatus.DRAFT,
      issueDate: input.issueDate ?? new Date(),
      dueDate: input.dueDate ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    const invoice = await this.invoiceRepo.save(newInvoice);
    await this.cache.invalidatePattern('invoices:*');
    return invoice;
  }

  @Mutation(() => InvoiceEntity)
  async updateInvoice(
    @Args('id') id: string,
    @Args('input') input: UpdateInvoiceInput,
  ): Promise<InvoiceEntity> {
    await this.invoiceRepo.update(id, input);
    const invoice = await this.invoiceRepo.findOne({
      where: { id },
      relations: ['customer', 'center'],
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    await this.cache.invalidatePattern('invoices:*');
    await this.cache.invalidate(`invoice:${id}`);
    return invoice;
  }

  @Mutation(() => Boolean)
  async deleteInvoice(@Args('id') id: string): Promise<boolean> {
    await this.invoiceRepo.delete(id);
    await this.cache.invalidatePattern('invoices:*');
    await this.cache.invalidate(`invoice:${id}`);
    return true;
  }

  @Mutation(() => InvoiceEntity)
  async markInvoicePaid(
    @Args('id') id: string,
    @Args('paymentMethod', { nullable: true }) paymentMethod?: string,
  ): Promise<InvoiceEntity> {
    await this.invoiceRepo.update(id, {
      status: InvoiceStatus.PAID,
      paidDate: new Date(),
    });
    const invoice = await this.invoiceRepo.findOne({
      where: { id },
      relations: ['customer', 'center'],
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    await this.cache.invalidatePattern('invoices:*');
    await this.cache.invalidate(`invoice:${id}`);
    return invoice;
  }

  @Query(() => Number)
  async invoiceCount(
    @Args('status', { type: () => InvoiceStatus, nullable: true }) status?: InvoiceStatus
  ): Promise<number> {
    const where = status ? { status } : {};
    return this.invoiceRepo.count({ where });
  }
}

@Resolver(() => DepositEntity)
export class DepositResolver {
  constructor(
    private cache: CacheService,
    @InjectRepository(DepositEntity)
    private depositRepo: Repository<DepositEntity>,
  ) {}

  @Query(() => [DepositEntity])
  async deposits(
    @Args('filters', { nullable: true }) filters?: DepositFiltersInput
  ): Promise<DepositEntity[]> {
    const where: any = {};

    if (filters) {
      if (filters.status) where.status = filters.status;
      if (filters.centerId) where.centerId = filters.centerId;
      if (filters.customerId) where.customerId = filters.customerId;
      if (filters.dateFrom) where.receivedDate = { gte: filters.dateFrom };
      if (filters.dateTo) where.receivedDate = { ...(where.receivedDate ?? {}), lte: filters.dateTo };
    }

    const deposits = await this.depositRepo.find({
      where,
      relations: ['customer', 'center'],
      order: { createdAt: 'DESC' },
      take: filters?.limit ?? 50,
      skip: filters?.offset ?? 0,
    });

    return deposits;
  }

  @Query(() => DepositEntity, { nullable: true })
  async deposit(@Args('id') id: string): Promise<DepositEntity | null> {
    const deposit = await this.depositRepo.findOne({
      where: { id },
      relations: ['customer', 'center'],
    });
    return deposit;
  }

  @Mutation(() => DepositEntity)
  async createDeposit(
    @Args('input') input: CreateDepositInput,
  ): Promise<DepositEntity> {
    const referenceNumber = input.referenceNumber ?? `DEP-${Date.now()}`;

    const newDeposit = this.depositRepo.create({
      ...input,
      referenceNumber,
      receivedDate: input.receivedDate ?? new Date(),
    });
    const deposit = await this.depositRepo.save(newDeposit);
    await this.cache.invalidatePattern('deposits:*');
    return deposit;
  }

  @Mutation(() => DepositEntity)
  async updateDeposit(
    @Args('id') id: string,
    @Args('input') input: UpdateDepositInput,
  ): Promise<DepositEntity> {
    await this.depositRepo.update(id, input);
    const deposit = await this.depositRepo.findOne({
      where: { id },
      relations: ['customer', 'center'],
    });
    if (!deposit) throw new NotFoundException('Deposit not found');
    await this.cache.invalidatePattern('deposits:*');
    await this.cache.invalidate(`deposit:${id}`);
    return deposit;
  }

  @Mutation(() => DepositEntity)
  async releaseDeposit(
    @Args('id') id: string,
  ): Promise<DepositEntity> {
    await this.depositRepo.update(id, {
      status: DepositStatus.RELEASED,
      releasedDate: new Date(),
    });
    const deposit = await this.depositRepo.findOne({
      where: { id },
      relations: ['customer', 'center'],
    });
    if (!deposit) throw new NotFoundException('Deposit not found');
    await this.cache.invalidatePattern('deposits:*');
    await this.cache.invalidate(`deposit:${id}`);
    return deposit;
  }

  @Mutation(() => Boolean)
  async deleteDeposit(@Args('id') id: string): Promise<boolean> {
    await this.depositRepo.delete(id);
    await this.cache.invalidatePattern('deposits:*');
    await this.cache.invalidate(`deposit:${id}`);
    return true;
  }
}

@Resolver(() => ContractEntity)
export class ContractResolver {
  constructor(
    private cache: CacheService,
    @InjectRepository(ContractEntity)
    private contractRepo: Repository<ContractEntity>,
  ) {}

  @Query(() => [ContractEntity])
  async contracts(
    @Args('filters', { nullable: true }) filters?: ContractFiltersInput
  ): Promise<ContractEntity[]> {
    const where: any = {};

    if (filters) {
      if (filters.status) where.status = filters.status;
      if (filters.centerId) where.centerId = filters.centerId;
      if (filters.customerId) where.customerId = filters.customerId;
      if (filters.dateFrom) where.startDate = { gte: filters.dateFrom };
      if (filters.dateTo) where.endDate = { lte: filters.dateTo };
    }

    const contracts = await this.contractRepo.find({
      where,
      relations: ['customer', 'center'],
      order: { createdAt: 'DESC' },
      take: filters?.limit ?? 50,
      skip: filters?.offset ?? 0,
    });

    return contracts as unknown as Contract[];
  }

  @Query(() => ContractEntity, { nullable: true })
  async contract(@Args('id') id: string): Promise<ContractEntity | null> {
    const contract = await this.contractRepo.findOne({
      where: { id },
      relations: ['customer', 'center'],
    });
    return contract as unknown as Contract | null;
  }

  @Mutation(() => ContractEntity)
  async createContract(
    @Args('input') input: CreateContractInput,
  ): Promise<ContractEntity> {
    const contractNumber = `CNT-${Date.now()}`;

    const newContract = this.contractRepo.create({
      ...input,
      contractNumber,
      status: ContractStatus.ACTIVE,
    });
    const contract = await this.contractRepo.save(newContract);
    await this.cache.invalidatePattern('contracts:*');
    return contract;
  }

  @Mutation(() => ContractEntity)
  async updateContract(
    @Args('id') id: string,
    @Args('input') input: UpdateContractInput,
  ): Promise<ContractEntity> {
    await this.contractRepo.update(id, input);
    const contract = await this.contractRepo.findOne({
      where: { id },
      relations: ['customer', 'center'],
    });
    if (!contract) throw new NotFoundException('Contract not found');
    await this.cache.invalidatePattern('contracts:*');
    await this.cache.invalidate(`contract:${id}`);
    return contract;
  }

  @Mutation(() => ContractEntity)
  async terminateContract(
    @Args('id') id: string,
  ): Promise<ContractEntity> {
    await this.contractRepo.update(id, { status: ContractStatus.TERMINATED });
    const contract = await this.contractRepo.findOne({
      where: { id },
      relations: ['customer', 'center'],
    });
    if (!contract) throw new NotFoundException('Contract not found');
    await this.cache.invalidatePattern('contracts:*');
    await this.cache.invalidate(`contract:${id}`);
    return contract;
  }
}
