/**
 * File:        auth/strategies/jwt.strategy.ts
 * Module:      Api · Auth · Strategies
 * Purpose:     Passport JWT strategy that validates the short-lived
 *              access token and hydrates `req.user`.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-20
 */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { UserRepository } from '../../typeorm/repositories/user.repository';
import { User, UserRole } from '../../typeorm/entities/user.entity';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  sid: string;
  typ: 'access';
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly users: UserRepository,
    config: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET') ?? 'dev-jwt-secret',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.users.findByIdActive(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User no longer exists or is disabled');
    }
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      sessionId: payload.sid,
    };
  }
}