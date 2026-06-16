const font = "'Inter', 'SF Pro Display', system-ui, -apple-system, sans-serif";

function AdminAlert({ isOpen, type, title, message, onConfirm, onCancel, theme, whatsappUrl }) {
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

        {/* Botón WhatsApp — tap directo, nunca bloqueado por el navegador */}
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              width: '100%', padding: '13px 20px', borderRadius: '11px', border: 'none',
              background: 'linear-gradient(135deg, #25d366, #128c4a)',
              color: 'white', fontSize: '14px', fontWeight: '800',
              cursor: 'pointer', fontFamily: font, textDecoration: 'none',
              boxShadow: '0 6px 18px rgba(37,211,102,0.35)',
              marginBottom: '10px', boxSizing: 'border-box'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Enviar por WhatsApp
          </a>
        )}

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