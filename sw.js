/* FSD Certs V6.3c74k - offline shell fetch fallback fix */
const FSD_SW_VERSION = 'V6.3c74k';
const FSD_CACHE = 'fsd-certs-' + FSD_SW_VERSION;
const FSD_CORE_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil((async () => {
    const cache = await caches.open(FSD_CACHE);
    await Promise.allSettled(FSD_CORE_ASSETS.map(url => cache.add(url)));
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(key => key.startsWith('fsd-certs-') && key !== FSD_CACHE)
      .map(key => caches.delete(key))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  event.respondWith((async () => {
    try {
      const response = await fetch(request);

      // Keep the GitHub shell fresh for offline use. Do not try to cache Apps Script/Google responses.
      if (request.url.startsWith(self.location.origin) && response && response.ok) {
        const cache = await caches.open(FSD_CACHE);
        cache.put(request, response.clone()).catch(() => {});
      }

      return response;
    } catch (err) {
      const cached = await caches.match(request);
      if (cached) return cached;

      // For app navigation while offline, always fall back to the cached shell.
      if (request.mode === 'navigate' || request.destination === 'document') {
        const shell = await caches.match('./index.html') || await caches.match('./');
        if (shell) return shell;

        return new Response(
          '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>FSD Certs Offline</title></head><body style="font-family:Arial,sans-serif;padding:20px"><h1>FSD Certs offline</h1><p>The app shell is not cached yet. Connect to the internet once, open FSD Certs, then try offline again.</p></body></html>',
          { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
      }

      // Never let respondWith resolve as undefined — that causes the browser error Jared saw.
      return new Response('', { status: 503, statusText: 'Offline' });
    }
  })());
});
