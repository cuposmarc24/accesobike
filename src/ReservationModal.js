import { useState, useEffect, useRef } from 'react';
import { MdPerson, MdPhone, MdCreditCard, MdCalendarToday, MdAttachMoney, MdTag, MdImage, MdCheckCircle } from 'react-icons/md';
import { supabase } from './lib/supabase';

/* ─── Estilos globales de tipografía ─── */
const font = "'Inter', 'SF Pro Display', system-ui, -apple-system, sans-serif";

/* ─── Campo de texto reutilizable ─── */
const Field = ({ label, icon: Icon, placeholder, type = 'text', name, value, onChange, hint, primaryColor, maxLength, required }) => {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: '14px' }}>
      <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
        <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: font }}>
          {label}{required && <span style={{ color: '#ef4444', marginLeft: '2px' }}>*</span>}
        </span>
        {hint && <span style={{ fontSize: '10px', color: focused ? '#94a3b8' : '#475569', fontFamily: font }}>{hint}</span>}
      </label>
      <div style={{ position: 'relative' }}>
        {Icon && (
          <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: focused ? primaryColor : '#475569', transition: 'color 0.2s' }}>
            <Icon size={16} />
          </div>
        )}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          maxLength={maxLength}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%',
            padding: `11px 12px 11px ${Icon ? '36px' : '12px'}`,
            borderRadius: '10px',
            border: `1.5px solid ${focused ? primaryColor + '80' : 'rgba(255,255,255,0.08)'}`,
            background: focused ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.03)',
            color: '#e2e8f0',
            fontSize: '14px',
            fontFamily: font,
            fontWeight: '500',
            boxSizing: 'border-box',
            outline: 'none',
            transition: 'border 0.2s, background 0.2s',
            caretColor: primaryColor
          }}
        />
      </div>
    </div>
  );
};

/* ─── Componente Principal ─── */
function ReservationModal({ seat, rodada, session, onClose, onConfirm, primaryColor = '#13c8ec', secondaryColor = '#1a2c30', backgroundColor = '#111f22', eventId, sessionId }) {
  const [formData, setFormData] = useState({ cedula: '', nombre: '', apellido: '', telefono: '' });
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [rateConfig, setRateConfig] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [paymentData, setPaymentData] = useState({ monto: '', fecha: new Date().toISOString().split('T')[0], referencia: '' });
  const [captureFile, setCaptureFile] = useState(null);
  const [capturePreview, setCapturePreview] = useState(null);
  const fileRef = useRef();

  useEffect(() => {
    if (!eventId) return;
    fetchPaymentInfo();
  }, [eventId]);

  const fetchPaymentInfo = async () => {
    try {
      console.log('💳 Buscando métodos de pago para eventId:', eventId);
      const [pmRes, settingsRes] = await Promise.all([
        supabase.from('payment_methods').select('*').eq('event_id', eventId).order('created_at'),
        supabase.from('event_settings').select('*').eq('event_id', eventId).maybeSingle()
      ]);
      console.log('💳 Resultado:', pmRes.data, '| Error:', pmRes.error);
      const methods = pmRes.data || [];
      setPaymentMethods(methods);
      if (methods.length === 1) setSelectedMethod(methods[0]); // auto-select if only one
      setRateConfig(settingsRes.data || null);
    } catch (e) {
      console.error('Error fetching payment info:', e);
    }
  };

  const convertToBs = (priceUSD) => {
    if (!rateConfig || !priceUSD) return null;
    const rate = parseFloat(rateConfig.rate_value);
    if (!rate) return null;
    const priceNum = parseFloat(String(priceUSD).replace(/[^0-9.]/g, ''));
    return isNaN(priceNum) ? null : (priceNum * rate).toFixed(2);
  };

  // Precio: session prop tiene prioridad, luego rodada
  const sessionPrice = session?.price || rodada?.price || rodada?.sessions?.[0]?.price || null;

  /* ── Handlers ── */
  const handleInput = (e) => {
    const { name, value } = e.target;
    if (name === 'cedula') {
      const num = value.replace(/\D/g, '');
      setFormData(p => ({ ...p, cedula: num ? `V-${num}` : '' }));
    } else if (name === 'nombre' || name === 'apellido') {
      setFormData(p => ({ ...p, [name]: value.replace(/[^a-zA-ZÀ-ÿ\s]/g, '').toUpperCase() }));
    } else if (name === 'telefono') {
      // Permitir + al inicio (código de país) y solo dígitos después
      const raw = value.replace(/[^\d+]/g, '');
      const clean = raw.startsWith('+') ? '+' + raw.slice(1).replace(/\D/g, '') : raw.replace(/\D/g, '');
      setFormData(p => ({ ...p, telefono: clean }));
    } else {
      setFormData(p => ({ ...p, [name]: value }));
    }
  };

  const handlePaymentInput = (e) => {
    const { name, value } = e.target;
    if (name === 'monto') {
      // Numérico con punto decimal (ej: 25.50)
      const clean = value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
      setPaymentData(p => ({ ...p, monto: clean }));
    } else if (name === 'referencia') {
      // Solo dígitos
      setPaymentData(p => ({ ...p, referencia: value.replace(/\D/g, '') }));
    } else {
      setPaymentData(p => ({ ...p, [name]: value }));
    }
  };

  // Símbolo de moneda según el método seleccionado
  const currencySymbol = (currency) => {
    if (!currency) return '$';
    if (currency === 'BS' || currency === 'Bs' || currency === 'VES') return 'Bs';
    if (currency === 'EUR') return '€';
    return '$';
  };

  // Monto esperado en la moneda del método seleccionado
  const expectedAmount = () => {
    if (!sessionPrice || !selectedMethod) return null;
    const sym = currencySymbol(selectedMethod.currency);
    const priceNum = parseFloat(String(sessionPrice).replace(/[^0-9.]/g, ''));
    if (isNaN(priceNum)) return null;
    if (sym === 'Bs' && rateConfig) {
      const rate = parseFloat(rateConfig.rate_value);
      return rate ? `Bs ${(priceNum * rate).toFixed(2)}` : null;
    }
    if (sym === '$') return `$${priceNum.toFixed(2)}`;
    if (sym === '€') return `€${priceNum.toFixed(2)}`;
    return null;
  };

  const handleCapture = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCaptureFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setCapturePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleReserve = () => {
    if (!formData.cedula || !formData.nombre || !formData.apellido || !formData.telefono) {
      alert('Por favor completa todos los campos del formulario');
      return;
    }
    if (formData.telefono.length < 10) {
      alert('El número de teléfono debe tener al menos 10 dígitos');
      return;
    }
    if (selectedMethod && !paymentData.monto) {
      alert('Por favor ingresa el monto del pago');
      return;
    }
    if (selectedMethod?.requires_reference && !paymentData.referencia) {
      alert('Este método de pago requiere número de referencia');
      return;
    }
    onConfirm({ ...formData, paymentMethod: selectedMethod, paymentData, captureFile });
    resetAll();
  };

  const resetAll = () => {
    setFormData({ cedula: '', nombre: '', apellido: '', telefono: '' });
    setPaymentData({ monto: '', fecha: new Date().toISOString().split('T')[0], referencia: '' });
    setSelectedMethod(paymentMethods.length === 1 ? paymentMethods[0] : null);
    setCaptureFile(null);
    setCapturePreview(null);
  };

  const handleClose = () => { resetAll(); onClose(); };

  // Número limpio (solo dígitos) para contar y validar
  const phoneDigits = formData.telefono.replace(/\D/g, '');
  const phoneLength = phoneDigits.length;
  const phoneOk = phoneLength >= 10;
  const phoneWarn = formData.telefono.length > 0 && !phoneOk;

  // Número normalizado para WhatsApp: quitar + y espacios → wa.me/XXXX
  const whatsappPreview = phoneOk
    ? formData.telefono.replace(/[^\d]/g, '') // solo dígitos, sin +
    : null;

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
      zIndex: 1000,
      padding: '16px',
      overflowY: 'auto'
    }}>
      <div style={{
        background: backgroundColor,
        borderRadius: '20px',
        width: '100%',
        maxWidth: '400px',
        marginTop: '16px',
        marginBottom: '16px',
        border: `1.5px solid ${primaryColor}40`,
        boxShadow: `0 24px 60px rgba(0,0,0,0.6)`,
        fontFamily: font,
        overflow: 'hidden'
      }}>

        {/* ── Header ── */}
        <div style={{ padding: '22px 24px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: primaryColor, letterSpacing: '-0.4px', fontFamily: font }}>
            Reservar Asiento
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b', fontFamily: font }}>
            Bici #{seat?.seat_number} · {rodada?.event_name || 'Evento'}
          </p>
        </div>

        <div style={{ padding: '20px 24px 24px' }}>

          {/* ── Sección: Datos personales ── */}
          <p style={{ fontSize: '10px', fontWeight: '700', color: '#475569', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 12px', fontFamily: font }}>
            Datos del reservante
          </p>

          <Field label="Cédula" name="cedula" icon={MdCreditCard} placeholder="Ej: V-12345678" value={formData.cedula} onChange={handleInput} primaryColor={primaryColor} required />
          <Field label="Nombre" name="nombre" icon={MdPerson} placeholder="Tu nombre" value={formData.nombre} onChange={handleInput} primaryColor={primaryColor} required />
          <Field label="Apellido" name="apellido" icon={MdPerson} placeholder="Tu apellido" value={formData.apellido} onChange={handleInput} primaryColor={primaryColor} required />

          {/* Teléfono con counter y preview WhatsApp */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
              <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: font }}>
                WhatsApp <span style={{ color: '#ef4444' }}>*</span>
              </span>
              <span style={{ fontSize: '10px', fontWeight: '700', color: phoneWarn ? '#ef4444' : phoneOk ? '#22c55e' : '#475569', fontFamily: font }}>
                {phoneLength}/10 {phoneOk ? '✓' : ''}
              </span>
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: phoneWarn ? '#ef4444' : '#475569' }}>
                <MdPhone size={16} />
              </div>
              <input
                type="tel" name="telefono" value={formData.telefono} onChange={handleInput}
                placeholder="+58 4121234567 o 04121234567" maxLength={16}
                style={{
                  width: '100%', padding: '11px 12px 11px 36px', borderRadius: '10px', boxSizing: 'border-box',
                  border: `1.5px solid ${phoneWarn ? '#ef444460' : phoneOk ? '#22c55e40' : 'rgba(255,255,255,0.08)'}`,
                  background: 'rgba(255,255,255,0.03)', color: '#e2e8f0', fontSize: '14px',
                  fontFamily: font, fontWeight: '500', outline: 'none'
                }}
              />
            </div>
            {phoneWarn && (
              <p style={{ margin: '4px 0 0 2px', fontSize: '11px', color: '#ef4444', fontFamily: font }}>
                Mínimo 10 dígitos. Incluye código de país si es internacional (ej: +1, +34)
              </p>
            )}
            {whatsappPreview && (
              <p style={{ margin: '4px 0 0 2px', fontSize: '11px', color: '#22c55e', fontFamily: font, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>✓</span>
                <span>wa.me/<strong>{whatsappPreview}</strong></span>
              </p>
            )}
          </div>

          {/* ── Sección: Pago ── */}
          {paymentMethods.length > 0 && (
            <>
              <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '4px 0 18px' }} />
              <p style={{ fontSize: '10px', fontWeight: '700', color: '#475569', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 10px', fontFamily: font }}>
                Método de pago
              </p>

              {/* Selección de método */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {paymentMethods.map(pm => {
                  const isActive = selectedMethod?.id === pm.id;
                  return (
                    <div
                      key={pm.id}
                      onClick={() => setSelectedMethod(pm)}
                      style={{
                        borderRadius: '12px',
                        border: `1.5px solid ${isActive ? primaryColor + '80' : 'rgba(255,255,255,0.07)'}`,
                        background: isActive ? `${primaryColor}0D` : 'rgba(255,255,255,0.02)',
                        padding: '12px 14px',
                        cursor: 'pointer',
                        transition: 'all 0.18s',
                        display: 'flex', alignItems: 'flex-start', gap: '12px'
                      }}
                    >
                      {/* Radio */}
                      <div style={{
                        width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0, marginTop: '1px',
                        border: `2px solid ${isActive ? primaryColor : 'rgba(255,255,255,0.2)'}`,
                        background: isActive ? primaryColor : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s'
                      }}>
                        {isActive && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: backgroundColor }} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap' }}>
                          <span style={{ color: '#e2e8f0', fontSize: '14px', fontWeight: '700', fontFamily: font }}>{pm.name}</span>
                          <span style={{
                            fontSize: '10px', fontWeight: '700', color: primaryColor,
                            background: `${primaryColor}18`, border: `1px solid ${primaryColor}30`,
                            borderRadius: '20px', padding: '1px 7px', fontFamily: font
                          }}>{pm.currency}</span>
                        </div>
                        {pm.description && (
                          <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#64748b', fontFamily: font, lineHeight: '1.4' }}>{pm.description}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Indicador de monto a pagar - junto a métodos de pago */}
              {sessionPrice && (
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: font }}>
                    A pagar:
                  </span>
                  {/* Precio en USD */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px', padding: '5px 10px'
                  }}>
                    <span style={{ fontSize: '10px', color: '#64748b', fontFamily: font, fontWeight: '600' }}>USD</span>
                    <span style={{ fontSize: '14px', color: '#e2e8f0', fontWeight: '800', fontFamily: font }}>
                      ${parseFloat(String(sessionPrice).replace(/[^0-9.]/g, '')).toFixed(2)}
                    </span>
                  </div>

                  {/* Conversión Bs - solo cuando el método seleccionado es en Bs */}
                  {selectedMethod && (selectedMethod.currency === 'BS' || selectedMethod.currency === 'Bs' || selectedMethod.currency === 'VES') && convertToBs(sessionPrice) && (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', color: '#475569', fontSize: '12px' }}>≈</div>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '5px',
                        background: `${primaryColor}12`, border: `1px solid ${primaryColor}30`,
                        borderRadius: '8px', padding: '5px 10px'
                      }}>
                        <span style={{ fontSize: '10px', color: primaryColor, fontFamily: font, fontWeight: '600' }}>BS</span>
                        <span style={{ fontSize: '14px', color: primaryColor, fontWeight: '800', fontFamily: font }}>
                          {convertToBs(sessionPrice)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Campos del pago */}
              {selectedMethod && (
                <div style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '14px',
                  padding: '16px',
                  marginBottom: '4px'
                }}>
                  <p style={{ margin: '0 0 12px', fontSize: '10px', fontWeight: '700', color: '#475569', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: font }}>
                    Datos de pago
                  </p>

                  {/* ── Monto con indicador de moneda ── */}
                  <div style={{ marginBottom: '14px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: font, display: 'block', marginBottom: '6px' }}>
                      Monto <span style={{ color: '#ef4444' }}>*</span>
                    </span>

                    {/* Input con símbolo de la moneda del método */}
                    <div style={{ position: 'relative' }}>
                      <div style={{
                        position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                        color: primaryColor, fontSize: '13px', fontWeight: '800', fontFamily: font,
                        pointerEvents: 'none', userSelect: 'none'
                      }}>
                        {currencySymbol(selectedMethod?.currency)}
                      </div>
                      <input
                        type="text" inputMode="numeric" pattern="[0-9]*"
                        name="monto" value={paymentData.monto} onChange={handlePaymentInput}
                        placeholder={expectedAmount() ? expectedAmount().replace(/[^0-9.]/g, '') : '0'}
                        style={{
                          width: '100%', padding: '11px 12px 11px 36px', borderRadius: '10px', boxSizing: 'border-box',
                          border: `1.5px solid rgba(255,255,255,0.08)`, background: 'rgba(255,255,255,0.03)',
                          color: '#e2e8f0', fontSize: '14px', fontFamily: font, fontWeight: '600',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  {/* Fecha */}
                  <Field label="Fecha de pago" name="fecha" icon={MdCalendarToday}
                    type="date" placeholder=""
                    value={paymentData.fecha} onChange={handlePaymentInput} primaryColor={primaryColor} required />

                  {/* Referencia — solo si requerida, solo 6 dígitos */}
                  {selectedMethod.requires_reference && (
                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ display: 'block', marginBottom: '5px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: font }}>
                          Referencia <span style={{ color: '#94a3b8', fontWeight: '500', textTransform: 'none', letterSpacing: 0, fontSize: '10px' }}>(últimos 6 dígitos)</span> <span style={{ color: '#ef4444' }}>*</span>
                        </span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#475569' }}>
                          <MdTag size={16} />
                        </div>
                        <input
                          type="text" inputMode="numeric" pattern="[0-9]*"
                          name="referencia" value={paymentData.referencia} onChange={handlePaymentInput}
                          placeholder="123456" maxLength={6}
                          style={{
                            width: '100%', padding: '11px 12px 11px 36px', borderRadius: '10px', boxSizing: 'border-box',
                            border: `1.5px solid rgba(255,255,255,0.08)`, background: 'rgba(255,255,255,0.03)',
                            color: '#e2e8f0', fontSize: '14px', fontFamily: font, fontWeight: '600',
                            outline: 'none', letterSpacing: '0.1em'
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Captura */}
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: '6px', fontFamily: font }}>
                      Comprobante / Captura
                    </label>
                    <input ref={fileRef} type="file" accept="image/*" onChange={handleCapture} style={{ display: 'none' }} />

                    {capturePreview ? (
                      <div style={{ position: 'relative' }}>
                        <img src={capturePreview} alt="Comprobante" style={{ width: '100%', borderRadius: '10px', maxHeight: '160px', objectFit: 'cover', border: `1px solid ${primaryColor}40` }} />
                        <button
                          onClick={() => { setCaptureFile(null); setCapturePreview(null); fileRef.current.value = ''; }}
                          style={{
                            position: 'absolute', top: '6px', right: '6px',
                            background: 'rgba(0,0,0,0.7)', color: '#ef4444',
                            border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px',
                            padding: '3px 8px', fontSize: '11px', cursor: 'pointer', fontFamily: font
                          }}>✕ Quitar</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => fileRef.current.click()}
                        style={{
                          width: '100%', padding: '12px',
                          borderRadius: '10px',
                          border: `1.5px dashed ${primaryColor}40`,
                          background: 'transparent',
                          color: '#64748b', fontSize: '13px', fontWeight: '500',
                          cursor: 'pointer', fontFamily: font,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                        }}
                      >
                        <MdImage size={18} color={primaryColor} />
                        Subir captura / foto del comprobante
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── Botones ── */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button onClick={handleClose} style={{
              flex: 1, padding: '13px', borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'transparent', color: '#64748b',
              fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: font,
              transition: 'all 0.15s'
            }}
              onMouseOver={e => { e.target.style.background = 'rgba(255,255,255,0.05)'; e.target.style.color = '#94a3b8'; }}
              onMouseOut={e => { e.target.style.background = 'transparent'; e.target.style.color = '#64748b'; }}
            >
              Cancelar
            </button>
            <button onClick={handleReserve} style={{
              flex: 2, padding: '13px', borderRadius: '10px',
              border: 'none',
              background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)`,
              color: backgroundColor, fontSize: '14px', fontWeight: '800',
              cursor: 'pointer', fontFamily: font,
              boxShadow: `0 4px 20px ${primaryColor}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
            }}>
              <MdCheckCircle size={18} />
              Confirmar Reserva
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReservationModal;