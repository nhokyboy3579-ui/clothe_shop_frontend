'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { AuthService } from '@/services/AuthService';
import toast, { Toaster } from 'react-hot-toast';

export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '', email: '', password: '', password_confirmation: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await AuthService.register(formData);
      
      toast.success('Đăng ký thành công! Đang chuyển hướng...', {
        duration: 2000,
        style: { border: '1px solid #4caf50', padding: '16px', color: '#4caf50' },
      });

      setTimeout(() => { router.push('/login'); }, 1500);

    } catch (err) {
      // XỬ LÝ LỖI 422: Trùng username, email hoặc lỗi xác thực
      if (err.response && err.response.status === 422) {
        const serverErrors = err.response.data.errors;
        
        // Duyệt qua từng trường lỗi để hiển thị câu tiếng Việt tương ứng
        Object.keys(serverErrors).forEach((key) => {
          toast.error(serverErrors[key][0], {
            id: key, // Tránh hiện chồng nhiều thông báo cùng lúc
            duration: 4000
          });
        });
      } else {
        toast.error(err.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại!');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      <Header />
      <Toaster position="top-center" />
      
      <div className="flex items-center justify-center py-10 bg-gray-50">
        <form onSubmit={handleSubmit} className="bg-white p-8 shadow-2xl rounded-[2rem] w-full max-w-md border border-gray-100">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-serif italic font-bold text-slate-900 uppercase tracking-tighter">Đăng Ký</h2>
          </div>

          <div className="space-y-4">
            <input name="username" placeholder="TÊN ĐĂNG NHẬP" onChange={(e) => setFormData({...formData, username: e.target.value})} className="w-full bg-slate-50 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-black font-sans text-sm" required />
            <input name="email" type="email" placeholder="EMAIL" onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-50 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-black font-sans text-sm" required />
            <input name="password" type="password" placeholder="MẬT KHẨU" onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full bg-slate-50 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-black font-sans text-sm" required />
            <input name="password_confirmation" type="password" placeholder="XÁC NHẬN MẬT KHẨU" onChange={(e) => setFormData({...formData, password_confirmation: e.target.value})} className="w-full bg-slate-50 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-black font-sans text-sm" required />
          </div>

          <button disabled={loading} className={`w-full mt-8 bg-black text-white py-4 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-slate-800 transition-all ${loading ? 'opacity-50' : ''}`}>
            {loading ? 'Đang xử lý...' : 'Đăng Ký Ngay'}
          </button>

          <p className="mt-6 text-center text-xs text-slate-500">
            Đã có tài khoản? <Link href="/login" className="text-black font-bold underline ml-1">Đăng nhập</Link>
          </p>
        </form>
      </div>
    </div>
  );
}