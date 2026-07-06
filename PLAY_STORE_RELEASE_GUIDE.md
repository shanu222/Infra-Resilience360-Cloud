# Infra Resilience360 - Google Play Release Guide

Release date: `2026-07-06`  
Release type: **First production release**

---

## 1) Version Update Verification

- `android/app/build.gradle`
  - `versionCode 3` (incremented from 2)
  - `versionName "1.0.2"` (incremented from 1.0.1)
- `frontend/src/utils/capacitorRuntime.ts`
  - `Version 1.0.2` display updated
- Android Manifest does not hardcode app version (version is controlled by Gradle), which is correct.
- Capacitor config checked:
  - `capacitor.config.ts` app ID remains unchanged.

Status: **Verified**

---

## 2) Package Name Verification

- Final package name / application ID: `com.resilience360.mobile`
- Verified in:
  - `android/app/build.gradle` (`applicationId`)
  - `capacitor.config.ts` (`appId`)
  - `android/app/src/main/res/values/strings.xml` (`package_name`)

Status: **Unchanged and verified**

---

## 3) Play Store Technical Information

- Package Name: `com.resilience360.mobile`
- Application ID: `com.resilience360.mobile`
- Version Code: `3`
- Version Name: `1.0.2`
- Min SDK: `24`
- Target SDK: `36`
- Compile SDK: `36`
- APK Path: `android/app/build/outputs/apk/release/app-release.apk`
- AAB Path: `android/app/build/outputs/bundle/release/app-release.aab`
- APK Size: `23,004,717` bytes
- AAB Size: `23,452,232` bytes
- Signing Subject: `C=092, ST=Federal, L=Islamabad, O=NDMA, OU=NDMA, CN=developer NDMA`
- SHA1: `AF:3D:D0:B6:BD:F0:F5:B1:6E:A0:34:0A:D9:18:65:66:4D:42:5A:0F`
- SHA256: `1C:6F:9B:6C:29:95:DE:B7:AE:1A:08:44:E1:12:F3:28:54:F6:36:DD:C3:85:9C:A3:F5:E0:B5:48:E1:8D:E1:74`
- Release Date: `2026-07-06`

Status: **Signed APK/AAB generated and verified**

---

## 4) Privacy Policy URL

Configured production URL:

- `https://infra-resilience360-cloud-production.up.railway.app/privacy-policy`

Verification:

- HTTPS: **Yes**
- Android app open-in-browser support: **Implemented** (`openExternalUrl` via Capacitor `App.openUrl`)
- Browser reachability check (live endpoint): **Currently 404**
- Mobile web behavior: **Pending deployment validation**

Manual action required:

- Deploy legal routes on production web host (or add server rewrite/static route handling) so this URL returns `200`.

---

## 5) Terms & Conditions URL

Configured production URL:

- `https://infra-resilience360-cloud-production.up.railway.app/terms-and-conditions`

Verification:

- HTTPS: **Yes**
- Android app open-in-browser support: **Implemented**
- Browser reachability check (live endpoint): **Currently 404**

Manual action required:

- Publish/serve route in production so URL returns `200`.

---

## 6) Contact Information

- Support Email: `info@ndma.gov.pk`
- Website: `https://infra-resilience360-cloud-production.up.railway.app`
- Contact URL: `https://infra-resilience360-cloud-production.up.railway.app/contact`
- About URL: `https://infra-resilience360-cloud-production.up.railway.app/about`

Note: `contact` and `about` endpoints currently return `404` on live production and require deployment-side routing fixes.

---

## 7) Play Console Listing Content

### Short Description (<=80 chars)

Disaster resilience guidance, risk maps, retrofit planning, and live alerts.

### Full Description (<=4000 chars)

Infra Resilience360 helps planners, field teams, and community stakeholders prepare for and respond to disaster risks with practical, data-backed guidance.

Key capabilities include:
- Multi-hazard resilience guidance for flood, earthquake, heatwave, landslide, and more
- Retrofit support workflows including image-based building assessment assistance
- Disaster dashboard media guidance with images, videos, audio, and PDFs
- Live earthquake monitoring with fallback handling and cached continuity
- Risk map support and decision-ready resilience references
- Learning and training media resources for preparedness and safer implementation

The app combines technical references, visual guidance, and operational support features into one workflow for preparedness, risk reduction, and resilient recovery planning.

Important notice:
AI-assisted recommendations are provided to support decision-making. They must be reviewed by qualified professionals and should not be treated as final engineering certification, emergency command, or legal compliance advice.

### Recommended Play Classification

- Application Category: `Tools`
- Application Type: `Application`
- Suggested Tags:
  - `Disaster Preparedness`
  - `Resilience`
  - `Risk Mapping`
  - `Retrofit`
  - `Emergency Alerts`
- Suggested Keywords:
  - disaster resilience, risk map, retrofit calculator, earthquake alerts, flood preparedness, NDMA, hazard guidance, emergency planning

---

## 8) Data Safety (Play Console Input Draft)

### Collected Data

- Location (when user requests location-based features)
- Photos/images selected by user (for retrofit/image analysis features)
- App interaction/preferences (local settings and feature states)
- Technical request metadata/logging on backend operations

### Shared Data

- User-selected images and request context may be processed by backend AI providers configured by the service (OpenAI/Gemini/OpenRouter flow).
- No ad-network sharing detected in app dependencies.

### Stored Data

- Local app storage for cached alerts, preferences, and offline continuity states
- Backend processing logs and service data according to server-side configuration

### Security and Control

- Encrypted in transit: **Yes** (HTTPS endpoints configured)
- Data deletion available: **Manual support process required** (self-service in-app deletion flow not detected)
- Location usage: **Optional, user-initiated**
- Camera usage: **Optional, user-initiated**
- Photo Picker usage: **Yes** (gallery flow, Android native bridge)
- AI requests: **Yes** (for guidance/analysis features)
- Crash reporting: **No dedicated crash SDK detected**
- Analytics: **No dedicated analytics SDK detected**
- Advertising: **No**

---

## 9) Permission Justification (All Manifest Permissions)

- `android.permission.INTERNET`  
  Required for API requests, live earthquake data, dynamic media, and guidance services.

- `android.permission.ACCESS_NETWORK_STATE`  
  Used to detect network availability and handle online/offline behavior safely.

- `android.permission.CAMERA`  
  Used only when user explicitly captures a building image for assessment workflows.

- `android.permission.READ_MEDIA_IMAGES`  
  Used for user-initiated image selection from device media for retrofit and analysis flows.

- `android.permission.POST_NOTIFICATIONS`  
  Used for optional disaster alert notifications when user grants permission.

- `android.permission.ACCESS_COARSE_LOCATION`  
  Used for approximate location support in location-based guidance flows when user requests.

- `android.permission.ACCESS_FINE_LOCATION`  
  Used for precise location support where user opts into geolocation features.

---

## 10) App Access

If Play Console requests app access instructions:

- Login required: **No**
- Statement: **"No login credentials are required."**

---

## 11) AI Disclosure (Play Listing / Policy Text)

This app includes AI-assisted recommendations to support resilience planning and retrofit guidance. AI outputs are advisory only and must not replace professional engineering judgment, official directives, or code compliance review.

---

## 12) Content Rating (Suggested)

- Suggested rating: **Everyone**
- Rationale: Informational and preparedness-focused content; no mature/adult themes detected.

(Final rating is determined by Play Console questionnaire responses.)

---

## 13) Target Audience (Suggested)

- Primary: **18+ (professionals, planners, administrators, technical users)**
- Not targeted toward children.

---

## 14) Ads Declaration

- Contains Ads: **NO**
- Basis: no ad SDK/dependency integration detected in app packages/config.

---

## 15) Final Release Checklist

- [ ] Privacy Policy URL live (`200`) on production web host
- [ ] Terms URL live (`200`) on production web host
- [ ] Contact URL live (`200`) on production web host
- [x] Package Name verified (`com.resilience360.mobile`)
- [x] Version Code verified (`3`)
- [x] Version Name verified (`1.0.2`)
- [x] Signed APK generated
- [x] Signed AAB generated
- [x] Play App Signing compatible artifact format (AAB)
- [x] Release build non-debuggable (`debuggable false`)
- [x] R8/minification enabled (`minifyEnabled true`)
- [x] Resource shrinking enabled (`shrinkResources true`)
- [x] Target SDK compliant (`36`)
- [x] Android 15 compatibility target path (API 35+) covered by target/compile 36
- [x] No ad SDK detected
- [x] Network security hardened (`usesCleartextTraffic=false`, network security config set)

---

## 16) Manual Inputs Still Required in Play Console

- Data Safety form final answers (copy from section 8 and adapt to legal/compliance policy).
- Content Rating questionnaire submission.
- App category/type/tags final confirmation.
- Privacy policy URL must be publicly reachable before production rollout.
- If required by policy review, provide explicit data deletion request workflow URL/details.

---

## Build Verification Commands Executed

- `npm run build`
- `npx cap sync android`
- `gradlew clean assembleRelease bundleRelease`
- `apksigner verify --print-certs app-release.apk`
- `keytool -printcert -jarfile app-release.aab`

