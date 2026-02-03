import { useState } from 'react';
import { superAdminAuth } from './lib/auth';

function SuperAdminLogin({ onLoginSuccess, onCancel }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await superAdminAuth.login(username, password);

        if (result.success) {
            onLoginSuccess(result.user);
        } else {
            setError(result.error);
        }

        setLoading(false);
    };

    return (
        <div style={{
            background: '#111f22',
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            fontFamily: 'Inter, sans-serif',
            position: 'relative'
        }}>
            {/* Botón de Volver */}
            {onCancel && (
                <button
                    onClick={onCancel}
                    style={{
                        position: 'absolute',
                        top: '20px',
                        left: '20px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '10px',
                        padding: '10px 15px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        fontFamily: 'inherit',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                    }}
                >
                    ← Volver
                </button>
            )}

            <div style={{
                background: '#1a2c30',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '16px',
                padding: '40px',
                maxWidth: '400px',
                width: '100%',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
                {/* Logo/Título */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: 'rgba(19, 200, 236, 0.1)',
                        color: '#13c8ec',
                        fontSize: '24px',
                        fontWeight: '600',
                        margin: '0 auto 16px auto'
                    }}>
                        🔐
                    </div>
                    <h1 style={{
                        color: '#fff',
                        fontSize: '24px',
                        fontWeight: '700',
                        margin: '0 0 8px 0'
                    }}>
                        Super Admin
                    </h1>
                    <p style={{
                        color: '#94a3b8',
                        fontSize: '14px',
                        margin: 0
                    }}>
                        Inicia sesión para gestionar el sistema
                    </p>
                </div>

                {/* Formulario */}
                <form onSubmit={handleSubmit}>
                    {/* Usuario */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            color: '#e2e8f0',
                            fontSize: '13px',
                            fontWeight: '600',
                            marginBottom: '8px'
                        }}>
                            Usuario
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Ingresa tu usuario"
                                required
                                style={{
                                    width: '100%',
                                    background: '#234248',
                                    border: '1px solid transparent',
                                    borderRadius: '10px',
                                    padding: '12px 16px',
                                    color: '#fff',
                                    fontSize: '14px',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                    transition: 'all 0.2s',
                                    fontFamily: 'inherit'
                                }}
                                onFocus={(e) => {
                                    e.target.style.background = '#1a2c30';
                                    e.target.style.borderColor = '#13c8ec';
                                }}
                                onBlur={(e) => {
                                    e.target.style.background = '#234248';
                                    e.target.style.borderColor = 'transparent';
                                }}
                            />
                        </div>
                    </div>

                    {/* Contraseña */}
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{
                            display: 'block',
                            color: '#e2e8f0',
                            fontSize: '13px',
                            fontWeight: '600',
                            marginBottom: '8px'
                        }}>
                            Contraseña
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                style={{
                                    width: '100%',
                                    background: '#234248',
                                    border: '1px solid transparent',
                                    borderRadius: '10px',
                                    padding: '12px 16px',
                                    color: '#fff',
                                    fontSize: '14px',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                    transition: 'all 0.2s',
                                    fontFamily: 'inherit'
                                }}
                                onFocus={(e) => {
                                    e.target.style.background = '#1a2c30';
                                    e.target.style.borderColor = '#13c8ec';
                                }}
                                onBlur={(e) => {
                                    e.target.style.background = '#234248';
                                    e.target.style.borderColor = 'transparent';
                                }}
                            />
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            borderRadius: '8px',
                            padding: '12px',
                            color: '#ef4444',
                            fontSize: '13px',
                            marginBottom: '20px',
                            textAlign: 'center'
                        }}>
                            {error}
                        </div>
                    )}

                    {/* Botón */}
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            background: '#13c8ec',
                            color: '#0f172a',
                            border: 'none',
                            borderRadius: '10px',
                            padding: '12px',
                            fontSize: '14px',
                            fontWeight: '700',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.7 : 1,
                            transition: 'all 0.2s',
                            boxShadow: '0 0 20px rgba(19, 200, 236, 0.2)',
                            fontFamily: 'inherit'
                        }}
                        onMouseEnter={(e) => !loading && (e.target.style.transform = 'translateY(-1px)')}
                        onMouseLeave={(e) => !loading && (e.target.style.transform = 'translateY(0)')}
                    >
                        {loading ? 'Verificando...' : 'Iniciar Sesión'}
                    </button>
                </form>

                {/* Footer del login */}
                <div style={{
                    marginTop: '24px',
                    textAlign: 'center',
                    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                    paddingTop: '20px'
                }}>
                    <button
                        type="button"
                        onClick={onCancel}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#94a3b8',
                            fontSize: '13px',
                            cursor: 'pointer',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            transition: 'all 0.2s',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginBottom: '12px'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.color = '#fff';
                            e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.color = '#94a3b8';
                            e.target.style.background = 'transparent';
                        }}
                    >
                        ← Volver al Inicio
                    </button>
                    <p style={{
                        color: 'rgba(255, 255, 255, 0.3)',
                        fontSize: '12px',
                        margin: 0
                    }}>
                        Acceso restringido • Solo personal autorizado
                    </p>
                </div>
            </div>
        </div>
    );
}

export default SuperAdminLogin;
