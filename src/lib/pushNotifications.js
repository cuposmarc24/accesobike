// ── Push Notifications para AdminPanel ──
// Usa la API nativa del browser: Notification + Service Worker

export const PUSH_STORAGE_KEY = 'admin_push_enabled';

/**
 * Pide permiso de notificaciones al admin y registra el SW.
 * Devuelve true si el permiso fue otorgado.
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) return false;

  if (Notification.permission === 'granted') return true;

  const result = await Notification.requestPermission();
  return result === 'granted';
}

/**
 * Devuelve el estado actual del permiso:
 * 'granted' | 'denied' | 'default' | 'unsupported'
 */
export function getNotificationStatus() {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

/**
 * Muestra una notificación local inmediata.
 * Si el SW está registrado, la manda por SW para que funcione
 * incluso con la pestaña en background.
 */
export async function sendLocalNotification(title, body, options = {}) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const payload = {
    body,
    icon: '/logo192.png',
    badge: '/favicon.ico',
    vibrate: [200, 100, 200],
    tag: options.tag || 'accesoBike-reservation',
    requireInteraction: options.requireInteraction ?? true,
    ...options
  };

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, payload);
    } else {
      new Notification(title, payload);
    }
  } catch (e) {
    // Fallback sin SW
    try { new Notification(title, payload); } catch (_) {}
  }
}

/**
 * Notifica al admin que hay una nueva reserva.
 */
export function notifyNewReservation(customerName, seatNumber, sessionName) {
  sendLocalNotification(
    '🚲 Nueva Reserva',
    `${customerName} reservó la bici #${seatNumber}${sessionName ? ` — ${sessionName}` : ''}`,
    { tag: `reservation-${Date.now()}`, requireInteraction: true }
  );
}
