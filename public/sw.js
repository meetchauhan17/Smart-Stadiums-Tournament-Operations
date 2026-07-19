const CACHE_NAME = 'stadiumiq-v2'; // Bumped version to invalidate old caches
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/manifest.json'
];

// Install Event — Cache App Shell
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event — Clean old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event — Network-First for HTML/Document, Cache-First for static assets
self.addEventListener('fetch', (e) => {
  // Bypass caching on localhost during development
  if (e.request.url.includes('localhost') || e.request.url.includes('127.0.0.1')) {
    return;
  }

  // Only handle GET requests, bypass external APIs
  if (e.request.method !== 'GET' || e.request.url.includes('api.anthropic.com')) {
    return;
  }

  const url = new URL(e.request.url);

  // Network-First for HTML files/Documents to always get the latest version
  if (e.request.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('.html')) {
    e.respondWith(
      fetch(e.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(e.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(e.request).then((cachedResponse) => {
            return cachedResponse || caches.match('/');
          });
        })
    );
    return;
  }

  // Cache-First with Network Fallback for static assets (images, CSS, JS, fonts)
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(e.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Return fallback if not cached
        return null;
      });
    })
  );
});
