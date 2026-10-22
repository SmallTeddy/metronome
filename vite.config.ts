import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/metronome/',
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon.svg', 'maskable.svg', 'apple-touch-icon.svg'],
      manifest: {
        name: '节拍器 Metronome',
        short_name: '节拍器',
        description: '精准的移动端网页节拍器',
        theme_color: '#0b1220',
        background_color: '#0b1220',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/metronome/',
        icons: [
          { src: '/metronome/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: '/metronome/maskable.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/metronome/index.html'
      }
    })
  ],
  server: { host: true }
})
