import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { useEventConfig } from './lib/EventConfigProvider';
import { sendAdminWhatsAppMessage, sendVIPAssignmentWhatsApp } from './whatsappService';
import AdminAlert from './AdminAlert';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Footer from './Footer';



// ... (imports)

function AdminPanel({ onBack, eventId: propEventId, config: propConfig, eventData }) {
  const { eventId: contextEventId, getSessionId, config: contextConfig } = useEventConfig();

  // Use props if provided (from Admin Login), otherwise fallback to context (global view)
  const eventId = propEventId || contextEventId;
  const config = propConfig || contextConfig;

  // Extract theme colors from eventData
  const theme = eventData?.config?.theme || eventData?.theme || {};
  const primaryColor = theme.primaryColor || '#13c8ec';
  const secondaryColor = theme.secondaryColor || '#1a2c30';
  const backgroundColor = theme.backgroundColor || '#111f22';

  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showOccupiedSection, setShowOccupiedSection] = useState(false);
  const [auctionBids, setAuctionBids] = useState([]);
  const [alert, setAlert] = useState({ isOpen: false });
  const [activeTab, setActiveTab] = useState(config?.sessions?.[0]?.id || 'session1');

  useEffect(() => {
    fetchReservations();
  }, [eventId]); // Agregar eventId como dependencia

  // Función helper para formatear hora a AM/PM
  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Función helper para obtener el nombre de la sesión desde la configuración
  const getSessionName = (sessionId) => {
    if (!config?.sessions) return sessionId;
    const session = config.sessions.find(s => s.id === sessionId);
    return session ? `${session.event_name} - ${formatTime(session.time)}` : sessionId;
  };

  const fetchReservations = async () => {
    if (!eventId) {
      console.log('Esperando eventId...');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          seats (
            seat_number,
            row_number
          )
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error:', error);
      } else {
        setReservations(data || []);
      }

      // Obtener también las subastas
      const { data: bidsData, error: bidsError } = await supabase
        .from('auction_bids')
        .select('*')
        .eq('event_id', eventId)
        .order('session_id')
        .order('bid_amount', { ascending: false }); // Mayor monto primero

      if (bidsError) {
        console.error('Error fetching bids:', bidsError);
      } else {
        setAuctionBids(bidsData || []);
      }

    } catch (error) {
      console.error('Error fetching reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (type, title, message, onConfirm, onCancel = null) => {
    setAlert({
      isOpen: true,
      type,
      title,
      message,
      onConfirm: () => {
        setAlert({ isOpen: false });
        if (typeof onConfirm === 'function') {
          onConfirm();
        }
      },
      onCancel: onCancel ? () => {
        setAlert({ isOpen: false });
        if (typeof onCancel === 'function') {
          onCancel();
        }
      } : null
    });
  };

  const assignVIPSeat = (bid) => {
    showAlert(
      'confirm',
      'Asignar Asiento VIP',
      `¿Asignar el asiento VIP a ${bid.full_name} por $${bid.bid_amount}?`,
      async () => {
        try {
          // Buscar el asiento VIP por seat_number (número 27)
          const { data: vipSeat, error: seatError } = await supabase
            .from('seats')
            .select('*')
            .eq('event_id', eventId)
            .eq('seat_number', 27)
            .single();

          if (seatError) {
            console.error('Error buscando asiento VIP:', seatError);
            showAlert('error', 'Error', 'No se pudo encontrar el asiento VIP #27');
            return;
          }

          // 🔍 DEBUG: Verificar qué asiento encontró
          console.log('Asiento VIP encontrado:', vipSeat);
          console.log('ID del asiento VIP:', vipSeat.id);

          // Verificar si el asiento ya está ocupado para esta sesión
          const { data: existingReservation, error: checkError } = await supabase
            .from('reservations')
            .select('*')
            .eq('seat_id', vipSeat.id)
            .eq('event_id', eventId)
            .eq('session_id', bid.session_id)
            .maybeSingle();

          if (checkError) {
            console.error('Error verificando reserva:', checkError);
            showAlert('error', 'Error', 'Error al verificar el estado del asiento');
            return;
          }

          if (existingReservation) {
            showAlert('warning', 'Asiento Ocupado', `El asiento VIP ya está asignado a ${existingReservation.customer_name} para esta rodada`);
            return;
          }

          // Crear la reservación del asiento VIP
          const reservationData = {
            event_id: eventId,
            seat_id: vipSeat.id,
            session_id: bid.session_id,
            customer_name: bid.full_name,
            customer_phone: bid.phone,
            status: 'ocupada'
          };

          // 🔍 DEBUG: Verificar datos de la reserva
          console.log('Datos de reservación:', reservationData);

          const { error: reservationError } = await supabase
            .from('reservations')
            .insert([reservationData]);

          if (reservationError) {
            console.error('Error creando reserva:', reservationError);
            showAlert('error', 'Error', 'No se pudo asignar el asiento VIP');
            return;
          }

          // Enviar mensaje de WhatsApp al ganador
          sendVIPAssignmentWhatsApp(bid, vipSeat);

          // Recargar datos para actualizar la interfaz
          fetchReservations();

          showAlert('success', '¡Asiento VIP Asignado!', `El asiento VIP #${vipSeat.seat_number} ha sido asignado a ${bid.full_name}.`);

        } catch (error) {
          console.error('Error general:', error);
          showAlert('error', 'Error', 'Ocurrió un error inesperado al asignar el asiento VIP');
        }
      },
      () => { }
    );
  };

  const confirmReservation = (reservation) => {
    showAlert(
      'confirm',
      'Confirmar Reserva',
      `¿Confirmar la reserva de ${reservation.customer_name} para el asiento #${reservation.seats?.seat_number}?`,
      async () => {
        try {
          console.log('🔄 Confirmando reserva:', reservation.id);
          const { error } = await supabase
            .from('reservations')
            .update({ status: 'ocupada' })
            .eq('id', reservation.id);

          if (error) {
            console.error('❌ Error al confirmar:', error);
            showAlert('error', 'Error', 'No se pudo confirmar la reserva');
            return;
          }

          console.log('✅ Reserva confirmada exitosamente');

          // Verificar que se actualizó en la BD
          const { data: verifyData } = await supabase
            .from('reservations')
            .select('*')
            .eq('id', reservation.id)
            .single();
          console.log('🔍 Verificando actualización en BD:', verifyData);

          sendAdminWhatsAppMessage(reservation, 'confirmada', eventData, config);
          await fetchReservations();
          console.log('📊 Reservas actualizadas. Total:', reservations.length);
          setShowOccupiedSection(true); // Auto-expandir la sección de ocupados
          showAlert('success', '¡Reserva Confirmada!', 'Se ha enviado la confirmación por WhatsApp');
        } catch (error) {
          console.error('❌ Error inesperado:', error);
          showAlert('error', 'Error', 'Ocurrió un error al confirmar la reserva');
        }
      },
      () => { } // onCancel
    );
  };

  const cancelReservation = (reservation) => {
    showAlert(
      'warning',
      'Cancelar Reserva',
      `¿Estás seguro de cancelar la reserva de ${reservation.customer_name}?`,
      async () => {
        try {
          const { error } = await supabase
            .from('reservations')
            .delete()
            .eq('id', reservation.id);

          if (error) {
            showAlert('error', 'Error', 'No se pudo cancelar la reserva');
            return;
          }

          sendAdminWhatsAppMessage(reservation, 'cancelada', eventData, config);
          await fetchReservations();
          showAlert('success', 'Reserva Cancelada', 'Se ha enviado la notificación por WhatsApp');
        } catch (error) {
          showAlert('error', 'Error', 'Ocurrió un error al cancelar la reserva');
        }
      },
      () => { } // onCancel
    );
  };

  const enableOccupied = (reservation) => {
    showAlert(
      'confirm',
      'Habilitar Asiento',
      `¿Habilitar nuevamente el asiento #${reservation.seats?.seat_number}?`,
      async () => {
        try {
          const { error } = await supabase
            .from('reservations')
            .delete()
            .eq('id', reservation.id);

          if (error) {
            showAlert('error', 'Error', 'No se pudo habilitar el asiento');
            return;
          }

          fetchReservations();
          showAlert('success', 'Asiento Habilitado', 'El asiento está nuevamente disponible');
        } catch (error) {
          showAlert('error', 'Error', 'Ocurrió un error al habilitar el asiento');
        }
      },
      () => { } // onCancel
    );
  };

  const deleteBid = (bid) => {
    showAlert(
      'warning',
      'Eliminar Subasta',
      `¿Estás seguro de eliminar la subasta de ${bid.full_name} por $${bid.bid_amount}?`,
      async () => {
        try {
          const { error } = await supabase
            .from('auction_bids')
            .delete()
            .eq('id', bid.id);

          if (error) {
            showAlert('error', 'Error', 'No se pudo eliminar la subasta');
            return;
          }

          fetchReservations(); // Recargar datos
          showAlert('success', 'Subasta Eliminada', 'La subasta ha sido eliminada exitosamente');
        } catch (error) {
          showAlert('error', 'Error', 'Ocurrió un error al eliminar la subasta');
        }
      },
      () => { } // onCancel
    );
  };

  if (loading) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #000000 0%, #0d0d0d 50%, #1a1a1a 100%)',
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: 'white',
        fontSize: '20px'
      }}>
        Cargando reservas...
      </div>
    );
  }

  const generatePDF = (sessionId) => {
    // Detectar formato viejo: si session_id es igual a event_id, mostrar todas
    const hasOldFormat = occupiedReservations.some(r => r.session_id === eventId);

    const filteredReservations = hasOldFormat
      ? occupiedReservations  // Formato viejo: todas las reservas
      : occupiedReservations.filter(r => r.session_id === sessionId);

    // Obtener información de la sesión
    const session = config?.sessions?.find(s => s.id === sessionId);
    const sessionName = session
      ? `${session.event_name} - ${formatTime(session.time)}`
      : 'Sesión única';

    if (filteredReservations.length === 0) {
      showAlert('warning', 'Sin datos', `No hay asientos ocupados en ${sessionName}`);
      return;
    }

    const doc = new jsPDF();

    // Extraer colores del tema para usar en el PDF
    const primaryRGB = hexToRGB(primaryColor);

    // Header
    doc.setFontSize(20);
    doc.setTextColor(primaryRGB.r, primaryRGB.g, primaryRGB.b);
    doc.text(eventData?.event_name || 'Evento de Ciclismo', 20, 25);

    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(sessionName, 20, 35);

    doc.setFontSize(12);
    doc.text(`Lista de Asientos Ocupados - ${new Date().toLocaleDateString('es-ES')}`, 20, 45);

    // Preparar datos para la tabla
    const tableData = filteredReservations.map((reservation, index) => [
      index + 1,
      reservation.customer_name,
      `#${reservation.seats?.seat_number}`,
      reservation.customer_phone,
      new Date(reservation.created_at).toLocaleDateString('es-ES')
    ]);

    // Crear tabla
    autoTable(doc, {
      head: [['#', 'Nombre', 'Asiento', 'Teléfono', 'Fecha Reserva']],
      body: tableData,
      startY: 55,
      styles: {
        fontSize: 10,
        cellPadding: 5
      },
      headStyles: {
        fillColor: [primaryRGB.r, primaryRGB.g, primaryRGB.b],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      }
    });

    // Footer
    const finalY = doc.lastAutoTable.finalY + 20;
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    doc.text(`Total de participantes: ${filteredReservations.length}`, 20, finalY);
    doc.text('AccesoBike - Sistema de Reservas Desarrollado por TecnoAcceso', 20, finalY + 10);

    // Guardar PDF con nombre dinámico
    const sessionFileName = session
      ? session.event_name.replace(/\s+/g, '_')
      : 'session';
    const fileName = `${eventData?.cycling_room || 'Evento'}_${sessionFileName}_${new Date().toLocaleDateString('es-ES').replace(/\//g, '-')}.pdf`;
    doc.save(fileName);

    showAlert('success', 'PDF Generado', `Lista de ${sessionName} descargada exitosamente`);
  };

  // Helper para convertir hex a RGB
  const hexToRGB = (hex) => {
    // Remover # si existe
    hex = hex.replace('#', '');

    // Convertir a RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return { r, g, b };
  };



  const pendingReservations = reservations.filter(r => r.status === 'reservada');
  const occupiedReservations = reservations.filter(r => r.status === 'ocupada');

  // Debug: ver qué reservas tenemos
  console.log('📋 Total reservations:', reservations.length);
  console.log('⏳ Pending:', pendingReservations.length);
  console.log('✅ Occupied:', occupiedReservations.length);
  console.log('Reservations data:', reservations);
  console.log('🎯 Config sessions:', config?.sessions);
  console.log('🎯 Active tab:', activeTab);

  return (
      <div style={{
        background: backgroundColor,
        minHeight: '100vh',
        padding: '16px 16px 80px 16px',
        color: 'white',
        fontFamily: 'Inter, sans-serif'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '24px',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={onBack}
            style={{
              background: 'transparent',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              padding: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
          </button>

          {eventData?.cycling_room_logo && (
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              overflow: 'hidden',
              border: `2px solid ${primaryColor}40`,
              background: secondaryColor,
              flexShrink: 0
            }}>
              <img
                src={eventData.cycling_room_logo}
                alt="Logo Sala"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{
              color: primaryColor,
              fontSize: '20px',
              fontWeight: '800',
              margin: '0',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              Panel Administrativo
            </h1>
            <p style={{
              color: '#94a3b8',
              fontSize: '13px',
              margin: '2px 0 0 0',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {eventData?.event_name || 'Evento'}
            </p>
          </div>
        </div>

        {/* Container */}
        <div style={{
          background: secondaryColor,
          border: `1px solid ${primaryColor}20`,
          borderRadius: '20px',
          padding: '16px',
          maxWidth: '100%',
          margin: '0',
          boxSizing: 'border-box'
        }}>
          {/* Sección de Reservas Pendientes */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{
              color: primaryColor,
              fontSize: '18px',
              fontWeight: '700',
              marginBottom: '16px',
              borderBottom: `2px solid ${primaryColor}`,
              paddingBottom: '8px'
            }}>
              Reservas Pendientes ({pendingReservations.length})
            </h2>

            {pendingReservations.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>No hay reservas pendientes</p>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                {pendingReservations.map(reservation => (
                  <div key={reservation.id} style={{
                    background: `${backgroundColor}80`,
                    borderRadius: '12px',
                    padding: '12px',
                    border: `1px solid ${primaryColor}30`
                  }}>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      <div>
                        <h3 style={{
                          color: 'white',
                          fontSize: '14px',
                          fontWeight: '700',
                          margin: '0 0 6px 0'
                        }}>
                          {reservation.customer_name}
                        </h3>
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                          fontSize: '12px',
                          color: '#94a3b8'
                        }}>
                          <p style={{ margin: '0' }}>
                            <strong>Asiento:</strong> #{reservation.seats?.seat_number}
                          </p>
                          <p style={{ margin: '0' }}>
                            <strong>Sesión:</strong> {
                              reservation.session_id === eventId
                                ? (config?.sessions?.[0] ? `${config.sessions[0].event_name} - ${formatTime(config.sessions[0].time)}` : 'Sesión única')
                                : getSessionName(reservation.session_id)
                            }
                          </p>
                          <p style={{ margin: '0' }}>
                            <strong>Teléfono:</strong> {reservation.customer_phone}
                          </p>
                          <p style={{ margin: '0' }}>
                            <strong>Fecha:</strong> {new Date(reservation.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div style={{
                        display: 'flex',
                        gap: '8px',
                        width: '100%'
                      }}>
                        <button
                          onClick={() => confirmReservation(reservation)}
                          style={{
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            padding: '10px 16px',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            flex: 1,
                            transition: 'all 0.2s'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = '#059669';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = '#10b981';
                          }}
                        >
                          ✅ Confirmar
                        </button>

                        <button
                          onClick={() => cancelReservation(reservation)}
                          style={{
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            padding: '10px 16px',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            flex: 1,
                            transition: 'all 0.2s'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = '#dc2626';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = '#ef4444';
                          }}
                        >
                          ❌ Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botón para mostrar sección de ocupados */}
          <div style={{ marginBottom: '16px' }}>
            <button
              onClick={() => setShowOccupiedSection(!showOccupiedSection)}
              style={{
                background: showOccupiedSection ? `${primaryColor}40` : primaryColor,
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                width: '100%',
                padding: '10px 16px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {showOccupiedSection ? '🔼 Ocultar' : '🔽 Ver'} Ocupados ({occupiedReservations.length})
            </button>
          </div>

          {/* Sección de Ocupados con Tabs */}
          {showOccupiedSection && (
            <div>
              <h2 style={{
                color: '#ef4444',
                fontSize: '18px',
                fontWeight: '700',
                marginBottom: '16px',
                borderBottom: '2px solid #ef4444',
                paddingBottom: '8px'
              }}>
                Asientos Ocupados
              </h2>

              {/* Tabs - Dinámicos basados en config.sessions */}
              <div style={{
                display: 'flex',
                marginBottom: '16px',
                background: `${backgroundColor}80`,
                borderRadius: '12px',
                padding: '4px',
                gap: '4px',
                overflowX: 'auto'
              }}>
                {config?.sessions?.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => setActiveTab(session.id)}
                    style={{
                      flex: 1,
                      minWidth: '120px',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: 'none',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      background: activeTab === session.id ? primaryColor : 'transparent',
                      color: activeTab === session.id ? backgroundColor : '#94a3b8',
                      transition: 'all 0.2s',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {getSessionName(session.id)} ({
                      occupiedReservations.some(r => r.session_id === eventId)
                        ? occupiedReservations.length  // Formato viejo: mostrar total
                        : occupiedReservations.filter(r => r.session_id === session.id).length
                    })
                  </button>
                ))}
              </div>
              {/* Sección de Subastas VIP - Solo mostrar si hay VIP habilitado */}
              {config?.vipFeatures?.enabled && (
                <div style={{ marginTop: '32px' }}>
                  <h2 style={{
                    color: '#fbbf24',
                    fontSize: '18px',
                    fontWeight: '700',
                    marginBottom: '16px',
                    borderBottom: '2px solid #fbbf24',
                    paddingBottom: '8px'
                  }}>
                    🏆 Subastas VIP ({auctionBids.length})
                  </h2>

                  {/* Tabs para las sesiones de subasta - Dinámicos */}
                  <div style={{
                    display: 'flex',
                    marginBottom: '16px',
                    background: `${backgroundColor}80`,
                    borderRadius: '12px',
                    padding: '4px',
                    gap: '4px',
                    overflowX: 'auto'
                  }}>
                    {config?.sessions?.map((session) => (
                      <button
                        key={session.id}
                        onClick={() => setActiveTab(session.id)}
                        style={{
                          flex: 1,
                          minWidth: '120px',
                          padding: '10px 12px',
                          borderRadius: '10px',
                          border: 'none',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          background: activeTab === session.id ? '#fbbf24' : 'transparent',
                          color: activeTab === session.id ? '#000' : '#94a3b8',
                          transition: 'all 0.2s',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {getSessionName(session.id)} ({auctionBids.filter(b => b.session_id === session.id).length})
                      </button>
                    ))}
                  </div>

                {/* Lista de subastas del tab activo */}
                {(() => {
                  const filteredBids = auctionBids.filter(b => b.session_id === activeTab);

                  if (filteredBids.length === 0) {
                    return (
                      <p style={{ color: '#ccc', fontSize: '16px', textAlign: 'center', padding: '20px' }}>
                        No hay subastas para {getSessionName(activeTab)}
                      </p>
                    );
                  }

                  return (
                    <div style={{
                      display: 'grid',
                      gap: '15px'
                    }}>
                      {filteredBids.map((bid, index) => (
                        <div key={bid.id} style={{
                          background: 'rgba(255, 215, 0, 0.1)',
                          borderRadius: '15px',
                          padding: '20px',
                          border: '1px solid rgba(255, 215, 0, 0.3)',
                          position: 'relative'
                        }}>
                          {/* Posición de la subasta */}
                          <div style={{
                            position: 'absolute',
                            top: '15px',
                            right: '15px',
                            background: index === 0 ? 'linear-gradient(135deg, #ffd700, #ffed4e)' : 'rgba(255, 255, 255, 0.1)',
                            color: index === 0 ? '#000' : '#fff',
                            padding: '5px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}>
                            #{index + 1}
                          </div>

                          {/* Contenido principal con botón */}
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr auto',
                            alignItems: 'center',
                            gap: '20px'
                          }}>
                            <div>
                              <h3 style={{
                                color: '#ffd700',
                                fontSize: '20px',
                                fontWeight: '600',
                                margin: '0 0 10px 0'
                              }}>
                                {bid.full_name}
                              </h3>
                              <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                                gap: '10px',
                                fontSize: '14px',
                                color: '#ccc'
                              }}>
                                <p style={{ margin: '0' }}>
                                  <strong style={{ color: '#ffd700' }}>Monto:</strong> ${bid.bid_amount}
                                </p>
                                <p style={{ margin: '0' }}>
                                  <strong>Teléfono:</strong> {bid.phone}
                                </p>
                                <p style={{ margin: '0' }}>
                                  <strong>Fecha:</strong> {new Date(bid.created_at).toLocaleDateString()}
                                </p>
                                <p style={{ margin: '0' }}>
                                  <strong>Hora:</strong> {new Date(bid.created_at).toLocaleTimeString('es-VE', {
                                    hour12: true,
                                    timeZone: 'America/Caracas'
                                  })}
                                </p>
                              </div>
                            </div>

                            {/* Contenedor de botones */}
                            <div style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '10px'
                            }}>
                              {/* Botón Asignar VIP */}
                              <button
                                onClick={() => assignVIPSeat(bid)}
                                style={{
                                  background: 'linear-gradient(135deg, #ffd700, #ffed4e)',
                                  color: '#000',
                                  border: 'none',
                                  borderRadius: '12px',
                                  padding: '12px 20px',
                                  fontSize: '14px',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                  whiteSpace: 'nowrap',
                                  boxShadow: '0 6px 15px rgba(255, 215, 0, 0.4)',
                                  transition: 'all 0.3s ease'
                                }}
                                onMouseOver={(e) => {
                                  e.target.style.transform = 'translateY(-2px)';
                                  e.target.style.boxShadow = '0 8px 20px rgba(255, 215, 0, 0.6)';
                                }}
                                onMouseOut={(e) => {
                                  e.target.style.transform = 'translateY(0)';
                                  e.target.style.boxShadow = '0 6px 15px rgba(255, 215, 0, 0.4)';
                                }}
                              >
                                🏆 Asignar
                              </button>

                              {/* Botón Eliminar */}
                              <button
                                onClick={() => deleteBid(bid)}
                                style={{
                                  background: 'linear-gradient(135deg, #f44336, #d32f2f)',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '12px',
                                  padding: '12px 20px',
                                  fontSize: '14px',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                  whiteSpace: 'nowrap',
                                  boxShadow: '0 6px 15px rgba(244, 67, 54, 0.3)',
                                  transition: 'all 0.3s ease'
                                }}
                                onMouseOver={(e) => {
                                  e.target.style.transform = 'translateY(-2px)';
                                  e.target.style.boxShadow = '0 8px 20px rgba(244, 67, 54, 0.5)';
                                }}
                                onMouseOut={(e) => {
                                  e.target.style.transform = 'translateY(0)';
                                  e.target.style.boxShadow = '0 6px 15px rgba(244, 67, 54, 0.3)';
                                }}
                              >
                                🗑️ Eliminar
                              </button>
                            </div>

                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
                </div>
              )}
              {/* Botón PDF */}
              <div style={{ marginBottom: '20px', textAlign: 'right' }}>
                <button
                  onClick={() => generatePDF(activeTab)}
                  style={{
                    background: 'linear-gradient(135deg, #4caf50, #388e3c)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px 25px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: '0 6px 15px rgba(76, 175, 80, 0.3)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 8px 20px rgba(76, 175, 80, 0.5)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 6px 15px rgba(76, 175, 80, 0.3)';
                  }}
                >
                  📄 Descargar PDF - {getSessionName(activeTab)}
                </button>
              </div>

              {/* Contenido del tab activo */}
              {(() => {
                console.log('🔍 Filtrando ocupados:');
                console.log('  activeTab:', activeTab);
                console.log('  occupiedReservations:', occupiedReservations);

                // Si las reservas tienen event_id como session_id (datos viejos),
                // entonces mostrar todas en todos los tabs
                const hasOldFormat = occupiedReservations.some(r => r.session_id === eventId);

                const filteredOccupied = hasOldFormat
                  ? occupiedReservations  // Mostrar todas si están en formato viejo
                  : occupiedReservations.filter(r => r.session_id === activeTab);

                console.log('  hasOldFormat:', hasOldFormat);
                console.log('  filteredOccupied:', filteredOccupied.length);

                if (filteredOccupied.length === 0) {
                  return (
                    <p style={{ color: '#ccc', fontSize: '16px', textAlign: 'center', padding: '20px' }}>
                      No hay asientos ocupados en {getSessionName(activeTab)}
                    </p>
                  );
                }

                return (
                  <div style={{
                    display: 'grid',
                    gap: '8px'
                  }}>
                    {filteredOccupied.map(reservation => (
                      <div key={reservation.id} style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        borderRadius: '12px',
                        padding: '12px',
                        border: '1px solid rgba(244, 67, 54, 0.3)'
                      }}>
                        <div>
                          <h3 style={{
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: '600',
                            margin: '0 0 6px 0'
                          }}>
                            {reservation.customer_name}
                          </h3>
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '4px',
                            fontSize: '12px',
                            color: '#ccc',
                            marginBottom: '10px'
                          }}>
                            <p style={{ margin: '0' }}>
                              <strong>Asiento:</strong> #{reservation.seats?.seat_number}
                            </p>
                            <p style={{ margin: '0' }}>
                              <strong>Sesión:</strong> {
                                hasOldFormat
                                  ? (config?.sessions?.[0] ? `${config.sessions[0].event_name} - ${formatTime(config.sessions[0].time)}` : 'Sesión única')
                                  : getSessionName(reservation.session_id)
                              }
                            </p>
                            <p style={{ margin: '0' }}>
                              <strong>Teléfono:</strong> {reservation.customer_phone}
                            </p>
                            <p style={{ margin: '0' }}>
                              <strong>Fecha:</strong> {new Date(reservation.created_at).toLocaleDateString()}
                            </p>
                          </div>

                          <button
                            onClick={() => enableOccupied(reservation)}
                            style={{
                              background: 'linear-gradient(135deg, #ff9800, #f57c00)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '10px',
                              padding: '10px 16px',
                              fontSize: '13px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              width: '100%',
                              boxShadow: '0 4px 12px rgba(255, 152, 0, 0.3)',
                              transition: 'all 0.3s ease'
                            }}
                            onMouseOver={(e) => {
                              e.target.style.transform = 'translateY(-2px)';
                              e.target.style.boxShadow = '0 8px 20px rgba(255, 152, 0, 0.5)';
                            }}
                            onMouseOut={(e) => {
                              e.target.style.transform = 'translateY(0)';
                              e.target.style.boxShadow = '0 6px 15px rgba(255, 152, 0, 0.3)';
                            }}
                          >
                            🔄 Habilitar Asiento
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Alert personalizado */}
        <AdminAlert
          isOpen={alert.isOpen}
          type={alert.type}
          title={alert.title}
          message={alert.message}
          onConfirm={alert.onConfirm}
          onCancel={alert.onCancel}
          theme={theme}
        />

        <Footer />

      </div>
  );
}

export default AdminPanel;