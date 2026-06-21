/**
 * File:        graphql/resolvers/user.resolver.ts
 * Module:      Api · GraphQL · Resolvers
 * Purpose:     User queries/mutations with role-based authorization
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-20
 */
import { UseGuards } from '@nestjs/common';
import { Args, Context, ID, Mutation, Query, Resolver } from '@nestjs/graphql';

import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { UserRole as EntityUserRole } from '../../auth/roles.enum';
import { JwtPayload } from '../../auth/types/jwt-payload.type';

import { User as UserEntity } from '../../typeorm/entities/user.entity';
import { UserRepository } from '../../typeorm/repositories/user.repository';

import { GqlDataLoaders } from '../dataloaders';
import { User, UserRole, UserRole as GraphqlUserRole } from '../types/user.type';

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

function toGraphqlUser(user: UserEntity): User {
  return {
    id: user.id,
    email: user.email,
    name: user.name ?? '',
    role: toGraphqlRole(user.role),
    centerId: undefined,
    phone: undefined,
    avatar: undefined,
    isActive: user.isActive,
    active: user.isActive,
    emailVerified: user.emailVerified,
    twoFactorEnabled: user.twoFactorEnabled,
    lastLogin: user.lastLogin ?? null,
    lastLoginAt: user.lastLogin ?? null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  } as User;
}

@Resolver(() => User)
@UseGuards(GqlAuthGuard, RolesGuard)
export class UserResolver {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly loaders: GqlDataLoaders,
  ) {}

  @Query(() => User, { description: 'The currently signed-in user' })
  async me(@CurrentUser() current: JwtPayload): Promise<User> {
    // Prefer the DataLoader so this can be batched with sibling `user(id:)`
    // calls in the same request.
    const user = await this.loaders.userById.load(current.sub);
    if (!user) throw new Error('User not found');
    return toGraphqlUser(user);
  }

  @Query(() => [User], { description: 'List all users (admin only)' })
  @Roles(EntityUserRole.ADMIN, EntityUserRole.SUPER_ADMIN, EntityUserRole.CENTER_OWNER)
  async users(
    @Args('limit', { type: () => Number, nullable: true, defaultValue: 50 }) limit: number,
    @Args('offset', { type: () => Number, nullable: true, defaultValue: 0 }) offset: number,
  ): Promise<User[]> {
    const { users } = await this.userRepo.findAll({ limit, offset });
    return users.map(toGraphqlUser);
  }

  @Query(() => User, { description: 'Fetch a user by id (admin only)' })
  @Roles(EntityUserRole.ADMIN, EntityUserRole.SUPER_ADMIN, EntityUserRole.CENTER_OWNER)
  async user(@Args('id', { type: () => ID }) id: string): Promise<User> {
    const user = await this.userRepo.findById(id);
    if (!user) throw new Error('User not found');
    return toGraphqlUser(user);
  }

  @Mutation(() => User, { description: 'Update the current user profile' })
  async updateProfile(
    @CurrentUser() current: JwtPayload,
    @Args('name', { nullable: true }) name?: string,
  ): Promise<User> {
    const user = await this.userRepo.findById(current.sub);
    if (!user) throw new Error('User not found');
    user.name = name ?? user.name;
    const updated = await this.userRepo.update(user.id, { name: user.name });
    if (!updated) throw new Error('Failed to update profile');
    return toGraphqlUser(updated);
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
}