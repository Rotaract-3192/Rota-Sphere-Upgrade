// RotaSphere Push Notification Service Worker

self.addEventListener("push", function (event) {
  if (!event.data) return;
  let data;
  try { data = event.data.json(); } catch { data = { title: "RotaSphere", body: event.data.text(), url: "/" }; }

  const title = data.title || "RotaSphere";
  const options = {
    body: data.body || "You have a new notification.",
    icon: "/brand/logo.png",
    badge: "/favicon-96x96.png",
    data: { url: data.url || "/" },
    vibrate: [200, 100, 200],
    tag: data.tag || "rotasphere-notification",
    renotify: true,
    actions: [{ action: "open", title: "Open App" }, { action: "dismiss", title: "Dismiss" }],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  if (event.action === "dismiss") return;
  const targetUrl = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => { event.waitUntil(clients.claim()); });
