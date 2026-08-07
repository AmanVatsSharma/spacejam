/**
 * File:        apps/api/src/graphql/resolvers/crm.resolver.ts
 * Module:      API · GraphQL Resolvers
 * Purpose:     Lead management resolvers
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-21
 */
import { Resolver, Query, Args, Mutation, Context, ID, ObjectType, Field, Int } from '@nestjs/graphql';
import { NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
// @ts-ignore
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { LeadStatus, OnboardingStatus, UserRole } from '../types/user.type';
import { Lead as LeadEntity } from '../../typeorm/entities/lead.entity';
import { Customer as CustomerEntity } from '../../typeorm/entities/customer.entity';
import { Onboarding as OnboardingEntity } from '../../typeorm/entities/onboarding.entity';
import { User as UserEntity } from '../../typeorm/entities/user.entity';
import { CustomerStatus } from '../types/user.type';
import { CreateLeadInput, UpdateLeadInput, LeadFiltersInput } from '../inputs/crm.input';
import { CacheService } from '../../cache/cache.service';
import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { UseGuards } from '@nestjs/common';
import type { JwtPayload } from '../../auth/types/jwt-payload.type';
import { centerScope } from '../../auth/helpers/center-scope.helper';

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
  private readonly logger = new Logger(CrmResolver.name);

  constructor(
    private cache: CacheService,
    private dataSource: DataSource,
    @InjectRepository(LeadEntity)
    private leadRepo: Repository<LeadEntity>,
    @InjectRepository(CustomerEntity)
    private customerRepo: Repository<CustomerEntity>,
    @InjectRepository(OnboardingEntity)
    private onboardingRepo: Repository<OnboardingEntity>,
  ) {}

  @Query(() => [LeadEntity])
  async leads(
    @Args('filters', { nullable: true }) filters?: LeadFiltersInput,
    @CurrentUser() caller?: JwtPayload,
  ): Promise<LeadEntity[]> {
    const where: any = {};
    const scope = caller ? centerScope(caller) : undefined;
    const effectiveCenterId = scope ?? filters?.centerId;
    if (effectiveCenterId) where.centerId = effectiveCenterId;

    if (filters) {
      if (filters.status) where.status = filters.status;
      if (filters.source) where.source = filters.source;
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
   * Provision (or reuse) a login User for the customer being created.
   *
   * - If a User already exists for the email, it is linked (not duplicated).
   * - Otherwise a new MEMBER user is created with a random one-time password.
   *   The plaintext password is returned only via logs (admin-triggered flow);
   *   the customer is expected to reset it via the standard password-reset
   *   flow before first sign-in.
   *
   * Returns the linked user's id (or null if no email was available).
   */
  private async provisionUserForCustomer(
    manager: import('typeorm').EntityManager,
    email: string | undefined,
    name: string | undefined,
    phone?: string | null,
    centerId?: string | null,
  ): Promise<string | null> {
    if (!email) return null;
    const normalized = email.toLowerCase().trim();
    const existing = await manager.findOne(UserEntity, { where: { email: normalized } });
    if (existing) return existing.id;

    const tempPassword = crypto.randomBytes(12).toString('base64url');
    const passwordHash = await bcrypt.hash(tempPassword, 12);
    const user = manager.create(UserEntity, {
      email: normalized,
      name: name ?? normalized.split('@')[0],
      passwordHash,
      role: UserRole.MEMBER,
      active: true,
      emailVerified: false,
      ...(phone ? { phone } : {}),
      ...(centerId ? { centerId } : {}),
    } as any);
    const saved = await manager.save(user);
    this.logger.log(
      `provisioned login user ${saved.id} (${saved.email}) during onboarding`,
    );
    return saved.id;
  }

  /**
   * Convert a lead → customer AND create an onboarding record in one
   * atomic transaction. Returns the converted lead, new customer, and
   * onboarding record so the frontend can navigate straight to the
   * customer detail view.
   *
   * All onboarding fields are optional and default from the lead's existing
   * data. Every collected field is written to BOTH the Customer (denormalised
   * CRM columns) and the Onboarding (paperwork) record so the two stay
   * consistent. A login User is provisioned for the customer email when one
   * does not already exist.
   *
   * Idempotent: re-invoking on an already-converted lead returns the
   * existing Customer + Onboarding pair (repaired if either is missing)
   * and never creates a duplicate Customer.
   */
  @Mutation(() => ConvertLeadResult)
  async convertLeadWithOnboarding(
    @Args('id', { type: () => ID }) id: string,
    @Args('companyName', { nullable: true }) companyName?: string,
    @Args('companyAddress', { nullable: true }) companyAddress?: string,
    @Args('gstNumber', { nullable: true }) gstNumber?: string,
    @Args('companyType', { nullable: true }) companyType?: string,
    @Args('industry', { nullable: true }) industry?: string,
    @Args('website', { nullable: true }) website?: string,
    @Args('employeeCount', { type: () => Int, nullable: true }) employeeCount?: number,
    @Args('planType', { nullable: true }) planType?: string,
    @Args('seatCount', { type: () => Int, nullable: true }) seatCount?: number,
    @Args('contactName', { nullable: true }) contactName?: string,
    @Args('contactEmail', { nullable: true }) contactEmail?: string,
    @Args('contactPhone', { nullable: true }) contactPhone?: string,
    @Args('alternateEmail', { nullable: true }) alternateEmail?: string,
    @Args('alternatePhone', { nullable: true }) alternatePhone?: string,
    @Args('dob', { nullable: true }) dob?: string,
    @Args('emergencyContact', { nullable: true }) emergencyContact?: string,
    @Args('emergencyPhone', { nullable: true }) emergencyPhone?: string,
    @Args('communicationChannel', { nullable: true }) communicationChannel?: string,
    @Args('idProofUrl', { nullable: true }) idProofUrl?: string,
    @Args('agreementUrl', { nullable: true }) agreementUrl?: string,
    @Args('notes', { nullable: true }) notes?: string,
    @Args('provisionLogin', { nullable: true, defaultValue: true }) provisionLogin?: boolean,
  ): Promise<ConvertLeadResult> {
    const lead = await this.leadRepo.findOne({
      where: { id },
      relations: ['assignedTo'],
    });
    if (!lead) throw new NotFoundException('Lead not found');

    // Resolve all overrides once (form value ?? lead value).
    const resolvedName = contactName ?? companyName ?? lead.company ?? lead.name;
    const resolvedEmail = contactEmail ?? lead.email;
    const resolvedPhone = contactPhone ?? lead.phone ?? undefined;
    const resolvedCompany = companyName ?? lead.company ?? undefined;
    const resolvedCompanyAddress = companyAddress ?? lead.location ?? undefined;
    const resolvedPlanType = planType ?? undefined;
    const resolvedNotes = notes ?? lead.notes ?? undefined;

    // Parse DOB (frontend sends an ISO date string) into a Date for the
    // date-typed column; leave undefined on parse failure.
    let dobDate: Date | undefined;
    if (dob) {
      const parsed = new Date(dob);
      if (!Number.isNaN(parsed.getTime())) dobDate = parsed;
    }

    // ── Run Customer/Lead/Onboarding/User writes inside one transaction.
    const { customer, onboarding, customerId, userId } = await this.dataSource.transaction(
      async (manager) => {
        // Idempotency: if the lead is already converted, reuse its customer.
        if (lead.status === LeadStatus.CONVERTED && lead.customerId) {
          const existingCustomer = await manager.findOne(CustomerEntity, {
            where: { id: lead.customerId },
          });
          if (existingCustomer) {
            // Repair a missing onboarding record without creating a new customer.
            let existingOnboarding = await manager.findOne(OnboardingEntity, {
              where: { leadId: id },
              order: { createdAt: 'DESC' },
            });
            if (!existingOnboarding) {
              const repaired = manager.create(OnboardingEntity, {
                leadId: id,
                customerId: existingCustomer.id,
                status: OnboardingStatus.IN_PROGRESS,
                companyName: resolvedCompany,
                companyAddress: resolvedCompanyAddress,
                gstNumber,
                companyType,
                industry,
                website,
                planType: resolvedPlanType,
                seatCount,
                contactName: resolvedName,
                contactEmail: resolvedEmail,
                contactPhone: resolvedPhone,
                emergencyContact,
                emergencyPhone,
                idProofUrl,
                agreementUrl,
                notes: resolvedNotes,
                assignedToId: lead.assignedToId,
                centerId: lead.centerId,
              });
              existingOnboarding = await manager.save(repaired);
            }
            return {
              customer: existingCustomer,
              onboarding: existingOnboarding,
              customerId: existingCustomer.id,
              userId: existingCustomer.userId ?? null,
            };
          }
          // customer missing despite the FK — fall through and rebuild.
        }

        // 1. Provision (or reuse) a login user for the customer.
        let linkedUserId: string | null = null;
        if (provisionLogin) {
          linkedUserId = await this.provisionUserForCustomer(
            manager,
            resolvedEmail,
            resolvedName,
            resolvedPhone ?? null,
            lead.centerId ?? null,
          );
        }

        // 2. Build the customer with lead fields + every onboarding override
        //    so the denormalised CRM columns stay populated.
        const newCustomer = manager.create(CustomerEntity, {
          name: resolvedName,
          email: resolvedEmail,
          phone: resolvedPhone,
          company: resolvedCompany,
          location: resolvedCompanyAddress,
          notes: resolvedNotes,
          centerId: lead.centerId,
          status: CustomerStatus.ACTIVE,
          joinDate: new Date(),
          totalBookings: 0,
          totalSpent: 0,
          // Onboarding-extension columns (mirror of the Onboarding row).
          gstNumber,
          companyAddress: resolvedCompanyAddress,
          companyType,
          employeeCount,
          industry,
          website,
          planType: resolvedPlanType,
          alternateEmail,
          alternatePhone,
          dob: dobDate,
          emergencyContactName: emergencyContact,
          emergencyContactPhone: emergencyPhone,
          communicationChannel,
          userId: linkedUserId,
        } as any);
        const savedCustomer = await manager.save(newCustomer);

        // 3. Mark the lead converted + link the customer.
        await manager.update(
          LeadEntity,
          { id },
          { status: LeadStatus.CONVERTED, customerId: savedCustomer.id },
        );

        // 4. Create the onboarding record with the same set of fields.
        const newOnboarding = manager.create(OnboardingEntity, {
          leadId: id,
          customerId: savedCustomer.id,
          status: OnboardingStatus.IN_PROGRESS,
          companyName: resolvedCompany,
          companyAddress: resolvedCompanyAddress,
          gstNumber,
          planType: resolvedPlanType,
          seatCount,
          contactName: resolvedName,
          contactEmail: resolvedEmail,
          contactPhone: resolvedPhone,
          emergencyContact,
          emergencyPhone,
          idProofUrl,
          agreementUrl,
          notes: resolvedNotes,
          assignedToId: lead.assignedToId,
          centerId: lead.centerId,
        });
        const savedOnboarding = await manager.save(newOnboarding);

        return {
          customer: savedCustomer,
          onboarding: savedOnboarding,
          customerId: savedCustomer.id,
          userId: linkedUserId,
        };
      },
    );

    // 5. Cache invalidation across all affected domains (outside the txn).
    await this.cache.invalidatePattern('leads:*');
    await this.cache.invalidatePattern('customers:*');
    await this.cache.invalidatePattern('onboardings:*');
    if (userId) await this.cache.invalidatePattern('users:*');

    // 6. Re-fetch with relations for the response payload.
    const refreshedLead = await this.leadRepo.findOne({
      where: { id },
      relations: ['assignedTo'],
    });
    const fullOnboarding = await this.onboardingRepo.findOne({
      where: { id: (onboarding as any).id },
      relations: ['lead', 'customer', 'assignedTo', 'center'],
    });
    const fullCustomer = await this.customerRepo.findOne({
      where: { id: customerId },
      relations: ['center'],
    });

    return {
      lead: refreshedLead!,
      customer: fullCustomer ?? customer,
      onboarding: fullOnboarding ?? onboarding,
    };
  }
}
