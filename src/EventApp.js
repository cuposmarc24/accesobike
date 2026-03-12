import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { EventConfigProvider } from './lib/EventConfigProvider';
import Home from './Home';
import AdminPanel from './AdminPanel';
import AdminLogin from './AdminLogin';

function EventContent({ slug }) {
    const navigate = useNavigate();
    const [currentView, setCurrentView] = useState('home');
    const [showAdminLogin, setShowAdminLogin] = useState(false);
    const [eventAdminUser, setEventAdminUser] = useState(null);
    const [selectedEventForAdmin, setSelectedEventForAdmin] = useState(null);

    const handleShowAdmin = (event = null) => {
        setSelectedEventForAdmin(event);
        setShowAdminLogin(true);
    };

    const handleAdminLogin = (user) => {
        setEventAdminUser(user);
        setShowAdminLogin(false);
        setCurrentView('admin');
    };

    const handleBack = () => {
        setCurrentView('home');
        setShowAdminLogin(false);
        setEventAdminUser(null);
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
