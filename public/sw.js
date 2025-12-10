const CACHE_NAME = 'futeboladas-v2-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/pwa-192x192.png',
  '/pwa-512x512.png'
];

// 1. Instalação: Cache dos ficheiros estáticos
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Força o SW a ativar-se imediatamente
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache aberta');
        return cache.addAll(urlsToCache);
      })
  );
});

// 2. Ativação: Limpeza de caches antigas e controlo imediato
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(), // Controla a página sem precisar de recarregar
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
});

// 3. Fetch: Obrigatório para PWA (serve ficheiros mesmo offline)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Se estiver em cache, devolve. Senão, vai à rede.
        return response || fetch(event.request);
      })
  );
});