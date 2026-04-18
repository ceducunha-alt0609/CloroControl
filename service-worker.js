// CloroPrime Service Worker
// Estratégia: Cache First para assets estáticos, Network First para dados

const CACHE_NAME = 'cloroprime-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
  '/icons/favicon.ico',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js'
];

// Instala e faz cache dos assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Cache dos assets locais (ignora erros de CDN)
      return Promise.allSettled(
        ASSETS.map(url => cache.add(url).catch(() => {}))
      );
    }).then(() => self.skipWaiting())
  );
});

// Limpa caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Intercepta requisições
self.addEventListener('fetch', event => {
  const { request } = event;

  // Ignora requisições não-GET
  if (request.method !== 'GET') return;

  // Ignora requisições da API Anthropic (não cachear)
  if (request.url.includes('api.anthropic.com')) return;

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;

      return fetch(request).then(response => {
        // Cache apenas respostas válidas de assets estáticos
        if (response.ok && (
          request.url.includes('/icons/') ||
          request.url.includes('fonts.googleapis') ||
          request.url.includes('cdnjs.cloudflare')
        )) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback: retorna a página principal cacheada
        if (request.destination === 'document') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

// Recebe mensagens do app
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});
