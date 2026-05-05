import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  server: {
    proxy: {
      '/jet-rel': {
        target: 'https://www.miclimateaction.org/wp-json',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/jet-rel/, '/jet-rel'),
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'MiCAN Annual Summit',
        short_name: 'MiCAN Summit',
        description: '2026 Michigan Climate Action Network Annual Summit',
        theme_color: '#1E2B5F',
        background_color: '#F7F8FA',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/www\.miclimateaction\.org\/wp-json\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'wp-api-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 300 },
              networkTimeoutSeconds: 10
            }
          },
          {
            urlPattern: /^https:\/\/www\.miclimateaction\.org\/wp-content\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'wp-media-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 86400 }
            }
          }
        ]
      }
    })
  ]
})
