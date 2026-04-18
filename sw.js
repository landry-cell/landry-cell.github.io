// ====================================
// SERVICE WORKER — Temple Philadelphie
// Version optimisée pour Netlify
// ====================================
const CACHE_NAME = 'philadelphie-v3';

const CRITICAL_ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './data.js',
  './manifest.json'
];

const LAZY_ASSETS = [
  './logo-site.png',
  './IMG_20251230_143301.jpg',
  'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      await cache.addAll(CRITICAL_ASSETS);
      Promise.allSettled(LAZY_ASSETS.map(url =>
        cache.add(url).catch(() => {})
      ));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') return;

  // API Bible : Network First
  if (url.hostname === 'bible-api.com') {
    event.respondWith(networkFirst(event.request));
    return;
  }

  // index.html et sw.js : Network First (toujours à jour)
  if (url.pathname === '/' || url.pathname.endsWith('index.html') || url.pathname.endsWith('sw.js')) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  // JS, CSS, images : Stale While Revalidate
  if (/\.(js|css|png|jpg|jpeg|webp|woff2?)$/.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(event.request));
    return;
  }

  // Reste : Cache First
  event.respondWith(cacheFirst(event.request));
});

async function networkFirst(request) {
  try {
    const res = await fetch(request);
    if (res.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, res.clone());
    }
    return res;
  } catch {
    const cached = await caches.match(request);
    return cached || (request.destination === 'document'
      ? caches.match('./index.html')
      : new Response('Hors ligne', { status: 503 }));
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const res = await fetch(request);
    if (res.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, res.clone());
    }
    return res;
  } catch {
    return new Response('Non disponible', { status: 503 });
  }
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  const fetchPromise = fetch(request).then(res => {
    if (res.ok) caches.open(CACHE_NAME).then(c => c.put(request, res.clone()));
    return res;
  }).catch(() => null);
  return cached || fetchPromise;
}
