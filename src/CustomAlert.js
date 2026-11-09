import BottomSheet from './BottomSheet';

function CustomAlert({ isOpen, onAccept, primaryColor = '#13c8ec', backgroundColor = '#111f22' }) {
  if (!isOpen) return null;

  return (
    <BottomSheet
      theme={{ primaryColor, backgroundColor }}
      dismissible={false}
      zIndex={2000}
      ariaLabel="Reserva por confirmar"
      footer={
        <button type="button" className="ab-btn ab-btn--primary ab-btn--block" onClick={onAccept} autoFocus>
          Abrir WhatsApp
        </button>
      }
    >
      <div style={{ textAlign: 'center', padding: '8px 4px 4px' }}>
        <div className="ab-dialog__icon ab-dialog__icon--ok" style={{ width: 64, height: 64 }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h3 className="ab-display" style={{ fontSize: 30, margin: '0 0 10px', textTransform: 'uppercase' }}>
          Reserva por confirmar
        </h3>
        <p style={{ margin: '0 auto', maxWidth: 320, fontSize: 15, lineHeight: 1.55, color: 'var(--ab-muted)' }}>
          Abre WhatsApp y envía el mensaje para que el administrador confirme tu pago.
        </p>
      </div>
    </BottomSheet>
  );
}

export default CustomAlert;
