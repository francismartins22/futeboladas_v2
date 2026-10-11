/* Service Worker do Firebase Cloud Messaging.
   Tem de viver na raiz do site (public/) com este nome exato. */
importScripts("https://www.gstatic.com/firebasejs/12.6.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.6.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyCgfsrpIIj0XWp7Uc2FNGgKIibtWriHR_c",
  authDomain: "futeboladas-v2-dev.firebaseapp.com",
  projectId: "futeboladas-v2-dev",
  storageBucket: "futeboladas-v2-dev.firebasestorage.app",
  messagingSenderId: "899361657772",
  appId: "1:899361657772:web:cdd265c50fc9574119e009",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "Futeboladas";
  const body = payload.notification?.body || "";
  const data = payload.data || {};
  self.registration.showNotification(title, {
    body,
    icon: "/pwa-192x192.png",
    badge: "/pwa-192x192.png",
    data,
    tag: data.tag || undefined,
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
/* ------------------- Cache da app (abrir sem rede) -------------------
   - Navegacao (index.html): rede primeiro; sem rede usa a ultima copia guardada.
   - /assets/* (nome com hash, nunca muda) e icones: cache primeiro.
   Tudo o resto (Firestore, Storage, APIs, outros dominios) vai sempre a rede.
   shortcut: assets de versoes antigas acumulam na cache ate a app mudar de APP_VERSION (App.jsx limpa as caches nessa altura). */
const APP_CACHE = "futeboladas-app-v1";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  const save = (key, res) => { if (res.ok) { const copy = res.clone(); caches.open(APP_CACHE).then((c) => c.put(key, copy)); } return res; };

  if (req.mode === "navigate") {
    event.respondWith(fetch(req).then((res) => save("/", res)).catch(() => caches.match("/")));
  } else if (url.pathname.startsWith("/assets/") || /^\/(pwa-\d+x\d+\.png|manifest\.json)$/.test(url.pathname)) {
    event.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => save(req, res))));
  }
});
