import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { EventConfigProvider } from './lib/EventConfigProvider';
import Home from './Home';
import AdminPanel from './AdminPanel';
import AdminLogin from './AdminLogin';

const SESSION_KEY = 'acb_admin_session';

function EventContent({ slug }) {
    const navigate = useNavigate();

    // Restaurar sesión desde localStorage al montar (persiste al cerrar browser)
    const restoreSession = () => {
        try {
            const raw = localStorage.getItem(SESSION_KEY);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            if (parsed?.slug === slug && parsed?.event_id) return parsed;
        } catch { }
        return null;
    };

    const savedSession = restoreSession();
    const [currentView, setCurrentView] = useState(savedSession ? 'admin' : 'home');
    const [showAdminLogin, setShowAdminLogin] = useState(false);
    const [eventAdminUser, setEventAdminUser] = useState(savedSession);
    const [selectedEventForAdmin, setSelectedEventForAdmin] = useState(null);

    const handleShowAdmin = (event = null) => {
        setSelectedEventForAdmin(event);
        setShowAdminLogin(true);
    };

    const handleAdminLogin = (user) => {
        setEventAdminUser(user);
        setShowAdminLogin(false);
        setCurrentView('admin');
        // Persistir solo datos mínimos en localStorage (persiste al cerrar browser)
        try {
            const slim = { slug, event_id: user.event_id, username: user.username };
            localStorage.setItem(SESSION_KEY, JSON.stringify(slim));
        } catch { }
    };

    const handleBack = () => {
        setCurrentView('home');
        setShowAdminLogin(false);
        setEventAdminUser(null);
        localStorage.removeItem(SESSION_KEY);
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
