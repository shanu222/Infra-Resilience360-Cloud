import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')
const rootModules = path.join(repoRoot, 'node_modules')

const configuredBase = process.env.VITE_BASE_PATH ?? '/'
const base = configuredBase.endsWith('/') ? configuredBase : `${configuredBase}/`
const siteUrl = String(process.env.VITE_SITE_URL ?? 'https://www.infraresilience.org').replace(/\/+$/, '')
const localApiTarget = String(process.env.VITE_API_BASE_URL ?? 'http://localhost:10000').trim().replace(/\/+$/, '')

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  root: __dirname,
  base,
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
    target: 'es2022',
    cssCodeSplit: true,
    cssMinify: mode === 'production',
    sourcemap: mode === 'production' ? 'hidden' : true,
    minify: 'esbuild',
    chunkSizeWarningLimit: 2048,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          const norm = id.replace(/\\/g, '/')
          if (norm.includes('/react-dom/') || norm.includes('/react/')) return 'vendor-react'
          if (norm.includes('leaflet')) return 'vendor-leaflet'
          if (norm.includes('react-globe') || norm.includes('/three/') || norm.includes('three-globe')) return 'vendor-globe'
          if (norm.includes('geotiff')) return 'vendor-pdf'
          if (norm.includes('jspdf') || norm.includes('html2canvas')) return 'vendor-pdf'
          if (norm.includes('docx') || norm.includes('exceljs') || norm.includes('mammoth')) return 'vendor-office'
          if (norm.includes('lucide-react')) return 'vendor-icons'
          if (norm.includes('@turf/')) return 'vendor-turf'
          return undefined
        },
      },
    },
  },
  esbuild: {
    legalComments: 'none',
    drop: mode === 'production' ? ['debugger'] : [],
  },
  resolve: {
    // Portal modules ship nested node_modules (e.g. Retrofit Calculator uses React 18 + motion).
    // Force a single React + Motion instance for the embedded shell to prevent useContext crashes.
    dedupe: ['react', 'react-dom', 'motion', 'framer-motion'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@resilience/api-base': path.resolve(__dirname, 'src/services/apiBase.ts'),
      '@resilience/retrofit-portal-locale': path.resolve(__dirname, 'src/i18n/retrofitPortalLocale.ts'),
      '@resilience/urdu-pdf-support': path.resolve(__dirname, 'src/utils/urduPdfSupport.ts'),
      '@resilience/urdu-html-to-pdf': path.resolve(__dirname, 'src/utils/urduHtmlToPdf.ts'),
      react: path.join(rootModules, 'react'),
      'react-dom': path.join(rootModules, 'react-dom'),
      motion: path.join(rootModules, 'motion'),
      'motion/react': path.join(rootModules, 'motion/react'),
      'framer-motion': path.join(rootModules, 'framer-motion'),
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'motion/react'],
    dedupe: ['react', 'react-dom', 'motion', 'framer-motion'],
  },
  plugins: [
    react(),
    {
      name: 'block-direct-storage-content-dev',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const raw = String(req.url || '')
          const pathname = raw.split('?')[0] || ''
          if (pathname.startsWith('/storage/content/') || pathname.startsWith('/content/')) {
            res.statusCode = 404
            res.setHeader('content-type', 'application/json; charset=utf-8')
            res.end(JSON.stringify({ error: 'direct_frontend_media_path_blocked' }))
            return
          }
          next()
        })
      },
    },
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        cleanupOutdatedCaches: true,
        // Keep precache lean: portal trees ship huge PNG/PDF copies under public/. Those paths are
        // excluded here so SW install/update stays fast; portals still load from network and can use
        // runtime caching below on repeat visits.
        globPatterns: ['**/*.{js,css,html,svg,webp,json,woff2}'],
        globIgnores: [
          '**/node_modules/**/*',
          '**/pgbc/**',
          '**/material-hubs/**',
          '**/disaster-dashboard/**',
          '**/assets/for-disaster-dashboard/**',
          '**/retrofit-calculator/**',
          '**/smart-construction/**',
        ],
        // Skip any individual build artifact larger than this (defense in depth vs glob mistakes).
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        navigateFallbackDenylist: [
          // Match with or without Vite base (e.g. /pgbc/ and /Resilience360/pgbc/)
          /\/material-hubs(?:\/|$)/,
          /\/retrofit-calculator(?:\/|$)/,
          /\/smart-construction(?:\/|$)/,
          /\/pgbc(?:\/|$)/,
          // Static embedded page; must never be rewritten to SPA index fallback.
          /\/live-earthquake-alerts(?:\.html)?(?:\/|$)/,
          // Standalone portal bundle (iframe); do not serve main SPA fallback here
          /\/disaster-dashboard(?:\/|$)/,
        ],
        runtimeCaching: [
          {
            urlPattern: ({ url, request }) =>
              request.method === 'GET' &&
              request.destination === 'video' &&
              /\/assets\/backgrounds\/background-video\.mp4$/i.test(url.pathname),
            handler: 'CacheFirst',
            options: {
              cacheName: 'global-background-media',
              expiration: {
                maxEntries: 2,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: ({ url, request }) =>
              request.method === 'GET' &&
              !url.pathname.includes('/api/') &&
              /\/(pgbc|material-hubs|disaster-dashboard|retrofit-calculator|smart-construction)(?:\/|$)/i.test(
                url.pathname,
              ),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'portal-static',
              expiration: {
                maxEntries: 120,
                maxAgeSeconds: 60 * 60 * 24 * 14,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/tile\.openstreetmap\.org\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'osm-tiles',
              expiration: {
                maxEntries: 220,
                maxAgeSeconds: 60 * 60 * 24 * 14,
              },
            },
          },
          {
            urlPattern: ({ url, request }) =>
              request.method === 'GET' && /\.geojson$/i.test(url.pathname),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'geojson-assets',
              expiration: {
                maxEntries: 4,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      includeAssets: ['favicon.ico', 'favicon.png', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Infra Resilience360',
        short_name: 'InfraR360',
        description: 'Infrastructure Safety & Disaster Engineering Toolkit',
        theme_color: '#1c6ea4',
        background_color: '#f4f7fb',
        display: 'standalone',
        orientation: 'portrait',
        id: `${siteUrl}${base}`,
        scope: `${siteUrl}${base}`,
        start_url: `${siteUrl}${base}`,
        shortcuts: [
          {
            name: 'Learn & Train',
            short_name: 'Learn',
            url: `${siteUrl}${base}?view=learn`,
          },
          {
            name: 'Disaster Dashboard',
            short_name: 'Dashboard',
            url: `${siteUrl}${base}?view=disasterDashboard`,
          },
        ],
        share_target: {
          action: `${siteUrl}${base}`,
          method: 'GET',
          params: {
            title: 'title',
            text: 'text',
            url: 'url',
          },
        },
        icons: [
          {
            src: `${base}icon-192.png`,
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: `${base}icon-512.png`,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  server: {
    host: 'localhost',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api/ndma/advisories': {
        target: 'https://ndma.gov.pk',
        changeOrigin: true,
        secure: true,
        rewrite: () => '/advisories',
      },
      '/api/ndma/sitreps': {
        target: 'https://ndma.gov.pk',
        changeOrigin: true,
        secure: true,
        rewrite: () => '/sitreps',
      },
      '/api/ndma/projections': {
        target: 'https://ndma.gov.pk',
        changeOrigin: true,
        secure: true,
        rewrite: () => '/projection-impact-list_new',
      },
      '/api/pmd/rss': {
        target: 'https://cap-sources.s3.amazonaws.com',
        changeOrigin: true,
        secure: true,
        rewrite: () => '/pk-pmd-en/rss.xml',
      },
      '/data': {
        target: localApiTarget,
        changeOrigin: true,
        secure: false,
      },
      '/static/media': {
        target: localApiTarget,
        changeOrigin: true,
        secure: false,
      },
      '/api': {
        target: localApiTarget,
        changeOrigin: true,
        secure: false,
      },
    },
  },
}))
