// CAMBIAR ESTE NÚMERO POR EL QUE USARÁN REALMENTE
const WHATSAPP_NUMBER = '+584145599026';

export const sendAuctionWhatsAppMessage = (bidData, rodada) => {
  const message = `🏆 *NUEVA SUBASTA VIP - 13 Aniversario GirosGym* 🏆

👤 *Participante:* ${bidData.fullName}
📱 *Teléfono:* ${bidData.phone}
💰 *Monto de Subasta:* $${bidData.bidAmount}

🚴‍♀️ *Detalles:*
- Asiento VIP - Subasta
- ${rodada === 'rodada1' ? 'Rodada 1 - 05:30 PM' : 'Rodada 2 - 07:00 PM'}

🎯 *Estado:* Subasta registrada
📅 *Fecha:* ${new Date().toLocaleDateString()}
🕒 *Hora:* ${new Date().toLocaleTimeString()}

*¡Nueva oferta recibida!* 🔥

*GirosGym - 13 Aniversario*`;

  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER.replace('+', '')}?text=${encodedMessage}`;
  
  window.open(whatsappUrl, '_blank');
};