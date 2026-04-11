import { useState } from 'react';

const font = "'Inter', 'SF Pro Display', system-ui, -apple-system, sans-serif";

function CustomAlert({ isOpen, onAccept, primaryColor = '#13c8ec', backgroundColor = '#111f22' }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.8)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2000,
      padding: '20px'
    }}>
      <div style={{
        background: backgroundColor,           // Fondo oscuro de la CONFIG
        borderRadius: '20px',
        padding: '36px 28px',
        maxWidth: '340px',
        width: '100%',
        border: `1.5px solid ${primaryColor}50`,  // Solo borde con el color config
        boxShadow: `0 24px 60px rgba(0,0,0,0.7), 0 0 0 1px ${primaryColor}15`,
        textAlign: 'center',
        fontFamily: font
      }}>
        {/* Ícono */}
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: `${primaryColor}18`,
          border: `1.5px solid ${primaryColor}40`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px'
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={primaryColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>

        <h3 style={{
          color: '#e2e8f0',
          fontSize: '18px',
          fontWeight: '800',
          margin: '0 0 10px',
          letterSpacing: '-0.3px',
          fontFamily: font
        }}>
          Reserva por confirmar
        </h3>

        <p style={{
          color: '#64748b',
          fontSize: '14px',
          margin: '0 0 28px',
          lineHeight: '1.6',
          fontFamily: font
        }}>
          Se abrirá WhatsApp para que puedas notificar tu pago al administrador.
        </p>

        <button
          onClick={onAccept}
          style={{
            background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)`,
            color: backgroundColor,
            border: 'none',
            borderRadius: '12px',
            padding: '13px 32px',
            fontSize: '15px',
            fontWeight: '800',
            cursor: 'pointer',
            fontFamily: font,
            boxShadow: `0 6px 20px ${primaryColor}40`,
            width: '100%',
            transition: 'transform 0.15s, box-shadow 0.15s'
          }}
          onMouseOver={e => { e.target.style.transform = 'translateY(-1px)'; }}
          onMouseOut={e => { e.target.style.transform = 'translateY(0)'; }}
        >
          Abrir WhatsApp
        </button>
      </div>
    </div>
  );
}

export default CustomAlert;