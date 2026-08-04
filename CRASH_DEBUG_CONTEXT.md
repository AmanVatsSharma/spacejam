# SpaceJam Mobile — APK Crash Debug Context

## What we know
- **Both release AND debug APKs crash silently** — no RedBox, no error screen, just closes
- This means the app dies at the **native layer** (before JS even loads)
- `adb logcat` shows nothing useful

## What we've already tried
1. Added missing `Easing` import (App.tsx) — didn't fix
2. Added global JS error handler in `index.js` — never fires (crash is before JS)
3. Disabled `newArchEnabled` in `app.json` — prebuild wipes native code back to New Arch
4. Manually edited `MainActivity.kt` to disable New Arch flags — not enough
5. Set `JAVA_HOME=java-21` (Java 25 broke Gradle)
6. Fixed `local.properties` SDK path after each prebuild
7. Added `babel.config.js` (was missing)
8. Changed app name to SpaceJam, updated icon, changed package name

## Current state (commit ffbe543)
- React Native: 0.81.5
- Expo: SDK 54
- React: 19.2.7
- `newArchEnabled: false` in app.json
- Package: `com.spacejam.mobile` in app.json
- `babel.config.js` exists
- `index.js` has error handler

## ROOT CAUSE (very likely)
`MainApplication.kt` still has New Architecture code that crashes in `onCreate()`:

```kotlin
// THIS WILL CRASH:
DefaultNewArchitectureEntryPoint.releaseLevel = ReleaseLevel.valueOf(
  BuildConfig.REACT_NATIVE_RELEASE_LEVEL.uppercase()
)
loadReactNative(this)  // New Arch only API
```

Also: `MainApplication.kt` package is still `com.anonymous.mobile` (doesn't match app.json's `com.spacejam.mobile`)

Also: `MainActivity.kt` package is still `com.anonymous.mobile`

## What needs to be done
1. **Fix MainApplication.kt** — Remove New Architecture code entirely, use Old Arch initialization
2. **Fix package names** — Update both MainActivity.kt and MainApplication.kt from `com.anonymous.mobile` to `com.spacejam.mobile`
3. **Move native files** — They need to be in `apps/mobile/android/app/src/main/java/com/spacejam/mobile/` directory
4. **Rebuild** — `cd apps/mobile/android && ./gradlew assembleDebug`

## How to build APK
```bash
# Prerequisites
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk
export PATH="/home/amansharma/.nvm/versions/node/v20.19.2/bin:$PATH"
cd apps/mobile/android
echo "sdk.dir=/home/amansharma/Android/Sdk" > local.properties
./gradlew assembleDebug --no-daemon
# APK: app/build/outputs/apk/debug/app-debug.apk
```

## Project structure
- Expo Nx monorepo
- Mobile app: `apps/mobile/`
- Web app: `apps/web/`
- Backend: `apps/operations-api/`, `apps/crm/`
- No navigation library — app uses a custom FloatingNavBar (bottom tab implementation)
- Apollo Client for GraphQL (but no `@apollo/client` at runtime — only devDependency)
- All screens are in `src/screens/`
- 3 shared components: FloatingNavBar, PolishedCard, PressedTouchable, SectionHeader, StatusPill

## Key insight
The app NEVER had navigation libraries installed (`@react-navigation`, `react-native-screens`, `react-native-safe-area-context`). The app is structured as a login screen (App.tsx) that navigates to HomeScreen, which uses FloatingNavBar for bottom tabs — all custom implementation.

## Git
- Repo: https://github.com/AmanVatsSharma/spacejam.git
- Branch: main
- Latest commit: ffbe543
- APKs cannot be committed (>100MB GitHub limit)
- Local APK path: `assets/apks/spacejam-mock-ui-debug.apk`
