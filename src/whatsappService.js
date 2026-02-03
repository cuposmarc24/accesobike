// CAMBIAR ESTE NÚMERO POR EL QUE USARÁN REALMENTE
const WHATSAPP_NUMBER = '+584145599026';

export const sendWhatsAppMessage = (reservationData, seat, rodada) => {
  // Determine event name and details based on rodada type (string or object)
  const isEventObject = typeof rodada === 'object' && rodada !== null;

  const eventName = isEventObject ? (rodada.event_name || 'Evento de Ciclismo') : 'Evento GirosGym';
  const sessionName = isEventObject ?
    (rodada.rodada || 'Sesión Única') :
    (rodada === 'rodada1' ? 'Rodada 1 - 05:30 PM' : 'Rodada 2 - 07:00 PM'); // Legacy fallback

  const message = `🎉 *NUEVA RESERVA - ${eventName}* 🎉

👤 *Cliente:* ${reservationData.nombre} ${reservationData.apellido}
🆔 *Cédula:* ${reservationData.cedula}
📱 *Teléfono:* ${reservationData.telefono}

🚴‍♀️ *Detalles de la Reserva:*
- Asiento: #${seat.seat_number}
- ${sessionName}

⏳ *Estado:* Reserva por confirmar
📅 *Fecha:* ${new Date().toLocaleDateString()}`;

  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER.replace('+', '')}?text=${encodedMessage}`;

  window.open(whatsappUrl, '_blank');
};

// NUEVA FUNCIÓN para asignación de asiento VIP
export const sendVIPAssignmentWhatsApp = (bidData, seat) => {
  // Normalizar el número del cliente
  const normalizedPhone = normalizePhoneNumber(bidData.phone);
  const customerPhone = normalizedPhone.replace('+', ''); // Solo números para la URL

  const message = `🏆 *¡FELICIDADES! - 13 Aniversario GirosGym* 🏆

¡Hola ${bidData.full_name}!

🎉 *¡HAS GANADO EL ASIENTO 27!* 🎉

🚴‍♀️ *Detalles de tu asiento:*
- Asiento: #${seat.seat_number} (27)
- ${bidData.rodada === 'rodada1' ? 'Rodada 1 - 05:30 PM' : 'Rodada 2 - 07:00 PM'}
- Monto ganador: $${bidData.bid_amount}

✅ *Estado:* ASIENTO ASIGNADO
📅 *Fecha del evento:* 08/08/2025

¡Gracias por participar en nuestra subasta ! 🏆💪

*GirosGym - 13 Aniversario*`;

  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${customerPhone}?text=${encodedMessage}`;

  window.open(whatsappUrl, '_blank');
};

// FUNCIÓN para normalizar número de teléfono
const normalizePhoneNumber = (phone) => {
  // Remover todos los caracteres que no sean números
  let cleanPhone = phone.replace(/\D/g, '');

  // Si el número comienza con 58, agregar +
  if (cleanPhone.startsWith('58')) {
    return `+${cleanPhone}`;
  }

  // Si el número comienza con 0, remover el 0 y agregar +58
  if (cleanPhone.startsWith('0')) {
    return `+58${cleanPhone.substring(1)}`;
  }

  // Si el número no tiene código de país, agregar +58
  if (cleanPhone.length === 10) {
    return `+58${cleanPhone}`;
  }

  // Si ya tiene +58, dejarlo como está
  if (phone.startsWith('+58')) {
    return phone;
  }

  // Por defecto agregar +58
  return `+58${cleanPhone}`;
};

// Función para formatear hora de 24h a 12h con AM/PM
const formatTime = (time) => {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

// Función para formatear fecha
const formatDate = (dateString) => {
  if (!dateString) return new Date().toLocaleDateString('es-ES');
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// NUEVA FUNCIÓN para mensajes de confirmación y cancelación del admin
export const sendAdminWhatsAppMessage = (reservation, action, eventData, config) => {
  // Normalizar el número del cliente
  const normalizedPhone = normalizePhoneNumber(reservation.customer_phone);
  const customerPhone = normalizedPhone.replace('+', ''); // Solo números para la URL

  // Obtener información del evento y sesión
  const eventName = eventData?.event_name || 'Evento de Ciclismo';
  const cyclingRoom = eventData?.cycling_room || 'Sala Principal';
  const eventDate = formatDate(eventData?.start_date);

  // Encontrar la sesión correspondiente
  // Si session_id es igual al event_id (formato viejo), usar la primera sesión
  const isOldFormat = reservation.session_id === eventData?.id;
  const session = isOldFormat
    ? config?.sessions?.[0]
    : config?.sessions?.find(s => s.id === reservation.session_id);

  const sessionName = session
    ? `${session.event_name} - ${formatTime(session.time)}`
    : 'Sesión única';

  let message;

  if (action === 'cancelada') {
    message = `❌ *CANCELACIÓN - ${eventName}* ❌

Hola ${reservation.customer_name},

Lamentamos informarte que tu reservación ha sido cancelada.

🚴‍♀️ *Detalles de la reserva cancelada:*
- Asiento: #${reservation.seats?.seat_number}
- ${sessionName}

🎯 *Estado:* CANCELADA
📅 *Fecha del evento:* ${eventDate}

Si tienes alguna duda, contáctanos.

*${cyclingRoom}*`;
  } else {
    message = `🎉 *CONFIRMACIÓN - ${eventName}* 🎉

¡Hola ${reservation.customer_name}!

✅ *¡Tu reservación ha sido procesada con éxito!*

🚴‍♀️ *Detalles confirmados:*
- Asiento: #${reservation.seats?.seat_number}
- ${sessionName}

🎯 *Estado:* CONFIRMADO
📅 *Fecha del evento:* ${eventDate}

¡Te esperamos! 💪🚴‍♀️

*${cyclingRoom}*`;
  }

  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${customerPhone}?text=${encodedMessage}`;

  window.open(whatsappUrl, '_blank');
};