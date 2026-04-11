import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { EventConfigProvider } from './lib/EventConfigProvider';
import Home from './Home';
import AdminPanel from './AdminPanel';
import AdminLogin from './AdminLogin';

const SESSION_KEY = 'acb_admin_session';

function EventContent({ slug }) {
    const navigate = useNavigate();

    // Restaurar sesión desde sessionStorage al montar
    const restoreSession = () => {
        try {
            const raw = sessionStorage.getItem(SESSION_KEY);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            // Solo restaurar si es del mismo slug/evento
            if (parsed?.slug === slug) return parsed.user;
        } catch { }
        return null;
    };

    const savedUser = restoreSession();
    const [currentView, setCurrentView] = useState(savedUser ? 'admin' : 'home');
    const [showAdminLogin, setShowAdminLogin] = useState(false);
    const [eventAdminUser, setEventAdminUser] = useState(savedUser);
    const [selectedEventForAdmin, setSelectedEventForAdmin] = useState(null);

    const handleShowAdmin = (event = null) => {
        setSelectedEventForAdmin(event);
        setShowAdminLogin(true);
    };

    const handleAdminLogin = (user) => {
        setEventAdminUser(user);
        setShowAdminLogin(false);
        setCurrentView('admin');
        // Persistir sesión
        try {
            sessionStorage.setItem(SESSION_KEY, JSON.stringify({ slug, user }));
        } catch { }
    };

    const handleBack = () => {
        setCurrentView('home');
        setShowAdminLogin(false);
        setEventAdminUser(null);
        sessionStorage.removeItem(SESSION_KEY);
    };

    if (showAdminLogin) {
        return (
            <AdminLogin
                onLogin={handleAdminLogin}
                onCancel={() => { setShowAdminLogin(false); setSelectedEventForAdmin(null); }}
                event={selectedEventForAdmin}
            />
        );
    }

    if (currentView === 'admin') {
        return (
            <AdminPanel
                onBack={handleBack}
                eventId={eventAdminUser?.event_id}
                config={eventAdminUser?.event?.config}
                eventData={eventAdminUser?.event}
            />
        );
    }

    return (
        <Home
            onSelectSession={() => {}} // Home handles this internally
            onShowAdmin={handleShowAdmin}
            onShowSuperAdmin={() => navigate('/')}
            eventSlug={slug}
        />
    );
}

function EventApp() {
    const { slug } = useParams();

    return (
        <EventConfigProvider eventSlug={slug}>
            <EventContent slug={slug} />
        </EventConfigProvider>
    );
}

export default EventApp;
