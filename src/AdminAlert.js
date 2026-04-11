const font = "'Inter', 'SF Pro Display', system-ui, -apple-system, sans-serif";

function AdminAlert({ isOpen, type, title, message, onConfirm, onCancel, theme }) {
  if (!isOpen) return null;

  const primaryColor = theme?.primaryColor || '#13c8ec';
  const backgroundColor = theme?.backgroundColor || '#111f22';

  const typeConfig = {
    success: { color: '#22c55e', icon: null, svg: 'check' },
    error:   { color: '#ef4444', icon: null, svg: 'x' },
    warning: { color: '#f59e0b', icon: null, svg: 'warn' },
    confirm: { color: primaryColor, icon: null, svg: 'question' },
    default: { color: primaryColor, icon: null, svg: 'question' },
  };

  const cfg = typeConfig[type] || typeConfig.default;
  const c = cfg.color;

  const IconSvg = () => {
    if (type === 'success') return (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6L9 17l-5-5" />
      </svg>
    );
    if (type === 'error') return (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    );
    if (type === 'warning') return (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    );
    // confirm / default
    return (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    );
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      backgroundColor: 'rgba(0,0,0,0.8)',
      backdropFilter: 'blur(6px)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 2000, padding: '20px'
    }}>
      <div style={{
        background: backgroundColor,          // fondo oscuro del config
        borderRadius: '20px',
        padding: '32px 28px',
        maxWidth: '380px',
        width: '100%',
        border: `1.5px solid ${c}40`,         // borde con el color del tipo
        boxShadow: `0 24px 60px rgba(0,0,0,0.7), 0 0 0 1px ${c}10`,
        textAlign: 'center',
        fontFamily: font
      }}>
        {/* Ícono SVG */}
        <div style={{
          width: '56px', height: '56px', borderRadius: '50%',
          background: `${c}15`, border: `1.5px solid ${c}35`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 18px'
        }}>
          <IconSvg />
        </div>

        {/* Título */}
        <h3 style={{
          color: '#e2e8f0', fontSize: '17px', fontWeight: '800',
          margin: '0 0 10px', fontFamily: font, letterSpacing: '-0.2px'
        }}>
          {title}
        </h3>

        {/* Mensaje */}
        <p style={{
          color: '#64748b', fontSize: '14px', margin: '0 0 26px',
          lineHeight: '1.6', fontFamily: font
        }}>
          {message}
        </p>

        {/* Botones */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          {onCancel && (
            <button
              onClick={onCancel}
              style={{
                flex: 1, padding: '12px 20px', borderRadius: '11px',
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.04)',
                color: '#94a3b8', fontSize: '14px', fontWeight: '600',
                cursor: 'pointer', fontFamily: font, transition: 'all 0.15s'
              }}
              onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#e2e8f0'; }}
              onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#94a3b8'; }}
            >
              Cancelar
            </button>
          )}

          <button
            onClick={onConfirm}
            style={{
              flex: onCancel ? 1.4 : 1,
              padding: '12px 20px', borderRadius: '11px', border: 'none',
              background: `linear-gradient(135deg, ${c}, ${c}cc)`,
              color: 'white', fontSize: '14px', fontWeight: '800',
              cursor: 'pointer', fontFamily: font,
              boxShadow: `0 6px 18px ${c}40`,
              transition: 'all 0.15s'
            }}
            onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 8px 22px ${c}55`; }}
            onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 6px 18px ${c}40`; }}
          >
            {type === 'confirm' ? 'Confirmar' : 'Aceptar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminAlert;