import { useState } from 'react';
import { MdPerson, MdPhone, MdCreditCard } from 'react-icons/md';

// Helper component for input fields defined outside to prevent re-renders losing focus
const InputField = ({ name, icon: Icon, placeholder, type = 'text', value, onChange, primaryColor, showCounter, minLength, maxLength }) => {
  const isPhone = name === 'telefono';
  const currentLength = value?.length || 0;
  const isValid = !isPhone || currentLength >= (minLength || 10);
  const showWarning = isPhone && currentLength > 0 && currentLength < (minLength || 10);

  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '600', marginLeft: '4px' }}>
          {placeholder}
        </label>
        {showCounter && (
          <span style={{
            fontSize: '11px',
            fontWeight: '600',
            color: showWarning ? '#ef4444' : (currentLength >= (minLength || 10) ? '#22c55e' : '#64748b')
          }}>
            {currentLength}/{minLength || 10} dígitos {currentLength >= (minLength || 10) ? '✓' : ''}
          </span>
        )}
      </div>
      <div style={{ position: 'relative' }}>
        <div style={{
          position: 'absolute',
          left: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: showWarning ? '#ef4444' : primaryColor,
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
          maxLength={maxLength}
          style={{
            width: '100%',
            padding: '14px 14px 14px 42px',
            borderRadius: '12px',
            border: `1px solid ${showWarning ? 'rgba(239, 68, 68, 0.5)' : 'rgba(255,255,255,0.1)'}`,
            fontSize: '15px',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            color: '#fff',
            boxSizing: 'border-box',
            outline: 'none',
            transition: 'border 0.2s',
            fontWeight: '500'
          }}
          onFocus={(e) => e.target.style.borderColor = showWarning ? '#ef4444' : primaryColor}
          onBlur={(e) => e.target.style.borderColor = showWarning ? 'rgba(239, 68, 68, 0.5)' : 'rgba(255,255,255,0.1)'}
        />
      </div>
      {showWarning && (
        <p style={{ color: '#ef4444', fontSize: '11px', margin: '4px 0 0 4px', fontWeight: '500' }}>
          Faltan {(minLength || 10) - currentLength} dígitos
        </p>
      )}
    </div>
  );
};

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

    // Validar longitud mínima del teléfono (10 dígitos mínimo)
    if (formData.telefono.length < 10) {
      alert('El número de teléfono debe tener al menos 10 dígitos');
      return;
    }

    // Validar longitud máxima del teléfono (15 dígitos máximo)
    if (formData.telefono.length > 15) {
      alert('El número de teléfono no puede tener más de 15 dígitos');
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
            showCounter={true}
            minLength={10}
            maxLength={15}
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