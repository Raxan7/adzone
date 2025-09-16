import React, { useState, useEffect } from 'react';
import { PublicAdsPage } from './components/PublicAdsPage';
import { AdminLogin } from './components/AdminLogin';
import { AdminDashboard } from './components/AdminDashboard';

type AppMode = 'public' | 'admin-login' | 'admin-dashboard';

function App() {
  const [mode, setMode] = useState<AppMode>('public');

  useEffect(() => {
    // Check if admin is already logged in
    const adminSession = localStorage.getItem('adzone_admin_session');
    if (adminSession) {
      if (mode === 'admin-login') {
        setMode('admin-dashboard');
      }
    }

    // Check URL for admin access
    if (window.location.pathname.includes('/admin') || window.location.hash.includes('admin')) {
      setMode('admin-login');
    }
  }, [mode]);

  const handleAdminLogin = () => {
    localStorage.setItem('adzone_admin_session', 'true');
    setMode('admin-dashboard');
    // Clean URL
    window.history.replaceState({}, '', '/');
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('adzone_admin_session');
    setMode('public');
  };

  // Secret admin access: press Ctrl+Shift+A
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        if (mode === 'public') {
          setMode('admin-login');
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [mode]);

  switch (mode) {
    case 'admin-login':
      return <AdminLogin onLogin={handleAdminLogin} />;
    
    case 'admin-dashboard':
      return <AdminDashboard onLogout={handleAdminLogout} />;
    
    default:
      return <PublicAdsPage />;
  }
}

export default App;