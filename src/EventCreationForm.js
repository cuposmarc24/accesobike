import { useState, useEffect } from 'react';
import { createEvent, updateEvent } from './lib/eventCreation';

// Icon Components (same as before)
const InfoIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
);

const CalendarIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
);

const UsersIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);

const GridIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
    </svg>
);

const SettingsIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v6m0 6v6m6-12h-6m-6 0H1m17.66 5.34l-4.24 4.24m-6.84 0L2.34 7.34m15.32 9.32l-4.24-4.24m-6.84 0l-4.24 4.24" />
    </svg>
);

const UserCheckIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="8.5" cy="7" r="4" />
        <polyline points="17 11 19 13 23 9" />
    </svg>
);

const CloseIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const CheckIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const ArrowLeftIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
    </svg>
);

const ArrowRightIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
    </svg>
);

const PlusIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

const TrashIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
);


function EventCreationForm({ onClose, onEventCreated, editingEvent }) {
    const [formData, setFormData] = useState({
        event_name: '',
        cycling_room: '',
        cycling_room_logo: '',
        event_image: '',
        start_date: '',
        end_date: '',
        is_active: true,
        expiration_date: '',
        auto_deactivate: true,
        config: {
            theme: {
                primaryColor: '#13c8ec',
                secondaryColor: '#e91e63',
                backgroundColor: '#111f22'
            },
            sessions: [
                {
                    id: 'session1',
                    event_name: '',
                    price: '',
                    time: '',
                    seatCount: 27,
                    rowConfiguration: [6, 5, 5, 5, 6],
                    instructors: [{ name: '', rank: '' }]
                }
            ],
            whatsapp: {
                adminPhone: ''
            },
            texts: {
                welcomeMessage: 'Bienvenido a nuestro evento'
            },
            branding: {
                logoUrl: ''
            },
            features: {
                enableAuction: false
            }
        },
        adminUser: {
            username: '',
            password: '',
            email: ''
        }
    });

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState([]);
    const [currentStep, setCurrentStep] = useState(1);

    // Load editing data if in edit mode
    useEffect(() => {
        if (editingEvent) {
            // Helper to format date for input type="date" (YYYY-MM-DD)
            const formatDateForInput = (dateString) => {
                if (!dateString) return '';
                try {
                    return new Date(dateString).toISOString().split('T')[0];
                } catch (e) {
                    return '';
                }
            };

            setFormData({
                id: editingEvent.id,
                event_name: editingEvent.event_name || '',
                cycling_room: editingEvent.cycling_room || '',
                cycling_room_logo: editingEvent.cycling_room_logo || '', // Added this field
                event_image: editingEvent.event_image || '',
                start_date: formatDateForInput(editingEvent.start_date),
                end_date: formatDateForInput(editingEvent.end_date),
                is_active: editingEvent.is_active !== undefined ? editingEvent.is_active : true,
                expiration_date: formatDateForInput(editingEvent.expiration_date),
                auto_deactivate: editingEvent.auto_deactivate !== undefined ? editingEvent.auto_deactivate : true,
                config: editingEvent.config || formData.config,
                adminUser: {
                    username: '',
                    password: '',
                    email: ''
                }
            });
        }
    }, [editingEvent]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleConfigChange = (path, value) => {
        setFormData(prev => {
            const newConfig = { ...prev.config };
            const keys = path.split('.');
            let current = newConfig;

            for (let i = 0; i < keys.length - 1; i++) {
                current = current[keys[i]];
            }

            current[keys[keys.length - 1]] = value;

            return {
                ...prev,
                config: newConfig
            };
        });
    };

    const handleSessionChange = (index, field, value) => {
        setFormData(prev => {
            const newSessions = [...prev.config.sessions];
            // For seatCount, allow empty string or parse to number
            const processedValue = field === 'seatCount'
                ? (value === '' ? '' : (parseInt(value) || 0))
                : value;

            newSessions[index] = {
                ...newSessions[index],
                [field]: processedValue
            };

            return {
                ...prev,
                config: {
                    ...prev.config,
                    sessions: newSessions
                }
            };
        });
    };

    const handleInstructorChange = (sessionIndex, instructorIndex, field, value) => {
        setFormData(prev => {
            const newSessions = [...prev.config.sessions];
            const newInstructors = [...newSessions[sessionIndex].instructors];
            newInstructors[instructorIndex] = {
                ...newInstructors[instructorIndex],
                [field]: value
            };
            newSessions[sessionIndex] = {
                ...newSessions[sessionIndex],
                instructors: newInstructors
            };

            return {
                ...prev,
                config: {
                    ...prev.config,
                    sessions: newSessions
                }
            };
        });
    };

    const addInstructor = (sessionIndex) => {
        setFormData(prev => {
            const newSessions = [...prev.config.sessions];
            newSessions[sessionIndex].instructors.push({ name: '', rank: '' });

            return {
                ...prev,
                config: {
                    ...prev.config,
                    sessions: newSessions
                }
            };
        });
    };

    const removeInstructor = (sessionIndex, instructorIndex) => {
        setFormData(prev => {
            const newSessions = [...prev.config.sessions];
            if (newSessions[sessionIndex].instructors.length > 1) {
                newSessions[sessionIndex].instructors = newSessions[sessionIndex].instructors.filter((_, i) => i !== instructorIndex);
            }

            return {
                ...prev,
                config: {
                    ...prev.config,
                    sessions: newSessions
                }
            };
        });
    };

    const handleRowConfigChange = (sessionIndex, rowIndex, value) => {
        setFormData(prev => {
            const newSessions = [...prev.config.sessions];
            const newRowConfig = [...newSessions[sessionIndex].rowConfiguration];
            // Allow empty string, otherwise parse to number
            newRowConfig[rowIndex] = value === '' ? '' : (parseInt(value) || 0);
            newSessions[sessionIndex] = {
                ...newSessions[sessionIndex],
                rowConfiguration: newRowConfig
            };

            return {
                ...prev,
                config: {
                    ...prev.config,
                    sessions: newSessions
                }
            };
        });
    };

    const addRow = (sessionIndex) => {
        setFormData(prev => {
            const newSessions = [...prev.config.sessions];
            newSessions[sessionIndex].rowConfiguration.push(5);
            newSessions[sessionIndex].seatCount = newSessions[sessionIndex].rowConfiguration.reduce((sum, seats) => sum + seats, 0);

            return {
                ...prev,
                config: {
                    ...prev.config,
                    sessions: newSessions
                }
            };
        });
    };

    const removeRow = (sessionIndex, rowIndex) => {
        setFormData(prev => {
            const newSessions = [...prev.config.sessions];
            if (newSessions[sessionIndex].rowConfiguration.length > 1) {
                newSessions[sessionIndex].rowConfiguration = newSessions[sessionIndex].rowConfiguration.filter((_, i) => i !== rowIndex);
                newSessions[sessionIndex].seatCount = newSessions[sessionIndex].rowConfiguration.reduce((sum, seats) => sum + seats, 0);
            }

            return {
                ...prev,
                config: {
                    ...prev.config,
                    sessions: newSessions
                }
            };
        });
    };

    const addSession = () => {
        const newSessionNumber = formData.config.sessions.length + 1;
        setFormData(prev => ({
            ...prev,
            config: {
                ...prev.config,
                sessions: [
                    ...prev.config.sessions,
                    {
                        id: `session${newSessionNumber}`,
                        event_name: `Sesión ${newSessionNumber}`,
                        price: '',
                        time: '',
                        seatCount: 27,
                        rowConfiguration: [6, 5, 5, 5, 6],
                        instructors: [{ name: '' }]
                    }
                ]
            }
        }));
    };

    const removeSession = (index) => {
        if (formData.config.sessions.length > 1) {
            setFormData(prev => ({
                ...prev,
                config: {
                    ...prev.config,
                    sessions: prev.config.sessions.filter((_, i) => i !== index)
                }
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Only allow submit if on step 6
        if (currentStep !== 6) {
            return;
        }

        setLoading(true);
        setErrors([]);

        // Check if we're editing or creating
        if (editingEvent && formData.id) {
            // Update existing event using updateEvent function
            const result = await updateEvent(formData.id, formData);

            if (result.success) {
                console.log('✅ Evento actualizado exitosamente');
                onEventCreated && onEventCreated(result.event);
                onClose && onClose();
            } else {
                console.error('❌ Error al actualizar evento:', result.errors);
                setErrors(result.errors);
            }
        } else {
            // Create new event
            const result = await createEvent(formData);

            if (result.success) {
                console.log('✅ Evento creado exitosamente');
                onEventCreated && onEventCreated(result.event);
                onClose && onClose();
            } else {
                console.error('❌ Error al crear evento:', result.errors);
                setErrors(result.errors);
            }
        }

        setLoading(false);
    };

    const handleKeyDown = (e) => {
        // Prevent Enter key from submitting form unless explicitly clicking submit button
        if (e.key === 'Enter' && e.target.type !== 'textarea' && e.target.type !== 'submit') {
            e.preventDefault();
        }
    };

    const isStepValid = (step) => {
        switch (step) {
            case 1: // Información Básica
                return formData.event_name.trim().length >= 3;

            case 2: // Sesiones
                return formData.config.sessions.every(session =>
                    session.event_name.trim().length > 0 &&
                    session.time.trim().length > 0 &&
                    session.seatCount > 0
                );

            case 3: // Instructores
                return formData.config.sessions.every(session =>
                    session.instructors.every(instructor => instructor.name.trim().length > 0)
                );

            case 4: // Disposición de Asientos
                return formData.config.sessions.every(session => {
                    const rowTotal = session.rowConfiguration.reduce((sum, seats) => {
                        const seatNum = seats === '' ? 0 : (typeof seats === 'number' ? seats : parseInt(seats) || 0);
                        return sum + seatNum;
                    }, 0);
                    const targetTotal = session.seatCount === '' ? 0 : (typeof session.seatCount === 'number' ? session.seatCount : parseInt(session.seatCount) || 0);
                    return rowTotal === targetTotal && targetTotal > 0;
                });

            case 5: // Tema y Configuración
                return true; // Optional fields, always valid

            case 6: // Admin y Expiración
                return formData.adminUser.username.trim().length > 0 &&
                    formData.adminUser.password.trim().length >= 6;

            default:
                return true;
        }
    };

    const nextStep = () => {
        if (currentStep < 6) setCurrentStep(currentStep + 1);
    };

    const prevStep = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
    };

    const stepTitles = [
        { icon: <InfoIcon />, title: 'Información Básica' },
        { icon: <CalendarIcon />, title: 'Sesiones del Evento' },
        { icon: <UsersIcon />, title: 'Instructores' },
        { icon: <GridIcon />, title: 'Disposición de Asientos' },
        { icon: <SettingsIcon />, title: 'Tema y Configuración' },
        { icon: <UserCheckIcon />, title: 'Admin y Expiración' }
    ];

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(10px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '480px',
                maxHeight: '90vh',
                background: '#1a2c30',
                borderRadius: '20px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexShrink: 0
                }}>
                    <h2 style={{
                        fontSize: '20px',
                        fontWeight: '700',
                        color: '#fff',
                        margin: 0
                    }}>
                        Crear Nuevo Evento
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(255,255,255,0.08)',
                            border: 'none',
                            borderRadius: '10px',
                            width: '36px',
                            height: '36px',
                            cursor: 'pointer',
                            color: '#94a3b8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s'
                        }}
                    >
                        <CloseIcon />
                    </button>
                </div>

                {/* Progress Steps */}
                <div style={{
                    padding: '20px 24px 16px',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    flexShrink: 0
                }}>
                    <div style={{
                        display: 'flex',
                        gap: '6px',
                        marginBottom: '12px'
                    }}>
                        {[1, 2, 3, 4, 5, 6].map(step => (
                            <div
                                key={step}
                                style={{
                                    flex: 1,
                                    height: '3px',
                                    background: currentStep >= step ? '#13c8ec' : 'rgba(255,255,255,0.1)',
                                    borderRadius: '2px',
                                    transition: 'all 0.3s ease'
                                }}
                            />
                        ))}
                    </div>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        color: '#13c8ec'
                    }}>
                        {stepTitles[currentStep - 1].icon}
                        <span style={{
                            fontSize: '14px',
                            fontWeight: '600'
                        }}>
                            Paso {currentStep}/6: {stepTitles[currentStep - 1].title}
                        </span>
                    </div>
                </div>

                {/* Form Content - Scrollable */}
                <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                    overflow: 'hidden'
                }}>
                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '24px',
                        WebkitOverflowScrolling: 'touch'
                    }}>
                        {/* Step 1: Información Básica */}
                        {currentStep === 1 && (
                            <div style={{ animation: 'fadeIn 0.3s ease' }}>
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{
                                        display: 'block',
                                        color: '#94a3b8',
                                        marginBottom: '8px',
                                        fontSize: '13px',
                                        fontWeight: '500'
                                    }}>
                                        Nombre del Evento
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.event_name}
                                        onChange={(e) => handleInputChange('event_name', e.target.value)}
                                        placeholder="Ej: Carnaval Party"
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '12px 14px',
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '10px',
                                            color: '#fff',
                                            fontSize: '15px',
                                            boxSizing: 'border-box',
                                            outline: 'none',
                                            transition: 'all 0.2s'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = '#13c8ec'}
                                        onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                                    />
                                </div>

                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{
                                        display: 'block',
                                        color: '#94a3b8',
                                        marginBottom: '8px',
                                        fontSize: '13px',
                                        fontWeight: '500'
                                    }}>
                                        Sala de Ciclismo
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.cycling_room}
                                        onChange={(e) => handleInputChange('cycling_room', e.target.value)}
                                        placeholder="Ej: Sala 1, Sala Principal, Outdoor..."
                                        style={{
                                            width: '100%',
                                            padding: '12px 14px',
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '10px',
                                            color: '#fff',
                                            fontSize: '15px',
                                            boxSizing: 'border-box',
                                            outline: 'none',
                                            transition: 'all 0.2s'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = '#13c8ec'}
                                        onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                                    />
                                </div>

                                {/* Cycling Room Logo Upload */}
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{
                                        display: 'block',
                                        color: '#94a3b8',
                                        marginBottom: '8px',
                                        fontSize: '13px',
                                        fontWeight: '500'
                                    }}>
                                        Logo de la Sala
                                    </label>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <label style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            background: 'rgba(19, 200, 236, 0.1)',
                                            border: '1px solid rgba(19, 200, 236, 0.3)',
                                            borderRadius: '10px',
                                            padding: '10px 16px',
                                            color: '#13c8ec',
                                            fontSize: '13px',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}>
                                            📸 {formData.cycling_room_logo ? 'Cambiar Logo' : 'Subir Logo de Sala'}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const file = e.target.files[0];
                                                    if (file) {
                                                        const reader = new FileReader();
                                                        reader.onloadend = () => {
                                                            handleInputChange('cycling_room_logo', reader.result);
                                                        };
                                                        reader.readAsDataURL(file);
                                                    }
                                                }}
                                                style={{ display: 'none' }}
                                            />
                                        </label>

                                        {formData.cycling_room_logo && (
                                            <div style={{ position: 'relative', width: '40px', height: '40px' }}>
                                                <img
                                                    src={formData.cycling_room_logo}
                                                    alt="Preview"
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'contain',
                                                        borderRadius: '6px',
                                                        border: '1px solid rgba(255, 255, 255, 0.2)',
                                                        background: '#000'
                                                    }}
                                                />
                                                <button
                                                    onClick={() => handleInputChange('cycling_room_logo', '')}
                                                    style={{
                                                        position: 'absolute',
                                                        top: '-5px',
                                                        right: '-5px',
                                                        background: '#ef4444',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '50%',
                                                        width: '16px',
                                                        height: '16px',
                                                        fontSize: '10px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                                    <div>
                                        <label style={{
                                            display: 'block',
                                            color: '#94a3b8',
                                            marginBottom: '8px',
                                            fontSize: '13px',
                                            fontWeight: '500'
                                        }}>
                                            Fecha de Inicio
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.start_date}
                                            onChange={(e) => handleInputChange('start_date', e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '12px 14px',
                                                background: 'rgba(255,255,255,0.05)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '10px',
                                                color: '#fff',
                                                fontSize: '14px',
                                                boxSizing: 'border-box',
                                                outline: 'none'
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{
                                            display: 'block',
                                            color: '#94a3b8',
                                            marginBottom: '8px',
                                            fontSize: '13px',
                                            fontWeight: '500'
                                        }}>
                                            Fecha de Fin
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.end_date}
                                            onChange={(e) => handleInputChange('end_date', e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '12px 14px',
                                                background: 'rgba(255,255,255,0.05)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '10px',
                                                color: '#fff',
                                                fontSize: '14px',
                                                boxSizing: 'border-box',
                                                outline: 'none'
                                            }}
                                        />
                                    </div>

                                    <div style={{ marginBottom: '16px' }}>
                                        <label style={{
                                            display: 'block',
                                            color: '#94a3b8',
                                            marginBottom: '8px',
                                            fontSize: '13px',
                                            fontWeight: '500'
                                        }}>
                                            Imagen/Flyer del Evento
                                        </label>

                                        {/* File Input Button */}
                                        <label style={{
                                            display: 'block',
                                            width: '100%',
                                            padding: '12px 14px',
                                            background: 'rgba(19, 200, 236, 0.1)',
                                            border: '2px dashed rgba(19, 200, 236, 0.3)',
                                            borderRadius: '10px',
                                            color: '#13c8ec',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            textAlign: 'center',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            boxSizing: 'border-box'
                                        }}
                                            onMouseEnter={(e) => {
                                                e.target.style.background = 'rgba(19, 200, 236, 0.15)';
                                                e.target.style.borderColor = 'rgba(19, 200, 236, 0.5)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.target.style.background = 'rgba(19, 200, 236, 0.1)';
                                                e.target.style.borderColor = 'rgba(19, 200, 236, 0.3)';
                                            }}>
                                            📸 {formData.event_image ? 'Cambiar Imagen' : 'Seleccionar Imagen desde Galería'}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const file = e.target.files[0];
                                                    if (file) {
                                                        // Convert to base64 for preview and storage
                                                        const reader = new FileReader();
                                                        reader.onloadend = () => {
                                                            handleInputChange('event_image', reader.result);
                                                        };
                                                        reader.readAsDataURL(file);
                                                    }
                                                }}
                                                style={{ display: 'none' }}
                                            />
                                        </label>

                                        {/* Image Preview */}
                                        {formData.event_image && (
                                            <div style={{
                                                marginTop: '12px',
                                                padding: '12px',
                                                background: 'rgba(255,255,255,0.03)',
                                                borderRadius: '10px',
                                                border: '1px solid rgba(255,255,255,0.06)',
                                                position: 'relative'
                                            }}>
                                                <div style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    marginBottom: '8px'
                                                }}>
                                                    <p style={{
                                                        color: '#94a3b8',
                                                        fontSize: '11px',
                                                        margin: 0,
                                                        fontWeight: '500'
                                                    }}>
                                                        Vista previa:
                                                    </p>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleInputChange('event_image', '')}
                                                        style={{
                                                            background: 'rgba(239, 68, 68, 0.15)',
                                                            border: 'none',
                                                            borderRadius: '6px',
                                                            padding: '4px 8px',
                                                            color: '#ef4444',
                                                            fontSize: '11px',
                                                            fontWeight: '600',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        ✕ Eliminar
                                                    </button>
                                                </div>
                                                <img
                                                    src={formData.event_image}
                                                    alt="Event Preview"
                                                    style={{
                                                        width: '100%',
                                                        maxHeight: '250px',
                                                        objectFit: 'contain',
                                                        borderRadius: '8px',
                                                        background: 'rgba(0,0,0,0.2)'
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div style={{
                                    background: 'rgba(19, 200, 236, 0.08)',
                                    border: '1px solid rgba(19, 200, 236, 0.2)',
                                    borderRadius: '10px',
                                    padding: '14px'
                                }}>
                                    <label style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        cursor: 'pointer',
                                        userSelect: 'none'
                                    }}>
                                        <input
                                            type="checkbox"
                                            checked={formData.is_active}
                                            onChange={(e) => handleInputChange('is_active', e.target.checked)}
                                            style={{
                                                width: '18px',
                                                height: '18px',
                                                cursor: 'pointer',
                                                accentColor: '#13c8ec'
                                            }}
                                        />
                                        <span style={{ color: '#fff', fontSize: '14px', fontWeight: '500' }}>
                                            Evento Activo
                                        </span>
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Configuración de Sesiones */}
                        {currentStep === 2 && (
                            <div style={{ animation: 'fadeIn 0.3s ease' }}>
                                {formData.config.sessions.map((session, index) => (
                                    <div
                                        key={index}
                                        style={{
                                            background: 'rgba(255,255,255,0.03)',
                                            padding: '16px',
                                            borderRadius: '12px',
                                            marginBottom: '12px',
                                            border: '1px solid rgba(255,255,255,0.06)'
                                        }}
                                    >
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginBottom: '14px'
                                        }}>
                                            <h4 style={{
                                                color: '#fff',
                                                margin: 0,
                                                fontSize: '14px',
                                                fontWeight: '600'
                                            }}>
                                                Sesión {index + 1}
                                            </h4>
                                            {formData.config.sessions.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeSession(index)}
                                                    style={{
                                                        background: 'rgba(239, 68, 68, 0.15)',
                                                        border: 'none',
                                                        borderRadius: '8px',
                                                        padding: '6px 10px',
                                                        color: '#ef4444',
                                                        cursor: 'pointer',
                                                        fontSize: '13px',
                                                        fontWeight: '500',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px'
                                                    }}
                                                >
                                                    <TrashIcon />
                                                    Eliminar
                                                </button>
                                            )}
                                        </div>

                                        <div style={{ marginBottom: '12px' }}>
                                            <label style={{
                                                display: 'block',
                                                color: '#94a3b8',
                                                marginBottom: '6px',
                                                fontSize: '12px',
                                                fontWeight: '500'
                                            }}>
                                                Nombre
                                            </label>
                                            <input
                                                type="text"
                                                value={session.event_name}
                                                onChange={(e) => handleSessionChange(index, 'event_name', e.target.value)}
                                                placeholder="Ej: Sesión 1"
                                                required
                                                style={{
                                                    width: '100%',
                                                    padding: '10px 12px',
                                                    background: 'rgba(255,255,255,0.05)',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    borderRadius: '8px',
                                                    color: '#fff',
                                                    fontSize: '14px',
                                                    boxSizing: 'border-box',
                                                    outline: 'none'
                                                }}
                                            />
                                        </div>

                                        <div style={{ marginBottom: '12px' }}>
                                            <label style={{
                                                display: 'block',
                                                color: '#94a3b8',
                                                marginBottom: '6px',
                                                fontSize: '12px',
                                                fontWeight: '500'
                                            }}>
                                                Hora
                                            </label>
                                            <input
                                                type="time"
                                                value={session.time}
                                                onChange={(e) => handleSessionChange(index, 'time', e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    padding: '10px 12px',
                                                    background: 'rgba(255,255,255,0.05)',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    borderRadius: '8px',
                                                    color: '#fff',
                                                    fontSize: '14px',
                                                    boxSizing: 'border-box',
                                                    outline: 'none'
                                                }}
                                            />
                                        </div>

                                        <div>
                                            <label style={{
                                                display: 'block',
                                                color: '#94a3b8',
                                                marginBottom: '6px',
                                                fontSize: '12px',
                                                fontWeight: '500'
                                            }}>
                                                Cantidad de Asientos
                                            </label>
                                            <input
                                                type="number"
                                                value={session.seatCount}
                                                onChange={(e) => handleSessionChange(index, 'seatCount', parseInt(e.target.value) || 0)}
                                                onFocus={(e) => e.target.select()}
                                                min="1"
                                                max="100"
                                                placeholder="27"
                                                style={{
                                                    width: '100%',
                                                    padding: '10px 12px',
                                                    background: 'rgba(255,255,255,0.05)',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    borderRadius: '8px',
                                                    color: '#fff',
                                                    fontSize: '14px',
                                                    boxSizing: 'border-box',
                                                    outline: 'none'
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}

                                <button
                                    type="button"
                                    onClick={addSession}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        background: 'rgba(19, 200, 236, 0.1)',
                                        border: '1px dashed #13c8ec',
                                        borderRadius: '10px',
                                        color: '#13c8ec',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    <PlusIcon />
                                    Agregar Sesión
                                </button>
                            </div>
                        )}

                        {/* Step 3: Instructores */}
                        {currentStep === 3 && (
                            <div style={{ animation: 'fadeIn 0.3s ease' }}>
                                {formData.config.sessions.map((session, sessionIndex) => (
                                    <div
                                        key={sessionIndex}
                                        style={{
                                            background: 'rgba(255,255,255,0.03)',
                                            padding: '16px',
                                            borderRadius: '12px',
                                            marginBottom: '16px',
                                            border: '1px solid rgba(255,255,255,0.06)'
                                        }}
                                    >
                                        <h4 style={{
                                            color: '#fff',
                                            margin: '0 0 14px 0',
                                            fontSize: '14px',
                                            fontWeight: '600'
                                        }}>
                                            {session.event_name || `Sesión ${sessionIndex + 1}`}
                                        </h4>

                                        {/* Price Input */}
                                        <div style={{ marginBottom: '16px' }}>
                                            <label style={{
                                                display: 'block',
                                                color: '#94a3b8',
                                                marginBottom: '6px',
                                                fontSize: '12px',
                                                fontWeight: '500'
                                            }}>
                                                Costo del Asiento (ej. $ 50.000)
                                            </label>
                                            <input
                                                type="text"
                                                value={session.price || ''}
                                                onChange={(e) => handleSessionChange(sessionIndex, 'price', e.target.value)}
                                                placeholder="$ 0"
                                                style={{
                                                    width: '100%',
                                                    padding: '10px 12px',
                                                    background: 'rgba(255,255,255,0.05)',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    borderRadius: '8px',
                                                    color: '#fff',
                                                    fontSize: '14px',
                                                    boxSizing: 'border-box',
                                                    outline: 'none'
                                                }}
                                            />
                                        </div>

                                        {/* Session Flyer Upload */}
                                        <div style={{ marginBottom: '16px' }}>
                                            <label style={{
                                                display: 'block',
                                                color: '#94a3b8',
                                                marginBottom: '8px',
                                                fontSize: '12px',
                                                fontWeight: '500'
                                            }}>
                                                Flyer de la Sesión (Opcional)
                                            </label>
                                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                <label style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    background: 'rgba(19, 200, 236, 0.1)',
                                                    border: '1px solid rgba(19, 200, 236, 0.3)',
                                                    borderRadius: '8px',
                                                    padding: '8px 12px',
                                                    color: '#13c8ec',
                                                    fontSize: '12px',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}>
                                                    📸 {session.image ? 'Cambiar Flyer' : 'Subir Flyer'}
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => {
                                                            const file = e.target.files[0];
                                                            if (file) {
                                                                const reader = new FileReader();
                                                                reader.onloadend = () => {
                                                                    handleSessionChange(sessionIndex, 'image', reader.result);
                                                                };
                                                                reader.readAsDataURL(file);
                                                            }
                                                        }}
                                                        style={{ display: 'none' }}
                                                    />
                                                </label>

                                                {session.image && (
                                                    <div style={{ position: 'relative', width: '40px', height: '40px' }}>
                                                        <img
                                                            src={session.image}
                                                            alt="Preview"
                                                            style={{
                                                                width: '100%',
                                                                height: '100%',
                                                                objectFit: 'cover',
                                                                borderRadius: '6px',
                                                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                                                background: '#000'
                                                            }}
                                                        />
                                                        <button
                                                            onClick={() => handleSessionChange(sessionIndex, 'image', '')}
                                                            style={{
                                                                position: 'absolute',
                                                                top: '-5px',
                                                                right: '-5px',
                                                                background: '#ef4444',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '50%',
                                                                width: '16px',
                                                                height: '16px',
                                                                fontSize: '10px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {session.instructors.map((instructor, instructorIndex) => (
                                            <div key={instructorIndex} style={{ marginBottom: '10px' }}>
                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                                                    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                                        <div>
                                                            <label style={{
                                                                display: 'block',
                                                                color: '#94a3b8',
                                                                marginBottom: '6px',
                                                                fontSize: '12px',
                                                                fontWeight: '500'
                                                            }}>
                                                                Instructor {instructorIndex + 1} - Nombre
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={instructor.name}
                                                                onChange={(e) => handleInstructorChange(sessionIndex, instructorIndex, 'name', e.target.value)}
                                                                placeholder="Nombre del instructor"
                                                                style={{
                                                                    width: '100%',
                                                                    padding: '10px 12px',
                                                                    background: 'rgba(255,255,255,0.05)',
                                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                                    borderRadius: '8px',
                                                                    color: '#fff',
                                                                    fontSize: '14px',
                                                                    boxSizing: 'border-box',
                                                                    outline: 'none'
                                                                }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label style={{
                                                                display: 'block',
                                                                color: '#94a3b8',
                                                                marginBottom: '6px',
                                                                fontSize: '12px',
                                                                fontWeight: '500'
                                                            }}>
                                                                Rango
                                                            </label>
                                                            <select
                                                                value={instructor.rank || ''}
                                                                onChange={(e) => handleInstructorChange(sessionIndex, instructorIndex, 'rank', e.target.value)}
                                                                style={{
                                                                    width: '100%',
                                                                    padding: '10px 12px',
                                                                    background: 'rgba(255,255,255,0.05)',
                                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                                    borderRadius: '8px',
                                                                    color: '#fff',
                                                                    fontSize: '14px',
                                                                    boxSizing: 'border-box',
                                                                    outline: 'none',
                                                                    cursor: 'pointer'
                                                                }}
                                                            >
                                                                <option value="" style={{ background: '#0a1419', color: '#fff' }}>Seleccionar...</option>
                                                                <option value="1XB" style={{ background: '#0a1419', color: '#fff' }}>1XB</option>
                                                                <option value="Pro" style={{ background: '#0a1419', color: '#fff' }}>Pro</option>
                                                                <option value="Pro Master" style={{ background: '#0a1419', color: '#fff' }}>Pro Master</option>
                                                                <option value="Master" style={{ background: '#0a1419', color: '#fff' }}>Master</option>
                                                                <option value="Líder Master" style={{ background: '#0a1419', color: '#fff' }}>Líder Master</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                    {session.instructors.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeInstructor(sessionIndex, instructorIndex)}
                                                            style={{
                                                                background: 'rgba(239, 68, 68, 0.15)',
                                                                border: 'none',
                                                                borderRadius: '8px',
                                                                padding: '10px',
                                                                color: '#ef4444',
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center'
                                                            }}
                                                        >
                                                            <TrashIcon />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}

                                        {session.instructors.length < 3 && (
                                            <button
                                                type="button"
                                                onClick={() => addInstructor(sessionIndex)}
                                                style={{
                                                    width: '100%',
                                                    padding: '8px',
                                                    background: 'rgba(19, 200, 236, 0.1)',
                                                    border: '1px dashed rgba(19, 200, 236, 0.3)',
                                                    borderRadius: '8px',
                                                    color: '#13c8ec',
                                                    fontSize: '13px',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '6px',
                                                    marginTop: '8px'
                                                }}
                                            >
                                                <PlusIcon />
                                                Agregar Instructor
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Step 4: Disposición de Asientos */}
                        {currentStep === 4 && (
                            <div style={{ animation: 'fadeIn 0.3s ease' }}>
                                {formData.config.sessions.map((session, sessionIndex) => (
                                    <div
                                        key={sessionIndex}
                                        style={{
                                            background: 'rgba(255,255,255,0.03)',
                                            padding: '16px',
                                            borderRadius: '12px',
                                            marginBottom: '16px',
                                            border: '1px solid rgba(255,255,255,0.06)'
                                        }}
                                    >
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginBottom: '14px'
                                        }}>
                                            <h4 style={{
                                                color: '#fff',
                                                margin: 0,
                                                fontSize: '14px',
                                                fontWeight: '600'
                                            }}>
                                                {session.event_name || `Sesión ${sessionIndex + 1}`}
                                            </h4>
                                            <div style={{
                                                background: 'rgba(19, 200, 236, 0.15)',
                                                padding: '4px 10px',
                                                borderRadius: '6px',
                                                color: '#13c8ec',
                                                fontSize: '12px',
                                                fontWeight: '700'
                                            }}>
                                                Total: {session.seatCount} asientos
                                            </div>
                                        </div>

                                        {session.rowConfiguration.map((seatsInRow, rowIndex) => (
                                            <div key={rowIndex} style={{ marginBottom: '10px' }}>
                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                    <label style={{
                                                        color: '#94a3b8',
                                                        fontSize: '12px',
                                                        fontWeight: '500',
                                                        minWidth: '50px'
                                                    }}>
                                                        Fila {rowIndex + 1}
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={seatsInRow}
                                                        onChange={(e) => handleRowConfigChange(sessionIndex, rowIndex, e.target.value)}
                                                        min="1"
                                                        max="10"
                                                        style={{
                                                            flex: 1,
                                                            padding: '10px 12px',
                                                            background: 'rgba(255,255,255,0.05)',
                                                            border: '1px solid rgba(255,255,255,0.1)',
                                                            borderRadius: '8px',
                                                            color: '#fff',
                                                            fontSize: '14px',
                                                            boxSizing: 'border-box',
                                                            outline: 'none'
                                                        }}
                                                    />
                                                    <span style={{
                                                        color: '#94a3b8',
                                                        fontSize: '12px',
                                                        minWidth: '60px'
                                                    }}>
                                                        asientos
                                                    </span>
                                                    {session.rowConfiguration.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeRow(sessionIndex, rowIndex)}
                                                            style={{
                                                                background: 'rgba(239, 68, 68, 0.15)',
                                                                border: 'none',
                                                                borderRadius: '8px',
                                                                padding: '10px',
                                                                color: '#ef4444',
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center'
                                                            }}
                                                        >
                                                            <TrashIcon />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}

                                        <button
                                            type="button"
                                            onClick={() => addRow(sessionIndex)}
                                            style={{
                                                width: '100%',
                                                padding: '8px',
                                                background: 'rgba(19, 200, 236, 0.1)',
                                                border: '1px dashed rgba(19, 200, 236, 0.3)',
                                                borderRadius: '8px',
                                                color: '#13c8ec',
                                                fontSize: '13px',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '6px',
                                                marginTop: '8px'
                                            }}
                                        >
                                            <PlusIcon />
                                            Agregar Fila
                                        </button>

                                        {/* Validation Message */}
                                        {(() => {
                                            const rowTotal = session.rowConfiguration.reduce((sum, seats) => {
                                                const seatNum = seats === '' ? 0 : (typeof seats === 'number' ? seats : parseInt(seats) || 0);
                                                return sum + seatNum;
                                            }, 0);
                                            const targetTotal = session.seatCount === '' ? 0 : (typeof session.seatCount === 'number' ? session.seatCount : parseInt(session.seatCount) || 0);
                                            const isValid = rowTotal === targetTotal && targetTotal > 0;

                                            return (
                                                <div style={{
                                                    marginTop: '12px',
                                                    padding: '10px 12px',
                                                    borderRadius: '8px',
                                                    background: isValid ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                    border: `1px solid ${isValid ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    fontSize: '12px',
                                                    fontWeight: '600'
                                                }}>
                                                    <span style={{ fontSize: '16px' }}>
                                                        {isValid ? '✓' : '⚠'}
                                                    </span>
                                                    <span style={{ color: isValid ? '#22c55e' : '#ef4444' }}>
                                                        {isValid
                                                            ? `Configuración correcta: ${rowTotal} asientos`
                                                            : `Total de filas: ${rowTotal} / Esperado: ${targetTotal}`
                                                        }
                                                    </span>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Step 5: Tema y Configuración */}
                        {currentStep === 5 && (
                            <div style={{ animation: 'fadeIn 0.3s ease' }}>
                                <div style={{ marginBottom: '18px' }}>
                                    <label style={{
                                        display: 'block',
                                        color: '#94a3b8',
                                        marginBottom: '8px',
                                        fontSize: '13px',
                                        fontWeight: '500'
                                    }}>
                                        Teléfono WhatsApp
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.config.whatsapp.adminPhone}
                                        onChange={(e) => handleConfigChange('whatsapp.adminPhone', e.target.value)}
                                        placeholder="+573001234567"
                                        style={{
                                            width: '100%',
                                            padding: '12px 14px',
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '10px',
                                            color: '#fff',
                                            fontSize: '15px',
                                            boxSizing: 'border-box',
                                            outline: 'none'
                                        }}
                                    />
                                </div>

                                <div style={{ marginBottom: '18px' }}>
                                    <label style={{
                                        display: 'block',
                                        color: '#94a3b8',
                                        marginBottom: '8px',
                                        fontSize: '13px',
                                        fontWeight: '500'
                                    }}>
                                        Mensaje de Bienvenida
                                    </label>
                                    <textarea
                                        value={formData.config.texts.welcomeMessage}
                                        onChange={(e) => handleConfigChange('texts.welcomeMessage', e.target.value)}
                                        placeholder="Mensaje para los usuarios..."
                                        rows="3"
                                        style={{
                                            width: '100%',
                                            padding: '12px 14px',
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '10px',
                                            color: '#fff',
                                            fontSize: '14px',
                                            boxSizing: 'border-box',
                                            resize: 'vertical',
                                            fontFamily: 'inherit',
                                            outline: 'none'
                                        }}
                                    />
                                </div>

                                <div style={{
                                    background: 'rgba(19, 200, 236, 0.08)',
                                    border: '1px solid rgba(19, 200, 236, 0.2)',
                                    borderRadius: '10px',
                                    padding: '14px',
                                    marginBottom: '18px'
                                }}>
                                    <label style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        cursor: 'pointer',
                                        userSelect: 'none'
                                    }}>
                                        <input
                                            type="checkbox"
                                            checked={formData.config.features.enableAuction}
                                            onChange={(e) => handleConfigChange('features.enableAuction', e.target.checked)}
                                            style={{
                                                width: '18px',
                                                height: '18px',
                                                cursor: 'pointer',
                                                accentColor: '#13c8ec'
                                            }}
                                        />
                                        <span style={{ color: '#fff', fontSize: '14px', fontWeight: '500' }}>
                                            Habilitar Subasta VIP
                                        </span>
                                    </label>
                                </div>

                                {/* Color Theme */}
                                <div style={{
                                    background: 'rgba(255,255,255,0.03)',
                                    padding: '16px',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(255,255,255,0.06)'
                                }}>
                                    <h4 style={{
                                        color: '#fff',
                                        marginBottom: '14px',
                                        fontSize: '14px',
                                        fontWeight: '600'
                                    }}>
                                        Tema de Colores
                                    </h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                                        <div>
                                            <label style={{
                                                display: 'block',
                                                color: '#94a3b8',
                                                marginBottom: '6px',
                                                fontSize: '11px',
                                                fontWeight: '500'
                                            }}>
                                                Primario
                                            </label>
                                            <input
                                                type="color"
                                                value={formData.config.theme.primaryColor}
                                                onChange={(e) => handleConfigChange('theme.primaryColor', e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    height: '44px',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                    background: 'transparent'
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{
                                                display: 'block',
                                                color: '#94a3b8',
                                                marginBottom: '6px',
                                                fontSize: '11px',
                                                fontWeight: '500'
                                            }}>
                                                Secundario
                                            </label>
                                            <input
                                                type="color"
                                                value={formData.config.theme.secondaryColor}
                                                onChange={(e) => handleConfigChange('theme.secondaryColor', e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    height: '44px',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                    background: 'transparent'
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{
                                                display: 'block',
                                                color: '#94a3b8',
                                                marginBottom: '6px',
                                                fontSize: '11px',
                                                fontWeight: '500'
                                            }}>
                                                Fondo
                                            </label>
                                            <input
                                                type="color"
                                                value={formData.config.theme.backgroundColor}
                                                onChange={(e) => handleConfigChange('theme.backgroundColor', e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    height: '44px',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                    background: 'transparent'
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 6: Admin y Expiración */}
                        {currentStep === 6 && (
                            <div style={{ animation: 'fadeIn 0.3s ease' }}>
                                <div style={{
                                    background: 'rgba(255,255,255,0.03)',
                                    padding: '16px',
                                    borderRadius: '12px',
                                    marginBottom: '16px',
                                    border: '1px solid rgba(255,255,255,0.06)'
                                }}>
                                    <h4 style={{
                                        color: '#fff',
                                        marginBottom: '14px',
                                        fontSize: '14px',
                                        fontWeight: '600'
                                    }}>
                                        Usuario Administrador del Evento
                                    </h4>

                                    <div style={{ marginBottom: '12px' }}>
                                        <label style={{
                                            display: 'block',
                                            color: '#94a3b8',
                                            marginBottom: '6px',
                                            fontSize: '12px',
                                            fontWeight: '500'
                                        }}>
                                            Nombre de Usuario
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.adminUser.username}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                adminUser: { ...prev.adminUser, username: e.target.value }
                                            }))}
                                            placeholder="admin_evento"
                                            style={{
                                                width: '100%',
                                                padding: '10px 12px',
                                                background: 'rgba(255,255,255,0.05)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '8px',
                                                color: '#fff',
                                                fontSize: '14px',
                                                boxSizing: 'border-box',
                                                outline: 'none'
                                            }}
                                        />
                                    </div>

                                    <div style={{ marginBottom: '12px' }}>
                                        <label style={{
                                            display: 'block',
                                            color: '#94a3b8',
                                            marginBottom: '6px',
                                            fontSize: '12px',
                                            fontWeight: '500'
                                        }}>
                                            Contraseña
                                        </label>
                                        <input
                                            type="password"
                                            value={formData.adminUser.password}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                adminUser: { ...prev.adminUser, password: e.target.value }
                                            }))}
                                            placeholder="••••••••"
                                            style={{
                                                width: '100%',
                                                padding: '10px 12px',
                                                background: 'rgba(255,255,255,0.05)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '8px',
                                                color: '#fff',
                                                fontSize: '14px',
                                                boxSizing: 'border-box',
                                                outline: 'none'
                                            }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{
                                            display: 'block',
                                            color: '#94a3b8',
                                            marginBottom: '6px',
                                            fontSize: '12px',
                                            fontWeight: '500'
                                        }}>
                                            Email (opcional)
                                        </label>
                                        <input
                                            type="email"
                                            value={formData.adminUser.email}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                adminUser: { ...prev.adminUser, email: e.target.value }
                                            }))}
                                            placeholder="admin@evento.com"
                                            style={{
                                                width: '100%',
                                                padding: '10px 12px',
                                                background: 'rgba(255,255,255,0.05)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '8px',
                                                color: '#fff',
                                                fontSize: '14px',
                                                boxSizing: 'border-box',
                                                outline: 'none'
                                            }}
                                        />
                                    </div>
                                </div>

                                <div style={{
                                    background: 'rgba(255,255,255,0.03)',
                                    padding: '16px',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(255,255,255,0.06)'
                                }}>
                                    <h4 style={{
                                        color: '#fff',
                                        marginBottom: '14px',
                                        fontSize: '14px',
                                        fontWeight: '600'
                                    }}>
                                        Expiración del Evento
                                    </h4>

                                    <div style={{ marginBottom: '12px' }}>
                                        <label style={{
                                            display: 'block',
                                            color: '#94a3b8',
                                            marginBottom: '6px',
                                            fontSize: '12px',
                                            fontWeight: '500'
                                        }}>
                                            Fecha de Expiración (Fecha de Fin)
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.end_date}
                                            onChange={(e) => handleInputChange('end_date', e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '10px 12px',
                                                background: 'rgba(255,255,255,0.05)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '8px',
                                                color: '#fff',
                                                fontSize: '14px',
                                                boxSizing: 'border-box',
                                                outline: 'none'
                                            }}
                                        />
                                    </div>

                                    <div style={{
                                        background: 'rgba(19, 200, 236, 0.08)',
                                        border: '1px solid rgba(19, 200, 236, 0.2)',
                                        borderRadius: '8px',
                                        padding: '12px'
                                    }}>
                                        <label style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            cursor: 'pointer',
                                            userSelect: 'none'
                                        }}>
                                            <input
                                                type="checkbox"
                                                checked={formData.auto_deactivate}
                                                onChange={(e) => handleInputChange('auto_deactivate', e.target.checked)}
                                                style={{
                                                    width: '18px',
                                                    height: '18px',
                                                    cursor: 'pointer',
                                                    accentColor: '#13c8ec'
                                                }}
                                            />
                                            <span style={{ color: '#fff', fontSize: '13px', fontWeight: '500' }}>
                                                Desactivar automáticamente al expirar
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Error Display */}
                        {errors.length > 0 && (
                            <div style={{
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                borderRadius: '10px',
                                padding: '12px',
                                marginTop: '16px'
                            }}>
                                <h4 style={{ color: '#ef4444', margin: '0 0 8px 0', fontSize: '13px', fontWeight: '600' }}>
                                    Errores de Validación
                                </h4>
                                <ul style={{ margin: 0, paddingLeft: '18px', color: '#ef4444', fontSize: '12px' }}>
                                    {errors.map((error, index) => (
                                        <li key={index}>{error}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Navigation Buttons - Fixed at bottom */}
                    <div style={{
                        padding: '16px 24px',
                        borderTop: '1px solid rgba(255,255,255,0.08)',
                        display: 'flex',
                        gap: '10px',
                        flexShrink: 0
                    }}>
                        {currentStep > 1 && (
                            <button
                                type="button"
                                onClick={prevStep}
                                style={{
                                    flex: 1,
                                    padding: '13px',
                                    background: 'rgba(255,255,255,0.06)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '12px',
                                    color: '#fff',
                                    fontSize: '15px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }}
                            >
                                <ArrowLeftIcon />
                                Anterior
                            </button>
                        )}
                        {currentStep < 6 ? (
                            <button
                                type="button"
                                onClick={nextStep}
                                disabled={!isStepValid(currentStep)}
                                style={{
                                    flex: 1,
                                    padding: '13px',
                                    background: isStepValid(currentStep) ? '#13c8ec' : 'rgba(255,255,255,0.1)',
                                    border: 'none',
                                    borderRadius: '12px',
                                    color: isStepValid(currentStep) ? '#0a1419' : '#64748b',
                                    fontSize: '15px',
                                    fontWeight: '700',
                                    cursor: isStepValid(currentStep) ? 'pointer' : 'not-allowed',
                                    boxShadow: isStepValid(currentStep) ? '0 4px 15px rgba(19, 200, 236, 0.3)' : 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    opacity: isStepValid(currentStep) ? 1 : 0.5,
                                    transition: 'all 0.2s'
                                }}
                            >
                                Siguiente
                                <ArrowRightIcon />
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={loading || !isStepValid(currentStep)}
                                style={{
                                    flex: 1,
                                    padding: '13px',
                                    background: (loading || !isStepValid(currentStep)) ? 'rgba(255,255,255,0.1)' : '#13c8ec',
                                    border: 'none',
                                    borderRadius: '12px',
                                    color: (loading || !isStepValid(currentStep)) ? '#64748b' : '#0a1419',
                                    fontSize: '15px',
                                    fontWeight: '700',
                                    cursor: (loading || !isStepValid(currentStep)) ? 'not-allowed' : 'pointer',
                                    boxShadow: (loading || !isStepValid(currentStep)) ? 'none' : '0 4px 15px rgba(19, 200, 236, 0.3)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    opacity: (loading || !isStepValid(currentStep)) ? 0.5 : 1,
                                    transition: 'all 0.2s'
                                }}
                            >
                                {loading ? (
                                    'Creando...'
                                ) : (
                                    <>
                                        <CheckIcon />
                                        Crear Evento
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </form>

                <style>{`
                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(8px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    
                    input[type="date"]::-webkit-calendar-picker-indicator,
                    input[type="time"]::-webkit-calendar-picker-indicator {
                        filter: invert(1);
                        cursor: pointer;
                    }
                `}</style>
            </div>
        </div>
    );
}

export default EventCreationForm;
