import { supabase } from './supabase';
import { generateSlug } from './slugUtils';

/**
 * Valida los datos del evento antes de crear
 */
export const validateEventData = (eventData) => {
    const errors = [];

    // Validar nombre
    if (!eventData.event_name || eventData.event_name.trim().length < 3) {
        errors.push('El nombre del evento debe tener al menos 3 caracteres');
    }

    // Validar sesiones
    if (!eventData.config?.sessions || eventData.config.sessions.length === 0) {
        errors.push('Debe configurar al menos una sesión');
    }

    // Validar cada sesión
    eventData.config?.sessions?.forEach((session, index) => {
        if (!session.event_name || session.event_name.trim().length === 0) {
            errors.push(`La sesión ${index + 1} debe tener un nombre`);
        }
        if (!session.seatCount || session.seatCount < 1) {
            errors.push(`La sesión ${index + 1} debe tener al menos 1 asiento`);
        }
    });

    // Validar fechas
    if (eventData.start_date && eventData.end_date) {
        const start = new Date(eventData.start_date);
        const end = new Date(eventData.end_date);
        if (start > end) {
            errors.push('La fecha de inicio debe ser anterior o igual a la fecha de fin');
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Crea un evento completo en Supabase
 */
export const createEvent = async (eventData) => {
    try {
        // Validar datos
        const validation = validateEventData(eventData);
        if (!validation.isValid) {
            return {
                success: false,
                errors: validation.errors
            };
        }

        // Generar slug único
        const slug = await generateSlug(eventData.event_name);

        // Preparar datos del evento
        const eventToCreate = {
            event_name: eventData.event_name.trim(),
            cycling_room: eventData.cycling_room || '',
            cycling_room_logo: eventData.cycling_room_logo || '',
            event_image: eventData.event_image || '',
            event_slug: slug,
            start_date: eventData.start_date || null,
            end_date: eventData.end_date || null,
            is_active: eventData.is_active !== undefined ? eventData.is_active : true,
            config: eventData.config
        };

        // Crear evento
        const { data: createdEvent, error: eventError } = await supabase
            .from('events')
            .insert([eventToCreate])
            .select()
            .single();

        if (eventError) {
            console.error('Error creating event:', eventError);
            return {
                success: false,
                errors: ['Error al crear el evento: ' + eventError.message]
            };
        }

        // Crear asientos para cada sesión
        const seatsCreated = await createSeatsForEvent(createdEvent.id, eventData.config.sessions);

        if (!seatsCreated.success) {
            // Si falla la creación de asientos, eliminar el evento
            await supabase.from('events').delete().eq('id', createdEvent.id);
            return {
                success: false,
                errors: ['Error al crear los asientos: ' + seatsCreated.errors.join(', ')]
            };
        }

        // Crear usuario administrador para el evento
        const adminUsername = eventData.adminUser?.username || eventData.admin_username;
        const adminPassword = eventData.adminUser?.password || eventData.admin_password;
        const adminEmail = eventData.adminUser?.email;

        if (adminUsername && adminPassword) {
            const adminCreated = await createEventAdmin(
                createdEvent.id,
                adminUsername,
                adminPassword,
                eventData.event_name,
                adminEmail
            );

            if (!adminCreated.success) {
                console.warn('Advertencia: No se pudo crear el administrador del evento:', adminCreated.errors);
                // No eliminamos el evento si falla el admin, solo advertimos
            }
        }

        return {
            success: true,
            event: createdEvent,
            seatsCreated: seatsCreated.count
        };

    } catch (error) {
        console.error('Error in createEvent:', error);
        return {
            success: false,
            errors: ['Error inesperado: ' + error.message]
        };
    }
};

/**
 * Crea asientos para todas las sesiones de un evento
 */
export const createSeatsForEvent = async (eventId, sessions) => {
    try {
        const allSeats = [];

        // Para cada sesión, crear los asientos según la configuración de filas
        // Use the layout from the first session (assuming all sessions share the same physical layout)
        const masterSession = sessions[0];

        if (masterSession) {
            const rowConfig = masterSession.rowConfiguration || [6, 5, 5, 5, 6];
            let seatNumber = 1;

            rowConfig.forEach((seatsInRow, rowIndex) => {
                const numericSeats = typeof seatsInRow === 'object' ? seatsInRow.seatCount : seatsInRow;
                const count = parseInt(numericSeats) || 0;

                for (let i = 0; i < count; i++) {
                    allSeats.push({
                        event_id: eventId,
                        seat_number: seatNumber,
                        row_number: rowIndex + 1,
                        is_selectable: true
                    });
                    seatNumber++;
                }
            });
        }

        // Insertar todos los asientos
        const { data, error } = await supabase
            .from('seats')
            .insert(allSeats)
            .select();

        if (error) {
            console.error('Error creating seats:', error);
            return {
                success: false,
                errors: [error.message]
            };
        }

        return {
            success: true,
            count: data.length
        };

    } catch (error) {
        console.error('Error in createSeatsForEvent:', error);
        return {
            success: false,
            errors: [error.message]
        };
    }
};

/**
 * Actualiza un evento existente
 */
export const updateEvent = async (eventId, eventData) => {
    try {
        const { data, error } = await supabase
            .from('events')
            .update({
                event_name: eventData.event_name,
                cycling_room: eventData.cycling_room,
                cycling_room_logo: eventData.cycling_room_logo,
                event_image: eventData.event_image,
                start_date: eventData.start_date,
                end_date: eventData.end_date,
                is_active: eventData.is_active,
                config: eventData.config
            })
            .eq('id', eventId)
            .select()
            .single();

        if (error) {
            console.error('Error updating event:', error);
            return {
                success: false,
                errors: ['Error al actualizar el evento: ' + error.message]
            };
        }

        // Regenerate seats to reflect any configuration changes
        // WARNING: This assumes no critical reservations exist effectively, or we accept wiping them for layout changes.
        //Ideally, we should check for existing reservations before doing this.

        // 1. Delete existing seats
        const { error: deleteError } = await supabase
            .from('seats')
            .delete()
            .eq('event_id', eventId);

        if (deleteError) {
            console.error('Error deleting old seats:', deleteError);
            return {
                success: false,
                errors: ['Error al actualizar la configuración de asientos: ' + deleteError.message]
            };
        }

        // 2. Re-create seats with new config
        // Note: We use eventData.config.sessions which contains the UPDATED configuration
        const seatsResult = await createSeatsForEvent(eventId, eventData.config.sessions);

        if (!seatsResult.success) {
            console.error('Error regenerating seats:', seatsResult.errors);
            return {
                success: false,
                errors: ['Evento actualizado pero error al regenerar asientos: ' + seatsResult.errors.join(', ')]
            };
        }



        // Actualizar o crear usuario administrador si se proporcionan credenciales
        const adminUsername = eventData.adminUser?.username || eventData.admin_username;
        const adminPassword = eventData.adminUser?.password || eventData.admin_password;
        const adminEmail = eventData.adminUser?.email;

        if (adminUsername && adminPassword) {
            // Verificar si ya existe un admin para este evento
            const { data: existingAdmin } = await supabase
                .from('event_admins')
                .select('*')
                .eq('event_id', eventId)
                .single();

            if (existingAdmin) {
                // Actualizar admin existente
                const { error: updateAdminError } = await supabase
                    .from('event_admins')
                    .update({
                        username: adminUsername,
                        password_hash: adminPassword,
                        email: adminEmail || existingAdmin.email,
                        full_name: `Admin - ${eventData.event_name}`
                    })
                    .eq('id', existingAdmin.id);

                if (updateAdminError) {
                    console.warn('Advertencia: No se pudo actualizar el administrador:', updateAdminError);
                } else {
                    console.log('✅ Administrador actualizado exitosamente');
                }
            } else {
                // Crear nuevo admin si no existe
                const adminCreated = await createEventAdmin(
                    eventId,
                    adminUsername,
                    adminPassword,
                    eventData.event_name,
                    adminEmail
                );

                if (!adminCreated.success) {
                    console.warn('Advertencia: No se pudo crear el administrador del evento:', adminCreated.errors);
                }
            }
        }

        return {
            success: true,
            event: data
        };

    } catch (error) {
        return {
            success: false,
            errors: [error.message]
        };
    }
};

/**
 * Elimina un evento y todos sus datos relacionados
 */
export const deleteEvent = async (eventId) => {
    try {
        // Supabase eliminará automáticamente los datos relacionados por CASCADE
        const { error } = await supabase
            .from('events')
            .delete()
            .eq('id', eventId);

        if (error) {
            return {
                success: false,
                errors: [error.message]
            };
        }

        return {
            success: true
        };

    } catch (error) {
        return {
            success: false,
            errors: [error.message]
        };
    }
};

/**
 * Crea un usuario administrador para un evento
 */
export const createEventAdmin = async (eventId, username, password, eventName, email = null) => {
    try {
        const { data, error } = await supabase
            .from('event_admins')
            .insert([{
                event_id: eventId,
                username: username,
                password_hash: password, // En producción, debe hashearse
                email: email || `${username}@event.local`,
                full_name: `Admin - ${eventName}`
            }])
            .select()
            .single();

        if (error) {
            console.error('Error creating event admin:', error);
            return {
                success: false,
                errors: [error.message]
            };
        }

        console.log('✅ Administrador de evento creado exitosamente:', data);
        return {
            success: true,
            admin: data
        };

    } catch (error) {
        console.error('Error in createEventAdmin:', error);
        return {
            success: false,
            errors: [error.message]
        };
    }
};
