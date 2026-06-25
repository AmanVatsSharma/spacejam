/**
 * File:        auth/auth.module.ts
 * Module:      Api · Auth
 * Purpose:     Wires passport strategies, JWT, GraphQL guards, and providers
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-20
 */
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../typeorm/entities/user.entity';
import { UserSession } from '../typeorm/entities/user-session.entity';
import { UserRepository } from '../typeorm/repositories/user.repository';

import { AuthService } from './services/auth.service';
import { EmailService } from './services/email.service';
import { TwoFactorService } from './services/two-factor.service';

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
    TypeOrmModule.forFeature([User, UserSession, UserRepository]),
  ],
  providers: [
    AuthService,
    EmailService,
    TwoFactorService,
    UserRepository,
    JwtStrategy,
    JwtRefreshStrategy,
  ],
  exports: [AuthService, JwtModule, PassportModule, UserRepository],
})
export class AuthModule {}