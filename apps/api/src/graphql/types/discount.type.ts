/**
 * File:        apps/api/src/graphql/types/discount.type.ts
 * Module:      API · GraphQL · Types
 * Purpose:     GraphQL object type for Discount
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-12
 */
import { ObjectType } from '@nestjs/graphql';
import { Discount as DiscountEntity } from '../../typeorm/entities/discount.entity';

@ObjectType()
export class Discount extends DiscountEntity {}