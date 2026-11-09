import { useState } from 'react';
import { MdOutlineCalendarToday, MdDeveloperMode } from 'react-icons/md';
import { themeVars } from './lib/theme';

const FALLBACK_FLYER = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop';
const FALLBACK_LOGO = 'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=400&auto=format&fit=crop';

/* Flyer que se muestra completo, sin recortes; el fondo es la misma imagen desenfocada */
export function Flyer({ src, alt, compact = false }) {
    const [loaded, setLoaded] = useState(false);
    const [url, setUrl] = useState(src || FALLBACK_FLYER);
    return (
        <div className={`ab-flyer${compact ? ' ab-flyer--compact' : ''}`} style={{ '--img': `url("${url}")` }}>
            <div className="ab-flyer__bg" aria-hidden="true" />
            <img
                className={`ab-flyer__img${loaded ? ' is-loaded' : ''}`}
                src={url}
                alt={alt}
                loading="lazy"
                decoding="async"
                onLoad={() => setLoaded(true)}
                onError={() => { if (url !== FALLBACK_FLYER) setUrl(FALLBACK_FLYER); }}
            />
        </div>
    );
}

// "18:30" -> { main: "6:30", suffix: "PM" }
export const splitTime = (timeStr) => {
    if (!timeStr) return { main: 'Por definir', suffix: '' };
    const m = String(timeStr).match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (!m) return { main: timeStr, suffix: '' };
    if (m[3]) return { main: `${parseInt(m[1], 10)}:${m[2]}`, suffix: m[3].toUpperCase() };
    const h = parseInt(m[1], 10);
    return { main: `${h % 12 || 12}:${m[2]}`, suffix: h >= 12 ? 'PM' : 'AM' };
};

const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

const initials = (name = '') =>
    name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';

function SessionList({ event, onSelectSession, onShowAdmin }) {
    const config = event.config || {};
    const theme = config.theme || event.theme || {};

    const displaySessions = config.sessions ? config.sessions : [
        {
            id: event.id,
            name: event.event_name || 'Entrada general',
            time: event.start_date ? new Date(event.start_date).toTimeString().slice(0, 5) : null,
            rodada: 'unique'
        }
    ];

    const eventDates = (() => {
        const fmt = (d) => new Date(d).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' });
        if (event.start_date && event.end_date && event.start_date.slice(0, 10) !== event.end_date.slice(0, 10)) {
            return `${fmt(event.start_date)} – ${fmt(event.end_date)}`;
        }
        return event.start_date ? fmt(event.start_date) : 'Fecha por confirmar';
    })();

    const count = displaySessions.length;

    return (
        <div className="ab-scope ab-page" style={themeVars(theme)}>
            <div className="ab-container">
                <header className="ab-event-head">
                    <img className="ab-event-logo" src={event.event_image || FALLBACK_LOGO} alt="" />
                    <div style={{ minWidth: 0 }}>
                        <h1 className="ab-display ab-event-title">{event.event_name}</h1>
                        <div className="ab-event-meta">
                            <MdOutlineCalendarToday size={14} aria-hidden="true" />
                            <span>{eventDates}</span>
                        </div>
                    </div>
                </header>

                <div className="ab-section-head">
                    <h2 className="ab-section-title">Elige tu rodada</h2>
                    <span className="ab-section-count">{count} {count === 1 ? 'rodada' : 'rodadas'}</span>
                </div>

                <div className="ab-session-grid">
                    {displaySessions.map((session, index) => {
                        const name = session.event_name || session.name;
                        const time = splitTime(session.time);
                        const date = session.date ? new Date(session.date + 'T12:00:00') : null;

                        const validRowPrices = (session.rowPrices || []).map(p => parseFloat(p)).filter(p => !isNaN(p) && p > 0);
                        const hasRowPrices = validRowPrices.length > 0;
                        const price = hasRowPrices ? `$${Math.min(...validRowPrices)}` : session.price;

                        const instructors = (session.instructors || []).filter(i => i?.name && i.name.trim());
                        const cols = 1 + (date ? 1 : 0) + (price ? 1 : 0);

                        return (
                            <article
                                key={session.id || index}
                                className="ab-ticket"
                                style={{ '--i': index }}
                                role="button"
                                tabIndex={0}
                                aria-label={`Elegir bici para ${name}`}
                                onClick={() => onSelectSession(session)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectSession(session); }
                                }}
                            >
                                <Flyer src={session.image || event.event_image} alt={`Flyer de ${name}`} />

                                <div className="ab-ticket__body">
                                    <h3 className="ab-display ab-ticket__title">{name}</h3>

                                    <div className="ab-stats" style={{ '--cols': cols }}>
                                        <div className="ab-stat">
                                            <span className="ab-stat__label">Hora</span>
                                            <span className="ab-stat__value">
                                                {time.main}{time.suffix && <small>{time.suffix}</small>}
                                            </span>
                                        </div>
                                        {date && (
                                            <div className="ab-stat">
                                                <span className="ab-stat__label">
                                                    {capitalize(date.toLocaleDateString('es', { weekday: 'long' }))}
                                                </span>
                                                <span className="ab-stat__value">
                                                    {date.getDate()}<small>{date.toLocaleDateString('es', { month: 'short' }).replace('.', '')}</small>
                                                </span>
                                            </div>
                                        )}
                                        {price && (
                                            <div className="ab-stat ab-stat--accent">
                                                <span className="ab-stat__label">{hasRowPrices ? 'Desde' : 'Precio'}</span>
                                                <span className="ab-stat__value">{price}</span>
                                            </div>
                                        )}
                                    </div>

                                    {instructors.length > 0 && (
                                        <div className="ab-coaches">
                                            {instructors.map((inst, i) => (
                                                <div key={i} className="ab-coach">
                                                    <span className="ab-avatar" aria-hidden="true">{initials(inst.name)}</span>
                                                    <div style={{ minWidth: 0 }}>
                                                        <span className="ab-coach__name">{inst.name}</span>
                                                        <span className="ab-coach__role">Instructor{inst.rank ? ` ${inst.rank}` : ''}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="ab-perf" aria-hidden="true" />

                                <div className="ab-ticket__stub">
                                    <span className="ab-btn ab-btn--primary ab-btn--block" aria-hidden="true">
                                        Elegir mi bici
                                    </span>
                                </div>
                            </article>
                        );
                    })}
                </div>
            </div>

            <footer className="ab-dock">
                <a className="ab-credit" href="https://wa.me/584120557690" target="_blank" rel="noopener noreferrer">
                    <MdDeveloperMode size={15} aria-hidden="true" />
                    <span>Desarrollado por <strong>TecnoAcceso</strong></span>
                </a>
                <button type="button" className="ab-icon-btn" onClick={onShowAdmin} aria-label="Acceso administrador">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                    </svg>
                </button>
            </footer>
        </div>
    );
}

export default SessionList;
