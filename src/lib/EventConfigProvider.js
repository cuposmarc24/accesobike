import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabase';

// Crear contexto para la configuración del evento
const EventConfigContext = createContext();

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
                    .single();
                data = response.data;
                fetchError = response.error;
            }

            if (fetchError || !data) {
                console.warn('Evento específico no encontrado, buscando evento activo más reciente...');

                // FALLBACK: Buscar cualquier evento activo
                const { data: fallbackData, error: fallbackError } = await supabase
                    .from('events')
                    .select('*')
                    .eq('is_active', true)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                if (fallbackError) {
                    throw fallbackError;
                }

                if (fallbackData) {
                    data = fallbackData;
                    // fetchError se ignora porque encontramos un reemplazo
                } else {
                    setError('No se encontraron eventos activos');
                    return;
                }
            }

            // Guardar datos del evento y su configuración
            setEventData(data);
            setConfig(data.config);

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
        return (
            <div style={{
                background: '#111f22',
                minHeight: '100vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                <div style={{ width: '60px', height: '60px' }}>
                    <svg fill="#13c8ec" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <rect x="1" y="1" width="7.33" height="7.33">
                            <animate id="spinner_oJFS" begin="0;spinner_5T1J.end+0.2s" attributeName="x" dur="0.6s" values="1;4;1" />
                            <animate begin="0;spinner_5T1J.end+0.2s" attributeName="y" dur="0.6s" values="1;4;1" />
                            <animate begin="0;spinner_5T1J.end+0.2s" attributeName="width" dur="0.6s" values="7.33;1.33;7.33" />
                            <animate begin="0;spinner_5T1J.end+0.2s" attributeName="height" dur="0.6s" values="7.33;1.33;7.33" />
                        </rect>
                        <rect x="8.33" y="1" width="7.33" height="7.33">
                            <animate begin="spinner_oJFS.begin+0.1s" attributeName="x" dur="0.6s" values="8.33;11.33;8.33" />
                            <animate begin="spinner_oJFS.begin+0.1s" attributeName="y" dur="0.6s" values="1;4;1" />
                            <animate begin="spinner_oJFS.begin+0.1s" attributeName="width" dur="0.6s" values="7.33;1.33;7.33" />
                            <animate begin="spinner_oJFS.begin+0.1s" attributeName="height" dur="0.6s" values="7.33;1.33;7.33" />
                        </rect>
                        <rect x="1" y="8.33" width="7.33" height="7.33">
                            <animate begin="spinner_oJFS.begin+0.1s" attributeName="x" dur="0.6s" values="1;4;1" />
                            <animate begin="spinner_oJFS.begin+0.1s" attributeName="y" dur="0.6s" values="8.33;11.33;8.33" />
                            <animate begin="spinner_oJFS.begin+0.1s" attributeName="width" dur="0.6s" values="7.33;1.33;7.33" />
                            <animate begin="spinner_oJFS.begin+0.1s" attributeName="height" dur="0.6s" values="7.33;1.33;7.33" />
                        </rect>
                        <rect x="15.66" y="1" width="7.33" height="7.33">
                            <animate begin="spinner_oJFS.begin+0.2s" attributeName="x" dur="0.6s" values="15.66;18.66;15.66" />
                            <animate begin="spinner_oJFS.begin+0.2s" attributeName="y" dur="0.6s" values="1;4;1" />
                            <animate begin="spinner_oJFS.begin+0.2s" attributeName="width" dur="0.6s" values="7.33;1.33;7.33" />
                            <animate begin="spinner_oJFS.begin+0.2s" attributeName="height" dur="0.6s" values="7.33;1.33;7.33" />
                        </rect>
                        <rect x="8.33" y="8.33" width="7.33" height="7.33">
                            <animate begin="spinner_oJFS.begin+0.2s" attributeName="x" dur="0.6s" values="8.33;11.33;8.33" />
                            <animate begin="spinner_oJFS.begin+0.2s" attributeName="y" dur="0.6s" values="8.33;11.33;8.33" />
                            <animate begin="spinner_oJFS.begin+0.2s" attributeName="width" dur="0.6s" values="7.33;1.33;7.33" />
                            <animate begin="spinner_oJFS.begin+0.2s" attributeName="height" dur="0.6s" values="7.33;1.33;7.33" />
                        </rect>
                        <rect x="1" y="15.66" width="7.33" height="7.33">
                            <animate begin="spinner_oJFS.begin+0.2s" attributeName="x" dur="0.6s" values="1;4;1" />
                            <animate begin="spinner_oJFS.begin+0.2s" attributeName="y" dur="0.6s" values="15.66;18.66;15.66" />
                            <animate begin="spinner_oJFS.begin+0.2s" attributeName="width" dur="0.6s" values="7.33;1.33;7.33" />
                            <animate begin="spinner_oJFS.begin+0.2s" attributeName="height" dur="0.6s" values="7.33;1.33;7.33" />
                        </rect>
                        <rect x="15.66" y="8.33" width="7.33" height="7.33">
                            <animate begin="spinner_oJFS.begin+0.3s" attributeName="x" dur="0.6s" values="15.66;18.66;15.66" />
                            <animate begin="spinner_oJFS.begin+0.3s" attributeName="y" dur="0.6s" values="8.33;11.33;8.33" />
                            <animate begin="spinner_oJFS.begin+0.3s" attributeName="width" dur="0.6s" values="7.33;1.33;7.33" />
                            <animate begin="spinner_oJFS.begin+0.3s" attributeName="height" dur="0.6s" values="7.33;1.33;7.33" />
                        </rect>
                        <rect x="8.33" y="15.66" width="7.33" height="7.33">
                            <animate begin="spinner_oJFS.begin+0.3s" attributeName="x" dur="0.6s" values="8.33;11.33;8.33" />
                            <animate begin="spinner_oJFS.begin+0.3s" attributeName="y" dur="0.6s" values="15.66;18.66;15.66" />
                            <animate begin="spinner_oJFS.begin+0.3s" attributeName="width" dur="0.6s" values="7.33;1.33;7.33" />
                            <animate begin="spinner_oJFS.begin+0.3s" attributeName="height" dur="0.6s" values="7.33;1.33;7.33" />
                        </rect>
                        <rect x="15.66" y="15.66" width="7.33" height="7.33">
                            <animate id="spinner_5T1J" begin="spinner_oJFS.begin+0.4s" attributeName="x" dur="0.6s" values="15.66;18.66;15.66" />
                            <animate begin="spinner_oJFS.begin+0.4s" attributeName="y" dur="0.6s" values="15.66;18.66;15.66" />
                            <animate begin="spinner_oJFS.begin+0.4s" attributeName="width" dur="0.6s" values="7.33;1.33;7.33" />
                            <animate begin="spinner_oJFS.begin+0.4s" attributeName="height" dur="0.6s" values="7.33;1.33;7.33" />
                        </rect>
                    </svg>
                </div>
            </div>
        );
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
