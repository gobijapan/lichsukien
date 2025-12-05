
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import TodayView from './views/TodayView';
import MonthView from './views/MonthView';
import EventsView from './views/EventsView';
import SettingsView from './views/SettingsView';
import LoginView from './views/LoginView';
import AdminView from './views/AdminView';
import { TabType, AppSettings, User, SystemBanner } from './types';
import { FONTS } from './constants';
import { getSettings, saveSettings, getUserProfile, subscribeToBanners } from './services/storage';
import { auth, messaging } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { requestNotificationPermission } from './services/notification';
import { onMessage } from 'firebase/messaging';
import { Bell, X } from 'lucide-react';

const Toast = ({ title, body, onClose }: { title: string, body: string, onClose: () => void }) => (
    <div className="fixed top-4 left-4 right-4 bg-white/90 backdrop-blur-md shadow-2xl rounded-2xl p-4 z-[100] border-l-4 border-red-500 animate-in slide-in-from-top-2 duration-300 flex gap-3">
        <div className="bg-red-100 p-2 rounded-full h-10 w-10 flex items-center justify-center text-red-600 shrink-0">
            <Bell size={20} />
        </div>
        <div className="flex-1 min-w-0">
            <h4 className="font-bold text-gray-900 text-sm">{title}</h4>
            <p className="text-gray-600 text-xs mt-1 line-clamp-2">{body}</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 self-start">
            <X size={18} />
        </button>
    </div>
);

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [tab, setTab] = useState<TabType>('today');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dataVersion, setDataVersion] = useState(0); 
  
  // Real-time Banners
  const [banners, setBanners] = useState<SystemBanner[]>([]);
  
  // Toast State
  const [toast, setToast] = useState<{title: string, body: string} | null>(null);

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

    // Subscribe to Banners
    const unsubscribeBanners = subscribeToBanners((data) => {
        setBanners(data);
    });

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userProfile = await getUserProfile(firebaseUser.uid);
        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: userProfile.name || firebaseUser.displayName || 'Người dùng',
          role: userProfile.role || 'user',
          dateOfBirth: userProfile.dateOfBirth,
          phoneNumber: userProfile.phoneNumber,
          address: userProfile.address
        });
        requestNotificationPermission(firebaseUser.uid);
      } else {
        setUser(null);
      }
    });

    if (messaging) {
        onMessage(messaging, (payload) => {
            console.log('Message received. ', payload);
            setToast({
                title: payload.notification?.title || 'Thông báo mới',
                body: payload.notification?.body || ''
            });
            try { new Audio('/notification.mp3').play().catch(() => {}); } catch(e) {}
            setTimeout(() => setToast(null), 5000);
        });
    }

    return () => {
        unsubscribeBanners();
        unsubscribeAuth();
    };
  }, []);

  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleLogin = (u: User) => {
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

  const handleDataRestore = () => {
    const saved = getSettings();
    setSettings(saved);
    setDataVersion(prev => prev + 1);
  };

  const fontClass = FONTS[settings.font]?.class || 'font-sans';

  const renderContent = () => {
    if (tab === 'admin') {
       if (user?.role === 'admin') {
           return <AdminView user={user} onClose={() => setTab('settings')} fontClass={fontClass} />;
       }
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
    <>
        {toast && <Toast title={toast.title} body={toast.body} onClose={() => setToast(null)} />}
        
        <Layout 
          currentTab={tab} 
          onTabChange={(t) => {
            if (t === 'today' && tab === 'today') {
               setCurrentDate(new Date());
            }
            setTab(t);
          }} 
          settings={settings}
          fontClass={fontClass}
          banners={banners}
        >
           {renderContent()}
        </Layout>
    </>
  );
};

export default App;
