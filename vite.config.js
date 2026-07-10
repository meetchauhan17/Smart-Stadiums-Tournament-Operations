import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/hf-api': {
        target: 'https://api-inference.huggingface.co',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/hf-api/, ''),
        secure: true,
      },
      '/mistral-api': {
        target: 'https://api.mistral.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/mistral-api/, ''),
        secure: true,
      },
      '/cohere-api': {
        target: 'https://api.cohere.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/cohere-api/, ''),
        secure: true,
      },
    },
  },
  test: {
    // Use jsdom for DOM simulation in tests
    environment: 'jsdom',
    // Auto-import vitest globals (describe, it, expect, vi, etc.)
    globals: true,
    // Setup file runs before every test file
    setupFiles: ['./src/test/setup.js'],
    // Coverage config (vitest --coverage)
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'src/test/**',
        'src/main.jsx',
        'public/**',
        '*.config.*',
      ],
    },
    // Increase timeout for async tests
    testTimeout: 15000,
  },
})
