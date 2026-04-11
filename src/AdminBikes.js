import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { MdOutlineDirectionsBike } from 'react-icons/md';

function AdminBikes({ eventId, config, primaryColor, secondaryColor, backgroundColor, reservations: externalReservations }) {
  const [seats, setSeats] = useState([]);
  const [reservations, setReservations] = useState(externalReservations || []);
  const [loading, setLoading] = useState(!externalReservations);
  const [activeTab, setActiveTab] = useState(config?.sessions?.[0]?.id || '');
  const [selectedSeat, setSelectedSeat] = useState(null);

  const sessions = config?.sessions || [];

  useEffect(() => {
    if (!eventId) return;
    fetchSeats();
    if (!externalReservations) fetchReservations();
  }, [eventId]);

  // Sync cuando el padre actualiza las reservas
  useEffect(() => {
    if (externalReservations) setReservations(externalReservations);
  }, [externalReservations]);

  // Realtime propio — actualiza el mapa instantáneamente
  useEffect(() => {
    if (!eventId) return;
    const channel = supabase
      .channel(`admin-bikes-${eventId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations', filter: `event_id=eq.${eventId}` },
        () => fetchReservations()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [eventId]);

  const fetchSeats = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('seats').select('*').eq('event_id', eventId)
        .order('row_number').order('seat_number');
      setSeats(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchReservations = async () => {
    try {
      const { data } = await supabase.from('reservations').select('*').eq('event_id', eventId);
      setReservations(data || []);
    } catch (e) { console.error(e); }
  };

  const getSeatStatus = (seat) => {
    const hasOld = reservations.some(r => r.session_id === eventId);
    const res = hasOld
      ? reservations.find(r => r.seat_id === seat.id)
      : reservations.find(r => r.seat_id === seat.id && r.session_id === activeTab);
    return res ? res.status : 'disponible';
  };

  const getSeatReservation = (seat) => {
    const hasOld = reservations.some(r => r.session_id === eventId);
    return hasOld
      ? reservations.find(r => r.seat_id === seat.id) || null
      : reservations.find(r => r.seat_id === seat.id && r.session_id === activeTab) || null;
  };

  const seatsByRow = seats.reduce((acc, seat) => {
    const row = seat.row_number;
    if (!acc[row]) acc[row] = [];
    acc[row].push(seat);
    return acc;
  }, {});

  // Detecta si hay reservas con formato viejo (session_id == event_id)
  const hasOldFormat = reservations.some(r => r.session_id === eventId);
  const sessionReservations = hasOldFormat
    ? reservations
    : reservations.filter(r => r.session_id === activeTab);

  const totalSelectable = seats.filter(s => s.is_selectable).length;
  const occupiedCount = sessionReservations.filter(r => r.status === 'ocupada').length;
  const pendingCount = sessionReservations.filter(r => r.status === 'reservada').length;
  const availableCount = totalSelectable - occupiedCount - pendingCount;

  const bikeColor = (status, isSelectable) => {
    if (!isSelectable) return '#1e2a2e';
    if (status === 'ocupada') return '#ef4444';
    if (status === 'reservada') return '#fbbf24';
    return '#4ade80';
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '40px', color: '#4a5568', fontSize: '13px' }}>
      Cargando mapa...
    </div>
  );

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* Tabs de sesión — solo si hay más de una */}
      {sessions.length > 1 && (
        <div style={{
          display: 'flex', gap: '4px', marginBottom: '14px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '10px', padding: '4px', overflowX: 'auto'
        }}>
          {sessions.map(s => (
            <button
              key={s.id}
              onClick={() => { setActiveTab(s.id); setSelectedSeat(null); }}
              style={{
                flex: 1, minWidth: '90px', padding: '8px 10px',
                borderRadius: '8px', border: 'none', fontSize: '12px',
                fontWeight: activeTab === s.id ? '700' : '500',
                cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s',
                background: activeTab === s.id ? `${primaryColor}22` : 'transparent',
                color: activeTab === s.id ? primaryColor : '#4a5568',
                outline: activeTab === s.id ? `1px solid ${primaryColor}40` : '1px solid transparent'
              }}
            >
              {s.event_name || s.id}
            </button>
          ))}
        </div>
      )}

      {/* Stats compactas */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
        {[
          { label: 'Disp.', count: availableCount, color: '#4ade80' },
          { label: 'Pend.', count: pendingCount, color: '#fbbf24' },
          { label: 'Ocup.', count: occupiedCount, color: '#ef4444' }
        ].map(s => (
          <div key={s.label} style={{
            flex: 1, textAlign: 'center', padding: '8px 4px',
            borderRadius: '8px',
            border: `1px solid ${s.color}25`,
            background: 'transparent'
          }}>
            <p style={{ color: s.color, fontSize: '18px', fontWeight: '800', margin: 0, lineHeight: 1 }}>{s.count}</p>
            <p style={{ color: '#4a5568', fontSize: '10px', fontWeight: '600', margin: '2px 0 0 0' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Leyenda */}
      <div style={{ display: 'flex', gap: '14px', marginBottom: '12px' }}>
        {[
          { color: '#4ade80', label: 'Disponible' },
          { color: '#fbbf24', label: 'Pendiente' },
          { color: '#ef4444', label: 'Ocupado' }
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <MdOutlineDirectionsBike size={14} color={l.color} />
            <span style={{ color: '#4a5568', fontSize: '11px' }}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* Mapa */}
      <div style={{
        border: `1px solid rgba(255,255,255,0.06)`,
        borderRadius: '14px', padding: '14px', marginBottom: '12px'
      }}>
        <div style={{
          textAlign: 'center', marginBottom: '12px', paddingBottom: '10px',
          borderBottom: '1px solid rgba(255,255,255,0.05)'
        }}>
          <span style={{ color: '#334155', fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>
            ▲ INSTRUCTOR
          </span>
        </div>

        {Object.keys(seatsByRow).sort((a, b) => Number(a) - Number(b)).map(row => (
          <div key={row} style={{
            display: 'flex', justifyContent: 'center', gap: '5px',
            marginBottom: '6px', flexWrap: 'wrap'
          }}>
            {seatsByRow[row].map(seat => {
              const status = getSeatStatus(seat);
              const res = getSeatReservation(seat);
              const color = bikeColor(status, seat.is_selectable);
              const isSelected = selectedSeat?.id === seat.id;

              return (
                <div
                  key={seat.id}
                  onClick={() => seat.is_selectable && setSelectedSeat(isSelected ? null : { ...seat, status, reservation: res })}
                  style={{
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: '2px',
                    cursor: seat.is_selectable ? 'pointer' : 'default'
                  }}
                >
                  <div style={{
                    width: '34px', height: '34px', borderRadius: '50%',
                    border: isSelected ? `2px solid ${primaryColor}` : `1px solid ${color}50`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isSelected ? `${primaryColor}20` : 'transparent',
                    boxShadow: isSelected ? `0 0 10px ${primaryColor}50` : 'none',
                    transition: 'all 0.15s'
                  }}>
                    <MdOutlineDirectionsBike size={17} color={isSelected ? primaryColor : color} />
                  </div>
                  {seat.is_selectable && (
                    <span style={{ color: '#2d3748', fontSize: '9px', fontWeight: '600' }}>
                      {seat.seat_number}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Detalle del asiento seleccionado */}
      {selectedSeat && (
        <div style={{
          borderRadius: '12px', padding: '13px',
          border: `1px solid ${selectedSeat.status === 'ocupada' ? 'rgba(239,68,68,0.3)'
            : selectedSeat.status === 'reservada' ? 'rgba(251,191,36,0.3)'
              : `${primaryColor}30`}`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h3 style={{ color: 'white', fontSize: '14px', fontWeight: '700', margin: 0 }}>
              Bici #{selectedSeat.seat_number}
            </h3>
            <span style={{
              fontSize: '10px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px',
              border: `1px solid ${selectedSeat.status === 'ocupada' ? 'rgba(239,68,68,0.4)'
                : selectedSeat.status === 'reservada' ? 'rgba(251,191,36,0.4)'
                  : 'rgba(74,222,128,0.4)'}`,
              color: selectedSeat.status === 'ocupada' ? '#ef4444'
                : selectedSeat.status === 'reservada' ? '#fbbf24' : '#4ade80',
              textTransform: 'uppercase'
            }}>
              {selectedSeat.status === 'disponible' ? 'Disponible'
                : selectedSeat.status === 'reservada' ? 'Pendiente' : 'Ocupado'}
            </span>
          </div>
          {selectedSeat.reservation ? (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <MiniChip label="Nombre" value={selectedSeat.reservation.customer_name} />
              <MiniChip label="Teléfono" value={selectedSeat.reservation.customer_phone} />
            </div>
          ) : (
            <p style={{ color: '#4a5568', fontSize: '12px', margin: 0 }}>Asiento disponible</p>
          )}
        </div>
      )}
    </div>
  );
}

function MiniChip({ label, value }) {
  return (
    <div style={{
      border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px',
      padding: '6px 10px', flex: 1, minWidth: '120px'
    }}>
      <p style={{ color: '#334155', fontSize: '10px', fontWeight: '600', margin: '0 0 2px 0', textTransform: 'uppercase' }}>{label}</p>
      <p style={{ color: 'white', fontSize: '12px', fontWeight: '600', margin: 0, wordBreak: 'break-word' }}>{value}</p>
    </div>
  );
}

export default AdminBikes;
