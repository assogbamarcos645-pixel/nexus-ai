// NEXUS AI — Service Worker PWA (Offline & Asset Cache)
const CACHE_NAME = 'nexus-ai-v3-3d-icons';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/site.webmanifest',
  '/nexus-logo-clean.png',
  '/favicon.svg',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/icon-maskable-192x192.png',
  '/icon-maskable-512x512.png',
  '/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('[PWA] Pré-mise en cache partielle :', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Laisser passer sans cache les appels API backend et streaming SSE
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/ai/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Stale-while-revalidate pour les requêtes de même origine
        if (url.origin === self.location.origin) {
          fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(event.request, responseToCache);
                });
              }
            })
            .catch(() => {});
        }
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        return networkResponse;
      });
    })
  );
});
