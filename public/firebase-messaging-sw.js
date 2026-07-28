self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("qbot-offline-v1")
      .then((cache) => cache.addAll(["/offline", "/icons/icon-192.png", "/icons/icon-512.png"]))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith("qbot-offline-") && key !== "qbot-offline-v1").map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || event.request.mode !== "navigate") return;
  event.respondWith(
    fetch(event.request).catch(async () => {
      const cache = await caches.open("qbot-offline-v1");
      return (await cache.match("/offline")) || Response.error();
    })
  );
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data?.json() || {};
  } catch {
    payload = { body: event.data?.text() };
  }
  event.waitUntil(
    self.registration.showNotification(payload.title || "Hoàn Tiền Mua Hàng", {
      body: payload.body || "Bạn có thông báo mới.",
      icon: payload.icon || "/api/site-assets/logo",
      badge: "/api/site-assets/logo",
      data: { url: payload.url || "/" }
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/", self.location.origin).href;
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const existing = windows.find((client) => client.url.startsWith(self.location.origin));
      return existing ? existing.focus().then(() => existing.navigate(target)) : clients.openWindow(target);
    })
  );
});
