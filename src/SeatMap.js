import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { useEventConfig } from './lib/EventConfigProvider';
import ReservationModal from './ReservationModal';
import { sendWhatsAppMessage } from './whatsappService';
import CustomAlert from './CustomAlert';
import Footer from './Footer';
import AuctionModal from './AuctionModal';
import { sendAuctionWhatsAppMessage } from './auctionService';
import { MdOutlineDirectionsBike } from "react-icons/md"; // Nuevo import icon

function SeatMap({ rodada, onBack, session }) {
  const { eventId: contextEventId, getSessionId, getSession, config } = useEventConfig();

  // Determine effective session
  const isEventObject = typeof rodada === 'object' && rodada !== null;
  const eventId = isEventObject ? rodada.id : contextEventId;
  const sessionId = isEventObject ? rodada.id : getSessionId(rodada);

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

  useEffect(() => {
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
      const { error } = await supabase
        .from('reservations')
        .insert([{
          event_id: eventId,
          seat_id: selectedSeat.id,
          session_id: sessionId,
          customer_name: `${formData.nombre} ${formData.apellido}`,
          customer_phone: formData.telefono,
          status: 'reservada'
        }]);

      if (error) throw error;

      setShowModal(false);
      setPendingReservation({ formData, seat: selectedSeat });
      setShowCustomAlert(true);

      // Removed window.location.reload() here to allow CustomAlert to be seen and handled
    } catch (error) {
      alert('Error al realizar la reserva');
    }
  };

  const primaryColor = config?.theme?.primaryColor || '#13c8ec';
  const secondaryColor = config?.theme?.secondaryColor || '#1a2c30';
  const backgroundColor = config?.theme?.backgroundColor || '#111f22'; // Use config background or default

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
    return (
      <div style={{
        background: backgroundColor,
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{ width: '60px', height: '60px' }}>
          {/* Loader using primaryColor */}
          <svg fill={primaryColor} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <rect x="1" y="1" width="7.33" height="7.33"><animate id="spinner_oJFS" begin="0;spinner_5T1J.end+0.2s" attributeName="x" dur="0.6s" values="1;4;1" /><animate begin="0;spinner_5T1J.end+0.2s" attributeName="y" dur="0.6s" values="1;4;1" /><animate begin="0;spinner_5T1J.end+0.2s" attributeName="width" dur="0.6s" values="7.33;1.33;7.33" /><animate begin="0;spinner_5T1J.end+0.2s" attributeName="height" dur="0.6s" values="7.33;1.33;7.33" /></rect><rect x="8.33" y="1" width="7.33" height="7.33"><animate begin="spinner_oJFS.begin+0.1s" attributeName="x" dur="0.6s" values="8.33;11.33;8.33" /><animate begin="spinner_oJFS.begin+0.1s" attributeName="y" dur="0.6s" values="1;4;1" /><animate begin="spinner_oJFS.begin+0.1s" attributeName="width" dur="0.6s" values="7.33;1.33;7.33" /><animate begin="spinner_oJFS.begin+0.1s" attributeName="height" dur="0.6s" values="7.33;1.33;7.33" /></rect><rect x="1" y="8.33" width="7.33" height="7.33"><animate begin="spinner_oJFS.begin+0.1s" attributeName="x" dur="0.6s" values="1;4;1" /><animate begin="spinner_oJFS.begin+0.1s" attributeName="y" dur="0.6s" values="8.33;11.33;8.33" /><animate begin="spinner_oJFS.begin+0.1s" attributeName="width" dur="0.6s" values="7.33;1.33;7.33" /><animate begin="spinner_oJFS.begin+0.1s" attributeName="height" dur="0.6s" values="7.33;1.33;7.33" /></rect><rect x="15.66" y="1" width="7.33" height="7.33"><animate begin="spinner_oJFS.begin+0.2s" attributeName="x" dur="0.6s" values="15.66;18.66;15.66" /><animate begin="spinner_oJFS.begin+0.2s" attributeName="y" dur="0.6s" values="1;4;1" /><animate begin="spinner_oJFS.begin+0.2s" attributeName="width" dur="0.6s" values="7.33;1.33;7.33" /><animate begin="spinner_oJFS.begin+0.2s" attributeName="height" dur="0.6s" values="7.33;1.33;7.33" /></rect><rect x="8.33" y="8.33" width="7.33" height="7.33"><animate begin="spinner_oJFS.begin+0.2s" attributeName="x" dur="0.6s" values="8.33;11.33;8.33" /><animate begin="spinner_oJFS.begin+0.2s" attributeName="y" dur="0.6s" values="8.33;11.33;8.33" /><animate begin="spinner_oJFS.begin+0.2s" attributeName="width" dur="0.6s" values="7.33;1.33;7.33" /><animate begin="spinner_oJFS.begin+0.2s" attributeName="height" dur="0.6s" values="7.33;1.33;7.33" /></rect><rect x="1" y="15.66" width="7.33" height="7.33"><animate begin="spinner_oJFS.begin+0.2s" attributeName="x" dur="0.6s" values="1;4;1" /><animate begin="spinner_oJFS.begin+0.2s" attributeName="y" dur="0.6s" values="15.66;18.66;15.66" /><animate begin="spinner_oJFS.begin+0.2s" attributeName="width" dur="0.6s" values="7.33;1.33;7.33" /><animate begin="spinner_oJFS.begin+0.2s" attributeName="height" dur="0.6s" values="7.33;1.33;7.33" /></rect><rect x="15.66" y="8.33" width="7.33" height="7.33"><animate begin="spinner_oJFS.begin+0.3s" attributeName="x" dur="0.6s" values="15.66;18.66;15.66" /><animate begin="spinner_oJFS.begin+0.3s" attributeName="y" dur="0.6s" values="8.33;11.33;8.33" /><animate begin="spinner_oJFS.begin+0.3s" attributeName="width" dur="0.6s" values="7.33;1.33;7.33" /><animate begin="spinner_oJFS.begin+0.3s" attributeName="height" dur="0.6s" values="7.33;1.33;7.33" /></rect><rect x="8.33" y="15.66" width="7.33" height="7.33"><animate begin="spinner_oJFS.begin+0.3s" attributeName="x" dur="0.6s" values="8.33;11.33;8.33" /><animate begin="spinner_oJFS.begin+0.3s" attributeName="y" dur="0.6s" values="15.66;18.66;15.66" /><animate begin="spinner_oJFS.begin+0.3s" attributeName="width" dur="0.6s" values="7.33;1.33;7.33" /><animate begin="spinner_oJFS.begin+0.3s" attributeName="height" dur="0.6s" values="7.33;1.33;7.33" /></rect><rect x="15.66" y="15.66" width="7.33" height="7.33"><animate id="spinner_5T1J" begin="spinner_oJFS.begin+0.4s" attributeName="x" dur="0.6s" values="15.66;18.66;15.66" /><animate begin="spinner_oJFS.begin+0.4s" attributeName="y" dur="0.6s" values="15.66;18.66;15.66" /><animate begin="spinner_oJFS.begin+0.4s" attributeName="width" dur="0.6s" values="7.33;1.33;7.33" /><animate begin="spinner_oJFS.begin+0.4s" attributeName="height" dur="0.6s" values="7.33;1.33;7.33" /></rect>
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: backgroundColor,
      minHeight: '100vh',
      width: '100%',
      fontFamily: 'Inter, sans-serif',
      color: '#fff',
      position: 'relative',
      paddingBottom: selectedSeat ? '180px' : '40px', // Aumentar drásticamente si hay selección
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
              {Object.entries(rowsDict).map(([rowNum, rowSeats]) => {
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
          left: '20px',
          right: '20px',
          maxWidth: '360px', // Reduced width
          margin: '0 auto',
          background: secondaryColor,
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '20px', // Slightly smaller radius
          padding: '16px', // Reduced padding
          boxShadow: '0 -8px 30px rgba(0,0,0,0.6)', // Slightly smaller shadow
          zIndex: 1000,
          animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          <style>{`@keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{
                width: '48px', // Smaller icon container
                height: '48px',
                borderRadius: '12px',
                background: `${primaryColor}1A`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: primaryColor
              }}>
                <MdOutlineDirectionsBike size={24} /> {/* Smaller icon */}
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', margin: '0 0 2px 0', color: '#fff' }}> {/* Smaller title */}
                  Bici #{selectedSeat.seat_number}
                </h3>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}> {/* Smaller subtitle */}
                  {currentSession ? currentSession.event_name : 'Clase de Spinning'}
                </p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>Precio</div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#fff' }}>
                {currentSession && currentSession.price ? currentSession.price : 'Consultar'}
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowModal(true)}
            style={{
              width: '100%',
              background: primaryColor,
              color: backgroundColor,
              border: 'none',
              borderRadius: '12px', // Smaller radius
              padding: '12px', // Reduces padding
              fontSize: '14px', // Smaller font
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: `0 4px 15px ${primaryColor}4D`
            }}
          >
            Reservar Ahora
          </button>
        </div>
      )}

      {/* Modales (se mantienen igual lógica pero ocultos/mostrados) */}
      {showModal && (
        <ReservationModal
          seat={selectedSeat}
          onClose={() => setShowModal(false)}
          onConfirm={handleReservation}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          backgroundColor={backgroundColor}
        />
      )}
      <CustomAlert isOpen={showCustomAlert} onAccept={() => {
        if (pendingReservation) {
          sendWhatsAppMessage(pendingReservation.formData, pendingReservation.seat, rodada, config);
          setPendingReservation(null);
        }
        setShowCustomAlert(false);
        // Recargar página para actualizar el estado de los asientos
        window.location.reload();
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