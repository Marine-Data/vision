// Service worker de Vision : seulement les notifications (aucun cache, l'app reste toujours à jour).
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (e) => {
  let d = {};
  try {
    d = e.data ? e.data.json() : {};
  } catch (err) {
    d = { titre: "Vision", corps: e.data ? e.data.text() : "" };
  }
  e.waitUntil(
    self.registration.showNotification(d.titre || "Vision", {
      body: d.corps || "",
      icon: "icone-192.png",
      badge: "icone-192.png",
      data: { url: d.url || "./" },
      lang: "fr",
    }),
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || "./", self.registration.scope).href;
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((liste) => {
      for (const c of liste) if ("focus" in c) return c.navigate(url).then((w) => (w || c).focus());
      return self.clients.openWindow(url);
    }),
  );
});
