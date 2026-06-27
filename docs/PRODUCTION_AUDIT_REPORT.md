# Production Audit Report

Generated: 2026-06-27

Architecture validated:
- Frontend: Vercel
- Backend: Railway
- Media: Cloudflare R2 via Railway `/storage/content/*` proxy only

## ✓ Working

- **Deep-link routing (SPA paths)**: local preview refresh checks returned `200` for:
  - `/view/smart-construction`
  - `/view/retrofit`
  - `/view/material-hubs`
  - `/view/learn`
  - `/view/design-toolkit`
  - `/view/building-codes`
  - `/view/live-earthquake`
  - `/view/disaster-dashboard`
- **Vercel route fallback hardening**: added `frontend/vercel.json` filesystem-first + `/index.html` fallback for non-file routes.
- **Media routing through backend proxy**: runtime validation returned `200/206` for all tested module media URLs.
- **Module media validation** (`scripts/production-validation.mjs`):
  - `home`: 2/2
  - `smart-construction`: 1/1
  - `resilience-models`: 58/58
  - `material-hubs`: 23/23
  - `best-practices`: 25/25
  - `learn-train`: 26/26
  - `disaster-dashboard`: 22/22
  - `live-earthquake-alerts`: 1/1
- **Earthquake live backend**:
  - `/api/earthquake/live` returns `200`
  - source fields present: `source=USGS`, `sourceLabel=Source: USGS`
  - includes `timestamp`, `statistics`, `latestEvents`, `features`
  - supports timeout/retry/cached fallback behavior
- **Backend R2 key normalization** remains canonical (`content/<remaining-path>`) for `/storage/content/*`.
- **Single-page scroll parity improvements** for iframe-backed modules:
  - Added auto-height iframe integration for:
    - `smart-construction`
    - `retrofit-calculator`
    - `building-codes`
  - This reduces nested iframe-only scrolling and keeps shell/header/module in one continuous document flow.
- **Background video parity improvements**:
  - Global shell video layer moved to fixed viewport backdrop (`position: fixed; inset: 0`) so background coverage stays full-screen behind the app surface during page scroll.

## ⚠ Warning

- **Population raster endpoint** still fails in this environment:
  - `/api/data/population/pakistan/pak_cog.tif` -> `404`
  - `/api/geo/pak-cog.tif` -> `404`
  - Cause: target object `content/data/population/pak_cog.tif` is not reachable via current R2/public path in this runtime.
- **R2 full bucket consistency audit** is limited here:
  - R2 listing skipped due missing runtime credentials (`R2_*` not available in this shell session).
  - Endpoint-level proxy media checks are passing, but bucket-wide duplicate/case/path normalization cannot be fully automated without R2 list/write credentials.
- **Frontend URL scan** found only development-safe references in source:
  - `localhost` / `127.0.0.1` used in dev fallback code paths (`apiBase`, URL parsing helpers, dev SW bootstrap checks).
  - No production hardcoded R2 direct media serving was introduced by these changes.

## ✗ Broken

- **Population GIS COG production path**:
  - Backend proxy aliases exist, but upstream content is unavailable (`404`) until the raster is present at:
    - `content/data/population/pak_cog.tif` in R2.

## Fixes Applied In This Pass

- Added `frontend/vercel.json` SPA fallback:
  - filesystem routes first
  - fallback to `/index.html` for deep links
- Added `frontend/src/hooks/useIframeAutoHeight.ts`
- Updated iframe-backed portal pages to use auto-height + `scrolling="no"`:
  - `frontend/src/pages/portals/SmartConstructionPage.tsx`
  - `frontend/src/pages/portals/CostEstimatorPage.tsx`
  - `frontend/src/pages/portals/BuildingCodesPage.tsx`
- Updated global background video CSS in `frontend/src/index.css`:
  - fixed full-screen backdrop for consistent page-wide coverage
- Re-ran production validation script:
  - `scripts/production-validation.mjs`
  - output: `docs/PRODUCTION_VALIDATION_REPORT.md`

## Backend/Cloud Endpoints Spot Check

- `/api/health` -> `200`
- `/api/earthquake/live` -> `200`
- `/api/global-earthquakes` -> `200`
- `/api/data/population/pakistan/pak_cog.tif` -> `404` (known blocker)
- `/api/geo/pak-cog.tif` -> `404` (known blocker)

## Remaining Actions For Full Green Status

1. Upload `pak_cog.tif` to R2 at `content/data/population/pak_cog.tif`.
2. Ensure Railway env has either:
   - public `MEDIA_BASE_URL` that exposes `content/data/population/pak_cog.tif`, or
   - valid `R2_*` credentials for authenticated fallback stream.
3. Re-run `node scripts/production-validation.mjs` against Railway production URL and confirm population endpoints return `200/206`.

