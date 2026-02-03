import { useState } from 'react';
import { eventAdminAuth } from './lib/auth';

function AdminLogin({ onLogin, onCancel, event }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Extract theme colors from event
  const theme = event?.config?.theme || event?.theme || {};
  const primaryColor = theme.primaryColor || '#13c8ec';
  const secondaryColor = theme.secondaryColor || '#1a2c30';
  const backgroundColor = theme.backgroundColor || '#111f22';

  const handleLogin = async () => {
    if (!username || !password) {
      setError('Por favor ingresa usuario y contraseña');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await eventAdminAuth.login(username, password);

      if (result.success) {
        onLogin(result.user);
      } else {
        setError(result.error || 'Error de autenticación');
      }
    } catch (err) {
      setError('Ocurrió un error inesperado');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div style={{
      background: backgroundColor,
      minHeight: '100vh',
      width: '100%',
      fontFamily: 'Inter, sans-serif',
      color: '#fff',
      position: 'relative',
      paddingBottom: '40px',
      boxSizing: 'border-box'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255,255,255,0.05)'
      }}>
        {onCancel && (
          <div onClick={onCancel} style={{ cursor: 'pointer', padding: '8px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
          </div>
        )}

        {/* Header Content with Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              overflow: 'hidden',
              background: secondaryColor,
              border: `2px solid ${primaryColor}`
            }}>
              {event?.cycling_room_logo ? (
                <img
                  src={event.cycling_room_logo}
                  alt="Room Logo"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🚲</div>
              )}
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: '800', margin: 0, letterSpacing: '0.5px' }}>
              {event?.cycling_room || 'Sala Principal'}
            </h1>
          </div>
        </div>

        <div style={{ padding: '8px', opacity: 0 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1" /></svg>
        </div>
      </div>

      {/* Event Image Card */}
      <div style={{ padding: '20px 20px 0 20px', display: 'flex', justifyContent: 'center' }}>
        <div style={{
          width: '100%',
          maxWidth: '300px',
          height: '160px',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          border: '1px solid rgba(255,255,255,0.1)',
          position: 'relative'
        }}>
          <img
            src={event?.event_image || 'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=1470&auto=format&fit=crop'}
            alt="Event"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      </div>

      {/* Login Form */}
      <div style={{ padding: '40px 20px 0 20px', maxWidth: '380px', margin: '0 auto' }}>
        <h2 style={{
          color: primaryColor,
          fontSize: '24px',
          fontWeight: '800',
          margin: '0 0 8px 0',
          textAlign: 'center'
        }}>
          Acceso Administrativo
        </h2>

        <p style={{
          color: '#94a3b8',
          fontSize: '14px',
          margin: '0 0 32px 0',
          textAlign: 'center'
        }}>
          {event ? `${event.event_name}` : 'Ingresa tus credenciales de evento'}
        </p>

        <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="Usuario"
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: `${secondaryColor}`,
              fontSize: '14px',
              color: '#fff',
              boxSizing: 'border-box',
              outline: 'none',
              transition: 'all 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = primaryColor}
            onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
          />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="Contraseña"
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: `${secondaryColor}`,
              fontSize: '14px',
              color: '#fff',
              boxSizing: 'border-box',
              outline: 'none',
              transition: 'all 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = primaryColor}
            onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
          />

          {error && (
            <p style={{
              color: '#ef4444',
              fontSize: '12px',
              margin: '0',
              fontWeight: '500',
              textAlign: 'left'
            }}>
              {error}
            </p>
          )}
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            background: primaryColor,
            color: backgroundColor,
            border: 'none',
            borderRadius: '12px',
            padding: '12px 20px',
            fontSize: '14px',
            fontWeight: '700',
            cursor: loading ? 'wait' : 'pointer',
            width: '100%',
            opacity: loading ? 0.7 : 1,
            transition: 'all 0.2s',
            boxShadow: `0 4px 15px ${primaryColor}4D`
          }}
          onMouseOver={(e) => !loading && (e.currentTarget.style.transform = 'translateY(-1px)')}
          onMouseOut={(e) => !loading && (e.currentTarget.style.transform = 'translateY(0)')}
        >
          {loading ? 'Verificando...' : 'Iniciar Sesión'}
        </button>
      </div>
    </div>
  );
}

export default AdminLogin;
