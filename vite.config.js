import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// base = nom du repo GitHub Pages (https://marine-data.github.io/vision/)
export default defineConfig({
  base: '/vision/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Vision — Reconversion',
        short_name: 'Vision',
        description: 'Feuille de route de reconversion : emploi du temps, budget, suivi.',
        start_url: '/vision/',
        scope: '/vision/',
        display: 'standalone',
        background_color: '#f4efe6',
        theme_color: '#8a2f2c',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      }
    })
  ]
})
