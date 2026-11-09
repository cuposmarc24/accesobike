import { useEffect, useRef, useState, useCallback } from 'react';
import { themeVars } from './lib/theme';

const EXIT_MS = 420;
let scrollLocks = 0;

/**
 * Panel que sube desde abajo.
 * - `header`, `children` y `footer` pueden ser nodos o funciones `(close) => nodo`,
 *   para que los botones internos cierren con animación.
 * - Si `dismissible`, se cierra arrastrando hacia abajo, tocando el fondo o con Escape.
 */
function BottomSheet({ onClose, theme, header, footer, children, dismissible = true, zIndex = 1000, ariaLabel }) {
    const [open, setOpen] = useState(false);
    const sheetRef = useRef(null);
    const drag = useRef(null);
    const closing = useRef(false);
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;

    useEffect(() => {
        // Forzar el cálculo del estado inicial para que la transición de entrada se vea
        sheetRef.current?.getBoundingClientRect();
        setOpen(true);
        sheetRef.current?.focus({ preventScroll: true });
        // Contador global: varios paneles pueden solaparse al abrir/cerrar
        scrollLocks += 1;
        document.body.style.overflow = 'hidden';
        return () => {
            scrollLocks = Math.max(0, scrollLocks - 1);
            if (scrollLocks === 0) document.body.style.overflow = '';
        };
    }, []);

    const requestClose = useCallback(() => {
        if (closing.current) return;
        closing.current = true;
        setOpen(false);
        const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        setTimeout(() => onCloseRef.current && onCloseRef.current(), reduce ? 0 : EXIT_MS);
    }, []);

    useEffect(() => {
        if (!dismissible) return undefined;
        const onKey = (e) => { if (e.key === 'Escape') requestClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [dismissible, requestClose]);

    /* ── Arrastre para cerrar ── */
    const onPointerDown = (e) => {
        if (!dismissible || e.button > 0) return;
        if (e.target.closest('button, input, a, textarea, select, [role="radio"]')) return;
        drag.current = { y: e.clientY, lastY: e.clientY, lastT: performance.now(), v: 0, dy: 0 };
        sheetRef.current.classList.add('is-dragging');
        e.currentTarget.setPointerCapture && e.currentTarget.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e) => {
        const d = drag.current;
        if (!d) return;
        const now = performance.now();
        const raw = e.clientY - d.y;
        // Hacia arriba ofrece resistencia; hacia abajo sigue al dedo
        d.dy = raw > 0 ? raw : raw / 5;
        d.v = (e.clientY - d.lastY) / Math.max(1, now - d.lastT);
        d.lastY = e.clientY;
        d.lastT = now;
        sheetRef.current.style.transform = `translateY(${d.dy}px)`;
    };

    const onPointerUp = () => {
        const d = drag.current;
        if (!d) return;
        drag.current = null;
        const el = sheetRef.current;
        el.classList.remove('is-dragging');
        el.style.transform = '';
        const threshold = Math.min(140, el.offsetHeight * 0.28);
        if (d.dy > threshold || d.v > 0.55) requestClose();
    };

    const render = (slot) => (typeof slot === 'function' ? slot(requestClose) : slot);

    return (
        <div className={`ab-scope ab-sheet-root${open ? ' is-open' : ''}`} style={{ ...themeVars(theme), zIndex }}>
            <div className="ab-sheet-backdrop" onClick={dismissible ? requestClose : undefined} />
            <div ref={sheetRef} className="ab-sheet" role="dialog" aria-modal="true" aria-label={ariaLabel} tabIndex={-1}>
                <div
                    className="ab-sheet__drag"
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerCancel={onPointerUp}
                >
                    {dismissible ? <div className="ab-sheet__grabber"><span /></div> : <div style={{ height: 18 }} />}
                    {header && <div className="ab-sheet__header">{render(header)}</div>}
                </div>
                <div className="ab-sheet__body">{render(children)}</div>
                {footer && <div className="ab-sheet__footer">{render(footer)}</div>}
            </div>
        </div>
    );
}

export default BottomSheet;
