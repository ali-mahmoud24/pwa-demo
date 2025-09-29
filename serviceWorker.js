const CACHE_NAME = 'pwa-lab-day-1-v-1';

const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/pages/offline.html',
  '/pages/not-found.html',
  '/pages/cached.html',
  '/styles/main.css',
  '/styles/not-found.css',
  '/styles/offline.css',
];

// Excluded files (never cached)
const NEVER_CACHE = ['/pages/no-cache.html'];

// Fallback pages
const OFFLINE_PAGE = '/pages/offline.html';
const NOT_FOUND_PAGE = '/pages/not-found.html';

// -------------------- Helpers --------------------

async function openCache() {
  return caches.open(CACHE_NAME);
}

async function fromCache(request) {
  const cache = await openCache();
  return cache.match(request);
}

async function cachePut(request, response) {
  const cache = await openCache();
  await cache.put(request, response);
}

async function fetchAndCache(request) {
  const response = await fetch(request);

  if (response && response.status === 200 && request.method === 'GET') {
    cachePut(request, response.clone());
  }

  return response;
}

// -------------------- Service Worker Events --------------------

// Install -> Precache files
self.addEventListener('install', (event) => {
  console.log('Service worker installing...');

  event.waitUntil(
    (async () => {
      const cache = await openCache();
      await cache.addAll(FILES_TO_CACHE);
      console.log('Pre-cached:', FILES_TO_CACHE);
    })()
  );
});

// Activate -> Delete old caches
self.addEventListener('activate', (event) => {
  console.log('Service worker activating...');

  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      );
    })()
  );
});

// Fetch Events -> Cache-first strategy with fallbacks
self.addEventListener('fetch', (event) => {
  event.respondWith(
    (async () => {
      const url = new URL(event.request.url);

      // Skip excluded files
      if (NEVER_CACHE.includes(url.pathname)) {
        try {
          return await fetch(event.request);
        } catch {
          return fromCache(OFFLINE_PAGE);
        }
      }

      //  Try cache first
      const cached = await fromCache(event.request);
      if (cached) return cached;

      try {
        //  If not in cache -> Try network
        const networkResponse = await fetchAndCache(event.request);

        if (networkResponse.status === 404) {
          return fromCache(NOT_FOUND_PAGE);
        }

        return networkResponse;
      } catch (error) {
        console.warn('Fetch failed, fallback for:', url.pathname);

        // 1. Cached version if available
        const cachedPage = await fromCache(event.request);
        if (cachedPage) return cachedPage;

        // 2. If not precached -> show 404
        if (
          !FILES_TO_CACHE.includes(url.pathname) &&
          !NEVER_CACHE.includes(url.pathname)
        ) {
          return fromCache(NOT_FOUND_PAGE);
        }

        // 3. Otherwise -> show offline page
        return fromCache(OFFLINE_PAGE);
      }
    })()
  );
});
