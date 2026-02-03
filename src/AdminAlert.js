function AdminAlert({ isOpen, type, title, message, onConfirm, onCancel, theme }) {
  if (!isOpen) return null;

  // Usar colores del tema si están disponibles
  const primaryColor = theme?.primaryColor || '#13c8ec';
  const secondaryColor = theme?.secondaryColor || '#1a2c30';
  const backgroundColor = theme?.backgroundColor || '#111f22';

  const getIcon = () => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'confirm': return '❓';
      default: return '💡';
    }
  };

  const getColor = () => {
    switch (type) {
      case 'success': return '#10b981';
      case 'error': return '#ef4444';
      case 'warning': return '#f59e0b';
      case 'confirm': return primaryColor;
      default: return primaryColor;
    }
  };

  const handleConfirm = () => {
    if (typeof onConfirm === 'function') {
      onConfirm();
    }
  };

  const handleCancel = () => {
    if (typeof onCancel === 'function') {
      onCancel();
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2000
    }}>
      <div style={{
        background: secondaryColor,
        borderRadius: '20px',
        padding: '40px 30px',
        margin: '20px',
        maxWidth: '400px',
        width: '90%',
        border: `2px solid ${getColor()}`,
        boxShadow: `0 25px 50px rgba(0, 0, 0, 0.7), 0 0 30px ${getColor()}30`,
        textAlign: 'center'
      }}>
        {/* Icono */}
        <div style={{
          fontSize: '48px',
          marginBottom: '20px'
        }}>
          {getIcon()}
        </div>

        {/* Título */}
        <h3 style={{
          color: getColor(),
          fontSize: '20px',
          fontWeight: '700',
          marginBottom: '15px',
          lineHeight: '1.4'
        }}>
          {title}
        </h3>
        
        {/* Mensaje */}
        <p style={{
          color: 'white',
          fontSize: '16px',
          marginBottom: '30px',
          lineHeight: '1.5'
        }}>
          {message}
        </p>

        {/* Botones */}
        <div style={{
          display: 'flex',
          gap: '15px',
          justifyContent: 'center'
        }}>
          {onCancel && (
            <button
              onClick={handleCancel}
              style={{
                background: backgroundColor,
                color: '#94a3b8',
                border: `1px solid rgba(255, 255, 255, 0.1)`,
                borderRadius: '12px',
                padding: '12px 25px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                minWidth: '100px',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.color = 'white';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.color = '#94a3b8';
              }}
            >
              Cancelar
            </button>
          )}

          <button
            onClick={handleConfirm}
            style={{
              background: getColor(),
              color: type === 'confirm' ? backgroundColor : 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 25px',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
              minWidth: '100px',
              boxShadow: `0 4px 15px ${getColor()}4D`,
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = `0 6px 20px ${getColor()}60`;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = `0 4px 15px ${getColor()}4D`;
            }}
          >
            {type === 'confirm' ? 'Confirmar' : 'Aceptar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminAlert;