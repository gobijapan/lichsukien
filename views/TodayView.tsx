
import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import vi from 'date-fns/locale/vi';
import { getLunarDate } from '../utils/lunar';
import { getEventsForDate, getRemindersForDate } from '../services/storage';
import { LunarDate, CalendarEvent } from '../types';
import { Cloud, Wind, Sparkles, Star, Droplets, Sun, Moon, CalendarDays, Clock, X, MapPin, AlignLeft, Info, Bell } from 'lucide-react';

interface TodayViewProps {
  currentDate: Date;
  fontClass: string;
}

const TodayView: React.FC<TodayViewProps> = ({ currentDate, fontClass }) => {
  const [lunar, setLunar] = useState<LunarDate | null>(null);
  const [todayEvents, setTodayEvents] = useState<CalendarEvent[]>([]);
  const [todayReminders, setTodayReminders] = useState<{ title: string, note?: string, type: 'system' | 'event', eventId?: string }[]>([]);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    setLunar(getLunarDate(currentDate));
    setTodayEvents(getEventsForDate(currentDate));
    setTodayReminders(getRemindersForDate(currentDate));
  }, [currentDate]);

  if (!lunar) return <div className="p-10 text-center text-white">Đang tính toán...</div>;

  const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;

  return (
    <div className={`flex flex-col h-full overflow-y-auto no-scrollbar pb-24 ${fontClass}`}>
      
      {/* Spacer for safe area with extra margin */}
      <div className="pt-safe mt-8"></div>

      {/* Month Year Header (Larger, Closer) */}
      <div className="px-6 pb-2 text-center text-white/90 drop-shadow-md">
        <p className="text-3xl font-bold font-[Playfair_Display]">
          Tháng {format(currentDate, 'MM / yyyy')}
        </p>
      </div>

      {/* Main Solar Date Block */}
      <div className="px-6 py-2">
        <div 
          onClick={() => {
            if (todayEvents.length > 0 || todayReminders.length > 0) setShowDetailModal(true);
          }}
          className={`glass rounded-[3rem] p-8 text-center shadow-2xl border border-white/40 relative overflow-hidden group transition-transform active:scale-95 cursor-pointer`}
        >
          {/* Animated Background Blobs */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/20 rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-yellow-400/20 rounded-full blur-2xl animate-pulse delay-75"></div>

          {/* Weekday INSIDE the card */}
          <p className="uppercase tracking-[0.3em] text-sm font-semibold opacity-90 mb-0 font-sans text-white relative z-10">
            {format(currentDate, 'EEEE', { locale: vi })}
          </p>

          <h1 className={`text-[9rem] leading-[0.85] font-bold tracking-tighter text-white drop-shadow-xl font-sans relative z-10 ${isWeekend ? 'text-red-100' : 'text-white'}`}>
            {format(currentDate, 'dd')}
          </h1>
          
          <div className="mt-6 inline-flex items-center gap-3 bg-black/20 backdrop-blur-sm rounded-full px-6 py-2 border border-white/10 relative z-10">
             <Moon size={16} className="text-yellow-300" />
             <span className="text-xl font-medium text-yellow-100 font-sans">
               {lunar.day} / {lunar.month} Âm
             </span>
             {lunar.leap === 1 && (
                 <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded ml-[-4px]">NHUẬN</span>
             )}
          </div>

          {/* Event Indicator */}
          {(todayEvents.length > 0 || todayReminders.length > 0) && (
             <div className="absolute top-4 right-4 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full animate-bounce">
                {todayEvents.length + todayReminders.length} Thông báo
             </div>
          )}
        </div>
      </div>

      {/* Events Happening Today */}
      {todayEvents.length > 0 && (
        <div className="px-4 mt-4 space-y-2 animate-in slide-in-from-bottom-2 fade-in">
           <h4 className="text-white/60 text-xs uppercase font-bold ml-2 mb-1">Sự kiện hôm nay</h4>
           {todayEvents.map((evt) => (
             <div 
               key={evt.id}
               onClick={() => setShowDetailModal(true)}
               className="glass bg-white/10 border-white/10 rounded-xl p-3 flex items-center justify-between active:bg-white/20 transition-colors cursor-pointer"
             >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${evt.type === 'lunar' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-blue-500/20 text-blue-300'}`}>
                    <CalendarDays size={18} />
                  </div>
                  <div className="min-w-0">
                     <p className="text-white font-bold truncate pr-2">{evt.title}</p>
                     <p className="text-white/60 text-xs truncate">
                       {evt.location || (evt.type === 'lunar' ? 'Sự kiện Âm lịch' : 'Sự kiện Dương lịch')}
                     </p>
                  </div>
                </div>
                <div className="text-white/40">
                  <Info size={16} />
                </div>
             </div>
           ))}
        </div>
      )}

      {/* Reminders / Notifications */}
      {todayReminders.length > 0 && (
          <div className="px-4 mt-4 space-y-2 animate-in slide-in-from-bottom-3 fade-in">
             <h4 className="text-white/60 text-xs uppercase font-bold ml-2 mb-1">Thông báo & Nhắc nhở</h4>
             {todayReminders.map((notif, idx) => (
                <div 
                   key={idx}
                   onClick={() => setShowDetailModal(true)}
                   className="glass bg-red-500/10 border-red-500/20 rounded-xl p-3 flex items-center justify-between active:bg-red-500/20 transition-colors cursor-pointer"
                >
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-red-500/20 text-red-300 flex items-center justify-center shrink-0">
                            <Bell size={18} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-white font-bold truncate pr-2">{notif.title}</p>
                            {notif.note && <p className="text-white/60 text-xs truncate">{notif.note}</p>}
                        </div>
                    </div>
                </div>
             ))}
          </div>
      )}

      {/* Info Grid - Separated */}
      <div className="px-4 mt-4 grid grid-cols-2 gap-3">
         {/* Year & Solar Term */}
         <div className="glass-dark rounded-2xl p-4 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-1 text-white/60 text-xs uppercase">
                <Sun size={14} /> Năm / Tiết Khí
            </div>
            <p className="font-bold text-lg text-white font-[Playfair_Display]">{lunar.yearName}</p>
            <p className="text-sm font-medium text-green-300">{lunar.tietKhi}</p>
         </div>
         {/* Day/Month Can Chi */}
         <div className="glass-dark rounded-2xl p-4 flex flex-col justify-center">
             <div className="flex items-center gap-2 mb-1 text-white/60 text-xs uppercase">
                <Moon size={14} /> Can Chi
            </div>
            <p className="text-sm text-white">Ngày: <span className="font-bold">{lunar.dayName}</span></p>
            <p className="text-sm text-white">Tháng: <span className="font-bold">{lunar.monthName}</span></p>
         </div>
         
         {/* Ngũ Hành - Dedicated Card */}
         <div className="glass-dark rounded-2xl p-4 flex flex-col justify-center col-span-1">
             <div className="flex items-center gap-2 mb-1 text-white/60 text-xs uppercase">
                <Wind size={14} /> Ngũ Hành
            </div>
            <p className="text-sm font-bold text-blue-200">{lunar.nguHanh}</p>
         </div>

         {/* Sao / Trực - Dedicated Card */}
         <div className="glass-dark rounded-2xl p-4 flex flex-col justify-center col-span-1">
             <div className="flex items-center gap-2 mb-1 text-white/60 text-xs uppercase">
                <Star size={14} /> Sao / Trực
            </div>
            <p className="text-sm font-bold text-yellow-200">{lunar.sao}</p>
            <p className="text-xs text-white/70 mt-1">Trực: {lunar.truc}</p>
         </div>
      </div>

      {/* DEDICATED Zodiac Hours Card */}
      <div className="px-4 mt-3">
        <div className="glass-dark rounded-2xl p-4 border border-white/10">
           <div className="flex items-center gap-2 mb-3 text-white/80 font-bold uppercase text-sm border-b border-white/10 pb-2">
              <Clock size={16} /> Giờ Hoàng Đạo (Giờ Tốt)
           </div>
           <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {lunar.gioHoangDao.map((h, idx) => (
                 <div key={idx} className="flex items-center gap-2 text-sm text-white/90">
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0"></div>
                    <span>{h}</span>
                 </div>
              ))}
           </div>
        </div>
      </div>

      {/* Events Detail Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-6 animate-in fade-in duration-200">
           <div className="bg-white rounded-3xl w-full max-w-sm max-h-[70vh] flex flex-col shadow-2xl overflow-hidden relative">
              <div className="bg-red-600 p-4 text-white flex justify-between items-center shrink-0">
                  <h3 className="font-bold text-lg">Chi tiết ngày {format(currentDate, 'dd/MM')}</h3>
                  <button onClick={() => setShowDetailModal(false)} className="bg-white/20 p-1 rounded-full"><X size={20} /></button>
              </div>
              
              <div className="p-4 overflow-y-auto space-y-4">
                 
                 {/* Today's Events Section */}
                 {todayEvents.length > 0 && (
                   <div className="space-y-3">
                     <h5 className="text-xs font-bold text-gray-500 uppercase border-b pb-1">Sự kiện diễn ra</h5>
                     {todayEvents.map((evt, idx) => (
                       <div key={`evt-${idx}`} className="pb-2">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${evt.type === 'lunar' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>
                               {evt.type === 'lunar' ? 'Âm Lịch' : 'Dương Lịch'}
                            </span>
                            {evt.isSystem && <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Ngày lễ</span>}
                          </div>
                          <h4 className="text-lg font-bold text-gray-800">{evt.title}</h4>
                          
                          {evt.location && (
                            <div className="flex gap-2 mt-1 text-gray-600 text-sm">
                               <MapPin size={16} className="shrink-0 text-red-500" />
                               {evt.location}
                            </div>
                          )}
                          
                          {evt.details && (
                            <div className="flex gap-2 mt-1 text-gray-600 text-sm">
                               <AlignLeft size={16} className="shrink-0 text-gray-400" />
                               {evt.details}
                            </div>
                          )}
                       </div>
                     ))}
                   </div>
                 )}

                 {/* Reminders Section */}
                 {todayReminders.length > 0 && (
                   <div className="space-y-3">
                      <h5 className="text-xs font-bold text-gray-500 uppercase border-b pb-1">Nhắc nhở</h5>
                      {todayReminders.map((rem, idx) => (
                        <div key={`rem-${idx}`} className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                           <div className="flex gap-2">
                              <Bell size={16} className="text-orange-500 shrink-0 mt-1" />
                              <div>
                                 <h4 className="text-sm font-bold text-gray-800">{rem.title}</h4>
                                 {rem.note && <p className="text-xs text-gray-600 mt-1">{rem.note}</p>}
                              </div>
                           </div>
                        </div>
                      ))}
                   </div>
                 )}

                 {todayEvents.length === 0 && todayReminders.length === 0 && (
                     <p className="text-center text-gray-500 py-4">Không có thông tin chi tiết.</p>
                 )}
              </div>
              
              <div className="p-4 border-t bg-gray-50 text-center shrink-0">
                 <button onClick={() => setShowDetailModal(false)} className="text-red-600 font-bold text-sm">Đóng</button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default TodayView;
