import BottomSheet from './BottomSheet';

const TONES = {
  success: '#22c55e',
  error: '#ef4444',
  warning: '#f59e0b'
};

const Icon = ({ type }) => {
  const common = { width: 28, height: 28, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.4, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (type === 'success') return <svg {...common}><path d="M20 6L9 17l-5-5" /></svg>;
  if (type === 'error') return <svg {...common}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
  if (type === 'warning') return (
    <svg {...common}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
  );
  return <svg {...common}><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>;
};

function AdminAlert({ isOpen, type, title, message, onConfirm, onCancel, theme, whatsappUrl }) {
  if (!isOpen) return null;

  const tone = TONES[type] || 'var(--ab-primary)';
  const isConfirm = type === 'confirm';

  return (
    <BottomSheet
      key={`${type}-${title}`}
      theme={theme}
      zIndex={2000}
      ariaLabel={title}
      onClose={onCancel || onConfirm}
      footer={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
          {whatsappUrl && (
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="ab-btn ab-btn--wa ab-btn--block">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Enviar por WhatsApp
            </a>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            {onCancel && (
              <button type="button" className="ab-btn ab-btn--ghost" style={{ flex: 1 }} onClick={onCancel}>Volver</button>
            )}
            <button
              type="button"
              className={`ab-btn ${whatsappUrl ? 'ab-btn--ghost' : 'ab-btn--primary'}`}
              style={{ flex: onCancel ? 1.4 : 1 }}
              onClick={onConfirm}
            >
              {isConfirm ? 'Sí, continuar' : whatsappUrl ? 'Cerrar' : 'Entendido'}
            </button>
          </div>
        </div>
      }
    >
      <div style={{ textAlign: 'center', padding: '4px 4px 0' }}>
        <div className="ab-dialog__icon" style={{ color: tone, background: `color-mix(in srgb, ${tone} 14%, transparent)`, width: 60, height: 60 }}>
          <Icon type={type} />
        </div>
        <h3 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 750, color: 'var(--ab-text)' }}>{title}</h3>
        <p style={{ margin: '0 auto', maxWidth: 360, fontSize: 15, lineHeight: 1.55, color: 'var(--ab-muted)', whiteSpace: 'pre-line' }}>{message}</p>
      </div>
    </BottomSheet>
  );
}

export default AdminAlert;
