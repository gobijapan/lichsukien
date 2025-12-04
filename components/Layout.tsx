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
    <div className={`${settings.darkMode ? 'dark' : ''} w-full min-h-[100dvh]`}>
      <div 
        className={`w-full min-h-[100dvh] max-w-md mx-auto relative overflow-hidden flex flex-col ${fontClass} transition-all duration-500`}
      >
        {/* Dynamic Background */}
        <div 
          className="fixed inset-0 z-0 bg-cover bg-center transition-all duration-700 max-w-md mx-auto"
          style={{ backgroundImage: `url(${bgUrl})` }}
        >
          {/* Overlay determined by dark mode */}
          <div className={`absolute inset-0 transition-colors duration-500 ${settings.darkMode ? 'bg-slate-900/80' : 'bg-black/30'}`}></div>
        </div>

        {/* Main Content Area - Add bottom padding so content isn't hidden behind fixed nav */}
        <main className="flex-1 overflow-y-auto relative z-10 pb-24 md:pb-28">
          {children}
        </main>

        {/* Glass Bottom Navigation - FIXED POSITION & SAFE AREA */}
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
