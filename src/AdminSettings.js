import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';

// ExchangeRate-API — clave gratuita con 1500 req/mes
// Endpoint: https://v6.exchangerate-api.com/v6/{KEY}/latest/USD
// Usamos la versión sin clave (open) que no requiere registro:
// https://open.er-api.com/v6/latest/USD
const ER_API = 'https://open.er-api.com/v6/latest/USD';

function AdminSettings({ eventId, primaryColor, secondaryColor, backgroundColor }) {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  const [rates, setRates] = useState({ VES: null, EUR: null, lastUpdate: null });
  const [loadingRates, setLoadingRates] = useState(true);
  const [ratesError, setRatesError] = useState(false);
  const [selectedRate, setSelectedRate] = useState(null);
  const [manualRate, setManualRate] = useState('');
  const [savedRateConfig, setSavedRateConfig] = useState(null);
  const [savingRate, setSavingRate] = useState(false);

  const [formData, setFormData] = useState({
    name: '', description: '', currency: 'USD', requires_reference: false
  });

  useEffect(() => {
    fetchPaymentMethods();
    fetchExchangeRates();
    fetchSavedRateConfig();
  }, [eventId]);

  // ── Métodos de pago ──
  const fetchPaymentMethods = async () => {
    setLoadingPayments(true);
    try {
      const { data } = await supabase
        .from('payment_methods').select('*')
        .eq('event_id', eventId).order('created_at');
      setPaymentMethods(data || []);
    } catch (e) { console.error(e); }
    finally { setLoadingPayments(false); }
  };

  // ── ExchangeRate-API ──
  const fetchExchangeRates = async () => {
    setLoadingRates(true);
    setRatesError(false);
    try {
      const res = await fetch(ER_API);
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      // data.rates tiene el valor de 1 USD en cada moneda
      setRates({
        VES: data.rates?.VES ?? null,   // Bolívar venezolano
        EUR: data.rates?.EUR ?? null,   // Euro (para calcular VES/EUR via USD)
        lastUpdate: data.time_last_update_utc ?? null
      });
    } catch (e) {
      console.error('ExchangeRate API error:', e);
      setRatesError(true);
    } finally {
      setLoadingRates(false);
    }
  };

  // Tasa EUR → VES: si 1 USD = X VES y 1 USD = Y EUR, entonces 1 EUR = X/Y VES
  const eurToVes = rates.VES && rates.EUR ? (rates.VES / rates.EUR) : null;

  const fetchSavedRateConfig = async () => {
    try {
      const { data } = await supabase.from('event_settings')
        .select('*').eq('event_id', eventId).maybeSingle();
      if (data) {
        setSavedRateConfig(data);
        setSelectedRate({ type: data.rate_type, value: data.rate_value });
        if (data.rate_type === 'manual') setManualRate(String(data.rate_value));
      }
    } catch (e) { console.error(e); }
  };

  const handleSaveRate = async () => {
    if (!selectedRate) return;
    setSavingRate(true);
    try {
      const rateValue = selectedRate.type === 'manual'
        ? (parseFloat(manualRate) || 0)
        : selectedRate.value;
      const payload = {
        event_id: eventId,
        rate_type: selectedRate.type,
        rate_value: rateValue,
        updated_at: new Date().toISOString()
      };
      if (savedRateConfig) {
        await supabase.from('event_settings').update(payload).eq('event_id', eventId);
      } else {
        await supabase.from('event_settings').insert([payload]);
      }
      setSavedRateConfig({ ...payload });
      setSelectedRate({ ...selectedRate, value: rateValue });
    } catch (e) { console.error(e); }
    finally { setSavingRate(false); }
  };

  const handleSavePayment = async () => {
    if (!formData.name.trim()) return;
    try {
      if (editingMethod) {
        await supabase.from('payment_methods').update({
          name: formData.name, description: formData.description,
          currency: formData.currency, requires_reference: formData.requires_reference
        }).eq('id', editingMethod.id);
      } else {
        await supabase.from('payment_methods').insert([{
          event_id: eventId, ...formData
        }]);
      }
      resetForm();
      fetchPaymentMethods();
    } catch (e) { console.error(e); }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', currency: 'USD', requires_reference: false });
    setShowAddForm(false);
    setEditingMethod(null);
  };

  const handleEdit = (m) => {
    setEditingMethod(m);
    setFormData({ name: m.name, description: m.description || '', currency: m.currency, requires_reference: m.requires_reference });
    setShowAddForm(true);
  };

  const handleDelete = async (id) => {
    await supabase.from('payment_methods').delete().eq('id', id);
    fetchPaymentMethods();
  };

  // ── Estilos ──
  const inputStyle = {
    width: '100%', padding: '11px 13px', borderRadius: '9px', boxSizing: 'border-box',
    border: '1px solid rgba(255,255,255,0.08)', fontSize: '13px',
    background: 'rgba(255,255,255,0.04)', color: '#fff',
    outline: 'none', fontFamily: 'Inter, sans-serif'
  };
  const labelStyle = { color: '#4a5568', fontSize: '11px', fontWeight: '600', marginBottom: '5px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.4px' };
  const sectionHead = (title, subtitle) => (
    <div style={{ marginBottom: '14px', paddingBottom: '10px', borderBottom: `1px solid rgba(255,255,255,0.06)` }}>
      <h2 style={{ color: 'white', fontSize: '15px', fontWeight: '700', margin: 0 }}>{title}</h2>
      {subtitle && <p style={{ color: '#4a5568', fontSize: '12px', margin: '2px 0 0 0' }}>{subtitle}</p>}
    </div>
  );

  const rateCard = (type, label, value, valueColor) => {
    const isActive = selectedRate?.type === type;
    return (
      <div
        onClick={() => setSelectedRate({ type, value: value ?? 0 })}
        style={{
          flex: 1,
          border: isActive ? `1.5px solid ${primaryColor}60` : '1px solid rgba(255,255,255,0.07)',
          borderRadius: '12px', padding: '12px', cursor: 'pointer',
          transition: 'all 0.2s', background: isActive ? `${primaryColor}08` : 'rgba(255,255,255,0.02)',
          boxShadow: isActive ? `0 4px 15px ${primaryColor}15` : 'none'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <span style={{ color: 'white', fontSize: '12px', fontWeight: '800', opacity: 0.7, letterSpacing: '0.02em' }}>{label}</span>
          {isActive && <span style={{ color: primaryColor, fontSize: '9px', fontWeight: '800', letterSpacing: '0.05em' }}>✓ ACTIVA</span>}
        </div>
        {value !== null ? (
          <p style={{ color: valueColor, fontSize: '15px', fontWeight: '800', margin: 0, letterSpacing: '0.02em' }}>
            Bs {value?.toFixed(2)}
          </p>
        ) : (
          <p style={{ color: '#4a5568', fontSize: '14px', margin: 0, fontWeight: '600' }}>—</p>
        )}
      </div>
    );
  };

  return (
    <div style={{ padding: '4px 0 100px 0', color: 'white', fontFamily: 'Inter, sans-serif' }}>

      {/* ── MÉTODOS DE PAGO ── */}
      <section style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', paddingBottom: '10px', borderBottom: 'rgba(255,255,255,0.06) 1px solid' }}>
          <div>
            <h2 style={{ color: 'white', fontSize: '15px', fontWeight: '700', margin: 0 }}>Métodos de Pago</h2>
            <p style={{ color: '#4a5568', fontSize: '12px', margin: '2px 0 0 0' }}>Cómo reciben los pagos</p>
          </div>
          <button
            onClick={() => { setShowAddForm(!showAddForm); if (showAddForm) resetForm(); }}
            style={{
              borderRadius: '10px', padding: '8px 16px', fontSize: '13px', fontWeight: '800',
              cursor: 'pointer',
              background: showAddForm ? 'rgba(255,255,255,0.08)' : `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)`,
              color: showAddForm ? '#94a3b8' : backgroundColor,
              border: 'none',
              boxShadow: showAddForm ? 'none' : `0 4px 15px ${primaryColor}40`,
              transition: 'all 0.15s',
              fontFamily: 'Inter, sans-serif'
            }}
            onMouseOver={e => !showAddForm && (e.currentTarget.style.transform = 'translateY(-1px)', e.currentTarget.style.boxShadow = `0 6px 20px ${primaryColor}55`)}
            onMouseOut={e => !showAddForm && (e.currentTarget.style.transform = 'translateY(0)', e.currentTarget.style.boxShadow = `0 4px 15px ${primaryColor}40`)}
          >
            {showAddForm ? 'Cancelar' : '+ Agregar'}
          </button>
        </div>

        {/* Formulario */}
        {showAddForm && (
          <div style={{ border: `1px solid ${primaryColor}30`, borderRadius: '12px', padding: '15px', marginBottom: '14px' }}>
            <p style={{ color: primaryColor, fontSize: '13px', fontWeight: '700', margin: '0 0 13px 0' }}>
              {editingMethod ? 'Editar método' : 'Nuevo método'}
            </p>
            <div style={{ marginBottom: '11px' }}>
              <label style={labelStyle}>Nombre</label>
              <input style={inputStyle} placeholder="Ej: Pago Móvil Banesco"
                value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div style={{ marginBottom: '11px' }}>
              <label style={labelStyle}>Datos / Descripción</label>
              <textarea style={{ ...inputStyle, minHeight: '64px', resize: 'vertical' }}
                placeholder="Ej: 0414-1234567 / Banesco / CI: 12345678"
                value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '13px' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Moneda</label>
                <select style={{ ...inputStyle, cursor: 'pointer', appearance: 'none', backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394a3b8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px top 50%', backgroundSize: '10px auto' }}
                  value={formData.currency} onChange={e => setFormData({ ...formData, currency: e.target.value })}>
                  <option value="USD" style={{ background: backgroundColor, color: '#fff' }}>USD — Dólar</option>
                  <option value="EUR" style={{ background: backgroundColor, color: '#fff' }}>EUR — Euro</option>
                  <option value="BS" style={{ background: backgroundColor, color: '#fff' }}>BS — Bolívares</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>¿Ref. requerida?</label>
                <div
                  onClick={() => setFormData({ ...formData, requires_reference: !formData.requires_reference })}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '9px',
                    border: '1px solid rgba(255,255,255,0.08)', borderRadius: '9px',
                    padding: '11px 12px', cursor: 'pointer', background: 'rgba(255,255,255,0.04)'
                  }}>
                  <div style={{
                    width: '18px', height: '18px', borderRadius: '5px', flexShrink: 0,
                    border: `2px solid ${formData.requires_reference ? primaryColor : 'rgba(255,255,255,0.2)'}`,
                    background: formData.requires_reference ? primaryColor : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s'
                  }}>
                    {formData.requires_reference && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>
                    )}
                  </div>
                  <span style={{ color: '#94a3b8', fontSize: '12px' }}>{formData.requires_reference ? 'Sí' : 'No'}</span>
                </div>
              </div>
            </div>
            <button onClick={handleSavePayment} style={{
              background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)`,
              color: backgroundColor, border: 'none', borderRadius: '10px',
              padding: '13px', fontSize: '14px', fontWeight: '800', fontFamily: 'Inter, sans-serif',
              cursor: 'pointer', width: '100%', boxShadow: `0 4px 15px ${primaryColor}40`,
              transition: 'all 0.15s', letterSpacing: '0.02em', marginTop: '10px'
            }}
            onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 6px 20px ${primaryColor}55`; }}
            onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 4px 15px ${primaryColor}40`; }}
            >
              {editingMethod ? 'Guardar Cambios' : 'Agregar Método'}
            </button>
          </div>
        )}

        {/* Lista */}
        {loadingPayments ? (
          <p style={{ color: '#4a5568', fontSize: '13px', textAlign: 'center', padding: '16px' }}>Cargando...</p>
        ) : paymentMethods.length === 0 ? (
          <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
            <p style={{ color: '#334155', fontSize: '13px', margin: 0 }}>Sin métodos configurados</p>
          </div>
        ) : paymentMethods.map(m => (
          <div key={m.id} style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: '11px', padding: '12px', marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: '7px', alignItems: 'center', marginBottom: '3px', flexWrap: 'wrap' }}>
                  <span style={{ color: 'white', fontSize: '13px', fontWeight: '700' }}>{m.name}</span>
                  <span style={{ color: primaryColor, fontSize: '10px', fontWeight: '700', border: `1px solid ${primaryColor}35`, borderRadius: '20px', padding: '1px 7px' }}>{m.currency}</span>
                  {m.requires_reference && <span style={{ color: '#fbbf24', fontSize: '10px', fontWeight: '600', border: '1px solid rgba(251,191,36,0.3)', borderRadius: '20px', padding: '1px 7px' }}>Ref.</span>}
                </div>
                {m.description && <p style={{ color: '#4a5568', fontSize: '12px', margin: 0, wordBreak: 'break-word' }}>{m.description}</p>}
              </div>
              <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
                <button onClick={() => handleEdit(m)} style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: 'none', borderRadius: '7px', padding: '5px 9px', fontSize: '12px', cursor: 'pointer' }}>✏️</button>
                <button onClick={() => handleDelete(m.id)} style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '7px', padding: '5px 9px', fontSize: '12px', cursor: 'pointer' }}>🗑️</button>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* ── TASA DE CAMBIO ── */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <h2 style={{ color: 'white', fontSize: '15px', fontWeight: '700', margin: 0 }}>Tasa de Cambio</h2>
            <p style={{ color: '#4a5568', fontSize: '12px', margin: '2px 0 0 0' }}>Conversión a Bs para los pagos</p>
          </div>
          <button onClick={fetchExchangeRates} style={{ background: 'transparent', color: '#4a5568', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '7px', padding: '5px 10px', fontSize: '12px', cursor: 'pointer' }} title="Actualizar">🔄</button>
        </div>

        {loadingRates ? (
          <p style={{ color: '#4a5568', fontSize: '13px', textAlign: 'center', padding: '16px' }}>Consultando ExchangeRate-API...</p>
        ) : ratesError ? (
          <div style={{ border: '1px solid rgba(239,68,68,0.25)', borderRadius: '12px', padding: '14px', marginBottom: '12px' }}>
            <p style={{ color: '#ef4444', fontSize: '13px', margin: '0 0 8px 0' }}>⚠️ No se pudo obtener la tasa. Usa la tasa manual.</p>
            <button onClick={fetchExchangeRates} style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '7px', padding: '7px 12px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}>Reintentar</button>
          </div>
        ) : (
          <>
            {rates.lastUpdate && (
              <p style={{ color: '#334155', fontSize: '10px', margin: '0 0 10px 0' }}>
                Actualizado: {new Date(rates.lastUpdate).toLocaleDateString('es-VE')}
              </p>
            )}
            <div style={{ display: 'flex', flexDirection: 'row', gap: '10px', marginBottom: '12px' }}>
              {rateCard('usd', 'USD → VES', rates.VES, '#4ade80')}
              {eurToVes && rateCard('eur', 'EUR → VES', eurToVes, '#818cf8')}
            </div>
          </>
        )}

        {/* Tasa manual */}
        <div
          onClick={() => setSelectedRate({ type: 'manual', value: parseFloat(manualRate) || 0 })}
          style={{
            border: selectedRate?.type === 'manual' ? `1.5px solid ${primaryColor}60` : '1px solid rgba(255,255,255,0.07)',
            borderRadius: '12px', padding: '12px', cursor: 'pointer',
            marginBottom: '12px', transition: 'all 0.2s', background: selectedRate?.type === 'manual' ? `${primaryColor}08` : 'rgba(255,255,255,0.02)',
            boxShadow: selectedRate?.type === 'manual' ? `0 4px 15px ${primaryColor}15` : 'none'
          }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px' }}>✏️</span>
              <div>
                <p style={{ color: 'white', fontSize: '13px', fontWeight: '800', margin: 0, letterSpacing: '0.02em', opacity: 0.9 }}>Tasa Manual</p>
              </div>
            </div>
            {selectedRate?.type === 'manual' && <span style={{ color: primaryColor, fontSize: '9px', fontWeight: '800', letterSpacing: '0.05em' }}>✓ ACTIVA</span>}
          </div>
          <input
            style={{ ...inputStyle, border: `1px solid ${selectedRate?.type === 'manual' ? primaryColor + '50' : 'rgba(255,255,255,0.08)'}`, fontSize: '15px', fontWeight: '600' }}
            type="number" placeholder="Ej: 38.50" value={manualRate}
            onChange={e => { setManualRate(e.target.value); if (selectedRate?.type === 'manual') setSelectedRate({ type: 'manual', value: parseFloat(e.target.value) || 0 }); }}
            onClick={e => e.stopPropagation()}
          />
        </div>

        {/* Tasa activa guardada */}
        {savedRateConfig && (
          <div style={{ border: `1px solid ${primaryColor}25`, borderRadius: '10px', padding: '11px 13px', marginBottom: '10px' }}>
            <p style={{ color: '#4a5568', fontSize: '10px', margin: '0 0 2px 0', textTransform: 'uppercase' }}>Tasa guardada</p>
            <p style={{ color: 'white', fontSize: '13px', fontWeight: '700', margin: 0 }}>
              {savedRateConfig.rate_type === 'usd' ? '🇺🇸 USD' : savedRateConfig.rate_type === 'eur' ? '🇪🇺 EUR' : '✏️ Manual'}
              {' — '}
              <span style={{ color: primaryColor }}>Bs {parseFloat(savedRateConfig.rate_value).toFixed(2)}</span>
            </p>
          </div>
        )}

        <button
          onClick={handleSaveRate}
          disabled={!selectedRate || savingRate}
          style={{
            background: !selectedRate ? 'rgba(255,255,255,0.04)' : `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)`,
            color: !selectedRate ? '#475569' : backgroundColor,
            border: 'none',
            borderRadius: '10px', padding: '14px', fontSize: '15px',
            fontWeight: '800', cursor: !selectedRate ? 'not-allowed' : 'pointer',
            width: '100%', transition: 'all 0.2s', fontFamily: 'Inter, sans-serif',
            boxShadow: !selectedRate ? 'none' : `0 6px 20px ${primaryColor}40`,
            letterSpacing: '0.02em'
          }}
          onMouseOver={e => !(!selectedRate || savingRate) && (e.currentTarget.style.transform = 'translateY(-1px)', e.currentTarget.style.boxShadow = `0 8px 24px ${primaryColor}55`)}
          onMouseOut={e => !(!selectedRate || savingRate) && (e.currentTarget.style.transform = 'translateY(0)', e.currentTarget.style.boxShadow = `0 6px 20px ${primaryColor}40`)}
        >
          {savingRate ? 'Guardando...' : 'Guardar Tasa'}
        </button>
      </section>
    </div>
  );
}

export default AdminSettings;
