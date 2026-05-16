importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyAxogxh70X6IH4fwhjqkgqcy4pUwOXK64I",
  projectId: "curebery",
  messagingSenderId: "779244402150",
  appId: "1:779244402150:web:b486dc7597f23339055227"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  const title = payload.notification?.title || "CureBery";
  const body = payload.notification?.body || "Ada notifikasi baru";
  self.registration.showNotification(title, {
    body: body,
    icon: "/favicon.svg",
    badge: "/favicon.svg",
    vibrate: [500, 200, 500, 200, 500, 200, 500],
    requireInteraction: true,
    tag: "curebery-order",
    renotify: true,
    data: { url: payload.fcmOptions?.link || "/" }
  });
});

self.addEventListener("notificationclick", function(event) {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(clients.openWindow(url));
});