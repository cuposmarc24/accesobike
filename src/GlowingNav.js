import { useRef, useEffect, useCallback } from 'react';

/**
 * GlowingNav — replica exacta del efecto "Glowing Tab Navigation"
 * El pill activo se desliza con CSS custom properties animadas.
 * El color del glow usa primaryColor del config del evento.
 */
function GlowingNav({ items, activeKey, onChange, primaryColor = '#13c8ec', backgroundColor = '#111f22' }) {
  const navRef = useRef(null);
  const listRef = useRef(null);

  // Convierte hex a rgb para usar en rgba()
  const hexToRgb = useCallback((hex) => {
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `${r}, ${g}, ${b}`;
  }, []);

  const rgb = hexToRgb(primaryColor);
  const bgRgb = hexToRgb(backgroundColor);

  // Actualiza las CSS custom properties del nav según el li activo
  const updateActivePill = useCallback((liEl) => {
    const nav = navRef.current;
    if (!nav || !liEl) return;
    const navRect = nav.getBoundingClientRect();
    const liRect = liEl.getBoundingClientRect();
    const offsetLeft = liRect.left - navRect.left;
    nav.style.setProperty('--pill-x', `${offsetLeft}px`);
    nav.style.setProperty('--pill-w', `${liRect.width}px`);
    nav.style.setProperty('--glow-x', `${offsetLeft + liRect.width / 2}px`);
  }, []);

  // Mueve el pill cuando cambia la tab activa o al resize
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const activeLi = nav.querySelector(`[data-key="${activeKey}"]`);
    updateActivePill(activeLi);
  }, [activeKey, updateActivePill]);

  useEffect(() => {
    const onResize = () => {
      const nav = navRef.current;
      if (!nav) return;
      const activeLi = nav.querySelector(`[data-key="${activeKey}"]`);
      updateActivePill(activeLi);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [activeKey, updateActivePill]);

  // Tilt effect al mover el mouse sobre un ítem
  const handleMouseMove = useCallback((e, liEl) => {
    const rect = liEl.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const tiltY = -((x - rect.width / 2) / rect.width) * 12;
    const tiltX = ((y - rect.height / 2) / rect.height) * 6;
    liEl.style.setProperty('--tilt-x', `${tiltX}deg`);
    liEl.style.setProperty('--tilt-y', `${tiltY}deg`);
  }, []);

  const handleMouseLeave = useCallback((liEl) => {
    liEl.style.setProperty('--tilt-x', '0deg');
    liEl.style.setProperty('--tilt-y', '0deg');
  }, []);

  const cssVars = `
    --pill-x: 0px;
    --pill-w: 80px;
    --glow-x: 40px;
    --easing: cubic-bezier(.41, -0.09, .55, 1.09);
    --dur: 300ms;
    --delay: 60ms;
  `;

  return (
    <>
      <style>{`
        .gn-nav {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 200;
          border-radius: 100px;
          ${cssVars}
        }

        /* Glow externo debajo del pill activo */
        .gn-nav::before {
          content: '';
          position: absolute;
          width: var(--pill-w);
          height: 100%;
          left: 0;
          top: 0;
          border-radius: 100px;
          background: rgba(${rgb}, 0.18);
          filter: blur(18px);
          transform: translateX(var(--pill-x)) scale(1.1);
          transition: transform var(--dur) var(--easing) var(--delay),
                      width var(--dur) var(--easing) var(--delay);
          pointer-events: none;
        }

        .gn-list {
          position: relative;
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          align-items: center;
          height: 58px;
          border-radius: 100px;
          /* Borde semitransparente con color del config */
          background-image: radial-gradient(
            ellipse 140px 80px at var(--glow-x) bottom,
            rgba(${rgb}, 0.35) 0%,
            rgba(${rgb}, 0.05) 100%
          );
          transition: background-image var(--dur) var(--easing) var(--delay);
        }

        /* Fondo semitransparente interior usando backgroundColor del config */
        .gn-list::before {
          content: '';
          position: absolute;
          width: calc(100% - 2px);
          height: calc(100% - 2px);
          background: rgba(${bgRgb}, 0.55);
          top: 1px;
          left: 1px;
          border-radius: 100px;
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
        }

        /* Pill activo deslizante */
        .gn-list::after {
          content: '';
          position: absolute;
          z-index: 1;
          width: calc(var(--pill-w) - 12px);
          height: calc(100% - 12px);
          left: 6px;
          top: 6px;
          border-radius: 100px;
          background: linear-gradient(
            to bottom,
            rgba(${rgb}, 0.22) 0%,
            rgba(${rgb}, 0.08) 100%
          );
          box-shadow:
            inset 0 -5px 14px rgba(${rgb}, 0.25),
            inset 0 1px 0 rgba(255,255,255,0.10);
          transform: translateX(var(--pill-x));
          transition:
            transform var(--dur) var(--easing) var(--delay),
            width var(--dur) var(--easing) var(--delay);
          pointer-events: none;
        }

        .gn-item {
          padding: 0;
          height: 100%;
          position: relative;
          z-index: 2;
          flex-shrink: 0;
          transform-style: preserve-3d;
          perspective: 800px;
        }

        /* Shimmer hover en ítems inactivos */
        .gn-item:not(.gn-active):hover::before {
          opacity: 0.25;
        }
        .gn-item::before {
          content: '';
          position: absolute;
          z-index: 1;
          inset: 0;
          border-radius: 8px;
          background: linear-gradient(to bottom, rgba(255,255,255,0.04), rgba(255,255,255,0.25));
          opacity: 0;
          pointer-events: none;
          transform: scale(0.85) rotateY(var(--tilt-y, 0deg)) rotateX(var(--tilt-x, 0deg)) translateZ(15px);
          transition: opacity 300ms var(--easing);
        }

        .gn-item:first-child::before { border-radius: 100px 8px 8px 100px; }
        .gn-item:last-child::before  { border-radius: 8px 100px 100px 8px; }

        .gn-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          height: 100%;
          padding: 0 22px;
          background: none;
          border: none;
          cursor: pointer;
          color: #3d5060;
          font-size: 14px;
          font-weight: 500;
          font-family: Inter, sans-serif;
          letter-spacing: 0.1px;
          position: relative;
          z-index: 10;
          white-space: nowrap;
          transition: color 200ms ease;
        }

        .gn-active .gn-btn {
          color: rgba(${rgb}, 1);
          font-weight: 650;
          text-shadow: 0 0 12px rgba(${rgb}, 0.6);
        }

        .gn-badge {
          position: absolute;
          top: 8px;
          right: 12px;
          background: #ef4444;
          color: white;
          border-radius: 50%;
          width: 15px;
          height: 15px;
          font-size: 9px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 6px rgba(239,68,68,0.7);
          z-index: 20;
        }
      `}</style>

      <nav ref={navRef} className="gn-nav">
        <ul ref={listRef} className="gn-list">
          {items.map((item) => {
            const isActive = item.key === activeKey;
            return (
              <li
                key={item.key}
                data-key={item.key}
                className={`gn-item${isActive ? ' gn-active' : ''}`}
                onMouseMove={(e) => handleMouseMove(e, e.currentTarget)}
                onMouseLeave={(e) => handleMouseLeave(e.currentTarget)}
              >
                <button
                  className="gn-btn"
                  onClick={() => onChange(item.key)}
                >
                  {item.label}
                </button>
                {item.badge > 0 && (
                  <div className="gn-badge">
                    {item.badge > 9 ? '9+' : item.badge}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}

export default GlowingNav;
