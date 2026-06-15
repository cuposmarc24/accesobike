// AccesoBike Service Worker

// Al tocar la notificación: enfoca la ventana existente o abre una nueva
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || self.location.origin;
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      // Si ya hay una ventana abierta, enfocarla
      for (const client of clientList) {
        if (client.url === targetUrl && 'focus' in client) return client.focus();
      }
      // Si no, abrir la URL guardada en data
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});

// Push externo (FCM futuro)
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'AccesoBike', {
      body: data.body || '',
      icon: '/logo192.png',
      badge: '/logo192.png',
      vibrate: [200, 100, 200],
      requireInteraction: true,
      data: { url: self.location.origin }
    })
  );
});
