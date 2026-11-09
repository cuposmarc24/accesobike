import { useState } from 'react';
import { MdPerson, MdLock } from 'react-icons/md';
import { eventAdminAuth } from './lib/auth';
import { themeVars } from './lib/theme';
import { Flyer } from './SessionList';

function AdminLogin({ onLogin, onCancel, event }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const theme = event?.config?.theme || event?.theme || {};

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (!username || !password) {
      setError('Ingresa tu usuario y tu contraseña.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await eventAdminAuth.login(username, password);
      if (result.success) onLogin(result.user);
      else setError(result.error || 'Usuario o contraseña incorrectos.');
    } catch (err) {
      setError('No se pudo iniciar sesión. Revisa tu conexión e inténtalo de nuevo.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ab-scope ab-admin" style={themeVars(theme)}>
      <header className="ab-topbar">
        {onCancel ? (
          <button type="button" className="ab-icon-btn" onClick={onCancel} aria-label="Volver">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
          </button>
        ) : <div className="ab-topbar__spacer" />}
        <div className="ab-topbar__title">
          <h1 className="ab-display">{event?.cycling_room || 'Sala principal'}</h1>
        </div>
        <div className="ab-topbar__spacer" />
      </header>

      <form className="ab-login" onSubmit={handleLogin}>
        <Flyer compact src={event?.event_image} alt="Flyer del evento" />

        <h2 className="ab-display">Panel del evento</h2>
        <p>{event?.event_name || 'Ingresa con tus credenciales del evento'}</p>

        <div className="ab-field">
          <label className="ab-label" htmlFor="ab-user">Usuario</label>
          <div className="ab-input-wrap">
            <span className="ab-input-icon" aria-hidden="true"><MdPerson size={18} /></span>
            <input id="ab-user" className="ab-input" autoComplete="username" autoCapitalize="none"
              value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
        </div>

        <div className="ab-field">
          <label className="ab-label" htmlFor="ab-pass">Contraseña</label>
          <div className="ab-input-wrap">
            <span className="ab-input-icon" aria-hidden="true"><MdLock size={18} /></span>
            <input id="ab-pass" className={`ab-input${error ? ' is-error' : ''}`} type="password" autoComplete="current-password"
              value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error && <p className="ab-help ab-help--error" role="alert">{error}</p>}
        </div>

        <button type="submit" className="ab-btn ab-btn--primary ab-btn--block" disabled={loading} style={{ marginTop: 8 }}>
          {loading ? 'Verificando…' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}

export default AdminLogin;
