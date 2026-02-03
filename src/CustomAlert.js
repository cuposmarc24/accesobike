import { useState } from 'react';

function CustomAlert({ isOpen, message, onAccept, primaryColor = '#00ff41', secondaryColor = '#1a1a1a', backgroundColor = '#111f22' }) {
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
      zIndex: 2000
    }}>
      <div style={{
        background: secondaryColor,
        borderRadius: '24px',
        padding: '40px 30px',
        margin: '20px',
        maxWidth: '350px',
        width: '100%',
        border: `2px solid ${primaryColor}4D`, // Opacity 30%
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.7)',
        textAlign: 'center'
      }}>
        {/* Icono */}
        <div style={{
          fontSize: '48px',
          marginBottom: '20px'
        }}>
          ✅
        </div>

        {/* Mensaje */}
        <h3 style={{
          color: primaryColor,
          fontSize: '20px',
          fontWeight: '700',
          marginBottom: '15px',
          lineHeight: '1.4'
        }}>
          Reserva por confirmar
        </h3>

        <p style={{
          color: '#94a3b8', // Consistent text color
          fontSize: '16px',
          marginBottom: '30px',
          lineHeight: '1.5'
        }}>
          Se abrirá WhatsApp para que notifiques tu reservación.
        </p>

        {/* Botón */}
        <button
          onClick={onAccept}
          style={{
            background: primaryColor,
            color: backgroundColor,
            border: 'none',
            borderRadius: '16px',
            padding: '16px 30px',
            fontSize: '18px',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: `0 8px 20px ${primaryColor}66`,
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = `0 12px 25px ${primaryColor}80`;
          }}
          onMouseOut={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = `0 8px 20px ${primaryColor}66`;
          }}
        >
          Aceptar
        </button>
      </div>
    </div>
  );
}

export default CustomAlert;