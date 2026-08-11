import { centerScope } from './center-scope.helper';
import { UserRole } from '../../graphql/types/user.type';

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
