import React, { useEffect, useState } from 'react';
import { Users, Calendar, X, Search, Shield, Bell, Send, AlertTriangle, Trash2, CheckCircle2, Megaphone, Plus, RefreshCw, Power, Clock } from 'lucide-react';
import { User, SystemBanner, AdminPushConfig } from '../types';
import { 
    getAdminStats, getAllUsers, 
    getAllBanners, addSystemBanner, deleteSystemBanner, toggleSystemBanner,
    getAllPushConfigs, addPushConfig, deletePushConfig, togglePushConfig 
} from '../services/storage';
import { format } from 'date-fns';

interface AdminViewProps {
  user: User;
  onClose: () => void;
  fontClass: string;
}

// Time Select Helper
const TimeSelect = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
    const [h, m] = value ? value.split(':') : ['07', '00'];
    return (
        <div className="flex gap-1 items-center">
            <select value={h} onChange={(e) => onChange(`${e.target.value}:${m}`)} className="border rounded p-1 text-sm">{Array.from({length: 24},(_,i)=>i.toString().padStart(2,'0')).map(x=><option key={x} value={x}>{x}</option>)}</select>
            <span>:</span>
            <select value={m} onChange={(e) => onChange(`${h}:${e.target.value}`)} className="border rounded p-1 text-sm">{['00','15','30','45'].map(x=><option key={x} value={x}>{x}</option>)}</select>
        </div>
    );
}

const AdminView: React.FC<AdminViewProps> = ({ user, onClose, fontClass }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'system'>('dashboard');
  const [stats, setStats] = useState({ users: 0, todayEvents: 0 });
  const [usersList, setUsersList] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Lists
  const [banners, setBanners] = useState<SystemBanner[]>([]);
  const [pushConfigs, setPushConfigs] = useState<AdminPushConfig[]>([]);

  // Forms
  const [bannerForm, setBannerForm] = useState({ content: '', type: 'info' as 'info'|'warning'|'error' });
  const [pushForm, setPushForm] = useState({ title: '', body: '', time: '09:00', frequency: 'once' as 'once'|'daily' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
      getAdminStats().then(setStats);
      getAllUsers().then(setUsersList);
      getAllBanners().then(setBanners);
      getAllPushConfigs().then(setPushConfigs);
  }

  // --- BANNER HANDLERS ---
  const handleAddBanner = async () => {
      if(!bannerForm.content) return;
      await addSystemBanner(bannerForm);
      setBannerForm({ content: '', type: 'info' });
      getAllBanners().then(setBanners);
  }
  const handleDeleteBanner = async (id: string) => {
      if(confirm('Xóa thông báo này?')) {
          await deleteSystemBanner(id);
          getAllBanners().then(setBanners);
      }
  }
  const handleToggleBanner = async (id: string, active: boolean) => {
      await toggleSystemBanner(id, active);
      getAllBanners().then(setBanners);
  }

  // --- PUSH HANDLERS ---
  const handleAddPush = async () => {
      if(!pushForm.title || !pushForm.body) return;
      await addPushConfig(pushForm);
      setPushForm({ title: '', body: '', time: '09:00', frequency: 'once' });
      getAllPushConfigs().then(setPushConfigs);
  }
  const handleDeletePush = async (id: string) => {
      if(confirm('Xóa cấu hình này?')) {
          await deletePushConfig(id);
          getAllPushConfigs().then(setPushConfigs);
      }
  }
  const handleTogglePush = async (id: string, active: boolean) => {
      await togglePushConfig(id, active);
      getAllPushConfigs().then(setPushConfigs);
  }

  const filteredUsers = usersList.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className={`h-full flex flex-col ${fontClass} bg-slate-100`}>
      <div className="pt-safe bg-slate-900 text-white p-6 pb-6 rounded-b-[2rem] shadow-xl shrink-0">
        <div className="flex justify-between items-center mb-6">
          <div><h1 className="text-2xl font-bold">Admin Dashboard</h1><p className="opacity-70 text-sm">Hi, {user.name}</p></div>
          <button onClick={onClose} className="bg-white/10 p-2 rounded-full hover:bg-white/20"><X size={20} /></button>
        </div>
        <div className="flex bg-slate-800 p-1 rounded-xl">
            {['dashboard', 'users', 'system'].map(t => (
                <button key={t} onClick={() => setActiveTab(t as any)} className={`flex-1 py-2 text-xs font-bold rounded-lg capitalize ${activeTab === t ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>{t}</button>
            ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'dashboard' && (
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                    <Users size={24} className="text-blue-600 mb-3" />
                    <h3 className="text-3xl font-bold text-slate-800">{stats.users}</h3>
                    <p className="text-xs text-slate-500 font-bold uppercase">Users</p>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                    <Calendar size={24} className="text-green-600 mb-3" />
                    <h3 className="text-3xl font-bold text-slate-800">{stats.todayEvents}</h3>
                    <p className="text-xs text-slate-500 font-bold uppercase">Events Today</p>
                </div>
            </div>
        )}

        {activeTab === 'users' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
                <div className="p-4 border-b border-slate-100 sticky top-0 bg-white z-10">
                    <input type="text" placeholder="Tìm kiếm user..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
                </div>
                <div className="flex-1 overflow-y-auto">
                    {filteredUsers.map((u) => (
                        <div key={u.id} className="p-4 border-b border-slate-50 flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold uppercase ${u.role === 'admin' ? 'bg-red-500' : 'bg-blue-500'}`}>{u.name.charAt(0)}</div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-slate-800 truncate">{u.name} {u.role === 'admin' && <Shield size={12} className="inline text-red-500" />}</p>
                                <p className="text-xs text-slate-500 truncate">{u.email}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {activeTab === 'system' && (
            <div className="space-y-6">
                {/* BANNERS */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-4 flex gap-2"><Megaphone size={18} className="text-orange-500" /> Loa Phường (Banners)</h3>
                    <div className="space-y-2 mb-4">
                        <input type="text" placeholder="Nội dung..." value={bannerForm.content} onChange={e => setBannerForm({...bannerForm, content: e.target.value})} className="w-full border rounded p-2 text-sm" />
                        <div className="flex gap-2">
                            {(['info', 'warning', 'error'] as const).map(t => (
                                <button key={t} onClick={() => setBannerForm({...bannerForm, type: t})} className={`flex-1 py-1 text-xs font-bold uppercase rounded ${bannerForm.type === t ? 'bg-slate-800 text-white' : 'bg-slate-100'}`}>{t}</button>
                            ))}
                            <button onClick={handleAddBanner} className="bg-green-600 text-white px-4 rounded text-sm font-bold"><Plus size={16} /></button>
                        </div>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                        {banners.map(b => (
                            <div key={b.id} className="flex justify-between items-center bg-slate-50 p-2 rounded border">
                                <span className={`text-xs px-1 rounded ${b.active ? 'bg-green-100 text-green-700' : 'bg-gray-200'}`}>{b.active ? 'ON' : 'OFF'}</span>
                                <span className="flex-1 mx-2 text-xs truncate">{b.content}</span>
                                <div className="flex gap-1">
                                    <button onClick={() => handleToggleBanner(b.id, b.active)} className="text-blue-500 p-1"><Power size={14} /></button>
                                    <button onClick={() => handleDeleteBanner(b.id)} className="text-red-500 p-1"><Trash2 size={14} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* PUSH CONFIGS */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-4 flex gap-2"><Send size={18} className="text-blue-500" /> Lên Lịch Gửi Tin (Push)</h3>
                    <div className="space-y-2 mb-4 bg-blue-50 p-3 rounded-lg">
                        <input type="text" placeholder="Tiêu đề" value={pushForm.title} onChange={e => setPushForm({...pushForm, title: e.target.value})} className="w-full border rounded p-2 text-sm font-bold" />
                        <textarea placeholder="Nội dung" value={pushForm.body} onChange={e => setPushForm({...pushForm, body: e.target.value})} className="w-full border rounded p-2 text-sm h-16" />
                        <div className="flex justify-between items-center">
                            <TimeSelect value={pushForm.time} onChange={v => setPushForm({...pushForm, time: v})} />
                            <select value={pushForm.frequency} onChange={e => setPushForm({...pushForm, frequency: e.target.value as any})} className="border rounded p-1 text-sm bg-white">
                                <option value="once">Một lần</option>
                                <option value="daily">Hàng ngày</option>
                            </select>
                            <button onClick={handleAddPush} className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm font-bold">Lưu</button>
                        </div>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {pushConfigs.map(p => (
                            <div key={p.id} className="bg-white border rounded p-3 relative">
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="font-bold text-sm text-slate-800">{p.title}</h4>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleTogglePush(p.id, p.isActive)} className={p.isActive ? 'text-green-500' : 'text-gray-400'}><Power size={14} /></button>
                                        <button onClick={() => handleDeletePush(p.id)} className="text-red-400"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-600 mb-2">{p.body}</p>
                                <div className="flex gap-2 text-[10px] uppercase font-bold text-slate-400">
                                    <span className="bg-slate-100 px-1.5 rounded flex items-center gap-1"><Clock size={10} /> {p.time}</span>
                                    <span className="bg-slate-100 px-1.5 rounded flex items-center gap-1"><RefreshCw size={10} /> {p.frequency}</span>
                                    {p.lastSent && <span className="text-green-600">Sent: {format(new Date(p.lastSent), 'dd/MM')}</span>}
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