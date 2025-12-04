
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  format, 
  endOfMonth, 
  endOfWeek, 
  eachDayOfInterval, 
  addMonths, 
  subMonths, 
  isSameMonth, 
  isSameDay,
  isToday,
  addDays
} from 'date-fns';
import startOfMonth from 'date-fns/startOfMonth';
import startOfWeek from 'date-fns/startOfWeek';
import vi from 'date-fns/locale/vi';
import { ChevronLeft, ChevronRight, Bell, X, Calendar as CalendarIcon, MapPin, AlignLeft, Calendar } from 'lucide-react';
import { getLunarDate } from '../utils/lunar';
import { getEvents, getEventsForDate } from '../services/storage';
import { CalendarEvent } from '../types';
import { getSettings } from '../services/storage';

interface MonthViewProps {
  currentDate: Date;
  onDateSelect: (date: Date) => void;
  themeStyles: any;
  primaryColor: string;
}

const MonthView: React.FC<MonthViewProps> = ({ currentDate, onDateSelect, themeStyles, primaryColor }) => {
  const [viewDate, setViewDate] = useState(currentDate);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedEventForDetail, setSelectedEventForDetail] = useState<CalendarEvent | null>(null);
  
  const settings = getSettings();

  // Refs for scrolling
  const monthListRef = useRef<HTMLDivElement>(null);
  const yearListRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logic when picker opens - INSTANT scroll
  useEffect(() => {
    if (showDatePicker) {
        // Wait for render
        setTimeout(() => {
            const mEl = document.getElementById(`month-${viewDate.getMonth() + 1}`);
            const yEl = document.getElementById(`year-${viewDate.getFullYear()}`);
            if (mEl && monthListRef.current) mEl.scrollIntoView({ block: 'center', behavior: 'instant' as any });
            if (yEl && yearListRef.current) yEl.scrollIntoView({ block: 'center', behavior: 'instant' as any });
        }, 50);
    }
  }, [showDatePicker, viewDate]);

  // Swipe logic
  const touchStartRef = useRef<number | null>(null);
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.targetTouches[0].clientX;
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touchEnd = e.changedTouches[0].clientX;
    const distance = touchStartRef.current - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) nextMonth();
    if (isRightSwipe) prevMonth();
    
    touchStartRef.current = null;
  }

  const prevMonth = () => setViewDate(subMonths(viewDate, 1));
  const nextMonth = () => setViewDate(addMonths(viewDate, 1));

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(monthStart);
  
  const weekStartIdx = settings.weekStart === 'monday' ? 1 : 0;
  const startDate = startOfWeek(monthStart, { weekStartsOn: weekStartIdx as 0 | 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: weekStartIdx as 0 | 1 });

  const allDays = eachDayOfInterval({ start: startDate, end: endDate });

  // Pre-calculate Events and Reminders for the visible days
  const { eventMap, reminderMap, monthEventsList } = useMemo(() => {
     const eMap = new Map<string, CalendarEvent[]>();
     const rMap = new Map<string, boolean>();
     const monthList: { date: Date, events: CalendarEvent[] }[] = [];

     const allUserEvents = getEvents(); 
     
     // 1. Calculate map for Grid
     allDays.forEach(day => {
        const dayKey = format(day, 'yyyy-MM-dd');
        
        // Check Events
        const eventsOnDay = getEventsForDate(day);
        if (eventsOnDay.length > 0) {
            eMap.set(dayKey, eventsOnDay);
            // Only add to list if it's in the CURRENT viewing month
            if (isSameMonth(day, viewDate)) {
               monthList.push({ date: day, events: eventsOnDay });
            }
        }

        // Check Reminders
        let hasReminder = false;
        allUserEvents.forEach(evt => {
           if (!evt.reminderConfig) return;
           const checkOffsets = [];
           if (evt.reminderConfig.at7am) checkOffsets.push(0);
           if (evt.reminderConfig.customReminders) {
               evt.reminderConfig.customReminders.forEach(r => checkOffsets.push(r.daysBefore));
           }

           checkOffsets.forEach(days => {
               const targetEventDate = addDays(day, days);
               let isMatch = false;
               if (evt.type === 'solar') {
                   if (targetEventDate.getDate() === evt.day && targetEventDate.getMonth() + 1 === evt.month) isMatch = true;
               } else {
                   const lunar = getLunarDate(targetEventDate);
                   if (lunar.day === evt.day && lunar.month === evt.month) isMatch = true;
               }
               if (isMatch) hasReminder = true;
           });
        });

        if (hasReminder) rMap.set(dayKey, true);
     });
     
     // Sort list by date
     monthList.sort((a, b) => a.date.getTime() - b.date.getTime());

     return { eventMap: eMap, reminderMap: rMap, monthEventsList: monthList };
  }, [viewDate]); 

  const weekDayHeaders = settings.weekStart === 'monday' 
    ? ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'] 
    : ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  // Jump to Today Tab logic
  const handleDayClick = (date: Date) => {
     if(!isSameMonth(date, monthStart)) return;
     onDateSelect(date);
  };

  const getAnniversaryCount = (evt: CalendarEvent) => {
      if (!evt.originalYear) return null;
      const currentYear = new Date().getFullYear();
      return currentYear - evt.originalYear;
  }

  // Native Date setters
  const handleSetMonth = (m: number) => {
     const d = new Date(viewDate);
     d.setMonth(m - 1);
     setViewDate(d);
  };

  const handleSetYear = (y: number) => {
     const d = new Date(viewDate);
     d.setFullYear(y);
     setViewDate(d);
  };


  return (
    <div 
      className={`h-full flex flex-col ${themeStyles.bg}`} 
      onTouchStart={onTouchStart} 
      onTouchEnd={onTouchEnd}
    >
      {/* Month Navigation Header - No Arrow, click to pick */}
      <div className={`pt-safe flex justify-between items-center p-4 ${themeStyles.card} shadow-sm z-10 sticky top-0 backdrop-blur-md`}>
        <button onClick={prevMonth} className="p-2 rounded-full hover:bg-white/10 text-white">
          <ChevronLeft />
        </button>
        
        <div onClick={() => setShowDatePicker(true)} className="text-center text-white cursor-pointer active:scale-95 transition-transform">
           <h2 className="text-2xl font-bold font-[Playfair_Display]">
              Tháng {format(viewDate, "M / yyyy", { locale: vi })}
           </h2>
        </div>

        <button onClick={nextMonth} className="p-2 rounded-full hover:bg-white/10 text-white">
          <ChevronRight />
        </button>
      </div>

      {/* Weekdays Header */}
      <div className="grid grid-cols-7 text-center py-2 bg-black/10 backdrop-blur-sm border-b border-white/5">
        {weekDayHeaders.map((day, i) => {
            const isWeekend = day === 'CN' || day === 'T7';
            return (
              <div key={day} className={`text-xs font-semibold ${isWeekend ? 'text-red-400' : 'text-white/70'}`}>
                {day}
              </div>
            );
        })}
      </div>

      {/* Days Grid */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
        <div className="grid grid-cols-7 gap-1 p-2">
          {allDays.map((date, idx) => {
            const lunar = getLunarDate(date);
            const isSelected = isSameDay(date, currentDate);
            const isCurrentMonth = isSameMonth(date, monthStart);
            const isNow = isToday(date);
            
            const dayKey = format(date, 'yyyy-MM-dd');
            const events = eventMap.get(dayKey) || [];
            const hasReminder = reminderMap.get(dayKey);
            const hasEvent = events.length > 0;

            return (
              <div 
                key={idx}
                onClick={() => handleDayClick(date)}
                className={`
                  aspect-[3/4] flex flex-col justify-between p-1 rounded-lg cursor-pointer border
                  transition-all duration-200 relative
                  ${!isCurrentMonth ? 'opacity-20 bg-transparent border-transparent pointer-events-none' : `${themeStyles.card} border-white/10 hover:bg-white/20`}
                  ${isNow ? 'ring-2 ring-yellow-400' : ''}
                  ${isSelected ? 'shadow-lg transform scale-105 z-10' : ''}
                `}
                style={{ backgroundColor: isSelected ? primaryColor : undefined, borderColor: isSelected ? primaryColor : undefined }}
              >
                <span className={`text-lg font-semibold text-center font-sans ${isSelected ? 'text-white' : (date.getDay() === 0 || date.getDay() === 6 ? 'text-red-400' : 'text-white')}`}>
                  {format(date, "d")}
                </span>
                
                <div className="flex flex-col items-center w-full">
                   <div className="flex items-center justify-center gap-0.5 w-full">
                      <span className={`text-[10px] ${isSelected ? 'text-white/90' : (lunar.day === 1 || lunar.day === 15 ? 'text-yellow-400 font-bold' : 'text-white/50')}`}>
                          {lunar.day === 1 ? `${lunar.day}/${lunar.month}` : lunar.day}
                      </span>
                      {lunar.leap === 1 && <span className="text-[8px] text-red-500 font-bold">N</span>}
                   </div>
                   
                   {/* Indicators */}
                   <div className="flex gap-1 mt-1 items-center h-2 justify-center w-full">
                      {hasEvent && (
                          <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-green-400'}`}></div>
                      )}
                      {hasReminder && (
                          <Bell size={8} className={isSelected ? 'text-white' : 'text-yellow-400'} fill="currentColor" />
                      )}
                   </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* RESTORED: Events List for Selected Month */}
        {monthEventsList.length > 0 && (
          <div className="px-4 pb-6 space-y-3">
             <h3 className="text-white/60 text-xs font-bold uppercase mt-4 mb-2">Sự kiện trong tháng</h3>
             {monthEventsList.map((item, idx) => (
                <div key={idx} className="space-y-2">
                   {item.events.map(evt => {
                       const lunar = getLunarDate(item.date);
                       return (
                         <div 
                            key={evt.id} 
                            onClick={() => setSelectedEventForDetail(evt)}
                            className="glass bg-white/10 rounded-xl flex items-center overflow-hidden cursor-pointer active:bg-white/20 transition-colors h-14"
                         >
                            {/* Color Strip */}
                            <div className={`w-1.5 h-full ${evt.type === 'lunar' ? 'bg-yellow-400' : 'bg-blue-500'}`}></div>
                            
                            <div className="flex-1 px-3 min-w-0">
                               <p className="text-white font-bold truncate text-sm">{evt.title}</p>
                               <div className="flex items-center gap-2 mt-0.5">
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${evt.type === 'lunar' ? 'bg-yellow-400/20 text-yellow-300' : 'bg-blue-500/20 text-blue-300'}`}>
                                      {evt.type === 'lunar' ? 'Âm lịch' : 'Dương lịch'}
                                  </span>
                                  {evt.type === 'lunar' && (
                                     <span className="text-[10px] text-white/60">
                                        ({lunar.day}/{lunar.month} Âm)
                                     </span>
                                  )}
                               </div>
                            </div>

                            <div className="w-12 text-center shrink-0 pr-3">
                               <span className="block text-xl font-bold text-white leading-none">{format(item.date, 'dd')}</span>
                            </div>
                         </div>
                       );
                   })}
                </div>
             ))}
          </div>
        )}
      </div>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 pb-safe pt-safe">
           <div className="bg-white rounded-2xl w-full max-w-xs overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[60vh]">
              <div className="p-4 border-b flex justify-between items-center bg-gray-50 shrink-0">
                 <span className="font-bold text-gray-700">Chọn Thời Gian</span>
                 <button onClick={() => setShowDatePicker(false)}><X size={20} className="text-gray-400" /></button>
              </div>
              <div className="flex-1 flex overflow-hidden">
                 {/* Month Scroll */}
                 <div ref={monthListRef} className="flex-1 overflow-y-auto border-r scrollbar-hide text-center py-2">
                    <div className="text-xs text-gray-400 mb-2 uppercase font-bold sticky top-0 bg-white/90 backdrop-blur">Tháng</div>
                    {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                       <div 
                         id={`month-${m}`}
                         key={m}
                         onClick={() => handleSetMonth(m)}
                         className={`py-3 cursor-pointer hover:bg-gray-100 ${viewDate.getMonth() + 1 === m ? 'font-bold text-red-600 bg-red-50 text-xl' : 'text-gray-600'}`}
                       >
                          Tháng {m}
                       </div>
                    ))}
                 </div>
                 {/* Year Scroll */}
                 <div ref={yearListRef} className="flex-1 overflow-y-auto scrollbar-hide text-center py-2">
                    <div className="text-xs text-gray-400 mb-2 uppercase font-bold sticky top-0 bg-white/90 backdrop-blur">Năm</div>
                    {Array.from({length: 201}, (_, i) => 1900 + i).map(y => (
                       <div 
                         id={`year-${y}`}
                         key={y}
                         onClick={() => handleSetYear(y)}
                         className={`py-3 cursor-pointer hover:bg-gray-100 ${viewDate.getFullYear() === y ? 'font-bold text-red-600 bg-red-50 text-xl' : 'text-gray-600'}`}
                       >
                          {y}
                       </div>
                    ))}
                 </div>
              </div>
              <div className="p-3 bg-gray-50 text-center shrink-0">
                 <button onClick={() => setShowDatePicker(false)} className="w-full py-2 bg-red-600 text-white rounded-lg font-bold">Xong</button>
              </div>
           </div>
        </div>
      )}

      {/* Selected Event Detail Modal */}
      {selectedEventForDetail && (
         <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-6 animate-in fade-in duration-200">
             <div className="bg-white rounded-3xl w-full max-w-sm flex flex-col shadow-2xl overflow-hidden relative">
                {/* Modal Header Color Strip */}
                <div className={`h-3 w-full ${selectedEventForDetail.type === 'lunar' ? 'bg-yellow-400' : 'bg-blue-600'}`}></div>

                <div className="p-6 pb-2">
                   <div className="flex justify-between items-start mb-2">
                       <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase ${selectedEventForDetail.type === 'lunar' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>
                           {selectedEventForDetail.type === 'lunar' ? 'Âm Lịch' : 'Dương Lịch'}
                        </span>
                       <button onClick={() => setSelectedEventForDetail(null)} className="bg-gray-100 p-1 rounded-full"><X size={20} className="text-gray-500" /></button>
                   </div>
                   
                   {/* Large Date Display */}
                   <h1 className="text-5xl font-bold text-gray-800 mb-2 font-sans tracking-tight">
                       {selectedEventForDetail.dateStr}
                   </h1>

                   <h2 className="text-xl font-bold text-gray-800 leading-tight">
                       {selectedEventForDetail.title}
                   </h2>

                   {getAnniversaryCount(selectedEventForDetail) && (getAnniversaryCount(selectedEventForDetail)! > 0) && (
                       <div className="mt-2 inline-block bg-red-100 text-red-600 px-3 py-1 rounded-lg text-sm font-bold uppercase">
                           Kỷ niệm lần thứ {getAnniversaryCount(selectedEventForDetail)}
                       </div>
                   )}
                </div>
                
                <div className="px-6 py-4 space-y-3">
                    {selectedEventForDetail.location && (
                        <div className="flex items-center gap-3 text-gray-600 p-3 bg-gray-50 rounded-xl">
                            <MapPin size={20} className="text-red-500 shrink-0" />
                            <span className="font-medium">{selectedEventForDetail.location}</span>
                        </div>
                    )}
                    {selectedEventForDetail.details && (
                        <div className="flex items-start gap-3 text-gray-600 p-3 bg-gray-50 rounded-xl">
                            <AlignLeft size={20} className="mt-0.5 text-gray-400 shrink-0" />
                            <p className="text-sm leading-relaxed">{selectedEventForDetail.details}</p>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t bg-gray-50 text-center">
                    <button onClick={() => setSelectedEventForDetail(null)} className="text-gray-500 font-bold text-sm">Đóng</button>
                </div>
             </div>
         </div>
      )}
    </div>
  );
};

export default MonthView;
