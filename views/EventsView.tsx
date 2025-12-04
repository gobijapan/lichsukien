
import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Calendar, Bell, Edit2, X, Check, MapPin, AlignLeft, Search, ArrowUpDown, Clock, MinusCircle, PlusCircle, Filter, FileText, ChevronLeft, AlarmClock } from 'lucide-react';
import { CalendarEvent } from '../types';
import { getEvents, saveEvent, deleteEvent, getAllUpcomingReminders } from '../services/storage';
import { getLunarDate, getSolarDateFromLunar, convertSolar2LunarAlgorithm } from '../utils/lunar';
import { format, addDays } from 'date-fns';
import vi from 'date-fns/locale/vi';

interface EventsViewProps {
  themeStyles: any;
  primaryColor: string;
}

// Helper Component for Standardized Time Selection (15 min interval)
const TimeSelect = ({ value, onChange, className }: { value: string, onChange: (val: string) => void, className?: string }) => {
    const [hour, minute] = value ? value.split(':') : ['07', '00'];

    const handleHourChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onChange(`${e.target.value}:${minute}`);
    }

    const handleMinuteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onChange(`${hour}:${e.target.value}`);
    }

    return (
        <div className={`flex gap-1 items-center ${className}`}>
            <select value={hour} onChange={handleHourChange} className="bg-white border border-gray-200 rounded-lg p-1 text-sm appearance-none text-center min-w-[3rem]">
                {Array.from({length: 24}, (_, i) => i.toString().padStart(2, '0')).map(h => (
                    <option key={h} value={h}>{h}</option>
                ))}
            </select>
            <span className="text-gray-500 font-bold">:</span>
            <select value={minute} onChange={handleMinuteChange} className="bg-white border border-gray-200 rounded-lg p-1 text-sm appearance-none text-center min-w-[3rem]">
                {['00', '15', '30', '45'].map(m => (
                    <option key={m} value={m}>{m}</option>
                ))}
            </select>
        </div>
    );
}

const EventsView: React.FC<EventsViewProps> = ({ themeStyles, primaryColor }) => {
  const [viewMode, setViewMode] = useState<'events' | 'reminders'>('events');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterType, setFilterType] = useState<'all' | 'lunar' | 'solar'>('all');
  
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  
  // Reminder Manager Data
  const [upcomingReminders, setUpcomingReminders] = useState<any[]>([]);

  // Form State
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<CalendarEvent>>({
     title: '',
     day: 1,
     month: 1,
     type: 'lunar',
     category: 'anniversary',
     details: '',
     location: '',
     originalYear: undefined,
     reminderConfig: { at7am: true, customReminders: [] }
  });

  const [convertedDateStr, setConvertedDateStr] = useState<string>('');

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
      if (viewMode === 'reminders') {
          const list = getAllUpcomingReminders();
          setUpcomingReminders(list);
      }
  }, [viewMode]);

  // Update preview when date/type changes
  useEffect(() => {
    if(!showModal) return;
    const currentYear = new Date().getFullYear();
    const contextYear = formData.originalYear || currentYear;
    
    if (formData.type === 'lunar') {
       const solarDate = getSolarDateFromLunar(formData.day || 1, formData.month || 1, contextYear);
       if (solarDate) {
          setConvertedDateStr(`${contextYear}: ${format(solarDate, 'dd/MM/yyyy')} DL`);
       } else {
          setConvertedDateStr('Không xác định');
       }
    } else {
       const d = new Date(contextYear, (formData.month || 1) - 1, formData.day || 1);
       const [ld, lm, ly, ll] = convertSolar2LunarAlgorithm(d.getDate(), d.getMonth()+1, d.getFullYear(), 7);
       setConvertedDateStr(`${contextYear}: ${ld}/${lm} AL ${ll ? '(Nhuận)' : ''}`);
    }
  }, [formData.day, formData.month, formData.type, formData.originalYear, showModal]);

  const loadEvents = () => {
    setEvents(getEvents());
  };

  const filteredEvents = useMemo(() => {
    let result = events.filter(e => {
      const matchesSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            e.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterType === 'all' || e.type === filterType;
      return matchesSearch && matchesFilter;
    });
    
    result.sort((a, b) => {
       const valA = a.month * 100 + a.day;
       const valB = b.month * 100 + b.day;
       return sortOrder === 'asc' ? valA - valB : valB - valA;
    });
    
    return result;
  }, [events, searchTerm, sortOrder, filterType]);

  const openAddModal = () => {
    setEditId(null);
    const today = new Date();
    const lunar = getLunarDate(today);
    setFormData({
      title: '',
      day: lunar.day,
      month: lunar.month,
      type: 'lunar',
      category: 'anniversary',
      details: '',
      location: '',
      originalYear: undefined,
      reminderConfig: { at7am: true, customReminders: [] }
    });
    setShowModal(true);
  };

  const openEditModal = (e: CalendarEvent) => {
    setEditId(e.id);
    setFormData({ ...e });
    setShowModal(true);
  };

  const setTodayDate = (type: 'solar' | 'lunar') => {
    const today = new Date();
    if(type === 'solar') {
      setFormData(prev => ({...prev, day: today.getDate(), month: today.getMonth() + 1, type: 'solar'}));
    } else {
      const lunar = getLunarDate(today);
      setFormData(prev => ({...prev, day: lunar.day, month: lunar.month, type: 'lunar'}));
    }
  };

  const addCustomReminder = () => {
    const current = formData.reminderConfig?.customReminders || [];
    setFormData({
       ...formData,
       reminderConfig: {
          ...formData.reminderConfig!,
          customReminders: [...current, { id: Date.now().toString(), daysBefore: 1, time: '09:00', note: '' }]
       }
    });
  };

  const removeCustomReminder = (idx: number) => {
    const current = [...(formData.reminderConfig?.customReminders || [])];
    current.splice(idx, 1);
    setFormData({
       ...formData,
       reminderConfig: { ...formData.reminderConfig!, customReminders: current }
    });
  };

  const updateCustomReminder = (idx: number, field: string, value: any) => {
    const current = [...(formData.reminderConfig?.customReminders || [])];
    current[idx] = { ...current[idx], [field]: value };
    setFormData({
       ...formData,
       reminderConfig: { ...formData.reminderConfig!, customReminders: current }
    });
  };

  const handleSave = async () => {
    if (!formData.title || !formData.day || !formData.month) return;
    
    const newEvent: CalendarEvent = {
      id: editId || Date.now().toString(),
      title: formData.title,
      dateStr: `${formData.day}/${formData.month}`,
      type: formData.type as 'lunar' | 'solar',
      day: formData.day,
      month: formData.month,
      isRecurring: true,
      category: formData.category as any,
      details: formData.details,
      location: formData.location,
      originalYear: formData.originalYear,
      reminderConfig: formData.reminderConfig
    };
    
    await saveEvent(newEvent);
    setShowModal(false);
    loadEvents();
  };

  const handleDelete = async () => {
    if(showDeleteConfirm) {
        await deleteEvent(showDeleteConfirm);
        setShowDeleteConfirm(null);
        loadEvents();
    }
  };

  const getAnniversaryText = (evt: CalendarEvent) => {
    if(!evt.originalYear) return null;
    const currentYear = new Date().getFullYear();
    const diff = currentYear - evt.originalYear;
    if(diff <= 0) return null;
    return `Kỷ niệm lần thứ ${diff}`;
  };

  // Helper to calculate reminder date in current year
  const getReminderDatePreview = (daysBefore: number) => {
     const currentYear = new Date().getFullYear();
     let eventSolarDate: Date;

     if (formData.type === 'lunar') {
        const d = getSolarDateFromLunar(formData.day || 1, formData.month || 1, currentYear);
        if(!d) return null;
        eventSolarDate = d;
     } else {
        eventSolarDate = new Date(currentYear, (formData.month || 1) - 1, formData.day || 1);
     }
     
     return addDays(eventSolarDate, -daysBefore);
  };

  // --- RENDER REMINDER MANAGER ---
  if (viewMode === 'reminders') {
      return (
          <div className={`h-full flex flex-col ${themeStyles.bg}`}>
              <div className="pt-safe pt-8 px-6 pb-4 flex items-center gap-3">
                  <button onClick={() => setViewMode('events')} className="bg-white/10 p-2 rounded-full text-white hover:bg-white/20">
                      <ChevronLeft size={24} />
                  </button>
                  <h2 className="text-2xl font-bold text-white drop-shadow-md font-[Playfair_Display]">Danh Sách Nhắc Nhở</h2>
              </div>
              
              <div className="flex-1 overflow-y-auto px-4 pb-24 no-scrollbar space-y-3">
                  {upcomingReminders.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-64 text-white/40">
                          <AlarmClock size={48} className="mb-4 opacity-50" />
                          <p>Không có nhắc nhở nào trong 60 ngày tới.</p>
                      </div>
                  ) : (
                      upcomingReminders.map((rem, idx) => {
                          const triggerStr = format(rem.triggerDate, 'EEEE, dd/MM', { locale: vi });
                          return (
                             <div key={idx} className="glass bg-white/5 rounded-xl p-4 flex gap-4 animate-in slide-in-from-bottom-2 duration-300">
                                 <div className="flex flex-col items-center justify-center bg-white/10 rounded-lg w-16 h-16 shrink-0">
                                     {/* USE timeStr directly to be 100% accurate to settings */}
                                     <span className="text-lg font-bold text-white">{rem.timeStr}</span>
                                     <span className="text-[10px] text-white/60 uppercase">{format(rem.triggerDate, 'dd/MM')}</span>
                                 </div>
                                 <div className="min-w-0 flex-1">
                                     <div className="flex items-center gap-2 mb-1">
                                         <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${rem.type === 'system' ? 'bg-orange-500/20 text-orange-200' : 'bg-blue-500/20 text-blue-200'}`}>
                                             {rem.type === 'system' ? 'Hệ thống' : 'Sự kiện'}
                                         </span>
                                         <span className="text-[10px] text-white/50">{rem.note}</span>
                                     </div>
                                     <h3 className="font-bold text-white text-lg truncate">{rem.eventTitle}</h3>
                                     <p className="text-sm text-white/70">
                                         Sự kiện diễn ra: <span className="font-bold text-white">{rem.eventDateDisplay}</span>
                                     </p>
                                 </div>
                             </div>
                          );
                      })
                  )}
              </div>
          </div>
      )
  }

  // --- RENDER EVENTS LIST ---
  return (
    <div className={`h-full flex flex-col ${themeStyles.bg}`}>
       {/* Header with Search */}
       <div className="pt-safe pt-8 px-6 pb-2">
         <div className="flex justify-between items-center mb-4">
            <h2 className="text-3xl font-bold text-white drop-shadow-md font-[Playfair_Display]">Sự Kiện</h2>
            <div className="flex gap-2">
                <button 
                  onClick={() => setViewMode('reminders')}
                  className="w-10 h-10 rounded-full bg-white/20 text-white shadow-lg flex items-center justify-center hover:bg-white/30 transition-transform"
                >
                  <Bell size={20} />
                </button>
                <button 
                  onClick={openAddModal}
                  className="w-10 h-10 rounded-full bg-white text-gray-900 shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
                  style={{ color: primaryColor }}
                >
                  <Plus size={24} />
                </button>
            </div>
         </div>
         
         <div className="flex gap-2">
           <div className="relative flex-1 flex items-center bg-white/10 border border-white/20 rounded-xl overflow-hidden">
             <Search className="ml-3 text-white/50" size={16} />
             <input 
               type="text" 
               placeholder="Tìm kiếm..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full bg-transparent py-2 px-2 text-sm text-white placeholder-white/40 focus:outline-none"
             />
             <div className="border-l border-white/10">
                <select 
                   value={filterType} 
                   onChange={(e) => setFilterType(e.target.value as any)}
                   className="bg-transparent text-xs text-white p-2 focus:outline-none appearance-none font-bold"
                >
                   <option className="text-black" value="all">Tất cả</option>
                   <option className="text-black" value="lunar">Âm</option>
                   <option className="text-black" value="solar">Dương</option>
                </select>
             </div>
           </div>
           <button 
             onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
             className="px-3 rounded-xl bg-white/10 border border-white/20 text-white flex items-center justify-center hover:bg-white/20"
           >
             <ArrowUpDown size={16} />
           </button>
         </div>
       </div>

       <div className="flex-1 overflow-y-auto px-4 pb-24 mt-2 no-scrollbar">
         {filteredEvents.length === 0 ? (
           <div className="flex flex-col items-center justify-center h-64 text-white/40">
             <Bell size={48} className="mb-4 opacity-50" />
             <p>Chưa có sự kiện nào.</p>
           </div>
         ) : (
           <div className="space-y-3">
             {filteredEvents.map(event => {
               const anniversary = getAnniversaryText(event);
               const reminderCount = (event.reminderConfig?.at7am ? 1 : 0) + (event.reminderConfig?.customReminders?.length || 0);

               return (
               <div key={event.id} onClick={() => openEditModal(event)} className="glass rounded-xl p-4 flex justify-between items-start group relative overflow-hidden cursor-pointer">
                 {/* Left Indicator Line */}
                 <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: event.type === 'lunar' ? '#F1C40F' : '#3498DB' }}></div>

                 <div className="flex items-start gap-4 pl-2 flex-1 min-w-0">
                   <div className="w-12 text-center shrink-0">
                     <span className="block text-2xl font-bold text-white leading-none">{event.day}</span>
                     <span className="block text-[10px] uppercase text-white/70">Tháng {event.month}</span>
                   </div>
                   
                   <div className="flex-1 min-w-0">
                     <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide border whitespace-nowrap ${event.type === 'lunar' ? 'border-yellow-400 text-yellow-300' : 'border-blue-400 text-blue-300'}`}>
                          {event.type === 'lunar' ? 'Âm Lịch' : 'Dương Lịch'}
                        </span>
                        {anniversary && (
                          <span className="text-[9px] bg-red-500/80 text-white px-1.5 py-0.5 rounded font-bold uppercase whitespace-nowrap">
                            {anniversary}
                          </span>
                        )}
                        {reminderCount > 0 && (
                           <span className="text-[9px] bg-white/20 text-white px-1.5 py-0.5 rounded font-bold uppercase whitespace-nowrap flex items-center gap-1">
                               {reminderCount} <Bell size={8} className="fill-current" />
                           </span>
                        )}
                     </div>
                     <h3 className="font-bold text-white text-lg leading-tight truncate pr-2">{event.title}</h3>
                     
                     <div className="mt-1 space-y-0.5">
                       {event.location && (
                          <div className="flex items-center gap-1.5 text-xs text-white/80">
                             <MapPin size={12} className="shrink-0 text-red-300" />
                             <span className="truncate">{event.location}</span>
                          </div>
                       )}
                       {event.details && (
                          <div className="flex items-center gap-1.5 text-xs text-white/60">
                             <AlignLeft size={12} className="shrink-0" />
                             <span className="truncate">{event.details}</span>
                          </div>
                       )}
                     </div>
                   </div>
                 </div>

                 <div className="flex flex-col gap-2 shrink-0">
                   <button onClick={(e) => {e.stopPropagation(); setShowDeleteConfirm(event.id);}} className="p-2 bg-white/10 rounded-full hover:bg-white/20 text-red-300">
                     <Trash2 size={16} />
                   </button>
                 </div>
               </div>
             )})}
           </div>
         )}
       </div>

       {/* Add/Edit Modal */}
       {showModal && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 pt-safe pb-safe">
           <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[90vh] flex flex-col overflow-hidden">
             
             {/* Modal Header */}
             <div className="sticky top-0 bg-white z-20 px-6 py-4 border-b border-gray-100 flex justify-between items-center shrink-0">
               <h3 className="text-xl font-bold text-gray-800 font-[Playfair_Display]">
                 {editId ? 'Chỉnh Sửa' : 'Thêm Sự Kiện'}
               </h3>
               <button onClick={() => setShowModal(false)} className="bg-gray-100 p-2 rounded-full text-gray-500 hover:bg-gray-200">
                 <X size={20} />
               </button>
             </div>
             
             <div className="p-6 space-y-5 overflow-y-auto">
               {/* Type Selection */}
               <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
                 <button 
                   onClick={() => setTodayDate('lunar')}
                   className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${formData.type === 'lunar' ? 'bg-white shadow text-yellow-600' : 'text-gray-400'}`}
                 >
                   Âm Lịch
                   {formData.type === 'lunar' && <Check size={14} />}
                 </button>
                 <button 
                   onClick={() => setTodayDate('solar')}
                   className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${formData.type === 'solar' ? 'bg-white shadow text-blue-600' : 'text-gray-400'}`}
                 >
                   Dương Lịch
                   {formData.type === 'solar' && <Check size={14} />}
                 </button>
               </div>

               {/* Title & Date */}
               <div className="space-y-4">
                 <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Tên sự kiện <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500 font-semibold"
                      placeholder="VD: Sinh nhật Mẹ"
                    />
                 </div>
                 
                 <div className="flex gap-4">
                    <div className="flex-[2]">
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Ngày / Tháng</label>
                        <div className="flex gap-2">
                           <select 
                              value={formData.day} 
                              onChange={(e) => setFormData({...formData, day: Number(e.target.value)})}
                              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-800 font-medium appearance-none"
                           >
                             {Array.from({length: 31}, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}</option>)}
                           </select>
                           <span className="self-center text-gray-300">/</span>
                           <select 
                              value={formData.month} 
                              onChange={(e) => setFormData({...formData, month: Number(e.target.value)})}
                              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-800 font-medium appearance-none"
                           >
                             {Array.from({length: 12}, (_, i) => i + 1).map(m => <option key={m} value={m}>{m}</option>)}
                           </select>
                        </div>
                        <div className="mt-1.5 text-xs text-indigo-600 font-medium flex items-center gap-1">
                           <Calendar size={10} />
                           {convertedDateStr}
                        </div>
                    </div>
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Năm gốc</label>
                        <input 
                          type="number"
                          placeholder="YYYY"
                          value={formData.originalYear || ''}
                          onChange={(e) => setFormData({...formData, originalYear: e.target.value ? Number(e.target.value) : undefined})}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-800 text-center"
                        />
                    </div>
                 </div>
               </div>

               {/* Details & Location */}
               <div className="space-y-3 pt-2 border-t border-gray-100">
                  <div className="relative">
                     <MapPin className="absolute left-3 top-3 text-gray-400" size={16} />
                     <input 
                       type="text" 
                       value={formData.location || ''}
                       onChange={(e) => setFormData({...formData, location: e.target.value})}
                       className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-3 text-sm text-gray-800"
                       placeholder="Địa điểm"
                     />
                  </div>
                  <div className="relative">
                     <AlignLeft className="absolute left-3 top-3 text-gray-400" size={16} />
                     <textarea 
                       value={formData.details || ''}
                       onChange={(e) => setFormData({...formData, details: e.target.value})}
                       className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-3 text-sm text-gray-800 min-h-[60px]"
                       placeholder="Ghi chú chi tiết..."
                     />
                  </div>
               </div>

               {/* Reminders */}
               <div className="pt-2 border-t border-gray-100">
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2 flex items-center justify-between">
                     <span className="flex items-center gap-2"><Bell size={12} /> Cài đặt nhắc nhở</span>
                     <button onClick={addCustomReminder} className="text-blue-500 text-xs flex items-center gap-1 font-bold">
                        <PlusCircle size={14} /> Thêm nhắc nhở
                     </button>
                  </label>
                  
                  <div className="bg-gray-50 rounded-xl p-3 space-y-3 border border-gray-100">
                     <label className="flex items-center gap-3 cursor-pointer">
                        <input 
                           type="checkbox" 
                           checked={formData.reminderConfig?.at7am}
                           onChange={(e) => setFormData({
                              ...formData, 
                              reminderConfig: {...formData.reminderConfig!, at7am: e.target.checked}
                           })}
                           className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                        />
                        <span className="text-sm text-gray-700 font-medium">Nhắc lúc 07:00 sáng ngày diễn ra</span>
                     </label>

                     {/* Custom Reminders List */}
                     {formData.reminderConfig?.customReminders?.map((reminder, idx) => {
                        const previewDate = getReminderDatePreview(reminder.daysBefore);
                        return (
                        <div key={idx} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm animate-in slide-in-from-left-2">
                           <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm text-gray-500 whitespace-nowrap">Trước</span>
                              <input 
                                 type="text" 
                                 inputMode="numeric"
                                 pattern="[0-9]*"
                                 value={reminder.daysBefore || ''}
                                 placeholder="0"
                                 onChange={(e) => {
                                    let val = Number(e.target.value);
                                    if (val > 30) val = 30; 
                                    if (val < 0) val = 0;
                                    updateCustomReminder(idx, 'daysBefore', val);
                                 }}
                                 className="w-10 text-center border border-gray-200 rounded-lg p-1 text-sm bg-white focus:outline-none focus:border-red-400"
                              />
                              <span className="text-sm text-gray-500 whitespace-nowrap">ngày, lúc</span>
                              
                              {/* Standardized Time Select */}
                              <TimeSelect 
                                value={reminder.time} 
                                onChange={(val) => updateCustomReminder(idx, 'time', val)} 
                              />

                              <button onClick={() => removeCustomReminder(idx)} className="ml-auto text-red-400 hover:text-red-600 p-1">
                                 <MinusCircle size={16} />
                              </button>
                           </div>
                           
                           {/* Note Input */}
                           <div className="relative mb-1">
                               <FileText className="absolute left-2 top-2 text-gray-400" size={14} />
                               <textarea
                                  maxLength={300}
                                  value={reminder.note || ''}
                                  onChange={(e) => updateCustomReminder(idx, 'note', e.target.value)}
                                  placeholder="Lời nhắc (VD: Mua quà, Đặt bàn...)"
                                  className="w-full bg-gray-50 border border-gray-100 rounded-md py-1.5 pl-7 pr-2 text-xs text-gray-700 min-h-[40px] resize-none"
                               />
                           </div>

                           {/* Prediction */}
                           {previewDate && (
                              <div className="text-[10px] text-orange-600 font-semibold text-right">
                                 Dự kiến nhắc năm nay: {format(previewDate, 'dd/MM/yyyy')}
                              </div>
                           )}
                        </div>
                     )})}
                  </div>
               </div>

               {/* Spacer for button */}
               <div className="h-2"></div>

               <button 
                   onClick={handleSave}
                   className="w-full py-3.5 text-white rounded-xl font-bold shadow-lg text-lg transform active:scale-95 transition-transform shrink-0 mb-20"
                   style={{ backgroundColor: primaryColor, boxShadow: `0 10px 15px -3px ${primaryColor}40` }}
               >
                   Lưu Sự Kiện
               </button>
               {/* Extra Bottom safety spacer */}
               <div className="h-6 shrink-0"></div> 
             </div>
           </div>
         </div>
       )}

       {/* Delete Confirmation Modal */}
       {showDeleteConfirm && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
             <div className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-2xl text-center">
                <div className="w-12 h-12 rounded-full bg-red-100 text-red-500 flex items-center justify-center mx-auto mb-4">
                   <Trash2 size={24} />
                </div>
                <h3 className="font-bold text-gray-800 text-lg mb-2">Xác nhận xóa?</h3>
                <p className="text-gray-500 text-sm mb-6">Bạn có chắc chắn muốn xóa sự kiện này không?</p>
                <div className="flex gap-3">
                   <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 py-2 rounded-lg bg-gray-100 font-medium text-gray-600">Hủy</button>
                   <button onClick={handleDelete} className="flex-1 py-2 rounded-lg bg-red-600 font-medium text-white shadow-lg shadow-red-200">Xóa</button>
                </div>
             </div>
         </div>
       )}
    </div>
  );
};

export default EventsView;
