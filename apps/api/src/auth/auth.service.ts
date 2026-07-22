/**
 * File:        apps/api/src/auth/auth.service.ts
 * Module:      API · Auth Service
 * Purpose:     JWT authentication with Redis session storage
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-07
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
// @ts-ignore
import * as bcrypt from 'bcrypt';
import { CacheService } from '../cache/cache.service';
import { UserRole } from '../graphql/types/user.type';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User as UserEntity } from '../typeorm/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private cache: CacheService,
    @InjectRepository(UserEntity)
    private userRepo: Repository<UserEntity>,
  ) {}

  /**
   * Validate user credentials and return JWT tokens
   */
  async login(email: string, password: string, req: any): Promise<any> {
    const user = await this.userRepo.findOne({
      where: { email },
      relations: ['center'],
    });

    if (!user || !user.active) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.userRepo.update(user.id, { lastLoginAt: new Date() } as any);

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      centerId: user.centerId
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    // Store session in Redis
    await this.cache.storeSession(user.id, {
      accessToken,
      refreshToken,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    }, 3600);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as UserRole,
        centerId: user.centerId,
        isActive: user.active
      },
      expiresIn: 3600
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<any> {
    try {
      const payload = this.jwtService.verify(refreshToken);

      // Check if session exists
      const session = await this.cache.getSession(payload.sub);
      if (!session || session.refreshToken !== refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const user = await this.userRepo.findOne({
        where: { id: payload.sub },
        relations: ['center'],
      });

      if (!user || !user.active) {
        throw new UnauthorizedException('User not found');
      }

      const newPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
        centerId: user.centerId
      };

      const accessToken = this.jwtService.sign(newPayload);
      const newRefreshToken = this.jwtService.sign(newPayload, { expiresIn: '7d' });

      // Update session
      await this.cache.storeSession(user.id, {
        accessToken,
        refreshToken: newRefreshToken,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent
      }, 3600);

      return {
        accessToken,
        refreshToken: newRefreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as UserRole,
          centerId: user.centerId,
          isActive: user.active
        },
        expiresIn: 3600
      };
    } catch (err) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Logout - invalidate session
   */
  async logout(token: string): Promise<void> {
    try {
      const payload = this.jwtService.decode(token);
      if (payload?.sub) {
        await this.cache.deleteSession(payload.sub);
      }
    } catch {
      // Token already invalid
    }
  }

  /**
   * Verify email token
   */
  async verifyEmail(token: string): Promise<boolean> {
    // Implementation for email verification
    return true;
  }

  /**
   * Hash password
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  /**
   * Validate user by ID
   */
  async validateUser(userId: string): Promise<any> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        centerId: true,
        active: true,
        phone: true,
        avatar: true,
      },
    });
    return user as any;
  }

  /**
   * Validate user credentials (for Passport)
   */
  async validateUserWithCredentials(email: string, password: string): Promise<any> {
    const user = await this.userRepo.findOne({
      where: { email }
    });

    if (!user || !user.active) {
      return null;
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      centerId: user.centerId
    };
  }
}