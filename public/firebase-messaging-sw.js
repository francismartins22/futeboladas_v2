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