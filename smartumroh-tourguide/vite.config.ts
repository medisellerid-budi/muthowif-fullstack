/// <reference types="vitest" />

import legacy from '@vitejs/plugin-legacy'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

import tailwindcss from '@tailwindcss/vite'

import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    legacy(),
    VitePWA({ 
      registerType: 'prompt',
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024 // 5 MB
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        /**
         * Code splitting manual — memecah bundle besar menjadi chunk terpisah
         * agar loading pertama lebih cepat (hanya load chunk yang dibutuhkan).
         */
        manualChunks(id) {
          // LiveKit: chunk terpisah — library audio/video besar (~578 kB)
          // Hanya diload di halaman ParticipantRoom
          if (id.includes('/node_modules/livekit-client/') || id.includes('/node_modules/@livekit/')) {
            return 'vendor-livekit';
          }

          // ZXing: chunk terpisah — library QR scanner (~453 kB)
          // Hanya diload saat fitur scan QR aktif
          if (id.includes('/node_modules/@zxing/')) {
            return 'vendor-zxing';
          }

          // Semua vendor lainnya (Ionic, React, React Router, Ionicons, axios, dll)
          // digabung menjadi satu chunk untuk menghindari circular dependency
          // yang terjadi karena Ionic secara internal mereferensikan React & React Router
          if (id.includes('/node_modules/')) {
            return 'vendor';
          }
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  }
})

