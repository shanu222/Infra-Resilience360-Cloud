# Infra Resilience360 Cloud

## Infrastructure Safety & Disaster Engineering Toolkit for Pakistan

Infra Resilience360 is an enterprise disaster resilience platform developed to support engineers, planners, emergency managers, researchers, and government organizations in improving infrastructure resilience across Pakistan.

The platform provides hazard-aware engineering guidance, infrastructure assessment tools, AI-assisted recommendations, technical documentation, and disaster preparedness resources through a single unified application.

The cloud edition is designed for:

* Web Application
* Progressive Web App (PWA)
* Android Application
* iOS Application

using a centralized cloud architecture that can later be migrated to an NDMA local server without changing the application.

---

# Cloud Architecture

```
Users
    │
    ▼
Vercel (Frontend)
    │
    ▼
Railway (Backend API)
    │
    ├────────► Cloudflare R2
    │             storage/content/
    │
    └────────► OpenAI API
```

---

# Technology Stack

## Frontend

* React 19
* TypeScript
* Vite
* Tailwind CSS
* Leaflet
* Capacitor
* Progressive Web App (PWA)

---

## Backend

* Node.js
* Express.js
* REST API
* OpenAI Integration

---

## Media Storage

Cloudflare R2

All runtime media is centralized inside:

```
storage/content/
```

Media includes only:

* Images
* Videos
* PDFs
* Audio

No runtime media is bundled into the frontend.

---

# Application Modules

The platform currently includes:

1. Home
2. Retrofit Guide
3. Resilience Infra Models
4. Design Toolkit
5. Smart Construction
6. Material Hubs
7. Building Codes
8. Best Practices
9. Readiness Calculator
10. Learn & Train
11. Live Earthquake Alerts
12. Disaster Dashboard

Each module loads its runtime media from the centralized storage repository.

---

# Repository Structure

```
Resilience360/

backend/
frontend/
modules/
storage/
data/
scripts/

package.json
README.md
```

---

# Storage Structure

```
storage/

content/

home/
retrofit-guide/
resilience-models/
design-toolkit/
smart-construction/
material-hubs/
building-codes/
best-practices/
readiness-calculator/
learn-train/
live-earthquake-alerts/
disaster-dashboard/
```

Each module contains only its own runtime media.

Example:

```
retrofit-guide/

images/
videos/
pdfs/
audio/
metadata.json
```

Only folders that actually contain media are present.

---

# Centralized Media Policy

The centralized storage repository contains only:

* Images
* Videos
* PDFs
* Audio
* metadata.json

It does not contain:

* Logos
* Icons
* Fonts
* UI assets
* CSS
* JavaScript
* React components
* Source code

These remain bundled with the frontend application.

---

# Development

Install dependencies:

```
npm install
```

Run the full development environment:

```
npm run dev:full
```

Default ports:

Frontend

```
http://localhost:5173
```

Backend

```
http://localhost:10000
```

---

# Build

Web

```
npm run build
```

Android / iOS

```
npm run mobile:prepare
```

Android Studio

```
npm run cap:open:android
```

Xcode (macOS)

```
npm run cap:open:ios
```

---

# Environment Variables

Typical environment variables include:

```
PORT

VITE_API_BASE_URL

MEDIA_PROVIDER

R2_ACCOUNT_ID

R2_BUCKET

R2_ACCESS_KEY_ID

R2_SECRET_ACCESS_KEY

OPENAI_API_KEY
```

No media paths are hardcoded.

---

# Cloud Deployment

## Frontend

Vercel

## Backend

Railway

## Media Storage

Cloudflare R2

Runtime media is served by the backend from Cloudflare R2.

---

# NDMA Local Deployment

The same application can later be deployed entirely within the NDMA infrastructure.

Cloudflare R2 can be replaced with a local storage directory, such as:

```
D:\NDMA_STORAGE\content\
```

No frontend code changes are required.

---

# Git Repository

This repository intentionally excludes:

* Runtime media
* Build artifacts
* Cache
* Logs
* Uploads
* Environment secrets
* Node modules

The repository contains only application source code and configuration.

---

# License

Private repository.

Developed for Infrastructure Resilience360.

All rights reserved.
