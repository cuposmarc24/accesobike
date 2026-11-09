import { useState, useEffect } from 'react';
import BikeLoader from './BikeLoader';
import { supabase } from './lib/supabase';
import { useEventConfig } from './lib/EventConfigProvider';
import { buildAdminWhatsAppUrl, sendAdminWhatsAppMessage, sendVIPAssignmentWhatsApp } from './whatsappService';
import AdminAlert from './AdminAlert';
import AdminBikes from './AdminBikes';
import AdminSettings from './AdminSettings';
import GlowingNav from './GlowingNav';
import { MdCheck, MdClose, MdLockOpen, MdEmojiEvents, MdDelete, MdPhone, MdDownload, MdHourglassEmpty, MdCheckCircleOutline, MdStarOutline } from 'react-icons/md';
import BottomSheet from './BottomSheet';
import { Flyer } from './SessionList';
import { themeVars } from './lib/theme';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  requestNotificationPermission,
  getNotificationStatus,
  notifyNewReservation
} from './lib/pushNotifications';

// La base de datos guarda la hora en UTC sin indicar zona ("2026-11-09T15:05:00").
// Sin la "Z", el navegador la toma como hora local y queda 4 h adelantada en Venezuela.
const parseDbDate = (value) => {
  if (!value) return new Date(NaN);
  const s = String(value).replace(' ', 'T').replace(/([+-]\d{2})$/, '$1:00');
  const hasZone = /([zZ]|[+-]\d{2}:?\d{2})$/.test(s);
  return new Date(hasZone ? s : `${s}Z`);
};

const formatMontoVE = (value) => {
  if (!value) return '';
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  const [int, dec = '00'] = num.toFixed(2).split('.');
  return `${parseInt(int, 10).toLocaleString('es-VE')},${dec}`;
};

function AdminPanel({ onBack, eventId: propEventId, config: propConfig, eventData: propEventData }) {
  const { eventId: contextEventId, config: contextConfig, eventData: contextEventData, reloadConfig } = useEventConfig();

  const eventId = propEventId || contextEventId;
  const config = contextConfig || propConfig;
  // Usar eventData del contexto (siempre fresco desde BD, incluye logo base64)
  const eventData = contextEventData || propEventData;

  // Mismo patrón que SeatMap — usa config del EventConfigProvider (fuente más confiable)
  const primaryColor    = config?.theme?.primaryColor    || '#13c8ec';
  const secondaryColor  = config?.theme?.secondaryColor  || '#1a2c30';
  const backgroundColor = config?.theme?.backgroundColor || '#111f22';


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
          // Buscar el seat_number real desde Supabase (el payload Realtime no incluye JOINs)
          supabase.from('seats').select('seat_number').eq('id', row.seat_id).single()
            .then(({ data: seatData }) => {
              notifyNewReservation(row.customer_name, seatData?.seat_number ?? '?', session?.event_name || '');
            });
        }
      })
      .subscribe((status) => {
        console.log('📡 Realtime AdminPanel:', status);
      });

    return () => { supabase.removeChannel(channel); };
  }, [eventId]);

  const handleEnableNotifications = async () => {
    if (Notification.permission === 'denied') {
      showAlert('warning', 'Notificaciones bloqueadas',
        'Debes habilitarlas manualmente desde el navegador:\n\n1. Toca el ícono 🔒 o ⚙️ en la barra de direcciones\n2. Busca "Notificaciones"\n3. Cambia a "Permitir"\n4. Recarga la página'
      );
      return;
    }
    const granted = await requestNotificationPermission();
    setNotifStatus(granted ? 'granted' : Notification.permission);
  };

  const formatDateTime = (iso) => {
    if (!iso) return '';
    const d = parseDbDate(iso);
    const date = d.toLocaleDateString('es-VE');
    const hours = d.getHours();
    const mins = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours % 12 || 12;
    return `${date} · ${h12}:${mins} ${ampm}`;
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

  const showAlert = (type, title, message, onConfirm, onCancel = null, whatsappUrl = null) => {
    setAlert({
      isOpen: true, type, title, message, whatsappUrl,
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
          await fetchReservations();
          const waUrl = buildAdminWhatsAppUrl(reservation, 'confirmada', eventData, config);
          showAlert('success', '¡Confirmada!', `Reserva de ${reservation.customer_name} confirmada.`, null, null, waUrl);
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
      await fetchReservations();
      const waUrl = buildAdminWhatsAppUrl({ ...reservation, cancellationReason: reason }, 'cancelada', eventData, config);
      showAlert('success', 'Cancelada', `Reserva de ${reservation.customer_name} cancelada.`, null, null, waUrl);
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
          parseDbDate(r.created_at).toLocaleDateString('es-ES')
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

  const theme = { primaryColor, backgroundColor };

  const sessionLabelOf = (reservation) => {
    if (!reservation) return '';
    return reservation.session_id === eventId
      ? (config?.sessions?.[0] ? `${config.sessions[0].event_name} - ${formatTime(config.sessions[0].time)}` : 'Sesión única')
      : getSessionName(reservation.session_id);
  };

  const seatNum = (r) => String(r.seats?.seat_number ?? '?').padStart(2, '0');

  // ── Encabezado de sección ──
  const sectionTitle = (label, count, tone) => (
    <div className="ab-sec-head">
      <h2>{label}</h2>
      {count !== undefined && <span className="ab-count" style={tone ? { '--tone': tone } : undefined}>{count}</span>}
    </div>
  );

  // ── Fila de reserva (pendiente u ocupada) ──
  const reservationRow = (reservation, tone) => (
    <button
      type="button"
      key={reservation.id}
      className="ab-row"
      onClick={() => setSelectedReservation(reservation)}
    >
      <span className="ab-row__badge ab-display" style={tone ? { '--tone': tone } : undefined}>{seatNum(reservation)}</span>
      <span className="ab-row__main">
        <span className="ab-row__title">{reservation.customer_name}</span>
        <span className="ab-row__sub">{reservation.customer_phone} — {formatDateTime(reservation.created_at)}</span>
      </span>
      <svg className="ab-row__chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
    </button>
  );

  const emptyState = (Icon, text) => (
    <div className="ab-empty">
      {Icon && <Icon size={28} />}
      {text}
    </div>
  );

  const sessionTabs = (sessions, withCounts) => sessions.length > 1 && (
    <div className="ab-seg" role="tablist">
      {sessions.map(s => {
        const isActive = activeSessionTab === s.id;
        const count = withCounts ? withCounts(s.id) : 0;
        return (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`ab-seg__btn${isActive ? ' is-active' : ''}`}
            onClick={() => setActiveSessionTab(s.id)}
          >
            {s.event_name || s.id}
            {count > 0 && <span className="ab-seg__count">{count}</span>}
          </button>
        );
      })}
    </div>
  );

  // ── LOADING ──
  if (loading) {
    return <BikeLoader bg={backgroundColor} color={primaryColor} />;
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
        // Reservas con session_id === eventId son formato viejo: se asignan a la primera sesión
        const normalizeSessionId = (r) =>
          (r.session_id === eventId) ? (config?.sessions?.[0]?.id || activeSessionTab) : r.session_id;

        const filteredPending = pendingReservations.filter(r => normalizeSessionId(r) === activeSessionTab);
        const filteredOccupied = occupiedReservations.filter(r => normalizeSessionId(r) === activeSessionTab);

        const pendingCountBySession = (sessionId) => {
          const firstSessionId = config?.sessions?.[0]?.id;
          return pendingReservations.filter(r => ((r.session_id === eventId) ? firstSessionId : r.session_id) === sessionId).length;
        };

        const bids = auctionBids.filter(b => b.session_id === activeSessionTab);

        return (
          <>
            {sessionTabs(config?.sessions || [], pendingCountBySession)}

            <section className="ab-section">
              {sectionTitle('Por confirmar', filteredPending.length, '#f59e0b')}
              {filteredPending.length === 0
                ? emptyState(MdHourglassEmpty, 'No hay reservas por confirmar')
                : <div className="ab-list">{filteredPending.map(r => reservationRow(r, '#f59e0b'))}</div>}
            </section>

            <section className="ab-section">
              <div className="ab-sec-head">
                <h2>Confirmadas <span className="ab-count" style={{ '--tone': '#22c55e', marginLeft: 6 }}>{filteredOccupied.length}</span></h2>
                {filteredOccupied.length > 0 && (
                  <button type="button" className="ab-btn ab-btn--ghost ab-btn--sm" onClick={() => generatePDF(activeSessionTab)}>
                    <MdDownload size={17} /> Descargar PDF
                  </button>
                )}
              </div>
              {filteredOccupied.length === 0
                ? emptyState(MdCheckCircleOutline, 'Aún no hay bicis confirmadas en esta rodada')
                : <div className="ab-list">{filteredOccupied.map(r => reservationRow(r, '#22c55e'))}</div>}
            </section>

            {config?.vipFeatures?.enabled && (
              <section className="ab-section">
                {sectionTitle('Subastas VIP', bids.length, '#fbbf24')}
                {bids.length === 0 ? emptyState(MdStarOutline, 'No hay ofertas en esta rodada') : (
                  <div className="ab-list">
                    {bids.map((bid, index) => (
                      <div key={bid.id} className="ab-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
                          <strong style={{ fontSize: 15 }}>{index === 0 ? '🥇 ' : `${index + 1}. `}{bid.full_name}</strong>
                          <span className="ab-stat__value" style={{ color: '#fbbf24', fontSize: 22 }}>${bid.bid_amount}</span>
                        </div>
                        <p style={{ margin: '4px 0 12px', fontSize: 13, color: 'var(--ab-faint)' }}>
                          {bid.phone} — {parseDbDate(bid.created_at).toLocaleDateString('es-VE')}
                        </p>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button type="button" className="ab-btn ab-btn--warn ab-btn--sm" style={{ flex: 1 }} onClick={() => assignVIPSeat(bid)}><MdEmojiEvents size={17} /> Asignar VIP</button>
                          <button type="button" className="ab-btn ab-btn--danger ab-btn--sm" style={{ flex: 1 }} onClick={() => deleteBid(bid)}><MdDelete size={17} /> Eliminar</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </>
        );
      }

      default: { // estado
        const sessions = config?.sessions || [];
        const activeSession = sessions.find(s => s.id === activeSessionTab) || sessions[0];
        const flyer = activeSession?.image || eventData?.event_image;

        return (
          <>
            {sessionTabs(sessions)}

            {flyer && (
              <div style={{ marginBottom: 14 }}>
                <Flyer compact src={flyer} alt="Flyer de la rodada" />
              </div>
            )}

            {pendingReservations.length > 0 && (
              <button
                type="button"
                className="ab-row"
                style={{ marginBottom: 14, '--tone': '#f59e0b' }}
                onClick={() => setActiveNav('reservations')}
              >
                <span className="ab-row__badge ab-display">{pendingReservations.length}</span>
                <span className="ab-row__main">
                  <span className="ab-row__title">{pendingReservations.length === 1 ? 'Reserva por confirmar' : 'Reservas por confirmar'}</span>
                  <span className="ab-row__sub">Revisa los pagos y confírmalos</span>
                </span>
                <svg className="ab-row__chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
              </button>
            )}

            <AdminBikes
              eventId={eventId}
              config={config}
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
              backgroundColor={backgroundColor}
              reservations={reservations}
              activeTab={activeSessionTab}
              onTabChange={setActiveSessionTab}
              onNoteSaved={reloadConfig}
            />
          </>
        );
      }
    }
  };

  const navLabels = {
    dashboard: 'Estado',
    reservations: 'Reservas',
    settings: 'Ajustes'
  };

  // ── Panel de detalle de reserva ──
  const renderDetailSheet = () => {
    const reservation = selectedReservation;
    if (!reservation) return null;
    const isPending = reservation.status === 'reservada';
    const hasPayment = reservation.payment_method_name || reservation.payment_monto || reservation.payment_fecha;

    return (
      <BottomSheet
        key={reservation.id}
        theme={theme}
        zIndex={1500}
        ariaLabel="Detalle de la reserva"
        onClose={() => setSelectedReservation(null)}
        header={(close) => (
          <div className="ab-sheet-head">
            <div className="ab-seat-badge ab-display" aria-hidden="true">{seatNum(reservation)}</div>
            <div className="ab-sheet-head__text">
              <h2 className="ab-sheet-title">{reservation.customer_name}</h2>
              <p className="ab-sheet-sub">{sessionLabelOf(reservation)}</p>
            </div>
            <button type="button" className="ab-icon-btn" onClick={close} aria-label="Cerrar"><MdClose size={20} /></button>
          </div>
        )}
        footer={(close) => isPending ? (
          <>
            <button type="button" className="ab-btn ab-btn--danger" style={{ flex: 1 }} onClick={() => cancelReservation(reservation)}>
              <MdClose size={19} /> Cancelar
            </button>
            <button type="button" className="ab-btn ab-btn--ok" style={{ flex: 1.4 }} onClick={() => { close(); confirmReservation(reservation); }}>
              <MdCheck size={19} /> Confirmar pago
            </button>
          </>
        ) : (
          <button type="button" className="ab-btn ab-btn--warn ab-btn--block" onClick={() => { close(); enableOccupied(reservation); }}>
            <MdLockOpen size={19} /> Liberar bici
          </button>
        )}
      >
        <div className="ab-pills" style={{ marginBottom: 16 }}>
          <span className="ab-pill" style={{ '--tone': isPending ? '#f59e0b' : '#22c55e' }}>{isPending ? 'Por confirmar' : 'Confirmada'}</span>
          <span className="ab-pill">{formatDateTime(reservation.created_at)}</span>
        </div>

        <div className="ab-card" style={{ paddingTop: 6, paddingBottom: 6 }}>
          <div className="ab-kv">
            <div className="ab-kv__row">
              <span className="ab-kv__k">WhatsApp</span>
              <a className="ab-kv__v" style={{ color: 'var(--ab-primary)', textDecoration: 'none' }}
                href={`https://wa.me/${String(reservation.customer_phone || '').replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                <MdPhone size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} />{reservation.customer_phone}
              </a>
            </div>
            {hasPayment && reservation.payment_method_name && (
              <div className="ab-kv__row"><span className="ab-kv__k">Método</span><span className="ab-kv__v">{reservation.payment_method_name}</span></div>
            )}
            {hasPayment && reservation.payment_monto && (
              <div className="ab-kv__row"><span className="ab-kv__k">Monto</span><span className="ab-kv__v ab-num" style={{ color: 'var(--ab-primary)' }}>{formatMontoVE(reservation.payment_monto)}</span></div>
            )}
            {hasPayment && reservation.payment_fecha && (
              <div className="ab-kv__row"><span className="ab-kv__k">Fecha del pago</span><span className="ab-kv__v">{reservation.payment_fecha}</span></div>
            )}
            {reservation.payment_referencia && (
              <div className="ab-kv__row"><span className="ab-kv__k">Referencia</span><span className="ab-kv__v ab-num" style={{ letterSpacing: '0.08em' }}>{reservation.payment_referencia}</span></div>
            )}
          </div>
        </div>

        {reservation.payment_capture_url && (
          <div style={{ marginTop: 16 }}>
            <span className="ab-label">Comprobante</span>
            <a className="ab-proof" href={reservation.payment_capture_url} target="_blank" rel="noopener noreferrer" style={{ display: 'block' }}>
              <img src={reservation.payment_capture_url} alt="Comprobante de pago" style={{ maxHeight: 360 }} />
            </a>
          </div>
        )}
      </BottomSheet>
    );
  };

  return (
    <div className="ab-scope ab-admin" style={themeVars(theme)}>
      {/* ── Encabezado ── */}
      <header className="ab-admin-head">
        {eventData?.cycling_room_logo && (
          <img className="ab-admin-head__logo" src={eventData.cycling_room_logo} alt="" />
        )}
        <div className="ab-admin-head__text">
          <h1 className="ab-display ab-admin-head__title">{navLabels[activeNav]}</h1>
          <p className="ab-admin-head__sub">{eventData?.event_name || 'Panel del evento'}</p>
        </div>

        <button
          type="button"
          className={`ab-icon-btn${notifStatus === 'granted' ? ' ab-icon-btn--active' : notifStatus === 'denied' ? ' ab-icon-btn--danger' : ''}`}
          onClick={handleEnableNotifications}
          aria-label={notifStatus === 'granted' ? 'Notificaciones activas' : notifStatus === 'denied' ? 'Notificaciones bloqueadas' : 'Activar notificaciones'}
          title={notifStatus === 'granted' ? 'Notificaciones activas' : notifStatus === 'denied' ? 'Notificaciones bloqueadas' : 'Activar notificaciones'}
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
            {notifStatus === 'granted' && <circle cx="18" cy="6" r="4" fill="#22c55e" stroke="none" />}
            {notifStatus === 'denied' && <line x1="4" y1="4" x2="20" y2="20" />}
          </svg>
        </button>

        <button
          type="button"
          className="ab-icon-btn ab-icon-btn--danger"
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
          onClick={() => showAlert('confirm', 'Cerrar sesión', '¿Quieres salir del panel del evento?', () => onBack(), () => {})}
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </header>

      {/* ── Contenido ── */}
      <main className="ab-admin__content">
        {renderContent()}
      </main>

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

      {renderDetailSheet()}

      {/* Motivo de cancelación */}
      {cancelReasonModal && (
        <BottomSheet
          key={`cancel-${cancelReasonModal.id}`}
          theme={theme}
          zIndex={1600}
          ariaLabel="Motivo de cancelación"
          onClose={() => { setCancelReasonModal(null); setCancelReason(''); }}
          header={
            <div>
              <h2 className="ab-sheet-title">Cancelar reserva</h2>
              <p className="ab-sheet-sub">Bici {seatNum(cancelReasonModal)} — {cancelReasonModal.customer_name}</p>
            </div>
          }
          footer={(close) => (
            <>
              <button type="button" className="ab-btn ab-btn--ghost" style={{ flex: 1 }} onClick={close}>Volver</button>
              <button
                type="button"
                className="ab-btn"
                style={{ flex: 1.6, background: 'var(--ab-danger)', color: '#fff' }}
                onClick={() => {
                  executeCancelReservation(cancelReasonModal, cancelReason);
                  setCancelReasonModal(null);
                  setCancelReason('');
                }}
              >
                <MdClose size={19} /> Cancelar reserva
              </button>
            </>
          )}
        >
          <label className="ab-label" htmlFor="ab-cancel-reason">Motivo (se envía al cliente por WhatsApp)</label>
          <textarea
            id="ab-cancel-reason"
            className="ab-textarea"
            value={cancelReason}
            onChange={e => setCancelReason(e.target.value)}
            placeholder="Ej: pago no recibido"
            rows={3}
          />
        </BottomSheet>
      )}

      <AdminAlert
        isOpen={alert.isOpen}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onConfirm={alert.onConfirm}
        onCancel={alert.onCancel}
        whatsappUrl={alert.whatsappUrl}
        theme={theme}
      />
    </div>
  );
}

export default AdminPanel;
