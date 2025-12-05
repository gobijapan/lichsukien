
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
  systemBanners?: SystemBanner[];
}

const Layout: React.FC<LayoutProps> = ({ currentTab, onTabChange, children, settings, fontClass, systemBanners }) => {
  let bgUrl = '';
  if (settings.bgId === 'custom' && settings.customBg) {
    bgUrl = settings.customBg;
  } else {
    bgUrl = BACKGROUNDS.find(b => b.id === settings.bgId)?.url || BACKGROUNDS[0].url;
  }

  // --- Banner Rotation Logic ---
  const activeBanners = systemBanners?.filter(b => b.active) || [];
  const [currentBannerIdx, setCurrentBannerIdx] = useState(0);

  useEffect(() => {
      if (activeBanners.length > 1) {
          const interval = setInterval(() => {
              setCurrentBannerIdx(prev => (prev + 1) % activeBanners.length);
          }, 5000); // 5 seconds per slide
          return () => clearInterval(interval);
      } else {
          setCurrentBannerIdx(0);
      }
  }, [activeBanners.length]);

  const currentBanner = activeBanners[currentBannerIdx];

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
      <div 
        className={`w-full min-h-[100dvh] max-w-md mx-auto relative overflow-hidden flex flex-col ${fontClass} transition-all duration-500`}
      >
        <div 
          className="fixed inset-0 z-0 bg-cover bg-center transition-all duration-700 max-w-md mx-auto"
          style={{ backgroundImage: `url(${bgUrl})` }}
        >
          <div className={`absolute inset-0 transition-colors duration-500 ${settings.darkMode ? 'bg-slate-900/80' : 'bg-black/30'}`}></div>
        </div>

        {/* Global System Banner - Carousel */}
        {currentBanner && (
            <div className={`fixed top-0 max-w-md w-full z-[60] px-4 py-2 flex items-center justify-center gap-2 text-xs font-bold shadow-lg transition-colors duration-500 ${getBannerStyle(currentBanner.type)}`}>
                <div className="shrink-0">{getBannerIcon(currentBanner.type)}</div>
                <div className="flex-1 overflow-hidden relative h-4">
                    <span key={currentBanner.id} className="absolute inset-0 animate-in slide-in-from-bottom duration-500 whitespace-nowrap overflow-hidden text-ellipsis">
                        {currentBanner.content}
                    </span>
                </div>
                {activeBanners.length > 1 && (
                    <div className="flex gap-1">
                        {activeBanners.map((_, i) => (
                            <div key={i} className={`w-1 h-1 rounded-full ${i === currentBannerIdx ? 'bg-white' : 'bg-white/40'}`}></div>
                        ))}
                    </div>
                )}
            </div>
        )}

        <main className={`flex-1 overflow-y-auto relative z-10 pb-24 md:pb-28 ${currentBanner ? 'pt-8' : ''}`}>
          {children}
        </main>

        {currentTab !== 'admin' && (
          <nav className="fixed bottom-0 z-50 w-full max-w-md mx-auto">
            <div className="glass-dark border-t border-white/10 backdrop-blur-xl flex justify-around items-center py-2 pb-safe">
              <NavButton 
                active={currentTab === 'today'} 
                onClick={() => onTabChange('today')} 
                icon={<Calendar size={24} />} 
                label="Hôm Nay" 
                primaryColor={settings.primaryColor}
              />
              <NavButton 
                active={currentTab === 'month'} 
                onClick={() => onTabChange('month')} 
                icon={<CalendarDays size={24} />} 
                label="Tháng" 
                primaryColor={settings.primaryColor}
              />
              <NavButton 
                active={currentTab === 'events'} 
                onClick={() => onTabChange('events')} 
                icon={<Bell size={24} />} 
                label="Sự Kiện" 
                primaryColor={settings.primaryColor}
              />
              <NavButton 
                active={currentTab === 'settings'} 
                onClick={() => onTabChange('settings')} 
                icon={<Settings size={24} />} 
                label="Cài Đặt" 
                primaryColor={settings.primaryColor}
              />
            </div>
          </nav>
        )}
      </div>
    </div>
  );
};

const NavButton: React.FC<{active: boolean, onClick: () => void, icon: React.ReactNode, label: string, primaryColor: string}> = ({
  active, onClick, icon, label, primaryColor
}) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center w-16 h-14 rounded-2xl transition-all duration-300 
      ${active ? 'text-white shadow-lg backdrop-blur-md transform -translate-y-1' : 'text-white/50 hover:text-white/80'}`}
    style={{ backgroundColor: active ? primaryColor : 'transparent' }}
  >
    {icon}
    <span className={`text-[10px] mt-1 font-medium ${active ? 'text-white' : 'text-white/50'}`}>{label}</span>
  </button>
);

export default Layout;
