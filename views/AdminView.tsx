
import React, { useEffect, useState } from 'react';
import { Users, Calendar, Database, X, Search, Shield, Bell, Send, AlertTriangle, Trash2, CheckCircle2, Megaphone } from 'lucide-react';
import { User, SystemAlert } from '../types';
import { getAdminStats, getAllUsers, saveSystemAlert, removeSystemAlert, getSystemAlert, schedulePushNotification } from '../services/storage';
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
  
  // Users State
  const [usersList, setUsersList] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // System State
  const [alertForm, setAlertForm] = useState<SystemAlert>({ active: true, content: '', type: 'info' });
  const [activeAlert, setActiveAlert] = useState<SystemAlert | null>(null);
  
  const [pushForm, setPushForm] = useState({ title: '', body: '', scheduledTime: '' });

  useEffect(() => {
      loadData();
  }, []);

  const loadData = async () => {
      const s = await getAdminStats();
      setStats(s);
      const u = await getAllUsers();
      setUsersList(u);
      const a = await getSystemAlert();
      setActiveAlert(a);
  }

  const handleSaveAlert = async () => {
      if(!alertForm.content) return;
      await saveSystemAlert(alertForm);
      alert("Đã đăng thông báo thành công!");
      loadData();
  }

  const handleRemoveAlert = async () => {
      await removeSystemAlert();
      alert("Đã gỡ thông báo.");
      loadData();
  }

  const handleSchedulePush = async () => {
      if(!pushForm.title || !pushForm.body || !pushForm.scheduledTime) return;
      
      const scheduledDate = new Date();
      const [h, m] = pushForm.scheduledTime.split(':').map(Number);
      scheduledDate.setHours(h);
      scheduledDate.setMinutes(m);
      if (scheduledDate < new Date()) {
          scheduledDate.setDate(scheduledDate.getDate() + 1); // If time passed, assume tomorrow
      }

      await schedulePushNotification({
          title: pushForm.title,
          body: pushForm.body,
          scheduledAt: scheduledDate.toISOString(),
          status: 'pending',
          createdAt: new Date().toISOString()
      });
      
      alert(`Đã lên lịch gửi lúc ${format(scheduledDate, 'HH:mm dd/MM')}!`);
      setPushForm({ title: '', body: '', scheduledTime: '' });
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
        
        {/* Navigation Tabs */}
        <div className="flex bg-slate-800 p-1 rounded-xl">
            <button 
                onClick={() => setActiveTab('dashboard')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
                Thống Kê
            </button>
            <button 
                onClick={() => setActiveTab('users')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${activeTab === 'users' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
                Người Dùng
            </button>
            <button 
                onClick={() => setActiveTab('system')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${activeTab === 'system' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
                Hệ Thống
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* === DASHBOARD TAB === */}
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
                
                {activeAlert && (
                    <div className="col-span-2 bg-yellow-50 border border-yellow-200 p-4 rounded-xl flex items-center gap-3">
                        <Megaphone className="text-yellow-600" />
                        <div>
                            <p className="text-xs font-bold text-yellow-800 uppercase">Đang phát thông báo</p>
                            <p className="text-sm text-yellow-700">{activeAlert.content}</p>
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* === USERS TAB === */}
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
                            {u.phoneNumber && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">{u.phoneNumber}</span>}
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* === SYSTEM TAB === */}
        {activeTab === 'system' && (
            <div className="space-y-6 animate-in slide-in-from-right-2">
                
                {/* 1. Global Alert Banner */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Megaphone size={18} className="text-orange-500" />
                        Thông Báo Chung (Banner)
                    </h3>
                    
                    <div className="space-y-3">
                        <input 
                            type="text" 
                            placeholder="Nội dung thông báo..."
                            value={alertForm.content}
                            onChange={e => setAlertForm({...alertForm, content: e.target.value})}
                            className="w-full border border-slate-200 rounded-lg p-2 text-sm"
                        />
                        <div className="flex gap-2">
                            {(['info', 'warning', 'error'] as const).map(type => (
                                <button 
                                    key={type}
                                    onClick={() => setAlertForm({...alertForm, type})}
                                    className={`flex-1 py-1.5 text-xs font-bold uppercase rounded ${alertForm.type === type ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500'}`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-2 pt-2">
                            <button onClick={handleSaveAlert} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2">
                                <CheckCircle2 size={16} /> Đăng Thông Báo
                            </button>
                            {activeAlert && (
                                <button onClick={handleRemoveAlert} className="bg-red-100 text-red-600 px-3 py-2 rounded-lg hover:bg-red-200">
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* 2. Push Notifications */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Send size={18} className="text-blue-500" />
                        Gửi Push Notification
                    </h3>
                    
                    <div className="space-y-3">
                        <input 
                            type="text" 
                            placeholder="Tiêu đề (VD: Chúc mừng năm mới)"
                            value={pushForm.title}
                            onChange={e => setPushForm({...pushForm, title: e.target.value})}
                            className="w-full border border-slate-200 rounded-lg p-2 text-sm font-bold"
                        />
                        <textarea 
                            placeholder="Nội dung tin nhắn..."
                            value={pushForm.body}
                            onChange={e => setPushForm({...pushForm, body: e.target.value})}
                            className="w-full border border-slate-200 rounded-lg p-2 text-sm min-h-[60px]"
                        />
                        <div className="flex items-center gap-3">
                            <label className="text-xs font-bold text-slate-500 uppercase">Giờ gửi:</label>
                            <input 
                                type="time"
                                value={pushForm.scheduledTime}
                                onChange={e => setPushForm({...pushForm, scheduledTime: e.target.value})}
                                className="border border-slate-200 rounded p-1 text-sm"
                            />
                            <span className="text-xs text-slate-400 italic">Hôm nay (hoặc ngày mai nếu đã qua giờ)</span>
                        </div>
                        <button 
                            onClick={handleSchedulePush}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 mt-2"
                        >
                            <Bell size={16} /> Lên Lịch Gửi
                        </button>
                    </div>
                </div>

            </div>
        )}

      </div>
    </div>
  );
};

export default AdminView;
