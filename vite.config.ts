/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@shared': resolve(__dirname, './apps/shared/src'),
      '@': resolve(__dirname, './apps/admin-app/src'),
    },
  },
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin.html'),
      },
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) return 'react-vendor';
            if (id.includes('three') || id.includes('@react-three')) return 'three-vendor';
            if (id.includes('framer-motion') || id.includes('gsap')) return 'motion-vendor';
            if (id.includes('@supabase')) return 'supabase';
          }
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setupTests.ts'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache', 'tests/**'],
  },
})
