// SW DESATIVADO – NÃO FAZ CACHE DE NADA
self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(keys.map(k => caches.delete(k)));
    })
  );
  self.clients.claim();
});

// Todas as requests são sempre feitas à rede
self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});