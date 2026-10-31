const SHELL_CACHE = 'planner-shell-v2-person-month-color';
const SHELL_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((key) => key.startsWith('planner-shell-') && key !== SHELL_CACHE)
        .map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const requestUrl = new URL(request.url);
  const scopeUrl = new URL(self.registration.scope);
  if (requestUrl.protocol !== 'http:' && requestUrl.protocol !== 'https:') return;
  if (requestUrl.origin !== scopeUrl.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        return await fetch(request);
      } catch (_error) {
        const shell = await caches.open(SHELL_CACHE);
        const fallback = await shell.match(new URL('./index.html', scopeUrl).href);
        return fallback || Response.error();
      }
    })());
    return;
  }

  const allowedAssets = new Set(SHELL_ASSETS.map((asset) => new URL(asset, scopeUrl).pathname));
  if (!allowedAssets.has(requestUrl.pathname)) return;

  event.respondWith((async () => {
    const shell = await caches.open(SHELL_CACHE);
    const cached = await shell.match(requestUrl.href, { ignoreSearch: true });
    return cached || fetch(request);
  })());
});
