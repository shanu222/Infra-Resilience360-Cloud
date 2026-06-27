# API-Only Railway Architecture Enforcement Report

## Scope

This change enforces strict separation:

- `Vercel`: React/Vite frontend only
- `Railway`: Express API + storage proxy only
- `Cloudflare R2`: media origin via `MEDIA_BASE_URL`

No UI/layout/component/business-logic changes were introduced.

## Removed Frontend Serving Code (Backend)

Removed from `backend/index.mjs`:

- Frontend static serving toggles:
  - `SERVE_FRONTEND_ASSETS`
  - `ADMIN_SERVICE_MODE`
  - `distCandidates`
  - `distPath`
- Frontend static middleware:
  - `app.use(express.static(...))` for frontend assets
  - admin shell/static serving blocks
- SPA/document serving:
  - all `sendFile(index.html)` and admin html send logic
  - SPA catch-all fallback that returned `index.html`
- Legacy non-API/static portal mounts:
  - `/pgbc`
  - `/material-hubs`
  - `/disaster-dashboard`
  - `/uploads/community-issues`
- Legacy direct data/content mounts:
  - `/data` static mount
  - `/content` legacy route

## Railway Root Behavior

`GET /` now returns JSON API status (no HTML / SPA):

- `status`
- `service`
- `mode: api-only`
- `frontend: served-by-vercel`
- `mediaProxy: remote|local`
- `mediaBaseUrl` (when configured)

## Remaining API Routes

Railway now serves API endpoints only under:

- `/api/*` (all existing feature/content/admin endpoints)
- `/api/health` and `/api/geo/pak-cog.tif` (probe/utilities under `/api`)

Non-API unknown routes now return JSON 404.

## Remaining Storage Routes

Railway storage routes:

- `/storage/*` static storage root
- `/storage/content/*` media path:
  - proxies to `MEDIA_BASE_URL` when configured
  - in `NODE_ENV=production`, returns `503 media_base_url_not_configured` if missing
  - returns JSON 404 for missing content path

## MEDIA_BASE_URL Audit

- Verified `MEDIA_BASE_URL` is used as upstream for `/storage/content/*`.
- Verified response mode in root status reflects remote proxy mode.
- Verified production guard is active when `MEDIA_BASE_URL` is absent.

## metadata.json Audit

Audit command executed:

- metadata files discovered under `storage/content/*/metadata.json` for all 12 modules
- validated each `images/videos/pdfs/audio` entry:
  - relative path format
  - file existence under module folder

Result:

- modules audited: `12`
- issues: `0`

## Media Routing Enforcement (Frontend + Backend)

Legacy `/static/media/local/*` paths were normalized to `/storage/content/*` in:

- backend URL rewrite path generation
- frontend local media URL generation
- frontend section media URL resolver
- backend fallback homepage media defaults

This ensures background videos, Learn & Train videos, Retrofit Guide media, Smart Construction media, Best Practices media, and Resilience Models media all resolve through the centralized storage path model.

## Validation Evidence

### Build Validation

- `node --check backend/index.mjs` ✅
- `cd frontend && npm run build` ✅

### Runtime Route Validation (production-mode backend on test port)

- `GET /` → `200` JSON API status ✅
- `GET /api/health` → `200` ✅
- `GET /api/content/learn-train` → `200` ✅
- `GET /storage/content/home/videos/home.mp4` with `MEDIA_BASE_URL=https://example.com` → proxied upstream response ✅
- `GET /pgbc/test.pdf` → `404` ✅
- `GET /random-route` → `404` ✅

## Files Changed

- `backend/index.mjs`
- `backend/controllers/localCms.controller.mjs`
- `backend/routes/probes.routes.mjs`
- `backend/services/localCms.service.mjs`
- `backend/services/localUrlRewrite.mjs`
- `frontend/src/config/localContent.ts`
- `frontend/src/utils/sectionMediaUrl.ts`
- `API_ONLY_RAILWAY_ARCH_REPORT.md`
