/**
 * File:        apps/api/src/auth/auth.module.ts
 * Module:      API · Auth Module
 * Purpose:     Wires up Passport JWT strategies (access + refresh), the
 *              AuthService, the UserRepository for token validation, the
 *              cache module for session storage, and the throttler for
 *              brute-force protection.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-21
 */

import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { AuthService } from './services/auth.service';
import { EmailService } from './services/email.service';
import { TwoFactorService } from './services/two-factor.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { GqlAuthGuard } from './guards/gql-auth.guard';
import { GqlRefreshAuthGuard } from './guards/gql-refresh-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { User } from '../typeorm/entities/user.entity';
import { UserSession } from '../typeorm/entities/user-session.entity';
import { UserRepository } from '../typeorm/repositories/user.repository';
import { CacheModule } from '../cache/cache.module';
import { AuditService } from './services/audit.service';
import { LockoutService } from './services/lockout.service';
import { PasswordPolicyService } from './services/password-policy.service';
import { RecoveryCodeRepository } from '../typeorm/repositories/recovery-code.repository';
import { RecoveryCode } from '../typeorm/entities/recovery-code.entity';
import { MagicLinkToken } from '../typeorm/entities/magic-link-token.entity';
import { AuditLog } from '../typeorm/entities/audit-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserSession, RecoveryCode, MagicLinkToken, AuditLog]),
    CacheModule,
    PassportModule,
    ThrottlerModule.forRoot([
      // Default bucket — coarse, IP-keyed, applied as a global APP_GUARD
      // so the same throttle protects both REST and GraphQL endpoints.
      { name: 'short', ttl: 1_000, limit: 5 },
      { name: 'medium', ttl: 10_000, limit: 30 },
      { name: 'long', ttl: 60_000, limit: 200 },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '15m'),
          algorithm: 'HS256',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [],
  providers: [
    AuthService,
    EmailService,
    TwoFactorService,
    JwtStrategy,
    JwtRefreshStrategy,
    UserRepository,
    RecoveryCodeRepository,
    AuditService,
    LockoutService,
    PasswordPolicyService,
    // The default ThrottlerGuard can be opted into per-resolver via
    // @Throttle(). We don't enable it globally here because some
    // endpoints (subscriptions) need different rules; auth.service does
    // its own coarse-grained lockout via LockoutService.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: GqlAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  exports: [
    AuthService,
    EmailService,
    TwoFactorService,
    JwtStrategy,
    JwtRefreshStrategy,
    GqlAuthGuard,
    GqlRefreshAuthGuard,
    RolesGuard,
    UserRepository,
    RecoveryCodeRepository,
    AuditService,
    LockoutService,
    PasswordPolicyService,
  ],
})
export class AuthModule {}
