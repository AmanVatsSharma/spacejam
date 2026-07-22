/**
 * File:        apps/api/src/graphql/resolvers/crm.resolver.ts
 * Module:      API · GraphQL Resolvers
 * Purpose:     Lead management resolvers
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-21
 */
import { Resolver, Query, Args, Mutation, Context, ID, ObjectType, Field, Int } from '@nestjs/graphql';
import { NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeadStatus } from '../types/user.type';
import { Lead as LeadEntity } from '../../typeorm/entities/lead.entity';
import { Customer as CustomerEntity } from '../../typeorm/entities/customer.entity';
import { Onboarding as OnboardingEntity } from '../../typeorm/entities/onboarding.entity';
import { CustomerStatus } from '../types/user.type';
import { CreateLeadInput, UpdateLeadInput, LeadFiltersInput } from '../inputs/crm.input';
import { CacheService } from '../../cache/cache.service';

/**
 * Payload for convertLeadWithOnboarding — returns both the new customer
 * and the new onboarding record so the frontend can route directly to
 * the onboarding detail view.
 */
@ObjectType()
export class ConvertLeadResult {
  @Field(() => LeadEntity)
  lead!: LeadEntity;

  @Field(() => CustomerEntity)
  customer!: CustomerEntity;

  @Field(() => OnboardingEntity)
  onboarding!: OnboardingEntity;
}

@Resolver(() => LeadEntity)
export class CrmResolver {
  constructor(
    private cache: CacheService,
    @InjectRepository(LeadEntity)
    private leadRepo: Repository<LeadEntity>,
    @InjectRepository(CustomerEntity)
    private customerRepo: Repository<CustomerEntity>,
    @InjectRepository(OnboardingEntity)
    private onboardingRepo: Repository<OnboardingEntity>,
  ) {}

  @Query(() => [LeadEntity])
  async leads(
    @Args('filters', { nullable: true }) filters?: LeadFiltersInput
  ): Promise<LeadEntity[]> {
    const where: any = {};

    if (filters) {
      if (filters.status) where.status = filters.status;
      if (filters.source) where.source = filters.source;
      if (filters.centerId) where.centerId = filters.centerId;
      if (filters.assignedToId) where.assignedToId = filters.assignedToId;
      if (filters.search) {
        where.name = (await import('typeorm')).Like(`%${filters.search}%`);
      }
    }

    const leads = await this.leadRepo.find({
      where,
      relations: ['assignedTo'],
      order: { createdAt: 'DESC' },
      take: filters?.limit ?? 50,
      skip: filters?.offset ?? 0,
    });

    return leads;
  }

  @Query(() => LeadEntity, { nullable: true })
  async lead(@Args('id', { type: () => ID }) id: string): Promise<LeadEntity | null> {
    const lead = await this.leadRepo.findOne({
      where: { id },
      relations: ['assignedTo'],
    });
    return lead;
  }

  @Mutation(() => LeadEntity)
  async createLead(
    @Args('input') input: CreateLeadInput,
    @Context() context: any
  ): Promise<LeadEntity> {
    const userId = context.req?.user?.id;
    const newLead = this.leadRepo.create({
      ...input,
      ...(userId ? { assignedToId: userId } : {}),
    });
    const lead = await this.leadRepo.save(newLead);
    await this.cache.invalidatePattern('leads:*');
    return lead;
  }

  @Mutation(() => LeadEntity)
  async updateLead(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateLeadInput
  ): Promise<LeadEntity> {
    await this.leadRepo.update(id, input);
    const lead = await this.leadRepo.findOne({
      where: { id },
      relations: ['assignedTo'],
    });
    if (!lead) throw new NotFoundException('Lead not found');
    await this.cache.invalidatePattern('leads:*');
    await this.cache.del(`lead:${id}`);
    return lead;
  }

  @Mutation(() => LeadEntity)
  async convertLead(
    @Args('id', { type: () => ID }) id: string
  ): Promise<LeadEntity> {
    const lead = await this.leadRepo.findOne({
      where: { id },
      relations: ['assignedTo'],
    });
    if (!lead) throw new NotFoundException('Lead not found');

    // Check if already converted
    if (lead.status === LeadStatus.CONVERTED) {
      await this.cache.invalidatePattern('leads:*');
      return lead;
    }

    // Auto-create Customer from lead data
    const newCustomer = this.customerRepo.create({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      location: lead.location,
      notes: lead.notes,
      centerId: lead.centerId,
      status: CustomerStatus.ACTIVE,
      joinDate: new Date(),
      totalBookings: 0,
      totalSpent: 0,
    });
    await this.customerRepo.save(newCustomer);

    // Mark lead as converted AND link back to the new customer
    await this.leadRepo.update(id, {
      status: LeadStatus.CONVERTED,
      customerId: newCustomer.id,
    });

    // Invalidate caches
    await this.cache.invalidatePattern('leads:*');
    await this.cache.invalidatePattern('customers:*');

    // Return refreshed lead
    const updatedLead = await this.leadRepo.findOne({
      where: { id },
      relations: ['assignedTo'],
    });
    return updatedLead!;
  }

  @Mutation(() => Boolean)
  async deleteLead(@Args('id', { type: () => ID }) id: string): Promise<boolean> {
    await this.leadRepo.delete(id);
    await this.cache.invalidatePattern('leads:*');
    await this.cache.del(`lead:${id}`);
    return true;
  }

  @Query(() => Number, { description: 'Get count of leads, optionally filtered by status' })
  async leadCount(
    @Args('status', { nullable: true, type: () => LeadStatus }) status?: LeadStatus
  ): Promise<number> {
    const where = status ? { status } : {};
    return this.leadRepo.count({ where });
  }

  /**
   * Convert a lead → customer AND create an onboarding record in one
   * atomic operation. Returns the converted lead, new customer, and
   * onboarding record so the frontend can navigate straight to the
   * onboarding form view.
   *
   * All onboarding fields are optional — they default from the lead's
   * existing data. Only companyName/planType/seatCount are typically
   * changed at conversion time.
   */
  @Mutation(() => ConvertLeadResult)
  async convertLeadWithOnboarding(
    @Args('id', { type: () => ID }) id: string,
    @Args('companyName', { nullable: true }) companyName?: string,
    @Args('companyAddress', { nullable: true }) companyAddress?: string,
    @Args('gstNumber', { nullable: true }) gstNumber?: string,
    @Args('planType', { nullable: true }) planType?: string,
    @Args('seatCount', { type: () => Int, nullable: true }) seatCount?: number,
    @Args('contactName', { nullable: true }) contactName?: string,
    @Args('contactEmail', { nullable: true }) contactEmail?: string,
    @Args('contactPhone', { nullable: true }) contactPhone?: string,
    @Args('emergencyContact', { nullable: true }) emergencyContact?: string,
    @Args('emergencyPhone', { nullable: true }) emergencyPhone?: string,
    @Args('idProofUrl', { nullable: true }) idProofUrl?: string,
    @Args('agreementUrl', { nullable: true }) agreementUrl?: string,
    @Args('notes', { nullable: true }) notes?: string,
  ): Promise<ConvertLeadResult> {
    const lead = await this.leadRepo.findOne({
      where: { id },
      relations: ['assignedTo'],
    });
    if (!lead) throw new NotFoundException('Lead not found');

    // Already-converted path: return existing customer + onboarding if any
    if (lead.status === LeadStatus.CONVERTED) {
      const existingCustomer = await this.customerRepo.findOne({
        where: { id: (lead as any).customerId ?? undefined },
      });
      const existingOnboarding = await this.onboardingRepo.findOne({
        where: { leadId: id },
        relations: ['lead', 'customer', 'assignedTo', 'center'],
        order: { createdAt: 'DESC' },
      });
      if (existingCustomer && existingOnboarding) {
        return {
          lead,
          customer: existingCustomer,
          onboarding: existingOnboarding,
        };
      }
      // Partial state — fall through and rebuild below
    }

    // 1. Build the customer (lead fields + any onboarding overrides)
    const resolvedCustomerName = companyName ?? lead.company ?? lead.name;
    const newCustomer = this.customerRepo.create({
      name: resolvedCustomerName,
      email: contactEmail ?? lead.email,
      phone: contactPhone ?? lead.phone,
      company: companyName ?? lead.company,
      location: companyAddress ?? lead.location,
      notes: notes ?? lead.notes,
      centerId: lead.centerId,
      status: CustomerStatus.ACTIVE,
      joinDate: new Date(),
      totalBookings: 0,
      totalSpent: 0,
    });
    const customer = await this.customerRepo.save(newCustomer);

    // 2. Mark the lead converted + link the customer
    await this.leadRepo.update(id, {
      status: LeadStatus.CONVERTED,
      customerId: customer.id,
    });

    // 3. Create the onboarding record
    const onboarding = this.onboardingRepo.create({
      leadId: id,
      customerId: customer.id,
      status: 'IN_PROGRESS' as any,
      companyName: companyName ?? lead.company,
      companyAddress: companyAddress ?? lead.location,
      gstNumber,
      planType,
      seatCount,
      contactName: contactName ?? lead.name,
      contactEmail: contactEmail ?? lead.email,
      contactPhone: contactPhone ?? lead.phone,
      emergencyContact,
      emergencyPhone,
      idProofUrl,
      agreementUrl,
      notes: notes ?? lead.notes,
      assignedToId: lead.assignedToId,
      centerId: lead.centerId,
    });
    const savedOnboarding = await this.onboardingRepo.save(onboarding);

    // 4. Cache invalidation across all affected domains
    await this.cache.invalidatePattern('leads:*');
    await this.cache.invalidatePattern('customers:*');
    await this.cache.invalidatePattern('onboardings:*');

    // 5. Re-fetch with relations for the response
    const refreshedLead = await this.leadRepo.findOne({
      where: { id },
      relations: ['assignedTo'],
    });
    const fullOnboarding = await this.onboardingRepo.findOne({
      where: { id: (savedOnboarding as any).id },
      relations: ['lead', 'customer', 'assignedTo', 'center'],
    });

    return {
      lead: refreshedLead!,
      customer,
      onboarding: fullOnboarding!,
    };
  }
}
