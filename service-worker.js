// ─────────────────────────────────────────────────────────────────────────────
// CloroPrime Service Worker  v2.0
// Estratégia: Cache-First para o app shell, Network-First para dados externos
// ─────────────────────────────────────────────────────────────────────────────

const APP_VERSION   = 'v2.0';
const CACHE_STATIC  = `cloroprime-static-${APP_VERSION}`;
const CACHE_RUNTIME = `cloroprime-runtime-${APP_VERSION}`;

// Arquivos do app shell — cacheados no install
const STATIC_ASSETS = [
  './CloroPrime.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon.ico',
];

// CDN externos — cacheados em runtime (Stale-While-Revalidate)
const CDN_PATTERNS = [
  'cdnjs.cloudflare.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
];

// ── INSTALL ───────────────────────────────────────────────────────────────────
self.addEventListener('install', event => {
  console.log('[SW] Install', APP_VERSION);
  event.waitUntil(
    caches.open(CACHE_STATIC)
      .then(cache =>
        Promise.allSettled(
          STATIC_ASSETS.map(url =>
            cache.add(url).catch(err => console.warn('[SW] Failed to cache:', url, err))
          )
        )
      )
      .then(() => self.skipWaiting())
  );
});

// ── ACTIVATE ──────────────────────────────────────────────────────────────────
self.addEventListener('activate', event => {
  console.log('[SW] Activate', APP_VERSION);
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE_STATIC && key !== CACHE_RUNTIME)
            .map(key => {
              console.log('[SW] Deleting old cache:', key);
              return caches.delete(key);
            })
        )
      )
      .then(() => clients.claim())
  );
});

// ── FETCH ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Ignora chrome-extension e outros esquemas
  if (!['http:', 'https:'].includes(url.protocol)) return;

  const isCDN    = CDN_PATTERNS.some(p => url.hostname.includes(p));
  const isStatic = STATIC_ASSETS.some(a => request.url.endsWith(a.replace('./', '')));
  const isMain   = url.pathname.endsWith('CloroPrime.html') || url.pathname === '/';

  if (isMain || isStatic) {
    // Cache-First com atualização em background
    event.respondWith(cacheFirstWithRefresh(request, CACHE_STATIC));
  } else if (isCDN) {
    // Stale-While-Revalidate para fontes e CDN
    event.respondWith(staleWhileRevalidate(request, CACHE_RUNTIME));
  }
  // Demais: passa direto sem interceptar
});

// ── Estratégias ───────────────────────────────────────────────────────────────

async function cacheFirstWithRefresh(request, cacheName) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(request);

  const networkFetch = fetch(request)
    .then(resp => {
      if (resp.ok) cache.put(request, resp.clone());
      return resp;
    })
    .catch(() => null);

  if (cached) {
    // Retorna cache imediatamente, atualiza em background
    networkFetch; // fire-and-forget
    return cached;
  }

  // Sem cache: tenta a rede
  const fresh = await networkFetch;
  if (fresh) return fresh;

  // Fallback offline: retorna o HTML principal
  const fallback = await cache.match('./CloroPrime.html');
  if (fallback) return fallback;

  return new Response('Offline — CloroPrime não disponível', {
    status: 503,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
}

async function staleWhileRevalidate(request, cacheName) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(request);

  const networkFetch = fetch(request)
    .then(resp => {
      if (resp.ok) cache.put(request, resp.clone());
      return resp;
    })
    .catch(() => cached || null);

  return cached || networkFetch;
}

// ── Mensagens do cliente ──────────────────────────────────────────────────────
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();

  if (event.data?.type === 'GET_VERSION') {
    event.ports[0]?.postMessage({ version: APP_VERSION });
  }

  if (event.data?.type === 'CLEAR_CACHE') {
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => event.ports[0]?.postMessage({ ok: true }));
  }
});
