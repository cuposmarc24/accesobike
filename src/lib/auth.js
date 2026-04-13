import { supabase } from './supabase';

// Simular autenticación de super admin (sin Supabase Auth)
// Usamos localStorage para mantener la sesión

export const superAdminAuth = {
    // Login de super admin
    login: async (username, password) => {
        try {
            // Buscar super admin en la base de datos
            const { data, error } = await supabase
                .from('super_admins')
                .select('*')
                .eq('username', username)
                .single();

            if (error || !data) {
                return { success: false, error: 'Usuario no encontrado' };
            }

            // En producción, aquí deberías verificar el hash de la contraseña
            // Por ahora, comparación simple (CAMBIAR EN PRODUCCIÓN)
            if (password === 'admin123') { // Temporal
                // Guardar sesión en localStorage
                const session = {
                    id: data.id,
                    username: data.username,
                    email: data.email,
                    full_name: data.full_name,
                    role: 'super_admin',
                    loginTime: new Date().toISOString()
                };

                localStorage.setItem('superAdminSession', JSON.stringify(session));

                return { success: true, user: session };
            } else {
                return { success: false, error: 'Contraseña incorrecta' };
            }
        } catch (error) {
            console.error('Error en login:', error);
            return { success: false, error: 'Error al iniciar sesión' };
        }
    },

    // Logout
    logout: () => {
        localStorage.removeItem('superAdminSession');
    },

    // Obtener sesión actual
    getSession: () => {
        const sessionStr = localStorage.getItem('superAdminSession');
        if (!sessionStr) return null;

        try {
            return JSON.parse(sessionStr);
        } catch {
            return null;
        }
    },

    // Verificar si está autenticado
    isAuthenticated: () => {
        return superAdminAuth.getSession() !== null;
    }
};

// Autenticación de event admin
export const eventAdminAuth = {
    login: async (username, password) => {
        try {
            // Primera consulta: buscar el admin
            const { data: adminData, error: adminError } = await supabase
                .from('event_admins')
                .select('*')
                .eq('username', username)
                .single();

            if (adminError || !adminData) {
                console.error('Error buscando admin:', adminError);
                return { success: false, error: 'Usuario no encontrado' };
            }

            // Verificación simple (CAMBIAR EN PRODUCCIÓN)
            if (password === adminData.password_hash) {
                // Segunda consulta: obtener el evento relacionado
                const { data: eventData, error: eventError } = await supabase
                    .from('events')
                    .select('*')
                    .eq('id', adminData.event_id)
                    .single();

                if (eventError) {
                    console.error('Error obteniendo evento:', eventError);
                }

                // Excluir imágenes base64 del evento para no superar el límite de localStorage (~5MB)
                const eventSlim = eventData ? {
                    id: eventData.id,
                    event_name: eventData.event_name,
                    event_slug: eventData.event_slug,
                    cycling_room: eventData.cycling_room,
                    // Si el logo es una URL (http) lo guardamos; si es base64 lo omitimos
                    cycling_room_logo: eventData.cycling_room_logo?.startsWith('http') ? eventData.cycling_room_logo : null,
                    is_active: eventData.is_active,
                    config: eventData.config
                } : null;

                const session = {
                    id: adminData.id,
                    username: adminData.username,
                    email: adminData.email,
                    full_name: adminData.full_name,
                    event_id: adminData.event_id,
                    event: eventSlim,
                    role: 'event_admin',
                    loginTime: new Date().toISOString()
                };

                localStorage.setItem('eventAdminSession', JSON.stringify(session));

                return { success: true, user: session };
            } else {
                return { success: false, error: 'Contraseña incorrecta' };
            }
        } catch (error) {
            console.error('Error en login:', error);
            return { success: false, error: 'Error al iniciar sesión' };
        }
    },

    logout: () => {
        localStorage.removeItem('eventAdminSession');
    },

    getSession: () => {
        const sessionStr = localStorage.getItem('eventAdminSession');
        if (!sessionStr) return null;

        try {
            return JSON.parse(sessionStr);
        } catch {
            return null;
        }
    },

    isAuthenticated: () => {
        return eventAdminAuth.getSession() !== null;
    }
};
