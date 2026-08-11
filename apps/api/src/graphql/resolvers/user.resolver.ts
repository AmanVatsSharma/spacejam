/**
 * File:        graphql/resolvers/user.resolver.ts
 * Module:      Api · GraphQL · Resolvers
 * Purpose:     User queries/mutations with role-based authorization
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-04
 */
import { UseGuards, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { Args, ID, Int, Mutation, Query, Resolver, ResolveField, Parent } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { UserRole as EntityUserRole } from '../../auth/roles.enum';
import type { JwtPayload } from '../../auth/types/jwt-payload.type';
import { AuditService } from '../../auth/services/audit.service';

import { User as UserEntity } from '../../typeorm/entities/user.entity';
import { UserSession } from '../../typeorm/entities/user-session.entity';
import { Customer } from '../../typeorm/entities/customer.entity';
import { WalletTransaction } from '../../typeorm/entities/wallet-transaction.entity';
import { UserRepository } from '../../typeorm/repositories/user.repository';
import { UserSessionRepository } from '../../typeorm/repositories/user-session.repository';

import { UserRole } from '../types/user.type';
import { CreateAdminInput, DashboardAdminRole } from '../../auth/dto/create-admin.input';
import * as bcrypt from 'bcryptjs';
import { centerScope } from '../../auth/helpers/center-scope.helper';

@Resolver(() => UserEntity)
@UseGuards(GqlAuthGuard, RolesGuard)
export class UserResolver {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly sessionRepo: UserSessionRepository,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    @InjectRepository(WalletTransaction)
    private readonly walletTxRepo: Repository<WalletTransaction>,
    private readonly audit: AuditService,
  ) {}

  /**
   * Resolve the Customer (company) id a user belongs to, by reverse lookup of
   * Customer.userId. Powers the mobile Plans subscribe flow — the client needs
   * to know which company to create the Subscription against.
   */
  @ResolveField(() => String, { nullable: true })
  async customerId(@Parent() user: UserEntity): Promise<string | null> {
    const customer = await this.customerRepo.findOne({
      where: { userId: user.id },
      select: ['id'],
    });
    return customer?.id ?? null;
  }

  @Query(() => UserEntity, { description: 'The currently signed-in user' })
  async me(@CurrentUser() current: JwtPayload): Promise<UserEntity> {
    const user = await this.userRepo.findById(current.sub);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  @Query(() => [UserEntity], { description: 'List all users (admin only)' })
  @Roles(EntityUserRole.ADMIN, EntityUserRole.SUPER_ADMIN, EntityUserRole.CENTER_OWNER, EntityUserRole.CENTER_MANAGER)
  async users(
    @CurrentUser() current: JwtPayload,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 50 }) limit: number,
    @Args('offset', { type: () => Int, nullable: true, defaultValue: 0 }) offset: number,
  ): Promise<UserEntity[]> {
    const scope = centerScope(current);
    const { users } = await this.userRepo.findAll({ limit, offset, centerId: scope });
    return users;
  }

  @Query(() => UserEntity, { description: 'Fetch a user by id (admin only)' })
  @Roles(EntityUserRole.ADMIN, EntityUserRole.SUPER_ADMIN, EntityUserRole.CENTER_OWNER, EntityUserRole.CENTER_MANAGER)
  async user(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() current: JwtPayload,
  ): Promise<UserEntity> {
    const target = await this.userRepo.findById(id);
    if (!target) throw new NotFoundException('User not found');
    // CENTER_MANAGER scope: may only read users in their own center.
    const scope = centerScope(current);
    if (scope && target.centerId !== scope) {
      throw new ForbiddenException('Not allowed to view this user');
    }
    return target;
  }

  @Mutation(() => UserEntity, { description: 'Update the current user profile' })
  async updateProfile(
    @CurrentUser() current: JwtPayload,
    @Args('name', { nullable: true }) name?: string,
  ): Promise<UserEntity> {
    const user = await this.userRepo.findById(current.sub);
    if (!user) throw new NotFoundException('User not found');
    user.name = name ?? user.name;
    const updated = await this.userRepo.update(user.id, { name: user.name });
    if (!updated) throw new BadRequestException('Failed to update profile');
    return updated;
  }

  @Mutation(() => Boolean, { description: 'Soft-delete a user (admin only)' })
  @Roles(EntityUserRole.ADMIN, EntityUserRole.SUPER_ADMIN)
  async deleteUser(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() current: JwtPayload,
  ): Promise<boolean> {
    const target = await this.userRepo.findById(id);
    this.audit.record({
      action: 'USER_DELETE',
      userId: current.sub,
      entityType: 'User',
      entityId: id,
      centerId: target?.centerId ?? null,
    }).catch(() => {});
    await this.userRepo.delete(id);
    return true;
  }

  @Mutation(() => Boolean, { description: 'Promote/demote a user to a new role (admin only)' })
  @Roles(EntityUserRole.ADMIN, EntityUserRole.SUPER_ADMIN)
  async setUserRole(
    @Args('id', { type: () => ID }) id: string,
    @Args('role', { type: () => UserRole }) role: UserRole,
    @CurrentUser() current: JwtPayload,
  ): Promise<boolean> {
    const target = await this.userRepo.findById(id);
    if (!target) throw new NotFoundException('User not found');

    // Prevent self-demotion of the last super admin. The guard fires only
    // when the caller is demoting *themselves* away from SUPER_ADMIN —
    // other admins can still demote a colleague even if that colleague is
    // the last one (an explicit policy decision, not an accident).
    if (
      target.role === EntityUserRole.SUPER_ADMIN &&
      role !== EntityUserRole.SUPER_ADMIN &&
      current.sub === id
    ) {
      const remaining = await this.userRepo.countSuperAdmins();
      if (remaining <= 1) {
        throw new BadRequestException('Cannot demote the last super admin');
      }
    }

    const updated = await this.userRepo.update(id, { role });
    this.audit.record({
      action: 'USER_ROLE_CHANGE',
      userId: current.sub,
      entityType: 'User',
      entityId: id,
      centerId: target.centerId ?? null,
      changes: { from: target.role, to: role },
    }).catch(() => {});
    return !!updated;
  }

  @Mutation(() => Boolean, { description: 'Suspend (active=false) or reinstate (active=true) a user (admin only)' })
  @Roles(EntityUserRole.ADMIN, EntityUserRole.SUPER_ADMIN)
  async setUserActive(
    @Args('id', { type: () => ID }) id: string,
    @Args('active', { type: () => Boolean }) active: boolean,
    @CurrentUser() current: JwtPayload,
  ): Promise<boolean> {
    const target = await this.userRepo.findById(id);
    if (!target) throw new NotFoundException('User not found');
    const updated = await this.userRepo.update(id, { active });
    this.audit.record({
      action: 'USER_ACTIVE_CHANGE',
      userId: current.sub,
      entityType: 'User',
      entityId: id,
      centerId: target.centerId ?? null,
      changes: { active },
    }).catch(() => {});
    return !!updated;
  }

  @Mutation(() => UserEntity, { description: 'Provision a new dashboard admin (SUPER_ADMIN only)' })
  @Roles(EntityUserRole.SUPER_ADMIN)
  async createAdminUser(
    @Args('input') input: CreateAdminInput,
    @CurrentUser() current: JwtPayload,
  ): Promise<UserEntity> {
    // Center managers must be assigned to a center
    if (input.role === DashboardAdminRole.CENTER_MANAGER && !input.centerId) {
      throw new BadRequestException('An Admin (Center Manager) must be assigned to a center');
    }

    const existing = await this.userRepo.findByEmail(input.email);
    if (existing) {
      throw new BadRequestException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    const created = await this.userRepo.create({
      email: input.email,
      name: input.name,
      phone: input.phone,
      passwordHash,
      role: input.role as unknown as EntityUserRole, // DashboardAdminRole values match EntityUserRole
      centerId: input.centerId,
      active: true,
      emailVerified: true, // Auto-verified — account was created by a super admin
    });

    this.audit.record({
      action: 'USER_CREATE',
      userId: current.sub,
      entityType: 'User',
      entityId: created.id,
      centerId: input.centerId ?? null,
      changes: { role: input.role, email: input.email },
    }).catch(() => {});

    return created;
  }

  // ─── Session / Device Management ──────────────────────────────────────────

  @Query(() => [UserSession], {
    description: 'List all active sessions (devices) for the current user',
  })
  async myActiveSessions(@CurrentUser() current: JwtPayload): Promise<UserSession[]> {
    return this.sessionRepo.findActiveByUserId(current.sub);
  }

  @Mutation(() => Boolean, {
    description: 'Log out a single device/session by id',
  })
  async logoutDevice(
    @CurrentUser() current: JwtPayload,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    const session = await this.sessionRepo.findById(id, current.sub);
    if (!session) {
      throw new NotFoundException('Session not found');
    }
    return this.sessionRepo.deactivate(id);
  }

  @Mutation(() => Int, {
    description: 'Log out all active sessions for the current user (returns count of deactivated sessions)',
  })
  async logoutAllDevices(@CurrentUser() current: JwtPayload): Promise<number> {
    // Deactivate all except the current session if available
    const currentSessionId = current.sid;
    return this.sessionRepo.deactivateAllForUser(current.sub, currentSessionId);
  }

  // ─── Wallet & Tokens ──────────────────────────────────────────────────────────

  @Mutation(() => UserEntity, { description: 'Recharge token balance' })
  async rechargeWallet(
    @CurrentUser() current: JwtPayload,
    @Args('amount', { type: () => Int }) amount: number,
  ): Promise<UserEntity> {
    const user = await this.userRepo.findById(current.sub);
    if (!user) throw new NotFoundException('User not found');
    if (amount <= 0) throw new BadRequestException('Amount must be positive');
    
    user.tokenBalance = (user.tokenBalance || 0) + amount;
    const updated = await this.userRepo.update(user.id, { tokenBalance: user.tokenBalance });
    if (!updated) throw new BadRequestException('Failed to update token balance');

    // Record the transaction so it appears in wallet history (mobile WalletScreen).
    await this.walletTxRepo.save({
      userId: user.id,
      type: 'CREDIT',
      amount,
      balanceAfter: user.tokenBalance,
      reference: `recharge-${Date.now()}`,
      description: `Token recharge of ${amount}`,
    });

    return updated;
  }

  // ─── Push Notifications ───────────────────────────────────────────────────────

  @Mutation(() => Boolean, { description: 'Register a device token for push notifications' })
  async registerDeviceToken(
    @CurrentUser() current: JwtPayload,
    @Args('token', { type: () => String }) token: string,
  ): Promise<boolean> {
    const user = await this.userRepo.findById(current.sub);
    if (!user) throw new NotFoundException('User not found');
    
    user.deviceToken = token;
    const updated = await this.userRepo.update(user.id, { deviceToken: token });
    return !!updated;
  }
}