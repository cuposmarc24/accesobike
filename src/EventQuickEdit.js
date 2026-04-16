import { useState, useRef } from 'react';
import { supabase } from './lib/supabase';

const font = "'Inter', system-ui, sans-serif";

// ── Toast global ──
function Toast({ message }) {
  if (!message) return null;
  return (
    <div style={{
      position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
      background: '#22c55e', color: '#fff', padding: '12px 24px',
      borderRadius: '12px', fontFamily: font, fontWeight: '700', fontSize: '14px',
      boxShadow: '0 8px 30px rgba(34,197,94,0.4)',
      zIndex: 9999, display: 'flex', alignItems: 'center', gap: '8px',
      whiteSpace: 'nowrap'
    }}>
      ✓ {message}
    </div>
  );
}

// ── Sección colapsable ──
// Recibe `forceClose` para colapsar desde el padre tras guardar
const Section = ({ title, icon, children, saving, onSave, forceClose }) => {
  const [open, setOpen] = useState(false);

  // Colapsar cuando el padre lo indique
  if (forceClose && open) setOpen(false);

  return (
    <div style={{
      border: `1px solid ${open ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.07)'}`,
      borderRadius: '14px', overflow: 'hidden', marginBottom: '10px',
      transition: 'border-color 0.2s'
    }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px', cursor: 'pointer',
          background: open ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
          transition: 'background 0.2s'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '18px' }}>{icon}</span>
          <span style={{ fontFamily: font, fontWeight: '700', fontSize: '14px', color: '#e2e8f0' }}>{title}</span>
        </div>
        <span style={{
          color: '#64748b', fontSize: '16px', display: 'inline-block',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s'
        }}>⌄</span>
      </div>

      {open && (
        <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {children}
          {onSave && (
            <button
              onClick={onSave}
              disabled={saving}
              style={{
                marginTop: '14px', width: '100%', padding: '11px',
                background: saving ? 'rgba(19,200,236,0.4)' : '#13c8ec',
                color: '#111f22', border: 'none', borderRadius: '10px',
                fontFamily: font, fontWeight: '800', fontSize: '14px',
                cursor: saving ? 'not-allowed' : 'pointer', transition: 'background 0.2s'
              }}
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const Field = ({ label, value, onChange, type = 'text', placeholder }) => (
  <div style={{ marginBottom: '12px' }}>
    <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', fontWeight: '600', color: '#64748b', letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: font }}>
      {label}
    </label>
    <input
      type={type} value={value ?? ''} onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%', padding: '10px 12px', borderRadius: '9px', boxSizing: 'border-box',
        border: '1.5px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)',
        color: '#e2e8f0', fontSize: '14px', fontFamily: font, outline: 'none'
      }}
    />
  </div>
);

const ImageField = ({ label, value, onChange }) => {
  const ref = useRef();
  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => onChange(ev.target.result);
    reader.readAsDataURL(file);
  };
  return (
    <div style={{ marginBottom: '14px' }}>
      <label style={{ display: 'block', marginBottom: '6px', fontSize: '11px', fontWeight: '600', color: '#64748b', letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: font }}>
        {label}
      </label>
      {value && (
        <img src={value} alt={label} style={{ width: '100%', maxHeight: '140px', objectFit: 'cover', borderRadius: '8px', marginBottom: '8px', border: '1px solid rgba(255,255,255,0.08)' }} />
      )}
      <input ref={ref} type="file" accept="image/*" onChange={handleFile}
        style={{ color: '#94a3b8', fontSize: '12px', fontFamily: font, width: '100%' }} />
    </div>
  );
};

function EventQuickEdit({ event, onClose, onSaved }) {
  const primaryColor = event.config?.theme?.primaryColor || '#13c8ec';
  const backgroundColor = event.config?.theme?.backgroundColor || '#111f22';

  // ── Estado por sección ──
  const [info, setInfo] = useState({
    event_name: event.event_name || '',
    cycling_room: event.cycling_room || '',
    start_date: event.start_date ? event.start_date.slice(0, 10) : '',
    end_date: event.end_date ? event.end_date.slice(0, 10) : '',
    is_active: event.is_active !== false
  });

  const [images, setImages] = useState({
    event_image: event.event_image || '',
    cycling_room_logo: event.cycling_room_logo || ''
  });

  const [sessions, setSessions] = useState(
    (event.config?.sessions || []).map(s => ({ ...s }))
  );

  const [adminCreds, setAdminCreds] = useState({ username: '', password: '' });

  const [theme, setTheme] = useState({
    primaryColor: event.config?.theme?.primaryColor || '#13c8ec',
    secondaryColor: event.config?.theme?.secondaryColor || '#1a2c30',
    backgroundColor: event.config?.theme?.backgroundColor || '#111f22'
  });

  const [saving, setSaving] = useState({});
  // closedAt[key] = timestamp para forzar colapso tras guardar
  const [closedAt, setClosedAt] = useState({});
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const markSaving = (key) => setSaving(p => ({ ...p, [key]: true }));

  const markDone = (key, label) => {
    setSaving(p => ({ ...p, [key]: false }));
    // Forzar colapso de la sección
    setClosedAt(p => ({ ...p, [key]: Date.now() }));
    showToast(label + ' guardado correctamente');
    onSaved && onSaved();
  };

  const markError = (key, msg) => {
    setSaving(p => ({ ...p, [key]: false }));
    alert('Error: ' + msg);
  };

  // ── Guardar Info General ──
  const saveInfo = async () => {
    markSaving('info');
    const { error } = await supabase.from('events').update({
      event_name: info.event_name,
      cycling_room: info.cycling_room,
      start_date: info.start_date || null,
      end_date: info.end_date || null,
      is_active: info.is_active
    }).eq('id', event.id);
    if (error) return markError('info', error.message);
    markDone('info', 'Info general');
  };

  // ── Guardar Imágenes ──
  const saveImages = async () => {
    markSaving('images');
    const { error } = await supabase.from('events').update({
      event_image: images.event_image || null,
      cycling_room_logo: images.cycling_room_logo || null
    }).eq('id', event.id);
    if (error) return markError('images', error.message);
    markDone('images', 'Imágenes');
  };

  // ── Guardar Sesiones (datos + flyers, sin tocar asientos) ──
  const saveSessions = async () => {
    markSaving('sessions');
    const newConfig = { ...event.config, sessions };
    const { error } = await supabase.from('events').update({ config: newConfig }).eq('id', event.id);
    if (error) return markError('sessions', error.message);
    markDone('sessions', 'Sesiones');
  };

  // ── Guardar Admin ──
  const saveAdmin = async () => {
    if (!adminCreds.username || !adminCreds.password) {
      alert('Completa usuario y contraseña');
      return;
    }
    markSaving('admin');
    const { data: existing } = await supabase.from('event_admins').select('id').eq('event_id', event.id).maybeSingle();
    let error;
    if (existing) {
      ({ error } = await supabase.from('event_admins').update({
        username: adminCreds.username,
        password_hash: adminCreds.password
      }).eq('id', existing.id));
    } else {
      ({ error } = await supabase.from('event_admins').insert([{
        event_id: event.id,
        username: adminCreds.username,
        password_hash: adminCreds.password,
        email: `${adminCreds.username}@event.local`,
        full_name: `Admin - ${info.event_name}`
      }]));
    }
    if (error) return markError('admin', error.message);
    markDone('admin', 'Usuario admin');
  };

  // ── Guardar Tema ──
  const saveTheme = async () => {
    markSaving('theme');
    const newConfig = { ...event.config, theme: { ...event.config?.theme, ...theme } };
    const { error } = await supabase.from('events').update({ config: newConfig }).eq('id', event.id);
    if (error) return markError('theme', error.message);
    markDone('theme', 'Colores');
  };

  return (
    <>
      <Toast message={toast} />

      <div style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)',
        zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
        padding: '16px', overflowY: 'auto'
      }}>
        <div style={{
          background: backgroundColor, borderRadius: '20px',
          width: '100%', maxWidth: '480px',
          marginTop: '16px', marginBottom: '32px',
          border: `1.5px solid ${primaryColor}40`,
          boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
          fontFamily: font, overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: primaryColor, fontFamily: font }}>Edición Rápida</h2>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b', fontFamily: font }}>{event.event_name}</p>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '8px', color: '#94a3b8', cursor: 'pointer', padding: '8px 10px', fontSize: '16px' }}>✕</button>
          </div>

          <div style={{ padding: '16px' }}>
            <p style={{ margin: '0 0 14px', fontSize: '11px', color: '#475569', fontFamily: font, lineHeight: '1.5' }}>
              Abre la sección que quieres modificar y presiona guardar. Cada sección es independiente y no afecta asientos ni reservas activas.
            </p>

            {/* Info General */}
            <Section title="Info General" icon="📋" onSave={saveInfo} saving={saving.info} forceClose={closedAt.info}>
              <Field label="Nombre del evento" value={info.event_name} onChange={v => setInfo(p => ({ ...p, event_name: v }))} />
              <Field label="Sala / Ubicación" value={info.cycling_room} onChange={v => setInfo(p => ({ ...p, cycling_room: v }))} />
              <Field label="Fecha inicio" value={info.start_date} onChange={v => setInfo(p => ({ ...p, start_date: v }))} type="date" />
              <Field label="Fecha fin" value={info.end_date} onChange={v => setInfo(p => ({ ...p, end_date: v }))} type="date" />
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <input type="checkbox" id="is_active" checked={info.is_active}
                  onChange={e => setInfo(p => ({ ...p, is_active: e.target.checked }))}
                  style={{ width: '16px', height: '16px', accentColor: primaryColor }} />
                <label htmlFor="is_active" style={{ color: '#e2e8f0', fontSize: '14px', fontFamily: font }}>
                  Evento activo (visible al público)
                </label>
              </div>
            </Section>

            {/* Imágenes generales */}
            <Section title="Imágenes del evento" icon="🖼️" onSave={saveImages} saving={saving.images} forceClose={closedAt.images}>
              <ImageField label="Foto / Flyer general del evento" value={images.event_image} onChange={v => setImages(p => ({ ...p, event_image: v }))} />
              <ImageField label="Logo de la sala" value={images.cycling_room_logo} onChange={v => setImages(p => ({ ...p, cycling_room_logo: v }))} />
            </Section>

            {/* Sesiones — precio, hora, instructores y flyer por sesión */}
            <Section title="Sesiones (precio, hora, flyer, instructores)" icon="🚴" onSave={saveSessions} saving={saving.sessions} forceClose={closedAt.sessions}>
              <p style={{ margin: '0 0 12px', fontSize: '11px', color: '#f59e0b', fontFamily: font }}>
                ⚠️ El número de bicis no se puede modificar si hay reservas activas.
              </p>
              {sessions.map((s, i) => (
                <div key={s.id} style={{ marginBottom: '18px', padding: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p style={{ margin: '0 0 12px', fontSize: '12px', fontWeight: '800', color: primaryColor, fontFamily: font, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {s.event_name || `Sesión ${i + 1}`}
                  </p>

                  <Field label="Nombre de la sesión" value={s.event_name}
                    onChange={v => setSessions(p => p.map((x, j) => j === i ? { ...x, event_name: v } : x))} />
                  <Field label="Hora (HH:MM)" value={s.time}
                    onChange={v => setSessions(p => p.map((x, j) => j === i ? { ...x, time: v } : x))}
                    placeholder="18:00" />
                  <Field label="Precio (USD)" value={s.price}
                    onChange={v => setSessions(p => p.map((x, j) => j === i ? { ...x, price: v } : x))}
                    placeholder="25.00" />

                  {/* Flyer de la sesión */}
                  <ImageField
                    label="Flyer de esta sesión"
                    value={s.image}
                    onChange={v => setSessions(p => p.map((x, j) => j === i ? { ...x, image: v } : x))}
                  />

                  {/* Instructores */}
                  {(s.instructors || []).map((inst, k) => (
                    <Field key={k}
                      label={`Instructor ${k + 1}${inst.rank ? ` (${inst.rank})` : ''}`}
                      value={inst.name}
                      onChange={v => setSessions(p => p.map((x, j) => j === i
                        ? { ...x, instructors: x.instructors.map((ins, l) => l === k ? { ...ins, name: v } : ins) }
                        : x))}
                    />
                  ))}
                </div>
              ))}
            </Section>

            {/* Admin */}
            <Section title="Usuario Admin" icon="🔑" onSave={saveAdmin} saving={saving.admin} forceClose={closedAt.admin}>
              <p style={{ margin: '0 0 12px', fontSize: '11px', color: '#64748b', fontFamily: font }}>
                Deja en blanco si no quieres cambiar las credenciales.
              </p>
              <Field label="Nuevo usuario" value={adminCreds.username}
                onChange={v => setAdminCreds(p => ({ ...p, username: v }))} placeholder="admin123" />
              <Field label="Nueva contraseña" value={adminCreds.password}
                onChange={v => setAdminCreds(p => ({ ...p, password: v }))} type="password" placeholder="••••••••" />
            </Section>

            {/* Tema */}
            <Section title="Colores / Tema" icon="🎨" onSave={saveTheme} saving={saving.theme} forceClose={closedAt.theme}>
              {[
                { label: 'Color primario', key: 'primaryColor' },
                { label: 'Color secundario', key: 'secondaryColor' },
                { label: 'Color de fondo', key: 'backgroundColor' }
              ].map(({ label, key }) => (
                <div key={key} style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input type="color" value={theme[key]}
                    onChange={e => setTheme(p => ({ ...p, [key]: e.target.value }))}
                    style={{ width: '40px', height: '40px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }} />
                  <div>
                    <p style={{ margin: 0, fontSize: '11px', color: '#64748b', fontFamily: font, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
                    <p style={{ margin: 0, fontSize: '13px', color: '#e2e8f0', fontFamily: font, fontWeight: '600' }}>{theme[key]}</p>
                  </div>
                </div>
              ))}
            </Section>
          </div>
        </div>
      </div>
    </>
  );
}

export default EventQuickEdit;
