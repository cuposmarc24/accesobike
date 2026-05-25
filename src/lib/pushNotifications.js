// ── Push Notifications para AdminPanel ──

export const PUSH_STORAGE_KEY = 'admin_push_enabled';

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function getNotificationStatus() {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

/**
 * Muestra notificación via Service Worker (funciona en background/PWA minimizada).
 * Fallback a Notification API directa si no hay SW.
 */
export async function sendLocalNotification(title, body, options = {}) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const payload = {
    body,
    icon: '/logo192.png',
    badge: '/logo192.png',
    vibrate: [200, 100, 200],
    tag: options.tag || 'accesoBike-reservation',
    requireInteraction: options.requireInteraction ?? true,
    ...options
  };

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;

      // Usar postMessage para que el SW muestre la notificación
      // Esto funciona incluso cuando la PWA está minimizada
      if (registration.active) {
        registration.active.postMessage({
          type: 'SHOW_NOTIFICATION',
          title,
          body,
          tag: payload.tag
        });
      } else {
        // Fallback: mostrar directamente desde el SW
        await registration.showNotification(title, payload);
      }
    } else {
      new Notification(title, payload);
    }
  } catch (e) {
    try { new Notification(title, payload); } catch (_) {}
  }
}

export function notifyNewReservation(customerName, seatNumber, sessionName) {
  sendLocalNotification(
    '🚲 Nueva Reserva — AccesoBike',
    `${customerName} reservó la Bici #${seatNumber}${sessionName ? ` · ${sessionName}` : ''}`,
    { tag: `reservation-${Date.now()}`, requireInteraction: true }
  );
}
