'use client';
import { useState } from 'react';
import api from '@/services/axios';
import Link from 'next/link';
import Header from '@/components/Header';
import toast from 'react-hot-toast';

export default function Login() {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  
  // State quản lý màn hình chào mừng
  const [showWelcome, setShowWelcome] = useState(false); 
  const [userName, setUserName] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/login', formData);
      
      // Lưu thông tin
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Lấy tên user để hiển thị xin chào
      const name = response.data.user.name || response.data.user.username;
      setUserName(name);

      // Bật màn hình Loading Welcome lên
      setShowWelcome(true);

      // Đếm ngược 3 giây
      setTimeout(() => {
        // Dùng window.location để reload lại trang chủ (cập nhật Header user state)
        window.location.href = '/'; 
      }, 3000);

    } catch (err) {
      toast.error(err.response?.data?.message || 'Tài khoản hoặc mật khẩu sai.');
      setLoading(false);
    }
  };

  // --- MÀN HÌNH CHỜ (Overlay) ---
  if (showWelcome) {
    return (
      <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center animate-fadeIn">
        {/* Vòng tròn xoay loading */}
        <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin mb-6"></div>
        
        {/* Lời chào */}
        <h1 className="text-3xl md:text-4xl font-serif text-black mb-2 animate-pulse">
          Xin chào, {userName}!
        </h1>
        <p className="text-gray-500 text-sm tracking-widest uppercase">
          Đang đưa bạn về trang chủ...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="flex items-center justify-center h-[calc(100vh-80px)] bg-gray-50">
        <form onSubmit={handleSubmit} className="bg-white p-8 shadow-lg rounded-md w-full max-w-md">
          <h2 className="text-2xl font-serif text-center mb-6 uppercase tracking-widest">Đăng Nhập</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-bold mb-2">Tên đăng nhập</label>
            <input 
              type="text" 
              className="w-full border p-2 rounded focus:outline-none focus:border-black"
              required
              onChange={(e) => setFormData({...formData, username: e.target.value})}
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-bold mb-2">Mật khẩu</label>
            <input 
              type="password" 
              className="w-full border p-2 rounded focus:outline-none focus:border-black"
              required
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-black text-white py-3 uppercase tracking-widest hover:bg-gray-800 transition flex justify-center"
          >
             {loading ? 'Đang kiểm tra...' : 'ĐĂNG NHẬP'}
          </button>

          <p className="mt-4 text-center text-sm">
            Chưa có tài khoản? <Link href="/register" className="text-blue-600 underline">Đăng ký mới</Link>
          </p>
        </form>
      </div>
    </div>
  );
}