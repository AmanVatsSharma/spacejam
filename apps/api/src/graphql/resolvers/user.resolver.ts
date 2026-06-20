/**
 * File:        apps/api/src/graphql/resolvers/user.resolver.ts
 * Module:      API · GraphQL Resolvers
 * Purpose:     User management resolvers
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-07
 */

import { Resolver, Query, Args, Mutation, Context } from '@nestjs/graphql';
import { TypeormService } from '../typeorm/typeorm.service';
import { User, UserRole } from '../types/user.type';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User as UserEntity } from '../../typeorm/entities/user.entity';

@Resolver(() => User)
export class UserResolver {
  constructor(
    private typeorm: TypeormService,
    @InjectRepository(UserEntity)
    private userRepo: Repository<UserEntity>,
  ) {}

  @Query(() => User, { nullable: true })
  async me(@Context() context): Promise<User | null> {
    const userId = context.req.user?.id;
    if (!userId) return null;
    return this.userRepo.findOne({ where: { id: userId } });
  }

  @Query(() => [User])
  async users(): Promise<User[]> {
    return this.userRepo.find({
      where: { isActive: true },
      relations: ['center'],
    });
  }

  @Query(() => User, { nullable: true })
  async user(@Args('id') id: string): Promise<User | null> {
    return this.userRepo.findOne({
      where: { id },
      relations: ['center'],
    });
  }

  @Mutation(() => User)
  async updateUser(
    @Args('id') id: string,
    @Args('input') input: any,
    @Context() context
  ): Promise<User> {
    const currentUser = await this.me(context);
    if (!currentUser || (currentUser.id !== id && currentUser.role !== UserRole.ADMIN)) {
      throw new Error('Unauthorized');
    }

    await this.userRepo.update(id, input);
    return this.userRepo.findOne({ where: { id }, relations: ['center'] });
  }

  @Mutation(() => Boolean)
  async deleteUser(
    @Args('id') id: string,
    @Context() context
  ): Promise<boolean> {
    const currentUser = await this.me(context);
    if (!currentUser || currentUser.role !== UserRole.ADMIN) {
      throw new Error('Unauthorized');
    }

    await this.userRepo.update(id, { isActive: false });
    return true;
  }
}