// Utilidades de tema: convierte los colores del panel maestro en variables CSS
// que consume src/theme.css. Todo lo demás (superficies, bordes, textos) se deriva.

export function hexToRgb(hex) {
    let h = String(hex || '').replace('#', '').trim();
    if (h.length === 3 || h.length === 4) h = h.slice(0, 3).split('').map(c => c + c).join('');
    if (h.length < 6) return null;
    const n = parseInt(h.slice(0, 6), 16);
    if (Number.isNaN(n)) return null;
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function luminance(hex) {
    const rgb = hexToRgb(hex);
    if (!rgb) return null;
    const [r, g, b] = rgb.map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Devuelve el color de texto (oscuro o blanco) con mejor contraste sobre `hex`
export function readableOn(hex) {
    const L = luminance(hex);
    if (L === null) return '#ffffff';
    return L > 0.179 ? '#0a0f12' : '#ffffff';
}

export function themeVars(theme = {}) {
    const primary = theme.primaryColor || '#13c8ec';
    const bg = theme.backgroundColor || '#111f22';
    const onBg = readableOn(bg);
    return {
        '--ab-primary': primary,
        '--ab-on-primary': readableOn(primary),
        '--ab-bg': bg,
        '--ab-on-bg': onBg,
        '--ab-scheme': onBg === '#ffffff' ? 'dark' : 'light'
    };
}
