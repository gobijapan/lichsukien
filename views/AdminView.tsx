
import React, { useEffect, useState } from 'react';
import { Users, Calendar, Database, X } from 'lucide-react';
import { User } from '../types';
import { getAdminStats } from '../services/storage';

interface AdminViewProps {
  user: User;
  onClose: () => void;
  fontClass: string;
}

const AdminView: React.FC<AdminViewProps> = ({ user, onClose, fontClass }) => {
  const [stats, setStats] = useState({ users: 0, todayEvents: 0 });

  useEffect(() => {
      getAdminStats().then(setStats);
  }, []);

  return (
    <div className={`h-full flex flex-col ${fontClass} bg-slate-100`}>
      <div className="pt-safe bg-slate-900 text-white p-6 pb-12 rounded-b-[2rem] shadow-xl">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="opacity-70 text-sm">Xin chào, {user.name}</p>
          </div>
          <button onClick={onClose} className="bg-white/10 p-2 rounded-full hover:bg-white/20">
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="-mt-8 px-4 grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-md border border-slate-200">
           <div className="bg-blue-100 w-10 h-10 rounded-full flex items-center justify-center text-blue-600 mb-2">
             <Users size={20} />
           </div>
           <h3 className="text-2xl font-bold text-slate-800">{stats.users}</h3>
           <p className="text-xs text-slate-500">Người dùng</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-md border border-slate-200">
           <div className="bg-green-100 w-10 h-10 rounded-full flex items-center justify-center text-green-600 mb-2">
             <Calendar size={20} />
           </div>
           <h3 className="text-2xl font-bold text-slate-800">{stats.todayEvents}</h3>
           <p className="text-xs text-slate-500">Sự kiện hôm nay</p>
        </div>
      </div>

      <div className="p-4 mt-2">
        <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
          <Database size={16} /> Quản lý hệ thống
        </h3>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
           <div className="p-4 border-b border-slate-100 flex justify-between items-center">
             <span>Cập nhật ngày lễ</span>
             <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Active</span>
           </div>
           <div className="p-4 border-b border-slate-100 flex justify-between items-center">
             <span>Backup Database</span>
             <button className="text-xs bg-blue-600 text-white px-3 py-1 rounded">Run</button>
           </div>
           <div className="p-4 flex justify-between items-center">
             <span>Gửi thông báo đẩy</span>
             <button className="text-xs bg-slate-800 text-white px-3 py-1 rounded">Gửi</button>
           </div>
        </div>
      </div>
      
      <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
        Admin Panel v1.0 • Connected
      </div>
    </div>
  );
};

export default AdminView;
