const CACHE_NAME = 'pwa-lab-day-1-v-5';
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
const neverCache = ['/pages/no-cache.html'];

self.addEventListener('install', (event) => {
  console.log('Service worker installing....', event);

  event.waitUntil(
    (async () => {
      try {
        const db = await caches.open(CACHE_NAME);
        await db.addAll(FILES_TO_CACHE);
      } catch (err) {
        console.error('Error while caching files:', err);
      }
    })()
  );
});

self.addEventListener('activate', (event) => {
  console.log('Service worker activating....');
});

// Fetch requests
self.addEventListener('fetch', (event) => {
  event.respondWith(
    (async () => {
      const url = new URL(event.request.url);
      try {
        // Try network first
        const response = await fetch(event.request);

        // Dynamically cache if allowed
        if (
          response &&
          response.status === 200 &&
          event.request.method === 'GET' &&
          !neverCache.includes(url.pathname)
        ) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, response.clone());
        }

        console.log(response.status);
        // If the network returned 404
        if (response.status === 404) {
          return caches.match('/pages/not-found.html');
        }

        return response;
      } catch (error) {
        // Offline fallback: check if it exists in cache first
        const cached = await caches.match(event.request);
        if (cached) return cached;

        // If the request is for a cached page (pre-cached 404), show 404
        const pathname = url.pathname;
        if (
          !FILES_TO_CACHE.includes(pathname) &&
          !neverCache.includes(pathname)
        ) {
          return caches.match('/pages/not-found.html');
        }

        // else, show  offline page
        return caches.match('/pages/offline.html');
      }
    })()
  );
});
