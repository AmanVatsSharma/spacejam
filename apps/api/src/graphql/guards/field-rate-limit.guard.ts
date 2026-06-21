/**
 * File:        apps/api/src/graphql/guards/field-rate-limit.guard.ts
 * Module:      API · GraphQL · Guards
 * Purpose:     Per-field rate limit. Used like:
 *
 *                @UseGuards(FieldRateLimitGuard)
 *                @FieldRateLimit({ name: 'signin', limit: 5, windowSec: 60 })
 *                @Mutation(...) signin(...)
 *
 *             Falls through to Redis via CacheService.increment when a
 *             Redis URL is configured; otherwise uses the in-process
 *             memory store with the same API.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-21
 */
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  SetMetadata,
  createParamDecorator,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';

import { CacheService } from '../../cache/cache.service';

export const FIELD_RATE_LIMIT = 'field_rate_limit';
export interface FieldRateLimitOptions {
  /** Logical bucket name. The full key is `frl:<name>:<clientKey>`. */
  name: string;
  /** Max events within `windowSec`. */
  limit: number;
  /** Sliding window length in seconds. */
  windowSec: number;
  /**
   * When true, the rate limit applies to the full request (not per
   * field) so the guard is reused across multiple mutations in the same
   * client call. Default false.
   */
  shared?: boolean;
}

export const FieldRateLimit = (options: FieldRateLimitOptions) =>
  SetMetadata(FIELD_RATE_LIMIT, options);

/**
 * Resolver argument: pick the rate-limit client key from the request.
 * Default to req.ip, but a method can override by reading args.
 */
export const RateLimitKey = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | null => {
    const gql = GqlExecutionContext.create(ctx);
    const { req } = gql.getContext();
    const fwd = (req?.headers?.['x-forwarded-for'] as string | undefined)
      ?.split(',')[0]
      ?.trim();
    return req?.ip ?? fwd ?? null;
  },
);

@Injectable()
export class FieldRateLimitGuard implements CanActivate {
  private readonly logger = new Logger(FieldRateLimitGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly cache: CacheService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const opts = this.reflector.getAllAndOverride<FieldRateLimitOptions | undefined>(
      FIELD_RATE_LIMIT,
      [ctx.getHandler(), ctx.getClass()],
    );
    if (!opts) return true;
    const gql = GqlExecutionContext.create(ctx);
    const { req } = gql.getContext();
    const clientKey =
      (req?.ip as string | undefined) ??
      (req?.headers?.['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ??
      'anon';
    const key = `frl:${opts.name}:${opts.shared ? 'shared' : clientKey}`;
    const current = await this.cache.increment(key, opts.windowSec);
    if (current > opts.limit) {
      this.logger.warn(
        `[field-rate-limit] blocked: name=${opts.name} client=${clientKey} count=${current}/${opts.limit}`,
      );
      return false;
    }
    return true;
  }
}
