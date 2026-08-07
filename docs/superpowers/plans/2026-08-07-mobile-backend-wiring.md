# Mobile ↔ Backend Full Wiring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the SpaceJam mobile app fully wired to the live NestJS backend — no mock data, no broken/non-functional UI — with a real two-step login where the OTP is hardcoded to `000000`, silent token refresh, and any missing backend resolvers built.

**Architecture:** Backend-first. Complete the half-built two-factor auth scaffold (challenge token + `verifyTwoFactor` with a dev-gated `000000` bypass), fix relation-loading and a `userId`-resolution bug in the booking resolver, add the one genuinely-missing `extendBooking` mutation, and verify every other resolver's field shape. Then build mobile infra (silent refresh link, aligned operations). Then fix the 6 crashing screens so the app boots, then wire the 13 mock screens to real operations, then polish the 3 already-wired screens. Verify continuously with `tsc`, backend-boot curl checks, and a mobile build.

**Tech Stack:** NestJS (code-first GraphQL) + TypeORM + JWT/otplib on backend; React Native (Expo) + Apollo Client + React Navigation on mobile.

## Global Constraints

- **OTP bypass must be env-gated:** `OTP_DEV_BYPASS` defaults to `false`; the `000000` acceptance path only runs when `true`. Never hardcode-accept in prod.
- **No real PSP / no real OTP sender:** payment mutation marks invoice/booking paid without a real gateway; OTP is `000000` only. Both are agreed dev paths.
- **No UI redesign:** keep existing visuals/animations; this is connecting UI to data.
- **Field names are the verified truth:** `WalletTransaction.description` (not `title`); `Notification.message` (not `body`); bookings use `startDate`/`endDate` (not `date`/`startTime`/`endTime`); `Offer` has no `tags`/`color` (derive client-side).
- **Token TTLs:** access 15m, refresh 7d (30d with rememberMe). Mobile MUST silently refresh.
- **Navigation targets:** valid Stack names are listed in AppNavigator (e.g. `MainTabs`, `EventSuccess`, `PrintSuccess`, `Payment`, `BookingDetails`). `BookingSuccess` does NOT exist. `HomeTab`/`EventsTab`/`MyBookingsTab`/`ProfileTab` are tab-internal only — from a Stack screen navigate to `MainTabs`, not `HomeTab`.
- **Import discipline:** `Skeleton` is imported from `'../components/Skeleton'` (NOT from the barrel). `useSpringEntrance`, `useFadeIn`, etc. live in `'../theme/animations'`. Theme tokens in `'../theme/tokens'`.
- **Backend has TWO `auth.service.ts` files** — only `apps/api/src/auth/services/auth.service.ts` is live (imported by the resolver). Ignore `apps/api/src/auth/auth.service.ts` (legacy/dead).

---

## File Structure

### Backend — create / modify
- **Modify** `apps/api/src/auth/services/auth.service.ts` — add `signChallengeToken`/`verifyChallengeToken`, complete `signin` 2FA branch, implement `verifyTwoFactor`, re-inject `TwoFactorService`.
- **Modify** `apps/api/src/auth/auth.module.ts` — un-comment `TwoFactorService` provider.
- **Modify** `apps/api/src/graphql/resolvers/booking.resolver.ts` — fix `userId` resolution (use `@CurrentUser`/`sub`), load `meetingRoom`+`user` relations in `myBookings`/`bookings`/`booking(id)`, reload-after-save in `createBooking`, add `extendBooking` mutation.
- **Modify** `apps/api/.env` (or document) — add `OTP_DEV_BYPASS=true` for dev.
- No new entity files needed (all entities exist).

### Mobile — modify
- **Modify** `apps/mobile/src/lib/apollo/client.ts` — silent-refresh `errorLink`.
- **Modify** `apps/mobile/src/lib/apollo/operations.ts` — add `VERIFY_TWO_FACTOR_MUTATION`, `REFRESH_TOKENS_MUTATION`, `EXTEND_BOOKING_MUTATION`; align `SIGNIN_MUTATION` to select `twoFactorRequired`/`challengeToken`.
- **Modify** `apps/mobile/src/lib/auth/context.tsx` — `login()` accepts the full user object (already does).
- **Modify** all 22 screen files listed in Tasks 6–14.
- **Modify** `apps/mobile/src/navigation/AppNavigator.tsx` — add `BookingSuccess` route OR change navigations (Task 11).

---

## Task 1: Backend — Complete two-factor auth (OTP) with dev-gated `000000`

**Files:**
- Modify: `apps/api/src/auth/services/auth.service.ts`
- Modify: `apps/api/src/auth/auth.module.ts`
- Modify: `apps/api/src/auth/dto/verify-two-factor.input.ts` (verify only — already has `challengeToken` + `code`)
- Modify: `apps/api/.env` (add `OTP_DEV_BYPASS`)

**Interfaces:**
- Produces: `AuthService.signChallengeToken(user: User): Promise<string>`, `AuthService.verifyChallengeToken(token: string): Promise<{ sub: string }>`, and a working `verifyTwoFactor(input: VerifyTwoFactorInput): Promise<AuthPayload>` that returns real tokens when `code === '000000'` and `OTP_DEV_BYPASS === 'true'`.

**Context for the implementer:**
- The live service is `apps/api/src/auth/services/auth.service.ts`. Constructor lines 55–64 have `TwoFactorService` commented out (line 63) — uncomment it. `auth.module.ts:45` has `// TwoFactorService,` commented in providers — uncomment it.
- `ChallengeTokenPayload` interface already exists in `apps/api/src/auth/types/jwt-payload.type.ts:36-42` (`{ sub, kind: 'two-factor-challenge', iat?, exp? }`).
- `issueTokensFor` (lines 296–349) is the private helper that mints access+refresh and returns a full `AuthPayload` — reuse it.
- Constants at lines 38–41: `JWT_SECRET` is read via `this.configService.get('JWT_SECRET')`. Use the same pattern for `OTP_DEV_BYPASS`.

- [ ] **Step 1: Add challenge-token sign/verify methods to `AuthService`**

Add these two private methods to `apps/api/src/auth/services/auth.service.ts` (place them just before `issueTokensFor`, ~line 296):

```ts
private async signChallengeToken(user: User): Promise<string> {
  const secret = this.configService.get<string>('JWT_SECRET') ?? 'dev-jwt-secret';
  return this.jwtService.signAsync(
    { sub: user.id, kind: 'two-factor-challenge' } as ChallengeTokenPayload,
    { expiresIn: '5m', secret },
  );
}

private async verifyChallengeToken(token: string): Promise<{ sub: string }> {
  const secret = this.configService.get<string>('JWT_SECRET') ?? 'dev-jwt-secret';
  const payload = await this.jwtService.verifyAsync(token, { secret });
  if (payload?.kind !== 'two-factor-challenge' || !payload?.sub) {
    throw new UnauthorizedException('Invalid or expired challenge token');
  }
  return { sub: payload.sub };
}
```

Also add `ChallengeTokenPayload` to the existing import from `'../types/jwt-payload.type'` (the import line is near the top of the file — find `JwtPayload`/`RefreshTokenPayload` imports and add `ChallengeTokenPayload`).

- [ ] **Step 2: Re-enable the `signin` 2FA branch**

Replace lines 110–129 of `signin` (the `if (user.twoFactorEnabled) { ... throw ... }` block) with a branch that ALWAYS issues a challenge when the dev bypass is on, and otherwise only when `twoFactorEnabled`. Replace the whole `if (user.twoFactorEnabled) {` block with:

```ts
const otpDevBypass = this.configService.get<string>('OTP_DEV_BYPASS') === 'true';
if (user.twoFactorEnabled || otpDevBypass) {
  const challengeToken = await this.signChallengeToken(user);
  return {
    user: null,
    accessToken: null,
    refreshToken: null,
    accessTokenExpiresAt: new Date(),
    refreshTokenExpiresAt: new Date(),
    twoFactorRequired: true,
    challengeToken,
  };
}
```

This makes signin return a challenge (no tokens) instead of issuing tokens directly, whenever the dev bypass is enabled. (The real TOTP path via `twoFactorService` stays available for when a real sender exists — see Task 1 Step 5 note.)

- [ ] **Step 3: Implement `verifyTwoFactor`**

Replace the stub at lines 288–290 (`verifyTwoFactor` that throws) with:

```ts
async verifyTwoFactor(input: VerifyTwoFactorInput): Promise<AuthPayload> {
  const { sub: userId } = await this.verifyChallengeToken(input.challengeToken);
  const user = await this.userRepo.findOne({ where: { id: userId } });
  if (!user || !user.active) {
    throw new UnauthorizedException('Invalid challenge');
  }

  const otpDevBypass = this.configService.get<string>('OTP_DEV_BYPASS') === 'true';
  if (otpDevBypass) {
    if (input.code !== '000000') {
      throw new UnauthorizedException('Invalid verification code');
    }
  } else {
    // Real TOTP path — requires user.secret; not active until a sender provisions secrets.
    if (!user.twoFactorEnabled || !(user as any).twoFactorSecret) {
      throw new UnauthorizedException('Two-factor authentication is not enabled');
    }
    this.twoFactorService.verifyCode((user as any).twoFactorSecret, input.code);
  }

  user.lastLoginAt = new Date();
  await this.userRepo.save(user);
  return this.issueTokensFor(user, { twoFactorVerified: true });
}
```

- [ ] **Step 4: Re-wire `TwoFactorService` injection**

- `apps/api/src/auth/services/auth.service.ts` constructor (lines 55–64): un-comment line 63 (`private readonly twoFactorService: TwoFactorService,`).
- Ensure the import at the top: `import { TwoFactorService } from './two-factor.service';` (currently commented at line 31 — un-comment).
- `apps/api/src/auth/auth.module.ts:45`: un-comment `TwoFactorService,` in the `providers` array. Also confirm `TwoFactorService` is exported if needed by other modules (it isn't currently — leave as-is).

- [ ] **Step 5: Add env var**

In `apps/api/.env` add (or confirm present):
```
OTP_DEV_BYPASS=true
```
This enables the `000000` flow for local/dev. The default (`false` when unset) keeps prod safe.

- [ ] **Step 6: Compile-check the backend**

Run: `cd apps/api && npx tsc --noEmit`
Expected: PASS (no type errors). If `ChallengeTokenPayload` import path is wrong, fix the path to match the actual file (`apps/api/src/auth/types/jwt-payload.type.ts`).

- [ ] **Step 7: Boot + curl-verify the OTP flow**

Start the API (e.g. `cd apps/api && npm run start:dev` or the workspace equivalent). Then run two curl calls against `http://localhost:3001/api/graphql`:

Signin (returns challenge, no tokens):
```bash
curl -s -X POST http://localhost:3001/api/graphql -H 'Content-Type: application/json' \
  -d '{"query":"mutation { signin(input: { email: \"<seed-email>\", password: \"<seed-pass>\" }) { twoFactorRequired challengeToken accessToken } }"}'
```
Expected: `{"data":{"signin":{"twoFactorRequired":true,"challengeToken":"<jwt>","accessToken":null}}}`

Verify (using the challengeToken from above):
```bash
curl -s -X POST http://localhost:3001/api/graphql -H 'Content-Type: application/json' \
  -d '{"query":"mutation($c:String!){ verifyTwoFactor(input:{challengeToken:$c, code:\"000000\"}){ accessToken refreshToken user{id email} } }","variables":{"c":"<challengeToken>"}}'
```
Expected: real `accessToken` + `refreshToken` + `user`.

- [ ] **Step 8: Commit**

```bash
git add apps/api/src/auth/services/auth.service.ts apps/api/src/auth/auth.module.ts apps/api/.env
git commit -m "feat(api): complete two-factor auth with dev-gated 000000 OTP bypass"
```

---

## Task 2: Backend — Fix booking resolver relations + `userId` resolution + add `extendBooking`

**Files:**
- Modify: `apps/api/src/graphql/resolvers/booking.resolver.ts`

**Interfaces:**
- Produces: `myBookings`/`bookings`/`booking(id)` now load `meetingRoom` and `user` relations; `createBooking` reloads relations before returning; new mutation `extendBooking(id: ID!, endTime: DateTime!): Booking!`.

**Context:** `myBookings` (line 65–77) reads `context.req.user?.id` but the JWT payload uses `sub` — modern resolvers use `@CurrentUser() current: JwtPayload` then `current.sub`. Relations arrays currently: `myBookings` line 72 = `['seat','seat.floor','center','payment']`; `bookings` line 56 = `['user','seat','seat.floor','center','payment','customer']`; `booking(id)` line 81 = `['user','seat','seat.floor','center','payment']`. None load `meetingRoom`. The `Booking` entity has `meetingRoom` (entity line 118) and `user` (entity line 103) relations.

- [ ] **Step 1: Fix `userId` resolution in `myBookings`**

In `apps/api/src/graphql/resolvers/booking.resolver.ts`, change the `myBookings` method (lines 65–77) to use the JWT `sub`. Replace `const userId = context.req.user?.id;` with:

```ts
const userId = context.req.user?.sub ?? context.req.user?.id;
```

(Defensive `??` keeps back-compat if any middleware still sets `id`.) Also add `'meetingRoom'` to the relations array on line 72 so it becomes:

```ts
relations: ['seat', 'seat.floor', 'center', 'payment', 'meetingRoom', 'user'],
```

- [ ] **Step 2: Add `meetingRoom` to the `bookings` and `booking(id)` queries**

- `bookings` query (line 56–60): change the relations array from `['user','seat','seat.floor','center','payment','customer']` to also include `'meetingRoom'`.
- `booking(id)` query (line 81–84): add `'meetingRoom'` to its relations array.

- [ ] **Step 3: Reload relations after save in `createBooking`**

In `createBooking` (lines 89–174), after the `this.bookingRepo.save(booking)` call (around line 158) and before `return`, reload the booking with relations so the response includes `seat`/`center`/`payment`/`meetingRoom`. Insert before the return:

```ts
const reloaded = await this.bookingRepo.findOne({
  where: { id: (saved as any).id },
  relations: ['seat', 'seat.floor', 'center', 'payment', 'meetingRoom', 'user'],
});
return (reloaded ?? saved) as unknown as BookingEntity;
```

(Adjust the variable names to match the actual `save` call in the file — read the surrounding lines to get the exact name of the saved result.)

- [ ] **Step 4: Add the `extendBooking` mutation**

Add a new mutation to the `BookingResolver` class (place it near `cancelBooking`, ~line 177). The `Booking` entity uses `endDate` for the end time:

```ts
@Mutation(() => BookingEntity)
@UseGuards(GqlAuthGuard)
async extendBooking(
  @Args('id') id: string,
  @Args('endTime') endTime: Date,
  @CurrentUser() current: JwtPayload,
): Promise<BookingEntity> {
  const booking = await this.bookingRepo.findOne({
    where: { id, userId: current.sub } as any,
    relations: ['seat', 'seat.floor', 'center', 'payment', 'meetingRoom', 'user'],
  });
  if (!booking) throw new NotFoundException('Booking not found');
  booking.endDate = endTime;
  return (await this.bookingRepo.save(booking)) as unknown as BookingEntity;
}
```

Ensure imports: `GqlAuthGuard`, `JwtPayload`, `@CurrentUser`, `NotFoundException`, `Mutation`, `Args` are imported (check the existing imports at the top of the file — `cancelBooking` already uses most of these).

- [ ] **Step 5: Compile-check**

Run: `cd apps/api && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/graphql/resolvers/booking.resolver.ts
git commit -m "fix(api): booking resolver relations + userId + extendBooking mutation"
```

---

## Task 3: Mobile — Silent token refresh + align auth operations

**Files:**
- Modify: `apps/mobile/src/lib/apollo/operations.ts`
- Modify: `apps/mobile/src/lib/apollo/client.ts`

**Interfaces:**
- Produces: `REFRESH_TOKENS_MUTATION`, `VERIFY_TWO_FACTOR_MUTATION` exports; `SIGNIN_MUTATION` selects `twoFactorRequired`/`challengeToken`; Apollo client silently refreshes on `UNAUTHENTICATED`.

**Context:** `client.ts` already imports `getRefreshToken`, `saveTokens`, `clearTokens` from `../auth/storage` (line 7). The backend `refreshTokens(refreshToken: String!)` mutation exists. The current `errorLink` (lines 25–47) clears tokens on `UNAUTHENTICATED` — replace that branch.

- [ ] **Step 1: Add the two new operations and align `SIGNIN_MUTATION`**

In `apps/mobile/src/lib/apollo/operations.ts`:

(a) Replace the existing `SIGNIN_MUTATION` (lines 17–31) with a version that also selects `twoFactorRequired` and `challengeToken`:

```ts
export const SIGNIN_MUTATION = gql`
  mutation Signin($email: String!, $password: String!) {
    signin(input: { email: $email, password: $password }) {
      accessToken
      refreshToken
      twoFactorRequired
      challengeToken
      user {
        id
        email
        name
        role
        tokenBalance
      }
    }
  }
`;
```

(b) Add `VERIFY_TWO_FACTOR_MUTATION` (place it right after `SIGNIN_MUTATION`):

```ts
export const VERIFY_TWO_FACTOR_MUTATION = gql`
  mutation VerifyTwoFactor($challengeToken: String!, $code: String!) {
    verifyTwoFactor(input: { challengeToken: $challengeToken, code: $code }) {
      accessToken
      refreshToken
      user {
        id
        email
        name
        role
        tokenBalance
      }
    }
  }
`;
```

(c) Add `REFRESH_TOKENS_MUTATION` (place near the top, after the auth block):

```ts
export const REFRESH_TOKENS_MUTATION = gql`
  mutation RefreshTokens($refreshToken: String!) {
    refreshTokens(refreshToken: $refreshToken) {
      accessToken
      refreshToken
    }
  }
`;
```

- [ ] **Step 2: Rewrite the Apollo `errorLink` for silent refresh**

In `apps/mobile/src/lib/apollo/client.ts`, replace the `errorLink` definition (lines 25–47) with a single-flight refresh implementation. Also import `REFRESH_TOKENS_MUTATION` at the top. Replace the whole `const errorLink = onError(...)` block with:

```ts
let isRefreshing = false;
let pendingRequests: Array<(token: string | null) => void> = [];

const resolvePending = (token: string | null) => {
  pendingRequests.forEach(cb => cb(token));
  pendingRequests = [];
};

const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    const unauthenticated = graphQLErrors.some(
      e => e.extensions?.code === 'UNAUTHENTICATED',
    );

    if (unauthenticated) {
      // Single-flight: if a refresh is already in flight, queue this operation.
      if (isRefreshing) {
        return new Observable(observer => {
          pendingRequests.push((token) => {
            if (!token) {
              observer.error(new Error('Session expired'));
              return;
            }
            operation.setContext(({ headers = {} }) => ({
              headers: { ...headers, authorization: `Bearer ${token}` },
            }));
            forward(operation).subscribe(observer);
          });
        });
      }

      return new Observable(observer => {
        (async () => {
          isRefreshing = true;
          try {
            const refreshToken = await getRefreshToken();
            if (!refreshToken) {
              await clearTokens();
              resolvePending(null);
              observer.error(new Error('No refresh token'));
              return;
            }
            const res = await fetch(SPACEJAM_API_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                query: REFRESH_TOKENS_MUTATION.loc!.source.body,
                variables: { refreshToken },
              }),
            });
            const json = await res.json();
            const accessToken = json?.data?.refreshTokens?.accessToken;
            const newRefresh = json?.data?.refreshTokens?.refreshToken;
            if (!accessToken || !newRefresh) {
              await clearTokens();
              resolvePending(null);
              observer.error(new Error('Refresh failed'));
              return;
            }
            await saveTokens(accessToken, newRefresh);
            isRefreshing = false;
            resolvePending(accessToken);
            operation.setContext(({ headers = {} }) => ({
              headers: { ...headers, authorization: `Bearer ${accessToken}` },
            }));
            forward(operation).subscribe(observer);
          } catch (err) {
            isRefreshing = false;
            await clearTokens();
            resolvePending(null);
            observer.error(err);
          }
        })();
      });
    }

    // Non-auth errors: surface via toast.
    for (const err of graphQLErrors) {
      Toast.show({ type: 'error', text1: 'Error', text2: err.message });
    }
  }

  if (networkError) {
    Toast.show({
      type: 'error',
      text1: 'Network Error',
      text2: 'Please check your internet connection.',
    });
    console.error(`[Network error]: ${networkError}`);
  }
});
```

Note: `Observable`, `from`, `getRefreshToken`, `saveTokens`, `clearTokens` are already imported (lines 1, 7). Add `REFRESH_TOKENS_MUTATION` to the operations import (line 7 area).

- [ ] **Step 3: Type-check the mobile app**

Run: `cd apps/mobile && npx tsc --noEmit`
Expected: PASS. (If `REFRESH_TOKENS_MUTATION.loc!.source.body` complains, fall back to re-declaring the mutation string inline — but `.loc.source.body` is the standard Apollo way to get the raw query string.)

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/lib/apollo/operations.ts apps/mobile/src/lib/apollo/client.ts
git commit -m "feat(mobile): silent token refresh + two-factor auth operations"
```

---

## Task 4: Mobile — Rewrite `LoginScreen` for the real two-step OTP flow

**Files:**
- Modify: `apps/mobile/src/screens/LoginScreen.tsx` (lines 176–289 are the broken `LoginScreen` component — rewrite the component body; keep the visual sub-components like `AnimatedInput`, `OtpContent`, `AnimatedOtpBox`, `SocialButton`, and all `styles`)

**Interfaces:**
- Consumes: `SIGNIN_MUTATION`, `VERIFY_TWO_FACTOR_MUTATION` (Task 3), `useAuth().login` (`apps/mobile/src/lib/auth/context.tsx`).
- Produces: a working login that on email+password calls signin → shows OTP view → verifies `000000` → `login(user, access, refresh)`.

**Context:** The component at lines 177–289 references `handleSignIn`, `handleVerifyOtp`, `otp`, `otpInputs`, `loginViewAnim`, `otpViewAnim`, `transitionToOtp`, `transitionToLogin`, `setCurrentScreen`, `handleOtpChange`, `handleOtpKeyPress` — **none defined**. The `AnimatedLoginContent` and `OtpContent` sub-components take these as props. We add the missing state/handlers to `LoginScreen` and pass them down. Keep `transitionToOtp`/`transitionToLogin` as functions that animate between views. Keep all visuals and styles untouched.

- [ ] **Step 1: Rewrite the `LoginScreen` component body**

Replace lines 177–289 (the entire `export default function LoginScreen() { ... }` up to its closing `};`). Add the needed imports at the top of the file: `useApolloClient, useMutation` from `@apollo/client`; `useAuth` from `'../lib/auth/context`; `SIGNIN_MUTATION, VERIFY_TWO_FACTOR_MUTATION` from `'../lib/apollo/operations'`; `Toast` from `'react-native-toast-message'`; `useEffect, useRef` (extend the existing React import). New component body:

```tsx
export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // OTP view state
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const otpInputs = useRef<(TextInput | null)[]>([]);
  const [challengeToken, setChallengeToken] = useState<string | null>(null);

  // View transition animation (login <-> otp)
  const loginViewAnim = useRef(new Animated.Value(1)).current;
  const otpViewAnim = useRef(new Animated.Value(0)).current;

  const { login } = useAuth();

  const [signin, { loading: signinLoading }] = useMutation(SIGNIN_MUTATION, {
    onError: (err) => {
      Toast.show({ type: 'error', text1: 'Sign in failed', text2: err.message });
    },
  });

  const [verifyTwoFactor, { loading: verifyLoading }] = useMutation(
    VERIFY_TWO_FACTOR_MUTATION,
    {
      onError: (err) => {
        Toast.show({ type: 'error', text1: 'Verification failed', text2: err.message });
      },
    },
  );

  const transitionToOtp = () => {
    Animated.timing(loginViewAnim, {
      toValue: 0, duration: duration.base, easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
    Animated.timing(otpViewAnim, {
      toValue: 1, duration: duration.base, easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  };

  const transitionToLogin = () => {
    Animated.timing(otpViewAnim, {
      toValue: 0, duration: duration.base, easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
    Animated.timing(loginViewAnim, {
      toValue: 1, duration: duration.base, easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  };

  const handleSignIn = async () => {
    try {
      const res = await signin({ variables: { email, password } });
      const payload = res.data?.signin;
      if (payload?.twoFactorRequired) {
        setChallengeToken(payload.challengeToken);
        setOtp(['', '', '', '', '', '']);
        transitionToOtp();
      } else if (payload?.accessToken) {
        // No OTP required (dev bypass off) — proceed directly.
        await login(payload.user, payload.accessToken, payload.refreshToken);
      } else {
        Toast.show({ type: 'error', text1: 'Sign in failed', text2: 'Unexpected response' });
      }
    } catch {
      // onError already toasted.
    }
  };

  const handleVerifyOtp = async () => {
    if (!challengeToken) return;
    const code = otp.join('');
    try {
      const res = await verifyTwoFactor({
        variables: { challengeToken, code },
      });
      const payload = res.data?.verifyTwoFactor;
      if (payload?.accessToken) {
        await login(payload.user, payload.accessToken, payload.refreshToken);
      }
    } catch {
      // onError already toasted.
    }
  };

  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    if (text && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <View style={styles.mainContainer}>
          <View style={styles.heroSection}>
            {/* ...KEEP ALL THE EXISTING DECORATIVE BOX + BRAND JSX UNCHANGED... */}
            <View style={styles.brandArea}>
              <Animated.Text style={[styles.brandLine1, { opacity: loginViewAnim }]}>SPACE</Animated.Text>
              <View style={styles.brandRow}>
                <Animated.Text style={[styles.brandLine2, { opacity: loginViewAnim }]}>JAM</Animated.Text>
                <Animated.Text style={[styles.brandTagline, { opacity: loginViewAnim }]}>{'co-working\noffices'}</Animated.Text>
              </View>
            </View>
          </View>

          <View style={styles.cardContainer}>
            <View style={styles.card}>
              <Animated.View style={{ flex: 1, opacity: loginViewAnim }}>
                <AnimatedLoginContent
                  email={email}
                  password={password}
                  rememberMe={rememberMe}
                  showPassword={showPassword}
                  onEmailChange={setEmail}
                  onPasswordChange={setPassword}
                  onToggleRemember={() => setRememberMe(!rememberMe)}
                  onTogglePassword={() => setShowPassword(!showPassword)}
                  onSignIn={handleSignIn}
                  loading={signinLoading}
                  onMagicLink={transitionToOtp}
                />
              </Animated.View>

              <Animated.View style={{ flex: 1, opacity: otpViewAnim, position: 'absolute', inset: 0, padding: 20 }}>
                <OtpContent
                  otp={otp}
                  otpInputs={otpInputs}
                  onOtpChange={handleOtpChange}
                  onOtpKeyPress={handleOtpKeyPress}
                  onVerify={handleVerifyOtp}
                  loading={verifyLoading}
                  onBackToLogin={transitionToLogin}
                />
              </Animated.View>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
```

Then make two small changes to the sub-components to accept the new props:
- In `AnimatedLoginContent` (line 292), add `loading?: boolean` to its props destructuring, and change the Sign-in `AnimatedButton` to pass `onPress={onSignIn}` and reflect `loading` in the label: `label={loading ? 'Signing in…' : 'Sign in'}`.
- In `OtpContent` (line 412), add `loading?: boolean` to props and set the Verify button label to `loading ? 'Verifying…' : 'Verify Code'`.

- [ ] **Step 2: Remove the dev bypass JSX**

In the `return` of `LoginScreen` (the rewritten version above), do **not** include the `{__DEV__ && (... setCurrentScreen('Home') ...)}` block (lines 274–282 in the old file). Login is real now; the bypass is gone.

- [ ] **Step 3: Type-check**

Run: `cd apps/mobile && npx tsc --noEmit`
Expected: PASS. Watch for: the `AnimatedInput` import of `TextInput` type for the ref (`otpInputs.current` typed as `(TextInput | null)[]` — add `TextInput` to the react-native import if not present).

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/screens/LoginScreen.tsx
git commit -m "feat(mobile): real two-step OTP login wired to backend"
```

---

## Task 5: Mobile — Fix `HomeScreen` (crashes + mock data)

**Files:**
- Modify: `apps/mobile/src/screens/HomeScreen.tsx`

**Interfaces:** Consumes `GET_HOME_DATA` (already imported line 11). Fields available: `me { id name tokenBalance }`, `myBookings { id startDate endDate status totalPrice seat { id name seatType floor { id name } } center { id name } meetingRoom { id name } }`, `invoices { id invoiceNumber customerName amount tax totalAmount status issueDate dueDate }`.

**Context — the bugs:**
- `ImageBackground` used at lines 494 & 521 but NOT imported (only `Image` at line 20). Add it to the RN import.
- `useSpringEntrance` used at lines 613 & 630 but NOT imported (animation import lines 39–45 omits it). Add it.
- `StatsRow` (314–347) hardcoded `₹8,463`/`₹2,463`/`2500` — should use `data?.me?.tokenBalance`.
- `TokenCard` (458–484) hardcoded `2,500` tokens (line 471).
- Lines 130–143 read `b.date`/`b.startTime`/`b.endTime` but the query returns `startDate`/`endDate`.
- `projectId: 'placeholder-project-id'` (line 80), bell button no `onPress` (line 271), `onAction={() => {}}` (line 185).

- [ ] **Step 1: Fix the imports**

In the react-native import (lines 13–22), add `ImageBackground` (keep `Image`). In the animations import (lines 39–45), add `useSpringEntrance`:

```ts
import { useFadeIn, useSlideIn, staggerDelay, usePressFeedback, usePulse, useSpringEntrance } from '../theme/animations';
```

- [ ] **Step 2: Fix the bookings field mapping**

Find the `data?.myBookings?.slice(0, 2).map((b: any, i: number) => {` block (lines 130–143). Replace the date/time derivation:

```ts
const start = new Date(parseInt(b.startDate));
const end = b.endDate ? new Date(parseInt(b.endDate)) : null;
const title = b.meetingRoom
  ? `${b.meetingRoom.name}`
  : `${b.seat?.floor?.name || ''} - ${b.seat?.name || ''}`;
const time = `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}${end ? ' - ' + end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}`;
// pass `title`, `time`, and a formatted date string derived from `start` to the card.
```

(Adapt the exact prop names to whatever the booking card component below expects — read lines 144–167 to see the prop names and pass `title`/`time`/date accordingly.)

- [ ] **Step 3: Wire `StatsRow` and `TokenCard` to real data**

- `TokenCard` (lines 458–484): replace the hardcoded `2,500` (line 471) with `{(data?.me?.tokenBalance ?? 0).toLocaleString()}`. Pass `data` down to `TokenCard` (add a `balance` prop) OR move `TokenCard` to read from a prop. Simplest: where `<TokenCard />` is rendered, pass `balance={data?.me?.tokenBalance ?? 0}` and update `TokenCard` to accept `balance: number` and render `balance.toLocaleString()`.
- `StatsRow` (lines 314–347): the tokens stat should use `data?.me?.tokenBalance`. The revenue stats (`₹8,463`/`₹2,463`) have no direct source in `GET_HOME_DATA` — change them to derive from `data?.invoices`: sum amounts of paid invoices. Add at the top of the component (after the `useQuery`):

```ts
const paidInvoices = (data?.invoices ?? []).filter((i: any) => i.status === 'PAID');
const totalPaid = paidInvoices.reduce((s: number, i: any) => s + (i.amount ?? 0), 0);
```

Then pass `totalPaid` and `data?.me?.tokenBalance` into `StatsRow` as props and render them instead of the hardcoded values. If `StatsRow` is a self-contained component, add props `revenue`, `pending`, `tokens`.

- [ ] **Step 4: Fix minor no-ops**

- Line 80: replace `projectId: 'placeholder-project-id'` with a real registration only if needed for push notifications; otherwise remove the unused `Notifications` flow. Simplest: wrap the `registerForPushNotifications`/`REGISTER_DEVICE_TOKEN_MUTATION` call in a `useEffect` that only runs once on mount and swallows errors silently. Keep it but remove the placeholder literal — read the actual value from the response.
- Line 271 bell button: add `onPress={() => navigation.navigate('Notifications')}`.
- Line 185 `onAction={() => {}}`: wire it to navigate to `AvailableRooms` (the "nearest spaces" section): `onAction={() => navigation.navigate('AvailableRooms')}`.

- [ ] **Step 5: Type-check**

Run: `cd apps/mobile && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/src/screens/HomeScreen.tsx
git commit -m "fix(mobile): HomeScreen imports, real token/invoice/booking data"
```

---

## Task 6: Mobile — Fix `EventsScreen` + `MyBookingsScreen` (crashes)

**Files:**
- Modify: `apps/mobile/src/screens/EventsScreen.tsx`
- Modify: `apps/mobile/src/screens/MyBookingsScreen.tsx`

**Context:**
- `EventsScreen` defines a filter pill as `Fp` (line 152) but JSX uses `<FilterPill>` (lines 89–90). `handleNavChange` (41–45) references undefined `tab` and `onNavigate`.
- `MyBookingsScreen` `handleNavChange` (39–43) references undefined `tab`.

- [ ] **Step 1: Fix `EventsScreen`**

- Rename the `Fp` component (line 152) to `FilterPill`, OR change every `<FilterPill ...>` usage (lines 89–90) to `<Fp ...>`. Choose one and be consistent. (Renaming `Fp` → `FilterPill` is clearer.)
- Fix `handleNavChange` (lines 41–45): it should accept a `tab` parameter and use `navigation` (already imported). Replace with:

```ts
const handleNavChange = (tab: string) => {
  // map tab -> Stack screen and navigate; or remove if FloatingNavBar isn't rendered here.
  const map: Record<string, string> = {
    home: 'MainTabs', events: 'MainTabs', bookings: 'MainTabs', profile: 'MainTabs',
  };
  if (map[tab]) navigation.navigate(map[tab]);
};
```

If `handleNavChange`/`FloatingNavBar` is dead code in this screen (not rendered), simply delete the unused function and any `onNavigate` references. Read the JSX to confirm — if `FloatingNavBar` is not in the return, remove `handleNavChange` entirely.
- Ensure the `GET_EVENTS` query result is actually rendered in the event list (the audit said it's queried at line 37 — verify `data?.upcomingEvents`/`data?.todayEvents` feed the list, not a hardcoded array).

- [ ] **Step 2: Fix `MyBookingsScreen`**

- Fix `handleNavChange` (lines 39–43): same pattern as above — either give it a `tab` parameter and navigate, or delete it if `FloatingNavBar` isn't rendered in this screen. Verify the JSX (audit noted line 137 comment suggests it's not rendered) — if dead code, remove it.
- Ensure `GET_MY_BOOKINGS` (line 45) feeds the bookings list (not a hardcoded array). Verify the rendered fields use `startDate`/`endDate` (NOT `date`/`startTime`/`endTime`).
- Wire the status tabs (Upcoming/Ongoing/Completed) to actually filter the `myBookings` result by `status` — add an `activeTab` state and filter the list.

- [ ] **Step 3: Type-check**

Run: `cd apps/mobile && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/screens/EventsScreen.tsx apps/mobile/src/screens/MyBookingsScreen.tsx
git commit -m "fix(mobile): EventsScreen + MyBookingsScreen undefined refs, real data"
```

---

## Task 7: Mobile — Fix `OffersScreen` + `PrintProcessingScreen` (crashes)

**Files:**
- Modify: `apps/mobile/src/screens/OffersScreen.tsx`
- Modify: `apps/mobile/src/screens/PrintProcessingScreen.tsx`

**Context:**
- `OffersScreen`: `OfferCard` (110–158) takes no props but reads `color`/`tag1`/`tag2`/`tag3`/`title`/`subtitle`/`code` — undefined. Parent (60–101) passes props it ignores. Copy button (148) no `onPress`. `GET_ACTIVE_OFFERS` exists but is unused.
- `PrintProcessingScreen`: `useEffect` deps (line 23) reference undefined `onNavigate`.

- [ ] **Step 1: Fix + wire `OffersScreen`**

- Add `GET_ACTIVE_OFFERS`, `REDEEM_OFFER` imports; add `useQuery`/`useMutation`; add `Clipboard` (or `expo-clipboard`) for copy.
- Query: `const { data, loading } = useQuery(GET_ACTIVE_OFFERS);` and `const offers = data?.activeOffers ?? [];`
- Make `OfferCard` accept props: `{ title, description, code, type, value, validUntil }`. Render `title` as the title, `description` as subtitle, `code` (from the entity), and derive display tags from `type`/`value` (e.g. `type === 'PERCENTAGE' ? \`${value}% off\` : \`₹${value} off\``). Note: **there is no `color`/`tags` field** on the Offer entity — derive a color client-side (e.g. alternate palette.brand/palette.teal by index) or just use `palette.brand`.
- Parent: map `offers` to `<OfferCard>` passing real fields. Keep loading/empty states.
- Copy button: `onPress={() => { Clipboard.setString(code); Toast.show({ type:'success', text1:'Code copied' }); }}`.
- Add a "Redeem" path if appropriate (optional — `REDEEM_OFFER` needs a `bookingId`/`orderAmount` context that may not exist on this screen; skip redemption, just show + copy).

- [ ] **Step 2: Fix `PrintProcessingScreen`**

- The `useEffect` (line 18–23) with `[onNavigate]` deps: if `onNavigate` is meant to advance to `PrintSuccess` after processing, replace it with `navigation.navigate('PrintSuccess')` after a real check. Read the screen to understand intent: it likely polls a print job or just delays. Simplest correct version: accept the print job id from route params, and on a timer/animation-completion navigate to `'PrintSuccess'` (a registered route). Replace:

```ts
const navigation = useNavigation<any>();
useEffect(() => {
  const t = setTimeout(() => navigation.navigate('PrintSuccess'), 3000);
  return () => clearTimeout(t);
}, []);
```

Remove the `onNavigate` reference entirely.

- [ ] **Step 3: Type-check**

Run: `cd apps/mobile && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/screens/OffersScreen.tsx apps/mobile/src/screens/PrintProcessingScreen.tsx
git commit -m "fix(mobile): OffersScreen wired to activeOffers; PrintProcessingScreen nav fix"
```

---

## Task 8: Mobile — Wire booking/room/event detail screens

**Files:**
- Modify: `apps/mobile/src/screens/QuickBookingScreen.tsx`
- Modify: `apps/mobile/src/screens/BookingDetailsScreen.tsx`
- Modify: `apps/mobile/src/screens/EventDetailsScreen.tsx`
- Modify: `apps/mobile/src/screens/MyEventDetailsScreen.tsx`
- Modify: `apps/mobile/src/screens/MyRoomDetailsScreen.tsx`

**Interfaces:** Available ops: `GET_SEATS`, `GET_MEETING_ROOMS`, `GET_AVAILABLE_ROOMS`, `GET_EVENT`, `BOOK_ROOM_MUTATION`, `CREATE_BOOKING`, `EXTEND_BOOKING_MUTATION` (new, Task 2), `GET_MY_BOOKINGS`, `GET_ME` (for balance).

- [ ] **Step 1: Wire `QuickBookingScreen`**

Remove all hardcoded data (room name, time, member, address, ₹590). Fetch the selected seat/room — either from route params (passed by AvailableRooms) or via `GET_SEATS`/`GET_MEETING_ROOMS`. Wire the time picker to local state. Confirm Booking calls `CREATE_BOOKING` or `BOOK_ROOM_MUTATION` with the real `seatId`/`roomId`, `startTime`/`endTime`. On success navigate to a real route — **`BookingSuccess` does NOT exist**, so either add it to `AppNavigator` or navigate to `MyBookings`/`MainTabs`. (Decision: navigate to `MainTabs` and show a success Toast — simplest, no new screen.)

- [ ] **Step 2: Wire `BookingDetailsScreen`**

- Remove `// Mock` date/time (lines 80–82). Wire the `DATES`/`TIME_SLOTS` selection into the mutation variables: `startTime` = selected date+time, `endTime` = selected date + end slot.
- Replace hardcoded balance (`'500'`/`'250'` line 271) with `useQuery(GET_ME)` → `data?.me?.tokenBalance`.
- Wire "Click to Recharge" (line 253) to `navigation.navigate('RechargeTokens')`.
- Fix the success navigation: replace `navigation.navigate('BookingSuccess')` (line 67) with `navigation.navigate('MainTabs')` + success Toast (since `BookingSuccess` doesn't exist).
- Use `CREATE_BOOKING` (not `BOOK_ROOM_MUTATION`) for seat bookings; `BOOK_ROOM_MUTATION` for meeting rooms. Read which entity this screen books.

- [ ] **Step 3: Wire `EventDetailsScreen`**

- `GET_EVENT` is already imported (line 31). Ensure the rendered fields use the query result: title/description from `event`; venue from `event.meetingRoom?.name` + `event.center?.name` (NOT hardcoded `IT Park, Auditorium`); host from `event.requestedBy?.name` + `event.company` (NOT hardcoded `Santhanam`); cost from `event.cost` (NOT hardcoded `100`).
- Replace the confirm button `onPress={() => alert('Book event!')}` (line 142) with a real booking — call `BOOK_ROOM_MUTATION` with `event.meetingRoom?.id`, `event.centerId`, `event.eventDate`, `event.startTime`, `event.endTime`, `event.title`, then navigate to `EventSuccess`.

- [ ] **Step 4: Wire `MyEventDetailsScreen`**

Remove all hardcoded data (Tech Summit 2026, Grand Auditorium, etc.). Fetch via `GET_EVENT` with the event id from route params. Render real fields (title, description, `eventDate`, `startTime`/`endTime`, `meetingRoom.name`, `center.name`, `requestedBy.name`, `attendeesCount`, `cost`).

- [ ] **Step 5: Wire `MyRoomDetailsScreen`**

- Remove hardcoded timer/address/name. Fetch the active booking via `GET_MY_BOOKINGS` (filter to the relevant booking, or accept a booking id via route params and query `GET_BOOKINGS`). Derive remaining time from `startDate`/`endDate` (a live countdown), room name from `booking.meetingRoom?.name`, location from `booking.center?.name`, times from `booking.startDate`/`endDate`.
- Wire "Extend Time" button (line 110) to call `EXTEND_BOOKING_MUTATION` (Task 2) with `{ id: booking.id, endTime: <extended> }`, then refetch.

- [ ] **Step 6: Type-check**

Run: `cd apps/mobile && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/mobile/src/screens/QuickBookingScreen.tsx apps/mobile/src/screens/BookingDetailsScreen.tsx apps/mobile/src/screens/EventDetailsScreen.tsx apps/mobile/src/screens/MyEventDetailsScreen.tsx apps/mobile/src/screens/MyRoomDetailsScreen.tsx
git commit -m "feat(mobile): wire booking/room/event detail screens to backend"
```

---

## Task 9: Mobile — Wire wallet, print, payment screens

**Files:**
- Modify: `apps/mobile/src/screens/WalletScreen.tsx`
- Modify: `apps/mobile/src/screens/PrintPreviewScreen.tsx`
- Modify: `apps/mobile/src/screens/MyPrintDetailsScreen.tsx`
- Modify: `apps/mobile/src/screens/PaymentScreen.tsx`
- Modify: `apps/mobile/src/screens/AddTokensPaymentScreen.tsx`

- [ ] **Step 1: Wire `WalletScreen` transaction history**

- Balance is already wired (`GET_ME` line 33). Replace the hardcoded `history` array (lines 39–72) with `useQuery(GET_MY_WALLET_TRANSACTIONS)`. Render each `WalletTransaction`: title = `tx.description`, amount = `tx.amount` (prefix `-` for DEBIT, `+` for CREDIT based on `tx.type`), date = `tx.createdAt`, balance = `tx.balanceAfter`. Keep loading/empty states.

- [ ] **Step 2: Fix `PrintPreviewScreen` to use the print-job op**

- Replace `CREATE_REQUEST_MUTATION` (line 4/41) with `CREATE_PRINT_JOB`. Build the input from real values: `fileName`/`fileUrl` from route params (or a picker), `pages` from the actual upload (not hardcoded 5), `copies`, `color`, `paperSize`. Cost is computed server-side — read `data.createPrintJob.cost` and display it (remove the fake `estimatedCost` formula line 32).
- Replace hardcoded "Page 1 of 5" (line 103) with the real `pages`.

- [ ] **Step 3: Wire `MyPrintDetailsScreen`**

- Remove all hardcoded print-job fields (PR-134247, 50 pages, PDF, A4, etc.). Add `useQuery(GET_PRINT_JOB, { variables: { id: route.params?.id } })`. Render real fields: `id`, `fileName`, `pages`, `copies`, `color` (Black & White / Color), `paperSize`, `sides`, `status`, `cost`, `createdAt`.

- [ ] **Step 4: Wire `PaymentScreen`**

- Replace `handlePay`'s mock `setTimeout` (lines 24–29) with a real call. For invoice payments use `PROCESS_PAYMENT_MUTATION` with the `paymentId` from route params; for other flows mark the relevant entity paid. On success navigate to `EventSuccess` (registered) — or better, to `MainTabs`. Remove "MockPay" branding → "Secure Payment".
- Read real order total/item/card from route params (passed by the calling screen) — remove hardcoded ₹100/UI UX Workshop/•••• 4242.

- [ ] **Step 5: Wire `AddTokensPaymentScreen`**

- Replace `navigation.goBack()` on "Proceed to Pay" (line 121) with `RECHARGE_WALLET_MUTATION` (amount = the token package total), `onCompleted` → Toast success + `navigation.navigate('Wallet')` (or `goBack`). Remove hardcoded ₹500/₹590 — derive from the selected package.

- [ ] **Step 6: Type-check**

Run: `cd apps/mobile && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/mobile/src/screens/WalletScreen.tsx apps/mobile/src/screens/PrintPreviewScreen.tsx apps/mobile/src/screens/MyPrintDetailsScreen.tsx apps/mobile/src/screens/PaymentScreen.tsx apps/mobile/src/screens/AddTokensPaymentScreen.tsx
git commit -m "feat(mobile): wire wallet/print/payment screens to backend"
```

---

## Task 10: Mobile — Wire referral, support, notification-settings screens

**Files:**
- Modify: `apps/mobile/src/screens/ReferAndEarnScreen.tsx`
- Modify: `apps/mobile/src/screens/SupportScreen.tsx`
- Modify: `apps/mobile/src/screens/NotificationSettingsScreen.tsx`

- [ ] **Step 1: Wire `ReferAndEarnScreen`**

- Replace hardcoded stats (5/₹500/2 lines 67/78/89) with `useQuery(GET_MY_REFERRAL_STATS)` → render `data.myReferralStats.successful` / `totalEarned` / `pending`. Referral code from `data.myReferralStats.referralCode` (NOT "SPACE2025").
- "Share Code" button (line 104): `onPress` → `Share.share({ message: \`Use my code ${referralCode}…\` })` (RN `Share`).
- Optional: list referrals via `GET_MY_REFERRALS`.

- [ ] **Step 2: Wire `SupportScreen`**

- Add `useMutation(CREATE_SUPPORT_TICKET)`. Wire the subject/description/category fields to local state and submit on "Submit Feedback" (line 90): `onPress` → `createSupportTicket({ variables: { input: { subject, description, category } } })`, `onCompleted` → Toast + clear form. Remove empty no-op.
- Keep the FAQ array static (legitimately static content) OR optionally load from backend (skip — out of scope).

- [ ] **Step 3: Wire `NotificationSettingsScreen`**

- Replace local-only toggles with `useQuery(GET_MY_NOTIFICATION_PREFERENCES)` (seed initial state) + `useMutation(UPDATE_NOTIFICATION_PREFERENCES)` on toggle change. Map the four toggles to the four entity fields: `meetingReminders`, `billingAlerts`, `specialOffers`, `eventUpdates`.

- [ ] **Step 4: Type-check**

Run: `cd apps/mobile && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/screens/ReferAndEarnScreen.tsx apps/mobile/src/screens/SupportScreen.tsx apps/mobile/src/screens/NotificationSettingsScreen.tsx
git commit -m "feat(mobile): wire referral/support/notification-preference screens"
```

---

## Task 11: Mobile — Polish the already-wired screens + navigation cleanup

**Files:**
- Modify: `apps/mobile/src/screens/MyInvoicesScreen.tsx`
- Modify: `apps/mobile/src/screens/NotificationsScreen.tsx`
- Modify: `apps/mobile/src/screens/AvailableRoomsScreen.tsx`
- Modify: `apps/mobile/src/navigation/AppNavigator.tsx` (only if a route needs adding)

- [ ] **Step 1: Fix `MyInvoicesScreen` tab filter + title fallback**

- The `useMemo` (lines 46–63) ignores `activeTab`. Filter inside the memo: map tabs to invoice categories (e.g. `'Meeting Rooms'` → invoices with a booking ref; `'Recharges'` → wallet-type). Since `GET_INVOICES` doesn't return `booking`, change the title derivation (line 50) to use `inv.planName` or `inv.notes` or `inv.customerName` instead of the non-existent `inv.booking?.seat?.name`. Use `inv.planName ? inv.planName : \`Invoice #${inv.id.slice(-4)}\``.
- Add filtering by tab based on a category field if available; if invoices have no category, default to showing all but keep the tab as a visual label (honest). Better: add a `type`/`category` to the invoices query if the entity supports it (check `Invoice` entity — if it has a category-like field, use it; else collapse the tabs to just "All").

- [ ] **Step 2: Fix `NotificationsScreen` field + filters**

- Line 93: change `body={notif.body}` to `body={notif.message}`.
- Wire the filter pills (lines 43–68): add `activeFilter` state (`'all' | 'unread' | 'BOOKING' | 'OFFER' | 'SYSTEM'`); style the active pill from state; pass `unreadOnly: activeFilter === 'unread'` to `GET_NOTIFICATIONS` variables; for type filters, filter the result client-side by `notif.type`. Replace the hardcoded "3" unread badge (line 53) with the real unread count from `NOTIFICATION_STATS` or computed from the list.
- After `markRead`, update the cache or refetch so the unread state updates.

- [ ] **Step 3: `AvailableRoomsScreen` — pull amenities from data**

- Replace the hardcoded `['WiFi','Display','Whiteboard']` (line 114) with the seat/room `amenities` field from the query (already selected by `GET_SEATS`/`GET_AVAILABLE_ROOMS`). Keep the two Unsplash images as a fallback if the entity has no image field.

- [ ] **Step 4: Confirm/fix navigation targets**

- Grep all `navigation.navigate(` calls across screens for invalid targets (`BookingSuccess`, `HomeTab` from Stack screens, `Events`/`MyBookings`/`Profile` without `Tab` suffix). Replace invalid ones with valid Stack names (`MainTabs`, `EventSuccess`, `PrintSuccess`, `MyBookings`, etc.). Add a `BookingSuccess` Stack.Screen pointing at `EventSuccessScreen` (or a thin success component) ONLY if a booking-specific success screen is genuinely needed — otherwise standardize on `MainTabs` + Toast.

- [ ] **Step 5: Type-check**

Run: `cd apps/mobile && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/src/screens/MyInvoicesScreen.tsx apps/mobile/src/screens/NotificationsScreen.tsx apps/mobile/src/screens/AvailableRoomsScreen.tsx apps/mobile/src/navigation/AppNavigator.tsx
git commit -m "fix(mobile): invoice filtering, notification field/filters, nav targets"
```

---

## Task 12: Full verification pass

- [ ] **Step 1: Backend type-check**

Run: `cd apps/api && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 2: Mobile type-check**

Run: `cd apps/mobile && npx tsc --noEmit`
Expected: PASS — zero references to undefined handlers/variables.

- [ ] **Step 3: Backend boot + contract smoke test**

Boot the API. Run curl checks for the full mobile contract:
- `signin` → returns `twoFactorRequired: true` + `challengeToken`, `accessToken: null`.
- `verifyTwoFactor(code:"000000")` → returns real `accessToken`/`refreshToken`/`user`.
- `me` (with the access token) → returns `id email name phone role tokenBalance center { id name }`.
- `myBookings` → returns bookings with `meetingRoom` and `seat` populated (not null).
- `seats`, `upcomingEvents`/`todayEvents`, `rechargeWallet(amount:1)` → all return real data.
- `refreshTokens(refreshToken:)` → returns a new token pair.

Expected: all return real data, no errors.

- [ ] **Step 4: Mobile build**

Run: `cd apps/mobile && npx nx build mobile` (or `npx expo export` if the build target differs — check `project.json` for the exact build target).
Expected: build succeeds.

- [ ] **Step 5: Runtime smoke (if a device/emulator is available)**

Launch the app, log in with a real seeded user (email + password, OTP `000000`), confirm: Home shows real name/tokens/bookings; Events/Bookings/Wallet show live data; Profile shows real user; logout works. If no device is available, document this step as pending and rely on Steps 1–4.

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "chore: full mobile<->backend wiring verification pass"
```
