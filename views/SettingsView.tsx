
import React, { useState, useRef } from 'react';
import { AppSettings, User, GlobalReminderConfig } from '../types';
import { Image, Type, LogOut, User as UserIcon, Palette, Database, ChevronRight, CloudUpload, CloudDownload, Moon, Sun, Monitor, Upload, Bell, Clock, Plus, MinusCircle, LogIn, Edit3, X, MapPin, Phone, Calendar, Shield, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { BACKGROUNDS, FONTS } from '../constants';
import { backupData, restoreData, saveUserProfile, getBackupInfo } from '../services/storage';
import { auth } from '../services/firebase';
import { format } from 'date-fns';
import vi from 'date-fns/locale/vi';

interface SettingsViewProps {
  settings: AppSettings;
  updateSettings: (s: AppSettings) => void;
  fontClass: string;
  user: User | null;
  onLogout: () => void;
  onLoginClick: () => void;
  onRefreshProfile?: () => void;
  onDataRestore: () => void;
}

// Inline TimeSelect for standardization
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
            <select value={hour} onChange={handleHourChange} className="bg-white/10 border border-white/20 rounded p-1 text-xs text-white appearance-none text-center min-w-[2.5rem]">
                {Array.from({length: 24}, (_, i) => i.toString().padStart(2, '0')).map(h => (
                    <option className="text-black" key={h} value={h}>{h}</option>
                ))}
            </select>
            <span className="text-white/80 font-bold">:</span>
            <select value={minute} onChange={handleMinuteChange} className="bg-white/10 border border-white/20 rounded p-1 text-xs text-white appearance-none text-center min-w-[2.5rem]">
                {['00', '15', '30', '45'].map(m => (
                    <option className="text-black" key={m} value={m}>{m}</option>
                ))}
            </select>
        </div>
    );
}

const SettingsView: React.FC<SettingsViewProps> = ({ settings, updateSettings, fontClass, user, onLogout, onLoginClick, onRefreshProfile, onDataRestore }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Profile Edit State
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [profileData, setProfileData] = useState({ name: '', dateOfBirth: '', phoneNumber: '', address: '' });

  // Modal States
  const [backupStep, setBackupStep] = useState<'idle' | 'confirm' | 'processing' | 'success' | 'error'>('idle');
  const [restoreStep, setRestoreStep] = useState<'idle' | 'check' | 'confirm' | 'processing' | 'success' | 'error' | 'notfound'>('idle');
  const [backupInfo, setBackupInfo] = useState<Date | null>(null);

  // --- BACKUP LOGIC ---
  const startBackup = () => {
      if(!user) { onLoginClick(); return; }
      setBackupStep('confirm');
  }

  const confirmBackup = async () => {
      if(!user) return;
      setBackupStep('processing');
      const success = await backupData(user.id);
      if(success) {
          setBackupStep('success');
      } else {
          setBackupStep('error');
      }
  }

  const closeBackupModal = () => setBackupStep('idle');

  // --- RESTORE LOGIC ---
  const startRestore = async () => {
      if(!user) { onLoginClick(); return; }
      setRestoreStep('check');
      // Check for backup existence
      const info = await getBackupInfo(user.id);
      if (info.exists && info.lastBackup) {
          setBackupInfo(info.lastBackup);
          setRestoreStep('confirm');
      } else {
          setRestoreStep('notfound');
      }
  }

  const confirmRestore = async () => {
      if(!user) return;
      setRestoreStep('processing');
      const success = await restoreData(user.id);
      if(success) {
          setRestoreStep('success');
          // Soft reload data instead of window reload
          setTimeout(() => {
             onDataRestore();
             setRestoreStep('idle');
          }, 1500);
      } else {
          setRestoreStep('error');
      }
  }

  const closeRestoreModal = () => setRestoreStep('idle');


  const handleLogoutActual = async () => {
      try {
          await auth.signOut();
          onLogout();
      } catch (e) {
          console.error(e);
      }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        updateSettings({ ...settings, bgId: 'custom', customBg: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  const updateReminderSetting = (key: string, value: any) => {
      updateSettings({
          ...settings,
          reminderSettings: {
              ...settings.reminderSettings,
              [key]: value
          }
      });
  }

  const addGlobalReminder = () => {
      const current = settings.reminderSettings.defaultReminders || [];
      if (current.length >= 3) return;
      updateReminderSetting('defaultReminders', [...current, { daysBefore: 1, time: '08:00' }]);
  }

  const removeGlobalReminder = (idx: number) => {
      const current = [...(settings.reminderSettings.defaultReminders || [])];
      current.splice(idx, 1);
      updateReminderSetting('defaultReminders', current);
  }

  const updateGlobalReminder = (idx: number, field: keyof GlobalReminderConfig, value: any) => {
      const current = [...(settings.reminderSettings.defaultReminders || [])];
      current[idx] = { ...current[idx], [field]: value };
      updateReminderSetting('defaultReminders', current);
  }

  // Profile Edit Handlers
  const openEdit = () => {
     if (user) {
         setProfileData({
             name: user.name || '',
             dateOfBirth: user.dateOfBirth || '',
             phoneNumber: user.phoneNumber || '',
             address: user.address || ''
         });
         setShowEditProfile(true);
     }
  }

  const saveProfile = async () => {
      if (!user) return;
      const success = await saveUserProfile(user.id, profileData);
      if (success) {
          alert('Đã cập nhật hồ sơ thành công!');
          setShowEditProfile(false);
          if (onRefreshProfile) onRefreshProfile();
      } else {
          alert('Lỗi khi cập nhật hồ sơ.');
      }
  }

  return (
    <div className={`h-full flex flex-col ${fontClass} text-white relative`}>
      {/* Header with extra top margin */}
      <div className="pt-safe mt-8 px-6 pb-6">
         <h2 className="text-3xl font-bold drop-shadow-md font-[Playfair_Display]">Cài Đặt</h2>
      </div>

       <div className="px-4 pb-24 space-y-4 overflow-y-auto no-scrollbar">
         
         {/* Account Group */}
         <div className="glass rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-3">
                    <UserIcon size={18} style={{ color: settings.primaryColor }} />
                    <span className="font-bold text-sm uppercase tracking-wider">Thông Tin Tài Khoản</span>
                </div>
                {user && (
                    <button onClick={openEdit} className="text-xs flex items-center gap-1 text-white/80 hover:text-white bg-white/10 px-2 py-1 rounded-lg">
                        <Edit3 size={12} /> Chỉnh sửa
                    </button>
                )}
            </div>
            
            {user ? (
              <div className="p-4">
                 <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-lg uppercase shrink-0" style={{ backgroundColor: settings.primaryColor }}>
                       {user.name ? user.name.charAt(0) : 'U'}
                    </div>
                    <div className="min-w-0">
                       <p className="font-bold text-lg">{user.name || 'Người dùng'}</p>
                       <p className="text-xs text-white/70 mb-2">{user.email}</p>
                       
                       <div className="space-y-1">
                           {user.dateOfBirth && (
                               <p className="text-xs text-white/60 flex items-center gap-1"><Calendar size={10} /> {user.dateOfBirth}</p>
                           )}
                           {user.phoneNumber && (
                               <p className="text-xs text-white/60 flex items-center gap-1"><Phone size={10} /> {user.phoneNumber}</p>
                           )}
                           {user.address && (
                               <p className="text-xs text-white/60 flex items-center gap-1"><MapPin size={10} /> {user.address}</p>
                           )}
                       </div>
                    </div>
                 </div>
                 <button 
                    onClick={handleLogoutActual}
                    className="w-full py-2 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm font-medium hover:bg-red-500/30 flex items-center justify-center gap-2"
                 >
                    <LogOut size={16} /> Đăng xuất
                 </button>
              </div>
            ) : (
              <div className="p-6 flex flex-col items-center justify-center">
                 <p className="text-sm opacity-70 mb-4 text-center">Đăng nhập để sao lưu, đồng bộ dữ liệu và nhận thông báo.</p>
                 <button 
                    onClick={onLoginClick}
                    className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg transform transition active:scale-95 flex items-center justify-center gap-2"
                 >
                    <LogIn size={20} />
                    Đăng Nhập / Đăng Ký
                 </button>
              </div>
            )}
         </div>

         {/* Interface Group */}
         <div className="glass rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-white/5">
                <Palette size={18} style={{ color: settings.primaryColor }} />
                <span className="font-bold text-sm uppercase tracking-wider">Giao Diện & Hiển Thị</span>
            </div>

            <div className="p-4 space-y-5">
                {/* Background Selector */}
                <div>
                   <label className="text-xs font-medium text-white/70 mb-2 flex items-center gap-2">
                      <Image size={14} /> Hình nền
                   </label>
                   <div className="relative">
                     <select 
                       value={settings.bgId} 
                       onChange={(e) => updateSettings({...settings, bgId: e.target.value})}
                       className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-white/30"
                     >
                       <option className="text-gray-900" value="custom">-- Hình tải lên từ máy --</option>
                       {BACKGROUNDS.map(bg => (
                         <option className="text-gray-900" key={bg.id} value={bg.id}>{bg.name}</option>
                       ))}
                     </select>
                     <div className="absolute right-3 top-3.5 pointer-events-none opacity-50">▼</div>
                   </div>

                   {/* Custom Upload Button */}
                   <div className="mt-2">
                      <input 
                        type="file" 
                        accept="image/*" 
                        ref={fileInputRef} 
                        className="hidden" 
                        onChange={handleFileUpload} 
                      />
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-2 border border-dashed border-white/30 rounded-lg text-xs text-white/70 hover:bg-white/5 flex items-center justify-center gap-2"
                      >
                         <Upload size={14} /> Tải ảnh từ thư viện
                      </button>
                   </div>
                </div>

                {/* Font Selector */}
                <div>
                   <label className="text-xs font-medium text-white/70 mb-2 flex items-center gap-2">
                      <Type size={14} /> Kiểu chữ
                   </label>
                   <div className="relative">
                      <select 
                        value={settings.font} 
                        onChange={(e) => updateSettings({...settings, font: e.target.value})}
                        className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-white/30"
                      >
                        {Object.entries(FONTS).map(([key, font]) => (
                          <option className="text-gray-900" key={key} value={key}>{font.name}</option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-3.5 pointer-events-none opacity-50">▼</div>
                   </div>
                </div>

                {/* Color & Dark Mode */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-medium text-white/70 mb-2 flex items-center gap-2">
                           <Monitor size={14} /> Chế độ nền
                        </label>
                        <button 
                           onClick={() => updateSettings({...settings, darkMode: !settings.darkMode})}
                           className={`w-full p-3 rounded-xl flex items-center justify-center gap-2 transition-all ${settings.darkMode ? 'bg-slate-800 text-white border border-slate-600' : 'bg-white text-gray-900 border border-white'}`}
                        >
                           {settings.darkMode ? <Moon size={16} /> : <Sun size={16} />}
                           <span className="text-sm font-medium">{settings.darkMode ? 'Tối' : 'Sáng'}</span>
                        </button>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-white/70 mb-2 flex items-center gap-2">
                           <Palette size={14} /> Màu chủ đạo
                        </label>
                        <div className="flex items-center gap-2 bg-white/10 p-2 rounded-xl border border-white/20 h-[46px]">
                           <input 
                              type="color" 
                              value={settings.primaryColor}
                              onChange={(e) => updateSettings({...settings, primaryColor: e.target.value})}
                              className="w-8 h-8 rounded cursor-pointer border-none bg-transparent"
                           />
                           <span className="text-xs opacity-80">{settings.primaryColor}</span>
                        </div>
                    </div>
                </div>
                
                {/* Week Start */}
                <div>
                    <label className="text-xs font-medium text-white/70 mb-2 block">Ngày bắt đầu tuần</label>
                    <div className="grid grid-cols-2 gap-2 bg-white/10 p-1 rounded-lg">
                        <button 
                           onClick={() => updateSettings({...settings, weekStart: 'monday'})}
                           className={`py-1.5 text-xs rounded-md transition-all ${settings.weekStart === 'monday' ? 'bg-white text-black shadow' : 'text-white/50'}`}
                        >
                           Thứ Hai
                        </button>
                        <button 
                           onClick={() => updateSettings({...settings, weekStart: 'sunday'})}
                           className={`py-1.5 text-xs rounded-md transition-all ${settings.weekStart === 'sunday' ? 'bg-white text-black shadow' : 'text-white/50'}`}
                        >
                           Chủ Nhật
                        </button>
                    </div>
                </div>
            </div>
         </div>

         {/* Reminders Group */}
         <div className="glass rounded-2xl overflow-hidden">
             <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-3">
                    <Bell size={18} style={{ color: settings.primaryColor }} />
                    <span className="font-bold text-sm uppercase tracking-wider">Cài Đặt Nhắc Nhở</span>
                </div>
                <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                    <input type="checkbox" name="toggle" id="toggle" 
                        checked={settings.reminderSettings.enabled} 
                        onChange={(e) => updateReminderSetting('enabled', e.target.checked)}
                        className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer transition-transform duration-200 ease-in-out checked:translate-x-full checked:border-green-400"/>
                    <label htmlFor="toggle" className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer ${settings.reminderSettings.enabled ? 'bg-green-400' : 'bg-gray-300'}`}></label>
                </div>
            </div>

            {settings.reminderSettings.enabled && (
                <div className="p-4 space-y-4 animate-in slide-in-from-top-2">
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                        <span className="text-sm font-medium">Rằm & Mùng 1 Âm lịch</span>
                        <input type="checkbox" 
                            checked={settings.reminderSettings.lunar15_1}
                            onChange={(e) => updateReminderSetting('lunar15_1', e.target.checked)}
                            className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                        />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                        <span className="text-sm font-medium">Ngày lễ Dương lịch</span>
                        <input type="checkbox" 
                            checked={settings.reminderSettings.solarHolidays}
                            onChange={(e) => updateReminderSetting('solarHolidays', e.target.checked)}
                            className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                        />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                        <span className="text-sm font-medium">Ngày lễ Âm lịch</span>
                        <input type="checkbox" 
                            checked={settings.reminderSettings.lunarHolidays}
                            onChange={(e) => updateReminderSetting('lunarHolidays', e.target.checked)}
                            className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                        />
                    </div>
                    
                    <div className="pt-2 border-t border-white/10">
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-medium text-white/70 flex items-center gap-2">
                               <Clock size={14} /> Thời gian thông báo (Tối đa 3)
                            </label>
                            <button 
                                onClick={addGlobalReminder}
                                disabled={(settings.reminderSettings.defaultReminders?.length || 0) >= 3}
                                className={`text-xs flex items-center gap-1 font-bold ${ (settings.reminderSettings.defaultReminders?.length || 0) >= 3 ? 'opacity-30 cursor-not-allowed' : 'text-green-400'}`}
                            >
                                <Plus size={14} /> Thêm
                            </button>
                        </div>
                        
                        <div className="space-y-2">
                            {settings.reminderSettings.defaultReminders?.map((reminder, idx) => (
                                <div key={idx} className="flex items-center gap-2 bg-white/10 p-2 rounded-lg animate-in slide-in-from-left-2">
                                    <span className="text-xs text-white/80 whitespace-nowrap">Trước</span>
                                    <input 
                                       type="number"
                                       min={0}
                                       max={30}
                                       value={reminder.daysBefore}
                                       onChange={(e) => updateGlobalReminder(idx, 'daysBefore', parseInt(e.target.value) || 0)}
                                       className="w-10 text-center bg-white/10 border border-white/20 rounded p-1 text-xs text-white"
                                    />
                                    <span className="text-xs text-white/80 whitespace-nowrap">ngày, lúc</span>
                                    
                                    {/* Standardized 15-min Time Select */}
                                    <TimeSelect 
                                        value={reminder.time} 
                                        onChange={(val) => updateGlobalReminder(idx, 'time', val)} 
                                    />
                                    
                                    <button onClick={() => removeGlobalReminder(idx)} className="ml-auto text-red-400 hover:text-red-300 p-1">
                                       <MinusCircle size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
         </div>

         {/* Data Group */}
         <div className="glass rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-white/5">
                <Database size={18} style={{ color: settings.primaryColor }} />
                <span className="font-bold text-sm uppercase tracking-wider">Dữ Liệu Hệ Thống</span>
            </div>
            
            <div className="p-2">
               <button 
                  onClick={startBackup}
                  className="w-full p-3 flex items-center justify-between hover:bg-white/5 rounded-lg transition-colors"
               >
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-300">
                        <CloudUpload size={16} />
                     </div>
                     <div className="text-left">
                        <p className="text-sm font-medium">Sao lưu dữ liệu</p>
                        <p className="text-xs opacity-50">Lưu cài đặt và sự kiện lên đám mây</p>
                     </div>
                  </div>
                  <ChevronRight size={16} className="opacity-50" />
               </button>

               <button 
                  onClick={startRestore}
                  className="w-full p-3 flex items-center justify-between hover:bg-white/5 rounded-lg transition-colors"
               >
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-300">
                        <CloudDownload size={16} />
                     </div>
                     <div className="text-left">
                        <p className="text-sm font-medium">Khôi phục dữ liệu</p>
                        <p className="text-xs opacity-50">Tải dữ liệu cũ từ đám mây về máy</p>
                     </div>
                  </div>
                  <ChevronRight size={16} className="opacity-50" />
               </button>
            </div>
         </div>

         {/* ADMIN BUTTON */}
         {user?.role === 'admin' && (
             <div className="glass rounded-2xl overflow-hidden mt-2 border border-blue-500/30 bg-blue-500/10">
                <button 
                    onClick={onLoginClick}
                    className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                            <Shield size={16} />
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-bold text-blue-100">Admin Dashboard</p>
                            <p className="text-xs opacity-60 text-blue-200">Quản lý hệ thống</p>
                        </div>
                    </div>
                    <ChevronRight size={16} className="text-blue-400" />
                </button>
             </div>
         )}
         
         <div className="text-center text-[10px] opacity-40 pb-4">
           Phiên bản Cloud 2.5.4 • Build 2024
         </div>
       </div>

       {/* EDIT PROFILE MODAL */}
       {showEditProfile && (
           <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
               <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden text-gray-800 animate-in fade-in zoom-in">
                   <div className="bg-gray-100 p-4 flex justify-between items-center border-b">
                       <h3 className="font-bold">Chỉnh Sửa Hồ Sơ</h3>
                       <button onClick={() => setShowEditProfile(false)}><X size={20} className="text-gray-500" /></button>
                   </div>
                   <div className="p-4 space-y-3">
                       <div>
                           <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Họ và Tên</label>
                           <input type="text" value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} className="w-full border rounded-lg p-2 text-sm" />
                       </div>
                       <div>
                           <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Ngày Sinh</label>
                           <input type="date" value={profileData.dateOfBirth} onChange={e => setProfileData({...profileData, dateOfBirth: e.target.value})} className="w-full border rounded-lg p-2 text-sm" />
                       </div>
                       <div>
                           <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Số Điện Thoại</label>
                           <input type="tel" value={profileData.phoneNumber} onChange={e => setProfileData({...profileData, phoneNumber: e.target.value})} className="w-full border rounded-lg p-2 text-sm" />
                       </div>
                       <div>
                           <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Địa Chỉ</label>
                           <textarea value={profileData.address} onChange={e => setProfileData({...profileData, address: e.target.value})} className="w-full border rounded-lg p-2 text-sm min-h-[60px]" />
                       </div>
                   </div>
                   <div className="p-4 bg-gray-50 border-t flex justify-end gap-2">
                       <button onClick={() => setShowEditProfile(false)} className="px-4 py-2 bg-gray-200 rounded-lg text-sm font-medium">Hủy</button>
                       <button onClick={saveProfile} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium">Lưu Thay Đổi</button>
                   </div>
               </div>
           </div>
       )}

       {/* BACKUP MODAL */}
       {backupStep !== 'idle' && (
           <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-6">
               <div className="bg-white text-gray-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in duration-200">
                   {backupStep === 'confirm' && (
                       <div className="p-6 text-center">
                           <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                               <CloudUpload size={32} />
                           </div>
                           <h3 className="text-xl font-bold mb-2">Sao lưu dữ liệu?</h3>
                           <p className="text-sm text-gray-500 mb-6">
                               Toàn bộ cài đặt, sự kiện và hình nền sẽ được lưu lên đám mây. 
                               Dữ liệu cũ trên đám mây (nếu có) sẽ bị ghi đè.
                           </p>
                           <div className="flex gap-3">
                               <button onClick={closeBackupModal} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold text-gray-600">Hủy</button>
                               <button onClick={confirmBackup} className="flex-1 py-3 bg-blue-600 rounded-xl font-bold text-white shadow-lg shadow-blue-200">Đồng ý</button>
                           </div>
                       </div>
                   )}
                   {backupStep === 'processing' && (
                       <div className="p-8 text-center">
                           <Loader2 size={40} className="animate-spin text-blue-600 mx-auto mb-4" />
                           <h3 className="font-bold text-lg">Đang tải lên...</h3>
                           <p className="text-sm text-gray-500 mt-2">Vui lòng không tắt ứng dụng.</p>
                       </div>
                   )}
                   {backupStep === 'success' && (
                       <div className="p-8 text-center">
                           <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                               <CheckCircle2 size={32} />
                           </div>
                           <h3 className="font-bold text-lg mb-2">Sao lưu thành công!</h3>
                           <p className="text-sm text-gray-500 mb-6">Dữ liệu của bạn đã an toàn trên đám mây.</p>
                           <button onClick={closeBackupModal} className="w-full py-3 bg-green-600 rounded-xl font-bold text-white">Đóng</button>
                       </div>
                   )}
                   {backupStep === 'error' && (
                       <div className="p-6 text-center">
                           <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
                               <AlertTriangle size={32} />
                           </div>
                           <h3 className="font-bold text-lg mb-2">Sao lưu thất bại</h3>
                           <p className="text-sm text-gray-500 mb-6">Vui lòng kiểm tra kết nối mạng và thử lại.</p>
                           <button onClick={closeBackupModal} className="w-full py-3 bg-red-100 text-red-600 rounded-xl font-bold">Đóng</button>
                       </div>
                   )}
               </div>
           </div>
       )}

       {/* RESTORE MODAL */}
       {restoreStep !== 'idle' && (
           <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-6">
               <div className="bg-white text-gray-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in duration-200">
                   {restoreStep === 'check' && (
                       <div className="p-8 text-center">
                           <Loader2 size={40} className="animate-spin text-green-600 mx-auto mb-4" />
                           <h3 className="font-bold text-lg">Đang kiểm tra...</h3>
                       </div>
                   )}
                   {restoreStep === 'notfound' && (
                       <div className="p-6 text-center">
                           <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-500">
                               <Database size={32} />
                           </div>
                           <h3 className="font-bold text-lg mb-2">Không tìm thấy bản sao lưu</h3>
                           <p className="text-sm text-gray-500 mb-6">Tài khoản này chưa có dữ liệu nào được lưu trên đám mây.</p>
                           <button onClick={closeRestoreModal} className="w-full py-3 bg-gray-200 rounded-xl font-bold text-gray-600">Đóng</button>
                       </div>
                   )}
                   {restoreStep === 'confirm' && (
                       <div className="p-6 text-center">
                           <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                               <CloudDownload size={32} />
                           </div>
                           <h3 className="text-xl font-bold mb-2">Khôi phục dữ liệu?</h3>
                           <div className="bg-gray-50 p-3 rounded-lg mb-4 text-left border border-gray-100">
                               <p className="text-xs text-gray-400 font-bold uppercase mb-1">Bản sao lưu gần nhất:</p>
                               <p className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                  <Clock size={14} className="text-green-500" />
                                  {backupInfo ? format(backupInfo, "HH:mm - dd/MM/yyyy", {locale: vi}) : 'N/A'}
                               </p>
                           </div>
                           <p className="text-sm text-gray-500 mb-6">
                               Dữ liệu hiện tại trên thiết bị này sẽ bị xóa và thay thế bằng bản sao lưu trên.
                           </p>
                           <div className="flex gap-3">
                               <button onClick={closeRestoreModal} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold text-gray-600">Hủy</button>
                               <button onClick={confirmRestore} className="flex-1 py-3 bg-green-600 rounded-xl font-bold text-white shadow-lg shadow-green-200">Khôi phục</button>
                           </div>
                       </div>
                   )}
                   {restoreStep === 'processing' && (
                       <div className="p-8 text-center">
                           <Loader2 size={40} className="animate-spin text-green-600 mx-auto mb-4" />
                           <h3 className="font-bold text-lg">Đang tải về...</h3>
                           <p className="text-sm text-gray-500 mt-2">Đang đồng bộ dữ liệu.</p>
                       </div>
                   )}
                   {restoreStep === 'success' && (
                       <div className="p-8 text-center">
                           <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                               <CheckCircle2 size={32} />
                           </div>
                           <h3 className="font-bold text-lg mb-2">Khôi phục thành công!</h3>
                           <p className="text-sm text-gray-500 mb-2">Ứng dụng sẽ tự làm mới dữ liệu.</p>
                       </div>
                   )}
                   {restoreStep === 'error' && (
                       <div className="p-6 text-center">
                           <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
                               <AlertTriangle size={32} />
                           </div>
                           <h3 className="font-bold text-lg mb-2">Khôi phục thất bại</h3>
                           <p className="text-sm text-gray-500 mb-6">Vui lòng thử lại sau.</p>
                           <button onClick={closeRestoreModal} className="w-full py-3 bg-red-100 text-red-600 rounded-xl font-bold">Đóng</button>
                       </div>
                   )}
               </div>
           </div>
       )}

    </div>
  );
};

export default SettingsView;
