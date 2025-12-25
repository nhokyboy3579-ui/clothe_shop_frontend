'use client';
import { useEffect, useState } from 'react';
import api from '@/services/axios';
import Header from '@/components/Header';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // State form
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/profile');
        setUser(res.data);
        setFormData({
            name: res.data.name,
            email: res.data.email,
            phone: res.data.phone || '',
            password: ''
        });
        setPreviewUrl(res.data.full_avatar_url);
      } catch (error) {
        toast.error('Vui lòng đăng nhập');
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('name', formData.name);
    data.append('email', formData.email);
    if(formData.phone) data.append('phone', formData.phone);
    if(formData.password) data.append('password', formData.password);
    if(avatarFile) data.append('avatar', avatarFile);

    try {
        const res = await api.post('/profile', data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        toast.success('Cập nhật hồ sơ thành công!');
        setUser(res.data.user);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        window.dispatchEvent(new Event('userUpdated'));
        
    } catch (error) {
        const msg = error.response?.data?.errors 
        ? Object.values(error.response.data.errors)[0][0] 
        : 'Cập nhật thất bại';
        toast.error(msg);
    }
  };

  // --- HÀM XỬ LÝ GIAO DIỆN RANK (KHUNG + VƯƠNG MIỆN) ---
  const getRankStyle = (spent = 0) => {
    // 1. VIP (VÀNG) - Trên 10 triệu
    if (spent >= 10000000) {
        return {
            borderColor: 'border-yellow-400', // Viền vàng
            iconColor: 'text-yellow-500',     // Vương miện vàng
            bgBadge: 'bg-yellow-400',
            label: 'VIP Member',
            hasCrown: true
        };
    } 
    // 2. THÂN THIẾT (BẠC) - Trên 5 triệu
    else if (spent >= 5000000) {
        return {
            borderColor: 'border-gray-400',   // Viền bạc (xám)
            iconColor: 'text-gray-500',       // Vương miện bạc
            bgBadge: 'bg-gray-400',
            label: 'Loyal Member',
            hasCrown: true
        };
    }
    // 3. THƯỜNG
    return {
        borderColor: 'border-white',
        iconColor: '',
        bgBadge: 'hidden',
        label: 'Member',
        hasCrown: false
    };
  };

  if (loading) return <div className="flex h-screen items-center justify-center">Đang tải...</div>;

  // Lấy style dựa trên tổng chi tiêu
  const rankStyle = getRankStyle(user?.total_spent);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-10">
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm overflow-hidden">
            
            {/* Header Background */}
            <div className="bg-slate-900 h-32 relative"></div>
            
            <div className="px-8 relative">
                {/* --- KHU VỰC AVATAR CÓ KHUNG --- */}
                <div className="absolute -top-16 left-8">
                    <div className="relative">
                        {/* 1. Viền Avatar (Thay đổi màu theo rank) */}
                        <div className={`relative w-32 h-32 rounded-full border-4 ${rankStyle.borderColor} bg-white p-1`}>
                            <Image 
                                src={previewUrl || 'https://via.placeholder.com/150'} 
                                alt="Profile" fill 
                                className="rounded-full object-cover"
                                unoptimized
                            />
                        </div>

                        {/* 2. Icon Vương Miện (Nằm đè lên góc trên) */}
                        {rankStyle.hasCrown && (
                            <div className={`absolute -top-4 -right-2 bg-white rounded-full p-1 shadow-md ${rankStyle.iconColor}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                                    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                                </svg>
                            </div>
                        )}

                        {/* 3. Nút đổi ảnh (Camera) */}
                        <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition shadow border-2 border-white z-10">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                            </svg>
                            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                        </label>
                    </div>
                </div>
                
                <div className="pt-20 pb-6 ml-2">
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        {user?.name}
                    </h1>
                    
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-gray-500 text-sm">@{user?.username}</p>
                        {/* Huy hiệu nhỏ bên cạnh tên */}
                        {rankStyle.hasCrown && (
                             <span className={`${rankStyle.bgBadge} text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase`}>
                                {rankStyle.label}
                             </span>
                        )}
                    </div>

                    <p className="text-xs text-gray-400 mt-2">
                        Tổng chi tiêu tích lũy: <span className="font-bold text-black">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(user?.total_spent || 0)}</span>
                    </p>
                </div>
            </div>

            {/* Form chỉnh sửa */}
            <div className="px-8 pb-8 border-t pt-6">
                <h2 className="text-lg font-bold mb-4 uppercase tracking-wide text-gray-700">Cập nhật thông tin</h2>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                        <div>
                            <label className="block text-sm font-bold mb-2 text-gray-700">Họ và Tên</label>
                            <input 
                                type="text" className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:border-black"
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-2 text-gray-700">Số điện thoại</label>
                            <input 
                                type="text" className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:border-black"
                                value={formData.phone}
                                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-bold mb-2 text-gray-700">Email (Dùng để đăng nhập)</label>
                        <input 
                            type="email" className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:border-black bg-gray-50"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                        />
                    </div>

                    <div className="mb-8">
                        <label className="block text-sm font-bold mb-2 text-gray-700">Đổi mật khẩu mới <span className="font-normal text-gray-400">(Để trống nếu không đổi)</span></label>
                        <input 
                            type="password" className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:border-black"
                            placeholder="Nhập mật khẩu mới..."
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                        />
                    </div>

                    <div className="flex justify-end">
                        <button type="submit" className="bg-black text-white px-8 py-3 rounded-lg font-bold uppercase hover:bg-gray-800 transition shadow-lg">
                            Lưu thay đổi
                        </button>
                    </div>
                </form>
            </div>
        </div>
      </div>
    </div>
  );
}