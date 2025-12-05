
import React, { useEffect, useState } from 'react';
import { Users, Calendar, X, Search, Shield, Bell, Send, Trash2, CheckCircle2, Megaphone, PlusCircle, ToggleLeft, ToggleRight, Clock } from 'lucide-react';
import { User, SystemBanner, AdminPushConfig } from '../types';
import { getAdminStats, getAllUsers, addSystemBanner, deleteSystemBanner, toggleSystemBanner, subscribeToBanners, subscribeToPushConfigs, addPushConfig, deletePushConfig, togglePushConfig } from '../services/storage';

interface AdminViewProps {
  user: User;
  onClose: () => void;
  fontClass: string;
}

const AdminView: React.FC<AdminViewProps> = ({ user, onClose, fontClass }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'system'>('dashboard');
  const [stats, setStats] = useState({ users: 0, todayEvents: 0 });
  const [usersList, setUsersList] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Lists Data
  const [banners, setBanners] = useState<SystemBanner[]>([]);
  const [pushConfigs, setPushConfigs] = useState<AdminPushConfig[]>([]);

  // Forms
  const [bannerForm, setBannerForm] = useState({ content: '', type: 'info' as 'info' | 'warning' | 'error' });
  const [pushForm, setPushForm] = useState({ title: '', body: '', time: '07:00', frequency: 'once' as 'once' | 'daily' });

  useEffect(() => {
      getAdminStats().then(setStats);
      getAllUsers().then(setUsersList);
      const unsubBanner = subscribeToBanners(setBanners);
      const unsubPush = subscribeToPushConfigs(setPushConfigs);
      return () => { unsubBanner(); unsubPush(); };
  }, []);

  const handleAddBanner = async () => {
      if(!bannerForm.content) return;
      await addSystemBanner({ content: bannerForm.content, type: bannerForm.type, isActive: true });
      setBannerForm({ content: '', type: 'info' });
  }

  const handleAddPush = async () => {
      if(!pushForm.title || !pushForm.body) return;
      await addPushConfig({ ...pushForm, isActive: true });
      setPushForm({ title: '', body: '', time: '07:00', frequency: 'once' });
  }

  // 15-minute interval Time Picker
  const TimeSelect = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
      const [h, m] = value.split(':');
      return (
          <div className="flex gap-1 items-center">
              <select value={h} onChange={e => onChange(`${e.target.value}:${m}`)} className="border rounded p-1 text-sm">{Array.from({length: 24},(_,i)=>i.toString().padStart(2,'0')).map(x=><option key={x} value={x}>{x}</option>)}</select>
              <span>:</span>
              <select value={m} onChange={e => onChange(`${h}:${e.target.value}`)} className="border rounded p-1 text-sm">{['00','15','30','45'].map(x=><option key={x} value={x}>{x}</option>)}</select>
          </div>
      )
  }

  return (
    <div className={`h-full flex flex-col ${fontClass} bg-slate-100`}>
      <div className="pt-safe bg-slate-900 text-white p-6 pb-6 rounded-b-[2rem] shadow-xl shrink-0">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="opacity-70 text-sm">Xin chào, {user.name}</p>
          </div>
          <button onClick={onClose} className="bg-white/10 p-2 rounded-full hover:bg-white/20"><X size={20} /></button>
        </div>
        <div className="flex bg-slate-800 p-1 rounded-xl">
            {['dashboard', 'users', 'system'].map(t => (
                <button key={t} onClick={() => setActiveTab(t as any)} className={`flex-1 py-2 text-xs font-bold rounded-lg capitalize ${activeTab === t ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>{t}</button>
            ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'dashboard' && (
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                    <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center text-blue-600 mb-3"><Users size={24} /></div>
                    <h3 className="text-3xl font-bold text-slate-800">{stats.users}</h3>
                    <p className="text-xs text-slate-500 font-bold uppercase">Users</p>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                    <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center text-green-600 mb-3"><Calendar size={24} /></div>
                    <h3 className="text-3xl font-bold text-slate-800">{stats.todayEvents}</h3>
                    <p className="text-xs text-slate-500 font-bold uppercase">Events Today</p>
                </div>
            </div>
        )}

        {activeTab === 'users' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 h-full flex flex-col">
                <div className="p-4 border-b"><input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-4 pr-4 py-2 bg-slate-50 border rounded-xl text-sm" /></div>
                <div className="flex-1 overflow-y-auto">
                    {usersList.filter(u=>u.name.toLowerCase().includes(searchTerm)).map(u => (
                        <div key={u.id} className="p-4 border-b flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${u.role==='admin'?'bg-red-500':'bg-blue-500'}`}>{u.name.charAt(0)}</div>
                            <div className="flex-1"><p className="font-bold text-sm">{u.name}</p><p className="text-xs text-slate-500">{u.email}</p></div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {activeTab === 'system' && (
            <div className="space-y-6">
                {/* LOA PHƯỜNG (BANNERS) */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="font-bold mb-4 flex items-center gap-2"><Megaphone size={18} className="text-orange-500"/> Loa Phường (Banners)</h3>
                    <div className="space-y-2 mb-4">
                        <input value={bannerForm.content} onChange={e=>setBannerForm({...bannerForm, content:e.target.value})} placeholder="Nội dung thông báo..." className="w-full border rounded p-2 text-sm"/>
                        <div className="flex gap-2">
                            {['info','warning','error'].map(t=><button key={t} onClick={()=>setBannerForm({...bannerForm, type:t as any})} className={`flex-1 py-1 text-xs uppercase rounded ${bannerForm.type===t?'bg-slate-800 text-white':'bg-slate-100'}`}>{t}</button>)}
                            <button onClick={handleAddBanner} className="bg-blue-600 text-white px-4 rounded text-sm font-bold flex items-center"><PlusCircle size={16}/></button>
                        </div>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                        {banners.map(b => (
                            <div key={b.id} className="flex justify-between items-center p-2 bg-slate-50 rounded border text-sm">
                                <span className={`w-2 h-2 rounded-full ${b.type==='error'?'bg-red-500':b.type==='warning'?'bg-yellow-500':'bg-blue-500'}`}></span>
                                <span className="flex-1 mx-2 truncate">{b.content}</span>
                                <div className="flex gap-2">
                                    <button onClick={()=>toggleSystemBanner(b.id, b.isActive)} className={b.isActive?'text-green-600':'text-gray-400'}>{b.isActive?<ToggleRight/>:<ToggleLeft/>}</button>
                                    <button onClick={()=>deleteSystemBanner(b.id)} className="text-red-400"><Trash2 size={16}/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* PUSH NOTIFICATION CONFIG */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="font-bold mb-4 flex items-center gap-2"><Send size={18} className="text-blue-500"/> Push Config (Định kỳ)</h3>
                    <div className="space-y-2 mb-4 bg-slate-50 p-3 rounded-xl">
                        <input value={pushForm.title} onChange={e=>setPushForm({...pushForm, title:e.target.value})} placeholder="Tiêu đề" className="w-full border rounded p-2 text-sm font-bold"/>
                        <textarea value={pushForm.body} onChange={e=>setPushForm({...pushForm, body:e.target.value})} placeholder="Nội dung" className="w-full border rounded p-2 text-sm h-16"/>
                        <div className="flex justify-between items-center">
                            <TimeSelect value={pushForm.time} onChange={t=>setPushForm({...pushForm, time:t})} />
                            <div className="flex gap-2 text-xs">
                                <label className="flex items-center gap-1"><input type="radio" checked={pushForm.frequency==='once'} onChange={()=>setPushForm({...pushForm, frequency:'once'})} /> 1 Lần</label>
                                <label className="flex items-center gap-1"><input type="radio" checked={pushForm.frequency==='daily'} onChange={()=>setPushForm({...pushForm, frequency:'daily'})} /> Hàng ngày</label>
                            </div>
                        </div>
                        <button onClick={handleAddPush} className="w-full bg-slate-900 text-white py-2 rounded text-sm font-bold mt-2">Thêm Lịch Gửi</button>
                    </div>
                    <div className="space-y-2">
                        {pushConfigs.map(p => (
                            <div key={p.id} className="p-3 bg-white border rounded-xl shadow-sm flex flex-col gap-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-sm">{p.title}</p>
                                        <p className="text-xs text-slate-500 line-clamp-1">{p.body}</p>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={()=>togglePushConfig(p.id, p.isActive)} className={p.isActive?'text-green-600':'text-gray-400'}>{p.isActive?<ToggleRight/>:<ToggleLeft/>}</button>
                                        <button onClick={()=>deletePushConfig(p.id)} className="text-red-400"><Trash2 size={16}/></button>
                                    </div>
                                </div>
                                <div className="flex justify-between text-xs text-slate-400 font-mono bg-slate-50 p-1 rounded">
                                    <span className="flex items-center gap-1"><Clock size={12}/> {p.time}</span>
                                    <span className="uppercase">{p.frequency}</span>
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
