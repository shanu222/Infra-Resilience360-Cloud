import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
      // Shared with the main frontend (../../frontend/src/)
      '@resilience/retrofit-portal-locale': path.resolve(__dirname, '../../frontend/src/i18n/retrofitPortalLocale.ts'),
      '@resilience/urdu-pdf-support': path.resolve(__dirname, '../../frontend/src/utils/urduPdfSupport.ts'),
      '@resilience/urdu-html-to-pdf': path.resolve(__dirname, '../../frontend/src/utils/urduHtmlToPdf.ts'),
      '@resilience/api-base': path.resolve(__dirname, '../../frontend/src/services/apiBase.ts'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
