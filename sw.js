// Define a name for your cache
const CACHE_NAME = 'smartbasket-v1';

// List all the files you want to cache based on your structure
const urlsToCache = [
  '/smartbasket-app/',
  '/smartbasket-app/index.html',
  '/smartbasket-app/src/css/style.css',
  '/smartbasket-app/src/js/main.js',
  '/smartbasket-app/src/js/data.js',
  '/smartbasket-app/src/js/utils.js',
  '/smartbasket-app/icons/icon-192x192.png',
  '/smartbasket-app/icons/icon-512x512.png'
];

// Install event: opens the cache and adds the files to it
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event: serves cached content when offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        // Not in cache - fetch from network
        return fetch(event.request);
      })
  );
});