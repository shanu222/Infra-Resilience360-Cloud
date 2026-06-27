# Resilience360 deployment guide

## Overview

This repository includes:

1. **Main SPA** — Vite/React (e.g. Vercel for production UI).
2. **Node API** — `server/index.mjs` (deploy on **AWS** or any host that supports Node + HTTPS).
3. **Portals** — Retrofit Calculator, Disaster Dashboard, and other bundles under `public/` or sibling apps.

## Frontend (Vercel or static CDN)

- **Vercel hosts the UI only.** All `/api/*` traffic must go to your **AWS** (or other) API origin.
- Set at **build time**:

```bash
VITE_SITE_URL=https://your-api-host.example.com
# Optional alias (ignored if VITE_SITE_URL is set):
# VITE_API_URL=https://your-api-host.example.com
```

- No trailing slash. Rebuild after changing this value.

## Backend (AWS)

### Environment variables (typical)

- `MONGODB_URI` — CMS / page config.
- `OPENAI_API_KEY` or `OPENAI_API_KEYS` — **server only** (vision and other AI routes).
- `CORS_ORIGIN` / `CORS_ORIGINS` — production and preview UI origins (comma-separated).
- `S3_MEDIA_BUCKET`, `AWS_REGION`, credentials — media and CMS uploads as documented in `.env.example`.
- `PORT` — listening port (default `10000` for local dev).

### Health check

```http
GET /health
GET /api/health
```

### Vision (Retrofit / portal clients)

```http
POST /api/vision/analyze
Content-Type: multipart/form-data
```

Field: `image` (file). Additional fields match existing API contracts.

## Local development

```bash
npm install
npm run server    # API on http://localhost:10000
npm run dev       # Vite (proxies /api to 10000 when using same-origin)
```

## Workflow

1. Deploy API to your HTTPS host; set secrets there.
2. Point `VITE_SITE_URL` at that host; build and deploy the frontend.
3. Confirm CORS allows your exact browser origin (Vercel production + previews as needed).

