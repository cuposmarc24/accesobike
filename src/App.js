import { useState, useEffect } from 'react';
import SeatMap from './SeatMap';
import AdminPanel from './AdminPanel';
import AdminLogin from './AdminLogin';
import Footer from './Footer';
import Home from './Home';
import SuperAdminLogin from './SuperAdminLogin';
import SuperAdminPanel from './SuperAdminPanel';
import { EventConfigProvider } from './lib/EventConfigProvider';
import { superAdminAuth } from './lib/auth';

function AppContent() {
  const [currentView, setCurrentView] = useState('home');
  const [selectedRodada, setSelectedRodada] = useState('');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showSuperAdminLogin, setShowSuperAdminLogin] = useState(false);
  const [superAdminUser, setSuperAdminUser] = useState(null);
  const [selectedEventForAdmin, setSelectedEventForAdmin] = useState(null);

  const [eventAdminUser, setEventAdminUser] = useState(null);

  // Atajo de teclado para Super Admin: Ctrl+Shift+S
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        setShowSuperAdminLogin(true);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const showSeatMap = (rodada) => {
    console.log('🔍 showSeatMap called with:', rodada);
    setSelectedRodada(rodada);
    setCurrentView('seatmap');
  };

  const showAdminPanel = (event = null) => {
    setSelectedEventForAdmin(event);
    setShowAdminLogin(true);
  };

  const handleAdminLogin = (user) => {
    setEventAdminUser(user);
    setShowAdminLogin(false);
    setCurrentView('admin');
  };

  const goBack = () => {
    setCurrentView('home');
    setShowAdminLogin(false);
    setEventAdminUser(null);
  };

  const showSuperAdmin = () => {
    setShowSuperAdminLogin(true);
  };

  const handleSuperAdminLogin = (user) => {
    setSuperAdminUser(user);
    setShowSuperAdminLogin(false);
    setCurrentView('superadmin');
  };

  const handleSuperAdminLogout = () => {
    setSuperAdminUser(null);
    setCurrentView('home');
  };

  // Cerrar login si se cancela
  const closeAdminLogin = () => {
    setShowAdminLogin(false);
    setSelectedEventForAdmin(null);
  };

  const closeSuperAdminLogin = () => {
    setShowSuperAdminLogin(false);
  };

  if (showSuperAdminLogin) {
    return <SuperAdminLogin onLoginSuccess={handleSuperAdminLogin} onCancel={closeSuperAdminLogin} />;
  }

  if (currentView === 'superadmin') {
    return <SuperAdminPanel onLogout={handleSuperAdminLogout} />;
  }

  if (showAdminLogin) {
    return <AdminLogin onLogin={handleAdminLogin} onCancel={closeAdminLogin} event={selectedEventForAdmin} />;
  }

  if (currentView === 'admin') {
    return (
      <AdminPanel
        onBack={goBack}
        eventId={eventAdminUser?.event_id}
        config={eventAdminUser?.event?.config}
        eventData={eventAdminUser?.event}
      />
    );
  }

  if (currentView === 'seatmap') {
    return <SeatMap rodada={selectedRodada} onBack={goBack} />;
  }

  // Vista Home
  return <Home onSelectSession={showSeatMap} onShowAdmin={showAdminPanel} onShowSuperAdmin={showSuperAdmin} />;
}

// Wrapper principal con EventConfigProvider
function App() {
  return (
    <EventConfigProvider>
      <AppContent />
    </EventConfigProvider>
  );
}

export default App;