import { useState } from 'react';

function AuctionModal({ isOpen, rodada, onClose, onSubmitBid, primaryColor = '#ffd700', secondaryColor = '#1a1a1a', backgroundColor = '#111f22' }) {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    bidAmount: '13'
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = () => {
    // Validar campos
    if (!formData.fullName || !formData.phone || !formData.bidAmount) {
      alert('Por favor completa todos los campos');
      return;
    }

    if (parseFloat(formData.bidAmount) < 13) {
      alert('El monto mínimo de subasta es $13');
      return;
    }

    onSubmitBid(formData);
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      phone: '',
      bidAmount: '13'
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: secondaryColor,
        borderRadius: '24px',
        padding: '30px',
        margin: '20px',
        maxWidth: '400px',
        width: '100%',
        border: `1px solid rgba(255, 255, 255, 0.1)`,
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.7)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '25px' }}>
          <div style={{ fontSize: '32px', marginBottom: '10px' }}>🏆</div>
          <h2 style={{
            color: primaryColor,
            fontSize: '24px',
            fontWeight: '800',
            margin: '0 0 10px 0'
          }}>
            Subasta Asiento VIP
          </h2>
          <p style={{
            color: '#94a3b8',
            fontSize: '16px',
            margin: '0'
          }}>
            {rodada?.event_name ? `${rodada.event_name}` : (rodada === 'rodada1' ? 'Rodada 1' : 'Rodada 2')}
          </p>
          <p style={{
            color: primaryColor,
            fontSize: '14px',
            margin: '10px 0 0 0',
            fontWeight: '600'
          }}>
            Monto mínimo: $13
          </p>
        </div>

        {/* Formulario */}
        <div style={{ marginBottom: '25px' }}>
          <input
            type="text"
            name="fullName"
            placeholder="Nombre Completo"
            value={formData.fullName}
            onChange={handleInputChange}
            style={{
              width: '100%',
              padding: '16px',
              marginBottom: '12px',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.1)',
              fontSize: '16px',
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              color: 'white',
              boxSizing: 'border-box',
              outline: 'none',
              transition: 'border 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = primaryColor}
            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />

          <input
            type="tel"
            name="phone"
            placeholder="Teléfono"
            value={formData.phone}
            onChange={handleInputChange}
            style={{
              width: '100%',
              padding: '16px',
              marginBottom: '12px',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.1)',
              fontSize: '16px',
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              color: 'white',
              boxSizing: 'border-box',
              outline: 'none',
              transition: 'border 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = primaryColor}
            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />

          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute',
              left: '15px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: primaryColor,
              fontSize: '16px',
              fontWeight: 'bold'
            }}>
              $
            </span>
            <input
              type="number"
              name="bidAmount"
              placeholder="13"
              min="13"
              step="0.01"
              value={formData.bidAmount}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '16px 16px 16px 35px',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.1)',
                fontSize: '16px',
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                color: 'white',
                boxSizing: 'border-box',
                outline: 'none',
                transition: 'border 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = primaryColor}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          </div>
        </div>

        {/* Botones */}
        <div style={{
          display: 'flex',
          gap: '15px'
        }}>
          <button
            onClick={handleClose}
            style={{
              flex: 1,
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.1)',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              background: 'transparent',
              color: '#94a3b8',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = 'rgba(255,255,255,0.05)';
              e.target.style.color = '#fff';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = '#94a3b8';
            }}
          >
            Cancelar
          </button>

          <button
            onClick={handleSubmit}
            style={{
              flex: 1,
              padding: '16px',
              borderRadius: '12px',
              border: 'none',
              fontSize: '16px',
              fontWeight: '700',
              cursor: 'pointer',
              background: primaryColor,
              color: backgroundColor, // Contrast text
              boxShadow: `0 8px 20px -4px ${primaryColor}66`
            }}
          >
            🏆 Enviar Subasta
          </button>
        </div>
      </div>
    </div>
  );
}

export default AuctionModal;