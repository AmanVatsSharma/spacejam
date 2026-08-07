/**
 * File:        apps/api/src/graphql/resolvers/statement.resolver.ts
 * Module:      API · GraphQL Resolvers
 * Purpose:     Account statement aggregation (credits, debits, transactions)
 *              over a date range — no dedicated entity, derived from
 *              wallet_transactions + invoices.
 *
 * Author:      Developer
 * Last-updated: 2026-08-05
 */
import { UseGuards } from '@nestjs/common';
import { Query, Resolver, Args, ObjectType, Field, Int } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual } from 'typeorm';

import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../../auth/types/jwt-payload.type';

import { WalletTransaction } from '../../typeorm/entities/wallet-transaction.entity';

@ObjectType()
export class StatementLine {
  @Field() id!: string;
  @Field() date!: Date;
  @Field() description!: string;
  @Field(() => Int, { nullable: true }) credit?: number | null;
  @Field(() => Int, { nullable: true }) debit?: number | null;
  @Field(() => Int) balanceAfter!: number;
}

@ObjectType()
export class AccountStatement {
  @Field(() => String) fromDate!: Date;
  @Field(() => String) toDate!: Date;
  @Field(() => Int) openingBalance!: number;
  @Field(() => Int) closingBalance!: number;
  @Field(() => Int) totalCredits!: number;
  @Field(() => Int) totalDebits!: number;
  @Field(() => [StatementLine]) transactions!: StatementLine[];
}

@Resolver()
@UseGuards(GqlAuthGuard)
export class StatementResolver {
  constructor(
    @InjectRepository(WalletTransaction)
    private readonly txRepo: Repository<WalletTransaction>,
  ) {}

  @Query(() => AccountStatement, {
    description: 'Aggregated wallet statement for a date range',
  })
  async myStatement(
    @CurrentUser() current: JwtPayload,
    @Args('fromDate') fromDate: string,
    @Args('toDate') toDate: string,
  ): Promise<AccountStatement> {
    const from = new Date(fromDate);
    const to = new Date(toDate);

    // Opening balance = balance of the most recent transaction before `from`.
    const beforeTx = await this.txRepo.findOne({
      where: { userId: current.sub, createdAt: LessThanOrEqual(from) },
      order: { createdAt: 'DESC' },
    });
    const openingBalance = beforeTx?.balanceAfter ?? 0;

    const rangeTx = await this.txRepo.find({
      where: { userId: current.sub, createdAt: Between(from, to) },
      order: { createdAt: 'ASC' },
    });

    const totalCredits = rangeTx
      .filter((t) => t.type === 'CREDIT')
      .reduce((s, t) => s + t.amount, 0);
    const totalDebits = rangeTx
      .filter((t) => t.type === 'DEBIT')
      .reduce((s, t) => s + t.amount, 0);
    const closingBalance = rangeTx.length
      ? rangeTx[rangeTx.length - 1].balanceAfter
      : openingBalance;

    const transactions: StatementLine[] = rangeTx.map((t) => ({
      id: t.id,
      date: t.createdAt,
      description: t.description,
      credit: t.type === 'CREDIT' ? t.amount : null,
      debit: t.type === 'DEBIT' ? t.amount : null,
      balanceAfter: t.balanceAfter,
    }));

    return {
      fromDate: from,
      toDate: to,
      openingBalance,
      closingBalance,
      totalCredits,
      totalDebits,
      transactions,
    };
  }
}
