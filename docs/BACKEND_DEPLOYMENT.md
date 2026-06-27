# Backend deployment

Backend entry: **`server/index.mjs`**  
Start command: **`npm run server`**  
Default port: **`10000`** (override with `PORT`)

## What is in the repository

All backend source is under **`server/`**:

- `server/index.mjs` — main Express app
- `server/controllers/`, `server/services/`, `server/routes/`
- `server/data/` — runtime JSON stores (e.g. infra models, earthquake alert state)
- `server/s3CmsHelpers.mjs`, `server/dynamicMedia.mjs` — S3 integration

No separate backend repo is required.

## Local development

```bash
cp .env.example .env
# Edit .env: MONGODB_URI, OPENAI_API_KEY, AWS_*, ADMIN_API_KEY, etc.

npm install
npm run dev:full    # Vite + API (proxy /api → localhost:10000)
# or
npm run server      # API only
```

Health check (after start):

```bash
curl http://localhost:10000/health
```

Vite dev server proxies `/api` to `http://localhost:10000` (see `vite.config.ts`).

## Production environment variables

Minimum for full production (see `.env.example` for full list):

| Variable | Purpose |
|----------|---------|
| `PORT` | Host port (often set by platform) |
| `NODE_ENV=production` | Production mode |
| `MONGODB_URI` | CMS / page config / content |
| `OPENAI_API_KEY` or `OPENAI_API_KEYS` | AI features |
| `S3_MEDIA_BUCKET` | e.g. `pak-population-data` |
| `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | S3 access |
| `ADMIN_API_KEY` | Admin/CMS routes (match `VITE_ADMIN_API_KEY` on frontend if used) |
| `CORS_ORIGIN` or `CORS_ORIGINS` | Frontend origin(s) |

Optional: Hugging Face fallback, Gemini, email recovery (`RESEND_API_KEY`), earthquake notifier flags — all documented in `.env.example`.

## Deploy to a Node host (AWS EC2, ECS, VM)

1. Clone repo on server (or deploy artifact from CI).
2. `npm ci --omit=dev` (or `npm install` for dev parity).
3. Set environment variables (Parameter Store / `.env` — **never commit** `.env`).
4. Start: `npm run server`
5. Put HTTPS reverse proxy in front (nginx example: `deploy/nginx-api.infraresilience.org.conf.example`).

Production API URL in this project: **`https://api.infraresilience.org`**

## PM2 deployment (example)

Install PM2 globally on the server, then from repo root:

```bash
npm ci --omit=dev
pm2 start server/index.mjs --name resilience360-api --interpreter node
pm2 save
pm2 startup
```

With env file (PM2 5+):

```bash
pm2 start server/index.mjs --name resilience360-api --node-args="--env-file=.env"
```

Or use an `ecosystem.config.cjs` (create locally, do not commit secrets):

```javascript
module.exports = {
  apps: [{
    name: 'resilience360-api',
    script: 'server/index.mjs',
    interpreter: 'node',
    instances: 1,
    env: { NODE_ENV: 'production', PORT: 10000 },
  }],
}
```

```bash
pm2 start ecosystem.config.cjs
```

## Auto-deploy from GitHub

See also [BACKEND_DEPLOY_INSTRUCTIONS.md](./BACKEND_DEPLOY_INSTRUCTIONS.md) for GitHub-connected host setup.

On each push to `main`:

- `npm install`
- `npm run server` as start command
- Inject secrets from host UI

## Verify production

```bash
curl https://api.infraresilience.org/health
```

Wire frontend:

- `VITE_API_BASE_URL=https://api.infraresilience.org` (build-time), or
- Same-origin `/api` if Node serves the SPA behind one domain

## Related docs

- [AWS_SETUP.md](./AWS_SETUP.md)
- [WEB_DEPLOYMENT.md](./WEB_DEPLOYMENT.md)
- `.env.example`
