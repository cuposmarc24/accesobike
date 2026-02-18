import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { useEventConfig } from './lib/EventConfigProvider';
import SeatMap from './SeatMap';
import SessionList from './SessionList';
import Footer from './Footer';
import { FaRegCalendarXmark } from "react-icons/fa6";

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
                background: '#f8fafc', // Light loading bg
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
    const isEmpty = events.length === 0;

    return (
        <div style={{
            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',

            // FULL LOCK
            height: isEmpty ? '100vh' : 'auto',
            minHeight: '100vh',
            overflow: isEmpty ? 'hidden' : 'auto',

            // Flex for overall structure
            display: 'flex',
            flexDirection: 'column',

            margin: 0,
            padding: 0,
            boxSizing: 'border-box',
            fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
            color: '#1e293b',
        }}>
            {/* Header: Fixed Height needed for calc if we used it, but flex is better */}
            <header style={{
                flexShrink: 0, // Prevent shrinking
                padding: '12px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'sticky',
                top: 0,
                background: 'rgba(17, 31, 34, 0.95)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                zIndex: 50,
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
                <div
                    onClick={handleLogoTap}
                    style={{
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%'
                    }}
                >
                    <img
                        src="/logo.png"
                        alt="AccesoBike Logo"
                        style={{
                            height: '55px',
                            width: 'auto',
                            objectFit: 'contain',
                            filter: 'drop-shadow(0 0 8px rgba(19, 200, 236, 0.3))'
                        }}
                    />
                </div>
            </header>

            <main style={{
                flex: 1, // Take all remaining space
                display: 'flex',
                flexDirection: 'column',
                // CENTER CONTENT IF EMPTY
                justifyContent: isEmpty ? 'center' : 'flex-start',
                alignItems: isEmpty ? 'center' : 'stretch',

                padding: isEmpty ? '0 20px' : '24px 20px', // Remove vertical padding if empty to fix centering
                paddingBottom: isEmpty ? 0 : '80px',
                width: '100%',
                boxSizing: 'border-box'
            }}>
                {isEmpty ? (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        // Remove padding/margins that shift center
                        opacity: 0,
                        animation: 'fadeIn 0.8s ease-out forwards',
                        transform: 'translateY(-20px)' // Slight visual correction for optical center vs geometric center
                    }}>
                        <div style={{
                            fontSize: '48px',
                            marginBottom: '32px',
                            background: '#fff',
                            borderRadius: '50%',
                            width: '120px',
                            height: '120px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid rgba(255,255,255,0.8)',
                            boxShadow: '0 10px 40px -10px rgba(19, 200, 236, 0.2)'
                        }}>
                            <FaRegCalendarXmark size={48} color="#94a3b8" />
                        </div>
                        <h3 style={{
                            fontSize: '22px',
                            fontWeight: '600',
                            color: '#334155',
                            margin: '0 0 12px 0',
                            textAlign: 'center',
                            letterSpacing: '-0.01em'
                        }}>
                            Sin eventos programados
                        </h3>
                        <p style={{
                            fontSize: '15px',
                            color: '#64748b',
                            margin: 0,
                            textAlign: 'center',
                            maxWidth: '280px',
                            lineHeight: '1.6'
                        }}>
                            Estamos preparando nuevas experiencias. Mantente atento a las próximas fechas.
                        </p>
                        <style>{`
                            @keyframes fadeIn {
                                from { opacity: 0; transform: translateY(20px); }
                                to { opacity: 1; transform: translateY(-20px); } 
                            }
                        `}</style>
                    </div>
                ) : (
                    <>
                        <div style={{ marginBottom: '24px', paddingLeft: '4px', borderLeft: '3px solid #13c8ec' }}>
                            <h2 style={{
                                fontSize: '24px',
                                fontWeight: '700',
                                margin: 0,
                                color: '#1e293b',
                                letterSpacing: '-0.03em'
                            }}>Próximos Eventos</h2>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {upcomingEvents.map(event => (
                                <div
                                    key={event.id}
                                    style={{
                                        background: '#ffffff',
                                        borderRadius: '24px',
                                        overflow: 'hidden',
                                        border: '1px solid rgba(255, 255, 255, 0.8)',
                                        boxShadow: '0 20px 40px -10px rgba(0,0,0,0.08)',
                                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => handleEventSelect(event)}
                                >
                                    <div style={{
                                        height: '220px',
                                        position: 'relative',
                                        backgroundImage: `url(${event.event_image || 'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=1470&auto=format&fit=crop'})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center'
                                    }}>
                                        <div style={{
                                            position: 'absolute',
                                            top: 0, left: 0, right: 0, bottom: 0,
                                            background: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.4) 100%)'
                                        }} />

                                        <div style={{
                                            position: 'absolute',
                                            bottom: '20px',
                                            left: '20px',
                                            right: '20px'
                                        }}>
                                            <div style={{
                                                display: 'inline-block',
                                                padding: '6px 12px',
                                                background: 'rgba(255, 255, 255, 0.95)',
                                                backdropFilter: 'blur(4px)',
                                                borderRadius: '50px',
                                                marginBottom: '12px',
                                                boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                                            }}>
                                                <span style={{
                                                    fontSize: '12px',
                                                    fontWeight: '700',
                                                    color: '#0f172a',
                                                    letterSpacing: '0.05em'
                                                }}>
                                                    {event.start_date ? new Date(event.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }).toUpperCase() : 'FECHA TBD'}
                                                </span>
                                            </div>
                                            <h3 style={{
                                                fontSize: '28px',
                                                fontWeight: '700',
                                                margin: 0,
                                                color: '#fff',
                                                textShadow: '0 4px 12px rgba(0,0,0,0.5)',
                                                lineHeight: '1.1',
                                                letterSpacing: '-0.02em'
                                            }}>{event.event_name}</h3>
                                        </div>
                                    </div>

                                    <div style={{ padding: '20px 24px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{
                                                width: '42px',
                                                height: '42px',
                                                borderRadius: '14px',
                                                overflow: 'hidden',
                                                background: '#f1f5f9',
                                                border: '1px solid rgba(0,0,0,0.05)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                {event.cycling_room_logo ? (
                                                    <img src={event.cycling_room_logo} alt="Room Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <span style={{ fontSize: '18px' }}>🚲</span>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{
                                                    fontSize: '12px',
                                                    color: '#64748b',
                                                    fontWeight: '700',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.05em'
                                                }}>Ubicación</span>
                                                <span style={{
                                                    fontSize: '15px',
                                                    fontWeight: '700',
                                                    color: '#1e293b'
                                                }}>{event.cycling_room || 'Sala Principal'}</span>
                                            </div>
                                        </div>

                                        <div style={{
                                            width: '48px',
                                            height: '48px',
                                            borderRadius: '50%',
                                            background: 'linear-gradient(135deg, #13c8ec 0%, #0ea5e9 100%)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#fff',
                                            boxShadow: '0 6px 20px -5px rgba(14, 165, 233, 0.4)'
                                        }}>
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M5 12h14M12 5l7 7-7 7" />
                                            </svg>
                                        </div>
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
