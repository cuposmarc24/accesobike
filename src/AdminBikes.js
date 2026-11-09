import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { MdOutlineDirectionsBike } from 'react-icons/md';
import BottomSheet from './BottomSheet';

function AdminBikes({ eventId, config, primaryColor, secondaryColor, backgroundColor, reservations: externalReservations, activeTab: externalActiveTab, onTabChange, onNoteSaved }) {
  const [seats, setSeats] = useState([]);
  const [reservations, setReservations] = useState(externalReservations || []);
  const [loading, setLoading] = useState(!externalReservations);
  const [internalTab, setInternalTab] = useState(config?.sessions?.[0]?.id || '');
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [editingRowNote, setEditingRowNote] = useState(null);
  const [savingNote, setSavingNote] = useState(false);
  const [localConfig, setLocalConfig] = useState(config);

  // Solo sincronizar localConfig si el config del padre trae datos nuevos que no son notas
  // (evitar pisar notas recién guardadas localmente)
  useEffect(() => {
    if (!config) return;
    setLocalConfig(prev => {
      // Mantener rowNotes del estado local (recién guardadas) sobre las del prop
      const merged = {
        ...config,
        sessions: (config.sessions || []).map((s, i) => {
          const localSession = prev?.sessions?.[i];
          return {
            ...s,
            rowNotes: localSession?.rowNotes ?? s.rowNotes
          };
        })
      };
      return merged;
    });
  }, [config]); // eslint-disable-line react-hooks/exhaustive-deps

  // Si el padre controla el tab, usar el suyo; si no, usar el interno
  const activeTab = externalActiveTab !== undefined ? externalActiveTab : internalTab;
  const setActiveTab = (id) => {
    if (onTabChange) onTabChange(id);
    else setInternalTab(id);
  };

  const sessions = localConfig?.sessions || [];

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

  // Redistribuir por rowConfiguration del config (igual que el público ve las bicis).
  // Ignoramos row_number de BD porque puede estar desactualizado si se editó el evento.
  const rowConfig = localConfig?.sessions?.[0]?.rowConfiguration;
  const seatsByRow = (() => {
    if (rowConfig?.length > 0 && seats.length > 0) {
      const sorted = [...seats].sort((a, b) => a.seat_number - b.seat_number);
      const result = {};
      let idx = 0;
      rowConfig.forEach((count, i) => {
        const n = parseInt(count) || 0;
        result[i + 1] = [];
        for (let j = 0; j < n && idx < sorted.length; j++, idx++) {
          result[i + 1].push(sorted[idx]);
        }
      });
      return result;
    }
    // Fallback si no hay rowConfiguration
    return seats.reduce((acc, seat) => {
      const row = seat.row_number;
      if (!acc[row]) acc[row] = [];
      acc[row].push(seat);
      return acc;
    }, {});
  })();

  // Detecta si hay reservas con formato viejo (session_id == event_id)
  const hasOldFormat = reservations.some(r => r.session_id === eventId);
  const sessionReservations = hasOldFormat
    ? reservations
    : reservations.filter(r => r.session_id === activeTab);

  const totalSelectable = seats.filter(s => s.is_selectable).length;
  const occupiedCount = sessionReservations.filter(r => r.status === 'ocupada').length;
  const pendingCount = sessionReservations.filter(r => r.status === 'reservada').length;
  const availableCount = totalSelectable - occupiedCount - pendingCount;

  // Obtiene el rowIndex (0-based) de un asiento según seatsByRow
  const getRowIndexOfSeat = (seat) => {
    const entries = Object.entries(seatsByRow).sort((a, b) => Number(a[0]) - Number(b[0]));
    for (let i = 0; i < entries.length; i++) {
      if (entries[i][1].some(s => s.id === seat.id)) return i;
    }
    return (seat.row_number || 1) - 1;
  };

  const handleSaveRowNote = async (rowIndex, note) => {
    setSavingNote(true);
    try {
      const sessionIndex = localConfig.sessions.findIndex(s => s.id === activeTab);
      if (sessionIndex === -1) return;
      const newSessions = localConfig.sessions.map((s, i) => {
        if (i !== sessionIndex) return s;
        const currentNotes = s.rowNotes || s.rowConfiguration.map(() => '');
        const newNotes = currentNotes.map((v, ri) => ri === rowIndex ? note : v);
        return { ...s, rowNotes: newNotes };
      });
      // Limpiar base64 del config antes de guardar para evitar payload pesado
      const newConfig = {
        ...localConfig,
        sessions: newSessions.map(s => ({
          ...s,
          image: s.image && !s.image.startsWith('data:') ? s.image : ''
        }))
      };
      await supabase.from('events').update({ config: newConfig }).eq('id', eventId);
      setLocalConfig(newConfig);
      setEditingRowNote(null);
    } catch (e) {
      console.error('Error guardando nota:', e);
    } finally {
      setSavingNote(false);
    }
  };

  const STATUS = {
    disponible: { color: '#4ade80', label: 'Libre' },
    reservada: { color: '#fbbf24', label: 'Por confirmar' },
    ocupada: { color: '#ef4444', label: 'Confirmada' }
  };

  const bikeColor = (status, isSelectable) => {
    if (!isSelectable) return 'var(--ab-line-strong)';
    return (STATUS[status] || STATUS.disponible).color;
  };

  if (loading) return <div className="ab-empty">Cargando mapa…</div>;

  const session = localConfig?.sessions?.find(s => s.id === activeTab);
  const rowEntries = Object.entries(seatsByRow).sort((a, b) => Number(a[0]) - Number(b[0]));

  return (
    <div>
      {/* Tabs de sesión — solo si hay más de una Y el padre no los controla */}
      {sessions.length > 1 && externalActiveTab === undefined && (
        <div className="ab-seg">
          {sessions.map(s => (
            <button
              key={s.id}
              type="button"
              className={`ab-seg__btn${activeTab === s.id ? ' is-active' : ''}`}
              onClick={() => { setActiveTab(s.id); setSelectedSeat(null); }}
            >
              {s.event_name || s.id}
            </button>
          ))}
        </div>
      )}

      {/* Contadores */}
      <div className="ab-tiles">
        {[
          { label: 'Libres', count: availableCount, color: STATUS.disponible.color },
          { label: 'Por confirmar', count: pendingCount, color: STATUS.reservada.color },
          { label: 'Confirmadas', count: occupiedCount, color: STATUS.ocupada.color }
        ].map(s => (
          <div key={s.label} className="ab-tile" style={{ '--tone': s.color }}>
            <span className="ab-tile__value">{s.count}</span>
            <span className="ab-tile__label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Mapa — misma estructura que el público */}
      <div className="ab-map">
        {(() => {
          const row1Seats = seatsByRow['1'] || [];
          const mid = Math.ceil(row1Seats.length / 2);
          const leftSeats = row1Seats.slice(0, mid);
          const rightSeats = row1Seats.slice(mid);

          const renderBike = (seat) => {
            const status = getSeatStatus(seat);
            const res = getSeatReservation(seat);
            const color = bikeColor(status, seat.is_selectable);
            const isSelected = selectedSeat?.id === seat.id;
            return (
              <button
                type="button"
                key={seat.id}
                disabled={!seat.is_selectable}
                aria-label={`Bici ${seat.seat_number}`}
                onClick={() => setSelectedSeat(isSelected ? null : { ...seat, status, reservation: res })}
                style={{
                  appearance: 'none', border: 0, background: 'none', padding: 0,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
                  cursor: seat.is_selectable ? 'pointer' : 'default', font: 'inherit'
                }}
              >
                <span style={{
                  width: '30px', height: '30px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isSelected ? primaryColor : `color-mix(in srgb, ${color} 16%, transparent)`,
                  boxShadow: isSelected ? `0 0 0 3px color-mix(in srgb, ${primaryColor} 30%, transparent)` : 'none',
                  transition: 'background-color 0.15s, box-shadow 0.15s'
                }}>
                  <MdOutlineDirectionsBike size={15} color={isSelected ? 'var(--ab-on-primary)' : color} />
                </span>
                {seat.is_selectable && (
                  <span className="ab-num" style={{ color: 'var(--ab-faint)', fontSize: '10px', fontWeight: 600 }}>{seat.seat_number}</span>
                )}
              </button>
            );
          };

          return (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '14px' }}>
                {leftSeats.length > 0 && <div style={{ display: 'flex', gap: '4px' }}>{leftSeats.map(renderBike)}</div>}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ height: '2px', borderRadius: 2, background: primaryColor, opacity: 0.5, width: '56px', margin: '0 auto 6px' }} />
                  <span style={{ color: 'var(--ab-faint)', fontSize: '11px', fontWeight: 600 }}>Tarima</span>
                </div>
                {rightSeats.length > 0 && <div style={{ display: 'flex', gap: '4px' }}>{rightSeats.map(renderBike)}</div>}
              </div>

              {rowEntries.map(([rowNum, rowSeats]) => {
                if (rowNum === '1') return null;
                return (
                  <div key={rowNum} style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginBottom: '6px', flexWrap: 'nowrap' }}>
                    {rowSeats.map(renderBike)}
                  </div>
                );
              })}
            </>
          );
        })()}
      </div>

      {/* Detalle de la bici seleccionada */}
      {selectedSeat && (() => {
        const st = STATUS[selectedSeat.status] || STATUS.disponible;
        return (
          <div className="ab-card" style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: selectedSeat.reservation ? 10 : 0 }}>
              <span className="ab-row__badge ab-display" style={{ '--tone': st.color }}>{String(selectedSeat.seat_number).padStart(2, '0')}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span className="ab-row__title">Bici {selectedSeat.seat_number}</span>
                <span className="ab-pill" style={{ '--tone': st.color, marginTop: 4 }}>{st.label}</span>
              </div>
              <button type="button" className="ab-icon-btn" style={{ width: 36, height: 36 }} onClick={() => setSelectedSeat(null)} aria-label="Cerrar detalle">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            {selectedSeat.reservation && (
              <div className="ab-kv">
                <div className="ab-kv__row"><span className="ab-kv__k">Nombre</span><span className="ab-kv__v">{selectedSeat.reservation.customer_name}</span></div>
                <div className="ab-kv__row"><span className="ab-kv__k">WhatsApp</span><span className="ab-kv__v">{selectedSeat.reservation.customer_phone}</span></div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Notas por fila */}
      {rowEntries.length > 0 && (
        <section className="ab-section" style={{ marginTop: 22 }}>
          <div className="ab-sec-head">
            <div>
              <h2>Notas por fila</h2>
              <p>El cliente las ve al elegir una bici de esa fila</p>
            </div>
          </div>
          <div className="ab-list">
            {rowEntries.map(([rowNum], idx) => {
              const currentNote = (session?.rowNotes || [])[idx] || '';
              return (
                <button
                  type="button"
                  key={rowNum}
                  className="ab-row"
                  onClick={() => setEditingRowNote({ rowIndex: idx, note: currentNote })}
                >
                  <span className="ab-row__badge ab-display" style={{ width: 40, height: 40, fontSize: 19 }}>{idx + 1}</span>
                  <span className="ab-row__main">
                    <span className="ab-row__title">{idx === 0 ? 'Fila 1 (junto a la tarima)' : `Fila ${idx + 1}`}</span>
                    <span className="ab-row__sub" style={{ whiteSpace: 'normal' }}>{currentNote || 'Sin nota — toca para agregar'}</span>
                  </span>
                  <svg className="ab-row__chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Editor de nota (sube desde abajo) */}
      {editingRowNote && (
        <BottomSheet
          theme={{ primaryColor, backgroundColor }}
          ariaLabel="Editar nota de fila"
          onClose={() => setEditingRowNote(null)}
          header={
            <div>
              <h2 className="ab-sheet-title">Nota de la fila {editingRowNote.rowIndex + 1}</h2>
              <p className="ab-sheet-sub">Se muestra al cliente como “Incluido en tu reserva”</p>
            </div>
          }
          footer={(close) => (
            <>
              <button type="button" className="ab-btn ab-btn--ghost" style={{ flex: 1 }} onClick={close}>Cancelar</button>
              <button
                type="button"
                className="ab-btn ab-btn--primary"
                style={{ flex: 2 }}
                disabled={savingNote}
                onClick={() => handleSaveRowNote(editingRowNote.rowIndex, editingRowNote.note)}
              >
                {savingNote ? 'Guardando…' : 'Guardar nota'}
              </button>
            </>
          )}
        >
          <textarea
            className="ab-textarea"
            aria-label="Nota de la fila"
            value={editingRowNote.note}
            onChange={e => setEditingRowNote({ ...editingRowNote, note: e.target.value })}
            placeholder="Ej: Incluye termo, llavero y ropa deportiva"
            rows={4}
          />
          <p className="ab-help">Déjala vacía y guarda para quitar la nota.</p>
        </BottomSheet>
      )}
    </div>
  );
}

export default AdminBikes;
