// Service worker do painel: recebe os avisos de venda e abre o pedido ao tocar.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "Novo pedido no site", {
      body: data.body || "",
      icon: "/icone-192.png",
      badge: "/icone-192.png",
      tag: data.tag,
      renotify: Boolean(data.tag),
      data: { url: data.url || "/admin/recebidos" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/admin/recebidos", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const open = windows.find((w) => new URL(w.url).pathname.startsWith("/admin"));
      if (open) return open.navigate(url).then((w) => (w || open).focus());
      return self.clients.openWindow(url);
    }),
  );
});
