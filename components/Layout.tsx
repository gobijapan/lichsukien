
import React, { useState, useEffect } from 'react';
import { Calendar, CalendarDays, Bell, Settings, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { TabType, AppSettings, SystemBanner } from '../types';
import { BACKGROUNDS } from '../constants';

interface LayoutProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  children: React.ReactNode;
  settings: AppSettings;
  fontClass: string;
  banners: SystemBanner[]; // Changed from systemAlert to banners list
}

const Layout: React.FC<LayoutProps> = ({ currentTab, onTabChange, children, settings, fontClass, banners }) => {
  // Background logic
  let bgUrl = '';
  if (settings.bgId === 'custom' && settings.customBg) {
    bgUrl = settings.customBg;
  } else {
    bgUrl = BACKGROUNDS.find(b => b.id === settings.bgId)?.url || BACKGROUNDS[0].url;
  }

  // Active Banners Carousel Logic
  const activeBanners = banners.filter(b => b.isActive);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  useEffect(() => {
      if (activeBanners.length > 1) {
          const interval = setInterval(() => {
              setCurrentBannerIndex(prev => (prev + 1) % activeBanners.length);
          }, 5000); // 5 seconds slide
          return () => clearInterval(interval);
      }
  }, [activeBanners.length]);

  const currentBanner = activeBanners.length > 0 ? activeBanners[currentBannerIndex] : null;

  const getBannerStyle = (type: string) => {
      switch(type) {
          case 'warning': return 'bg-yellow-500 text-black';
          case 'error': return 'bg-red-600 text-white';
          default: return 'bg-blue-600 text-white';
      }
  }
  const getBannerIcon = (type: string) => {
      switch(type) {
          case 'warning': return <AlertTriangle size={16} />;
          case 'error': return <AlertCircle size={16} />;
          default: return <Info size={16} />;
      }
  }

  return (
    <div className={`${settings.darkMode ? 'dark' : ''} w-full min-h-[100dvh]`}>
      <div className={`w-full min-h-[100dvh] max-w-md mx-auto relative overflow-hidden flex flex-col ${fontClass} transition-all duration-500`}>
        {/* Dynamic Background */}
        <div 
          className="fixed inset-0 z-0 bg-cover bg-center transition-all duration-700 max-w-md mx-auto"
          style={{ backgroundImage: `url(${bgUrl})` }}
        >
          <div className={`absolute inset-0 transition-colors duration-500 ${settings.darkMode ? 'bg-slate-900/80' : 'bg-black/30'}`}></div>
        </div>

        {/* CAROUSEL BANNER */}
        {currentBanner && (
            <div className={`fixed top-0 max-w-md w-full z-[60] px-4 py-2 flex items-center justify-center gap-2 text-xs font-bold shadow-lg animate-in slide-in-from-top duration-500 ${getBannerStyle(currentBanner.type)}`}>
                {getBannerIcon(currentBanner.type)}
                <span className="marquee whitespace-nowrap overflow-hidden text-ellipsis">{currentBanner.content}</span>
                {activeBanners.length > 1 && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] opacity-60 bg-black/20 px-1.5 rounded-full">
                        {currentBannerIndex + 1}/{activeBanners.length}
                    </span>
                )}
            </div>
        )}

        {/* Main Content */}
        <main className={`flex-1 overflow-y-auto relative z-10 pb-24 md:pb-28 ${currentBanner ? 'pt-8' : ''}`}>
          {children}
        </main>

        {/* Navigation */}
        {currentTab !== 'admin' && (
          <nav className="fixed bottom-0 z-50 w-full max-w-md mx-auto">
            <div className="glass-dark border-t border-white/10 backdrop-blur-xl flex justify-around items-center py-2 pb-safe">
              <NavButton active={currentTab === 'today'} onClick={() => onTabChange('today')} icon={<Calendar size={24} />} label="Hôm Nay" primaryColor={settings.primaryColor} />
              <NavButton active={currentTab === 'month'} onClick={() => onTabChange('month')} icon={<CalendarDays size={24} />} label="Tháng" primaryColor={settings.primaryColor} />
              <NavButton active={currentTab === 'events'} onClick={() => onTabChange('events')} icon={<Bell size={24} />} label="Sự Kiện" primaryColor={settings.primaryColor} />
              <NavButton active={currentTab === 'settings'} onClick={() => onTabChange('settings')} icon={<Settings size={24} />} label="Cài Đặt" primaryColor={settings.primaryColor} />
            </div>
          </nav>
        )}
      </div>
    </div>
  );
};

const NavButton: React.FC<{active: boolean, onClick: () => void, icon: React.ReactNode, label: string, primaryColor: string}> = ({ active, onClick, icon, label, primaryColor }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center w-16 h-14 rounded-2xl transition-all duration-300 ${active ? 'text-white shadow-lg backdrop-blur-md transform -translate-y-1' : 'text-white/50 hover:text-white/80'}`}
    style={{ backgroundColor: active ? primaryColor : 'transparent' }}
  >
    {icon}
    <span className={`text-[10px] mt-1 font-medium ${active ? 'text-white' : 'text-white/50'}`}>{label}</span>
  </button>
);

export default Layout;
