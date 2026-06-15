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
 * Muestra notificación push compatible con Android y iOS 16.4+ (PWA instalada).
 *
 * - registration.showNotification() es el único método que funciona con la app minimizada
 *   tanto en Android como en iOS 16.4+ con la PWA instalada en pantalla de inicio.
 * - postMessage solo funciona si la pestaña está activa en primer plano, por eso no se usa.
 * - En iOS < 16.4 las notificaciones push no están soportadas por el sistema operativo.
 */
export async function sendLocalNotification(title, body, options = {}) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const payload = {
    body,
    icon: '/logo192.png',
    badge: '/logo192.png',
    vibrate: [200, 100, 200],
    tag: options.tag || 'accesoBike-reservation',
    requireInteraction: true,
    data: { url: window.location.href }
  };

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      // Funciona con PWA minimizada en Android y iOS 16.4+
      await registration.showNotification(title, payload);
    } else {
      // Fallback para navegador de escritorio sin SW
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
