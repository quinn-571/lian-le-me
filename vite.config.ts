import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,wasm}'],
      },
      manifest: {
        name: '练了么 - 运动日历',
        short_name: '练了么',
        description: '智能运动课表日历，轻松规划有氧无氧训练',
        theme_color: '#FF6B35',
        background_color: '#FFF8F5',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/lian-le-me/',
        scope: '/lian-le-me/',
        icons: [
          {
            src: '/icon-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: '/icon-192.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
})
