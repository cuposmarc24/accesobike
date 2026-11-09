import { useState, useEffect, useRef } from 'react';
import { MdPerson, MdPhone, MdCreditCard, MdCalendarToday, MdTag, MdOutlineAddPhotoAlternate, MdCheckCircle, MdClose } from 'react-icons/md';
import { supabase } from './lib/supabase';
import { themeVars } from './lib/theme';
import BottomSheet from './BottomSheet';

/* ─── Campo de texto reutilizable ─── */
const Field = ({ label, icon: Icon, adornment, placeholder, type = 'text', name, value, onChange, hint, maxLength, required, inputMode, status, help, wide }) => (
  <div className="ab-field">
    <label className="ab-label" htmlFor={`ab-${name}`}>
      <span>{label}{required && <span className="ab-req" aria-hidden="true">*</span>}</span>
      {hint && <span className="ab-label__hint">{hint}</span>}
    </label>
    <div className="ab-input-wrap">
      {(Icon || adornment) && (
        <span className="ab-input-icon" aria-hidden="true">{Icon ? <Icon size={18} /> : adornment}</span>
      )}
      <input
        id={`ab-${name}`}
        className={`ab-input${status ? ` is-${status}` : ''}${wide ? ' ab-input--wide' : ''}`}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        maxLength={maxLength}
        inputMode={inputMode}
        required={required}
        style={!Icon && !adornment ? { paddingLeft: 14 } : undefined}
      />
    </div>
    {help}
  </div>
);

/* ─── Aviso de error ─── */
const ModalAlert = ({ msg, onClose, theme }) => {
  if (!msg) return null;
  return (
    <div className="ab-scope ab-dialog-root" style={{ ...themeVars(theme), zIndex: 9999 }} onClick={onClose}>
      <div className="ab-dialog" role="alertdialog" aria-modal="true" onClick={e => e.stopPropagation()}>
        <div className="ab-dialog__icon ab-dialog__icon--danger">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <p className="ab-dialog__text">{msg}</p>
        <button type="button" className="ab-btn ab-btn--primary ab-btn--block" onClick={onClose} autoFocus>Entendido</button>
      </div>
    </div>
  );
};

/* ─── Componente Principal ─── */
function ReservationModal({ seat, rodada, session, seatPrice, onClose, onConfirm, primaryColor = '#13c8ec', backgroundColor = '#111f22', eventId }) {
  const [formData, setFormData] = useState({ cedula: '', nombre: '', apellido: '', telefono: '' });
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [rateConfig, setRateConfig] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [paymentData, setPaymentData] = useState({ monto: '', fecha: new Date().toISOString().split('T')[0], referencia: '' });
  const [captureFile, setCaptureFile] = useState(null);
  const [capturePreview, setCapturePreview] = useState(null);
  const [alertMsg, setAlertMsg] = useState('');
  const fileRef = useRef();

  const showAlert = (msg) => setAlertMsg(msg);

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

  // seatPrice (precio por fila) tiene prioridad sobre el precio general de sesión
  const sessionPrice = seatPrice || session?.price || rodada?.price || rodada?.sessions?.[0]?.price || null;

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

  // Formatea dígitos crudos al estilo venezolano: 15200 -> "152,00"
  const formatMontoVE = (digits) => {
    if (!digits) return '';
    const num = parseInt(digits, 10);
    if (isNaN(num)) return '';
    const int = Math.floor(num / 100);
    const dec = String(num % 100).padStart(2, '0');
    return `${int.toLocaleString('es-VE')},${dec}`;
  };

  const handlePaymentInput = (e) => {
    const { name, value } = e.target;
    if (name === 'monto') {
      // Guardar solo dígitos; el display se formatea al vuelo
      const digits = value.replace(/\D/g, '').replace(/^0+/, '') || '';
      setPaymentData(p => ({ ...p, monto: digits }));
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
      showAlert('Por favor completa todos los campos del formulario.');
      return;
    }
    if (formData.telefono.length < 10) {
      showAlert('El número de teléfono debe tener al menos 10 dígitos.');
      return;
    }
    if (selectedMethod && !paymentData.monto) {
      showAlert('Por favor ingresa el monto del pago.');
      return;
    }
    if (selectedMethod && paymentData.monto) {
      const expected = expectedAmount();
      if (expected) {
        const expectedNum = parseFloat(expected.replace(/[^0-9.]/g, ''));
        const enteredNum = parseInt(paymentData.monto, 10) / 100;
        const minAccepted = Math.floor(expectedNum);
        const maxAccepted = Math.ceil(expectedNum);
        if (enteredNum < minAccepted || enteredNum > maxAccepted) {
          showAlert(`El monto ingresado no es válido.\nDebe estar entre ${minAccepted.toFixed(2).replace('.', ',')} y ${maxAccepted.toFixed(2).replace('.', ',')}.`);
          return;
        }
      }
    }
    if (selectedMethod?.requires_reference && !paymentData.referencia) {
      showAlert('Este método de pago requiere número de referencia.');
      return;
    }
    const montoDecimal = paymentData.monto ? (parseInt(paymentData.monto, 10) / 100).toFixed(2) : '0.00';
    onConfirm({ ...formData, paymentMethod: selectedMethod, paymentData: { ...paymentData, monto: montoDecimal }, captureFile });
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

  const theme = { primaryColor, backgroundColor };
  const seatNumber = seat?.seat_number != null ? String(seat.seat_number).padStart(2, '0') : '–';
  const isBs = selectedMethod && ['BS', 'Bs', 'VES'].includes(selectedMethod.currency);
  const priceUSD = sessionPrice ? parseFloat(String(sessionPrice).replace(/[^0-9.]/g, '')) : NaN;

  return (
    <>
      <ModalAlert msg={alertMsg} onClose={() => setAlertMsg('')} theme={theme} />
      <BottomSheet
        theme={theme}
        onClose={handleClose}
        ariaLabel={`Reservar bici ${seatNumber}`}
        header={(close) => (
          <div className="ab-sheet-head">
            <div className="ab-seat-badge ab-display" aria-hidden="true">{seatNumber}</div>
            <div className="ab-sheet-head__text">
              <h2 className="ab-sheet-title">Reservar bici {seatNumber}</h2>
              <p className="ab-sheet-sub">{session?.event_name || session?.name || rodada?.event_name || 'Evento'}</p>
            </div>
            <button type="button" className="ab-icon-btn" onClick={close} aria-label="Cerrar">
              <MdClose size={20} />
            </button>
          </div>
        )}
        footer={(close) => (
          <>
            <button type="button" className="ab-btn ab-btn--ghost" style={{ flex: 1 }} onClick={close}>Cancelar</button>
            <button type="button" className="ab-btn ab-btn--primary" style={{ flex: 2 }} onClick={handleReserve}>
              <MdCheckCircle size={20} />
              Confirmar reserva
            </button>
          </>
        )}
      >
        {/* ── Datos personales ── */}
        <h3 className="ab-group-title">Tus datos</h3>

        <Field label="Cédula" name="cedula" icon={MdCreditCard} placeholder="V-12345678" inputMode="numeric"
          value={formData.cedula} onChange={handleInput} required />
        <Field label="Nombre" name="nombre" icon={MdPerson} placeholder="Tu nombre"
          value={formData.nombre} onChange={handleInput} required />
        <Field label="Apellido" name="apellido" icon={MdPerson} placeholder="Tu apellido"
          value={formData.apellido} onChange={handleInput} required />
        <Field
          label="WhatsApp" name="telefono" icon={MdPhone} type="tel" inputMode="tel"
          placeholder="04121234567 o +58 4121234567" maxLength={16}
          value={formData.telefono} onChange={handleInput} required
          hint={<span className="ab-num" style={{ color: phoneWarn ? 'var(--ab-danger)' : phoneOk ? 'var(--ab-ok)' : undefined }}>{phoneLength}/10</span>}
          status={phoneWarn ? 'error' : phoneOk ? 'ok' : null}
          help={phoneWarn ? (
            <p className="ab-help ab-help--error">Mínimo 10 dígitos. Si es internacional, incluye el código de país (ej: +1, +34).</p>
          ) : whatsappPreview ? (
            <p className="ab-help ab-help--ok">Te escribiremos a wa.me/<strong>{whatsappPreview}</strong></p>
          ) : null}
        />

        {/* ── Pago ── */}
        {paymentMethods.length > 0 && (
          <>
            <hr className="ab-divider" />
            <h3 className="ab-group-title">¿Cómo vas a pagar?</h3>

            <div className="ab-options" role="radiogroup" aria-label="Método de pago">
              {paymentMethods.map(pm => {
                const isActive = selectedMethod?.id === pm.id;
                return (
                  <div
                    key={pm.id}
                    role="radio"
                    aria-checked={isActive}
                    tabIndex={0}
                    className={`ab-option${isActive ? ' is-active' : ''}`}
                    onClick={() => setSelectedMethod(pm)}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedMethod(pm); } }}
                  >
                    <span className="ab-radio" aria-hidden="true" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="ab-option__top">
                        <span className="ab-option__name">{pm.name}</span>
                        {pm.currency && <span className="ab-tag">{pm.currency}</span>}
                      </div>
                      {pm.description && <p className="ab-option__desc">{pm.description}</p>}
                    </div>
                  </div>
                );
              })}
            </div>

            {sessionPrice && !isNaN(priceUSD) && (
              <div className="ab-total">
                <span className="ab-total__label">Total a pagar</span>
                <span className="ab-total__value">
                  ${priceUSD.toFixed(2)}
                  {isBs && convertToBs(sessionPrice) && (
                    <span className="ab-total__alt">≈ Bs {convertToBs(sessionPrice)}</span>
                  )}
                </span>
              </div>
            )}

            {selectedMethod && (
              <>
                <h3 className="ab-group-title">Datos del pago</h3>

                <Field
                  label="Monto pagado" name="monto" inputMode="numeric" placeholder="0,00" required
                  adornment={currencySymbol(selectedMethod?.currency)}
                  value={formatMontoVE(paymentData.monto)} onChange={handlePaymentInput}
                />

                <Field label="Fecha del pago" name="fecha" icon={MdCalendarToday} type="date" required
                  value={paymentData.fecha} onChange={handlePaymentInput} />

                {selectedMethod.requires_reference && (
                  <Field
                    label="Referencia" name="referencia" icon={MdTag} hint="Últimos 6 dígitos"
                    inputMode="numeric" placeholder="123456" maxLength={6} required wide
                    value={paymentData.referencia} onChange={handlePaymentInput}
                  />
                )}

                <div className="ab-field" style={{ marginBottom: 0 }}>
                  <span className="ab-label">Comprobante</span>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleCapture} style={{ display: 'none' }} />
                  {capturePreview ? (
                    <div className="ab-proof">
                      <img src={capturePreview} alt="Comprobante de pago" />
                      <button
                        type="button"
                        className="ab-btn"
                        onClick={() => { setCaptureFile(null); setCapturePreview(null); fileRef.current.value = ''; }}
                      >
                        Quitar
                      </button>
                    </div>
                  ) : (
                    <button type="button" className="ab-drop" onClick={() => fileRef.current.click()}>
                      <MdOutlineAddPhotoAlternate size={26} aria-hidden="true" />
                      Subir captura del pago
                    </button>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </BottomSheet>
    </>
  );
}

export default ReservationModal;
