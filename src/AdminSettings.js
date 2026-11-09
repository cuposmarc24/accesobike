import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import BottomSheet from './BottomSheet';

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

  const theme = { primaryColor, backgroundColor };

  const rateOption = (type, label, value) => {
    const isActive = selectedRate?.type === type;
    return (
      <div
        role="radio"
        aria-checked={isActive}
        tabIndex={0}
        className={`ab-option${isActive ? ' is-active' : ''}`}
        style={{ flex: 1, minWidth: 0 }}
        onClick={() => setSelectedRate({ type, value: value ?? 0 })}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedRate({ type, value: value ?? 0 }); } }}
      >
        <span className="ab-radio" aria-hidden="true" />
        <div style={{ minWidth: 0 }}>
          <span className="ab-option__name" style={{ display: 'block', fontSize: 13, color: 'var(--ab-muted)' }}>{label}</span>
          <span className="ab-stat__value" style={{ fontSize: 22 }}>{value != null ? `Bs ${value.toFixed(2)}` : '—'}</span>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* ── MÉTODOS DE PAGO ── */}
      <section className="ab-section">
        <div className="ab-sec-head">
          <div>
            <h2>Métodos de pago</h2>
            <p>Lo que ve el cliente al reservar</p>
          </div>
          <button type="button" className="ab-btn ab-btn--primary ab-btn--sm" onClick={() => { resetForm(); setShowAddForm(true); }}>
            + Agregar
          </button>
        </div>

        {loadingPayments ? (
          <div className="ab-empty">Cargando…</div>
        ) : paymentMethods.length === 0 ? (
          <div className="ab-empty">Aún no hay métodos de pago. Agrega uno para que tus clientes sepan cómo pagarte.</div>
        ) : (
          <div className="ab-list">
            {paymentMethods.map(m => (
              <div key={m.id} className="ab-card" style={{ marginTop: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="ab-option__top">
                      <span className="ab-option__name">{m.name}</span>
                      <span className="ab-tag">{m.currency}</span>
                      {m.requires_reference && <span className="ab-tag" style={{ color: '#fbbf24', background: 'rgb(251 191 36 / 0.14)' }}>Pide referencia</span>}
                    </div>
                    {m.description && <p className="ab-option__desc" style={{ wordBreak: 'break-word' }}>{m.description}</p>}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button type="button" className="ab-icon-btn" style={{ width: 38, height: 38 }} onClick={() => handleEdit(m)} aria-label={`Editar ${m.name}`}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
                    </button>
                    <button type="button" className="ab-icon-btn ab-icon-btn--danger" style={{ width: 38, height: 38 }} onClick={() => handleDelete(m.id)} aria-label={`Eliminar ${m.name}`}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── TASA DE CAMBIO ── */}
      <section className="ab-section">
        <div className="ab-sec-head">
          <div>
            <h2>Tasa de cambio</h2>
            <p>Elige la tasa de la moneda en que cobras (dólar o euro)</p>
          </div>
          <button type="button" className="ab-icon-btn" onClick={fetchExchangeRates} aria-label="Actualizar tasas" title="Actualizar tasas">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7L21 8" /><path d="M21 3v5h-5" /></svg>
          </button>
        </div>

        {loadingRates ? (
          <div className="ab-empty" style={{ marginBottom: 10 }}>Consultando tasas…</div>
        ) : ratesError ? (
          <div className="ab-card" style={{ marginBottom: 10 }}>
            <p style={{ margin: '0 0 10px', fontSize: 14, color: 'var(--ab-danger)' }}>No se pudo consultar la tasa en línea. Usa la tasa manual o inténtalo de nuevo.</p>
            <button type="button" className="ab-btn ab-btn--danger ab-btn--sm" onClick={fetchExchangeRates}>Reintentar</button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 10, marginBottom: 10 }} role="radiogroup" aria-label="Tasa a usar">
              {rateOption('usd', 'Dólar', rates.VES)}
              {eurToVes && rateOption('eur', 'Euro', eurToVes)}
            </div>
            {rates.lastUpdate && (
              <p className="ab-help" style={{ margin: '0 2px 12px' }}>Actualizada el {new Date(rates.lastUpdate).toLocaleDateString('es-VE')}</p>
            )}
          </>
        )}

        {/* Tasa manual */}
        <div
          className={`ab-option${selectedRate?.type === 'manual' ? ' is-active' : ''}`}
          style={{ marginBottom: 14, flexDirection: 'column', alignItems: 'stretch' }}
          onClick={() => setSelectedRate({ type: 'manual', value: parseFloat(manualRate) || 0 })}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="ab-radio" aria-hidden="true" />
            <span className="ab-option__name">Tasa manual</span>
          </div>
          <div className="ab-input-wrap" onClick={e => e.stopPropagation()}>
            <span className="ab-input-icon" aria-hidden="true">Bs</span>
            <input
              className="ab-input"
              type="number"
              inputMode="decimal"
              placeholder="Ej: 38.50"
              value={manualRate}
              aria-label="Tasa manual en Bs por dólar"
              onFocus={() => setSelectedRate({ type: 'manual', value: parseFloat(manualRate) || 0 })}
              onChange={e => { setManualRate(e.target.value); setSelectedRate({ type: 'manual', value: parseFloat(e.target.value) || 0 }); }}
            />
          </div>
        </div>

        {savedRateConfig && (
          <div className="ab-total" style={{ marginBottom: 14 }}>
            <span className="ab-total__label">
              Tasa en uso ({savedRateConfig.rate_type === 'usd' ? 'dólar' : savedRateConfig.rate_type === 'eur' ? 'euro' : 'manual'})
            </span>
            <span className="ab-total__value">Bs {parseFloat(savedRateConfig.rate_value).toFixed(2)}</span>
          </div>
        )}

        <button type="button" className="ab-btn ab-btn--primary ab-btn--block" onClick={handleSaveRate} disabled={!selectedRate || savingRate}>
          {savingRate ? 'Guardando…' : 'Guardar tasa'}
        </button>
      </section>

      {/* ── Formulario de método de pago (sube desde abajo) ── */}
      {showAddForm && (
        <BottomSheet
          theme={theme}
          ariaLabel={editingMethod ? 'Editar método de pago' : 'Nuevo método de pago'}
          onClose={resetForm}
          header={
            <div>
              <h2 className="ab-sheet-title">{editingMethod ? 'Editar método de pago' : 'Nuevo método de pago'}</h2>
              <p className="ab-sheet-sub">El cliente lo verá al reservar</p>
            </div>
          }
          footer={(close) => (
            <>
              <button type="button" className="ab-btn ab-btn--ghost" style={{ flex: 1 }} onClick={close}>Cancelar</button>
              <button type="button" className="ab-btn ab-btn--primary" style={{ flex: 2 }} onClick={handleSavePayment} disabled={!formData.name.trim()}>
                {editingMethod ? 'Guardar cambios' : 'Agregar método'}
              </button>
            </>
          )}
        >
          <div className="ab-field">
            <label className="ab-label" htmlFor="ab-pm-name">Nombre</label>
            <input id="ab-pm-name" className="ab-input" style={{ paddingLeft: 14 }} placeholder="Ej: Pago Móvil Banesco"
              value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div className="ab-field">
            <label className="ab-label" htmlFor="ab-pm-desc">Datos para pagar</label>
            <textarea id="ab-pm-desc" className="ab-textarea" placeholder="Ej: 0414-1234567 / Banesco / CI: 12345678"
              value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
          </div>
          <div className="ab-field">
            <label className="ab-label" htmlFor="ab-pm-cur">Moneda</label>
            <select id="ab-pm-cur" className="ab-input" value={formData.currency} onChange={e => setFormData({ ...formData, currency: e.target.value })}>
              <option value="USD">Dólares (USD)</option>
              <option value="EUR">Euros (EUR)</option>
              <option value="BS">Bolívares (BS)</option>
            </select>
          </div>
          <div
            className={`ab-switch${formData.requires_reference ? ' is-on' : ''}`}
            role="switch"
            aria-checked={formData.requires_reference}
            tabIndex={0}
            onClick={() => setFormData({ ...formData, requires_reference: !formData.requires_reference })}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFormData({ ...formData, requires_reference: !formData.requires_reference }); } }}
          >
            <span>Pedir número de referencia</span>
            <span className="ab-switch__track" aria-hidden="true" />
          </div>
        </BottomSheet>
      )}
    </div>
  );
}

export default AdminSettings;
