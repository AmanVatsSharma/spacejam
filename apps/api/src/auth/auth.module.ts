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
import {
  SMS_PROVIDER,
  ConsoleSmsProvider,
} from './services/sms-provider.interface';
import { AuthResolver } from '../graphql/resolvers/auth.resolver';

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
  ],
  providers: [
    AuthResolver,
    AuthService,
    EmailService,
    TwoFactorService,
    OtpService,
    // Default SMS provider logs the OTP. Swap for a real provider (MSG91 /
    // Twilio / SNS) by overriding this token once keys are configured.
    { provide: SMS_PROVIDER, useClass: ConsoleSmsProvider },
    JwtStrategy,
    JwtRefreshStrategy,
  ],
  exports: [AuthService, OtpService, JwtModule, PassportModule, UserRepositoryModule],
})
export class AuthModule {}
