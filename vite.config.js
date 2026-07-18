import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const localFootballProxy = () => ({
  name: 'local-football-proxy',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (req.url && req.url.startsWith('/api/football')) {
        const urlObj = new URL(req.url, 'http://localhost');
        const pathParam = urlObj.searchParams.get('path');
        if (!pathParam) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Missing path' }));
          return;
        }
        const cleanPath = pathParam.startsWith('/') ? pathParam : `/${pathParam}`;
        const targetUrl = `https://api.football-data.org/v4${cleanPath}`;

        const token = req.headers['x-auth-token'] || process.env.VITE_FOOTBALL_API_KEY;

        try {
          const fbRes = await fetch(targetUrl, {
            headers: {
              'X-Auth-Token': token || '',
              'User-Agent': 'Mozilla/5.0'
            }
          });

          const avail = fbRes.headers.get('x-requests-available');
          const reset = fbRes.headers.get('x-requestcounter-reset');
          if (avail) res.setHeader('x-requests-available', avail);
          if (reset) res.setHeader('x-requestcounter-reset', reset);

          res.statusCode = fbRes.status;
          res.setHeader('Content-Type', 'application/json');

          const bodyText = await fbRes.text();
          res.end(bodyText);
        } catch (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message }));
        }
        return;
      }
      next();
    });
  }
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), localFootballProxy()],
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'recharts',
      'framer-motion',
      'lucide-react',
      'i18next',
      'react-i18next'
    ],
  },
  css: {
    devSourcemap: false
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor-react';
            }
            if (id.includes('recharts') || id.includes('d3')) {
              return 'vendor-charts';
            }
            if (id.includes('framer-motion')) {
              return 'vendor-motion';
            }
            return 'vendor-others';
          }
        }
      }
    }
  },
  server: {
    warmup: {
      clientFiles: [
        './src/main.jsx',
        './src/App.jsx',
        './src/pages/LiveMatches.jsx',
        './src/pages/Operations.jsx',
        './src/pages/Staff.jsx',
        './src/pages/Sustainability.jsx',
        './src/pages/Fan.jsx'
      ]
    },
    watch: {
      usePolling: false,
      ignored: ['**/node_modules/**', '**/.git/**']
    },
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
