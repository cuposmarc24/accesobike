import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabase';
import BikeLoader from '../BikeLoader';

// Crear contexto para la configuración del evento
export const EventConfigContext = createContext();

// Provider que carga y proporciona la configuración del evento
export const EventConfigProvider = ({ children, eventSlug }) => {
    const [config, setConfig] = useState(null);
    const [eventData, setEventData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadEventConfig();
    }, [eventSlug]);

    const loadEventConfig = async () => {
        try {
            setLoading(true);
            setError(null);

            let data = null;
            let fetchError = null;

            // Solo buscar por slug si se proporciona uno
            if (eventSlug) {
                const response = await supabase
                    .from('events')
                    .select('*')
                    .eq('event_slug', eventSlug)
                    .eq('is_active', true)
                    .maybeSingle();
                data = response.data;
                fetchError = response.error;
            }

            if (fetchError || !data) {
                console.warn('Evento específico no encontrado, buscando evento activo más reciente...');

                // FALLBACK: Buscar cualquier evento activo
                // Usamos maybeSingle() en lugar de single() para evitar error cuando no hay eventos
                const { data: fallbackData, error: fallbackError } = await supabase
                    .from('events')
                    .select('*')
                    .eq('is_active', true)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (fallbackError) {
                    throw fallbackError;
                }

                if (fallbackData) {
                    data = fallbackData;
                    // fetchError se ignora porque encontramos un reemplazo
                } else {
                    // No hay eventos activos — esto es válido, no es un error
                    console.log('ℹ️ No hay eventos activos en este momento.');
                    setLoading(false);
                    return;
                }
            }

            // Guardar datos del evento y su configuración
            setEventData(data);
            setConfig(data.config);

            // Persistir colores para evitar parpadeo en la próxima carga
            const theme = data.config?.theme || {};
            if (theme.backgroundColor) localStorage.setItem('ab_bg', theme.backgroundColor);
            if (theme.primaryColor) localStorage.setItem('ab_primary', theme.primaryColor);

            console.log('✅ Evento cargado:', data.event_name);
            console.log('📋 Configuración:', data.config);

        } catch (err) {
            console.error('Error general:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Función helper para obtener ID de sesión por nombre legacy (rodada1 -> session1)
    const getSessionId = (legacyRodada) => {
        if (!legacyRodada) return null;

        // Convertir rodada1 -> session1, rodada2 -> session2
        if (legacyRodada.startsWith('rodada')) {
            return legacyRodada.replace('rodada', 'session');
        }

        return legacyRodada;
    };

    // Función helper para obtener datos de una sesión específica
    const getSession = (sessionId) => {
        if (!config?.sessions) return null;
        return config.sessions.find(s => s.id === sessionId);
    };

    const value = {
        config,
        eventData,
        loading,
        error,
        eventId: eventData?.id,
        eventName: eventData?.event_name,
        eventSlug: eventData?.event_slug,
        getSessionId,
        getSession,
        reloadConfig: loadEventConfig
    };

    if (loading) {
        const cachedBg = localStorage.getItem('ab_bg') || '#111f22';
        const cachedColor = localStorage.getItem('ab_primary') || '#13c8ec';
        return <BikeLoader bg={cachedBg} color={cachedColor} />;
    }

    if (error) {
        return (
            <div style={{
                background: 'linear-gradient(135deg, #000000 0%, #0d0d0d 50%, #1a1a1a 100%)',
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                color: 'white',
                padding: '20px'
            }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>❌</div>
                <div style={{ fontSize: '24px', marginBottom: '10px' }}>Error al cargar evento</div>
                <div style={{ fontSize: '16px', color: '#ccc' }}>{error}</div>
                <button
                    onClick={loadEventConfig}
                    style={{
                        marginTop: '20px',
                        padding: '12px 24px',
                        background: '#e91e63',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '16px'
                    }}
                >
                    Reintentar
                </button>
            </div>
        );
    }

    return (
        <EventConfigContext.Provider value={value}>
            {children}
        </EventConfigContext.Provider>
    );
};

// Hook personalizado para usar la configuración del evento
export const useEventConfig = () => {
    const context = useContext(EventConfigContext);

    if (!context) {
        throw new Error('useEventConfig debe usarse dentro de un EventConfigProvider');
    }

    return context;
};

export default EventConfigProvider;
