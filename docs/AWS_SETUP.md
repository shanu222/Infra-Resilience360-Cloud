# AWS setup (S3 media for Resilience360)

Resilience360 serves most heavy media from **Amazon S3**. The primary public bucket is **`pak-population-data`**. Application assets live under the **`resilience360/`** prefix.

## Bucket and folder layout

| Item | Value |
|------|--------|
| Bucket | `pak-population-data` |
| Region (typical) | `eu-north-1` (confirm in AWS console) |
| Public base URL | `https://pak-population-data.s3.amazonaws.com/` |
| App media prefix | `resilience360/` |

### Key prefixes (case-sensitive)

```text
resilience360/disaster-dashboard/{HazardFolder}/image.png
resilience360/disaster-dashboard/{HazardFolder}/video.mp4
resilience360/disaster-dashboard/{HazardFolder}/audio.m4a

resilience360/portals/material-hubs/...
resilience360/learn/...
resilience360/cms/...          # optional CMS-synced objects (admin workflows)
```

Disaster dashboard folders use **Title Case** where applicable (`Flood`, `Earthquake`, `Heatwave`, `Loadshedding`). Some hazards use lowercase slugs (`urban-fire`, `storm-cyclone`, `crop-fire`).

Frontend static URLs are built in `src/config/disasterDashboard.ts` → `s3DisasterDashboardUrl()`.

## IAM permissions (API / sync scripts)

Create an IAM user or role for the Node API and migration scripts with at least:

- `s3:GetObject` on `arn:aws:s3:::pak-population-data/resilience360/*`
- `s3:PutObject`, `s3:DeleteObject` (only if running CMS → S3 sync or upload scripts)
- `s3:ListBucket` with prefix condition on `resilience360/` (for sync jobs)

Example policy snippet (read-only public delivery + optional write):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject"],
      "Resource": "arn:aws:s3:::pak-population-data/resilience360/*"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:DeleteObject", "s3:ListBucket"],
      "Resource": [
        "arn:aws:s3:::pak-population-data",
        "arn:aws:s3:::pak-population-data/resilience360/*"
      ],
      "Condition": {
        "StringLike": { "s3:prefix": ["resilience360/*"] }
      }
    }
  ]
}
```

Map credentials to server environment variables (see `.env.example`):

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `S3_MEDIA_BUCKET=pak-population-data`
- Optional: `S3_PUBLIC_BASE_URL`, `AWS_SESSION_TOKEN`

## CORS (browser direct access)

If the web app loads S3 URLs directly (disaster dashboard, portals), the bucket CORS configuration should allow your origins:

```xml
<CORSConfiguration>
  <CORSRule>
    <AllowedOrigin>https://www.infraresilience.org</AllowedOrigin>
    <AllowedOrigin>https://infraresilience.org</AllowedOrigin>
    <AllowedOrigin>http://localhost:5173</AllowedOrigin>
    <AllowedMethod>GET</AllowedMethod>
    <AllowedMethod>HEAD</AllowedMethod>
    <AllowedHeader>*</AllowedHeader>
    <MaxAgeSeconds>3600</MaxAgeSeconds>
  </CORSRule>
</CORSConfiguration>
```

Add Capacitor/WebView origins or use CloudFront with a single origin if you front the bucket.

## Public read vs private + presign

- **Public objects**: disaster dashboard and many portal assets use direct HTTPS URLs (no CMS at runtime).
- **Presigned URLs**: server route `respondPublicDisasterMediaPresign` when `S3_MEDIA_BUCKET` and AWS credentials are configured (`server/services/media.service.mjs`).

## Local-only assets (not in Git)

Large population rasters are **gitignored** by design:

- `data/pak_cog.tif`, `data/pak_population.tif`, `public/data/pak_cog.tif`

Serve these from S3 or an external tile endpoint in production. Do not commit multi-GB GeoTIFF files.

## Deployment checklist

1. Create or use bucket `pak-population-data`.
2. Upload `resilience360/` tree (or run project sync scripts with AWS credentials).
3. Set bucket policy / object ACLs so public GET works for public prefixes (or use CloudFront).
4. Apply CORS for web and local dev origins.
5. Configure API `.env` with AWS variables and restart `npm run server`.
6. Verify: `curl -I https://pak-population-data.s3.amazonaws.com/resilience360/disaster-dashboard/Flood/image.png` → `200`.

## Related docs

- [BACKEND_DEPLOYMENT.md](./BACKEND_DEPLOYMENT.md) — API env vars
- [WEB_DEPLOYMENT.md](./WEB_DEPLOYMENT.md) — frontend `VITE_*` S3 overrides
- `src/config/disasterDashboardMedia.ts` — per-hazard S3 paths
