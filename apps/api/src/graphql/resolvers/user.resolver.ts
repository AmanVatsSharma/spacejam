/**
 * File:        graphql/resolvers/user.resolver.ts
 * Module:      Api · GraphQL · Resolvers
 * Purpose:     User queries/mutations with role-based authorization
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-04
 */
import { UseGuards, NotFoundException, BadRequestException } from '@nestjs/common';
import { Args, Context, ID, Int, Mutation, Query, Resolver } from '@nestjs/graphql';

import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { UserRole as EntityUserRole } from '../../auth/roles.enum';
import { JwtPayload } from '../../auth/types/jwt-payload.type';

import { User as UserEntity } from '../../typeorm/entities/user.entity';
import { UserSession } from '../../typeorm/entities/user-session.entity';
import { UserRepository } from '../../typeorm/repositories/user.repository';
import { UserSessionRepository } from '../../typeorm/repositories/user-session.repository';

import { UserRole, UserRole as GraphqlUserRole } from '../types/user.type';

/**
 * The entity role taxonomy (5 tiers) is richer than the GraphQL type
 * (3 tiers), so we map to the closest existing GraphQL enum value.
 */
function toGraphqlRole(role: EntityUserRole): GraphqlUserRole {
  if (role === EntityUserRole.SUPER_ADMIN || role === EntityUserRole.ADMIN) return UserRole.ADMIN;
  if (role === EntityUserRole.CENTER_OWNER || role === EntityUserRole.STAFF) return UserRole.CENTER_MANAGER;
  return UserRole.MEMBER;
}

function toEntityRole(role: GraphqlUserRole): EntityUserRole {
  if (role === UserRole.ADMIN) return EntityUserRole.ADMIN;
  if (role === UserRole.CENTER_MANAGER) return EntityUserRole.STAFF;
  return EntityUserRole.MEMBER;
}

@Resolver(() => UserEntity)
@UseGuards(GqlAuthGuard, RolesGuard)
export class UserResolver {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly sessionRepo: UserSessionRepository,
  ) {}

  @Query(() => UserEntity, { description: 'The currently signed-in user' })
  async me(@CurrentUser() current: JwtPayload): Promise<UserEntity> {
    const user = await this.userRepo.findById(current.sub);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  @Query(() => [UserEntity], { description: 'List all users (admin only)' })
  @Roles(EntityUserRole.ADMIN, EntityUserRole.SUPER_ADMIN, EntityUserRole.CENTER_OWNER)
  async users(
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 50 }) limit: number,
    @Args('offset', { type: () => Int, nullable: true, defaultValue: 0 }) offset: number,
  ): Promise<UserEntity[]> {
    const { users } = await this.userRepo.findAll({ limit, offset });
    return users;
  }

  @Query(() => UserEntity, { description: 'Fetch a user by id (admin only)' })
  @Roles(EntityUserRole.ADMIN, EntityUserRole.SUPER_ADMIN, EntityUserRole.CENTER_OWNER)
  async user(@Args('id', { type: () => ID }) id: string): Promise<UserEntity> {
    const user = await this.userRepo.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
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
  async deleteUser(@Args('id', { type: () => ID }) id: string): Promise<boolean> {
    await this.userRepo.delete(id);
    return true;
  }

  @Mutation(() => Boolean, { description: 'Promote/demote a user to a new role (admin only)' })
  @Roles(EntityUserRole.ADMIN, EntityUserRole.SUPER_ADMIN)
  async setUserRole(
    @Args('id', { type: () => ID }) id: string,
    @Args('role', { type: () => UserRole }) role: UserRole,
  ): Promise<boolean> {
    const updated = await this.userRepo.update(id, { role: toEntityRole(role) });
    return !!updated;
  }

  @Mutation(() => Boolean, { description: 'Suspend (active=false) or reinstate (active=true) a user (admin only)' })
  @Roles(EntityUserRole.ADMIN, EntityUserRole.SUPER_ADMIN)
  async setUserActive(
    @Args('id', { type: () => ID }) id: string,
    @Args('active', { type: () => Boolean }) active: boolean,
  ): Promise<boolean> {
    const updated = await this.userRepo.update(id, { active });
    return !!updated;
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
}