/**
 * Ananael service worker — installable PWA shell + runtime caching.
 *
 * Scope is intentionally narrow:
 * - `/api/*` requests are never intercepted here. Offline-safe journal
 *   reads/writes are handled by the IndexedDB-backed repo in the app itself
 *   (see client/src/lib/journalRepo.ts); the service worker only needs to
 *   keep the app shell (HTML/JS/CSS/icons) available without a network.
 * - Navigations use network-first with an offline fallback to the cached
 *   shell, so a fresh deploy is picked up immediately when online.
 * - Hashed Vite build assets (/assets/*) and static public files are
 *   cache-first once fetched once, since their filenames are
 *   content-hashed and therefore immutable.
 */

const CACHE_VERSION = 'ananael-shell-v1';
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch(() => {
        /* best-effort precache — first real navigation will still populate the cache */
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Never cache API traffic — the journal repo owns offline read/write behavior there.
  if (url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put('/index.html', copy));
          return res;
        })
        .catch(() => caches.match('/index.html').then((res) => res ?? caches.match(request)))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((res) => {
          if (res && res.status === 200 && res.type === 'basic') {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          }
          return res;
        })
        .catch(() => cached);
    })
  );
});
