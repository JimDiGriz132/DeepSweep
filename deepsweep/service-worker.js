const CACHE_NAME = 'deepsweep-cache-v1';

const urlsToCache = [
  '/',                        
  '/index.html',
  '/manifest.json',
  '/data.json',
  '/version.json',
  '/logo.png',
  '/icon-192.png',
  '/icon-512.png'

];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching app shell and data files');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('[SW] Cache addAll failed:', err);
      })
  );
  
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME)
          .map(name => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  
  if (event.request.method !== 'GET') {
    event.respondWith(fetch(event.request));
    return;
  }

  // Cache-first
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        
        if (cachedResponse) {
          return cachedResponse;
        }

        
        return fetch(event.request).then(networkResponse => {
          
          if (
            !networkResponse ||
            networkResponse.status !== 200 ||
            networkResponse.type !== 'basic' ||
            networkResponse.url.startsWith('chrome-extension://') // izbjegni ekstenzije
          ) {
            return networkResponse;
          }

          
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            })
            .catch(err => console.error('[SW] Cache put failed:', err));

          return networkResponse;
        }).catch(() => {
          
          return caches.match('/');
        });
      })
  );
});