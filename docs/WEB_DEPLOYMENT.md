# Web deployment (frontend)

Frontend stack: **Vite 7 + React 19 + TypeScript**  
Build output: **`dist/`**  
Production site: **`https://www.infraresilience.org`**

## Build commands

```bash
npm install
npm run build          # standard web/PWA production build
npm run build:capacitor  # mobile-oriented build (Capacitor flags + API URLs)
npm run preview        # local preview of dist/
```

Typecheck:

```bash
npx tsc --noEmit
```

## Environment variables (build-time)

Set in CI or shell before `npm run build`:

| Variable | When to set | Purpose |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Separate API host | Absolute API origin (e.g. `https://api.infraresilience.org`) |
| `VITE_SITE_URL` | PWA / metadata | Public site URL |
| `VITE_CAPACITOR=1` | Mobile only | Set by `build:capacitor` script |
| `VITE_PORTAL_BASE_URL` | Mobile / portals | Shell URL for embedded portals |
| `VITE_S3_MEDIA_BUCKET` | Optional override | Default `pak-population-data` |
| `VITE_ADMIN_API_KEY` | Admin builds only | Must match server `ADMIN_API_KEY` |
| `VITE_BASE_PATH` | Subpath hosting | e.g. `/Resilience360/` for GitHub Pages subfolder |

See `.env.example` for the full list.

## Vercel deployment

1. Import GitHub repo in Vercel.
2. **Framework preset**: Vite  
3. **Build command**: `npm run build`  
4. **Output directory**: `dist`  
5. **Install command**: `npm ci`  
6. Environment variables (Production):

   - `VITE_API_BASE_URL=https://api.infraresilience.org`
   - `VITE_SITE_URL=https://www.infraresilience.org`
   - Any `VITE_NDMA_*` / `VITE_PMD_*` overrides if needed

7. Deploy; attach custom domain `www.infraresilience.org`.

Node version: **20** (match `.github/workflows`).

## GitHub Pages (subpath)

Workflow [`.github/workflows/deploy-pages.yml`](../.github/workflows/deploy-pages.yml) currently builds the **`Retrofit Calculator`** subfolder only, not the main app.

For main-app Pages under a subpath you would need a separate workflow with:

- `VITE_BASE_PATH=/Resilience360/`
- `npm run build` at repo root
- Upload `dist/` as Pages artifact

Production uses **custom domain hosting** (Vercel/nginx), not this workflow, for the primary shell.

## nginx static hosting (same server as API)

Example samples in `deploy/`:

- `deploy/nginx-net360.sample.conf` — static `dist/` + proxy `/api`
- `deploy/nginx-api.infraresilience.org.conf.example` — API vhost

Typical pattern:

- `www` → serve `dist/` as static files
- `api` → proxy to `localhost:10000`

## Post-deploy checks

- [ ] `https://www.infraresilience.org` loads shell
- [ ] API calls reach `https://api.infraresilience.org` (network tab)
- [ ] S3 disaster media loads (no CORS errors)
- [ ] Service worker updates (`vite-plugin-pwa`)

## Related docs

- [BACKEND_DEPLOYMENT.md](./BACKEND_DEPLOYMENT.md)
- [AWS_SETUP.md](./AWS_SETUP.md)
- [ANDROID_BUILD.md](./ANDROID_BUILD.md) / [IOS_BUILD.md](./IOS_BUILD.md)
