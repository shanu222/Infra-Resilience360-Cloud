# Play Store Final Checklist

Last updated: 2026-07-06

## Public Legal URLs

- Privacy Policy URL: `https://infra-resilience360-cloud-production.up.railway.app/privacy-policy`
- Terms URL: `https://infra-resilience360-cloud-production.up.railway.app/terms-and-conditions`
- Contact URL: `https://infra-resilience360-cloud-production.up.railway.app/contact`
- About URL: `https://infra-resilience360-cloud-production.up.railway.app/about`

## Android Release Identity (from `android-production` release config)

- Package Name: `com.resilience360.mobile`
- Version Code: `4`
- Version Name: `1.0.3`
- SHA1: `AF:3D:D0:B6:BD:F0:F5:B1:6E:A0:34:0A:D9:18:65:66:4D:42:5A:0F`
- SHA256: `1C:6F:9B:6C:29:95:DE:B7:AE:1A:08:44:E1:12:F3:28:54:F6:36:DD:C3:85:9C:A3:F5:E0:B5:48:E1:8D:E1:74`

## Android Permissions Used

- `android.permission.INTERNET`
- `android.permission.ACCESS_NETWORK_STATE`
- `android.permission.CAMERA`
- `android.permission.READ_MEDIA_IMAGES`
- `android.permission.POST_NOTIFICATIONS`
- `android.permission.ACCESS_COARSE_LOCATION`
- `android.permission.ACCESS_FINE_LOCATION`

## Data Safety Summary

- Data may include user-selected/captured images, optional location data, notification preferences, and operational service metadata.
- Camera, gallery, and location are user-initiated feature permissions.
- Data is intended for guidance features, resilience workflows, and optional AI-assisted analysis.
- User-facing privacy and terms pages are now written in production-ready end-user language.

## AI Disclosure Summary

- Infra Resilience360 includes AI-assisted outputs for guidance and analysis.
- AI outputs are advisory and do not replace professional engineering judgment, legal review, or official emergency directives.

## Legal Accessibility and Navigation Confirmation

- Web routes implemented for `/privacy-policy`, `/terms-and-conditions`, `/about`, and `/contact` in the frontend legal app renderer.
- Backend legal route handlers were added for the same paths so direct URL access returns an HTML legal page instead of `route_not_found`.
- In-app legal pages no longer include custom `Open in Browser` or `Back` buttons; users return using standard browser or Android back navigation.
- Footer links include legal destinations and remain directly linkable.

## Media and Asset Confirmation

- Local bundled assets remain bundled (no migration to remote URLs in this change set).
- Dynamic media architecture remains R2-backed for runtime media modules.
- No media-loading logic was replaced with bundled fallbacks in this final web polish.

## Play Console Manual Checks Remaining

- Verify production deployment returns `200` for all four public legal URLs after rollout.
- Re-run signed APK/AAB verification on `android-production` immediately before upload to confirm final artifact metadata.
- Confirm Android launcher adaptive/round/monochrome icon assets match approved brand image in final signed build (no Android branch changes were pushed in this web-only release).
- Complete/confirm Play Console Data Safety questionnaire and policy declarations with release manager/legal reviewer.
