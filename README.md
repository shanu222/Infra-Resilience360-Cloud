# Infra Resilience360

Infrastructure safety and disaster engineering toolkit for Pakistan: district planning, hazard overlays, NDMA-aligned guidance, AI-assisted tools, and field-ready outputs (web PWA + Android + iOS).

**Production:** [www.infraresilience.org](https://www.infraresilience.org) · API [api.infraresilience.org](https://api.infraresilience.org)

## Architecture

```text
┌─────────────────┐     HTTPS      ┌──────────────────┐
│  Web / Capacitor │ ──────────────► │  Express API      │
│  (Vite + React)  │   /api/*       │  server/index.mjs │
└────────┬────────┘                 └────────┬─────────┘
         │ direct GET (static media)          │ MongoDB, AI, S3 sync
         ▼                                    ▼
┌─────────────────┐                 ┌──────────────────┐
│  S3 public media │                 │  MongoDB Atlas   │
│  pak-population- │                 │  (CMS / config)  │
│  data/resilience360/               └──────────────────┘
└─────────────────┘
```

| Layer | Location |
|-------|----------|
| Frontend | `src/`, `public/`, `index.html` |
| Portals (in-repo) | `src/disaster-dashboard-portal/`, `src/material-hubs-portal/` |
| Backend | `server/` |
| Android | `android/` |
| iOS | `ios/` |
| Media config | `src/config/disasterDashboardMedia.ts`, S3 |

## Technology stack

- **UI:** React 19, TypeScript, Vite 7, Tailwind CSS 4, Leaflet
- **Mobile:** Capacitor 6 (Android + iOS)
- **API:** Express, MongoDB/Mongoose, Socket.IO
- **AI:** OpenAI (with optional Hugging Face / Gemini / Azure)
- **Media:** AWS S3 (`pak-population-data` / `resilience360/`)
- **PWA:** vite-plugin-pwa

## Quick start (new developer)

```bash
git clone https://github.com/shanu222/Resilience360.git
cd Resilience360
npm install
cp .env.example .env
# Edit .env — at minimum MONGODB_URI, OPENAI_API_KEY, ADMIN_API_KEY, AWS_* for S3 features
npm run dev:full
```

- Web UI: Vite dev server (default port **5173**)
- API: **http://localhost:10000** (proxied as `/api` from Vite)

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Frontend only |
| `npm run server` | Backend only |
| `npm run dev:full` | Frontend + backend |
| `npm run build` | Production web build → `dist/` |
| `npm run build:capacitor` | Mobile production web build |
| `npm run mobile:prepare` | Build + Capacitor sync (Android + iOS) |
| `npm run cap:open:android` | Open Android Studio |
| `npm run cap:open:ios` | Open Xcode (macOS) |

## Build & deploy documentation

| Topic | Doc |
|-------|-----|
| Environment variables | [.env.example](./.env.example) |
| AWS / S3 | [docs/AWS_SETUP.md](./docs/AWS_SETUP.md) |
| Web / Vercel | [docs/WEB_DEPLOYMENT.md](./docs/WEB_DEPLOYMENT.md) |
| Backend / PM2 | [docs/BACKEND_DEPLOYMENT.md](./docs/BACKEND_DEPLOYMENT.md) |
| Android APK / AAB | [docs/ANDROID_BUILD.md](./docs/ANDROID_BUILD.md) |
| iOS / Xcode | [docs/IOS_BUILD.md](./docs/IOS_BUILD.md) |
| Store release checklist | [docs/MOBILE_RELEASE_GUIDE.md](./docs/MOBILE_RELEASE_GUIDE.md) |
| Release consolidation | [docs/RELEASE_CONSOLIDATION_REPORT.md](./docs/RELEASE_CONSOLIDATION_REPORT.md) |
| Android readiness | [docs/ANDROID_RELEASE_READINESS.md](./docs/ANDROID_RELEASE_READINESS.md) |
| iOS readiness | [docs/IOS_RELEASE_READINESS.md](./docs/IOS_RELEASE_READINESS.md) |
| Web readiness | [docs/WEB_RELEASE_READINESS.md](./docs/WEB_RELEASE_READINESS.md) |
| Android signing | [docs/SIGNING_SETUP_GUIDE.md](./docs/SIGNING_SETUP_GUIDE.md) |
| Repository audit | [docs/REPOSITORY_COMPLETENESS_AUDIT.md](./docs/REPOSITORY_COMPLETENESS_AUDIT.md) |

## Android & iOS (summary)

```bash
npm run mobile:prepare
npm run cap:open:android   # or cap:open:ios on macOS
```

Release signing: copy `android/keystore.properties.template` → `android/keystore.properties` (local only, gitignored). See [docs/ANDROID_BUILD.md](./docs/ANDROID_BUILD.md).

## What is intentionally not in Git

| Item | Reason |
|------|--------|
| `.env` | Secrets |
| `node_modules/`, `dist/` | Generated |
| `*.keystore`, `keystore.properties` | Signing secrets |
| Large GeoTIFF rasters | Served from S3 / external; see `.gitignore` |
| `server/data/earthquake-alerts/sent-alerts.json` | Runtime state (may change locally) |

## Troubleshooting

| Problem | Check |
|---------|--------|
| API 404 on localhost | Server running on port **10000**; use `npm run dev:full` |
| AI routes fail | `OPENAI_API_KEY` in `.env`; `ALLOW_MISSING_OPENAI_KEY` only for local smoke tests |
| S3 media 403/404 | Folder **case** on S3 (`Flood` not `flood`); [docs/AWS_SETUP.md](./docs/AWS_SETUP.md) |
| Capacitor blank WebView | Run `npm run build:capacitor` then `npx cap sync` |
| Type errors | `npx tsc --noEmit` |

## License / contributions

Private production repository. Open issues on GitHub for defects and deployment questions.
