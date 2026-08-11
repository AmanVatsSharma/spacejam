/**
 * File:        apps/api/src/auth/auth.module.ts
 * Module:      Api · Auth
 * Purpose:     Wires passport strategies, JWT, GraphQL guards, and providers
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-02
 */
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../typeorm/entities/user.entity';
import { UserSession } from '../typeorm/entities/user-session.entity';
import { Customer } from '../typeorm/entities/customer.entity';
import { CustomerEmployee } from '../typeorm/entities/customer-employee.entity';
import { OtpRequest } from '../typeorm/entities/otp-request.entity';
import { UserRepositoryModule } from '../typeorm/repositories/user.repository.module';

import { AuthService } from './services/auth.service';
import { EmailService } from './services/email.service';
import { TwoFactorService } from './services/two-factor.service';
import { OtpService } from './services/otp.service';
import { AuthResolver } from '../graphql/resolvers/auth.resolver';
import { IntegrationsModule } from '../integrations/integrations.module';

import { AuditModule } from './audit.module';
import { AuditService } from './services/audit.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') ?? 'dev-jwt-secret',
        signOptions: { expiresIn: '15m' },
      }),
    }),
    TypeOrmModule.forFeature([User, UserSession, Customer, CustomerEmployee, OtpRequest]),
    UserRepositoryModule,
    // AuditModule provides + exports AuditService (TypeORM-only, no auth dep,
    // so no DI cycle). Imported here so legacy auth consumers keep resolving.
    AuditModule,
    // IntegrationsModule provides the configurable SMS_PROVIDER (reads the
    // chosen provider + API key from the super-admin Integrations settings).
    IntegrationsModule,
  ],
  providers: [
    AuthResolver,
    AuthService,
    EmailService,
    TwoFactorService,
    OtpService,
    JwtStrategy,
    JwtRefreshStrategy,
  ],
  // Re-export AuditModule (not AuditService directly). In this NestJS version
  // the DI validator (Module.validateExportedProvider) only accepts a provider
  // in `exports` if it is in this module's own providers OR appears as an
  // imported module's metatype. Re-exporting the AuditService class token
  // satisfies neither, so we re-export AuditModule, which transitively
  // exposes AuditService to any consumer that imports AuthModule. Center and
  // User modules import AuditModule directly, so they are unaffected.
  exports: [AuthService, OtpService, AuditModule, JwtModule, PassportModule, UserRepositoryModule],
})
export class AuthModule {}
