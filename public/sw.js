/**
 * Arquivo: public/sw.js
 *
 * 1. O que este arquivo faz?
 * Service Worker para suporte a PWA (Progressive Web App) do MediVille Manager com estratégia
 * Network-First, cache-busting automático por versão semântica e expurgo agressivo de caches legados.
 *
 * 2. Para que ele foi criado no contexto do sistema?
 * Garantir carregamento instantâneo, funcionamento offline para tablets/celulares das UBS e UPAs,
 * e permitir que novas atualizações entrem em vigor imediatamente sem prender usuários em versões antigas.
 *
 * 3. Como modificar ou debugar esta parte do código caso ocorra algum problema?
 * O valor de CACHE_NAME é sincronizado automaticamente via `npm run sync:version` com base no package.json.
 * No Chrome DevTools, inspecione em Application > Service Workers.
 *
 * Importa: (Nativo do Navegador - Web Workers API)
 * Conecta-se com: src/main.ts, package.json, scripts/sync-version.mjs, public/_headers
 */

const CACHE_NAME = 'mediville-cache-v1.9.0';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg'
];

// Instalação: Pré-cache dos ativos estruturais e ativação imediata
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Ativação: Expurgo completo de todos os caches de versões anteriores
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key.startsWith('mediville-cache-')) {
            console.log('[SW] Purgando cache antigo de versão anterior:', key);
            return caches.delete(key);
          }
          return Promise.resolve();
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Mensagem: suporte a recarga sob demanda
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});

// Fetch: Estratégia Network-First para garantir que novas versões web sejam entregues imediatamente
self.addEventListener('fetch', (event) => {
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Se a rede respondeu com sucesso, armazena uma cópia no cache atual
        if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Se a rede falhar ou dispositivo estiver offline, busca do cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
        });
      })
  );
});
