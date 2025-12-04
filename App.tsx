
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import TodayView from './views/TodayView';
import MonthView from './views/MonthView';
import EventsView from './views/EventsView';
import SettingsView from './views/SettingsView';
import LoginView from './views/LoginView';
import AdminView from './views/AdminView';
import { TabType, AppSettings, User } from './types';
import { FONTS } from './constants';
import { getSettings, saveSettings, getUserProfile } from './services/storage';
import { auth } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { requestNotificationPermission } from './services/notification';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [tab, setTab] = useState<TabType>('today');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dataVersion, setDataVersion] = useState(0); // Used to force re-render views after restore
  
  // Initialize with defaults to avoid undefined errors before load
  const [settings, setSettings] = useState<AppSettings>({ 
    bgId: 'bg-1', 
    font: 'inter', 
    darkMode: false, 
    primaryColor: '#D91E18',
    weekStart: 'monday',
    reminderSettings: {
      enabled: true,
      lunar15_1: true,
      solarHolidays: true,
      lunarHolidays: true,
      defaultReminders: []
    }
  });

  useEffect(() => {
    const saved = getSettings();
    setSettings(saved);

    // Listen to Firebase Auth State
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch extended profile info from Firestore
        const userProfile = await getUserProfile(firebaseUser.uid);

        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: userProfile.name || firebaseUser.displayName || 'Người dùng',
          role: userProfile.role || 'user', // Use role from Firestore
          dateOfBirth: userProfile.dateOfBirth,
          phoneNumber: userProfile.phoneNumber,
          address: userProfile.address
        });
        // Request Notification Permission when logged in
        requestNotificationPermission(firebaseUser.uid);
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleLogin = (u: User) => {
    // This is mainly handled by onAuthStateChanged now, but kept for compatibility
    setTab('today');
  };

  const handleLogout = () => {
    setUser(null);
    setTab('today');
  };

  const refreshUserProfile = async () => {
      if (user) {
          const userProfile = await getUserProfile(user.id);
          setUser(prev => prev ? ({...prev, ...userProfile}) : null);
      }
  }

  // Called when data is restored from backup
  const handleDataRestore = () => {
    const saved = getSettings();
    setSettings(saved);
    // Increment version to force re-mount of views so they fetch new data from localStorage
    setDataVersion(prev => prev + 1);
  };

  const fontClass = FONTS[settings.font]?.class || 'font-sans';

  // Render Logic
  const renderContent = () => {
    if (tab === 'admin') {
       if (user?.role === 'admin') {
           // Pass onClose to return to settings instead of logging out
           return <AdminView user={user} onClose={() => setTab('settings')} fontClass={fontClass} />;
       }
       // Pass onClose to return to settings if user cancels login
       return <LoginView onLogin={handleLogin} onClose={() => setTab('settings')} fontClass={fontClass} />;
    }

    const viewProps = { fontClass }; 

    switch(tab) {
      case 'today':
        return <TodayView key={dataVersion} currentDate={currentDate} {...viewProps} />;
      case 'month':
        return (
          <MonthView 
            key={dataVersion}
            currentDate={currentDate} 
            onDateSelect={(d) => { 
                setCurrentDate(d); 
                setTab('today'); 
            }} 
            themeStyles={{bg: 'bg-transparent', card: 'glass', text: 'text-white', primaryText: 'text-yellow-300', border: 'border-white/20', primary: 'bg-red-600'}} 
            primaryColor={settings.primaryColor}
          />
        );
      case 'events':
         return <EventsView key={dataVersion} themeStyles={{bg: 'bg-transparent', card: 'glass', text: 'text-white', primaryText: 'text-yellow-300', border: 'border-white/20', primary: 'bg-red-600'}} primaryColor={settings.primaryColor} />;
      case 'settings':
         return (
           <SettingsView 
              key={dataVersion}
              settings={settings} 
              updateSettings={handleUpdateSettings} 
              user={user}
              onLogout={handleLogout}
              onLoginClick={() => setTab('admin')}
              fontClass={fontClass}
              onRefreshProfile={refreshUserProfile}
              onDataRestore={handleDataRestore}
           />
         );
      default:
        return <TodayView key={dataVersion} currentDate={currentDate} {...viewProps} />;
    }
  };

  return (
    <Layout 
      currentTab={tab} 
      onTabChange={(t) => {
        // Feature: Tap 'Today' again to reset to actual today
        if (t === 'today' && tab === 'today') {
           setCurrentDate(new Date());
        }
        if (t === 'admin' && user?.role !== 'admin') {
             // allow login view
        }
        setTab(t);
      }} 
      settings={settings}
      fontClass={fontClass}
    >
       {renderContent()}
    </Layout>
  );
};

export default App;
