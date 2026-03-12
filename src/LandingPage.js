import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import Footer from './Footer';
import SuperAdminLogin from './SuperAdminLogin';
import SuperAdminPanel from './SuperAdminPanel';
import { superAdminAuth } from './lib/auth';

function LandingPage() {
    const [events, setEvents] = useState([]);
    const [loadingEvents, setLoadingEvents] = useState(true);
    const [showSuperAdminLogin, setShowSuperAdminLogin] = useState(false);
    const [superAdminUser, setSuperAdminUser] = useState(null);
    const [tapCount, setTapCount] = useState(0);
    const [tapTimeout, setTapTimeout] = useState(null);
    const [copiedSlug, setCopiedSlug] = useState(null);

    useEffect(() => {
        fetchEvents();
        const session = superAdminAuth.getSession();
        if (session) setSuperAdminUser(session);
    }, []);

    useEffect(() => {
        const handleKeyPress = (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'S') {
                e.preventDefault();
                setShowSuperAdminLogin(true);
            }
        };
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
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
        } catch (err) {
            console.error('Error fetching events:', err);
        } finally {
            setLoadingEvents(false);
        }
    };

    const handleLogoTap = () => {
        if (tapTimeout) clearTimeout(tapTimeout);
        const newCount = tapCount + 1;
        setTapCount(newCount);
        if (newCount === 3) {
            setShowSuperAdminLogin(true);
            setTapCount(0);
        } else {
            const t = setTimeout(() => setTapCount(0), 500);
            setTapTimeout(t);
        }
    };

    const handleSuperAdminLogin = (user) => {
        setSuperAdminUser(user);
        setShowSuperAdminLogin(false);
    };

    const handleSuperAdminLogout = () => {
        setSuperAdminUser(null);
        fetchEvents();
    };

    if (showSuperAdminLogin) {
        return (
            <SuperAdminLogin
                onLoginSuccess={handleSuperAdminLogin}
                onCancel={() => setShowSuperAdminLogin(false)}
            />
        );
    }

    if (superAdminUser) {
        return <SuperAdminPanel onLogout={handleSuperAdminLogout} />;
    }

    if (loadingEvents) {
        return (
            <div style={{ background: '#111f22', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ width: '50px', height: '50px' }}>
                    <svg fill="#13c8ec" viewBox="0 0 24 24">
                        <rect x="1" y="1" width="7.33" height="7.33">
                            <animate id="s1" begin="0;s9.end+0.2s" attributeName="x" dur="0.6s" values="1;4;1" />
                            <animate begin="0;s9.end+0.2s" attributeName="y" dur="0.6s" values="1;4;1" />
                            <animate begin="0;s9.end+0.2s" attributeName="width" dur="0.6s" values="7.33;1.33;7.33" />
                            <animate begin="0;s9.end+0.2s" attributeName="height" dur="0.6s" values="7.33;1.33;7.33" />
                        </rect>
                        <rect x="15.66" y="15.66" width="7.33" height="7.33">
                            <animate id="s9" begin="s1.begin+0.4s" attributeName="x" dur="0.6s" values="15.66;18.66;15.66" />
                            <animate begin="s1.begin+0.4s" attributeName="y" dur="0.6s" values="15.66;18.66;15.66" />
                            <animate begin="s1.begin+0.4s" attributeName="width" dur="0.6s" values="7.33;1.33;7.33" />
                            <animate begin="s1.begin+0.4s" attributeName="height" dur="0.6s" values="7.33;1.33;7.33" />
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
            display: 'flex',
            flexDirection: 'column',
            fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
            color: '#fff',
        }}>
            {/* Header */}
            <header style={{
                flexShrink: 0,
                padding: '12px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'sticky',
                top: 0,
                background: 'rgba(17, 31, 34, 0.97)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                zIndex: 50,
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
                <div
                    onClick={handleLogoTap}
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}
                >
                    <img
                        src="/logo.png"
                        alt="AccesoBike Logo"
                        style={{ height: '55px', width: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 0 8px rgba(19, 200, 236, 0.3))' }}
                    />
                </div>
            </header>

            {/* Hero */}
            <section style={{
                background: 'linear-gradient(135deg, #111f22 0%, #0d2a30 60%, #0a1f24 100%)',
                padding: '70px 24px 60px',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Background glow */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(19,200,236,0.12) 0%, transparent 65%)',
                    pointerEvents: 'none'
                }} />

                <div style={{ position: 'relative', maxWidth: '620px', margin: '0 auto' }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '5px 14px',
                        background: 'rgba(19, 200, 236, 0.1)',
                        border: '1px solid rgba(19, 200, 236, 0.35)',
                        borderRadius: '50px',
                        marginBottom: '28px',
                        fontSize: '11px',
                        fontWeight: '700',
                        color: '#13c8ec',
                        letterSpacing: '0.08em'
                    }}>
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#13c8ec' }} />
                        PARA ORGANIZADORES DE EVENTOS
                    </div>

                    <h1 style={{
                        fontSize: 'clamp(30px, 8vw, 54px)',
                        fontWeight: '800',
                        margin: '0 0 20px 0',
                        lineHeight: '1.08',
                        letterSpacing: '-0.03em',
                        color: '#fff'
                    }}>
                        Gestiona reservas de tu evento{' '}
                        <span style={{ color: '#13c8ec' }}>en minutos.</span>
                    </h1>

                    <p style={{
                        fontSize: '16px',
                        color: 'rgba(255,255,255,0.6)',
                        margin: '0 0 36px 0',
                        lineHeight: '1.7',
                        maxWidth: '480px',
                        marginLeft: 'auto',
                        marginRight: 'auto'
                    }}>
                        Crea tu evento, genera un link personalizado y compártelo. Tus participantes eligen su bici y reservan al instante.
                    </p>

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <a
                            href="https://wa.me/584120557690?text=Hola%2C%20quiero%20solicitar%20AccesoBike%20para%20mi%20evento%20de%20ciclismo"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '15px 32px',
                                background: 'linear-gradient(135deg, #25d366, #1ebe5d)',
                                color: '#fff',
                                borderRadius: '50px',
                                fontWeight: '700',
                                fontSize: '16px',
                                cursor: 'pointer',
                                textDecoration: 'none',
                                boxShadow: '0 8px 30px rgba(37, 211, 102, 0.35)',
                            }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.116 1.524 5.845L.057 23.617a.75.75 0 0 0 .921.921l5.772-1.467A11.943 11.943 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.803 9.803 0 0 1-5.012-1.374l-.36-.213-3.425.871.886-3.338-.234-.374A9.818 9.818 0 0 1 2.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
                            </svg>
                            Solicitalo ya
                        </a>
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section style={{
                padding: '56px 24px',
                background: '#0d1e21',
                borderTop: '1px solid rgba(255,255,255,0.04)',
                borderBottom: '1px solid rgba(255,255,255,0.04)'
            }}>
                <div style={{ maxWidth: '700px', margin: '0 auto' }}>
                    <h2 style={{
                        textAlign: 'center',
                        fontSize: '22px',
                        fontWeight: '700',
                        color: '#fff',
                        marginBottom: '40px',
                        letterSpacing: '-0.02em'
                    }}>
                        Simple para ti. Simple para tus participantes.
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '24px' }}>
                        {[
                            {
                                num: '01',
                                title: 'Crea el evento',
                                desc: 'Configura nombre, sesiones, instructores y el diseño del mapa de bicis.'
                            },
                            {
                                num: '02',
                                title: 'Comparte el link',
                                desc: 'AccesoBike genera un link propio para tu evento. Solo compártelo.'
                            },
                            {
                                num: '03',
                                title: 'Gestiona reservas',
                                desc: 'Confirma asistencias, exporta listas en PDF y recibe alertas por WhatsApp.'
                            },
                        ].map(step => (
                            <div key={step.num} style={{
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.07)',
                                borderRadius: '16px',
                                padding: '24px 20px',
                            }}>
                                <div style={{
                                    fontSize: '11px',
                                    fontWeight: '800',
                                    color: '#13c8ec',
                                    letterSpacing: '0.1em',
                                    marginBottom: '10px'
                                }}>
                                    PASO {step.num}
                                </div>
                                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff', margin: '0 0 8px 0' }}>
                                    {step.title}
                                </h3>
                                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: '1.6' }}>
                                    {step.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features */}
            <section style={{ padding: '56px 24px', background: '#111f22' }}>
                <div style={{ maxWidth: '700px', margin: '0 auto' }}>
                    <h2 style={{
                        textAlign: 'center',
                        fontSize: '22px',
                        fontWeight: '700',
                        color: '#fff',
                        marginBottom: '36px',
                        letterSpacing: '-0.02em'
                    }}>
                        Todo lo que necesitas para tu evento
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
                        {[
                            { icon: '🔗', label: 'Link exclusivo por evento' },
                            { icon: '🗺️', label: 'Mapa visual de bicis' },
                            { icon: '📋', label: 'Exportar lista en PDF' },
                            { icon: '💬', label: 'Alertas por WhatsApp' },
                            { icon: '⚡', label: 'Reservas en tiempo real' },
                            { icon: '🎨', label: 'Tema personalizable' },
                        ].map(f => (
                            <div key={f.label} style={{
                                background: 'rgba(19, 200, 236, 0.05)',
                                border: '1px solid rgba(19, 200, 236, 0.12)',
                                borderRadius: '12px',
                                padding: '18px 14px',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '26px', marginBottom: '8px' }}>{f.icon}</div>
                                <div style={{ fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.75)', lineHeight: '1.4' }}>{f.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Active events section (if any) */}
            {events.length > 0 && (
                <section style={{
                    padding: '48px 24px 80px',
                    background: '#0d1e21',
                    borderTop: '1px solid rgba(255,255,255,0.04)'
                }}>
                    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
                        <div style={{ marginBottom: '24px', paddingLeft: '4px', borderLeft: '3px solid #13c8ec' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: '700', margin: 0, color: '#fff', letterSpacing: '-0.02em' }}>
                                Eventos en curso
                            </h2>
                            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: '4px 0 0 0' }}>
                                Copia el link y compártelo con tus participantes
                            </p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {events.map(event => {
                                const eventUrl = `${window.location.origin}/evento/${event.event_slug}`;
                                const isCopied = copiedSlug === event.event_slug;
                                return (
                                    <div
                                        key={event.id}
                                        style={{
                                            background: '#1a2c30',
                                            borderRadius: '16px',
                                            overflow: 'hidden',
                                            border: '1px solid rgba(255,255,255,0.06)',
                                        }}
                                    >
                                        {/* Image banner */}
                                        <div style={{
                                            height: '140px',
                                            position: 'relative',
                                            backgroundImage: `url(${event.event_image || 'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=1470&auto=format&fit=crop'})`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center'
                                        }}>
                                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.65) 100%)' }} />
                                            <div style={{ position: 'absolute', bottom: '14px', left: '16px', right: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                                <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0, color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.5)', letterSpacing: '-0.02em' }}>
                                                    {event.event_name}
                                                </h3>
                                                {event.start_date && (
                                                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#fff', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', padding: '3px 8px', borderRadius: '20px', whiteSpace: 'nowrap' }}>
                                                        {new Date(event.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }).toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Link row */}
                                        <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {/* URL display */}
                                            <div style={{
                                                flex: 1,
                                                background: 'rgba(0,0,0,0.25)',
                                                border: '1px solid rgba(255,255,255,0.07)',
                                                borderRadius: '8px',
                                                padding: '8px 12px',
                                                fontSize: '12px',
                                                fontFamily: 'monospace',
                                                color: 'rgba(255,255,255,0.5)',
                                                overflow: 'hidden',
                                                whiteSpace: 'nowrap',
                                                textOverflow: 'ellipsis'
                                            }}>
                                                {eventUrl}
                                            </div>

                                            {/* Copy button */}
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(eventUrl).then(() => {
                                                        setCopiedSlug(event.event_slug);
                                                        setTimeout(() => setCopiedSlug(null), 2000);
                                                    });
                                                }}
                                                title="Copiar link"
                                                style={{
                                                    flexShrink: 0,
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '5px',
                                                    padding: '8px 12px',
                                                    background: isCopied ? 'rgba(16,185,129,0.15)' : 'rgba(19,200,236,0.1)',
                                                    border: `1px solid ${isCopied ? 'rgba(16,185,129,0.4)' : 'rgba(19,200,236,0.3)'}`,
                                                    borderRadius: '8px',
                                                    color: isCopied ? '#10b981' : '#13c8ec',
                                                    fontSize: '12px',
                                                    fontWeight: '700',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    whiteSpace: 'nowrap'
                                                }}
                                            >
                                                {isCopied ? (
                                                    <>
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                                        Copiado
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                                                        Copiar
                                                    </>
                                                )}
                                            </button>

                                            {/* Open link button */}
                                            <a
                                                href={eventUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                title="Abrir evento"
                                                style={{
                                                    flexShrink: 0,
                                                    width: '36px',
                                                    height: '36px',
                                                    borderRadius: '8px',
                                                    background: 'rgba(255,255,255,0.05)',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'rgba(255,255,255,0.5)',
                                                    textDecoration: 'none',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; e.currentTarget.style.color = '#fff'; }}
                                                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                                    <polyline points="15 3 21 3 21 9" />
                                                    <line x1="10" y1="14" x2="21" y2="3" />
                                                </svg>
                                            </a>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>
            )}

            <Footer />
        </div>
    );
}

export default LandingPage;
