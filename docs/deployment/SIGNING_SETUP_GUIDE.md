# Android Signing Setup Guide

For **Infra Resilience360** release builds on `main`.

## Keystore (local only — never committed)

Keystore files are **gitignored** (`*.jks`, `*.keystore`, `keystore.properties`). Place your release keystore on the build machine only.

| Expected path | Purpose |
|---------------|---------|
| `android/app/resilience360-release.keystore` | Default path from `keystore.properties.template` |

Do **not** regenerate or replace an existing production keystore if you already have one — copy it to the path above and configure `keystore.properties`.

## Option A — `keystore.properties` (recommended)

1. Copy the template:

   ```bash
   cp android/keystore.properties.template android/keystore.properties
   ```

2. Edit `android/keystore.properties` (file is gitignored):

   | Property | Value |
   |----------|--------|
   | `storeFile` | `app/resilience360-release.keystore` |
   | `storePassword` | Your keystore password |
   | `keyAlias` | `resilience360` (unless your keystore uses another alias) |
   | `keyPassword` | Your key password (often same as store password) |

3. Verify signing config:

   ```bash
   cd android
   ./gradlew signingReport
   ```

   Release variant should show a non-null `Config` with store path `app/resilience360-release.keystore`.

## Option B — Environment variables

```powershell
$env:ANDROID_KEYSTORE_PASSWORD = "<store-password>"
$env:ANDROID_KEY_PASSWORD = "<key-password>"
$env:ANDROID_KEY_ALIAS = "resilience360"
cd android
.\gradlew assembleRelease bundleRelease
```

Gradle reads these when `keystore.properties` passwords are empty (`android/app/build.gradle`).

## Signed release artifacts

```bash
npm run android:prepare:release   # or: npm run mobile:prepare && npm run mobile:prune:android-assets
cd android
./gradlew clean assembleRelease bundleRelease
```

| Output | Path |
|--------|------|
| Signed APK (universal) | `android/app/build/outputs/apk/release/app-universal-release.apk` |
| Signed AAB | `android/app/build/outputs/bundle/release/app-release.aab` |

## Verify signature

```bash
# Replace with your SDK build-tools path
apksigner verify --print-certs android/app/build/outputs/apk/release/app-universal-release.apk
```

## Unsigned release (no credentials)

Works without `keystore.properties`:

```bash
cd android
./gradlew assembleRelease
```

Output: `android/app/build/outputs/apk/release/app-release-unsigned.apk`

## Security

- Never commit `keystore.properties` or passwords.
- Never commit a new keystore; keep using `android/app/keystore.jks` for Play Store updates.
