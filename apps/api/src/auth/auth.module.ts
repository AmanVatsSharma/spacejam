/**
 * File:        apps/api/src/auth/auth.module.ts
 * Module:      API · Auth Module
 * Purpose:     JWT authentication configuration
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-07
 */

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '../cache/cache.module';
import { User } from '../typeorm/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    CacheModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '1h'),
          algorithm: 'HS256'
        }
      }),
      inject: [ConfigService]
    })
  ],
  providers: [AuthService],
  exports: [AuthService]
})
export class AuthModule {}