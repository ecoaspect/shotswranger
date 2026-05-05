const CACHE = 'shotswranger-v2';

const SHELL = [
  '/shotswranger/',
  '/shotswranger/index.html',
  '/shotswranger/config.js',
  '/shotswranger/css/styles.css',
  '/shotswranger/js/db.js',
  '/shotswranger/js/clubs.js',
  '/shotswranger/js/geo.js',
  '/shotswranger/js/map.js',
  '/shotswranger/js/shots.js',
  '/shotswranger/js/analysis.js',
  '/shotswranger/js/ui.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Let Mapbox requests go network-first; fall back to cache if offline
  if (e.request.url.includes('mapbox')) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    return;
  }
  // App shell: cache-first
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request)),
  );
});
