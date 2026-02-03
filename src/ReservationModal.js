import { useState } from 'react';
import { MdPerson, MdPhone, MdCreditCard } from 'react-icons/md';

// Helper component for input fields defined outside to prevent re-renders losing focus
const InputField = ({ name, icon: Icon, placeholder, type = 'text', value, onChange, primaryColor }) => (
  <div style={{ marginBottom: '16px' }}>
    <label style={{ display: 'block', color: '#94a3b8', fontSize: '12px', marginBottom: '6px', fontWeight: '600', marginLeft: '4px' }}>
      {placeholder}
    </label>
    <div style={{ position: 'relative' }}>
      <div style={{
        position: 'absolute',
        left: '12px',
        top: '50%',
        transform: 'translateY(-50%)',
        color: primaryColor,
        display: 'flex',
        alignItems: 'center'
      }}>
        <Icon size={20} />
      </div>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={`Ingresa tu ${placeholder.toLowerCase()}`}
        style={{
          width: '100%',
          padding: '14px 14px 14px 42px', // Space for icon
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.1)',
          fontSize: '15px',
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          color: '#fff',
          boxSizing: 'border-box',
          outline: 'none',
          transition: 'border 0.2s',
          fontWeight: '500'
        }}
        onFocus={(e) => e.target.style.borderColor = primaryColor}
        onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
      />
    </div>
  </div>
);

function ReservationModal({ isOpen, seat, rodada, onClose, onConfirm, primaryColor = '#13c8ec', secondaryColor = '#1a2c30', backgroundColor = '#111f22' }) {
  const [formData, setFormData] = useState({
    cedula: '',
    nombre: '',
    apellido: '',
    telefono: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'cedula') {
      // Remover todo lo que no sea número
      const numericValue = value.replace(/\D/g, '');

      // Si hay números, agregar el prefijo "V-"
      // Si el usuario borra todo, dejarlo vacío
      const formattedValue = numericValue ? `V-${numericValue}` : '';

      setFormData({
        ...formData,
        [name]: formattedValue
      });
    } else if (name === 'nombre' || name === 'apellido') {
      // Solo permitir letras y espacios
      const lettersOnly = value.replace(/[^a-zA-Z\s]/g, '');

      // Convertir a mayúsculas
      setFormData({
        ...formData,
        [name]: lettersOnly.toUpperCase()
      });
    } else if (name === 'telefono') {
      // Validation for phone: only numbers
      const numericValue = value.replace(/\D/g, '');
      setFormData({ ...formData, [name]: numericValue });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const resetForm = () => {
    setFormData({
      cedula: '',
      nombre: '',
      apellido: '',
      telefono: ''
    });
  };

  const handleReserve = () => {
    // Validar que todos los campos estén llenos
    if (!formData.cedula || !formData.nombre || !formData.apellido || !formData.telefono) {
      alert('Por favor completa todos los campos');
      return;
    }

    onConfirm(formData);
    resetForm(); // Limpiar formulario después de reservar
  };

  // También limpiar cuando se cierre el modal
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // No need to check isOpen here if it's controlled by parent conditional rendering as seen in SeatMap
  // But keeping it safe if used elsewhere
  // Note: SeatMap passes `onClose` and `onConfirm`. The original props had `onReserve`, mapped to `onConfirm` in SeatMap usage.
  // Updated signature to use `onConfirm` to match SeatMap usage, or `onReserve` for backward compatibility if needed.

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.8)', // Darker overlay
      backdropFilter: 'blur(4px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: secondaryColor, // Use event secondary color for modal background
        borderRadius: '24px',
        padding: '30px',
        margin: '20px',
        maxWidth: '400px',
        width: '100%',
        border: `1px solid rgba(255, 255, 255, 0.1)`,
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '25px' }}>
          <h2 style={{
            color: primaryColor, // Use event primary color for title
            fontSize: '24px',
            fontWeight: '800',
            margin: '0 0 10px 0'
          }}>
            Reservar Asiento
          </h2>
          <p style={{
            color: '#94a3b8',
            fontSize: '16px',
            margin: '0'
          }}>
            Asiento #{seat?.seat_number} - {rodada?.event_name || 'Evento'}
          </p>
        </div>

        {/* Formulario */}
        <div style={{ marginBottom: '25px' }}>
          <InputField
            name="cedula"
            icon={MdCreditCard}
            placeholder="Cédula"
            value={formData.cedula}
            onChange={handleInputChange}
            primaryColor={primaryColor}
          />
          <InputField
            name="nombre"
            icon={MdPerson}
            placeholder="Nombre"
            value={formData.nombre}
            onChange={handleInputChange}
            primaryColor={primaryColor}
          />
          <InputField
            name="apellido"
            icon={MdPerson}
            placeholder="Apellido"
            value={formData.apellido}
            onChange={handleInputChange}
            primaryColor={primaryColor}
          />
          <InputField
            name="telefono"
            icon={MdPhone}
            placeholder="Teléfono con WhatsApp"
            value={formData.telefono}
            type="tel"
            onChange={handleInputChange}
            primaryColor={primaryColor}
          />
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
              backgroundColor: 'transparent',
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
            onClick={handleReserve}
            style={{
              flex: 1,
              padding: '16px',
              borderRadius: '12px',
              border: 'none',
              fontSize: '16px',
              fontWeight: '700',
              cursor: 'pointer',
              background: primaryColor, // Use event primary color
              color: backgroundColor,   // Contrast text
              boxShadow: `0 4px 15px ${primaryColor}4D`
            }}
          >
            Reservar
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReservationModal;