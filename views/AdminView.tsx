
import React, { useEffect, useState } from 'react';
import { Users, Calendar, X, Search, Shield, Bell, Send, AlertTriangle, Trash2, CheckCircle2, Megaphone, Plus, Power, Clock } from 'lucide-react';
import { User, SystemBanner, AdminPushConfig } from '../types';
import { getAdminStats, getAllUsers, addSystemBanner, deleteSystemBanner, toggleSystemBanner, subscribeToBanners, subscribeToPushConfigs, addAdminPushConfig, deleteAdminPushConfig, toggleAdminPushConfig } from '../services/storage';
import { format } from 'date-fns';

interface AdminViewProps {
  user: User;
  onClose: () => void;
  fontClass: string;
}

// 15-minute Time Select Helper
const TimeSelect15 = ({ value, onChange, className }: { value: string, onChange: (val: string) => void, className?: string }) => {
    const [hour, minute] = value ? value.split(':') : ['09', '00'];
    const handleH = (e: React.ChangeEvent<HTMLSelectElement>) => onChange(`${e.target.value}:${minute}`);
    const handleM = (e: React.ChangeEvent<HTMLSelectElement>) => onChange(`${hour}:${e.target.value}`);
    return (
        <div className={`flex gap-1 items-center ${className}`}>
            <select value={hour} onChange={handleH} className="border border-slate-200 rounded p-1.5 text-sm bg-white min-w-[3rem] text-center">
                {Array.from({length: 24}, (_, i) => i.toString().padStart(2, '0')).map(h => <option key={h} value={h}>{h}</option>)}
            </select>
            <span className="text-slate-400 font-bold">:</span>
            <select value={minute} onChange={handleM} className="border border-slate-200 rounded p-1.5 text-sm bg-white min-w-[3rem] text-center">
                {['00', '15', '30', '45'].map(m => <option key={m} value={m}>{m}</option>)}
            </select>
        </div>
    );
}

const AdminView: React.FC<AdminViewProps> = ({ user, onClose, fontClass }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'system'>('dashboard');
  
  // Dashboard & User State
  const [stats, setStats] = useState({ users: 0, todayEvents: 0 });
  const [usersList, setUsersList] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // System State (Lists)
  const [banners, setBanners] = useState<SystemBanner[]>([]);
  const [pushConfigs, setPushConfigs] = useState<AdminPushConfig[]>([]);

  // Forms
  const [bannerForm, setBannerForm] = useState({ content: '', type: 'info' });
  const [pushForm, setPushForm] = useState<{title: string, body: string, time: string, frequency: 'once'|'daily'}>({ 
      title: '', body: '', time: '09:00', frequency: 'once' 
  });

  useEffect(() => {
      loadStats();
      const unsubB = subscribeToBanners(setBanners);
      const unsubP = subscribeToPushConfigs(setPushConfigs);
      return () => { unsubB(); unsubP(); }
  }, []);

  const loadStats = async () => {
      const s = await getAdminStats();
      setStats(s);
      const u = await getAllUsers();
      setUsersList(u);
  }

  const filteredUsers = usersList.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()));

  // --- HANDLERS ---
  const handleAddBanner = async () => {
      if(!bannerForm.content) return;
      await addSystemBanner({ content: bannerForm.content, type: bannerForm.type as any, active: true });
      setBannerForm({ content: '', type: 'info' });
  }

  const handleAddPush = async () => {
      if(!pushForm.title || !pushForm.body) return;
      await addAdminPushConfig({ ...pushForm, isActive: true });
      setPushForm({ title: '', body: '', time: '09:00', frequency: 'once' });
  }

  return (
    <div className={`h-full flex flex-col ${fontClass} bg-slate-100`}>
      <div className="pt-safe bg-slate-900 text-white p-6 pb-6 rounded-b-[2rem] shadow-xl shrink-0">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="opacity-70 text-sm">Xin chào, {user.name}</p>
          </div>
          <button onClick={onClose} className="bg-white/10 p-2 rounded-full hover:bg-white/20">
            <X size={20} />
          </button>
        </div>
        <div className="flex bg-slate-800 p-1 rounded-xl">
            {['dashboard', 'users', 'system'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 py-2 text-xs font-bold rounded-lg capitalize ${activeTab === tab ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                    {tab === 'dashboard' ? 'Thống Kê' : (tab === 'users' ? 'Người Dùng' : 'Hệ Thống')}
                </button>
            ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
            <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-bottom-2">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                    <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center text-blue-600 mb-3"><Users size={24} /></div>
                    <h3 className="text-3xl font-bold text-slate-800">{stats.users}</h3>
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wide">Tổng user</p>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                    <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center text-green-600 mb-3"><Calendar size={24} /></div>
                    <h3 className="text-3xl font-bold text-slate-800">{stats.todayEvents}</h3>
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wide">Sự kiện hôm nay</p>
                </div>
            </div>
        )}

        {/* USERS */}
        {activeTab === 'users' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full animate-in slide-in-from-right-2">
                <div className="p-4 border-b border-slate-100 sticky top-0 bg-white z-10">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                        <input type="text" placeholder="Tìm kiếm..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {filteredUsers.map((u) => (
                        <div key={u.id} className="p-4 border-b border-slate-50 flex items-center gap-3 hover:bg-slate-50">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold uppercase shrink-0 ${u.role === 'admin' ? 'bg-red-500' : 'bg-blue-500'}`}>{u.name.charAt(0)}</div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2"><p className="font-bold text-slate-800 truncate">{u.name}</p>{u.role === 'admin' && <Shield size={12} className="text-red-500" />}</div>
                                <p className="text-xs text-slate-500 truncate">{u.email}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* SYSTEM CONTROL */}
        {activeTab === 'system' && (
            <div className="space-y-6 animate-in slide-in-from-right-2">
                
                {/* 1. BANNER CONTROL */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Megaphone size={18} className="text-orange-500" /> Loa Phường (Banners)
                    </h3>
                    
                    {/* Add Banner */}
                    <div className="flex gap-2 mb-4">
                        <input type="text" placeholder="Nội dung thông báo..." value={bannerForm.content} onChange={e => setBannerForm({...bannerForm, content: e.target.value})} className="flex-1 border border-slate-200 rounded-lg p-2 text-sm" />
                        <select value={bannerForm.type} onChange={e => setBannerForm({...bannerForm, type: e.target.value})} className="border border-slate-200 rounded-lg p-2 text-sm bg-white">
                            <option value="info">Info</option>
                            <option value="warning">Warning</option>
                            <option value="error">Error</option>
                        </select>
                        <button onClick={handleAddBanner} className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"><Plus size={20} /></button>
                    </div>

                    {/* Banner List */}
                    <div className="space-y-2">
                        {banners.map(b => (
                            <div key={b.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <button onClick={() => toggleSystemBanner(b.id, b.active)} className={`${b.active ? 'text-green-500' : 'text-slate-300'}`}><Power size={18} /></button>
                                    <span className={`text-sm truncate ${!b.active && 'opacity-50 line-through'}`}>{b.content}</span>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${b.type === 'error' ? 'bg-red-100 text-red-600' : (b.type === 'warning' ? 'bg-yellow-100 text-yellow-600' : 'bg-blue-100 text-blue-600')}`}>{b.type}</span>
                                </div>
                                <button onClick={() => deleteSystemBanner(b.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
                            </div>
                        ))}
                        {banners.length === 0 && <p className="text-xs text-center text-slate-400 py-2">Chưa có thông báo nào.</p>}
                    </div>
                </div>

                {/* 2. PUSH CONFIG CONTROL */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Send size={18} className="text-blue-500" /> Cấu Hình Push Định Kỳ
                    </h3>
                    
                    {/* Add Push Config */}
                    <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4">
                        <input type="text" placeholder="Tiêu đề Push..." value={pushForm.title} onChange={e => setPushForm({...pushForm, title: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2 text-sm font-bold" />
                        <textarea placeholder="Nội dung..." value={pushForm.body} onChange={e => setPushForm({...pushForm, body: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2 text-sm h-16 resize-none" />
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <Clock size={16} className="text-slate-400" />
                                <TimeSelect15 value={pushForm.time} onChange={val => setPushForm({...pushForm, time: val})} />
                            </div>
                            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1">
                                <button onClick={() => setPushForm({...pushForm, frequency: 'once'})} className={`px-3 py-1 text-xs rounded-md font-bold transition-all ${pushForm.frequency === 'once' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>Một lần</button>
                                <button onClick={() => setPushForm({...pushForm, frequency: 'daily'})} className={`px-3 py-1 text-xs rounded-md font-bold transition-all ${pushForm.frequency === 'daily' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>Hàng ngày</button>
                            </div>
                            <button onClick={handleAddPush} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-800">Thêm</button>
                        </div>
                    </div>

                    {/* Push List */}
                    <div className="space-y-2">
                        {pushConfigs.map(p => (
                            <div key={p.id} className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm relative">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => toggleAdminPushConfig(p.id, p.isActive)} className={`${p.isActive ? 'text-green-500' : 'text-slate-300'}`}><CheckCircle2 size={20} /></button>
                                        <div>
                                            <h4 className={`font-bold text-sm ${!p.isActive && 'opacity-50'}`}>{p.title}</h4>
                                            <div className="flex gap-2 text-[10px] text-slate-500 font-bold uppercase mt-0.5">
                                                <span className="bg-slate-100 px-1.5 rounded">{p.time}</span>
                                                <span className="bg-slate-100 px-1.5 rounded">{p.frequency === 'once' ? 'Một lần' : 'Hàng ngày'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => deleteAdminPushConfig(p.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={16} /></button>
                                </div>
                                <p className={`text-xs text-slate-600 pl-7 ${!p.isActive && 'opacity-50'}`}>{p.body}</p>
                                {p.lastSent && <p className="text-[10px] text-slate-400 pl-7 mt-1">Đã gửi lần cuối: {format(new Date(p.lastSent), 'HH:mm dd/MM')}</p>}
                            </div>
                        ))}
                        {pushConfigs.length === 0 && <p className="text-xs text-center text-slate-400 py-2">Chưa có cấu hình Push nào.</p>}
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default AdminView;
