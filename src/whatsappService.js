export const sendWhatsAppMessage = (reservationData, seat, rodada, config) => {
  // Obtener número de WhatsApp desde la configuración
  const whatsappNumber = config?.whatsapp?.adminPhone;

  if (!whatsappNumber) {
    alert('Error: No se ha configurado un número de WhatsApp para este evento.');
    console.error('WhatsApp number not configured in event config');
    return;
  }

  const isEventObject = typeof rodada === 'object' && rodada !== null;
  const eventName = isEventObject ? (rodada.event_name || 'Evento de Ciclismo') : 'Evento AccesoBike';
  const sessionName = isEventObject
    ? (rodada.rodada || 'Sesión Única')
    : (rodada === 'rodada1' ? 'Rodada 1 - 05:30 PM' : 'Rodada 2 - 07:00 PM');

  // Datos del pago
  const pm = reservationData.paymentMethod;
  const pd = reservationData.paymentData;
  const paymentBlock = pm ? `
💳 *Pago:*
- Método: ${pm.name} (${pm.currency})
- Monto: ${pd?.monto || 'No indicado'}
- Fecha: ${pd?.fecha || 'No indicada'}${pm.requires_reference && pd?.referencia ? `\n- Referencia: ${pd.referencia}` : ''}` : '';

  const message = `🎉 *NUEVA RESERVA - ${eventName}* 🎉

👤 *Cliente:* ${reservationData.nombre} ${reservationData.apellido}
🆔 *Cédula:* ${reservationData.cedula}
📱 *Teléfono:* ${reservationData.telefono}

🚴‍♀️ *Detalles de la Reserva:*
- Asiento: #${seat.seat_number}
- ${sessionName}
${paymentBlock}
⏳ *Estado:* Reserva por confirmar
📅 *Fecha:* ${new Date().toLocaleDateString()}`;

  const encodedMessage = encodeURIComponent(message);
  const cleanNumber = whatsappNumber.replace('+', '').replace(/\s/g, '');
  const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodedMessage}`;

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

// FUNCIÓN para normalizar número de teléfono para wa.me (solo dígitos, sin +)
// No asume código de país — respeta lo que el usuario ingresó
const normalizePhoneNumber = (phone) => {
  if (!phone) return '';
  // Si el usuario incluyó + (código de país internacional), quitarlo para la URL
  // wa.me no acepta +, solo dígitos
  return phone.replace(/[^\d]/g, '');
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
${reservation.cancellationReason ? `\n📝 *Motivo:* ${reservation.cancellationReason}\n` : ''}
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