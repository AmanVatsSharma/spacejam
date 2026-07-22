/**
 * File:        auth/strategies/jwt-refresh.strategy.ts
 * Module:      Api · Auth · Strategies
 * Purpose:     Passport JWT strategy that validates the long-lived
 *              refresh token and hands the session + user to the resolver.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-20
 */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { UserRepository } from '../../typeorm/repositories/user.repository';
import { UserRole } from '../../graphql/types/user.type';

export interface JwtRefreshPayload {
  sub: string;
  sid: string;
  typ: 'refresh';
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    private readonly users: UserRepository,
    config: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('REFRESH_TOKEN_SECRET') ?? 'dev-refresh-secret',
    });
  }

  async validate(payload: JwtRefreshPayload) {
    if (payload.typ !== 'refresh') {
      throw new UnauthorizedException('Wrong token type');
    }
    const user = await this.users.findByIdActive(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User no longer exists or is disabled');
    }
    return {
      id: payload.sub,
      sessionId: payload.sid,
      role: user.role as UserRole,
    };
  }
}