
import React from 'react';
import { Calendar, CalendarDays, Bell, Settings } from 'lucide-react';
import { TabType, AppSettings } from '../types';
import { BACKGROUNDS } from '../constants';

interface LayoutProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  children: React.ReactNode;
  settings: AppSettings;
  fontClass: string;
}

const Layout: React.FC<LayoutProps> = ({ currentTab, onTabChange, children, settings, fontClass }) => {
  // Determine background URL: Preset or Custom Base64
  let bgUrl = '';
  if (settings.bgId === 'custom' && settings.customBg) {
    bgUrl = settings.customBg;
  } else {
    bgUrl = BACKGROUNDS.find(b => b.id === settings.bgId)?.url || BACKGROUNDS[0].url;
  }

  return (
    <div className={`${settings.darkMode ? 'dark' : ''} w-full h-screen`}>
      <div 
        className={`w-full h-full max-w-md mx-auto relative overflow-hidden flex flex-col ${fontClass} transition-all duration-500`}
      >
        {/* Dynamic Background */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-700"
          style={{ backgroundImage: `url(${bgUrl})` }}
        >
          {/* Overlay determined by dark mode */}
          <div className={`absolute inset-0 transition-colors duration-500 ${settings.darkMode ? 'bg-slate-900/80' : 'bg-black/30'}`}></div>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 h-full overflow-hidden relative z-10">
          {children}
        </main>

        {/* Glass Bottom Navigation */}
        {currentTab !== 'admin' && (
          <nav className="absolute bottom-0 w-full glass-dark border-t border-white/10 flex justify-around items-center py-2 px-2 pb-safe z-50">
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
      ${active ? 'text-white shadow-lg backdrop-blur-md transform -translate-y-2' : 'text-white/50 hover:text-white/80'}`}
    style={{ backgroundColor: active ? primaryColor : 'transparent' }}
  >
    {icon}
    <span className={`text-[10px] mt-1 font-medium ${active ? 'text-white' : 'text-white/50'}`}>{label}</span>
  </button>
);

export default Layout;
