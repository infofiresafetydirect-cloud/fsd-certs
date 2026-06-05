/* FSD Certs V6.3c71d - Pixel PWA install helper */
const FSD_SW_VERSION = 'V6.3c71d';

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
