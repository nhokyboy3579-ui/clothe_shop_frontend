'use client';
import { useState } from 'react';
import api from '@/services/axios';
import Link from 'next/link';
import Header from '@/components/Header';
import { useRouter } from 'next/navigation';
// Import toast
import toast from 'react-hot-toast';

export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password_confirmation: ''
  });
  const [loading, setLoading] = useState(false); // Thêm trạng thái loading nút bấm

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); // Bắt đầu xoay nút bấm

    try {
      await api.post('/register', formData);
      
      // THÔNG BÁO ĐẸP
      toast.success('Đăng ký thành công! Đang chuyển hướng...', {
        duration: 2000,
        style: { border: '1px solid #4caf50', padding: '16px', color: '#4caf50' },
      });

      // Đợi 1.5s cho người dùng đọc thông báo rồi chuyển
      setTimeout(() => {
        router.push('/login');
      }, 1500);

    } catch (err) {
      // Hiển thị lỗi từ server hoặc lỗi chung
      const msg = err.response?.data?.message || 'Đăng ký thất bại';
      toast.error(msg);
      
      // Nếu có lỗi chi tiết từng trường (validate)
      if (err.response?.data?.errors) {
         Object.values(err.response.data.errors).forEach(errorArray => {
             toast.error(errorArray[0]);
         });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="flex items-center justify-center py-10 bg-gray-50">
        <form onSubmit={handleSubmit} className="bg-white p-8 shadow-lg rounded-md w-full max-w-md">
          <h2 className="text-2xl font-serif text-center mb-6 uppercase tracking-widest">Đăng Ký</h2>

          {/* Các input giữ nguyên như cũ, chỉ thay đổi phần Button */}
          {['username', 'email', 'password', 'password_confirmation'].map((field, idx) => (
             <div className="mb-4" key={idx}>
               <label className="block text-sm font-bold mb-1 capitalize">
                 {field === 'password_confirmation' ? 'Nhập lại mật khẩu' : field}
               </label>
               <input 
                 name={field} 
                 type={field.includes('password') ? 'password' : 'text'}
                 onChange={handleChange} 
                 className="w-full border p-2 rounded focus:border-black outline-none" 
                 required 
               />
             </div>
          ))}

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full bg-black text-white py-3 uppercase tracking-widest hover:bg-gray-800 transition flex justify-center items-center ${loading ? 'opacity-70' : ''}`}
          >
            {loading ? 'Đang xử lý...' : 'Đăng Ký Ngay'}
          </button>

          <p className="mt-4 text-center text-sm">
            Đã có tài khoản? <Link href="/login" className="text-blue-600 underline">Đăng nhập</Link>
          </p>
        </form>
      </div>
    </div>
  );
}