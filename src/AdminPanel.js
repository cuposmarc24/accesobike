import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { useEventConfig } from './lib/EventConfigProvider';
import { sendAdminWhatsAppMessage, sendVIPAssignmentWhatsApp } from './whatsappService';
import AdminAlert from './AdminAlert';
import AdminBikes from './AdminBikes';
import AdminSettings from './AdminSettings';
import GlowingNav from './GlowingNav';
import { MdCheck, MdClose, MdLockOpen, MdEmojiEvents, MdDelete, MdPhone, MdDownload, MdHourglassEmpty, MdCheckCircleOutline, MdStarOutline } from 'react-icons/md';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  requestNotificationPermission,
  getNotificationStatus,
  notifyNewReservation
} from './lib/pushNotifications';

function AdminPanel({ onBack, eventId: propEventId, config: propConfig, eventData: propEventData }) {
  const { eventId: contextEventId, config: contextConfig, eventData: contextEventData } = useEventConfig();

  const eventId = propEventId || contextEventId;
  const config = contextConfig || propConfig;
  // Usar eventData del contexto (siempre fresco desde BD, incluye logo base64)
  const eventData = contextEventData || propEventData;

  // Mismo patrón que SeatMap — usa config del EventConfigProvider (fuente más confiable)
  const primaryColor    = config?.theme?.primaryColor    || '#13c8ec';
  const secondaryColor  = config?.theme?.secondaryColor  || '#1a2c30';
  const backgroundColor = config?.theme?.backgroundColor || '#111f22';

  console.log('🎨 AdminPanel colores:', { primaryColor, secondaryColor, backgroundColor, theme: config?.theme });

  // Navigation tabs: 'dashboard' | 'bikes' | 'reservations' | 'settings'
  const [activeNav, setActiveNav] = useState('dashboard');

  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [auctionBids, setAuctionBids] = useState([]);
  const [alert, setAlert] = useState({ isOpen: false });
  const [activeSessionTab, setActiveSessionTab] = useState(config?.sessions?.[0]?.id || 'session1');
  const [notifStatus, setNotifStatus] = useState(getNotificationStatus());
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [cancelReasonModal, setCancelReasonModal] = useState(null); // reservation to cancel
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    fetchReservations();
  }, [eventId]);

  // Supabase Realtime — sin filtro para máxima compatibilidad
  useEffect(() => {
    if (!eventId) return;

    const channel = supabase
      .channel(`admin-panel-rt-${eventId}`)
      .on('postgres_changes', {
        event: '*',           // INSERT + UPDATE + DELETE
        schema: 'public',
        table: 'reservations'
        // Sin filter — más compatible con todos los planes de Supabase
      }, (payload) => {
        // Filtrar por eventId en el callback
        const row = payload.new || payload.old;
        if (row?.event_id !== eventId) return;

        fetchReservations();   // actualiza pendientes + ocupados

        // Notificación push solo en INSERT
        if (payload.eventType === 'INSERT' && getNotificationStatus() === 'granted') {
          const session = config?.sessions?.find(s => s.id === row.session_id);
          notifyNewReservation(row.customer_name, row.seat_id, session?.event_name || '');
        }
      })
      .subscribe((status) => {
        console.log('📡 Realtime AdminPanel:', status);
      });

    return () => { supabase.removeChannel(channel); };
  }, [eventId]);

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotifStatus(granted ? 'granted' : Notification.permission);
  };

  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getSessionName = (sessionId) => {
    if (!config?.sessions) return sessionId;
    const session = config.sessions.find(s => s.id === sessionId);
    return session ? `${session.event_name} - ${formatTime(session.time)}` : sessionId;
  };

  const fetchReservations = async () => {
    if (!eventId) return;
    try {
      const { data } = await supabase
        .from('reservations')
        .select('*, seats(seat_number, row_number)')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      setReservations(data || []);

      const { data: bidsData } = await supabase
        .from('auction_bids')
        .select('*')
        .eq('event_id', eventId)
        .order('session_id')
        .order('bid_amount', { ascending: false });

      setAuctionBids(bidsData || []);
    } catch (e) {
      console.error('Error fetching reservations:', e);
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (type, title, message, onConfirm, onCancel = null) => {
    setAlert({
      isOpen: true, type, title, message,
      onConfirm: () => { setAlert({ isOpen: false }); if (typeof onConfirm === 'function') onConfirm(); },
      onCancel: onCancel ? () => { setAlert({ isOpen: false }); if (typeof onCancel === 'function') onCancel(); } : null
    });
  };

  const assignVIPSeat = (bid) => {
    showAlert('confirm', 'Asignar Asiento VIP',
      `¿Asignar el asiento VIP a ${bid.full_name} por $${bid.bid_amount}?`,
      async () => {
        try {
          const { data: vipSeat, error: seatError } = await supabase
            .from('seats').select('*').eq('event_id', eventId).eq('seat_number', 27).single();
          if (seatError) { showAlert('error', 'Error', 'No se pudo encontrar el asiento VIP #27'); return; }

          const { data: existing } = await supabase.from('reservations').select('*')
            .eq('seat_id', vipSeat.id).eq('event_id', eventId).eq('session_id', bid.session_id).maybeSingle();

          if (existing) { showAlert('warning', 'Asiento Ocupado', `El asiento VIP ya está asignado a ${existing.customer_name}`); return; }

          const { error: resError } = await supabase.from('reservations').insert([{
            event_id: eventId, seat_id: vipSeat.id, session_id: bid.session_id,
            customer_name: bid.full_name, customer_phone: bid.phone, status: 'ocupada'
          }]);

          if (resError) { showAlert('error', 'Error', 'No se pudo asignar el asiento VIP'); return; }
          sendVIPAssignmentWhatsApp(bid, vipSeat);
          fetchReservations();
          showAlert('success', '¡VIP Asignado!', `Asiento VIP #${vipSeat.seat_number} asignado a ${bid.full_name}`);
        } catch { showAlert('error', 'Error', 'Ocurrió un error inesperado'); }
      }, () => { }
    );
  };

  const confirmReservation = (reservation) => {
    showAlert('confirm', 'Confirmar Reserva',
      `¿Confirmar la reserva de ${reservation.customer_name} para el asiento #${reservation.seats?.seat_number}?`,
      async () => {
        try {
          const { error } = await supabase.from('reservations').update({ status: 'ocupada' }).eq('id', reservation.id);
          if (error) { showAlert('error', 'Error', 'No se pudo confirmar la reserva'); return; }
          sendAdminWhatsAppMessage(reservation, 'confirmada', eventData, config);
          await fetchReservations();
          showAlert('success', '¡Confirmada!', 'Reserva confirmada y notificada por WhatsApp');
        } catch { showAlert('error', 'Error', 'Ocurrió un error al confirmar'); }
      }, () => { }
    );
  };

  const cancelReservation = (reservation) => {
    // Open prompt for cancellation reason
    setCancelReason('');
    setCancelReasonModal(reservation);
    setSelectedReservation(null);
  };

  const executeCancelReservation = async (reservation, reason) => {
    try {
      const { error } = await supabase.from('reservations').delete().eq('id', reservation.id);
      if (error) { showAlert('error', 'Error', 'No se pudo cancelar la reserva'); return; }
      // Add reason to reservation object for WhatsApp message
      sendAdminWhatsAppMessage({ ...reservation, cancellationReason: reason }, 'cancelada', eventData, config);
      await fetchReservations();
      showAlert('success', 'Cancelada', 'Reserva cancelada y notificada');
    } catch { showAlert('error', 'Error', 'Ocurrió un error al cancelar'); }
  };

  const enableOccupied = (reservation) => {
    showAlert('confirm', 'Habilitar Asiento',
      `¿Habilitar nuevamente el asiento #${reservation.seats?.seat_number}?`,
      async () => {
        try {
          await supabase.from('reservations').delete().eq('id', reservation.id);
          fetchReservations();
          showAlert('success', 'Habilitado', 'El asiento está disponible nuevamente');
        } catch { showAlert('error', 'Error', 'Ocurrió un error al habilitar el asiento'); }
      }, () => { }
    );
  };

  const deleteBid = (bid) => {
    showAlert('warning', 'Eliminar Subasta',
      `¿Eliminar la subasta de ${bid.full_name}?`,
      async () => {
        try {
          await supabase.from('auction_bids').delete().eq('id', bid.id);
          fetchReservations();
          showAlert('success', 'Eliminada', 'Subasta eliminada exitosamente');
        } catch { showAlert('error', 'Error', 'Ocurrió un error al eliminar'); }
      }, () => { }
    );
  };

  const hexToRGB = (hex) => {
    hex = hex.replace('#', '');
    return {
      r: parseInt(hex.substring(0, 2), 16),
      g: parseInt(hex.substring(2, 4), 16),
      b: parseInt(hex.substring(4, 6), 16)
    };
  };

  const generatePDF = (sessionId) => {
    const hasOldFormat = occupiedReservations.some(r => r.session_id === eventId);
    const filteredReservations = hasOldFormat
      ? occupiedReservations
      : occupiedReservations.filter(r => r.session_id === sessionId);

    const session = config?.sessions?.find(s => s.id === sessionId);
    const sessionName = session ? `${session.event_name} - ${formatTime(session.time)}` : 'Sesión única';

    if (filteredReservations.length === 0) {
      showAlert('warning', 'Sin datos', `No hay asientos ocupados en ${sessionName}`);
      return;
    }

    const doc = new jsPDF();
    const primaryRGB = hexToRGB(primaryColor);
    doc.setFontSize(20);
    doc.setTextColor(primaryRGB.r, primaryRGB.g, primaryRGB.b);
    doc.text(eventData?.event_name || 'Evento de Ciclismo', 20, 25);
    doc.setFontSize(16); doc.setTextColor(0, 0, 0);
    doc.text(sessionName, 20, 35);
    doc.setFontSize(12);
    doc.text(`Lista de Asientos Ocupados - ${new Date().toLocaleDateString('es-ES')}`, 20, 45);

    autoTable(doc, {
      head: [['#', 'Nombre', 'Asiento', 'Teléfono', 'Fecha']],
      body: [...filteredReservations]
        .sort((a, b) => (a.seats?.seat_number || 0) - (b.seats?.seat_number || 0))
        .map((r, i) => [
          i + 1, r.customer_name, `#${r.seats?.seat_number}`, r.customer_phone,
          new Date(r.created_at).toLocaleDateString('es-ES')
        ]),
      startY: 55,
      styles: { fontSize: 10, cellPadding: 5 },
      headStyles: { fillColor: [primaryRGB.r, primaryRGB.g, primaryRGB.b], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });

    const finalY = doc.lastAutoTable.finalY + 20;
    doc.setFontSize(10); doc.setTextColor(128, 128, 128);
    doc.text(`Total: ${filteredReservations.length} participantes`, 20, finalY);
    doc.text('AccesoBike - Desarrollado por TecnoAcceso', 20, finalY + 10);

    const sessionFileName = session ? session.event_name.replace(/\s+/g, '_') : 'session';
    doc.save(`${eventData?.cycling_room || 'Evento'}_${sessionFileName}_${new Date().toLocaleDateString('es-ES').replace(/\//g, '-')}.pdf`);
    showAlert('success', 'PDF Generado', `Lista de ${sessionName} descargada`);
  };

  const pendingReservations = reservations.filter(r => r.status === 'reservada');
  const occupiedReservations = reservations.filter(r => r.status === 'ocupada');

  // ── Estilos reutilizables ──
  const sectionTitle = (label, count, color = primaryColor) => (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      marginBottom: '14px', paddingBottom: '10px',
      borderBottom: `1px solid ${color}30`
    }}>
      <h2 style={{ color, fontSize: '15px', fontWeight: '700', margin: 0 }}>{label}</h2>
      {count !== undefined && (
        <span style={{
          background: `${color}20`, color,
          fontSize: '12px', fontWeight: '700',
          padding: '3px 10px', borderRadius: '20px',
          border: `1px solid ${color}40`
        }}>{count}</span>
      )}
    </div>
  );

  // ── BOTTOM SHEET: Detalle de reserva ──
  const ReservationDetailModal = ({ reservation, onClose }) => {
    const [closing, setClosing] = useState(false);

    if (!reservation && !closing) return null;

    const isPending = reservation?.status === 'reservada';
    const sessionLabel = (() => {
      if (!reservation) return '';
      const hasOldFormat = reservation.session_id === eventId;
      return hasOldFormat
        ? (config?.sessions?.[0] ? `${config.sessions[0].event_name} - ${formatTime(config.sessions[0].time)}` : 'Sesión única')
        : getSessionName(reservation.session_id);
    })();

    const handleClose = () => {
      setClosing(true);
      setTimeout(() => { setClosing(false); onClose(); }, 320);
    };

    const animStyle = closing
      ? { transform: 'translateY(100%)', opacity: 0, transition: 'transform 0.32s cubic-bezier(0.32,0,0.67,0), opacity 0.28s ease' }
      : { transform: 'translateY(0)', opacity: 1, transition: 'transform 0.36s cubic-bezier(0.16,1,0.3,1), opacity 0.2s ease' };

    if (!reservation) return null;

    return (
      <div
        style={{
          position: 'fixed', inset: 0,
          background: closing ? 'rgba(0,0,0,0)' : 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          zIndex: 3000,
          transition: 'background 0.3s ease'
        }}
        onClick={handleClose}
      >
        <style>{`@keyframes sheetUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
        <div
          onClick={e => e.stopPropagation()}
          style={{
            background: backgroundColor,
            width: '100%', maxWidth: '480px',
            borderRadius: '20px 20px 0 0',
            border: `1.5px solid ${primaryColor}30`,
            borderBottom: 'none',
            boxShadow: '0 -12px 50px rgba(0,0,0,0.6)',
            fontFamily: 'Inter, sans-serif',
            maxHeight: '92vh',
            overflowY: 'auto',
            animation: closing ? 'none' : 'sheetUp 0.36s cubic-bezier(0.16,1,0.3,1)',
            ...animStyle
          }}
        >
          {/* Drag handle */}
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '12px', paddingBottom: '4px' }}>
            <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.12)' }} />
          </div>

          {/* Header */}
          <div style={{ padding: '12px 20px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#e2e8f0', fontFamily: 'Inter, sans-serif' }}>Detalle de Reserva</h2>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>{sessionLabel}</p>
            </div>
            <button onClick={handleClose} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '6px 10px', color: '#94a3b8', cursor: 'pointer', fontSize: '15px', lineHeight: 1 }}>✕</button>
          </div>

          <div style={{ padding: '18px 20px 32px' }}>
            {/* Info cliente */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '14px', marginBottom: '12px' }}>
              <p style={{ margin: '0 0 6px', fontSize: '10px', fontWeight: '700', color: '#475569', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Cliente</p>
              <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: '800', color: '#e2e8f0' }}>{reservation.customer_name}</h3>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                <Tag label={`Bici #${reservation.seats?.seat_number}`} color={primaryColor} />
                <Tag label={new Date(reservation.created_at).toLocaleDateString('es-VE')} color="#64748b" />
                <Tag label={isPending ? 'PENDIENTE' : 'CONFIRMADO'} color={isPending ? '#f97316' : '#22c55e'} />
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <MdPhone size={13} /> {reservation.customer_phone}
              </p>
            </div>

            {/* Datos de pago */}
            {(reservation.payment_method_name || reservation.payment_monto || reservation.payment_fecha) && (
              <div style={{ background: `${primaryColor}08`, border: `1px solid ${primaryColor}25`, borderRadius: '12px', padding: '14px', marginBottom: '12px' }}>
                <p style={{ margin: '0 0 10px', fontSize: '10px', fontWeight: '700', color: primaryColor, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Datos del pago</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {reservation.payment_method_name && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>Método</span>
                      <span style={{ fontSize: '13px', color: '#e2e8f0', fontWeight: '700' }}>💳 {reservation.payment_method_name}</span>
                    </div>
                  )}
                  {reservation.payment_monto && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>Monto</span>
                      <span style={{ fontSize: '13px', color: primaryColor, fontWeight: '800' }}>{reservation.payment_monto}</span>
                    </div>
                  )}
                  {reservation.payment_fecha && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>Fecha</span>
                      <span style={{ fontSize: '13px', color: '#e2e8f0' }}>{reservation.payment_fecha}</span>
                    </div>
                  )}
                  {reservation.payment_referencia && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>Referencia</span>
                      <span style={{ fontSize: '13px', color: '#e2e8f0', letterSpacing: '0.1em', fontWeight: '700' }}>{reservation.payment_referencia}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Comprobante */}
            {reservation.payment_capture_url && (
              <div style={{ marginBottom: '14px' }}>
                <p style={{ margin: '0 0 8px', fontSize: '10px', fontWeight: '700', color: '#475569', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Comprobante</p>
                <img
                  src={reservation.payment_capture_url}
                  alt="Comprobante"
                  style={{ width: '100%', borderRadius: '12px', border: `1px solid ${primaryColor}30`, objectFit: 'cover', cursor: 'pointer' }}
                  onClick={() => window.open(reservation.payment_capture_url, '_blank')}
                />
              </div>
            )}

            {/* Acciones */}
            {isPending && (
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  onClick={() => { confirmReservation(reservation); handleClose(); }}
                  style={{
                    flex: 1, padding: '13px', borderRadius: '12px', border: 'none',
                    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                    color: 'white', fontSize: '14px', fontWeight: '800',
                    cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                  }}
                >
                  <MdCheck size={18} /> Confirmar
                </button>
                <button
                  onClick={() => { cancelReservation(reservation); handleClose(); }}
                  style={{
                    flex: 1, padding: '13px', borderRadius: '12px',
                    border: '1px solid rgba(239,68,68,0.4)',
                    background: 'rgba(239,68,68,0.1)',
                    color: '#ef4444', fontSize: '14px', fontWeight: '800',
                    cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                  }}
                >
                  <MdClose size={18} /> Cancelar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };





  const pendingListRow = (reservation) => (
    <div
      key={reservation.id}
      onClick={() => setSelectedReservation(reservation)}
      style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '12px 14px', borderRadius: '12px',
        border: `1px solid ${primaryColor}20`,
        background: 'rgba(255,255,255,0.02)',
        cursor: 'pointer', transition: 'all 0.15s',
        marginBottom: '8px'
      }}
      onMouseOver={e => { e.currentTarget.style.background = `${primaryColor}0A`; e.currentTarget.style.borderColor = `${primaryColor}50`; }}
      onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = `${primaryColor}20`; }}
    >
      {/* Avatar / seat number */}
      <div style={{
        width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
        background: `${primaryColor}18`, border: `1px solid ${primaryColor}30`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
      }}>
        <span style={{ fontSize: '8px', color: primaryColor, fontWeight: '700', letterSpacing: '0.05em' }}>BICI</span>
        <span style={{ fontSize: '14px', color: primaryColor, fontWeight: '900', lineHeight: 1 }}>#{reservation.seats?.seat_number}</span>
      </div>
      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {reservation.customer_name}
        </p>
        <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#64748b' }}>
          {reservation.customer_phone} · {new Date(reservation.created_at).toLocaleDateString('es-VE')}
        </p>
      </div>
      {/* Flecha */}
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
    </div>
  );

  const reservationCard = (reservation, isPending) => (
    <div key={reservation.id} style={{
      background: isPending ? 'rgba(255,255,255,0.03)' : 'rgba(239,68,68,0.04)',
      borderRadius: '14px',
      padding: '14px',
      border: isPending
        ? `1px solid ${primaryColor}20`
        : '1px solid rgba(239,68,68,0.2)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div>
          <h3 style={{ color: 'white', fontSize: '14px', fontWeight: '700', margin: '0 0 4px 0' }}>
            {reservation.customer_name}
          </h3>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Tag label={`Bici #${reservation.seats?.seat_number}`} color={primaryColor} />
            <Tag label={new Date(reservation.created_at).toLocaleDateString('es-VE')} color="#64748b" />
          </div>
        </div>
        <div style={{
          background: isPending ? `${primaryColor}15` : 'rgba(239,68,68,0.15)',
          border: isPending ? `1px solid ${primaryColor}30` : '1px solid rgba(239,68,68,0.3)',
          borderRadius: '8px',
          padding: '4px 8px',
          fontSize: '11px',
          fontWeight: '700',
          color: isPending ? primaryColor : '#ef4444'
        }}>
          {isPending ? 'PENDIENTE' : 'OCUPADO'}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '6px', fontSize: '12px', color: '#64748b', marginBottom: '10px', flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MdPhone size={12} /> {reservation.customer_phone}</span>
        <span>•</span>
        <span>{(() => {
          const hasOldFormat = reservation.session_id === eventId;
          return hasOldFormat
            ? (config?.sessions?.[0] ? `${config.sessions[0].event_name} - ${formatTime(config.sessions[0].time)}` : 'Sesión única')
            : getSessionName(reservation.session_id);
        })()}</span>
      </div>

      {isPending ? (
        <div style={{ display: 'flex', gap: '8px' }}>
          <ActionButton label="Confirmar" icon={MdCheck} color="#22c55e" onClick={() => confirmReservation(reservation)} />
          <ActionButton label="Cancelar" icon={MdClose} color="#ef4444" onClick={() => cancelReservation(reservation)} />
        </div>
      ) : (
        <ActionButton label="Habilitar asiento" icon={MdLockOpen} color="#f97316" onClick={() => enableOccupied(reservation)} fullWidth />
      )}
    </div>
  );

  // ── LOADING ──
  if (loading) {
    return (
      <div style={{ background: backgroundColor, minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white' }}>
        Cargando...
      </div>
    );
  }

  // ── CONTENIDO POR SECCIÓN ──
  const renderContent = () => {
    switch (activeNav) {
      case 'settings':
        return (
          <AdminSettings
            eventId={eventId}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            backgroundColor={backgroundColor}
          />
        );

      case 'reservations': {
        // Filtrar por sesión activa. Reservas con session_id === eventId son
        // formato viejo (pre-fix) — se asignan a la primera sesión por compatibilidad.
        const normalizeSessionId = (r) =>
          (r.session_id === eventId) ? (config?.sessions?.[0]?.id || activeSessionTab) : r.session_id;

        const filteredPending = pendingReservations.filter(r => normalizeSessionId(r) === activeSessionTab);
        const filteredOccupied = occupiedReservations.filter(r => normalizeSessionId(r) === activeSessionTab);

        // Contar pendientes por sesión para mostrar en cada tab
        const pendingCountBySession = (sessionId) => {
          const firstSessionId = config?.sessions?.[0]?.id;
          return pendingReservations.filter(r => {
            const sid = (r.session_id === eventId) ? firstSessionId : r.session_id;
            return sid === sessionId;
          }).length;
        };

        return (
          <div style={{ paddingBottom: '80px' }}>
            {/* Tabs de sesión */}
            {config?.sessions && config.sessions.length > 1 && (
              <div style={{
                display: 'flex', gap: '4px', marginBottom: '18px',
                background: 'rgba(255,255,255,0.03)', borderRadius: '12px',
                padding: '4px', overflowX: 'auto'
              }}>
                {config.sessions.map(s => {
                  const isActive = activeSessionTab === s.id;
                  const pendingCount = pendingCountBySession(s.id);
                  return (
                    <button
                      key={s.id}
                      onClick={() => setActiveSessionTab(s.id)}
                      style={{
                        flex: 1, minWidth: '100px', padding: '9px 10px',
                        borderRadius: '9px', border: 'none', fontSize: '12px',
                        fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap',
                        background: isActive ? primaryColor : 'transparent',
                        color: isActive ? backgroundColor : '#64748b',
                        transition: 'all 0.2s',
                        position: 'relative'
                      }}
                    >
                      {s.event_name || s.id}
                      {pendingCount > 0 && (
                        <span style={{
                          position: 'absolute', top: '4px', right: '6px',
                          background: isActive ? backgroundColor : '#ef4444',
                          color: isActive ? '#ef4444' : '#fff',
                          borderRadius: '50%', width: '16px', height: '16px',
                          fontSize: '10px', fontWeight: '800',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          lineHeight: 1
                        }}>
                          {pendingCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Pendientes */}
            <div style={{ marginBottom: '28px' }}>
              {sectionTitle('Reservas Pendientes', filteredPending.length)}
              {filteredPending.length === 0 ? (
                <EmptyState icon={MdHourglassEmpty} text="No hay reservas pendientes" />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {filteredPending.map(r => pendingListRow(r))}
                </div>
              )}
            </div>

            {/* Ocupados */}
            <div>
              {sectionTitle('Asientos Ocupados', filteredOccupied.length, '#ef4444')}

              {/* PDF button */}
              {filteredOccupied.length > 0 && (
                <button
                  onClick={() => generatePDF(activeSessionTab)}
                  style={{
                    background: 'rgba(76,175,80,0.15)', color: '#4caf50',
                    border: '1px solid rgba(76,175,80,0.3)', borderRadius: '10px',
                    padding: '8px 14px', fontSize: '12px', fontWeight: '600',
                    cursor: 'pointer', marginBottom: '12px'
                  }}
                >
                  <MdDownload size={14} style={{ marginRight: '5px', verticalAlign: 'middle' }} />Exportar PDF
                </button>
              )}

              {filteredOccupied.length === 0 ? (
                <EmptyState icon={MdCheckCircleOutline} text="No hay asientos ocupados en esta sesión" />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {filteredOccupied.map(r => reservationCard(r, false))}
                </div>
              )}
            </div>

            {/* VIP Subastas */}
            {config?.vipFeatures?.enabled && (
              <div style={{ marginTop: '32px' }}>
                {sectionTitle('Subastas VIP', auctionBids.length, '#fbbf24')}
                {auctionBids.length === 0 ? (
                  <EmptyState icon={MdStarOutline} text="No hay subastas activas" />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {auctionBids.filter(b => b.session_id === activeSessionTab).map((bid, index) => (
                      <div key={bid.id} style={{
                        background: 'rgba(251,191,36,0.06)',
                        border: '1px solid rgba(251,191,36,0.2)',
                        borderRadius: '14px', padding: '14px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <h3 style={{ color: '#fbbf24', fontSize: '14px', fontWeight: '700', margin: 0 }}>
                            {index === 0 ? '🥇 ' : `#${index + 1} `}{bid.full_name}
                          </h3>
                          <span style={{ color: '#fbbf24', fontSize: '16px', fontWeight: '800' }}>${bid.bid_amount}</span>
                        </div>
                        <p style={{ color: '#64748b', fontSize: '12px', margin: '0 0 10px 0' }}>
                          <MdPhone size={12} style={{ verticalAlign: 'middle', marginRight: '3px' }} />{bid.phone} • {new Date(bid.created_at).toLocaleDateString('es-VE')}
                        </p>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <ActionButton label="Asignar VIP" icon={MdEmojiEvents} color="#fbbf24" textColor="#000" onClick={() => assignVIPSeat(bid)} />
                          <ActionButton label="Eliminar" icon={MdDelete} color="#ef4444" onClick={() => deleteBid(bid)} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      }

      default: { // dashboard
        const sessions = config?.sessions || [];
        const activeSession = sessions.find(s => s.id === activeSessionTab) || sessions[0];
        const flyer = activeSession?.image || eventData?.event_image;

        return (
          <div style={{ paddingBottom: '100px' }}>

            {/* Selector de sesión con flyer */}
            {sessions.length > 0 && (
              <div style={{ marginBottom: '14px' }}>
                {/* Tabs de sesión */}
                {sessions.length > 1 && (
                  <div style={{
                    display: 'flex', gap: '4px', marginBottom: '10px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '10px', padding: '4px'
                  }}>
                    {sessions.map(s => (
                      <button
                        key={s.id}
                        onClick={() => setActiveSessionTab(s.id)}
                        style={{
                          flex: 1, padding: '8px 10px', borderRadius: '8px',
                          border: 'none', fontSize: '12px', fontWeight: '600',
                          cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s',
                          background: activeSessionTab === s.id ? primaryColor : 'transparent',
                          color: activeSessionTab === s.id ? backgroundColor : '#64748b',
                        }}
                      >
                        {s.event_name || s.id}
                      </button>
                    ))}
                  </div>
                )}

                {/* Flyer de la sesión activa */}
                {flyer && (
                  <img
                    src={flyer}
                    alt="Flyer"
                    style={{
                      width: '100%', borderRadius: '12px',
                      border: `1px solid ${primaryColor}20`,
                      objectFit: 'cover', display: 'block'
                    }}
                  />
                )}
              </div>
            )}

            {/* Alerta de pendientes */}
            {pendingReservations.length > 0 && (
              <div style={{
                border: `1px solid ${primaryColor}30`,
                borderRadius: '11px', padding: '11px 14px', marginBottom: '14px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>
                  <span style={{ color: primaryColor, fontWeight: '700' }}>{pendingReservations.length}</span> pendientes
                </p>
                <button
                  onClick={() => setActiveNav('reservations')}
                  style={{
                    background: `${primaryColor}20`, color: primaryColor,
                    border: `1px solid ${primaryColor}40`, borderRadius: '8px', padding: '6px 12px',
                    fontSize: '12px', fontWeight: '700', cursor: 'pointer', flexShrink: 0
                  }}
                >Ver →</button>
              </div>
            )}

            {/* Mapa de bicis — tabs controlados por el dashboard */}
            <AdminBikes
              eventId={eventId}
              config={config}
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
              backgroundColor={backgroundColor}
              reservations={reservations}
              activeTab={activeSessionTab}
              onTabChange={setActiveSessionTab}
            />
          </div>
        );
      }
    }
  };

  const navLabels = {
    dashboard: 'Dashboard',
    bikes: 'Bicis',
    reservations: 'Reservas',
    settings: 'Ajustes'
  };

  return (
    <div style={{
      background: backgroundColor,
      minHeight: '100vh',
      padding: '0',
      color: 'white',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* ── HEADER ── */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: `${backgroundColor}f0`,
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid rgba(255,255,255,0.06)`,
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        {/* Logo + título */}
        {eventData?.cycling_room_logo && (
          <img
            src={eventData.cycling_room_logo}
            alt="Logo"
            style={{ width: '36px', height: '36px', borderRadius: '9px', objectFit: 'cover', flexShrink: 0 }}
          />
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{
            color: 'white', fontSize: '15px', fontWeight: '700',
            margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
          }}>
            {navLabels[activeNav]}
          </h1>
          <p style={{
            color: '#64748b', fontSize: '11px', margin: 0,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
          }}>
            {eventData?.event_name || 'Panel Admin'}
          </p>
        </div>

        {/* Botón notificaciones */}
        <button
          onClick={handleEnableNotifications}
          title={notifStatus === 'granted' ? 'Notificaciones activas' : notifStatus === 'denied' ? 'Notificaciones bloqueadas' : 'Activar notificaciones'}
          style={{
            background: notifStatus === 'granted' ? `${primaryColor}18` : 'rgba(255,255,255,0.06)',
            border: notifStatus === 'granted' ? `1px solid ${primaryColor}40` : '1px solid rgba(255,255,255,0.08)',
            borderRadius: '10px', padding: '8px 10px',
            cursor: notifStatus === 'denied' ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'all 0.2s'
          }}
        >
          {notifStatus === 'granted' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              <circle cx="18" cy="6" r="4" fill="#22c55e" stroke="none"/>
            </svg>
          ) : notifStatus === 'denied' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              <line x1="4" y1="4" x2="20" y2="20"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          )}
        </button>

        {/* Botón cerrar sesión — solo ícono */}
        <button
          onClick={() => showAlert('confirm', 'Cerrar sesión', '¿Estás seguro que deseas cerrar sesión del panel de administración?',
            () => onBack(),
            () => {}
          )}
          title="Cerrar sesión"
          style={{
            background: 'rgba(239,68,68,0.08)',
            color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: '10px', padding: '8px 10px',
            cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>

      {/* ── CONTENIDO ── */}
      <div style={{ padding: '16px' }}>
        {renderContent()}
      </div>

      <GlowingNav
        activeKey={activeNav}
        onChange={setActiveNav}
        primaryColor={primaryColor}
        backgroundColor={backgroundColor}
        items={[
          { key: 'dashboard', label: 'Estado' },
          { key: 'reservations', label: 'Reservas', badge: pendingReservations.length },
          { key: 'settings', label: 'Ajustes' }
        ]}
      />

      <AdminAlert
        isOpen={alert.isOpen}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onConfirm={alert.onConfirm}
        onCancel={alert.onCancel}
        theme={{ primaryColor, secondaryColor, backgroundColor }}
      />

      {/* Modales de detalle y cancelación */}
      <ReservationDetailModal
        reservation={selectedReservation}
        onClose={() => setSelectedReservation(null)}
      />
      {/* Modal motivo de cancelación — inline para evitar pérdida de foco */}
      {cancelReasonModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(6px)', display: 'flex', justifyContent: 'center',
          alignItems: 'center', zIndex: 4000, padding: '20px'
        }}>
          <div style={{
            background: backgroundColor, borderRadius: '18px', width: '100%', maxWidth: '360px',
            border: '1.5px solid rgba(239,68,68,0.4)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.7)', padding: '24px',
            fontFamily: 'Inter, sans-serif'
          }}>
            <h3 style={{ margin: '0 0 6px', fontSize: '17px', fontWeight: '800', color: '#e2e8f0' }}>Motivo de cancelación</h3>
            <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#64748b' }}>
              ¿Por qué se cancela la reserva de <strong style={{ color: '#e2e8f0' }}>{cancelReasonModal.customer_name}</strong>?
            </p>
            <textarea
              autoFocus
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder="Ej: Pago no recibido, cliente no se presentó..."
              rows={3}
              style={{
                width: '100%', padding: '11px 13px', borderRadius: '10px', boxSizing: 'border-box',
                border: '1.5px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.05)',
                color: '#e2e8f0', fontSize: '14px', fontFamily: 'Inter, sans-serif',
                resize: 'none', outline: 'none'
              }}
            />
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button
                onClick={() => { setCancelReasonModal(null); setCancelReason(''); }}
                style={{
                  flex: 1, padding: '12px', borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.08)', background: 'transparent',
                  color: '#64748b', fontSize: '14px', fontWeight: '600', cursor: 'pointer'
                }}
              >Volver</button>
              <button
                onClick={() => {
                  executeCancelReservation(cancelReasonModal, cancelReason);
                  setCancelReasonModal(null);
                  setCancelReason('');
                }}
                style={{
                  flex: 2, padding: '12px', borderRadius: '10px', border: 'none',
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: 'white', fontSize: '14px', fontWeight: '800', cursor: 'pointer'
                }}
              ><MdClose size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }} />Confirmar Cancelación</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Componentes pequeños ──


function Tag({ label, color, small }) {
  return (
    <span style={{
      background: `${color}15`,
      color,
      fontSize: small ? '10px' : '11px',
      fontWeight: '600',
      padding: small ? '2px 6px' : '3px 8px',
      borderRadius: '20px',
      border: `1px solid ${color}30`
    }}>{label}</span>
  );
}

function ActionButton({ label, icon: Icon, color, textColor, onClick, fullWidth }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: `${color}18`,
        color,
        border: `1px solid ${color}35`,
        borderRadius: '10px',
        padding: '9px 14px',
        fontSize: '12px',
        fontWeight: '700',
        cursor: 'pointer',
        flex: fullWidth ? undefined : 1,
        width: fullWidth ? '100%' : undefined,
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px'
      }}
      onMouseOver={e => { e.currentTarget.style.background = color; e.currentTarget.style.color = textColor || 'white'; }}
      onMouseOut={e => { e.currentTarget.style.background = `${color}18`; e.currentTarget.style.color = color; }}
    >
      {Icon && <Icon size={15} />}
      {label}
    </button>
  );
}

function EmptyState({ icon: Icon, text }) {
  return (
    <div style={{
      textAlign: 'center', padding: '24px',
      border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: '14px'
    }}>
      {Icon && <Icon size={28} color="#334155" style={{ marginBottom: '8px' }} />}
      <p style={{ color: '#475569', fontSize: '13px', margin: 0 }}>{text}</p>
    </div>
  );
}

export default AdminPanel;
