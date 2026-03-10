// Service Worker — Disciplina NSP 2026
const CACHE = 'disciplina-nsp-v2';
const ASSETS = [
  './index.html',
  './manifest.json'
];

// Instalar y cachear archivos principales
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activar y limpiar caches viejos
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: cache-first para assets, network-first para Sheets API
self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Nunca interceptar llamadas a Google Apps Script
  if (url.includes('script.google.com')) {
    return; // deja pasar sin cache
  }

  // Cache-first para el resto (HTML, iconos, etc.)
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        // Cachear respuestas válidas (no opacas)
        if (res && res.status === 200 && res.type !== 'opaque') {
          const clone = res.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return res;
      }).catch(() => {
        // Sin internet y sin cache: devolver index.html como fallback
        if (e.request.destination === 'document') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
