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
import { Flyer } from './SessionList';
import { themeVars } from './lib/theme';

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
    <div className="ab-scope" style={{
      ...themeVars(config?.theme),
      background: backgroundColor,
      minHeight: '100vh',
      width: '100%',
      position: 'relative',
      paddingBottom: selectedSeat ? '300px' : '40px'
    }}>
      {/* 1. Cabecera */}
      <header className="ab-topbar">
        <button type="button" className="ab-icon-btn" onClick={onBack} aria-label="Volver a las rodadas">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
        </button>
        <div className="ab-topbar__title">
          <h1 className="ab-display">{currentSession?.event_name || currentSession?.name || rodada?.event_name || 'Rodada'}</h1>
          <p>{currentSession?.cycling_room || rodada?.cycling_room || 'Elige tu bici'}</p>
        </div>
        <div className="ab-topbar__spacer" />
      </header>

      {/* Flyer completo, sin recorte */}
      <div style={{ padding: '18px 16px 0', maxWidth: 420, margin: '0 auto' }}>
        <Flyer compact src={session?.image || currentSession?.event_image || rodada?.event_image} alt="Flyer de la rodada" />
      </div>

      {/* 2. Leyenda */}
      <div className="ab-legend">
        <span className="ab-chip"><span className="ab-chip__dot" style={{ background: 'var(--ab-surface-2)', boxShadow: 'inset 0 0 0 1px var(--ab-line-strong)' }} />Disponible</span>
        <span className="ab-chip"><span className="ab-chip__dot" style={{ background: secondaryColor }} />Ocupada</span>
        <span className="ab-chip"><span className="ab-chip__dot" style={{ background: 'var(--ab-primary)' }} />Tu bici</span>
        {(() => {
          const validRowPrices = (currentSession?.rowPrices || []).map(p => parseFloat(p)).filter(p => !isNaN(p) && p > 0);
          if (validRowPrices.length === 0) return null;
          const minPrice = Math.min(...validRowPrices);
          const maxPrice = Math.max(...validRowPrices);
          return (
            <span className="ab-chip" style={{ color: 'var(--ab-primary)', paddingLeft: 12 }}>
              Precio por fila: {minPrice !== maxPrice ? `$${minPrice} – $${maxPrice}` : `$${minPrice}`}
            </span>
          );
        })()}
      </div>
      <div style={{ height: 24 }} />

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

              {/* Instructor / Tarima — bicis de instructores (solo visuales) */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                margin: '0 20px'
              }}>
                {(() => {
                  const instructors = (currentSession?.instructors || [])
                    .filter(inst => inst?.name && inst.name.trim())
                    .slice(0, 6);
                  if (instructors.length === 0) return null;
                  return (
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'nowrap', justifyContent: 'center' }}>
                      {instructors.map((inst, i) => (
                        <div
                          key={i}
                          title={inst.name}
                          style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '50%',
                            background: `${primaryColor}18`,
                            border: `1.5px solid ${primaryColor}60`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: `0 0 10px ${primaryColor}25`,
                            pointerEvents: 'none'
                          }}
                        >
                          <MdOutlineDirectionsBike size={16} color={primaryColor} />
                        </div>
                      ))}
                    </div>
                  );
                })()}
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
                  Tarima
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

      {/* 5. Tarjeta de la bici seleccionada */}
      {selectedSeat && (() => {
        const num = String(selectedSeat.seat_number).padStart(2, '0');
        // Precio por fila lleva $; el precio general se muestra tal cual se escribió
        const priceLabel = rowPrice ? `$${rowPrice}` : (currentSession?.price || null);
        return (
          <div className="ab-pick" key={selectedSeat.id}>
            <div className="ab-pick__row">
              <div className="ab-pick__seat ab-display" aria-hidden="true">{num}</div>
              <div className="ab-pick__info">
                <span className="ab-pick__label">Tu bici</span>
                <span className="ab-pick__name">Bici {num}</span>
              </div>
              {priceLabel && (
                <div className="ab-pick__price">
                  <span className="ab-pick__label">Precio</span>
                  <span className="ab-stat__value">{priceLabel}</span>
                </div>
              )}
              <button type="button" className="ab-icon-btn" onClick={() => setSelectedSeat(null)} aria-label="Quitar selección" style={{ width: 36, height: 36 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {rowNote && (
              <div className="ab-pick__note">
                <span aria-hidden="true">🎁</span>
                <div>
                  <strong>Incluido en tu reserva</strong>
                  {rowNote}
                </div>
              </div>
            )}

            <button type="button" className="ab-btn ab-btn--primary ab-btn--block" onClick={() => setShowModal(true)}>
              Reservar bici {num}
            </button>
          </div>
        );
      })()}

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