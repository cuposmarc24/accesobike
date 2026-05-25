import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { useEventConfig } from './lib/EventConfigProvider';
import ReservationModal from './ReservationModal';
import { sendWhatsAppMessage } from './whatsappService';
import CustomAlert from './CustomAlert';
import Footer from './Footer';
import AuctionModal from './AuctionModal';
import { sendAuctionWhatsAppMessage } from './auctionService';
import { MdOutlineDirectionsBike } from "react-icons/md";
import BikeLoader from './BikeLoader';

function SeatMap({ rodada, onBack, session }) {
  const { eventId: contextEventId, getSessionId, getSession, config } = useEventConfig();

  // Determine effective session
  const isEventObject = typeof rodada === 'object' && rodada !== null;
  const eventId = isEventObject ? rodada.id : contextEventId;
  // session prop tiene el id correcto de la sesión (ej: "session1", "session2")
  // Si no llega session, usar rodada.id como fallback (formato legacy)
  const sessionId = session?.id || (isEventObject ? rodada.id : getSessionId(rodada));

  // PRIORIDAD: 
  // 1. Prop 'session' explícita (viene de Home.js)
  // 2. Si 'rodada' es objeto Y parece sesión (tiene seatCount), usarlo.
  // 3. Buscar en config usando ID.
  const configSession = getSession(sessionId);

  const currentSession = session || (isEventObject && rodada.seatCount ? rodada : null) || configSession;

  console.log('🔍 SeatMap Debug:', {
    rodada,
    sessionProp: session,
    configSession,
    FINAL_currentSession: currentSession,
    price: currentSession?.price
  });

  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [showAuctionModal, setShowAuctionModal] = useState(false);
  const [showCustomAlert, setShowCustomAlert] = useState(false);
  const [pendingReservation, setPendingReservation] = useState(null);
  const [auctionBids, setAuctionBids] = useState([]);

  const fetchSeats = async () => {
    if (!eventId || !sessionId) return;

    try {
      const { data: seatsData, error: seatsError } = await supabase
        .from('seats')
        .select('*')
        .eq('event_id', eventId)
        .order('row_number')
        .order('seat_number');

      if (seatsError) throw seatsError;

      const { data: reservationsData } = await supabase
        .from('reservations')
        .select('*')
        .eq('event_id', eventId)
        .eq('session_id', sessionId);

      const { data: auctionData } = await supabase
        .from('auction_bids')
        .select('*')
        .eq('event_id', eventId)
        .eq('session_id', sessionId)
        .order('bid_amount', { ascending: false });

      setAuctionBids(auctionData || []);

      const seatsWithStatus = seatsData.map(seat => {
        const reservation = reservationsData?.find(res => res.seat_id === seat.id);
        return {
          ...seat,
          status: reservation ? reservation.status : 'disponible',
          isReserved: !!reservation
        };
      });

      setSeats(seatsWithStatus);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeats();
  }, [eventId, sessionId]);

  const handleSeatClick = (seat) => {
    // Si ya está seleccionado, desseleccionar
    if (selectedSeat && selectedSeat.id === seat.id) {
      setSelectedSeat(null);
      return;
    }

    if (seat.is_selectable && !seat.isReserved && seat.status !== 'reservada' && seat.status !== 'ocupada') {
      setSelectedSeat(seat);
    }
  };

  const handleReservation = async (formData) => {
    if (!eventId || !sessionId || !selectedSeat) return;

    try {
      // 1. Subir comprobante si existe
      let captureUrl = null;
      if (formData.captureFile) {
        const ext = formData.captureFile.name.split('.').pop() || 'jpg';
        const path = `reservations/${eventId}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('comprobantes')
          .upload(path, formData.captureFile, { cacheControl: '3600', upsert: false });
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('comprobantes').getPublicUrl(path);
          captureUrl = urlData?.publicUrl || null;
        } else {
          console.warn('Error subiendo comprobante:', uploadError.message);
        }
      }

      // 2. Insertar reserva con datos del pago
      const { error } = await supabase
        .from('reservations')
        .insert([{
          event_id: eventId,
          seat_id: selectedSeat.id,
          session_id: sessionId,
          customer_name: `${formData.nombre} ${formData.apellido}`,
          customer_phone: formData.telefono,
          status: 'reservada',
          payment_method_name: formData.paymentMethod?.name || null,
          payment_monto: formData.paymentData?.monto || null,
          payment_fecha: formData.paymentData?.fecha || null,
          payment_referencia: formData.paymentData?.referencia || null,
          payment_capture_url: captureUrl
        }]);

      if (error) throw error;

      setShowModal(false);
      setPendingReservation({ formData, seat: selectedSeat });
      setShowCustomAlert(true);
    } catch (error) {
      console.error('Error al reservar:', error);
      alert('Error al realizar la reserva');
    }
  };

  const primaryColor = config?.theme?.primaryColor || '#13c8ec';
  const secondaryColor = config?.theme?.secondaryColor || '#1a2c30';
  const backgroundColor = config?.theme?.backgroundColor || '#111f22';

  // Precio y nota por fila según row_number de la bici seleccionada
  const getRowData = (seat) => {
    if (!seat) return { price: null, note: null };
    const rowIndex = (seat.row_number || 1) - 1;
    const rowPrices = currentSession?.rowPrices || [];
    const rowNotes = currentSession?.rowNotes || [];
    const rp = rowPrices[rowIndex];
    const rn = rowNotes[rowIndex];
    return {
      price: rp !== '' && rp != null ? String(rp) : null,
      note: rn || null
    };
  };

  const { price: rowPrice, note: rowNote } = getRowData(selectedSeat);
  const selectedSeatPrice = rowPrice || (currentSession?.price || null);

  // Helper para renderizar iconos de bici en la grilla
  const renderSeat = (seat) => {
    const isSelected = selectedSeat?.id === seat.id;
    const isOccupied = seat.status === 'ocupada' || seat.status === 'reservada';

    // Colores para el icono
    const iconColor = isSelected ? backgroundColor : (isOccupied ? '#424242' : '#94a3b8');

    return (
      <div
        key={seat.id}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          cursor: isOccupied ? 'not-allowed' : 'pointer',
          position: 'relative'
        }}
        onClick={() => handleSeatClick(seat)}
      >
        {/* Circle Container */}
        <div style={{
          width: '34px',
          height: '34px',
          borderRadius: '50%',
          background: isSelected ? primaryColor : (isOccupied ? secondaryColor : 'rgba(255,255,255,0.05)'),
          border: isOccupied ? '1px solid transparent' : (isSelected ? 'none' : '1px solid rgba(255,255,255,0.1)'),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isSelected ? `0 0 16px ${primaryColor}66` : 'none',
          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          transform: isSelected ? 'scale(1.1)' : 'scale(1)'
        }}>
          <MdOutlineDirectionsBike
            size={18}
            color={iconColor}
          />

          {/* Checkmark Badge for Selected */}
          {isSelected && (
            <div style={{
              position: 'absolute',
              top: -2,
              right: -2,
              width: '16px',
              height: '16px',
              background: '#fff',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={primaryColor} strokeWidth="4">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
          )}
        </div>

        {/* Seat Number */}
        <span style={{
          fontSize: '10px',
          color: isSelected ? primaryColor : (isOccupied ? '#424242' : '#64748b'),
          fontWeight: isSelected ? '700' : '500'
        }}>
          {seat.seat_number < 10 ? `0${seat.seat_number}` : seat.seat_number}
        </span>
      </div>
    );
  };

  if (loading) {
    return <BikeLoader bg={backgroundColor} color={primaryColor} />;
  }

  return (
    <div style={{
      background: backgroundColor,
      minHeight: '100vh',
      width: '100%',
      fontFamily: 'Inter, sans-serif',
      color: '#fff',
      position: 'relative',
      paddingBottom: selectedSeat ? '280px' : '40px',
      boxSizing: 'border-box'
    }}>
      {/* 1. Header */}
      <div style={{
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div onClick={onBack} style={{ cursor: 'pointer', padding: '8px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
        </div>

        {/* Updated Header Content */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              overflow: 'hidden',
              background: secondaryColor,
              border: `2px solid ${primaryColor}`
            }}>
              {currentSession?.cycling_room_logo || rodada?.cycling_room_logo ? (
                <img
                  src={currentSession?.cycling_room_logo || rodada?.cycling_room_logo}
                  alt="Room Logo"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🚲</div>
              )}
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: '800', margin: 0, letterSpacing: '0.5px' }}>
              {currentSession?.cycling_room || rodada?.cycling_room || 'Sala Principal'}
            </h1>
          </div>
        </div>

        <div style={{ padding: '8px', opacity: 0 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>
        </div>
      </div>

      {/* Event Flyer Card */}
      <div style={{ padding: '20px 20px 0 20px', display: 'flex', justifyContent: 'center' }}>
        <div style={{
          width: '100%',
          maxWidth: '300px',
          height: '160px',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          border: '1px solid rgba(255,255,255,0.1)',
          position: 'relative'
        }}>
          <img
            src={session?.image || currentSession?.event_image || rodada?.event_image || 'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=1470&auto=format&fit=crop'}
            alt="Event Flyer"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      </div>

      {/* Aviso de precios por fila — solo si hay rowPrices configurados */}
      {(() => {
        const validRowPrices = (currentSession?.rowPrices || []).map(p => parseFloat(p)).filter(p => !isNaN(p) && p > 0);
        if (validRowPrices.length === 0) return null;
        const minPrice = Math.min(...validRowPrices);
        const maxPrice = Math.max(...validRowPrices);
        const hasRange = minPrice !== maxPrice;
        return (
          <div style={{ margin: '14px 20px 0', display: 'flex', justifyContent: 'center' }}>
          <div style={{
            padding: '7px 14px',
            borderRadius: '20px',
            background: `${primaryColor}12`,
            border: `1px solid ${primaryColor}25`,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '7px'
          }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={primaryColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontFamily: 'Inter, sans-serif' }}>
              Precio varía por fila:
            </span>
            <span style={{ fontSize: '12px', fontWeight: '800', color: primaryColor, fontFamily: 'Inter, sans-serif' }}>
              {hasRange ? `$${minPrice} – $${maxPrice}` : `$${minPrice}`}
            </span>
          </div>
          </div>
        );
      })()}

      {/* 2. Legend */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '24px',
        padding: '20px 0',
        fontSize: '12px',
        fontWeight: '600',
        color: '#94a3b8',
        textTransform: 'uppercase'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MdOutlineDirectionsBike size={18} color="#94a3b8" />
          <span>Disponible</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MdOutlineDirectionsBike size={18} color="#424242" />
          <span>Ocupado</span>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: primaryColor, fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>
          <MdOutlineDirectionsBike size={18} color={primaryColor} />
          <span>Tu Selección</span>
        </div>
      </div>

      {/* 4. Stage & Monitor Row Area */}
      {(() => {
        // Prepare rows logic
        const rowsDict = seats.reduce((rows, seat) => {
          const rowNum = seat.row_number;
          if (!rows[rowNum]) rows[rowNum] = [];
          rows[rowNum].push(seat);
          return rows;
        }, {});

        const row1Seats = rowsDict['1'] || [];
        // Determine splitting for Row 1
        const mid = Math.ceil(row1Seats.length / 2);
        const leftMonitors = row1Seats.slice(0, mid);
        const rightMonitors = row1Seats.slice(mid);

        return (
          <>
            {/* Stage Area with Monitors */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '20px',
              marginBottom: '40px',
              marginTop: '20px'
            }}>
              {/* Left Monitors */}
              {leftMonitors.length > 0 && (
                <div style={{ display: 'flex', gap: '6px' }}>
                  {leftMonitors.map(seat => renderSeat(seat))}
                </div>
              )}

              {/* Instructor / Tarima Label */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                margin: '0 20px'
              }}>
                <div style={{
                  height: '1px',
                  background: `linear-gradient(90deg, transparent, ${primaryColor}, transparent)`,
                  opacity: 0.5,
                  width: '100px', // Fixed width for cleaner look
                  marginBottom: '12px'
                }} />
                <span style={{
                  fontSize: '12px',
                  letterSpacing: '2px',
                  color: '#64748b',
                  textTransform: 'uppercase',
                  fontWeight: '600',
                  textAlign: 'center'
                }}>
                  Instructor<br />Tarima
                </span>
              </div>

              {/* Right Monitors */}
              {rightMonitors.length > 0 && (
                <div style={{ display: 'flex', gap: '6px' }}>
                  {rightMonitors.map(seat => renderSeat(seat))}
                </div>
              )}
            </div>

            {/* Remaining Rows Grid */}
            <div style={{
              padding: '0 20px',
              maxWidth: '500px',
              margin: '0 auto'
            }}>
              {Object.entries(rowsDict).sort((a, b) => Number(a[0]) - Number(b[0])).map(([rowNum, rowSeats]) => {
                if (rowNum === '1') return null; // Skip Row 1 as it's already rendered

                return (
                  <div
                    key={rowNum}
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      gap: '6px',
                      marginBottom: '16px'
                    }}
                  >
                    {rowSeats.map(seat => renderSeat(seat))}
                  </div>
                );
              })}
            </div>
          </>
        );
      })()}

      {/* 5. Bottom Floating Card (Validation/Action) */}
      {selectedSeat && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '16px',
          right: '16px',
          maxWidth: '380px',
          margin: '0 auto',
          background: backgroundColor,
          backdropFilter: 'blur(20px)',
          border: `1px solid ${primaryColor}30`,
          borderRadius: '24px',
          padding: '20px',
          boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px ${primaryColor}15, 0 -4px 24px ${primaryColor}10`,
          zIndex: 1000,
          animation: 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          <style>{`@keyframes slideUp { from { transform: translateY(110%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>

          {/* Fila superior: info bici + botón X */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            {/* Ícono */}
            <div style={{
              width: '48px', height: '48px', borderRadius: '14px',
              background: `${primaryColor}18`,
              border: `1.5px solid ${primaryColor}35`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: primaryColor,
              flexShrink: 0
            }}>
              <MdOutlineDirectionsBike size={24} />
            </div>

            {/* Nombre y sesión */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '17px', fontWeight: '800', color: '#f1f5f9', fontFamily: "'Inter', sans-serif", lineHeight: 1.2 }}>
                Bici #{selectedSeat.seat_number < 10 ? `0${selectedSeat.seat_number}` : selectedSeat.seat_number}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px', fontFamily: "'Inter', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentSession ? currentSession.event_name : 'Clase de Spinning'}
              </div>
            </div>

            {/* Botón cerrar */}
            <button
              onClick={() => setSelectedSeat(null)}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#94a3b8',
                padding: 0,
                flexShrink: 0,
                transition: 'all 0.2s'
              }}
              onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; e.currentTarget.style.color = '#fff'; }}
              onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#94a3b8'; }}
              title="Cancelar selección"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Divider con precio */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: `${primaryColor}0d`,
            border: `1px solid ${primaryColor}20`,
            borderRadius: '12px',
            padding: '10px 14px',
            marginBottom: rowNote ? '10px' : '14px'
          }}>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: "'Inter', sans-serif" }}>
              Precio
            </span>
            <span style={{ fontSize: '18px', fontWeight: '900', color: primaryColor, fontFamily: "'Inter', sans-serif" }}>
              {selectedSeatPrice ? `$${selectedSeatPrice}` : 'Consultar'}
            </span>
          </div>

          {/* Nota de fila */}
          {rowNote && (
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px',
              padding: '9px 12px',
              marginBottom: '14px'
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '1px' }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span style={{ fontSize: '12px', color: '#94a3b8', fontFamily: "'Inter', sans-serif", lineHeight: 1.5 }}>
                {rowNote}
              </span>
            </div>
          )}

          {/* Botón reservar */}
          <button
            onClick={() => setShowModal(true)}
            style={{
              width: '100%',
              background: 'transparent',
              color: primaryColor,
              border: `1.5px solid ${primaryColor}`,
              borderRadius: '14px',
              padding: '14px',
              fontSize: '14px',
              fontWeight: '800',
              cursor: 'pointer',
              fontFamily: "'Inter', sans-serif",
              letterSpacing: '0.03em',
              transition: 'background 0.2s'
            }}
            onMouseOver={e => { e.currentTarget.style.background = `${primaryColor}15`; }}
            onMouseOut={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            Reservar Ahora
          </button>
        </div>
      )}

      {/* Modales (se mantienen igual lógica pero ocultos/mostrados) */}
      {showModal && (
        <ReservationModal
          seat={selectedSeat}
          rodada={rodada}
          session={currentSession}
          seatPrice={selectedSeatPrice}
          onClose={() => setShowModal(false)}
          onConfirm={handleReservation}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          backgroundColor={backgroundColor}
          eventId={eventId}
        />
      )}
      <CustomAlert isOpen={showCustomAlert} onAccept={() => {
        if (pendingReservation) {
          sendWhatsAppMessage(pendingReservation.formData, pendingReservation.seat, rodada, config);
          setPendingReservation(null);
        }
        setShowCustomAlert(false);
        setSelectedSeat(null);
        // Recargar datos de asientos sin recargar la página
        fetchSeats();
      }}
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
        backgroundColor={backgroundColor}
      />

      {showAuctionModal && (
        <AuctionModal
          isOpen={showAuctionModal}
          rodada={rodada}
          onClose={() => setShowAuctionModal(false)}
          onSubmitBid={() => { }}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          backgroundColor={backgroundColor}
        />
      )}

    </div>
  );
}

export default SeatMap;