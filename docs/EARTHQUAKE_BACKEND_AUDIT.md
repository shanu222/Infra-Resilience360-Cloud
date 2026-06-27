# Live Earthquake Backend Audit

**Date:** 2026-06-27  
**Environment:** Production (Railway + R2 + Vercel)

## Architecture (unchanged)

```
Browser
  ↓
Vercel (React)
  ↓
Railway API (/api/earthquake/live, /storage/content/*)
  ↓
USGS feed + Cloudflare R2 media
```

## Current Provider

| Setting | Value |
|---------|-------|
| `EARTHQUAKE_PROVIDER` | `USGS` |
| Active provider | **USGS** |
| EMSC | disabled (`EMSC_ENABLED=false`) |
| GFZ | disabled (`GFZ_ENABLED=false`) |
| ISC | disabled (`ISC_ENABLED=false`) |
| NDMA | disabled placeholder (`NDMA_ENABLED=false`) |

## Feed URL

`https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson`

Configurable via `USGS_FEED` or legacy `USGS_FEED_URL`.

## Population Raster Path

| Layer | Path |
|-------|------|
| **Canonical R2 object key** | `content/live-earthquake-alerts/pak_cog.tif` |
| **Railway proxy URL** | `/storage/content/live-earthquake-alerts/pak_cog.tif` |
| Backward-compatible API aliases | `/api/data/population/pakistan/pak_cog.tif`, `/api/geo/pak-cog.tif`, `/data/population/pakistan/pak_cog.tif` |
| Legacy redirect alias | `/storage/content/data/population/pak_cog.tif` → canonical path |

## Provider Architecture

New module: `backend/services/earthquake/`

```
aggregator.mjs     — orchestration, failover, refresh loop
cache.mjs          — in-memory + disk cache (storage/cache/earthquake/latest.json)
config.mjs         — env-driven provider toggles
normalize.mjs      — unified GeoJSON schema
providers/
  usgs.mjs         — enabled (production)
  emsc.mjs         — disabled placeholder
  gfz.mjs          — disabled placeholder
  isc.mjs          — disabled placeholder
  ndma.mjs         — future placeholder
```

Unified API schema (backward compatible):

```json
{
  "source": "USGS",
  "sourceLabel": "Source: USGS",
  "provider": "USGS",
  "timestamp": "ISO-8601",
  "lastUpdated": "ISO-8601",
  "feedUrl": "https://...",
  "statistics": { "total", "significant", "last24h", "highestMagnitude" },
  "latestEvents": [],
  "features": [],
  "fromCache": false,
  "cacheAge": 0
}
```

## Cache Status

| Setting | Value |
|---------|-------|
| `EARTHQUAKE_REFRESH_SECONDS` | `60` |
| Memory TTL | 60 seconds |
| Background refresh | every 60s via `startEarthquakeRefreshLoop()` |
| Disk fallback | `storage/cache/earthquake/latest.json` |
| Failover | retry USGS → serve disk cache → serve memory cache → return empty features with `sourceLabel` (never 503 crash) |

Target response time for cached requests: **< 100ms** (served from memory without upstream fetch).

## Root Cause: “Source: unavailable” in UI

The backend already returned `source: USGS` and `sourceLabel: Source: USGS`.

The Live Earthquake monitor (`liveEarthquakeMonitor.js`) called `/api/earthquake/live` as a **same-origin relative URL** on Vercel. Vercel does not host that API route, so the fetch failed and the monitor fell back to `sourceUnavailable`.

**Fix (data-flow only, no UI/layout changes):**

- `buildApiTargets()` now prepends `window.__R360_API_BASE_URL` (Railway) — same pattern as `live-earthquake-monitor-boot.js`.
- `fetchEarthquakes()` now derives `sourceLabel` from `payload.sourceLabel` or `payload.source` even when using cached/empty feature sets.

## Validation Results (pre-deploy production check)

| Check | Result |
|-------|--------|
| `GET /api/earthquake/live` | **200** |
| `source` | **USGS** |
| `sourceLabel` | **Source: USGS** |
| `statistics` | present (`total: 192`, etc.) |
| `latestEvents` | 12 events |
| `features` | 192 features |
| `GET /storage/content/live-earthquake-alerts/pak_cog.tif` | **200** `image/tiff` |
| `GET /api/data/population/pakistan/pak_cog.tif` | **307** → canonical path (after deploy) |

## Remaining Issues

1. **Vercel redeploy required** for the `liveEarthquakeMonitor.js` API base fix to reach production UI.
2. **Railway redeploy required** for population alias routes and provider module (auto from `main` push).
3. Legacy clients hitting `/storage/content/data/population/pak_cog.tif` are redirected to the canonical path (no duplicate R2 object required).

## Files Changed

- `backend/config/populationRaster.mjs` (new)
- `backend/services/earthquake/*` (new provider module)
- `backend/index.mjs` — wire aggregator, remove inline live-feed logic
- `backend/routes/probes.routes.mjs` — canonical COG paths + legacy alias redirect
- `frontend/src/modules/live-earthquake-alerts/liveEarthquakeMonitor.js` — Railway API target resolution
- `.env.example` — earthquake env vars
- `scripts/production-validation.mjs` — updated GIS path note
