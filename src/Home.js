import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { useEventConfig } from './lib/EventConfigProvider';
import SeatMap from './SeatMap';
import SessionList from './SessionList';
import Footer from './Footer';

function Home({ onSelectSession, onShowAdmin, onShowSuperAdmin }) {
    const { loading: configLoading } = useEventConfig();
    const [events, setEvents] = useState([]);
    const [loadingEvents, setLoadingEvents] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [selectedSession, setSelectedSession] = useState(null);

    // Lógica para Super Admin (Triple Tap en Logo)
    const [tapCount, setTapCount] = useState(0);
    const [tapTimeout, setTapTimeout] = useState(null);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setEvents(data || []);
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoadingEvents(false);
        }
    };

    const handleLogoTap = () => {
        if (tapTimeout) clearTimeout(tapTimeout);
        const newTapCount = tapCount + 1;
        setTapCount(newTapCount);

        if (newTapCount === 3) {
            onShowSuperAdmin();
            setTapCount(0);
        } else {
            const timeout = setTimeout(() => setTapCount(0), 500);
            setTapTimeout(timeout);
        }
    };


    // Navigation Handlers
    const handleEventSelect = (event) => {
        setSelectedEvent(event);
        setSelectedSession(null); // Reset session when selecting new event
    };

    const handleSessionSelect = (session) => {
        setSelectedSession(session);
    };

    const handleBackToEvents = () => {
        setSelectedEvent(null);
        setSelectedSession(null);
    };

    const handleBackToSessions = () => {
        setSelectedSession(null);
    };

    if (configLoading || loadingEvents) {
        return (
            <div style={{
                background: '#111f22',
                minHeight: '100vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                <div style={{ width: '60px', height: '60px' }}>
                    <svg fill="#13c8ec" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <rect x="1" y="1" width="7.33" height="7.33"><animate id="spinner_oJFS" begin="0;spinner_5T1J.end+0.2s" attributeName="x" dur="0.6s" values="1;4;1" /><animate begin="0;spinner_5T1J.end+0.2s" attributeName="y" dur="0.6s" values="1;4;1" /><animate begin="0;spinner_5T1J.end+0.2s" attributeName="width" dur="0.6s" values="7.33;1.33;7.33" /><animate begin="0;spinner_5T1J.end+0.2s" attributeName="height" dur="0.6s" values="7.33;1.33;7.33" /></rect><rect x="8.33" y="1" width="7.33" height="7.33"><animate begin="spinner_oJFS.begin+0.1s" attributeName="x" dur="0.6s" values="8.33;11.33;8.33" /><animate begin="spinner_oJFS.begin+0.1s" attributeName="y" dur="0.6s" values="1;4;1" /><animate begin="spinner_oJFS.begin+0.1s" attributeName="width" dur="0.6s" values="7.33;1.33;7.33" /><animate begin="spinner_oJFS.begin+0.1s" attributeName="height" dur="0.6s" values="7.33;1.33;7.33" /></rect><rect x="1" y="8.33" width="7.33" height="7.33"><animate begin="spinner_oJFS.begin+0.1s" attributeName="x" dur="0.6s" values="1;4;1" /><animate begin="spinner_oJFS.begin+0.1s" attributeName="y" dur="0.6s" values="8.33;11.33;8.33" /><animate begin="spinner_oJFS.begin+0.1s" attributeName="width" dur="0.6s" values="7.33;1.33;7.33" /><animate begin="spinner_oJFS.begin+0.1s" attributeName="height" dur="0.6s" values="7.33;1.33;7.33" /></rect><rect x="15.66" y="1" width="7.33" height="7.33"><animate begin="spinner_oJFS.begin+0.2s" attributeName="x" dur="0.6s" values="15.66;18.66;15.66" /><animate begin="spinner_oJFS.begin+0.2s" attributeName="y" dur="0.6s" values="1;4;1" /><animate begin="spinner_oJFS.begin+0.2s" attributeName="width" dur="0.6s" values="7.33;1.33;7.33" /><animate begin="spinner_oJFS.begin+0.2s" attributeName="height" dur="0.6s" values="7.33;1.33;7.33" /></rect><rect x="8.33" y="8.33" width="7.33" height="7.33"><animate begin="spinner_oJFS.begin+0.2s" attributeName="x" dur="0.6s" values="8.33;11.33;8.33" /><animate begin="spinner_oJFS.begin+0.2s" attributeName="y" dur="0.6s" values="8.33;11.33;8.33" /><animate begin="spinner_oJFS.begin+0.2s" attributeName="width" dur="0.6s" values="7.33;1.33;7.33" /><animate begin="spinner_oJFS.begin+0.2s" attributeName="height" dur="0.6s" values="7.33;1.33;7.33" /></rect><rect x="1" y="15.66" width="7.33" height="7.33"><animate begin="spinner_oJFS.begin+0.2s" attributeName="x" dur="0.6s" values="1;4;1" /><animate begin="spinner_oJFS.begin+0.2s" attributeName="y" dur="0.6s" values="15.66;18.66;15.66" /><animate begin="spinner_oJFS.begin+0.2s" attributeName="width" dur="0.6s" values="7.33;1.33;7.33" /><animate begin="spinner_oJFS.begin+0.2s" attributeName="height" dur="0.6s" values="7.33;1.33;7.33" /></rect><rect x="15.66" y="8.33" width="7.33" height="7.33"><animate begin="spinner_oJFS.begin+0.3s" attributeName="x" dur="0.6s" values="15.66;18.66;15.66" /><animate begin="spinner_oJFS.begin+0.3s" attributeName="y" dur="0.6s" values="8.33;11.33;8.33" /><animate begin="spinner_oJFS.begin+0.3s" attributeName="width" dur="0.6s" values="7.33;1.33;7.33" /><animate begin="spinner_oJFS.begin+0.3s" attributeName="height" dur="0.6s" values="7.33;1.33;7.33" /></rect><rect x="8.33" y="15.66" width="7.33" height="7.33"><animate begin="spinner_oJFS.begin+0.3s" attributeName="x" dur="0.6s" values="8.33;11.33;8.33" /><animate begin="spinner_oJFS.begin+0.3s" attributeName="y" dur="0.6s" values="15.66;18.66;15.66" /><animate begin="spinner_oJFS.begin+0.3s" attributeName="width" dur="0.6s" values="7.33;1.33;7.33" /><animate begin="spinner_oJFS.begin+0.3s" attributeName="height" dur="0.6s" values="7.33;1.33;7.33" /></rect><rect x="15.66" y="15.66" width="7.33" height="7.33"><animate id="spinner_5T1J" begin="spinner_oJFS.begin+0.4s" attributeName="x" dur="0.6s" values="15.66;18.66;15.66" /><animate begin="spinner_oJFS.begin+0.4s" attributeName="y" dur="0.6s" values="15.66;18.66;15.66" /><animate begin="spinner_oJFS.begin+0.4s" attributeName="width" dur="0.6s" values="7.33;1.33;7.33" /><animate begin="spinner_oJFS.begin+0.4s" attributeName="height" dur="0.6s" values="7.33;1.33;7.33" /></rect>
                    </svg>
                </div>
            </div>
        );
    }

    // View Logic (Router Replacement)
    if (selectedSession) {
        return (
            <SeatMap
                rodada={selectedEvent}
                onBack={handleBackToSessions}
                session={selectedSession}
            />
        );
    }

    if (selectedEvent) {
        return (
            <SessionList
                event={selectedEvent}
                onSelectSession={handleSessionSelect}
                onBack={handleBackToEvents}
                onShowAdmin={() => onShowAdmin(selectedEvent)}
            />
        );
    }

    // Default: Show Event List
    const upcomingEvents = events;

    return (
        <div style={{
            background: '#111f22',
            minHeight: '100vh',
            fontFamily: 'Inter, sans-serif',
            color: '#fff',
            paddingBottom: '80px',
            position: 'relative'
        }}>
            {/* Header / Top Bar Simplificado */}
            <header style={{
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'sticky',
                top: 0,
                background: '#111f22',
                zIndex: 50
            }}>
                <h1
                    onClick={handleLogoTap}
                    style={{
                        fontSize: '20px',
                        fontWeight: '800',
                        margin: 0,
                        color: '#fff',
                        cursor: 'pointer',
                        userSelect: 'none',
                        letterSpacing: '-0.5px'
                    }}
                >
                    AccesoBike
                </h1>
                <p style={{
                    fontSize: '12px',
                    color: '#94a3b8',
                    margin: '4px 0 0 0',
                    fontWeight: '500',
                    letterSpacing: '0.5px'
                }}>
                    App de Reservas Online
                </p>
            </header>

            <main style={{ padding: '0 20px', marginTop: '24px' }}>
                {events.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', opacity: 0.5 }}>
                        <p>No hay eventos disponibles</p>
                    </div>
                ) : (
                    <>
                        {/* Eventos Section */}
                        <div style={{ marginBottom: '16px' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Eventos</h2>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {upcomingEvents.map(event => (
                                <div
                                    key={event.id}
                                    style={{
                                        background: '#1a2c30',
                                        borderRadius: '20px',
                                        overflow: 'hidden',
                                        border: '1px solid rgba(255, 255, 255, 0.05)'
                                    }}
                                >
                                    {/* Image Header */}
                                    <div style={{
                                        height: '240px',
                                        position: 'relative',
                                        backgroundImage: `url(${event.event_image || 'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=1470&auto=format&fit=crop'})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center'
                                    }}>
                                        <div style={{
                                            position: 'absolute',
                                            top: 0, left: 0, right: 0, bottom: 0,
                                            background: 'linear-gradient(to top, rgba(26,44,48,1) 0%, rgba(26,44,48,0) 100%)'
                                        }} />
                                        <div style={{
                                            position: 'absolute',
                                            bottom: '24px',
                                            left: '20px',
                                            right: '20px'
                                        }}>
                                            <h3 style={{
                                                fontSize: '24px',
                                                fontWeight: '800',
                                                margin: '0 0 6px 0',
                                                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                                                lineHeight: '1.2'
                                            }}>{event.event_name}</h3>
                                            <p style={{
                                                fontSize: '14px',
                                                color: '#e2e8f0',
                                                margin: 0,
                                                textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                                                fontFamily: 'monospace'
                                            }}>
                                                📅 {event.start_date ? new Date(event.start_date).toLocaleDateString() : 'Fecha por definir'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Card Body */}
                                    <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', background: '#334155', border: '2px solid rgba(19, 200, 236, 0.3)' }}>
                                                    {event.cycling_room_logo ? (
                                                        <img src={event.cycling_room_logo} alt="Room Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>🚲</div>
                                                    )}
                                                </div>
                                                <span style={{ fontSize: '16px', fontWeight: '700', color: '#fff', letterSpacing: '0.3px' }}>{event.cycling_room || 'Sala Principal'}</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleEventSelect(event)}
                                            style={{
                                                background: '#13c8ec',
                                                color: '#111f22',
                                                border: 'none',
                                                borderRadius: '12px',
                                                padding: '10px 20px',
                                                fontSize: '14px',
                                                fontWeight: '700',
                                                cursor: 'pointer',
                                                boxShadow: '0 4px 14px rgba(19, 200, 236, 0.2)'
                                            }}
                                        >
                                            Reservar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </main>

            <Footer />
        </div>
    );
}

export default Home;
