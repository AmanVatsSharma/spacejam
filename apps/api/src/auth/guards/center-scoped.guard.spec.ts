import { CenterScopedGuard } from './center-scoped.guard';
import { CENTER_SCOPED_KEY } from '../decorators/center-scoped.decorator';
import { UserRole } from '../../graphql/types/user.type';
import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

function makeCtx(user: any, args: Record<string, any>) {
  const handler = function () {};
  const testClass = class Test {};
  const reqContext = { req: { user } };
  // The guard calls the real GqlExecutionContext.create(context), which
  // (a) calls context.getType() and (b) rebuilds its host from
  // context.getArgs() — a GraphQL positional [root, args, context, info]
  // array — then maps gqlCtx.getContext()→index 2 and gqlCtx.getArgs()→index 1.
  // So the fake must expose getType() and return that positional array from
  // getArgs(); the guard then sees req.user at getContext() and the args
  // object at getArgs(), exactly as it would in a live GraphQL request.
  const ctx: any = {
    getType: () => 'graphql',
    getArgs: () => [{} /* root */, args, reqContext, {} /* info */],
    getHandler: () => handler,
    getClass: () => testClass,
    // Fallbacks the guard does not rely on once GqlExecutionContext.create
    // runs, kept for completeness of the ExecutionContext shape.
    getContext: () => reqContext,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  };
  return ctx as any;
}

describe('CenterScopedGuard', () => {
  let guard: CenterScopedGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new CenterScopedGuard(reflector);
    // Force the metadata to 'centerId' for all tests.
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('centerId');
  });

  it('passes for a SUPER_ADMIN regardless of the centerId arg', () => {
    const ctx = makeCtx({ sub: 'a', role: UserRole.SUPER_ADMIN, centerId: null }, { centerId: 'c-other' });
    expect(guard.canActivate(ctx as any)).toBe(true);
  });

  it('passes for a CENTER_MANAGER on their own center', () => {
    const ctx = makeCtx({ sub: 'm', role: UserRole.CENTER_MANAGER, centerId: 'c-mine' }, { centerId: 'c-mine' });
    expect(guard.canActivate(ctx as any)).toBe(true);
  });

  it('denies a CENTER_MANAGER touching another center', () => {
    const ctx = makeCtx({ sub: 'm', role: UserRole.CENTER_MANAGER, centerId: 'c-mine' }, { centerId: 'c-other' });
    expect(() => guard.canActivate(ctx as any)).toThrow(ForbiddenException);
  });

  it('denies a CENTER_MANAGER with no centerId claim (misconfigured)', () => {
    const ctx = makeCtx({ sub: 'm', role: UserRole.CENTER_MANAGER, centerId: null }, { centerId: 'c-mine' });
    expect(() => guard.canActivate(ctx as any)).toThrow(ForbiddenException);
  });

  it('passes through when no @CenterScoped metadata is set', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);
    const ctx = makeCtx({ sub: 'm', role: UserRole.CENTER_MANAGER, centerId: 'c-mine' }, { centerId: 'c-other' });
    expect(guard.canActivate(ctx as any)).toBe(true);
  });
});
