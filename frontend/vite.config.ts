import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiUrl = env.VITE_API_URL
  const apiOrigin = apiUrl ? new URL(apiUrl).origin : null
  const apiPattern = apiOrigin
    ? new RegExp(`^${apiOrigin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`)
    : /^https?:\/\/.+\/(appointments|services|clients|availability|reports|professionals)/

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'icons/icon-192.svg', 'icons/icon-512.svg'],
        manifest: {
          name: 'Corte em Dia',
          short_name: 'Corte em Dia',
          description: 'Agendamentos para barbearias e salões',
          start_url: '/',
          display: 'standalone',
          background_color: '#f1f5f9',
          theme_color: '#0f172a',
          icons: [
            {
              src: '/icons/icon-192.svg',
              sizes: '192x192',
              type: 'image/svg+xml',
            },
            {
              src: '/icons/icon-512.svg',
              sizes: '512x512',
              type: 'image/svg+xml',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
          navigateFallback: '/index.html',
          cleanupOutdatedCaches: true,
          runtimeCaching: [
            {
              urlPattern: apiPattern,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                networkTimeoutSeconds: 3,
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24,
                },
              },
            },
          ],
        },
      }),
    ],
  }
})
