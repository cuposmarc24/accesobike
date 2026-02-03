import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { superAdminAuth } from './lib/auth';
import EventCreationForm from './EventCreationForm';
import { useEventConfig } from './lib/EventConfigProvider';

function SuperAdminPanel({ onLogout }) {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [deletingEventId, setDeletingEventId] = useState(null);
    const session = superAdminAuth.getSession();
    const { reloadConfig } = useEventConfig();

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching events:', error);
            } else {
                setEvents(data || []);
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        superAdminAuth.logout();
        onLogout();
    };

    const handleDeleteEvent = async (eventId) => {
        try {
            // Delete related data first (seats, sessions, etc.)
            const { error: seatsError } = await supabase
                .from('seats')
                .delete()
                .eq('event_id', eventId);

            if (seatsError) {
                console.error('Error deleting seats:', seatsError);
                alert('Error al eliminar los asientos del evento');
                return;
            }

            // Delete the event
            const { error: eventError } = await supabase
                .from('events')
                .delete()
                .eq('id', eventId);

            if (eventError) {
                console.error('Error deleting event:', eventError);
                alert('Error al eliminar el evento');
                return;
            }

            // Refresh events list
            fetchEvents();
            reloadConfig();
            setDeletingEventId(null);
        } catch (error) {
            console.error('Error:', error);
            alert('Error al eliminar el evento');
        }
    };

    const handleEditEvent = (event) => {
        setEditingEvent(event);
        setShowCreateForm(true);
    };

    if (loading) {
        return (
            <div style={{
                background: '#111f22',
                minHeight: '100vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                color: '#fff'
            }}>
                <div style={{ width: '60px', height: '60px' }}>
                    <svg fill="#13c8ec" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <rect x="1" y="1" width="7.33" height="7.33">
                            <animate id="spinner_oJFS" begin="0;spinner_5T1J.end+0.2s" attributeName="x" dur="0.6s" values="1;4;1" />
                            <animate begin="0;spinner_5T1J.end+0.2s" attributeName="y" dur="0.6s" values="1;4;1" />
                            <animate begin="0;spinner_5T1J.end+0.2s" attributeName="width" dur="0.6s" values="7.33;1.33;7.33" />
                            <animate begin="0;spinner_5T1J.end+0.2s" attributeName="height" dur="0.6s" values="7.33;1.33;7.33" />
                        </rect>
                        <rect x="8.33" y="1" width="7.33" height="7.33">
                            <animate begin="spinner_oJFS.begin+0.1s" attributeName="x" dur="0.6s" values="8.33;11.33;8.33" />
                            <animate begin="spinner_oJFS.begin+0.1s" attributeName="y" dur="0.6s" values="1;4;1" />
                            <animate begin="spinner_oJFS.begin+0.1s" attributeName="width" dur="0.6s" values="7.33;1.33;7.33" />
                            <animate begin="spinner_oJFS.begin+0.1s" attributeName="height" dur="0.6s" values="7.33;1.33;7.33" />
                        </rect>
                        <rect x="1" y="8.33" width="7.33" height="7.33">
                            <animate begin="spinner_oJFS.begin+0.1s" attributeName="x" dur="0.6s" values="1;4;1" />
                            <animate begin="spinner_oJFS.begin+0.1s" attributeName="y" dur="0.6s" values="8.33;11.33;8.33" />
                            <animate begin="spinner_oJFS.begin+0.1s" attributeName="width" dur="0.6s" values="7.33;1.33;7.33" />
                            <animate begin="spinner_oJFS.begin+0.1s" attributeName="height" dur="0.6s" values="7.33;1.33;7.33" />
                        </rect>
                        <rect x="15.66" y="1" width="7.33" height="7.33">
                            <animate begin="spinner_oJFS.begin+0.2s" attributeName="x" dur="0.6s" values="15.66;18.66;15.66" />
                            <animate begin="spinner_oJFS.begin+0.2s" attributeName="y" dur="0.6s" values="1;4;1" />
                            <animate begin="spinner_oJFS.begin+0.2s" attributeName="width" dur="0.6s" values="7.33;1.33;7.33" />
                            <animate begin="spinner_oJFS.begin+0.2s" attributeName="height" dur="0.6s" values="7.33;1.33;7.33" />
                        </rect>
                        <rect x="8.33" y="8.33" width="7.33" height="7.33">
                            <animate begin="spinner_oJFS.begin+0.2s" attributeName="x" dur="0.6s" values="8.33;11.33;8.33" />
                            <animate begin="spinner_oJFS.begin+0.2s" attributeName="y" dur="0.6s" values="8.33;11.33;8.33" />
                            <animate begin="spinner_oJFS.begin+0.2s" attributeName="width" dur="0.6s" values="7.33;1.33;7.33" />
                            <animate begin="spinner_oJFS.begin+0.2s" attributeName="height" dur="0.6s" values="7.33;1.33;7.33" />
                        </rect>
                        <rect x="1" y="15.66" width="7.33" height="7.33">
                            <animate begin="spinner_oJFS.begin+0.2s" attributeName="x" dur="0.6s" values="1;4;1" />
                            <animate begin="spinner_oJFS.begin+0.2s" attributeName="y" dur="0.6s" values="15.66;18.66;15.66" />
                            <animate begin="spinner_oJFS.begin+0.2s" attributeName="width" dur="0.6s" values="7.33;1.33;7.33" />
                            <animate begin="spinner_oJFS.begin+0.2s" attributeName="height" dur="0.6s" values="7.33;1.33;7.33" />
                        </rect>
                        <rect x="15.66" y="8.33" width="7.33" height="7.33">
                            <animate begin="spinner_oJFS.begin+0.3s" attributeName="x" dur="0.6s" values="15.66;18.66;15.66" />
                            <animate begin="spinner_oJFS.begin+0.3s" attributeName="y" dur="0.6s" values="8.33;11.33;8.33" />
                            <animate begin="spinner_oJFS.begin+0.3s" attributeName="width" dur="0.6s" values="7.33;1.33;7.33" />
                            <animate begin="spinner_oJFS.begin+0.3s" attributeName="height" dur="0.6s" values="7.33;1.33;7.33" />
                        </rect>
                        <rect x="8.33" y="15.66" width="7.33" height="7.33">
                            <animate begin="spinner_oJFS.begin+0.3s" attributeName="x" dur="0.6s" values="8.33;11.33;8.33" />
                            <animate begin="spinner_oJFS.begin+0.3s" attributeName="y" dur="0.6s" values="15.66;18.66;15.66" />
                            <animate begin="spinner_oJFS.begin+0.3s" attributeName="width" dur="0.6s" values="7.33;1.33;7.33" />
                            <animate begin="spinner_oJFS.begin+0.3s" attributeName="height" dur="0.6s" values="7.33;1.33;7.33" />
                        </rect>
                        <rect x="15.66" y="15.66" width="7.33" height="7.33">
                            <animate id="spinner_5T1J" begin="spinner_oJFS.begin+0.4s" attributeName="x" dur="0.6s" values="15.66;18.66;15.66" />
                            <animate begin="spinner_oJFS.begin+0.4s" attributeName="y" dur="0.6s" values="15.66;18.66;15.66" />
                            <animate begin="spinner_oJFS.begin+0.4s" attributeName="width" dur="0.6s" values="7.33;1.33;7.33" />
                            <animate begin="spinner_oJFS.begin+0.4s" attributeName="height" dur="0.6s" values="7.33;1.33;7.33" />
                        </rect>
                    </svg>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            background: '#111f22',
            minHeight: '100vh',
            fontFamily: 'Inter, sans-serif',
            color: '#fff',
            paddingBottom: '80px'
        }}>
            {/* Header */}
            <header style={{
                position: 'sticky',
                top: 0,
                zIndex: 50,
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(17, 31, 34, 0.95)',
                backdropFilter: 'blur(8px)',
                padding: '16px',
                justifyContent: 'space-between',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'rgba(19, 200, 236, 0.1)',
                        color: '#13c8ec',
                        fontSize: '16px',
                        fontWeight: '600'
                    }}>
                        SA
                    </div>
                    <div>
                        <h1 style={{
                            color: '#fff',
                            fontSize: '16px',
                            fontWeight: '700',
                            lineHeight: '1.2',
                            margin: 0
                        }}>
                            AccesoBike
                        </h1>
                        <p style={{
                            fontSize: '11px',
                            color: '#94a3b8',
                            fontWeight: '500',
                            margin: 0
                        }}>
                            Super Admin Panel
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        padding: '6px 14px',
                        color: '#fff',
                        fontSize: '12px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    Cerrar Sesión
                </button>
            </header>

            {/* Main Content */}
            <main style={{
                maxWidth: '1200px',
                margin: '0 auto',
                padding: '20px 16px'
            }}>
                {/* Stats Section */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: '12px',
                    marginBottom: '24px'
                }}>
                    <div style={{
                        background: '#1a2c30',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        borderRadius: '12px',
                        padding: '14px'
                    }}>
                        <div style={{
                            fontSize: '24px',
                            fontWeight: '700',
                            color: '#fff',
                            marginBottom: '2px'
                        }}>
                            {events.length}
                        </div>
                        <div style={{
                            fontSize: '11px',
                            color: '#94a3b8',
                            fontWeight: '500'
                        }}>
                            Total Eventos
                        </div>
                    </div>
                    <div style={{
                        background: '#1a2c30',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        borderRadius: '12px',
                        padding: '14px'
                    }}>
                        <div style={{
                            fontSize: '24px',
                            fontWeight: '700',
                            color: '#13c8ec',
                            marginBottom: '2px'
                        }}>
                            {events.filter(e => e.is_active).length}
                        </div>
                        <div style={{
                            fontSize: '11px',
                            color: '#94a3b8',
                            fontWeight: '500'
                        }}>
                            Eventos Activos
                        </div>
                    </div>
                </div>

                {/* Header Section - Side by Side */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px'
                }}>
                    <h2 style={{
                        color: '#fff',
                        fontSize: '18px',
                        fontWeight: '700',
                        margin: 0
                    }}>
                        Gestión de Eventos
                    </h2>
                    <button
                        onClick={() => setShowCreateForm(true)}
                        style={{
                            background: '#13c8ec',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '8px 16px',
                            color: '#111f22',
                            fontSize: '13px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            boxShadow: '0 0 20px rgba(19, 200, 236, 0.3)',
                            transition: 'all 0.2s',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <circle cx="12" cy="12" r="10" opacity="0.3" fill="currentColor" stroke="none" />
                            <line x1="12" y1="7" x2="12" y2="17" />
                            <line x1="7" y1="12" x2="17" y2="12" />
                        </svg>
                        <span>Crear Evento</span>
                    </button>
                </div>

                {/* Divider */}
                <div style={{
                    height: '1px',
                    background: 'linear-gradient(to right, transparent, rgba(255, 255, 255, 0.1), transparent)',
                    marginBottom: '16px'
                }} />

                {/* Events List */}
                {events.length === 0 ? (
                    <div style={{
                        background: '#1a2c30',
                        border: '1px dashed rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        padding: '40px 20px',
                        textAlign: 'center'
                    }}>
                        <div style={{
                            fontSize: '32px',
                            marginBottom: '10px',
                            opacity: 0.3
                        }}>
                            📋
                        </div>
                        <h3 style={{
                            color: '#fff',
                            fontSize: '14px',
                            fontWeight: '600',
                            margin: '0 0 4px 0'
                        }}>
                            No hay eventos creados
                        </h3>
                        <p style={{
                            color: '#94a3b8',
                            fontSize: '12px',
                            margin: 0
                        }}>
                            Crea tu primer evento para comenzar
                        </p>
                    </div>
                ) : (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                    }}>
                        {events.map((event) => (
                            <div
                                key={event.id}
                                style={{
                                    background: '#1a2c30',
                                    border: '1px solid rgba(255, 255, 255, 0.05)',
                                    borderRadius: '10px',
                                    padding: '10px',
                                    transition: 'all 0.2s',
                                    cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = 'rgba(19, 200, 236, 0.3)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                                }}
                            >
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'start',
                                    marginBottom: '8px'
                                }}>
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{
                                            color: '#fff',
                                            fontSize: '13px',
                                            fontWeight: '700',
                                            margin: '0 0 2px 0',
                                            lineHeight: '1.3'
                                        }}>
                                            {event.event_name}
                                        </h4>
                                        <p style={{
                                            color: '#94a3b8',
                                            fontSize: '11px',
                                            margin: 0,
                                            fontFamily: 'monospace'
                                        }}>
                                            /{event.event_slug}
                                        </p>
                                    </div>
                                    <div style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '3px',
                                        padding: '2px 8px',
                                        borderRadius: '5px',
                                        background: event.is_active
                                            ? 'rgba(16, 185, 129, 0.1)'
                                            : 'rgba(239, 68, 68, 0.1)',
                                        border: `1px solid ${event.is_active ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                                        fontSize: '10px',
                                        fontWeight: '600',
                                        color: event.is_active ? '#10b981' : '#ef4444'
                                    }}>
                                        <span style={{
                                            width: '4px',
                                            height: '4px',
                                            borderRadius: '50%',
                                            background: event.is_active ? '#10b981' : '#ef4444'
                                        }} />
                                        {event.is_active ? 'Activo' : 'Inactivo'}
                                    </div>
                                </div>

                                {event.end_date && (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '5px',
                                        marginBottom: '8px',
                                        padding: '5px 8px',
                                        background: 'rgba(255, 255, 255, 0.03)',
                                        borderRadius: '5px'
                                    }}>
                                        <span style={{ fontSize: '11px' }}>📅</span>
                                        <span style={{
                                            color: '#94a3b8',
                                            fontSize: '11px'
                                        }}>
                                            Expira: {new Date(event.end_date).toLocaleDateString('es-ES')}
                                        </span>
                                    </div>
                                )}

                                <div style={{
                                    display: 'flex',
                                    gap: '6px',
                                    paddingTop: '8px',
                                    borderTop: '1px solid rgba(255, 255, 255, 0.05)'
                                }}>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleEditEvent(event);
                                        }}
                                        style={{
                                            flex: 1,
                                            background: 'rgba(19, 200, 236, 0.1)',
                                            border: '1px solid rgba(19, 200, 236, 0.3)',
                                            borderRadius: '6px',
                                            padding: '5px',
                                            color: '#13c8ec',
                                            fontSize: '11px',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}>
                                        ✏️ Editar
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setDeletingEventId(event.id);
                                        }}
                                        style={{
                                            background: 'rgba(239, 68, 68, 0.1)',
                                            border: '1px solid rgba(239, 68, 68, 0.3)',
                                            borderRadius: '6px',
                                            padding: '5px 8px',
                                            color: '#ef4444',
                                            fontSize: '11px',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}>
                                        🗑️ Eliminar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Create/Edit Event Modal */}
            {showCreateForm && (
                <EventCreationForm
                    editingEvent={editingEvent}
                    onClose={() => {
                        setShowCreateForm(false);
                        setEditingEvent(null);
                    }}
                    onEventCreated={(newEvent) => {
                        setShowCreateForm(false);
                        setEditingEvent(null);
                        setShowCreateForm(false);
                        setEditingEvent(null);
                        fetchEvents(); // Refresh the events list
                        reloadConfig(); // Refresh app-wide config (colors, seats, etc.)
                    }}
                />
            )}

            {/* Delete Confirmation Modal */}
            {deletingEventId && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.7)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 10000,
                    padding: '20px'
                }}>
                    <div style={{
                        background: '#1a2c30',
                        borderRadius: '16px',
                        padding: '24px',
                        maxWidth: '400px',
                        width: '100%',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
                    }}>
                        <div style={{
                            fontSize: '48px',
                            textAlign: 'center',
                            marginBottom: '16px'
                        }}>⚠️</div>
                        <h3 style={{
                            color: '#fff',
                            fontSize: '18px',
                            fontWeight: '700',
                            textAlign: 'center',
                            margin: '0 0 8px 0'
                        }}>¿Eliminar Evento?</h3>
                        <p style={{
                            color: '#94a3b8',
                            fontSize: '13px',
                            textAlign: 'center',
                            margin: '0 0 24px 0',
                            lineHeight: '1.5'
                        }}>
                            Esta acción no se puede deshacer. Se eliminarán todos los asientos y datos relacionados.
                        </p>
                        <div style={{
                            display: 'flex',
                            gap: '12px'
                        }}>
                            <button
                                onClick={() => setDeletingEventId(null)}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '10px',
                                    color: '#fff',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => handleDeleteEvent(deletingEventId)}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    background: '#ef4444',
                                    border: 'none',
                                    borderRadius: '10px',
                                    color: '#fff',
                                    fontSize: '14px',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)'
                                }}
                            >
                                🗑️ Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SuperAdminPanel;

