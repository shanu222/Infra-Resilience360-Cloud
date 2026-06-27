# Production Validation Report

- Base URL: `http://127.0.0.1:10031`
- Generated at: 2026-06-27T15:26:41.060Z

## Working Media
- Total working media URLs: 158
- home: 2/2 media URLs returned 200/206
- retrofit-guide: 0/0 media URLs returned 200/206
- smart-construction: 1/1 media URLs returned 200/206
- resilience-models: 58/58 media URLs returned 200/206
- material-hubs: 23/23 media URLs returned 200/206
- building-codes: 0/0 media URLs returned 200/206
- best-practices: 25/25 media URLs returned 200/206
- readiness-calculator: 0/0 media URLs returned 200/206
- learn-train: 26/26 media URLs returned 200/206
- disaster-dashboard: 22/22 media URLs returned 200/206
- live-earthquake-alerts: 1/1 media URLs returned 200/206

## Missing Media
- Total failing media URLs: 0

## Fixed Metadata
- No metadata structure changes were applied by this run.

## Uploaded Objects
- No automated R2 uploads were performed (requires R2 write credentials in execution environment).

## R2 Consistency
- R2 audit mode: skipped (missing_r2_credentials)
- Objects scanned: 0
- Malformed keys detected: 0
- Missing expected keys in bucket listing: 0
- Missing-key comparison skipped because bucket listing is unavailable in this environment.

## Broken URLs
- None

## Fixed URLs
- R2 proxy normalization is handled in backend and validated via 200/206 checks.

## GIS Changes
- Added backend population raster proxy aliases:
  - `/api/data/population/pakistan/pak_cog.tif`
  - `/data/population/pakistan/pak_cog.tif`
  - `/api/geo/pak-cog.tif` now falls back to `/storage/content/data/population/pak_cog.tif` when local file is absent.

## Earthquake Changes
- /api/earthquake/live status: 200
- source: USGS
- sourceLabel: Source: USGS
- timestamp present: yes
- statistics shape valid: yes
- latest events count: 12

## Population Changes
- /api/data/population/pakistan/pak_cog.tif -> 404
- /api/geo/pak-cog.tif -> 404

## Endpoint Validation
- /api/health -> 200
- /api/earthquake/live -> 200
- /api/global-earthquakes -> 200
- /api/data/population/pakistan/pak_cog.tif -> 404
- /api/geo/pak-cog.tif -> 404
