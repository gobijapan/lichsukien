
import React, { useEffect, useState } from 'react';
import { Users, Calendar, X, Search, Shield, Bell, Send, Trash2, CheckCircle2, Megaphone, ToggleLeft, ToggleRight, RefreshCw, Clock } from 'lucide-react';
import { User, SystemBanner, AdminPushConfig } from '../types';
import { getAdminStats, getAllUsers, getSystemBannersList, addSystemBanner, deleteSystemBanner, toggleSystemBanner, getPushConfigsList, addPushConfig, deletePushConfig, togglePushConfig } from '../services/storage';
import { format } from 'date-fns';

interface AdminViewProps {
  user: User;
  onClose: () => void;
  fontClass: string;
}

const AdminView: React.FC<AdminViewProps> = ({ user, onClose, fontClass }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'system'>('dashboard');
  
  // Dashboard State
  const [stats, setStats] = useState({ users: 0, todayEvents: 0 });
  const [loading, setLoading] = useState(false);
  
  // Users State
  const [usersList, setUsersList] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // System State Lists
  const [banners, setBanners] = useState<SystemBanner[]>([]);
  const [pushConfigs, setPushConfigs] = useState<AdminPushConfig[]>([]);

  // Forms
  const [bannerForm, setBannerForm] = useState({ content: '', type: 'info' as 'info' | 'warning' | 'error' });
  const [pushForm, setPushForm] = useState({ title: '', body: '', time: '08:00', frequency: 'once' as 'once' | 'daily' });

  useEffect(() => {
      loadData();
  }, []);

  const loadData = async () => {
      setLoading(true);
      const s = await getAdminStats();
      setStats(s);
      
      const u = await getAllUsers();
      setUsersList(u);
      
      const b = await getSystemBannersList();
      setBanners(b);
      
      const p = await getPushConfigsList();
      setPushConfigs(p);
      setLoading(false);
  }

  // --- HANDLERS BANNER ---
  const handleAddBanner = async () => {
      if(!bannerForm.content) return;
      await addSystemBanner({ ...bannerForm, isActive: true });
      setBannerForm({ content: '', type: 'info' });
      loadData();
  }

  const handleDeleteBanner = async (id: string) => {
      if(confirm('Xóa thông báo này?')) {
          await deleteSystemBanner(id);
          loadData();
      }
  }

  const handleToggleBanner = async (id: string, current: boolean) => {
      await toggleSystemBanner(id, current);
      loadData();
  }

  // --- HANDLERS PUSH ---
  const handleAddPush = async () => {
      if(!pushForm.title || !pushForm.body) return;
      await addPushConfig({ ...pushForm, isActive: true });
      setPushForm({ title: '', body: '', time: '08:00', frequency: 'once' });
      alert('Đã thêm lịch gửi tin!');
      loadData();
  }

  const handleDeletePush = async (id: string) => {
      if(confirm('Xóa cấu hình này?')) {
          await deletePushConfig(id);
          loadData();
      }
  }

  const handleTogglePush = async (id: string, current: boolean) => {
      await togglePushConfig(id, current);
      loadData();
  }

  const filteredUsers = usersList.filter(u => 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        
        {/* Tabs */}
        <div className="flex bg-slate-800 p-1 rounded-xl">
            {['dashboard', 'users', 'system'].map(tab => (
                <button 
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg capitalize transition-colors ${activeTab === tab ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                    {tab === 'system' ? 'Hệ thống' : (tab === 'users' ? 'Người dùng' : 'Thống kê')}
                </button>
            ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
            <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-bottom-2">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                    <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center text-blue-600 mb-3">
                        <Users size={24} />
                    </div>
                    <h3 className="text-3xl font-bold text-slate-800">{stats.users}</h3>
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wide">Tổng người dùng</p>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                    <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center text-green-600 mb-3">
                        <Calendar size={24} />
                    </div>
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
                        <input 
                            type="text" 
                            placeholder="Tìm kiếm user..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {filteredUsers.map((u) => (
                        <div key={u.id} className="p-4 border-b border-slate-50 flex items-center gap-3 hover:bg-slate-50">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold uppercase shrink-0 ${u.role === 'admin' ? 'bg-red-500' : 'bg-blue-500'}`}>
                                {u.name.charAt(0)}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <p className="font-bold text-slate-800 truncate">{u.name}</p>
                                    {u.role === 'admin' && <Shield size={12} className="text-red-500" />}
                                </div>
                                <p className="text-xs text-slate-500 truncate">{u.email}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* SYSTEM CONTROL (LIST MANAGEMENT) */}
        {activeTab === 'system' && (
            <div className="space-y-8 pb-10 animate-in slide-in-from-right-2">
                <div className="flex justify-end">
                    <button onClick={loadData} className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 bg-white px-3 py-1 rounded-full shadow-sm">
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Làm mới
                    </button>
                </div>

                {/* 1. LOA PHƯỜNG BANNER LIST */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <Megaphone size={18} className="text-orange-500" /> Quản Lý Loa Phường
                        </h3>
                    </div>
                    
                    {/* Add Form */}
                    <div className="p-4 border-b border-slate-100 bg-white">
                        <div className="flex gap-2 mb-2">
                            <input 
                                type="text" 
                                placeholder="Nội dung thông báo mới..."
                                value={bannerForm.content}
                                onChange={e => setBannerForm({...bannerForm, content: e.target.value})}
                                className="flex-1 border border-slate-200 rounded-lg p-2 text-sm"
                            />
                            <button onClick={handleAddBanner} className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 font-bold text-sm min-w-[60px]">Thêm</button>
                        </div>
                        <div className="flex gap-2">
                            {(['info', 'warning', 'error'] as const).map(type => (
                                <button 
                                    key={type}
                                    onClick={() => setBannerForm({...bannerForm, type})}
                                    className={`px-3 py-1 rounded text-xs font-bold uppercase ${bannerForm.type === type ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500'}`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Banner List */}
                    <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                        {banners.length === 0 && <p className="p-4 text-center text-slate-400 text-sm">Chưa có thông báo nào.</p>}
                        {banners.map(b => (
                            <div key={b.id} className={`p-3 flex items-center justify-between ${!b.isActive ? 'opacity-50 bg-slate-50' : ''}`}>
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className={`w-2 h-2 rounded-full shrink-0 ${b.type === 'error' ? 'bg-red-500' : (b.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500')}`}></div>
                                    <p className="text-sm text-slate-700 truncate">{b.content}</p>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <span className="text-[10px] text-slate-400 hidden sm:inline">{format(new Date(b.createdAt), 'dd/MM')}</span>
                                    <button onClick={() => handleToggleBanner(b.id, b.isActive)} className={b.isActive ? 'text-green-600' : 'text-slate-400'}>
                                        {b.isActive ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                                    </button>
                                    <button onClick={() => handleDeleteBanner(b.id)} className="text-red-400 hover:text-red-600">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 2. PUSH CONFIG LIST */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <Send size={18} className="text-blue-500" /> Cấu Hình Push Notification
                        </h3>
                    </div>

                    {/* Add Form */}
                    <div className="p-4 border-b border-slate-100 bg-white space-y-3">
                        <input 
                            type="text" 
                            placeholder="Tiêu đề..."
                            value={pushForm.title}
                            onChange={e => setPushForm({...pushForm, title: e.target.value})}
                            className="w-full border border-slate-200 rounded-lg p-2 text-sm font-bold"
                        />
                        <textarea 
                            placeholder="Nội dung tin nhắn..."
                            value={pushForm.body}
                            onChange={e => setPushForm({...pushForm, body: e.target.value})}
                            className="w-full border border-slate-200 rounded-lg p-2 text-sm h-16 resize-none"
                        />
                        <div className="flex items-center gap-3">
                            <label className="text-xs font-bold text-slate-500 uppercase">Giờ:</label>
                            <select 
                                value={pushForm.time} 
                                onChange={e => setPushForm({...pushForm, time: e.target.value})}
                                className="border border-slate-200 rounded p-1 text-sm bg-white"
                            >
                                {Array.from({length: 24}).map((_, h) => 
                                    ['00','15','30','45'].map(m => {
                                        const t = `${String(h).padStart(2,'0')}:${m}`;
                                        return <option key={t} value={t}>{t}</option>
                                    })
                                )}
                            </select>
                            <label className="text-xs font-bold text-slate-500 uppercase ml-2">Lặp:</label>
                            <select 
                                value={pushForm.frequency}
                                onChange={e => setPushForm({...pushForm, frequency: e.target.value as any})}
                                className="border border-slate-200 rounded p-1 text-sm bg-white"
                            >
                                <option value="once">Một lần</option>
                                <option value="daily">Hằng ngày</option>
                            </select>
                            <button onClick={handleAddPush} className="ml-auto bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-800">
                                Lên Lịch
                            </button>
                        </div>
                    </div>

                    {/* Config List */}
                    <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                        {pushConfigs.length === 0 && <p className="p-4 text-center text-slate-400 text-sm">Chưa có lịch gửi tin nào.</p>}
                        {pushConfigs.map(p => (
                            <div key={p.id} className={`p-4 flex items-start justify-between ${!p.isActive ? 'opacity-50 bg-slate-50' : ''}`}>
                                <div className="min-w-0 pr-2">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-blue-600 font-bold text-sm">{p.time}</span>
                                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${p.frequency === 'daily' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500'}`}>
                                            {p.frequency === 'daily' ? 'Hằng ngày' : 'Một lần'}
                                        </span>
                                    </div>
                                    <p className="font-bold text-slate-800 text-sm truncate">{p.title}</p>
                                    <p className="text-xs text-slate-500 truncate">{p.body}</p>
                                    {p.lastSent && <p className="text-[10px] text-green-600 mt-1">Đã gửi lần cuối: {format(new Date(p.lastSent), 'HH:mm dd/MM')}</p>}
                                </div>
                                <div className="flex flex-col gap-2 shrink-0 items-end">
                                    <button onClick={() => handleTogglePush(p.id, p.isActive)} className={p.isActive ? 'text-green-600' : 'text-slate-400'}>
                                        {p.isActive ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                                    </button>
                                    <button onClick={() => handleDeletePush(p.id)} className="text-red-400 hover:text-red-600">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default AdminView;
