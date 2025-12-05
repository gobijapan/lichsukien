
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
            <select value={h} onChange={(e) => onChange(`${e.target.value}:${m}`)} className="border rounded p-1.5 text-sm bg-white border-slate-300 focus:ring-2 focus:ring-blue-500">{Array.from({length: 24},(_,i)=>i.toString().padStart(2,'0')).map(x=><option key={x} value={x}>{x}</option>)}</select>
            <span className="font-bold text-slate-500">:</span>
            <select value={m} onChange={(e) => onChange(`${h}:${e.target.value}`)} className="border rounded p-1.5 text-sm bg-white border-slate-300 focus:ring-2 focus:ring-blue-500">{['00','15','30','45'].map(x=><option key={x} value={x}>{x}</option>)}</select>
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

  // Refresh State
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
      setRefreshing(true);
      try {
          const s = await getAdminStats();
          setStats(s);
          const u = await getAllUsers();
          setUsersList(u);
          const b = await getAllBanners();
          setBanners(b);
          const p = await getAllPushConfigs();
          setPushConfigs(p);
      } finally {
          setRefreshing(false);
      }
  }

  // --- BANNER HANDLERS ---
  const handleAddBanner = async () => {
      if(!bannerForm.content) return;
      await addSystemBanner(bannerForm);
      setBannerForm({ content: '', type: 'info' });
      const b = await getAllBanners();
      setBanners(b);
  }
  const handleDeleteBanner = async (id: string) => {
      if(confirm('Xóa thông báo này?')) {
          await deleteSystemBanner(id);
          const b = await getAllBanners();
          setBanners(b);
      }
  }
  const handleToggleBanner = async (id: string, active: boolean) => {
      await toggleSystemBanner(id, active);
      const b = await getAllBanners();
      setBanners(b);
  }

  // --- PUSH HANDLERS ---
  const handleAddPush = async () => {
      if(!pushForm.title || !pushForm.body) return;
      await addPushConfig(pushForm);
      setPushForm({ title: '', body: '', time: '09:00', frequency: 'once' });
      const p = await getAllPushConfigs();
      setPushConfigs(p);
  }
  const handleDeletePush = async (id: string) => {
      if(confirm('Xóa cấu hình này?')) {
          await deletePushConfig(id);
          const p = await getAllPushConfigs();
          setPushConfigs(p);
      }
  }
  const handleTogglePush = async (id: string, active: boolean) => {
      await togglePushConfig(id, active);
      const p = await getAllPushConfigs();
      setPushConfigs(p);
  }

  const filteredUsers = usersList.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className={`h-full flex flex-col ${fontClass} bg-slate-50`}>
      <div className="pt-safe bg-white border-b border-slate-200 text-slate-800 p-6 pb-4 shadow-sm shrink-0 sticky top-0 z-20">
        <div className="flex justify-between items-center mb-4">
          <div><h1 className="text-2xl font-bold font-[Playfair_Display]">Quản Trị Hệ Thống</h1><p className="opacity-60 text-xs">Xin chào, {user.name}</p></div>
          <button onClick={onClose} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200 text-slate-600"><X size={20} /></button>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl">
            {['dashboard', 'users', 'system'].map(t => (
                <button key={t} onClick={() => setActiveTab(t as any)} className={`flex-1 py-2 text-xs font-bold rounded-lg capitalize transition-all ${activeTab === t ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{t}</button>
            ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* REFRESH BUTTON */}
        <div className="flex justify-end">
            <button onClick={loadData} disabled={refreshing} className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                Làm mới dữ liệu
            </button>
        </div>

        {activeTab === 'dashboard' && (
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mb-3 text-blue-600"><Users size={20} /></div>
                    <h3 className="text-3xl font-bold text-slate-800">{stats.users}</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Người dùng</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mb-3 text-green-600"><Calendar size={20} /></div>
                    <h3 className="text-3xl font-bold text-slate-800">{stats.todayEvents}</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Sự kiện hôm nay</p>
                </div>
            </div>
        )}

        {activeTab === 'users' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full min-h-[50vh]">
                <div className="p-4 border-b border-slate-100 sticky top-0 bg-white z-10">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                        <input type="text" placeholder="Tìm kiếm tên người dùng..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-400">
                            <tr>
                                <th className="px-4 py-3">Tên</th>
                                <th className="px-4 py-3">Email</th>
                                <th className="px-4 py-3">Vai trò</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredUsers.map((u) => (
                                <tr key={u.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 font-medium text-slate-800 flex items-center gap-2">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${u.role === 'admin' ? 'bg-red-500' : 'bg-blue-500'}`}>{u.name.charAt(0)}</div>
                                        {u.name}
                                    </td>
                                    <td className="px-4 py-3 text-xs">{u.email}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${u.role === 'admin' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                            {u.role}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {activeTab === 'system' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* === LOA PHƯỜNG (BANNERS) === */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-100 bg-orange-50 flex justify-between items-center">
                        <h3 className="font-bold text-orange-800 flex gap-2 items-center"><Megaphone size={18} /> Loa Phường</h3>
                        <span className="text-xs font-bold bg-white text-orange-600 px-2 py-1 rounded shadow-sm">{banners.length} tin</span>
                    </div>
                    
                    {/* Add Form */}
                    <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
                        <input type="text" placeholder="Nội dung thông báo..." value={bannerForm.content} onChange={e => setBannerForm({...bannerForm, content: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                        <div className="flex gap-2">
                            {(['info', 'warning', 'error'] as const).map(t => (
                                <button key={t} onClick={() => setBannerForm({...bannerForm, type: t})} className={`flex-1 py-1.5 text-xs font-bold uppercase rounded-lg border ${bannerForm.type === t ? (t === 'error' ? 'bg-red-600 text-white border-red-600' : t === 'warning' ? 'bg-yellow-500 text-white border-yellow-500' : 'bg-blue-600 text-white border-blue-600') : 'bg-white text-slate-500 border-slate-200'}`}>{t}</button>
                            ))}
                            <button onClick={handleAddBanner} className="bg-slate-800 text-white px-4 rounded-lg hover:bg-slate-900"><Plus size={18} /></button>
                        </div>
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto max-h-[400px]">
                        {banners.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 text-sm">Chưa có thông báo nào.</div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {banners.map(b => (
                                    <div key={b.id} className={`p-3 flex items-center justify-between hover:bg-slate-50 ${!b.active ? 'opacity-50 grayscale' : ''}`}>
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <div className={`w-2 h-2 rounded-full shrink-0 ${b.type === 'error' ? 'bg-red-500' : b.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'}`}></div>
                                            <p className="text-sm text-slate-700 truncate">{b.content}</p>
                                        </div>
                                        <div className="flex items-center gap-2 pl-2">
                                            <button 
                                                onClick={() => handleToggleBanner(b.id, b.active)} 
                                                className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${b.active ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'}`}
                                            >
                                                {b.active ? 'Bật' : 'Tắt'}
                                            </button>
                                            <button onClick={() => handleDeleteBanner(b.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* === PUSH NOTIFICATION CONFIG === */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-100 bg-blue-50 flex justify-between items-center">
                        <h3 className="font-bold text-blue-800 flex gap-2 items-center"><Send size={18} /> Gửi Tin (Push)</h3>
                        <span className="text-xs font-bold bg-white text-blue-600 px-2 py-1 rounded shadow-sm">{pushConfigs.length} cấu hình</span>
                    </div>

                    {/* Add Form */}
                    <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
                        <input type="text" placeholder="Tiêu đề (VD: Chúc ngủ ngon)" value={pushForm.title} onChange={e => setPushForm({...pushForm, title: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        <textarea placeholder="Nội dung tin nhắn..." value={pushForm.body} onChange={e => setPushForm({...pushForm, body: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2 text-sm h-16 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        
                        <div className="flex items-center justify-between gap-2">
                            <TimeSelect value={pushForm.time} onChange={v => setPushForm({...pushForm, time: v})} />
                            <select value={pushForm.frequency} onChange={e => setPushForm({...pushForm, frequency: e.target.value as any})} className="border border-slate-300 rounded-lg p-1.5 text-sm bg-white">
                                <option value="once">Một lần</option>
                                <option value="daily">Hàng ngày</option>
                            </select>
                            <button onClick={handleAddPush} className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold shadow hover:bg-blue-700">Lưu</button>
                        </div>
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto max-h-[400px]">
                        {pushConfigs.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 text-sm">Chưa có lịch gửi tin nào.</div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {pushConfigs.map(p => (
                                    <div key={p.id} className={`p-4 hover:bg-slate-50 transition-colors ${!p.isActive ? 'opacity-60 bg-slate-50' : ''}`}>
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="font-bold text-sm text-slate-800">{p.title}</h4>
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={() => handleTogglePush(p.id, p.isActive)} 
                                                    className={`w-8 h-4 rounded-full relative transition-colors ${p.isActive ? 'bg-green-500' : 'bg-slate-300'}`}
                                                >
                                                    <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${p.isActive ? 'left-4.5' : 'left-0.5'}`} style={{ left: p.isActive ? 'calc(100% - 3.5px - 12px)' : '2px' }}></div>
                                                </button>
                                                <button onClick={() => handleDeletePush(p.id)} className="text-red-400 hover:text-red-600 ml-2"><Trash2 size={14} /></button>
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-600 mb-2 line-clamp-2">{p.body}</p>
                                        <div className="flex gap-2 text-[10px] uppercase font-bold text-slate-500">
                                            <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1"><Clock size={10} /> {p.time}</span>
                                            <span className={`px-2 py-0.5 rounded border flex items-center gap-1 ${p.frequency === 'daily' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                                <RefreshCw size={10} /> {p.frequency === 'daily' ? 'Hàng ngày' : 'Một lần'}
                                            </span>
                                            {p.lastSent && <span className="ml-auto text-green-600 flex items-center gap-1"><CheckCircle2 size={10} /> Đã gửi: {format(new Date(p.lastSent), 'dd/MM')}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default AdminView;
