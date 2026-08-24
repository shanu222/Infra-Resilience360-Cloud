import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, 'inventory-admin')

/**
 * Build for the standalone Live Inventory Admin portal.
 *
 * Deployed as its own Vercel project on its own domain, so it shares nothing with
 * the public app bundle: no PWA/service worker, no Tailwind, no shared routes.
 */
export default defineConfig(({ mode }) => ({
  root,
  base: '/',
  build: {
    outDir: path.resolve(__dirname, 'dist-inventory-admin'),
    emptyOutDir: true,
    target: 'es2022',
    sourcemap: false,
    minify: 'esbuild',
    cssMinify: mode === 'production',
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  plugins: [react()],
  server: {
    host: 'localhost',
    port: 5174,
    strictPort: true,
  },
}))
