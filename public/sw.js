// AccesoBike Service Worker

// Recibe mensajes desde la página para mostrar notificaciones
// Esto funciona incluso cuando la PWA está en background (minimizada)
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SHOW_NOTIFICATION') {
    const { title, body, tag } = event.data;
    event.waitUntil(
      self.registration.showNotification(title, {
        body,
        icon: '/logo192.png',
        badge: '/logo192.png',
        vibrate: [200, 100, 200],
        tag: tag || 'accesoBike-reservation',
        requireInteraction: true,
        data: { url: self.location.origin }
      })
    );
  }
});

// Al tocar la notificación, abre o enfoca la app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(event.notification.data?.url || '/');
    })
  );
});

// Handler para push externo (por si en el futuro se conecta FCM)
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'AccesoBike', {
      body: data.body || '',
      icon: '/logo192.png',
      badge: '/logo192.png',
      vibrate: [200, 100, 200],
      requireInteraction: true
    })
  );
});
