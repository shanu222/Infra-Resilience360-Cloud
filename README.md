# Infra Resilience360 Cloud

Infra Resilience360 Cloud is a production web platform for infrastructure resilience workflows, decision support, and disaster-readiness guidance.

## Architecture

```text
Users
  |
  v
Vercel (React + Vite frontend)
  |
  v
Railway (Node.js + Express API)
  |
  +--> Cloudflare R2 (runtime media objects)
  |
  +--> OpenAI API
```

## Deployment Model

- Frontend deploy target: Vercel
- Frontend root directory: `frontend`
- Backend deploy target: Railway
- Runtime media source: Cloudflare R2 via backend media proxy (`/storage/content/*`)
- No MongoDB required for production cloud deployment

## Project Structure

```text
backend/      Express API and integration services
frontend/     React + Vite application (Vercel root)
scripts/      Operational and migration utility scripts
docs/         Deployment and technical documentation
storage/      Development-only metadata structure
data/         Static/local datasets used by selected modules
```

## Frontend (Vercel) Deployment

Set Vercel project settings:

- Root Directory: `frontend`
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: `dist`

Required frontend env var:

- `VITE_API_BASE_URL` (Railway backend public URL)

## Backend (Railway) Deployment

Railway commands (root):

```bash
npm install
npm start
```

Health checks:

- `GET /health`
- `GET /api/health`

## Cloudflare R2 Configuration

Runtime media requests are served through backend route:

- `GET /storage/content/<module>/<path>`

Production recommendation:

- Set `MEDIA_BASE_URL` to your Cloudflare R2 public media base URL.
- Keep frontend media URLs unchanged; frontend always calls backend media route.

## Environment Variables

### Backend

- `NODE_ENV`
- `PORT`
- `OPENAI_API_KEY`
- `MEDIA_BASE_URL`
- `MEDIA_ROOT`
- `R2_ACCOUNT_ID`
- `R2_BUCKET`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_ENDPOINT`
- `API_BASE_URL`
- `JWT_SECRET` (if auth signing is enabled)

### Frontend

- `VITE_API_BASE_URL`

## Local Development

From repository root:

```bash
npm install
npm run dev:full
```

Or frontend only:

```bash
cd frontend
npm install
npm run dev
```

## Production Validation Checklist

- Frontend install/build succeeds from `frontend/`
- Backend starts and serves `/api/health` with `200`
- Media route `/storage/content/*` resolves through backend proxy in production
- No build artifacts or runtime media binaries are committed

## Notes

- UI/UX, routes, and business logic are intentionally unchanged during deployment hardening.
- This repository is prepared for production CI/CD with Vercel + Railway + Cloudflare R2.
