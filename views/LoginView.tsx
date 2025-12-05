
import React, { useState } from 'react';
import { User } from '../types';
import { Lock, Mail, Chrome, User as UserIcon, X, ArrowRight, Check, KeyRound, ChevronLeft } from 'lucide-react';
import { auth } from '../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail } from 'firebase/auth';

interface LoginViewProps {
  onLogin: (user: User) => void;
  onClose: () => void;
  fontClass: string;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin, onClose, fontClass }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (isForgotPassword) {
          // Forgot Password Logic
          if (!email) throw { code: 'custom/missing-email' };
          await sendPasswordResetEmail(auth, email);
          setResetSent(true);
          setLoading(false);
          return;
      }

      if (isRegister) {
        // Register Logic
        if (!name.trim()) throw { code: 'custom/missing-name' };
        if (password !== confirmPassword) throw { code: 'custom/password-mismatch' };
        
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
      } else {
        // Login Logic
        await signInWithEmailAndPassword(auth, email, password);
      }
      
      // Success Logic
      setSuccess(true);
      setTimeout(() => {
         onClose();
      }, 1500);

    } catch (err: any) {
      setError(getErrorMessage(err.code));
    } finally {
      if (!isForgotPassword) setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      setSuccess(true);
      setTimeout(() => {
         onClose();
      }, 1500);
    } catch (err: any) {
      setError(getErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (code: string) => {
    switch (code) {
      case 'auth/invalid-email': return 'Email không hợp lệ';
      case 'auth/user-not-found': return 'Tài khoản không tồn tại';
      case 'auth/wrong-password': return 'Sai mật khẩu';
      case 'auth/email-already-in-use': return 'Email này đã được sử dụng';
      case 'auth/weak-password': return 'Mật khẩu quá yếu (cần > 6 ký tự)';
      case 'custom/missing-name': return 'Vui lòng nhập họ tên của bạn';
      case 'custom/missing-email': return 'Vui lòng nhập email để khôi phục';
      case 'custom/password-mismatch': return 'Mật khẩu xác nhận không khớp';
      case 'auth/too-many-requests': return 'Quá nhiều lần thử sai. Vui lòng thử lại sau.';
      default: return `Lỗi: ${code}. Vui lòng thử lại.`;
    }
  }

  // --- RENDER SUCCESS STATE ---
  if (success) {
      return (
        <div className={`h-full flex items-center justify-center p-6 ${fontClass} relative`}>
            <div className="bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-2xl text-center animate-in zoom-in duration-300">
                <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check size={32} />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Đăng Nhập Thành Công!</h2>
                <p className="text-gray-500">Đang quay lại...</p>
            </div>
        </div>
      );
  }

  // --- RENDER FORGOT PASSWORD SUCCESS ---
  if (resetSent) {
      return (
        <div className={`h-full flex items-center justify-center p-6 ${fontClass} relative`}>
            <div className="w-full max-w-sm glass rounded-3xl p-8 shadow-2xl relative overflow-hidden animate-in zoom-in duration-300 bg-white">
                <div className="w-16 h-16 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail size={32} />
                </div>
                <h2 className="text-xl font-bold text-gray-800 text-center mb-2">Đã Gửi Email</h2>
                <p className="text-gray-500 text-center mb-6 text-sm">
                    Vui lòng kiểm tra hộp thư đến (và mục spam) của <b>{email}</b> để đặt lại mật khẩu.
                </p>
                <button 
                    onClick={() => { setResetSent(false); setIsForgotPassword(false); }}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition"
                >
                    Quay lại Đăng Nhập
                </button>
            </div>
        </div>
      );
  }

  return (
    <div className={`h-full flex items-center justify-center p-6 ${fontClass} relative`}>
      {/* Close Button */}
      <button 
        onClick={onClose}
        className="absolute top-12 right-6 z-50 bg-black/20 p-2 rounded-full text-white backdrop-blur-md hover:bg-black/30 transition-colors"
      >
        <X size={24} />
      </button>

      <div className="w-full max-w-sm glass rounded-3xl p-8 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 to-yellow-500"></div>
        
        {/* Back button for Forgot Password mode */}
        {isForgotPassword && (
            <button 
                onClick={() => setIsForgotPassword(false)}
                className="absolute top-4 left-4 text-gray-400 hover:text-gray-600"
            >
                <ChevronLeft size={24} />
            </button>
        )}

        <h2 className="text-3xl font-bold text-gray-800 text-center mb-1">
          {isForgotPassword ? 'Khôi Phục' : (isRegister ? 'Tạo Tài Khoản' : 'Xin Chào')}
        </h2>
        <p className="text-gray-500 text-center mb-6 text-sm">
          {isForgotPassword 
            ? 'Nhập email để nhận link đặt lại mật khẩu'
            : (isRegister ? 'Điền thông tin bên dưới để đăng ký' : 'Đăng nhập để đồng bộ lịch của bạn')
          }
        </p>

        {error && <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-4 text-xs font-medium text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {isRegister && !isForgotPassword && (
             <div className="relative animate-in slide-in-from-left duration-300">
               <UserIcon className="absolute left-4 top-3.5 text-gray-400" size={20} />
               <input 
                 type="text" 
                 placeholder="Họ và Tên"
                 value={name}
                 onChange={e => setName(e.target.value)}
                 className="w-full bg-white/50 border border-white rounded-xl py-3 pl-12 pr-4 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-400 text-sm"
               />
             </div>
          )}

          <div className="relative">
            <Mail className="absolute left-4 top-3.5 text-gray-400" size={20} />
            <input 
              type="email" 
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-white/50 border border-white rounded-xl py-3 pl-12 pr-4 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-400 text-sm"
            />
          </div>
          
          {!isForgotPassword && (
            <>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 text-gray-400" size={20} />
                <input 
                  type="password" 
                  placeholder="Mật khẩu"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-white/50 border border-white rounded-xl py-3 pl-12 pr-4 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-400 text-sm"
                />
              </div>

              {isRegister && (
                  <div className="relative animate-in slide-in-from-left duration-300 delay-100">
                    <KeyRound className="absolute left-4 top-3.5 text-gray-400" size={20} />
                    <input 
                      type="password" 
                      placeholder="Nhập lại mật khẩu"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className={`w-full bg-white/50 border rounded-xl py-3 pl-12 pr-4 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 text-sm ${confirmPassword && password !== confirmPassword ? 'border-red-300 focus:ring-red-400' : 'border-white focus:ring-red-400'}`}
                    />
                  </div>
              )}
            </>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl shadow-lg transform transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? 'Đang xử lý...' : (isForgotPassword ? 'Gửi Link' : (isRegister ? 'Đăng Ký' : 'Đăng Nhập'))}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        {!isForgotPassword && (
            <div className="mt-4">
                <button 
                   onClick={handleGoogleLogin}
                   type="button"
                   disabled={loading}
                   className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-3 rounded-xl shadow-sm flex items-center justify-center gap-2 transition text-sm"
                >
                   <Chrome size={18} className="text-blue-500" />
                   Tiếp tục bằng Google
                </button>
                
                <div className="mt-6 text-center space-y-3">
                  {!isRegister && (
                      <button 
                        type="button"
                        onClick={() => { setIsForgotPassword(true); setError(''); }}
                        className="text-gray-500 text-xs hover:text-gray-700 block mx-auto"
                      >
                        Quên mật khẩu?
                      </button>
                  )}

                  <div>
                      <p className="text-gray-500 text-xs inline">
                        {isRegister ? 'Đã có tài khoản? ' : 'Chưa có tài khoản? '}
                      </p>
                      <button 
                        type="button"
                        onClick={() => { setIsRegister(!isRegister); setError(''); setConfirmPassword(''); }}
                        className="text-red-600 font-bold text-sm hover:underline"
                      >
                        {isRegister ? 'Đăng nhập ngay' : 'Đăng ký mới'}
                      </button>
                  </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default LoginView;
