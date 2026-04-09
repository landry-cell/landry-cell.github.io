// Service Worker optimisé — stratégie Cache First pour assets statiques
const CACHE_NAME = 'philadelphie-v2';
const STATIC_ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './data.js',
  './manifest.json',
  './logo-site.png',
];
// Image de fond séparée — mise en cache mais non bloquante
const HEAVY_ASSETS = [
  './IMG_20251230_143301.jpg',
  'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js'
];

// Installation : cache les assets critiques en priorité
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Assets critiques en premier (bloquants)
      await cache.addAll(STATIC_ASSETS);
      // Assets lourds en background (non-bloquant)
      cache.addAll(HEAVY_ASSETS).catch(() => {});
    })
  );
  // Activer immédiatement sans attendre l'ancien SW
  self.skipWaiting();
});

// Activation : nettoyer les anciens caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch : Cache First pour assets statiques, Network First pour API
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // API Bible — Network First (données dynamiques)
  if (url.hostname === 'bible-api.com') {
    e.respondWith(
      fetch(e.request).then(res => {
        // Mettre en cache la réponse API pour usage hors ligne
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  // Assets statiques — Cache First
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        // Mettre en cache seulement les requêtes GET valides
        if (e.request.method === 'GET' && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return res;
      });
    }).catch(() => {
      // Fallback hors ligne pour les pages HTML
      if (e.request.destination === 'document') {
        return caches.match('./index.html');
      }
    })
  );
});
