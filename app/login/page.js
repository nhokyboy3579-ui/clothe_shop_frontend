'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { AuthService } from '@/services/AuthService';
import toast, { Toaster } from 'react-hot-toast';

export default function Login() {
  const router = useRouter();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false); 
  const [userName, setUserName] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await AuthService.login(formData);
      
      // Lưu thông tin vào localStorage
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Lấy tên hiển thị
      const name = data.user.name || data.user.username;
      setUserName(name);

      // Hiển thị màn hình chào mừng
      setShowWelcome(true);

      // Chuyển hướng sau 2 giây
      setTimeout(() => {
        window.location.href = '/'; 
      }, 2000);

    } catch (err) {
      // Xử lý lỗi validation (422) hoặc sai tài khoản (401)
      if (err.response && err.response.status === 422) {
        const errors = err.response.data.errors;
        Object.keys(errors).forEach((key) => {
          toast.error(errors[key][0], { id: key });
        });
      } else {
        const msg = err.response?.data?.message || 'Tên đăng nhập hoặc mật khẩu không chính xác.';
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // --- MÀN HÌNH CHÀO MỪNG (OVERLAY LUXURY) ---
  if (showWelcome) {
    return (
      <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center animate-fadeIn">
        <div className="w-12 h-12 border-2 border-slate-200 border-t-black rounded-full animate-spin mb-8"></div>
        <h1 className="text-4xl font-serif italic text-slate-900 mb-3 animate-pulse tracking-tighter">
          Xin chào, {userName}!
        </h1>
        <p className="text-slate-400 text-[10px] font-bold tracking-[0.4em] uppercase italic">
          Đang kết nối tới trang chủ...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans">
      <Header />
      <Toaster position="top-center" />
      
      <div className="flex items-center justify-center py-20 bg-gray-50">
        <form onSubmit={handleSubmit} className="bg-white p-10 shadow-2xl rounded-[2.5rem] w-full max-w-md border border-gray-100">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-serif italic font-medium text-slate-900 uppercase tracking-tighter">Đăng Nhập</h2>
            <div className="flex items-center justify-center gap-2 mt-3">
                <span className="h-[1px] w-8 bg-slate-200"></span>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Welcome Back</p>
                <span className="h-[1px] w-8 bg-slate-200"></span>
            </div>
          </div>

          <div className="space-y-5">
            {/* Tên đăng nhập */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Tên đăng nhập</label>
              <input 
                name="username" 
                type="text"
                placeholder="USERNAME"
                onChange={handleChange} 
                className="w-full border-none bg-slate-50 p-4 rounded-2xl focus:ring-2 focus:ring-black outline-none transition-all font-sans text-sm" 
                required 
              />
            </div>

            {/* Mật khẩu */}
            <div>
              <div className="flex justify-between items-center mb-2 ml-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Mật khẩu</label>
                <Link href="/forgot-password" size="sm" className="text-[10px] font-bold text-slate-400 hover:text-black transition uppercase italic underline underline-offset-4 decoration-slate-200">
                   Quên?
                </Link>
              </div>
              <input 
                name="password" 
                type="password"
                placeholder="PASSWORD"
                onChange={handleChange} 
                className="w-full border-none bg-slate-50 p-4 rounded-2xl focus:ring-2 focus:ring-black outline-none transition-all font-sans text-sm" 
                required 
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full mt-10 bg-black text-white py-5 rounded-[1.5rem] font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-slate-800 transition-all flex justify-center items-center shadow-xl shadow-black/5 ${loading ? 'opacity-50' : 'active:scale-95'}`}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                Đang kiểm tra...
              </>
            ) : 'Đăng Nhập Ngay'}
          </button>

          <p className="mt-8 text-center text-[11px] text-slate-500 font-medium">
            Chưa có tài khoản? <Link href="/register" className="text-black font-bold underline underline-offset-4 hover:text-indigo-600 transition-colors">Đăng ký thành viên</Link>
          </p>
        </form>
      </div>
    </div>
  );
}