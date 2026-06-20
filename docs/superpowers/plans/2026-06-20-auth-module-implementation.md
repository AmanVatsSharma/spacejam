# Auth Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the SpaceJam auth module end-to-end: wire up the missing backend pieces (JwtStrategy, guards, register, password reset, 2FA stub, RBAC), build the frontend AuthProvider + Apollo Client + useAuth hook + working signin/signup/forgot/reset pages, and protect `/dashboard/*` with Next.js middleware.

**Architecture:**
- Backend: NestJS + GraphQL + Passport JWT + Redis sessions + httpOnly cookies. New strategies, guards, decorators, and a 2FA stub. DTOs with class-validator.
- Frontend: Next.js 16 (App Router) + React 19 + Apollo Client + httpOnly cookies + edge JWT verification via `jose` in middleware. Hand-written typed GraphQL operations (no codegen).
- Transport: GraphQL over httpOnly cookies. Tokens: access (15m, JWT_SECRET) + refresh (7d, REFRESH_TOKEN_SECRET).
- Protection: Next.js middleware decodes access cookie on `/dashboard/*` requests; 401 from any resolver triggers refresh via Apollo link.

**Tech Stack:**
- Backend: NestJS 11, @nestjs/passport, passport-jwt, @nestjs/jwt, bcrypt, ioredis, class-validator, otplib, cookie-parser, nodemailer
- Frontend: Next.js 16, React 19, @apollo/client, jose, react-hook-form, zod

---

## File Structure

### Backend (apps/api/src/auth/)

```
auth/
├── auth.module.ts                # MODIFIED: register new providers
├── auth.service.ts               # MODIFIED: add register, password reset, 2FA, cookie writing
├── strategies/
│   ├── jwt.strategy.ts           # NEW: passport-jwt for access tokens
│   └── jwt-refresh.strategy.ts   # NEW: passport-jwt for refresh tokens
├── guards/
│   ├── gql-auth.guard.ts         # NEW: GraphQL wrapper for AuthGuard('jwt')
│   ├── gql-refresh-auth.guard.ts # NEW: GraphQL wrapper for AuthGuard('jwt-refresh')
│   └── roles.guard.ts            # NEW: reads @Roles() metadata
├── decorators/
│   ├── public.decorator.ts       # NEW: marks resolver as bypassing auth
│   ├── current-user.decorator.ts # NEW: extracts user from GQL context
│   └── roles.decorator.ts        # NEW: sets required roles
├── dto/
│   └── auth.dto.ts               # NEW: all input DTOs
├── email/
│   └── email.service.ts          # NEW: SMTP wrapper (console in dev)
├── two-factor/
│   └── two-factor.service.ts     # NEW: TOTP + backup codes
├── auth.resolver.ts              # MODIFIED: add mutations, apply guards
└── auth.service.spec.ts          # NEW: unit tests
```

### Backend (other)

```
apps/api/src/
├── main.ts                                       # MODIFIED: add cookieParser
├── app.module.ts                                 # MODIFIED: nothing major
├── graphql/resolvers/user.resolver.ts            # MODIFIED: use guards + decorators
├── graphql/resolvers/auth.resolver.ts            # REPLACED
├── graphql/types/user.type.ts                    # MODIFIED: extend AuthPayload, add 2FA fields
├── typeorm/entities/user.entity.ts               # MODIFIED: add 2FA columns
├── scripts/seed-admin.ts                         # NEW: seed initial admin
└── *.env.example                                 # MODIFIED: add new env vars

apps/api/package.json                             # MODIFIED: add deps
```

### Frontend (apps/web/src/)

```
src/
├── middleware.ts                                 # NEW: /dashboard/* protection
├── middleware.test.ts                            # NEW: tests
├── lib/
│   ├── apollo/
│   │   ├── client.ts                             # NEW: Apollo Client factory
│   │   ├── refresh-link.ts                       # NEW: 401 → refresh → retry
│   │   └── error-link.ts                         # NEW: log + format
│   └── graphql/
│       ├── operations.ts                         # NEW: GQL strings
│       └── types.ts                              # NEW: TS types
├── context/
│   └── AuthProvider.tsx                          # NEW: auth context
├── hooks/
│   ├── useAuth.ts                                # NEW: useContext wrapper
│   └── useAuth.test.ts                           # NEW: tests
├── components/
│   └── auth/
│       ├── SigninForm.tsx                        # NEW: client form
│       ├── SignupForm.tsx                        # NEW
│       ├── ForgotPasswordForm.tsx                # NEW
│       ├── ResetPasswordForm.tsx                 # NEW
│       └── TwoFactorPrompt.tsx                   # NEW
└── app/
    ├── layout.tsx                                # MODIFIED: wrap in providers
    ├── dashboard/layout.tsx                      # MODIFIED: use useAuth
    └── (auth)/
        ├── signin/page.tsx                       # MODIFIED: thin shell
        ├── signup/page.tsx                       # MODIFIED: thin shell
        ├── forgot-password/page.tsx              # NEW
        └── reset-password/page.tsx               # NEW

apps/web/.env.example                             # NEW
apps/web/package.json                             # MODIFIED: add deps
```

---

## Task 1: Add backend dependencies

**Files:**
- Modify: `apps/api/package.json`
- Modify: `apps/web/package.json`

- [ ] **Step 1: Add backend dependencies**

In `apps/api/package.json`, add to `dependencies`:
```json
"@nestjs/passport": "^10.0.0",
"passport": "^0.7.0",
"passport-jwt": "^4.0.1",
"cookie-parser": "^1.4.7",
"otplib": "^12.0.1",
"qrcode": "^1.5.4",
"nodemailer": "^6.9.0",
"class-validator": "^0.14.1",
"class-transformer": "^0.5.1"
```

Add to `devDependencies`:
```json
"@types/passport-jwt": "^4.0.1",
"@types/cookie-parser": "^1.4.7",
"@types/qrcode": "^1.5.5",
"@types/nodemailer": "^6.4.16"
```

- [ ] **Step 2: Add frontend dependencies**

In `apps/web/package.json`, add to `dependencies`:
```json
"@apollo/client": "^3.11.0",
"graphql": "^16.9.0",
"jose": "^5.9.0",
"react-hook-form": "^7.53.0",
"zod": "^3.23.0",
"@hookform/resolvers": "^3.9.0"
```

Add to `devDependencies`:
```json
"vitest": "^2.1.0",
"@vitejs/plugin-react": "^4.3.0",
"@testing-library/react": "^16.0.0",
"@testing-library/jest-dom": "^6.5.0",
"jsdom": "^25.0.0"
```

- [ ] **Step 3: Install**

```bash
cd "/c/Users/ASUS TUF A15/Desktop/DevOPS/Workspace/spacejam" && npm install
```

Expected: install completes without errors. Lockfile updated.

- [ ] **Step 4: Verify types compile**

```bash
cd "/c/Users/ASUS TUF A15/Desktop/DevOPS/Workspace/spacejam" && npx nx sync
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
cd "/c/Users/ASUS TUF A15/Desktop/DevOPS/Workspace/spacejam" && git add apps/api/package.json apps/web/package.json package.json package-lock.json && git commit -m "chore(deps): add auth dependencies for backend and frontend"
```

---

## Task 2: Update environment variables

**Files:**
- Modify: `apps/api/.env.example`
- Create: `apps/web/.env.example`

- [ ] **Step 1: Update apps/api/.env.example**

Append these lines to `apps/api/.env.example`:
```
# Refresh token (different from JWT_SECRET)
REFRESH_TOKEN_SECRET=replace-with-a-different-32-byte-secret-key-here

# Cookie configuration
COOKIE_DOMAIN=localhost
COOKIE_SECURE=false

# Two-factor
TWO_FACTOR_ISSUER=SpaceJam

# SMTP (used in dev as console.log only)
SMTP_FROM=noreply@spacejam.local
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=

# Initial admin (used by seed script)
SEED_ADMIN_EMAIL=admin@spacejam.local
SEED_ADMIN_PASSWORD=ChangeMe123!
```

- [ ] **Step 2: Create apps/web/.env.example**

Create `apps/web/.env.example` with:
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:3001/api/graphql

# Server-side only — used by middleware to verify access tokens
# Must match JWT_SECRET in apps/api/.env
JWT_SECRET=replace-with-same-secret-as-backend
```

- [ ] **Step 3: Update apps/api/.env locally** (manual — the user must do this)

Note: Update `apps/api/.env` (not the example) with the new `REFRESH_TOKEN_SECRET`, `COOKIE_DOMAIN`, `COOKIE_SECURE` values. This file is gitignored; the implementer should add the same `REFRESH_TOKEN_SECRET` to `apps/web/.env.local` later in the frontend tasks.

- [ ] **Step 4: Commit**

```bash
cd "/c/Users/ASUS TUF A15/Desktop/DevOPS/Workspace/spacejam" && git add apps/api/.env.example apps/web/.env.example && git commit -m "chore(env): add auth-related env vars for backend and frontend"
```

---

## Task 3: Update User entity with 2FA fields

**Files:**
- Modify: `apps/api/src/typeorm/entities/user.entity.ts`

- [ ] **Step 1: Add 2FA columns to User entity**

Edit `apps/api/src/typeorm/entities/user.entity.ts`. After the existing `emailVerified` field (around line 60), add:

```typescript
  @Column({ name: 'twoFactorEnabled', default: false })
  twoFactorEnabled!: boolean;

  @Column({ name: 'twoFactorSecret', nullable: true, select: false })
  twoFactorSecret!: string | null;

  @Column({ name: 'twoFactorBackupCodes', type: 'text', array: true, nullable: true, select: false })
  twoFactorBackupCodes!: string[] | null;
```

- [ ] **Step 2: Verify it compiles**

```bash
cd "/c/Users/ASUS TUF A15/Desktop/DevOPS/Workspace/spacejam" && npx nx build api --skip-nx-cache 2>&1 | tail -20
```

Expected: no compile errors. Existing 2FA fields are nullable so existing rows in the DB won't break.

- [ ] **Step 3: Commit**

```bash
cd "/c/Users/ASUS TUF A15/Desktop/DevOPS/Workspace/spacejam" && git add apps/api/src/typeorm/entities/user.entity.ts && git commit -m "feat(api): add 2FA columns to user entity"
```

---

## Task 4: Add decorators (public, current-user, roles)

**Files:**
- Create: `apps/api/src/auth/decorators/public.decorator.ts`
- Create: `apps/api/src/auth/decorators/current-user.decorator.ts`
- Create: `apps/api/src/auth/decorators/roles.decorator.ts`

- [ ] **Step 1: Create public.decorator.ts**

Create `apps/api/src/auth/decorators/public.decorator.ts` with the standard 9-line header (use `Last-updated: 2026-06-20`):

```typescript
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

- [ ] **Step 2: Create roles.decorator.ts**

Create `apps/api/src/auth/decorators/roles.decorator.ts` with the standard header:

```typescript
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../graphql/types/user.type';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
```

- [ ] **Step 3: Create current-user.decorator.ts**

Create `apps/api/src/auth/decorators/current-user.decorator.ts` with the standard header:

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req.user;
  },
);
```

- [ ] **Step 4: Verify it compiles**

```bash
cd "/c/Users/ASUS TUF A15/Desktop/DevOPS/Workspace/spacejam" && npx nx build api --skip-nx-cache 2>&1 | tail -10
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
cd "/c/Users/ASUS TUF A15/Desktop/DevOPS/Workspace/spacejam" && git add apps/api/src/auth/decorators/ && git commit -m "feat(api): add auth decorators (Public, Roles, CurrentUser)"
```

---

## Task 5: Add JwtStrategy and JwtRefreshStrategy

**Files:**
- Create: `apps/api/src/auth/strategies/jwt.strategy.ts`
- Create: `apps/api/src/auth/strategies/jwt-refresh.strategy.ts`

- [ ] **Step 1: Create jwt.strategy.ts**

Create `apps/api/src/auth/strategies/jwt.strategy.ts` with the standard header:

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User as UserEntity } from '../../typeorm/entities/user.entity';
import { CacheService } from '../../cache/cache.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  centerId: string | null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private config: ConfigService,
    private cache: CacheService,
    @InjectRepository(UserEntity)
    private userRepo: Repository<UserEntity>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: any) => req?.cookies?.sj_access ?? null,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET')!,
    });
  }

  async validate(payload: JwtPayload): Promise<UserEntity> {
    // Verify session exists in Redis (defence against revoked tokens)
    const session = await this.cache.getSession(payload.sub);
    if (!session) {
      throw new UnauthorizedException('Session expired');
    }

    const user = await this.userRepo.findOne({
      where: { id: payload.sub },
      relations: ['center'],
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return user;
  }
}
```

- [ ] **Step 2: Create jwt-refresh.strategy.ts**

Create `apps/api/src/auth/strategies/jwt-refresh.strategy.ts` with the standard header:

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '../../cache/cache.service';
import { JwtPayload } from './jwt.strategy';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    private config: ConfigService,
    private cache: CacheService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: any) => req?.cookies?.sj_refresh ?? null,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('REFRESH_TOKEN_SECRET')!,
      passReqToCallback: true,
    });
  }

  async validate(req: any, payload: JwtPayload): Promise<JwtPayload> {
    const refreshToken =
      req.cookies?.sj_refresh ??
      req.headers.authorization?.replace('Bearer ', '');

    const session = await this.cache.getSession(payload.sub);
    if (!session || session.refreshToken !== refreshToken) {
      throw new UnauthorizedException('Invalid refresh session');
    }

    return payload;
  }
}
```

- [ ] **Step 3: Verify it compiles**

```bash
cd "/c/Users/ASUS TUF A15/Desktop/DevOPS/Workspace/spacejam" && npx nx build api --skip-nx-cache 2>&1 | tail -10
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
cd "/c/Users/ASUS TUF A15/Desktop/DevOPS/Workspace/spacejam" && git add apps/api/src/auth/strategies/ && git commit -m "feat(api): add passport-jwt strategies for access and refresh tokens"
```

---

## Task 6: Add GqlAuthGuard, GqlRefreshAuthGuard, RolesGuard

**Files:**
- Create: `apps/api/src/auth/guards/gql-auth.guard.ts`
- Create: `apps/api/src/auth/guards/gql-refresh-auth.guard.ts`
- Create: `apps/api/src/auth/guards/roles.guard.ts`

- [ ] **Step 1: Create gql-auth.guard.ts**

Create `apps/api/src/auth/guards/gql-auth.guard.ts` with the standard header:

```typescript
import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class GqlAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }
}
```

- [ ] **Step 2: Create gql-refresh-auth.guard.ts**

Create `apps/api/src/auth/guards/gql-refresh-auth.guard.ts` with the standard header:

```typescript
import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class GqlRefreshAuthGuard extends AuthGuard('jwt-refresh') {
  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }
}
```

- [ ] **Step 3: Create roles.guard.ts**

Create `apps/api/src/auth/guards/roles.guard.ts` with the standard header:

```typescript
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { UserRole } from '../../graphql/types/user.type';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const ctx = GqlExecutionContext.create(context);
    const user = ctx.getContext().req.user;
    if (!user) throw new ForbiddenException('No user in request');

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException(
        `Required role: ${requiredRoles.join(' or ')}, got: ${user.role}`,
      );
    }
    return true;
  }
}
```

- [ ] **Step 4: Register guards globally in app.module.ts**

Edit `apps/api/src/app/app.module.ts`. Add `APP_GUARD` providers:

```typescript
import { APP_GUARD } from '@nestjs/core';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

// ... in providers array, add:
  {
    provide: APP_GUARD,
    useClass: GqlAuthGuard,
  },
  {
    provide: APP_GUARD,
    useClass: RolesGuard,
  },
```

- [ ] **Step 5: Verify it compiles**

```bash
cd "/c/Users/ASUS TUF A15/Desktop/DevOPS/Workspace/spacejam" && npx nx build api --skip-nx-cache 2>&1 | tail -10
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
cd "/c/Users/ASUS TUF A15/Desktop/DevOPS/Workspace/spacejam" && git add apps/api/src/auth/guards/ apps/api/src/app/app.module.ts && git commit -m "feat(api): add GqlAuthGuard, GqlRefreshAuthGuard, RolesGuard"
```

---

## Task 7: Add auth DTOs

**Files:**
- Create: `apps/api/src/auth/dto/auth.dto.ts`

- [ ] **Step 1: Create auth.dto.ts**

Create `apps/api/src/auth/dto/auth.dto.ts` with the standard header:

```typescript
import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsString, MinLength, Matches, IsOptional, IsNotEmpty } from 'class-validator';

const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
const PASSWORD_MESSAGE = 'Password must be at least 8 characters and contain a letter and a number';

@InputType()
export class LoginInput {
  @Field()
  @IsEmail()
  email!: string;

  @Field()
  @IsString()
  password!: string;
}

@InputType()
export class RegisterInput {
  @Field()
  @IsEmail()
  email!: string;

  @Field()
  @IsString()
  @MinLength(1)
  firstName!: string;

  @Field()
  @IsString()
  @MinLength(1)
  lastName!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  phone?: string;

  @Field()
  @IsString()
  @Matches(PASSWORD_REGEX, { message: PASSWORD_MESSAGE })
  password!: string;
}

@InputType()
export class RefreshInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  token?: string;
}

@InputType()
export class ForgotPasswordInput {
  @Field()
  @IsEmail()
  email!: string;
}

@InputType()
export class ResetPasswordInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  token!: string;

  @Field()
  @IsString()
  @Matches(PASSWORD_REGEX, { message: PASSWORD_MESSAGE })
  newPassword!: string;
}

@InputType()
export class ChangePasswordInput {
  @Field()
  @IsString()
  oldPassword!: string;

  @Field()
  @IsString()
  @Matches(PASSWORD_REGEX, { message: PASSWORD_MESSAGE })
  newPassword!: string;
}

@InputType()
export class Verify2FAInput {
  @Field()
  @IsString()
  @Matches(/^\d{6}$/, { message: 'Code must be 6 digits' })
  code!: string;
}
```

- [ ] **Step 2: Verify it compiles**

```bash
cd "/c/Users/ASUS TUF A15/Desktop/DevOPS/Workspace/spacejam" && npx nx build api --skip-nx-cache 2>&1 | tail -10
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd "/c/Users/ASUS TUF A15/Desktop/DevOPS/Workspace/spacejam" && git add apps/api/src/auth/dto/ && git commit -m "feat(api): add auth DTOs with class-validator"
```

---

## Task 8: Add EmailService

**Files:**
- Create: `apps/api/src/auth/email/email.service.ts`

- [ ] **Step 1: Create email.service.ts**

Create `apps/api/src/auth/email/email.service.ts` with the standard header:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly isDev: boolean;

  constructor(private config: ConfigService) {
    this.isDev = this.config.get<string>('NODE_ENV') !== 'production';
  }

  async send(to: string, subject: string, body: string): Promise<void> {
    if (this.isDev) {
      this.logger.log(`[EMAIL STUB] To: ${to}\nSubject: ${subject}\n\n${body}`);
      return;
    }

    // In production, wire up nodemailer here. For now log.
    this.logger.log(`[EMAIL] To: ${to} Subject: ${subject}`);
  }

  async sendPasswordReset(to: string, resetUrl: string): Promise<void> {
    const subject = 'Reset your SpaceJam password';
    const body = `You requested a password reset.

Click the link below to reset your password (valid for 1 hour):

${resetUrl}

If you did not request this, please ignore this email.`;
    await this.send(to, subject, body);
  }

  async sendVerificationEmail(to: string, verifyUrl: string): Promise<void> {
    const subject = 'Verify your SpaceJam email';
    const body = `Welcome to SpaceJam!

Click the link below to verify your email:

${verifyUrl}

This link is valid for 24 hours.`;
    await this.send(to, subject, body);
  }
}
```

- [ ] **Step 2: Verify it compiles**

```bash
cd "/c/Users/ASUS TUF A15/Desktop/DevOPS/Workspace/spacejam" && npx nx build api --skip-nx-cache 2>&1 | tail -10
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd "/c/Users/ASUS TUF A15/Desktop/DevOPS/Workspace/spacejam" && git add apps/api/src/auth/email/ && git commit -m "feat(api): add email service with dev stub"
```

---

## Task 9: Add TwoFactorService

**Files:**
- Create: `apps/api/src/auth/two-factor/two-factor.service.ts`

- [ ] **Step 1: Create two-factor.service.ts**

Create `apps/api/src/auth/two-factor/two-factor.service.ts` with the standard header:

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User as UserEntity } from '../../typeorm/entities/user.entity';

authenticator.options = { window: 1 };

@Injectable()
export class TwoFactorService {
  constructor(
    private config: ConfigService,
    @InjectRepository(UserEntity)
    private userRepo: Repository<UserEntity>,
  ) {}

  generateSecret(user: UserEntity): string {
    return authenticator.generateSecret();
  }

  getOtpAuthUrl(user: UserEntity, secret: string): string {
    const issuer = this.config.get<string>('TWO_FACTOR_ISSUER') || 'SpaceJam';
    return authenticator.keyuri(user.email, issuer, secret);
  }

  async generateQrCodeDataUrl(otpauthUrl: string): Promise<string> {
    return QRCode.toDataURL(otpauthUrl);
  }

  generateBackupCodes(count = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      codes.push(
        Math.random().toString(36).slice(2, 6).toUpperCase() +
          '-' +
          Math.random().toString(36).slice(2, 6).toUpperCase(),
      );
    }
    return codes;
  }

  async hashBackupCodes(codes: string[]): Promise<string[]> {
    return Promise.all(codes.map((c) => bcrypt.hash(c, 10)));
  }

  verifyTotp(secret: string, code: string): boolean {
    return authenticator.verify({ token: code, secret });
  }

  async consumeBackupCode(user: UserEntity, code: string): Promise<boolean> {
    if (!user.twoFactorBackupCodes) return false;
    for (let i = 0; i < user.twoFactorBackupCodes.length; i++) {
      const matches = await bcrypt.compare(code, user.twoFactorBackupCodes[i]);
      if (matches) {
        // Remove the used code
        const updated = [...user.twoFactorBackupCodes];
        updated.splice(i, 1);
        await this.userRepo.update(user.id, { twoFactorBackupCodes: updated });
        return true;
      }
    }
    return false;
  }

  async verify(user: UserEntity, code: string): Promise<boolean> {
    if (!user.twoFactorEnabled || !user.twoFactorSecret) return false;
    if (this.verifyTotp(user.twoFactorSecret, code)) return true;
    return this.consumeBackupCode(user, code);
  }
}
```

- [ ] **Step 2: Verify it compiles**

```bash
cd "/c/Users/ASUS TUF A15/Desktop/DevOPS/Workspace/spacejam" && npx nx build api --skip-nx-cache 2>&1 | tail -10
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd "/c/Users/ASUS TUF A15/Desktop/DevOPS/Workspace/spacejam" && git add apps/api/src/auth/two-factor/ && git commit -m "feat(api): add two-factor auth service (TOTP + backup codes)"
```

---

## Task 10: Extend AuthPayload GraphQL type

**Files:**
- Modify: `apps/api/src/graphql/types/user.type.ts`

- [ ] **Step 1: Add 2FA and password-reset fields to AuthPayload**

In `apps/api/src/graphql/types/user.type.ts`, replace the `AuthPayload` class (lines 359-372) with:

```typescript
@ObjectType()
export class AuthPayload {
  @Field({ nullable: true })
  accessToken?: string;

  @Field({ nullable: true })
  refreshToken?: string;

  @Field(() => User, { nullable: true })
  user?: User;

  @Field({ nullable: true })
  expiresIn?: number;

  @Field({ nullable: true })
  requires2FA?: boolean;

  @Field({ nullable: true })
  twoFactorToken?: string;
}

@ObjectType()
export class TwoFactorSetup {
  @Field()
  secret!: string;

  @Field()
  otpauthUrl!: string;

  @Field()
  qrCodeUrl!: string;

  @Field(() => [String])
  backupCodes!: string[];
}
```

- [ ] **Step 2: Verify it compiles**

```bash
cd "/c/Users/ASUS TUF A15/Desktop/DevOPS/Workspace/spacejam" && npx nx build api --skip-nx-cache 2>&1 | tail -10
```

Expected: no errors. (Existing login/refresh mutations return `accessToken` etc., so making them nullable does not break callers.)

- [ ] **Step 3: Commit**

```bash
cd "/c/Users/ASUS TUF A15/Desktop/DevOPS/Workspace/spacejam" && git add apps/api/src/graphql/types/user.type.ts && git commit -m "feat(api): add 2FA fields to AuthPayload GraphQL type"
```

---

## Task 11: Update AuthService with new methods

**Files:**
- Modify: `apps/api/src/auth/auth.service.ts`

- [ ] **Step 1: Replace auth.service.ts with extended version**

Replace the entire `apps/api/src/auth/auth.service.ts` file. Keep the same 9-line header (update `Last-updated: 2026-06-20`):

```typescript
import { Injectable, UnauthorizedException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { TypeormService } from '../typeorm/typeorm.service';
import { CacheService } from '../cache/cache.service';
import { User, UserRole } from '../graphql/types/user.type';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User as UserEntity } from '../typeorm/entities/user.entity';
import { EmailService } from './email/email.service';
import { TwoFactorService } from './two-factor/two-factor.service';
import { ConfigService } from '@nestjs/config';

const ACCESS_TTL = 15 * 60;
const REFRESH_TTL = 7 * 24 * 60 * 60;
const SESSION_TTL = 60 * 60;

interface SetCookiesOptions {
  res: any;
  accessToken?: string;
  refreshToken?: string;
  twoFactorToken?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private typeorm: TypeormService,
    private jwtService: JwtService,
    private cache: CacheService,
    private config: ConfigService,
    private email: EmailService,
    private twoFactor: TwoFactorService,
    @InjectRepository(UserEntity)
    private userRepo: Repository<UserEntity>,
  ) {}

  private setCookies({ res, accessToken, refreshToken, twoFactorToken }: SetCookiesOptions) {
    const isProd = this.config.get<string>('NODE_ENV') === 'production';
    const baseOpts = {
      httpOnly: true,
      secure: this.config.get<string>('COOKIE_SECURE') === 'true',
      sameSite: 'lax' as const,
      path: '/',
      domain: this.config.get<string>('COOKIE_DOMAIN') || undefined,
    };

    if (accessToken) {
      res.cookie('sj_access', accessToken, { ...baseOpts, maxAge: ACCESS_TTL * 1000 });
    }
    if (refreshToken) {
      res.cookie('sj_refresh', refreshToken, { ...baseOpts, maxAge: REFRESH_TTL * 1000 });
    }
    if (twoFactorToken) {
      res.cookie('sj_2fa', twoFactorToken, { ...baseOpts, maxAge: 5 * 60 * 1000 });
    }
  }

  private clearCookies(res: any) {
    const isProd = this.config.get<string>('NODE_ENV') === 'production';
    const baseOpts = {
      httpOnly: true,
      secure: this.config.get<string>('COOKIE_SECURE') === 'true',
      sameSite: 'lax' as const,
      path: '/',
      domain: this.config.get<string>('COOKIE_DOMAIN') || undefined,
    };
    res.clearCookie('sj_access', baseOpts);
    res.clearCookie('sj_refresh', baseOpts);
    res.clearCookie('sj_2fa', baseOpts);
  }

  private buildAuthPayload(user: UserEntity, accessToken: string, refreshToken: string) {
    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as UserRole,
        centerId: user.centerId,
        isActive: user.isActive,
        phone: user.phone,
        avatar: user.avatar,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      },
      expiresIn: ACCESS_TTL,
    };
  }

  async login(email: string, password: string, req: any): Promise<any> {
    const user = await this.userRepo.findOne({
      where: { email },
      relations: ['center'],
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.twoFactorEnabled) {
      const twoFactorToken = this.jwtService.sign(
        { sub: user.id, scope: '2fa' },
        { expiresIn: '5m' },
      );
      this.setCookies({ res: req.res, twoFactorToken });
      return { requires2FA: true, twoFactorToken };
    }

    await this.userRepo.update(user.id, { lastLogin: new Date() });

    const payload = { sub: user.id, email: user.email, role: user.role, centerId: user.centerId };
    const accessToken = this.jwtService.sign(payload, { expiresIn: ACCESS_TTL });
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.config.get<string>('REFRESH_TOKEN_SECRET'),
      expiresIn: REFRESH_TTL,
    });

    await this.cache.storeSession(user.id, {
      accessToken,
      refreshToken,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    }, SESSION_TTL);

    this.setCookies({ res: req.res, accessToken, refreshToken });
    return this.buildAuthPayload(user, accessToken, refreshToken);
  }

  async register(input: { email: string; password: string; firstName: string; lastName: string; phone?: string }, req: any): Promise<any> {
    const existing = await this.userRepo.findOne({ where: { email: input.email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await this.hashPassword(input.password);
    const name = `${input.firstName} ${input.lastName}`.trim();

    const user = this.userRepo.create({
      email: input.email,
      name,
      phone: input.phone ?? null,
      passwordHash,
      role: UserRole.MEMBER,
      isActive: true,
    });
    await this.userRepo.save(user);

    // Auto-login after register
    return this.login(input.email, input.password, req);
  }

  async refreshToken(refreshToken: string, req: any): Promise<any> {
    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.config.get<string>('REFRESH_TOKEN_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const session = await this.cache.getSession(payload.sub);
    if (!session || session.refreshToken !== refreshToken) {
      throw new UnauthorizedException('Invalid refresh session');
    }

    const user = await this.userRepo.findOne({ where: { id: payload.sub } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found');
    }

    const newPayload = { sub: user.id, email: user.email, role: user.role, centerId: user.centerId };
    const newAccessToken = this.jwtService.sign(newPayload, { expiresIn: ACCESS_TTL });
    const newRefreshToken = this.jwtService.sign(newPayload, {
      secret: this.config.get<string>('REFRESH_TOKEN_SECRET'),
      expiresIn: REFRESH_TTL,
    });

    await this.cache.storeSession(user.id, {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
    }, SESSION_TTL);

    this.setCookies({ res: req.res, accessToken: newAccessToken, refreshToken: newRefreshToken });
    return this.buildAuthPayload(user, newAccessToken, newRefreshToken);
  }

  async logout(req: any): Promise<void> {
    try {
      const token = req.cookies?.sj_access ?? req.headers?.authorization?.replace('Bearer ', '');
      if (token) {
        const payload: any = this.jwtService.decode(token);
        if (payload?.sub) {
          await this.cache.deleteSession(payload.sub);
        }
      }
    } catch {
      // ignore
    }
    this.clearCookies(req.res);
  }

  async verifyEmail(token: string): Promise<boolean> {
    try {
      const payload: any = this.jwtService.verify(token);
      await this.userRepo.update(payload.sub, { emailVerified: true });
      return true;
    } catch {
      return false;
    }
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { email } });
    // Always return silently to avoid email enumeration
    if (!user) return;

    const token = this.jwtService.sign(
      { sub: user.id, scope: 'reset' },
      { expiresIn: '1h' },
    );
    const baseUrl = this.config.get<string>('WEB_URL') || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;
    await this.email.sendPasswordReset(user.email, resetUrl);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    let payload: any;
    try {
      payload = this.jwtService.verify(token);
    } catch {
      throw new BadRequestException('Invalid or expired reset token');
    }
    if (payload.scope !== 'reset') {
      throw new BadRequestException('Invalid token type');
    }

    const passwordHash = await this.hashPassword(newPassword);
    await this.userRepo.update(payload.sub, { passwordHash });
    // Invalidate all sessions for this user
    await this.cache.deleteSession(payload.sub);
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const valid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Current password is incorrect');

    const passwordHash = await this.hashPassword(newPassword);
    await this.userRepo.update(userId, { passwordHash });
    // Invalidate other sessions
    await this.cache.deleteSession(userId);
  }

  async enable2FA(userId: string): Promise<{ secret: string; otpauthUrl: string; qrCodeUrl: string; backupCodes: string[] }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const secret = this.twoFactor.generateSecret(user);
    const otpauthUrl = this.twoFactor.getOtpAuthUrl(user, secret);
    const qrCodeUrl = await this.twoFactor.generateQrCodeDataUrl(otpauthUrl);
    const backupCodes = this.twoFactor.generateBackupCodes(10);
    const hashedCodes = await this.twoFactor.hashBackupCodes(backupCodes);

    // Store secret & codes; mark enabled only after verify2FA
    await this.userRepo.update(userId, {
      twoFactorSecret: secret,
      twoFactorBackupCodes: hashedCodes,
    });

    return { secret, otpauthUrl, qrCodeUrl, backupCodes };
  }

  async confirmEnable2FA(userId: string, code: string): Promise<boolean> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user || !user.twoFactorSecret) {
      throw new BadRequestException('2FA setup not started');
    }
    if (!this.twoFactor.verifyTotp(user.twoFactorSecret, code)) {
      throw new UnauthorizedException('Invalid code');
    }
    await this.userRepo.update(userId, { twoFactorEnabled: true });
    return true;
  }

  async verify2FA(twoFactorToken: string, code: string, req: any): Promise<any> {
    let payload: any;
    try {
      payload = this.jwtService.verify(twoFactorToken);
    } catch {
      throw new UnauthorizedException('Invalid 2FA token');
    }
    if (payload.scope !== '2fa') {
      throw new UnauthorizedException('Invalid 2FA token');
    }

    const user = await this.userRepo.findOne({ where: { id: payload.sub } });
    if (!user) throw new UnauthorizedException('User not found');

    const valid = await this.twoFactor.verify(user, code);
    if (!valid) throw new UnauthorizedException('Invalid code');

    await this.userRepo.update(user.id, { lastLogin: new Date() });
    const newPayload = { sub: user.id, email: user.email, role: user.role, centerId: user.centerId };
    const accessToken = this.jwtService.sign(newPayload, { expiresIn: ACCESS_TTL });
    const refreshToken = this.jwtService.sign(newPayload, {
      secret: this.config.get<string>('REFRESH_TOKEN_SECRET'),
      expiresIn: REFRESH_TTL,
    });

    await this.cache.storeSession(user.id, {
      accessToken,
      refreshToken,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    }, SESSION_TTL);

    this.setCookies({ res: req.res, accessToken, refreshToken });
    this.clearCookies2fa(req.res);
    return this.buildAuthPayload(user, accessToken, refreshToken);
  }

  private clearCookies2fa(res: any) {
    const baseOpts = {
      httpOnly: true,
      secure: this.config.get<string>('COOKIE_SECURE') === 'true',
      sameSite: 'lax' as const,
      path: '/',
      domain: this.config.get<string>('COOKIE_DOMAIN') || undefined,
    };
    res.clearCookie('sj_2fa', baseOpts);
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async validateUser(userId: string): Promise<User | null> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: {
        id: true, email: true, name: true, role: true,
        centerId: true, isActive: true, phone: true, avatar: true,
      },
    });
    return user as User | null;
  }

  async validateUserWithCredentials(email: string, password: string): Promise<any> {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user || !user.isActive) return null;
    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) return null;
    return {
      id: user.id, email: user.email, name: user.name, role: user.role, centerId: user.centerId,
    };
  }
}
```

- [ ] **Step 2: Verify it compiles**

```bash
cd "/c/Users/ASUS TUF A15/Desktop/DevOPS/Workspace/spacejam" && npx nx build api --skip-nx-cache 2>&1 | tail -20
```

Expected: no errors. If you see errors about `WEB_URL` config, that's fine — it has a default. The TS build is the gate.

- [ ] **Step 3: Commit**

```bash
cd "/c/Users/ASUS TUF A15/Desktop/DevOPS/Workspace/spacejam" && git add apps/api/src/auth/auth.service.ts && git commit -m "feat(api): extend AuthService with register, password reset, 2FA, cookie management"
```

---

## Task 12: Update AuthResolver with new mutations

**Files:**
- Modify: `apps/api/src/graphql/resolvers/auth.resolver.ts`

- [ ] **Step 1: Replace auth.resolver.ts with full version**

Replace the entire file. Keep the standard 9-line header (update `Last-updated: 2026-06-20`):

```typescript
import { Resolver, Mutation, Args, Context } from '@nestjs/graphql';
import { AuthService } from '../../auth/auth.service';
import { AuthPayload, TwoFactorSetup, User } from '../types/user.type';
import {
  LoginInput, RegisterInput, RefreshInput,
  ForgotPasswordInput, ResetPasswordInput,
  ChangePasswordInput, Verify2FAInput,
} from '../../auth/dto/auth.dto';
import { Public } from '../../auth/decorators/public.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { UseGuards } from '@nestjs/common';
import { GqlRefreshAuthGuard } from '../../auth/guards/gql-refresh-auth.guard';
import { User as UserEntity } from '../../typeorm/entities/user.entity';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Mutation(() => AuthPayload)
  async login(@Args('input') input: LoginInput, @Context() context): Promise<AuthPayload> {
    return this.authService.login(input.email, input.password, context.req);
  }

  @Public()
  @Mutation(() => AuthPayload)
  async register(@Args('input') input: RegisterInput, @Context() context): Promise<AuthPayload> {
    return this.authService.register(input, context.req);
  }

  @Public()
  @UseGuards(GqlRefreshAuthGuard)
  @Mutation(() => AuthPayload)
  async refreshToken(
    @Args('input') input: RefreshInput,
    @Context() context,
  ): Promise<AuthPayload> {
    const token = input.token || context.req.cookies?.sj_refresh;
    return this.authService.refreshToken(token, context.req);
  }

  @Mutation(() => Boolean)
  async logout(@Context() context): Promise<boolean> {
    await this.authService.logout(context.req);
    return true;
  }

  @Public()
  @Mutation(() => Boolean)
  async verifyEmail(@Args('token') token: string): Promise<boolean> {
    return this.authService.verifyEmail(token);
  }

  @Public()
  @Mutation(() => Boolean)
  async forgotPassword(@Args('input') input: ForgotPasswordInput): Promise<boolean> {
    await this.authService.forgotPassword(input.email);
    return true;
  }

  @Public()
  @Mutation(() => Boolean)
  async resetPassword(@Args('input') input: ResetPasswordInput): Promise<boolean> {
    await this.authService.resetPassword(input.token, input.newPassword);
    return true;
  }

  @Mutation(() => Boolean)
  async changePassword(
    @Args('input') input: ChangePasswordInput,
    @CurrentUser() user: UserEntity,
  ): Promise<boolean> {
    await this.authService.changePassword(user.id, input.oldPassword, input.newPassword);
    return true;
  }

  @Mutation(() => TwoFactorSetup)
  async enable2FA(@CurrentUser() user: UserEntity): Promise<TwoFactorSetup> {
    return this.authService.enable2FA(user.id);
  }

  @Mutation(() => Boolean)
  async confirmEnable2FA(
    @Args('code') code: string,
    @CurrentUser() user: UserEntity,
  ): Promise<boolean> {
    return this.authService.confirmEnable2FA(user.id, code);
  }

  @Public()
  @Mutation(() => AuthPayload)
  async verify2FA(
    @Args('twoFactorToken') twoFactorToken: string,
    @Args('input') input: Verify2FAInput,
    @Context() context,
  ): Promise<AuthPayload> {
    return this.authService.verify2FA(twoFactorToken, input.code, context.req);
  }
}
```

- [ ] **Step 2: Verify it compiles**

```bash
cd "/c/Users/ASUS TUF A15/Desktop/DevOPS/Workspace/spacejam" && npx nx build api --skip-nx-cache 2>&1 | tail -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd "/c/Users/ASUS TUF A15/Desktop/DevOPS/Workspace/spacejam" && git add apps/api/src/graphql/resolvers/auth.resolver.ts && git commit -m "feat(api): expand AuthResolver with register, password reset, 2FA mutations"
```

---

## Task 13: Update UserResolver to use guards

**Files:**
- Modify: `apps/api/src/graphql/resolvers/user.resolver.ts`

- [ ] **Step 1: Replace user.resolver.ts with guarded version**

Replace the entire file. Keep the standard 9-line header (update `Last-updated: 2026-06-20`):

```typescript
import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { TypeormService } from '../../typeorm/typeorm.service';
import { User, UserRole } from '../types/user.type';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User as UserEntity } from '../../typeorm/entities/user.entity';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';

@Resolver(() => User)
export class UserResolver {
  constructor(
    private typeorm: TypeormService,
    @InjectRepository(UserEntity)
    private userRepo: Repository<UserEntity>,
  ) {}

  @Query(() => User, { nullable: true })
  async me(@CurrentUser() user: UserEntity): Promise<User | null> {
    return user ? this.userRepo.findOne({ where: { id: user.id }, relations: ['center'] }) : null;
  }

  @Roles(UserRole.ADMIN, UserRole.CENTER_MANAGER)
  @Query(() => [User])
  async users(): Promise<User[]> {
    return this.userRepo.find({
      where: { isActive: true },
      relations: ['center'],
    });
  }

  @Query(() => User, { nullable: true })
  async user(@Args('id') id: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { id }, relations: ['center'] });
  }

  @Mutation(() => User)
  async updateUser(
    @Args('id') id: string,
    @Args('input') input: any,
    @CurrentUser() currentUser: UserEntity,
  ): Promise<User> {
    if (currentUser.id !== id && currentUser.role !== UserRole.ADMIN) {
      throw new Error('You can only update your own profile or be an admin');
    }
    await this.userRepo.update(id, input);
    return this.userRepo.findOne({ where: { id }, relations: ['center'] });
  }

  @Roles(UserRole.ADMIN)
  @Mutation(() => Boolean)
  async deleteUser(@Args('id') id: string): Promise<boolean> {
    await this.userRepo.update(id, { isActive: false });
    return true;
  }
}
```

- [ ] **Step 2: Verify it compiles**

```bash
cd "/c/Users/ASUS TUF A15/Desktop/DevOPS/Workspace/spacejam" && npx nx build api --skip-nx-cache 2>&1 | tail -10
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd "/c/Users/ASUS TUF A15/Desktop/DevOPS/Workspace/spacejam" && git add apps/api/src/graphql/resolvers/user.resolver.ts && git commit -m "feat(api): use GqlAuthGuard and Roles decorator in UserResolver"
```

---

## Task 14: Register new providers in AuthModule

**Files:**
- Modify: `apps/api/src/auth/auth.module.ts`

- [ ] **Step 1: Update auth.module.ts**

Replace the entire file. Keep the standard 9-line header (update `Last-updated: 2026-06-20`):

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '../cache/cache.module';
import { User } from '../typeorm/entities/user.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { EmailService } from './email/email.service';
import { TwoFactorService } from './two-factor/two-factor.service';

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
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '15m'),
          algorithm: 'HS256',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    JwtRefreshStrategy,
    EmailService,
    TwoFactorService,
  ],
  exports: [AuthService, EmailService, TwoFactorService],
})
export class AuthModule {}
```

- [ ] **Step 2: Verify it compiles**

```bash
cd "/c/Users/ASUS TUF A15/Desktop/DevOPS/Workspace/spacejam" && npx nx build api --skip-nx-cache 2>&1 | tail -20
```

Expected: no errors. The API now boots with all auth providers wired.

- [ ] **Step 3: Commit**

```bash
cd "/c/Users/ASUS TUF A15/Desktop/DevOPS/Workspace/spacejam" && git add apps/api/src/auth/auth.module.ts && git commit -m "feat(api): register JwtStrategy, JwtRefreshStrategy, EmailService, TwoFactorService in AuthModule"
```

---

## Task 15: Add cookie-parser to main.ts

**Files:**
- Modify: `apps/api/src/main.ts`

- [ ] **Step 1: Add cookieParser middleware**

In `apps/api/src/main.ts`, add the import and middleware. After the existing imports (around line 12), add:

```typescript
import * as cookieParser from 'cookie-parser';
```

Then, after the `ValidationPipe` block (around line 33), add:

```typescript
  // Cookie parser for httpOnly auth cookies
  app.use(cookieParser());
```

- [ ] **Step 2: Verify it compiles**

```bash
cd "/c/Users/ASUS TUF A15/Desktop/DevOPS/Workspace/spacejam" && npx nx build api --skip-nx-cache 2>&1 | tail -10
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd "/c/Users/ASUS TUF A15/Desktop/DevOPS/Workspace/spacejam" && git add apps/api/src/main.ts && git commit -m "feat(api): add cookie-parser middleware for httpOnly auth cookies"
```

---

## Task 16: Add seed-admin script

**Files:**
- Create: `apps/api/src/scripts/seed-admin.ts`

- [ ] **Step 1: Create scripts directory and seed-admin.ts**

Create `apps/api/src/scripts/seed-admin.ts`. Use the standard 9-line header:

```typescript
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../app/app.module';
import { User } from '../typeorm/entities/user.entity';
import { UserRole } from '../graphql/types/user.type';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const userRepo = dataSource.getRepository(User);

  const email = process.env.SEED_ADMIN_EMAIL || 'admin@spacejam.local';
  const password = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!';

  const existing = await userRepo.findOne({ where: { email } });
  if (existing) {
    console.log(`[seed-admin] Admin already exists: ${email}`);
    await app.close();
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const admin = userRepo.create({
    email,
    name: 'SpaceJam Admin',
    passwordHash,
    role: UserRole.ADMIN,
    isActive: true,
    emailVerified: true,
  });
  await userRepo.save(admin);

  console.log(`[seed-admin] Created admin user: ${email}`);
  console.log(`[seed-admin] Password: ${password}`);
  console.log(`[seed-admin] ⚠️  Change the password after first login!`);

  await app.close();
}

bootstrap().catch((err) => {
  console.error('[seed-admin] Failed:', err);
  process.exit(1);
});
```

- [ ] **Step 2: Verify it compiles**

```bash
cd "/c/Users/ASUS TUF A15/Desktop/DevOPS/Workspace/spacejam" && npx tsc --noEmit -p apps/api/tsconfig.app.json 2>&1 | tail -10
```

Expected: no errors (or it may complain about top-level await — fine, the file uses an async wrapper).

- [ ] **Step 3: Commit**

```bash
cd "/c/Users/ASUS TUF A15/Desktop/DevOPS/Workspace/spacejam" && git add apps/api/src/scripts/ && git commit -m "feat(api): add seed-admin script for first-time admin creation"
```

---

## Task 17: Add auth.service.spec.ts unit tests

**Files:**
- Create: `apps/api/src/auth/auth.service.spec.ts`

- [ ] **Step 1: Create the test file**

Create `apps/api/src/auth/auth.service.spec.ts` with the standard 9-line header:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User as UserEntity } from '../typeorm/entities/user.entity';
import { CacheService } from '../cache/cache.service';
import { EmailService } from './email/email.service';
import { TwoFactorService } from './two-factor/two-factor.service';
import { TypeormService } from '../typeorm/typeorm.service';
import { UserRole } from '../graphql/types/user.type';

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: Repository<UserEntity>;
  let cache: CacheService;
  let jwtService: JwtService;
  let config: ConfigService;

  const mockUser: Partial<UserEntity> = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    role: UserRole.MEMBER,
    passwordHash: '',
    isActive: true,
    centerId: null,
    twoFactorEnabled: false,
  };

  const mockRes = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  };

  const mockReq = {
    ip: '127.0.0.1',
    headers: { 'user-agent': 'jest' },
    res: mockRes,
    cookies: {},
  };

  beforeEach(async () => {
    mockUser.passwordHash = await bcrypt.hash('Password123', 10);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: CacheService,
          useValue: {
            storeSession: jest.fn().mockResolvedValue(undefined),
            getSession: jest.fn().mockResolvedValue(null),
            deleteSession: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-token'),
            verify: jest.fn(),
            decode: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, def?: string) => {
              const map: Record<string, string> = {
                JWT_SECRET: 'secret',
                REFRESH_TOKEN_SECRET: 'refresh-secret',
                NODE_ENV: 'test',
                COOKIE_SECURE: 'false',
              };
              return map[key] ?? def;
            }),
          },
        },
        {
          provide: EmailService,
          useValue: { sendPasswordReset: jest.fn(), sendVerificationEmail: jest.fn() },
        },
        {
          provide: TwoFactorService,
          useValue: {
            generateSecret: jest.fn().mockReturnValue('SECRET'),
            getOtpAuthUrl: jest.fn().mockReturnValue('otpauth://...'),
            generateQrCodeDataUrl: jest.fn().mockResolvedValue('data:image/png;base64,...'),
            generateBackupCodes: jest.fn().mockReturnValue(['CODE-1', 'CODE-2']),
            hashBackupCodes: jest.fn().mockResolvedValue(['h1', 'h2']),
            verifyTotp: jest.fn().mockReturnValue(true),
            verify: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: TypeormService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepo = module.get<Repository<UserEntity>>(getRepositoryToken(UserEntity));
    cache = module.get<CacheService>(CacheService);
    jwtService = module.get<JwtService>(JwtService);
    config = module.get<ConfigService>(ConfigService);
  });

  describe('login', () => {
    it('returns tokens and sets session for valid credentials', async () => {
      (userRepo.findOne as jest.Mock).mockResolvedValue(mockUser);
      (userRepo.update as jest.Mock).mockResolvedValue(undefined);

      const result = await service.login('test@example.com', 'Password123', mockReq);

      expect(result.accessToken).toBe('mock-token');
      expect(result.refreshToken).toBe('mock-token');
      expect(result.user.email).toBe('test@example.com');
      expect(mockRes.cookie).toHaveBeenCalledWith('sj_access', 'mock-token', expect.any(Object));
      expect(mockRes.cookie).toHaveBeenCalledWith('sj_refresh', 'mock-token', expect.any(Object));
      expect(cache.storeSession).toHaveBeenCalledWith('user-1', expect.any(Object), 3600);
    });

    it('throws UnauthorizedException for wrong password', async () => {
      (userRepo.findOne as jest.Mock).mockResolvedValue(mockUser);
      await expect(
        service.login('test@example.com', 'WrongPassword', mockReq),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException for non-existent user', async () => {
      (userRepo.findOne as jest.Mock).mockResolvedValue(null);
      await expect(
        service.login('nobody@example.com', 'Password123', mockReq),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException for inactive user', async () => {
      (userRepo.findOne as jest.Mock).mockResolvedValue({ ...mockUser, isActive: false });
      await expect(
        service.login('test@example.com', 'Password123', mockReq),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('returns requires2FA when user has 2FA enabled', async () => {
      (userRepo.findOne as jest.Mock).mockResolvedValue({ ...mockUser, twoFactorEnabled: true });
      const result = await service.login('test@example.com', 'Password123', mockReq);
      expect(result.requires2FA).toBe(true);
      expect(result.twoFactorToken).toBe('mock-token');
    });
  });

  describe('register', () => {
    it('creates a new user and auto-logs in', async () => {
      (userRepo.findOne as jest.Mock).mockResolvedValueOnce(null); // no existing user
      (userRepo.findOne as jest.Mock).mockResolvedValueOnce(mockUser); // login lookup
      (userRepo.create as jest.Mock).mockReturnValue(mockUser);
      (userRepo.save as jest.Mock).mockResolvedValue(mockUser);
      (userRepo.update as jest.Mock).mockResolvedValue(undefined);

      const result = await service.register(
        { email: 'new@example.com', password: 'Password123', firstName: 'New', lastName: 'User' },
        mockReq,
      );

      expect(userRepo.create).toHaveBeenCalled();
      expect(userRepo.save).toHaveBeenCalled();
      expect(result.accessToken).toBe('mock-token');
    });

    it('throws ConflictException if email already exists', async () => {
      (userRepo.findOne as jest.Mock).mockResolvedValue(mockUser);
      await expect(
        service.register(
          { email: 'test@example.com', password: 'Password123', firstName: 'A', lastName: 'B' },
          mockReq,
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('refreshToken', () => {
    it('rotates tokens and updates session', async () => {
      (jwtService.verify as jest.Mock).mockReturnValue({ sub: 'user-1' });
      (cache.getSession as jest.Mock).mockResolvedValue({ refreshToken: 'old-token' });
      (userRepo.findOne as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.refreshToken('old-token', mockReq);
      expect(result.accessToken).toBe('mock-token');
      expect(cache.storeSession).toHaveBeenCalledWith('user-1', expect.any(Object), 3600);
    });

    it('throws on invalid token', async () => {
      (jwtService.verify as jest.Mock).mockImplementation(() => {
        throw new Error('invalid');
      });
      await expect(service.refreshToken('bad', mockReq)).rejects.toThrow(UnauthorizedException);
    });

    it('throws if session is missing', async () => {
      (jwtService.verify as jest.Mock).mockReturnValue({ sub: 'user-1' });
      (cache.getSession as jest.Mock).mockResolvedValue(null);
      await expect(service.refreshToken('old-token', mockReq)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('forgotPassword / resetPassword', () => {
    it('forgotPassword sends email when user exists', async () => {
      (userRepo.findOne as jest.Mock).mockResolvedValue(mockUser);
      await service.forgotPassword('test@example.com');
      // EmailService is mocked; just verify it doesn't throw
    });

    it('forgotPassword silently succeeds for non-existent email (no enumeration)', async () => {
      (userRepo.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.forgotPassword('nobody@example.com')).resolves.toBeUndefined();
    });

    it('resetPassword with valid token updates password', async () => {
      (jwtService.verify as jest.Mock).mockReturnValue({ sub: 'user-1', scope: 'reset' });
      await service.resetPassword('valid-token', 'NewPassword123');
      expect(userRepo.update).toHaveBeenCalledWith('user-1', { passwordHash: expect.any(String) });
    });

    it('resetPassword with bad scope throws', async () => {
      (jwtService.verify as jest.Mock).mockReturnValue({ sub: 'user-1', scope: 'login' });
      await expect(service.resetPassword('bad-scope', 'NewPassword123')).rejects.toThrow(BadRequestException);
    });
  });

  describe('changePassword', () => {
    it('throws if old password is wrong', async () => {
      (userRepo.findOne as jest.Mock).mockResolvedValue(mockUser);
      await expect(
        service.changePassword('user-1', 'WrongPassword', 'NewPassword123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('updates password and invalidates session when old is correct', async () => {
      (userRepo.findOne as jest.Mock).mockResolvedValue(mockUser);
      await service.changePassword('user-1', 'Password123', 'NewPassword123');
      expect(userRepo.update).toHaveBeenCalled();
      expect(cache.deleteSession).toHaveBeenCalledWith('user-1');
    });
  });
});
```

- [ ] **Step 2: Run the tests**

```bash
cd "/c/Users/ASUS TUF A15/Desktop/DevOPS/Workspace/spacejam" && npx nx test api --testFile=auth.service.spec.ts 2>&1 | tail -40
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
cd "/c/Users/ASUS TUF A15/Desktop/DevOPS/Workspace/spacejam" && git add apps/api/src/auth/auth.service.spec.ts && git commit -m "test(api): add unit tests for AuthService"
```

---

## Task 18: Create Apollo client setup (frontend)

**Files:**
- Create: `apps/web/src/lib/apollo/client.ts`
- Create: `apps/web/src/lib/apollo/refresh-link.ts`
- Create: `apps/web/src/lib/apollo/error-link.ts`
- Create: `apps/web/src/lib/graphql/operations.ts`
- Create: `apps/web/src/lib/graphql/types.ts`

- [ ] **Step 1: Create lib/graphql/operations.ts**

Create `apps/web/src/lib/graphql/operations.ts` with the standard frontend header (use `Last-updated: 2026-06-20`, no `Author` line — frontend doesn't follow that convention strictly, but include the same shape for consistency):

```typescript
import { gql } from '@apollo/client';

export const ME = gql`
  query Me {
    me {
      id
      email
      name
      role
      centerId
      phone
      avatar
      isActive
      lastLogin
      createdAt
    }
  }
`;

export const LOGIN = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      accessToken
      refreshToken
      expiresIn
      user {
        id
        email
        name
        role
        centerId
        isActive
      }
    }
  }
`;

export const REGISTER = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      accessToken
      refreshToken
      expiresIn
      user {
        id
        email
        name
        role
      }
    }
  }
`;

export const REFRESH_TOKEN = gql`
  mutation RefreshToken($input: RefreshInput) {
    refreshToken(input: $input) {
      accessToken
      refreshToken
      expiresIn
      user {
        id
        email
      }
    }
  }
`;

export const LOGOUT = gql`
  mutation Logout {
    logout
  }
`;

export const FORGOT_PASSWORD = gql`
  mutation ForgotPassword($input: ForgotPasswordInput!) {
    forgotPassword(input: $input)
  }
`;

export const RESET_PASSWORD = gql`
  mutation ResetPassword($input: ResetPasswordInput!) {
    resetPassword(input: $input)
  }
`;

export const CHANGE_PASSWORD = gql`
  mutation ChangePassword($input: ChangePasswordInput!) {
    changePassword(input: $input)
  }
`;

export const ENABLE_2FA = gql`
  mutation Enable2FA {
    enable2FA {
      secret
      otpauthUrl
      qrCodeUrl
      backupCodes
    }
  }
`;

export const CONFIRM_ENABLE_2FA = gql`
  mutation ConfirmEnable2FA($code: String!) {
    confirmEnable2FA(code: $code)
  }
`;

export const VERIFY_2FA = gql`
  mutation Verify2FA($twoFactorToken: String!, $input: Verify2FAInput!) {
    verify2FA(twoFactorToken: $twoFactorToken, input: $input) {
      accessToken
      refreshToken
      user {
        id
        email
      }
    }
  }
`;
```

- [ ] **Step 2: Create lib/graphql/types.ts**

```typescript
export type UserRole = 'ADMIN' | 'CENTER_MANAGER' | 'MEMBER';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  centerId?: string | null;
  phone?: string | null;
  avatar?: string | null;
  isActive: boolean;
  lastLogin?: string | null;
  createdAt: string;
}

export interface AuthPayload {
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  user?: User;
  requires2FA?: boolean;
  twoFactorToken?: string;
}

export interface TwoFactorSetup {
  secret: string;
  otpauthUrl: string;
  qrCodeUrl: string;
  backupCodes: string[];
}
```

- [ ] **Step 3: Create lib/apollo/error-link.ts**

```typescript
import { onError } from '@apollo/client/link/error';

export const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
  if (graphQLErrors) {
    for (const err of graphQLErrors) {
      // eslint-disable-next-line no-console
      console.warn(`[GraphQL error] ${operation.operationName}: ${err.message}`);
    }
  }
  if (networkError) {
    // eslint-disable-next-line no-console
    console.warn(`[Network error] ${operation.operationName}:`, networkError);
  }
});
```

- [ ] **Step 4: Create lib/apollo/refresh-link.ts**

```typescript
import { ApolloClient, ApolloLink, HttpLink, InMemoryCache, Observable, from } from '@apollo/client';
import { REFRESH_TOKEN } from '../graphql/operations';

const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3001/api/graphql';

// Separate client for refresh — does NOT include refreshLink (avoids recursion)
const refreshClient = new ApolloClient({
  link: new HttpLink({ uri: GRAPHQL_URL, credentials: 'include' }),
  cache: new InMemoryCache(),
});

let inflightRefresh: Promise<unknown> | null = null;

function doRefresh(): Promise<unknown> {
  if (inflightRefresh) return inflightRefresh;
  inflightRefresh = refreshClient
    .mutate({ mutation: REFRESH_TOKEN, variables: { input: {} } })
    .finally(() => {
      inflightRefresh = null;
    });
  return inflightRefresh;
}

export const refreshLink = new ApolloLink((operation, forward) => {
  return new Observable((observer) => {
    const sub = forward(operation).subscribe({
      next: (response) => {
        const isUnauthenticated = response.errors?.some(
          (e) => (e.extensions as any)?.code === 'UNAUTHENTICATED',
        );
        const isRefreshCall = operation.operationName === 'RefreshToken';

        if (isUnauthenticated && !isRefreshCall) {
          doRefresh()
            .then(() => {
              // Retry the original request — browser will send new cookies
              forward(operation).subscribe(observer);
            })
            .catch(() => {
              if (typeof window !== 'undefined') {
                window.location.href = `/signin?from=${encodeURIComponent(
                  window.location.pathname + window.location.search,
                )}`;
              }
              observer.next(response);
            });
        } else {
          observer.next(response);
        }
      },
      error: (err) => observer.error(err),
      complete: () => observer.complete(),
    });
    return () => sub.unsubscribe();
  });
});
```

- [ ] **Step 5: Create lib/apollo/client.ts**

```typescript
import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client';
import { refreshLink } from './refresh-link';
import { errorLink } from './error-link';

const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3001/api/graphql';

const httpLink = new HttpLink({
  uri: GRAPHQL_URL,
  credentials: 'include', // critical: send httpOnly cookies
});

export function makeApolloClient() {
  return new ApolloClient({
    link: from([errorLink, refreshLink, httpLink]),
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: { fetchPolicy: 'cache-and-network' },
    },
  });
}
```

- [ ] **Step 6: Verify it compiles**

```bash
cd "/c/Users/ASUS TUF A15/Desktop/DevOPS/Workspace/spacejam" && npx nx sync && npx tsc --noEmit -p apps/web/tsconfig.json 2>&1 | tail -10
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
cd "/c/Users/ASUS TUF A15/Desktop/DevOPS/Workspace/spacejam" && git add apps/web/src/lib/ && git commit -m "feat(web): add Apollo client with refresh-on-401 link"
```

---

## Task 19: Create AuthProvider and useAuth

**Files:**
- Create: `apps/web/src/context/AuthProvider.tsx`
- Create: `apps/web/src/hooks/useAuth.ts`

- [ ] **Step 1: Create context/AuthProvider.tsx**

```typescript
'use client';

import { createContext, useCallback, useEffect, useState, type ReactNode } from 'react';
import { useApolloClient } from '@apollo/client';
import { ME, LOGIN, REGISTER, LOGOUT, FORGOT_PASSWORD, RESET_PASSWORD, CHANGE_PASSWORD, VERIFY_2FA } from '@/lib/graphql/operations';
import type { User } from '@/lib/graphql/types';

export interface AuthContextValue {
  user: User | null;
  loading: boolean;
  requires2FA: boolean;
  twoFactorToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (input: { email: string; password: string; firstName: string; lastName: string; phone?: string }) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  verify2FA: (code: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const client = useApolloClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFactorToken, setTwoFactorToken] = useState<string | null>(null);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await client.query<{ me: User | null }>({
        query: ME,
        fetchPolicy: 'network-only',
      });
      setUser(data?.me ?? null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { data } = await client.mutate({
        mutation: LOGIN,
        variables: { input: { email, password } },
      });
      const payload = data?.login;
      if (payload?.requires2FA) {
        setRequires2FA(true);
        setTwoFactorToken(payload.twoFactorToken ?? null);
        return;
      }
      setRequires2FA(false);
      setTwoFactorToken(null);
      await refreshUser();
    },
    [client, refreshUser],
  );

  const register = useCallback(
    async (input: { email: string; password: string; firstName: string; lastName: string; phone?: string }) => {
      await client.mutate({ mutation: REGISTER, variables: { input } });
      await refreshUser();
    },
    [client, refreshUser],
  );

  const logout = useCallback(async () => {
    try {
      await client.mutate({ mutation: LOGOUT });
    } finally {
      setUser(null);
      await client.clearStore();
    }
  }, [client]);

  const forgotPassword = useCallback(
    async (email: string) => {
      await client.mutate({ mutation: FORGOT_PASSWORD, variables: { input: { email } } });
    },
    [client],
  );

  const resetPassword = useCallback(
    async (token: string, newPassword: string) => {
      await client.mutate({ mutation: RESET_PASSWORD, variables: { input: { token, newPassword } } });
    },
    [client],
  );

  const changePassword = useCallback(
    async (oldPassword: string, newPassword: string) => {
      await client.mutate({ mutation: CHANGE_PASSWORD, variables: { input: { oldPassword, newPassword } } });
    },
    [client],
  );

  const verify2FA = useCallback(
    async (code: string) => {
      if (!twoFactorToken) throw new Error('No 2FA token');
      await client.mutate({
        mutation: VERIFY_2FA,
        variables: { twoFactorToken, input: { code } },
      });
      setRequires2FA(false);
      setTwoFactorToken(null);
      await refreshUser();
    },
    [client, refreshUser, twoFactorToken],
  );

  return (
    <AuthContext.Provider
      value={{
        user, loading, requires2FA, twoFactorToken,
        login, register, logout,
        forgotPassword, resetPassword, changePassword, verify2FA,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
```

- [ ] **Step 2: Create hooks/useAuth.ts**

```typescript
'use client';

import { useContext } from 'react';
import { AuthContext, type AuthContextValue } from '@/context/AuthProvider';

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
```

- [ ] **Step 3: Verify it compiles**

```bash
cd "/c/Users/ASUS TUF A15/Desktop/DevOPS/Workspace/spacejam" && npx tsc --noEmit -p apps/web/tsconfig.json 2>&1 | tail -10
```

Expected: no errors. If the `@/` path alias isn't configured, add it to `apps/web/tsconfig.json` `compilerOptions.paths`:
```json
"paths": {
  "@/*": ["./src/*"]
}
```

- [ ] **Step 4: Commit**

```bash
cd "/c/Users/ASUS TUF A15/Desktop/DevOPS/Workspace/spacejam" && git add apps/web/src/context/ apps/web/src/hooks/useAuth.ts && git commit -m "feat(web): add AuthProvider context and useAuth hook"
```

---

## Task 20: Add ApolloProvider wrapper to root layout

**Files:**
- Modify: `apps/web/src/app/layout.tsx`

- [ ] **Step 1: Read the current layout**

```bash
cd "/c/Users/ASUS TUF A15/Desktop/DevOPS/Workspace/spacejam" && cat apps/web/src/app/layout.tsx
```

- [ ] **Step 2: Replace the layout with provider-wrapped version**

```typescript
import type { Metadata } from 'next';
import './globals.css';
import { ApolloProvider } from '@apollo/client';
import { AuthProvider } from '@/context/AuthProvider';
import { makeApolloClient } from '@/lib/apollo/client';

export const metadata: Metadata = {
  title: 'SpaceJam',
  description: 'Coworking space management',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const client = makeApolloClient();
  return (
    <html lang="en">
      <body>
        <ApolloProvider client={client}>
          <AuthProvider>{children}</AuthProvider>
        </ApolloProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Verify it compiles**

```bash
cd "/c/Users/ASUS TUF A15/Desktop/DevOPS/Workspace/spacejam" && npx tsc --noEmit -p apps/web/tsconfig.json 2>&1 | tail -10
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
cd "/c/Users/ASUS TUF A15/Desktop/DevOPS/Workspace/spacejam" && git add apps/web/src/app/layout.tsx && git commit -m "feat(web): wrap root layout in ApolloProvider and AuthProvider"
```

---

## Task 21: Create Next.js middleware

**Files:**
- Create: `apps/web/src/middleware.ts`

- [ ] **Step 1: Create middleware.ts**

```typescript
import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? 'dev-fallback-secret-change-me');
const COOKIE_NAME = 'sj_access';

export async function middleware(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const url = req.nextUrl.clone();
  const from = encodeURIComponent(url.pathname + url.search);

  if (!token) {
    url.pathname = '/signin';
    url.searchParams.set('from', from);
    return NextResponse.redirect(url);
  }

  try {
    await jwtVerify(token, JWT_SECRET);
    return NextResponse.next();
  } catch {
    url.pathname = '/signin';
    url.searchParams.set('from', from);
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
```

- [ ] **Step 2: Verify it compiles**

```bash
cd "/c/Users/ASUS TUF A15/Desktop/DevOPS/Workspace/spacejam" && npx tsc --noEmit -p apps/web/tsconfig.json 2>&1 | tail -10
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd "/c/Users/ASUS TUF A15/Desktop/DevOPS/Workspace/spacejam" && git add apps/web/src/middleware.ts && git commit -m "feat(web): add Next.js middleware to protect /dashboard routes"
```

---

## Task 22: Create SigninForm component

**Files:**
- Create: `apps/web/src/components/auth/SigninForm.tsx`
- Modify: `apps/web/src/app/(auth)/signin/page.tsx`

- [ ] **Step 1: Create components/auth/SigninForm.tsx**

```typescript
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button, Input, FormItem, Card, CardHeader, CardTitle, CardBody, useToast } from '@spacejam/ui';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Required'),
});

type FormData = z.infer<typeof schema>;

export function SigninForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/dashboard/inventory';
  const { login, requires2FA, verify2FA, twoFactorToken } = useAuth();
  const toast = useToast();
  const [isPending, setIsPending] = useState(false);
  const [code, setCode] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setIsPending(true);
    try {
      if (requires2FA) {
        await verify2FA(code);
        router.push(from);
        return;
      }
      await login(data.email, data.password);
      router.push(from);
    } catch (err: any) {
      toast.error(err?.message || 'Invalid email or password');
    } finally {
      setIsPending(false);
    }
  };

  if (requires2FA) {
    return (
      <Card variant="outlined" padding="lg" className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Two-factor authentication</CardTitle>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormItem label="6-digit code" error={undefined}>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={6}
                placeholder="123456"
                inputMode="numeric"
                autoFocus
              />
            </FormItem>
            <Button type="submit" loading={isPending} loadingText="Verifying..." fullWidth>
              Verify
            </Button>
          </form>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card variant="outlined" padding="lg" className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
      </CardHeader>
      <CardBody>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FormItem label="Email" error={errors.email?.message}>
            <Input type="email" {...register('email')} autoFocus />
          </FormItem>
          <FormItem label="Password" error={errors.password?.message}>
            <Input type="password" {...register('password')} />
          </FormItem>
          <Button type="submit" loading={isPending} loadingText="Signing in..." fullWidth>
            Sign in
          </Button>
          <div className="flex justify-between text-sm">
            <Link href="/forgot-password" className="text-[#FF6A2F] hover:underline">
              Forgot password?
            </Link>
            <Link href="/signup" className="text-[#FF6A2F] hover:underline">
              Create account
            </Link>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
```

- [ ] **Step 2: Replace signin/page.tsx with thin shell**

```typescript
import { Suspense } from 'react';
import { SigninForm } from '@/components/auth/SigninForm';

export default function SigninPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FBF6F4] p-4">
      <Suspense fallback={<div>Loading...</div>}>
        <SigninForm />
      </Suspense>
    </div>
  );
}
```

- [ ] **Step 3: Verify it compiles**

```bash
cd "/c/Users/ASUS TUF A15/Desktop/DevOPS/Workspace/spacejam" && npx tsc --noEmit -p apps/web/tsconfig.json 2>&1 | tail -10
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
cd "/c/Users/ASUS TUF A15/Desktop/DevOPS/Workspace/spacejam" && git add apps/web/src/components/auth/SigninForm.tsx apps/web/src/app/\(auth\)/signin/ && git commit -m "feat(web): add SigninForm with 2FA support"
```

---

## Task 23: Create SignupForm

**Files:**
- Create: `apps/web/src/components/auth/SignupForm.tsx`
- Modify: `apps/web/src/app/(auth)/signup/page.tsx`

- [ ] **Step 1: Create components/auth/SignupForm.tsx**

```typescript
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button, Input, FormItem, Card, CardHeader, CardTitle, CardBody, useToast } from '@spacejam/ui';

const schema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
  password: z.string().regex(/^(?=.*[A-Za-z])(?=.*\d).{8,}$/, 'Min 8 chars, at least one letter and one number'),
  phone: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function SignupForm() {
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const toast = useToast();
  const [isPending, setIsPending] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setIsPending(true);
    try {
      await registerUser({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
      });
      toast.success('Account created! Welcome to SpaceJam.');
      router.push('/dashboard/inventory');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create account');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Card variant="outlined" padding="lg" className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create account</CardTitle>
      </CardHeader>
      <CardBody>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <FormItem label="First name" error={errors.firstName?.message}>
              <Input {...register('firstName')} autoFocus />
            </FormItem>
            <FormItem label="Last name" error={errors.lastName?.message}>
              <Input {...register('lastName')} />
            </FormItem>
          </div>
          <FormItem label="Email" error={errors.email?.message}>
            <Input type="email" {...register('email')} />
          </FormItem>
          <FormItem label="Phone (optional)" error={errors.phone?.message}>
            <Input type="tel" {...register('phone')} />
          </FormItem>
          <FormItem label="Password" error={errors.password?.message} description="Min 8 chars, letter + number">
            <Input type="password" {...register('password')} />
          </FormItem>
          <Button type="submit" loading={isPending} loadingText="Creating account..." fullWidth>
            Create account
          </Button>
          <div className="text-center text-sm">
            <Link href="/signin" className="text-[#FF6A2F] hover:underline">
              Already have an account? Sign in
            </Link>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
```

- [ ] **Step 2: Replace signup/page.tsx with thin shell**

```typescript
import { SignupForm } from '@/components/auth/SignupForm';

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FBF6F4] p-4">
      <SignupForm />
    </div>
  );
}
```

- [ ] **Step 3: Verify it compiles**

```bash
cd "/c/Users/ASUS TUF A15/Desktop/DevOPS/Workspace/spacejam" && npx tsc --noEmit -p apps/web/tsconfig.json 2>&1 | tail -10
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
cd "/c/Users/ASUS TUF A15/Desktop/DevOPS/Workspace/spacejam" && git add apps/web/src/components/auth/SignupForm.tsx apps/web/src/app/\(auth\)/signup/ && git commit -m "feat(web): add SignupForm with validation"
```

---

## Task 24: Create ForgotPassword and ResetPassword pages

**Files:**
- Create: `apps/web/src/components/auth/ForgotPasswordForm.tsx`
- Create: `apps/web/src/components/auth/ResetPasswordForm.tsx`
- Create: `apps/web/src/app/(auth)/forgot-password/page.tsx`
- Create: `apps/web/src/app/(auth)/reset-password/page.tsx`

- [ ] **Step 1: Create ForgotPasswordForm.tsx**

```typescript
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button, Input, FormItem, Card, CardHeader, CardTitle, CardBody, useToast } from '@spacejam/ui';

export function ForgotPasswordForm() {
  const { forgotPassword } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    try {
      await forgotPassword(email);
      setSubmitted(true);
    } catch {
      toast.error('Failed to send reset email');
    } finally {
      setIsPending(false);
    }
  };

  if (submitted) {
    return (
      <Card variant="outlined" padding="lg" className="w-full max-w-md">
        <CardBody>
          <p className="text-center text-[#1F1F1F]">
            If <strong>{email}</strong> is registered, you'll receive a password reset link shortly.
          </p>
          <div className="mt-4 text-center">
            <Link href="/signin" className="text-[#FF6A2F] hover:underline">
              Back to sign in
            </Link>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card variant="outlined" padding="lg" className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Reset your password</CardTitle>
      </CardHeader>
      <CardBody>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <FormItem label="Email" description="We'll send a reset link to this address">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </FormItem>
          <Button type="submit" loading={isPending} loadingText="Sending..." fullWidth>
            Send reset link
          </Button>
          <div className="text-center text-sm">
            <Link href="/signin" className="text-[#FF6A2F] hover:underline">
              Back to sign in
            </Link>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
```

- [ ] **Step 2: Create ResetPasswordForm.tsx**

```typescript
'use client';

import { useState, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button, Input, FormItem, Card, CardHeader, CardTitle, CardBody, useToast } from '@spacejam/ui';

const schema = z.object({
  password: z.string().regex(/^(?=.*[A-Za-z])(?=.*\d).{8,}$/, 'Min 8 chars, letter + number'),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, { message: 'Passwords must match', path: ['confirm'] });

type FormData = z.infer<typeof schema>;

function ResetPasswordFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const { resetPassword } = useAuth();
  const toast = useToast();
  const [isPending, setIsPending] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setIsPending(true);
    try {
      await resetPassword(token, data.password);
      toast.success('Password reset! Please sign in.');
      router.push('/signin');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to reset password');
    } finally {
      setIsPending(false);
    }
  };

  if (!token) {
    return (
      <Card variant="outlined" padding="lg" className="w-full max-w-md">
        <CardBody>
          <p className="text-center text-[#EF4444]">Invalid or missing reset token.</p>
          <div className="mt-4 text-center">
            <Link href="/forgot-password" className="text-[#FF6A2F] hover:underline">
              Request a new link
            </Link>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card variant="outlined" padding="lg" className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Set a new password</CardTitle>
      </CardHeader>
      <CardBody>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FormItem label="New password" error={errors.password?.message}>
            <Input type="password" {...register('password')} autoFocus />
          </FormItem>
          <FormItem label="Confirm password" error={errors.confirm?.message}>
            <Input type="password" {...register('confirm')} />
          </FormItem>
          <Button type="submit" loading={isPending} loadingText="Resetting..." fullWidth>
            Reset password
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}

export function ResetPasswordForm() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordFormInner />
    </Suspense>
  );
}
```

- [ ] **Step 3: Create forgot-password/page.tsx**

```typescript
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FBF6F4] p-4">
      <ForgotPasswordForm />
    </div>
  );
}
```

- [ ] **Step 4: Create reset-password/page.tsx**

```typescript
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FBF6F4] p-4">
      <ResetPasswordForm />
    </div>
  );
}
```

- [ ] **Step 5: Verify it compiles**

```bash
cd "/c/Users/ASUS TUF A15/Desktop/DevOPS/Workspace/spacejam" && npx tsc --noEmit -p apps/web/tsconfig.json 2>&1 | tail -10
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
cd "/c/Users/ASUS TUF A15/Desktop/DevOPS/Workspace/spacejam" && git add apps/web/src/components/auth/ apps/web/src/app/\(auth\)/forgot-password/ apps/web/src/app/\(auth\)/reset-password/ && git commit -m "feat(web): add forgot-password and reset-password pages"
```

---

## Task 25: Update dashboard layout to use useAuth

**Files:**
- Modify: `apps/web/src/app/dashboard/layout.tsx`

- [ ] **Step 1: Read current dashboard layout**

```bash
cd "/c/Users/ASUS TUF A15/Desktop/DevOPS/Workspace/spacejam" && cat apps/web/src/app/dashboard/layout.tsx
```

- [ ] **Step 2: Add a loading skeleton wrapper**

Edit the existing layout to wrap children in a client-side loader that uses `useAuth`. Add this at the top of the file:

```typescript
'use client';

import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@spacejam/ui';
```

Then, just before `{children}`, add:

```typescript
function DashboardAuthGate({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }
  return <>{children}</>;
}
```

Then wrap `{children}` with `<DashboardAuthGate>{children}</DashboardAuthGate>`.

- [ ] **Step 3: Verify it compiles**

```bash
cd "/c/Users/ASUS TUF A15/Desktop/DevOPS/Workspace/spacejam" && npx tsc --noEmit -p apps/web/tsconfig.json 2>&1 | tail -10
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
cd "/c/Users/ASUS TUF A15/Desktop/DevOPS/Workspace/spacejam" && git add apps/web/src/app/dashboard/layout.tsx && git commit -m "feat(web): add loading gate to dashboard layout using useAuth"
```

---

## Task 26: Add useAuth unit tests

**Files:**
- Create: `apps/web/src/hooks/useAuth.test.ts`

- [ ] **Step 1: Create the test file**

```typescript
import { renderHook, act } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { AuthProvider, AuthContext } from '@/context/AuthProvider';
import { useAuth } from './useAuth';
import { ME } from '@/lib/graphql/operations';
import type { ReactNode } from 'react';

const mockUser = {
  id: 'u1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'MEMBER',
  isActive: true,
  createdAt: '2026-01-01',
};

const meMock = {
  request: { query: ME },
  result: { data: { me: mockUser } },
};

const meErrorMock = {
  request: { query: ME },
  error: new Error('Unauthorized'),
};

function wrapper(mocks: any[] = [meMock]) {
  return ({ children }: { children: ReactNode }) => (
    <MockedProvider mocks={mocks} addTypename={false}>
      <AuthProvider>{children}</AuthProvider>
    </MockedProvider>
  );
}

describe('useAuth', () => {
  it('throws when used outside AuthProvider', () => {
    expect(() => renderHook(() => useAuth())).toThrow(/AuthProvider/);
  });

  it('starts with loading=true and user=null', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: wrapper() });
    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBe(null);
  });

  it('exposes login, logout, register functions', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: wrapper() });
    expect(typeof result.current.login).toBe('function');
    expect(typeof result.current.logout).toBe('function');
    expect(typeof result.current.register).toBe('function');
  });

  it('exposes 2FA state and verify2FA', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: wrapper() });
    expect(result.current.requires2FA).toBe(false);
    expect(result.current.twoFactorToken).toBe(null);
    expect(typeof result.current.verify2FA).toBe('function');
  });
});
```

- [ ] **Step 2: Run the test**

First check whether vitest is configured for apps/web. If not, add it:

```bash
cd "/c/Users/ASUS TUF A15/Desktop/DevOPS/Workspace/spacejam" && cat apps/web/vitest.config.ts 2>/dev/null || echo "no vitest config"
```

If no vitest config exists, create `apps/web/vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

And `apps/web/vitest.setup.ts`:
```typescript
import '@testing-library/jest-dom';
```

Run the test:
```bash
cd "/c/Users/ASUS TUF A15/Desktop/DevOPS/Workspace/spacejam" && cd apps/web && npx vitest run src/hooks/useAuth.test.ts 2>&1 | tail -30
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
cd "/c/Users/ASUS TUF A15/Desktop/DevOPS/Workspace/spacejam" && git add apps/web/src/hooks/useAuth.test.ts apps/web/vitest.config.ts apps/web/vitest.setup.ts apps/web/package.json && git commit -m "test(web): add useAuth unit tests and vitest setup"
```

---

## Task 27: Add middleware test

**Files:**
- Create: `apps/web/src/middleware.test.ts`

- [ ] **Step 1: Create the middleware test**

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { SignJWT } from 'jose';
import { middleware } from './middleware';
import { NextRequest } from 'next/server';

const SECRET = new TextEncoder().encode('test-secret');

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret';
});

async function makeToken(expiresInSeconds = 60): Promise<string> {
  return await new SignJWT({ sub: 'user-1' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(Math.floor(Date.now() / 1000) + expiresInSeconds)
    .setIssuedAt()
    .sign(SECRET);
}

function makeReq(pathname: string, cookieValue?: string): NextRequest {
  const url = `http://localhost:3000${pathname}`;
  const req = new NextRequest(new Request(url));
  if (cookieValue) {
    req.cookies.set('sj_access', cookieValue);
  }
  return req;
}

describe('middleware', () => {
  it('redirects to /signin when no cookie is present', async () => {
    const res = await middleware(makeReq('/dashboard/inventory'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/signin');
    expect(res.headers.get('location')).toContain('from=');
  });

  it('redirects to /signin when cookie is invalid', async () => {
    const res = await middleware(makeReq('/dashboard/inventory', 'garbage'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/signin');
  });

  it('redirects to /signin when cookie is expired', async () => {
    const token = await makeToken(-60); // expired 1 min ago
    const res = await middleware(makeReq('/dashboard/inventory', token));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/signin');
  });

  it('passes through when cookie is valid', async () => {
    const token = await makeToken(60);
    const res = await middleware(makeReq('/dashboard/inventory', token));
    expect(res.status).toBe(200);
  });
});
```

- [ ] **Step 2: Run the test**

```bash
cd "/c/Users/ASUS TUF A15/Desktop/DevOPS/Workspace/spacejam" && cd apps/web && npx vitest run src/middleware.test.ts 2>&1 | tail -30
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
cd "/c/Users/ASUS TUF A15/Desktop/DevOPS/Workspace/spacejam" && git add apps/web/src/middleware.test.ts && git commit -m "test(web): add middleware redirect tests"
```

---

## Task 28: Final integration check

- [ ] **Step 1: Build everything**

```bash
cd "/c/Users/ASUS TUF A15/Desktop/DevOPS/Workspace/spacejam" && npx nx run-many -t build 2>&1 | tail -20
```

Expected: both `web` and `api` build successfully.

- [ ] **Step 2: Run all tests**

```bash
cd "/c/Users/ASUS TUF A15/Desktop/DevOPS/Workspace/spacejam" && npx nx run-many -t test 2>&1 | tail -20
```

Expected: all tests pass.

- [ ] **Step 3: Manual smoke test**

1. Update `apps/api/.env` with the new env vars (REFRESH_TOKEN_SECRET, COOKIE_DOMAIN=localhost, COOKIE_SECURE=false, etc.)
2. Create `apps/web/.env.local` with the same JWT_SECRET as the backend, and NEXT_PUBLIC_GRAPHQL_URL=http://localhost:3001/api/graphql
3. Start the API: `npx nx serve api`
4. Start the web: `npx nx dev web`
5. Visit http://localhost:3000 → should redirect to /signin
6. Visit http://localhost:3000/dashboard/inventory → middleware should redirect to /signin
7. Sign up at /signup with a new account → should land on /dashboard/inventory
8. Open browser devtools → Application → Cookies → should see `sj_access` and `sj_refresh` (httpOnly)
9. Navigate around dashboard → no 401s, user is loaded
10. Click logout (if a logout button exists; otherwise hit /api/graphql with `mutation { logout }`) → cookies cleared, redirect to /signin

- [ ] **Step 4: Document the rollout**

Add a section to `CLAUDE.md` (under "Key Implementation Notes" or new "Auth Module" section):

```markdown
## Auth Module

The auth module is fully wired end-to-end. See `docs/superpowers/specs/2026-06-20-auth-module-design.md` for the design.

**Required env vars** (must match between backend and frontend):
- Backend: `JWT_SECRET`, `REFRESH_TOKEN_SECRET`, `COOKIE_DOMAIN`, `COOKIE_SECURE`
- Frontend: `JWT_SECRET` (must equal backend), `NEXT_PUBLIC_GRAPHQL_URL`

**First-time setup**:
```sh
cd apps/api && npx ts-node src/scripts/seed-admin.ts
# Logs: admin@spacejam.local / $SEED_ADMIN_PASSWORD
```

**Token flow**:
- Login → backend sets `sj_access` (15m) + `sj_refresh` (7d) httpOnly cookies
- Any 401 from a resolver → Apollo `refreshLink` calls `refreshToken` mutation → retries
- Middleware verifies `sj_access` on every `/dashboard/*` request

**RBAC**:
- `@Public()` — skip auth on a resolver
- `@Roles(UserRole.ADMIN)` — restrict to specific roles
- `@CurrentUser()` — inject the logged-in user
```

- [ ] **Step 5: Final commit**

```bash
cd "/c/Users/ASUS TUF A15/Desktop/DevOPS/Workspace/spacejam" && git add CLAUDE.md && git commit -m "docs: document auth module rollout in CLAUDE.md"
```

---

## Summary

**Total tasks:** 28
**New files:** ~25
**Modified files:** ~12
**Test coverage:** AuthService unit tests, useAuth tests, middleware tests
**Estimated time:** 4-6 hours of focused implementation
