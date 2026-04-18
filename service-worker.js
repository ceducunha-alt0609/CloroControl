/**
 * CloroPrime — Service Worker
 * Estratégia: Cache-First para assets estáticos, Network-First para runtime.
 * Versão: incrementar CACHE_VERSION ao deploy para forçar atualização.
 */

const CACHE_VERSION = 'v1.2.0';
const CACHE_STATIC  = `cloroprime-static-${CACHE_VERSION}`;
const CACHE_DYNAMIC = `cloroprime-dynamic-${CACHE_VERSION}`;

// Assets que SEMPRE ficam em cache (shell do app)
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './icons/icon.svg',
  // Chart.js via CDN — cacheia na primeira visita
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js'
];

// Fontes do Google — cache separado de longa duração
const FONT_CACHE = `cloroprime-fonts-${CACHE_VERSION}`;
const FONT_ORIGINS = ['https://fonts.googleapis.com', 'https://fonts.gstatic.com'];

// ── Install: pré-cache do shell ─────────────────────────────────────────────
self.addEventListener('install', event => {
  console.log('[SW] Installing CloroPrime', CACHE_VERSION);
  event.waitUntil(
    caches.open(CACHE_STATIC)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
      .catch(err => console.warn('[SW] Precache parcial:', err))
  );
});

// ── Activate: limpa caches antigos ──────────────────────────────────────────
self.addEventListener('activate', event => {
  console.log('[SW] Activating CloroPrime', CACHE_VERSION);
  const keepCaches = [CACHE_STATIC, CACHE_DYNAMIC, FONT_CACHE];
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => !keepCaches.includes(key))
          .map(key => {
            console.log('[SW] Deletando cache antigo:', key);
            return caches.delete(key);
          })
      ))
      .then(() => self.clients.claim())
  );
});

// ── Fetch: estratégias por tipo de recurso ──────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignora requests não-GET e chrome-extension
  if (request.method !== 'GET') return;
  if (url.protocol === 'chrome-extension:') return;

  // Fontes Google → Cache-First de longa duração
  if (FONT_ORIGINS.some(o => url.origin === new URL(o).origin)) {
    event.respondWith(cacheFirst(request, FONT_CACHE));
    return;
  }

  // CDN de libs → Cache-First
  if (url.hostname === 'cdnjs.cloudflare.com') {
    event.respondWith(cacheFirst(request, CACHE_DYNAMIC));
    return;
  }

  // App Shell (index.html, manifest, ícones) → Cache-First
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(request, CACHE_STATIC));
    return;
  }

  // Qualquer outra coisa → Network-First com fallback
  event.respondWith(networkFirst(request, CACHE_DYNAMIC));
});

// ── Estratégia Cache-First ───────────────────────────────────────────────────
async function cacheFirst(request, cacheName) {
  try {
    const cache    = await caches.open(cacheName);
    const cached   = await cache.match(request);
    if (cached) return cached;

    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    // Fallback para index.html em caso de navegação offline
    if (request.mode === 'navigate') {
      const cache = await caches.open(CACHE_STATIC);
      return cache.match('./index.html');
    }
    return new Response('Offline', { status: 503 });
  }
}

// ── Estratégia Network-First ─────────────────────────────────────────────────
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cache  = await caches.open(cacheName);
    const cached = await cache.match(request);
    if (cached) return cached;
    if (request.mode === 'navigate') {
      const staticCache = await caches.open(CACHE_STATIC);
      return staticCache.match('./index.html');
    }
    return new Response('Offline', { status: 503 });
  }
}

// ── Background Sync (futuro) ─────────────────────────────────────────────────
self.addEventListener('sync', event => {
  if (event.tag === 'sync-readings') {
    console.log('[SW] Background sync: sync-readings');
    // Placeholder para sincronização futura
  }
});

// ── Push Notifications (futuro) ──────────────────────────────────────────────
self.addEventListener('push', event => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'CloroPrime', {
      body:    data.body    || 'Verificação pendente.',
      icon:    './icons/icon-192.png',
      badge:   './icons/icon-72.png',
      vibrate: [200, 100, 200],
      data:    data.url ? { url: data.url } : {},
      actions: [
        { action: 'open',    title: 'Abrir App' },
        { action: 'dismiss', title: 'Fechar'    }
      ]
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'dismiss') return;
  const targetUrl = event.notification.data?.url || './index.html';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        for (const client of clientList) {
          if (client.url === targetUrl && 'focus' in client) return client.focus();
        }
        if (clients.openWindow) return clients.openWindow(targetUrl);
      })
  );
});
