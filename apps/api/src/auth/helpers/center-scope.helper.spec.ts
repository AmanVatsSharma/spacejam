import { ForbiddenException } from '@nestjs/common';
import { assertCenterAccess, centerScope, requireCenterScope, writeCenterId } from './center-scope.helper';
import { UserRole } from '@enums';

const caller = (role: UserRole, centerId: string | null | undefined, sub = 'u'): any => ({
  sub,
  email: `${sub}@x`,
  role,
  centerId,
  sid: 's',
  typ: 'access',
});
const MANAGER_1 = caller(UserRole.CENTER_MANAGER, 'c1', 'm1');
const MANAGER_NO_CENTER = caller(UserRole.CENTER_MANAGER, undefined, 'm2');
const SUPER = caller(UserRole.SUPER_ADMIN, null, 'a1');

describe('centerScope', () => {
  it('returns the centerId for a CENTER_MANAGER with one assigned', () => {
    expect(centerScope({ sub: 'u1', email: 'm@x', role: UserRole.CENTER_MANAGER, centerId: 'c1', sid: 's', typ: 'access' })).toBe('c1');
  });

  it('returns undefined for a SUPER_ADMIN (no scope restriction)', () => {
    expect(centerScope({ sub: 'u2', email: 'a@x', role: UserRole.SUPER_ADMIN, centerId: null, sid: 's', typ: 'access' })).toBeUndefined();
  });

  it('returns undefined for a CENTER_MANAGER with no centerId (misconfigured)', () => {
    expect(centerScope({ sub: 'u3', email: 'm2@x', role: UserRole.CENTER_MANAGER, centerId: undefined, sid: 's', typ: 'access' })).toBeUndefined();
  });
});

describe('requireCenterScope (fails closed)', () => {
  it('is the manager\'s center, or undefined for a super admin / no caller', () => {
    expect(requireCenterScope(MANAGER_1)).toBe('c1');
    expect(requireCenterScope(SUPER)).toBeUndefined();
    expect(requireCenterScope(undefined)).toBeUndefined();
  });

  it('refuses a manager with no center instead of letting them see every center', () => {
    expect(() => requireCenterScope(MANAGER_NO_CENTER)).toThrow(ForbiddenException);
    expect(() => requireCenterScope(MANAGER_NO_CENTER)).toThrow(/not assigned to a center/);
  });
});

describe('assertCenterAccess', () => {
  it('lets a manager touch records of their own center', () => {
    expect(() => assertCenterAccess(MANAGER_1, 'c1', 'lead')).not.toThrow();
  });

  it('refuses a manager another center\'s record, naming what it was', () => {
    expect(() => assertCenterAccess(MANAGER_1, 'c2', 'lead')).toThrow(ForbiddenException);
    expect(() => assertCenterAccess(MANAGER_1, 'c2', 'lead')).toThrow('This lead belongs to a different center.');
  });

  it('treats a record with no center as a super-admin record — managers cannot reach it by id', () => {
    expect(() => assertCenterAccess(MANAGER_1, null, 'customer')).toThrow(ForbiddenException);
    expect(() => assertCenterAccess(MANAGER_1, undefined, 'customer')).toThrow(ForbiddenException);
  });

  it('never restricts a super admin', () => {
    expect(() => assertCenterAccess(SUPER, 'c9', 'lead')).not.toThrow();
    expect(() => assertCenterAccess(SUPER, null, 'lead')).not.toThrow();
  });

  it('fails closed for a manager with no center', () => {
    expect(() => assertCenterAccess(MANAGER_NO_CENTER, 'c1', 'lead')).toThrow(ForbiddenException);
  });
});

describe('writeCenterId', () => {
  it('puts a manager\'s records in their own center, whether or not they name it', () => {
    expect(writeCenterId(MANAGER_1)).toBe('c1');
    expect(writeCenterId(MANAGER_1, null)).toBe('c1');
    expect(writeCenterId(MANAGER_1, 'c1')).toBe('c1');
  });

  it('refuses a manager who names another center', () => {
    expect(() => writeCenterId(MANAGER_1, 'c2')).toThrow(ForbiddenException);
    expect(() => writeCenterId(MANAGER_1, 'c2')).toThrow('You can only add records to your own center.');
  });

  it('lets a super admin choose freely, or leave it unset', () => {
    expect(writeCenterId(SUPER, 'c7')).toBe('c7');
    expect(writeCenterId(SUPER)).toBeNull();
    expect(writeCenterId(undefined, 'c3')).toBe('c3');
  });

  it('fails closed for a manager with no center', () => {
    expect(() => writeCenterId(MANAGER_NO_CENTER, 'c1')).toThrow(ForbiddenException);
  });
});
