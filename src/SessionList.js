
import React from 'react';
import { MdAccessTime, MdEventSeat, MdOutlineCalendarToday, MdDeveloperMode } from 'react-icons/md';

function SessionList({ event, onSelectSession, onBack, onShowAdmin }) {
    // Extract theme colors: Check event.config.theme first (SeatMap pattern), then event.theme
    const config = event.config || {};
    const theme = config.theme || event.theme || {};

    const primaryColor = theme.primaryColor || '#13c8ec';
    const secondaryColor = theme.secondaryColor || '#1a2c30';
    const backgroundColor = theme.backgroundColor || '#111f22';

    // Define sessions. Ideally this comes from event.sessions or a related table.
    // For now, we'll verify if the event has specific sessions defined in config, 
    // otherwise default to a single session or standard rounds if implied.
    // As per previous context (Rodada 1/2), let's mock this flexibility or check event structure.
    // If event has no explict sessions array, we might default to showing specific hardcoded rounds 
    // IF that's the business logic, OR just one "General Access" session.

    // Let's assume for now we want to support the "Rodada 1" and "Rodada 2" logic 
    // implied in previous conversations if not explicitly defined.
    // BUT safer to genericize: if no sessions defined, show one "General Session".

    const sessions = event.sessions || [
        { id: 'session-1', name: 'Sesión General', time: 'Horario del Evento', seats_available: 'Ver disponibilidad' }
    ];

    // If the user previously mentioned "Rodada 1" and "Rodada 2", let's enable that 
    // via a check or just smart defaults for the "Aniversario" type events if we can detect them.
    // For this generic component, let's look for a 'sessions' property or default to the event itself acting as one session.

    // Refined Logic: If the event IS "rodada1" or "rodada2" capable (legacy logic), we might manually add them.
    // But purely dynamic is better. Let's stick to displaying the event itself as the session 
    // UNLESS we want to split it. 

    // User request: "en caso de q el evento tenga varias sesiones" -> Implies 1..N relationship.
    // Let's create a visual list.

    const displaySessions = (event.config && event.config.sessions) ? event.config.sessions : [
        {
            id: event.id,
            name: event.event_name || 'Entrada General',
            time: event.start_date ? new Date(event.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBD',
            rodada: 'unique'
        }
    ];

    return (
        <div style={{
            background: backgroundColor,
            minHeight: '100vh',
            width: '100%',
            fontFamily: 'Inter, sans-serif',
            color: '#fff',
            padding: '20px',
            boxSizing: 'border-box'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '30px',
                gap: '15px'
            }}>
                <button
                    onClick={onBack}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#fff',
                        cursor: 'pointer',
                        padding: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        transition: 'background 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
                </button>
                <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>Selecciona una Sesión</h1>
            </div>

            {/* Event Summary Card */}
            <div style={{
                background: `linear - gradient(135deg, ${secondaryColor} 0 %, ${backgroundColor} 100 %)`,
                borderRadius: '24px',
                padding: '24px',
                marginBottom: '40px',
                border: `1px solid ${primaryColor} 40`, // 25% opacity
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                boxShadow: `0 10px 30px - 10px ${primaryColor} 20`
            }}>
                <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '20px',
                    backgroundImage: `url(${event.event_image || 'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=1470&auto=format&fit=crop'})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    flexShrink: 0
                }} />
                <div>
                    <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#fff' }}>
                        {event.event_name}
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '14px' }}>
                        <MdOutlineCalendarToday />
                        <span>{event.start_date ? new Date(event.start_date).toLocaleDateString() : 'Fecha por confirmar'}</span>
                    </div>
                </div>
            </div>

            {/* Sessions Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {displaySessions.map((session, index) => {
                    // Helper to format time to AM/PM
                    const formatTime = (timeStr) => {
                        if (!timeStr) return 'TBD';
                        // Check if it's already localized or just HH:MM
                        if (timeStr.includes('AM') || timeStr.includes('PM')) return timeStr;
                        const [hours, minutes] = timeStr.split(':');
                        if (!hours || !minutes) return timeStr;
                        const h = parseInt(hours, 10);
                        const ampm = h >= 12 ? 'PM' : 'AM';
                        const h12 = h % 12 || 12;
                        return `${h12}:${minutes} ${ampm}`;
                    };

                    return (
                        <div
                            key={index}
                            onClick={() => onSelectSession(session)}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                borderRadius: '20px', // Slightly less rounded
                                cursor: 'pointer',
                                overflow: 'hidden',
                                background: 'rgba(255, 255, 255, 0.03)',
                                border: `1px solid rgba(255, 255, 255, 0.1)`,
                                transition: 'all 0.3s ease',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                marginBottom: '16px' // Reduced gap between cards is handled by parent, but card itself is compact
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.transform = 'translateY(-3px)'; // Subtle lift
                                e.currentTarget.style.borderColor = primaryColor;
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                            }}
                        >
                            {/* 1. Flyer / Image Section */}
                            <div style={{
                                width: '100%',
                                height: '180px', // More compact image height
                                position: 'relative',
                                overflow: 'hidden'
                            }}>
                                <img
                                    src={session.image || event.event_image || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop'}
                                    alt={session.name}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        transition: 'transform 0.5s ease'
                                    }}
                                />
                            </div>

                            {/* 2. Details Section - Compact */}
                            <div style={{
                                padding: '16px 20px', // Reduced padding
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px'
                            }}>
                                {/* Header: Name and Price */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                                    <h3 style={{
                                        fontSize: '20px', // Compact font size
                                        fontWeight: '800',
                                        margin: 0,
                                        color: '#fff',
                                        textTransform: 'uppercase',
                                        lineHeight: '1.2'
                                    }}>
                                        {session.event_name || session.name}
                                    </h3>
                                    {session.price && (
                                        <div style={{
                                            background: 'rgba(34, 197, 94, 0.15)',
                                            color: '#4ade80',
                                            padding: '4px 8px',
                                            borderRadius: '6px',
                                            fontSize: '13px',
                                            fontWeight: '700',
                                            whiteSpace: 'nowrap',
                                            border: '1px solid rgba(34, 197, 94, 0.2)'
                                        }}>
                                            {session.price}
                                        </div>
                                    )}
                                </div>

                                {/* Instructors List - Requested Format */}
                                {session.instructors && session.instructors.length > 0 && (
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '4px',
                                        padding: '8px 12px',
                                        background: 'rgba(0,0,0,0.2)',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(255,255,255,0.05)'
                                    }}>
                                        {session.instructors.map((inst, i) => (
                                            <div key={i} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                fontSize: '13px',
                                                color: '#cbd5e1'
                                            }}>
                                                <span style={{ color: primaryColor, fontWeight: '700' }}>
                                                    Instructor {inst.rank ? inst.rank : ''} :
                                                </span>
                                                <span style={{ color: '#fff', fontWeight: '500' }}>
                                                    {inst.name}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Footer: Time and Action Button */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginTop: '4px',
                                    paddingTop: '12px',
                                    borderTop: '1px solid rgba(255,255,255,0.05)'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        color: '#94a3b8'
                                    }}>
                                        <MdAccessTime size={18} style={{ color: primaryColor }} />
                                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#fff' }}>
                                            {formatTime(session.time)}
                                        </span>
                                    </div>

                                    <button style={{
                                        background: primaryColor,
                                        color: secondaryColor,
                                        border: 'none',
                                        padding: '8px 16px',
                                        borderRadius: '8px',
                                        fontSize: '13px',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        transition: 'all 0.2s',
                                        boxShadow: `0 4px 12px ${primaryColor}30`
                                    }}>
                                        RESERVAR
                                        <span style={{ fontSize: '16px', lineHeight: '1' }}>→</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer with Admin Button */}
            <footer style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                background: `${backgroundColor}F2`,
                backdropFilter: 'blur(10px)',
                borderTop: `1px solid ${primaryColor}20`,
                padding: '10px 20px',
                zIndex: 100,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <a
                    href="https://wa.me/584120557690"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        opacity: 0.7,
                        transition: 'opacity 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
                >
                    <MdDeveloperMode size={16} color="#94a3b8" />
                    <span style={{
                        fontSize: '10px',
                        color: '#94a3b8',
                        fontWeight: '500',
                        letterSpacing: '0.5px'
                    }}>
                        Desarrollado por <span style={{ color: primaryColor, fontWeight: '700' }}>TecnoAcceso</span>
                    </span>
                </a>

                <button
                    onClick={onShowAdmin}
                    style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: `1px solid ${primaryColor}20`,
                        borderRadius: '6px',
                        padding: '6px',
                        color: '#64748b',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = `${primaryColor}50`;
                        e.currentTarget.style.color = primaryColor;
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = `${primaryColor}20`;
                        e.currentTarget.style.color = '#64748b';
                    }}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                </button>
            </footer>
        </div>
    );
}

export default SessionList;
