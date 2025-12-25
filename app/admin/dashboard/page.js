'use client';
import { useEffect, useState } from 'react';
import api from '@/services/axios';
import { 
  CurrencyDollarIcon, 
  ShoppingBagIcon, 
  TagIcon, 
  UserGroupIcon 
} from '@heroicons/react/24/outline'; // Nếu chưa cài heroicons thì xem hướng dẫn bên dưới, hoặc xóa icon đi cũng được

export default function AdminDashboard() {
  // State lưu dữ liệu thống kê
  const [stats, setStats] = useState({
    revenue: 0,       // Doanh thu
    new_orders: 0,    // Đơn mới
    total_products: 0,// Tổng sản phẩm
    total_users: 0    // Tổng khách hàng
  });
  
  const [loading, setLoading] = useState(true);

  // Hàm format tiền tệ VNĐ
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Gọi API Backend
        const response = await api.get('/admin/dashboard');
        setStats(response.data);
      } catch (error) {
        console.error("Lỗi tải dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 uppercase mb-6 tracking-wide">
        Tổng Quan Kinh Doanh
      </h2>

      {/* GRID 4 CỘT HIỂN THỊ THÔNG SỐ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        {/* CARD 1: DOANH THU */}
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500 flex items-center justify-between transition hover:-translate-y-1 hover:shadow-md">
          <div>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Doanh thu thực tế</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">
              {formatMoney(stats.revenue)}
            </p>
          </div>
          <div className="p-3 bg-green-100 rounded-full text-green-600">
            {/* Icon tiền */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
        </div>

        {/* CARD 2: ĐƠN HÀNG MỚI */}
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500 flex items-center justify-between transition hover:-translate-y-1 hover:shadow-md">
          <div>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Đơn hàng mới</p>
            <p className="text-3xl font-bold text-gray-800 mt-1">
              {stats.new_orders}
            </p>
          </div>
          <div className="p-3 bg-blue-100 rounded-full text-blue-600">
            {/* Icon giỏ hàng */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 5c.07.286-.06.582-.326.706-1.168.523-2.673.996-4.133 1.259-.94.17-1.906.276-2.882.327-.923.048-1.85.048-2.772 0-.916-.048-1.832-.148-2.732-.303-1.423-.245-2.894-.688-4.045-1.18-.275-.118-.42-.423-.346-.713l1.198-4.99c.144-.602.662-1.026 1.278-1.026H19.5c.66 0 1.19.462 1.306 1.077Z" />
            </svg>
          </div>
        </div>

        {/* CARD 3: SẢN PHẨM */}
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500 flex items-center justify-between transition hover:-translate-y-1 hover:shadow-md">
          <div>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Tổng sản phẩm</p>
            <p className="text-3xl font-bold text-gray-800 mt-1">
              {stats.total_products}
            </p>
          </div>
          <div className="p-3 bg-purple-100 rounded-full text-purple-600">
            {/* Icon Tag */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.593l6.248-2.128a2.25 2.25 0 0 0 1.246-2.92L19.47 5.24a2.25 2.25 0 0 0-1.815-1.439L10.323 3.03a2.25 2.25 0 0 0-.755-.03Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="m15 10 .75.75m0 0 .75-.75m-.75.75V9" />
            </svg>
          </div>
        </div>

        {/* CARD 4: KHÁCH HÀNG */}
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-orange-500 flex items-center justify-between transition hover:-translate-y-1 hover:shadow-md">
          <div>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Khách hàng</p>
            <p className="text-3xl font-bold text-gray-800 mt-1">
              {stats.total_users}
            </p>
          </div>
          <div className="p-3 bg-orange-100 rounded-full text-orange-600">
            {/* Icon User */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
            </svg>
          </div>
        </div>
      </div>

      {/* KHU VỰC BIỂU ĐỒ HOẶC GHI CHÚ (ĐỂ TRỐNG ĐỂ SAU NÀY PHÁT TRIỂN) */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 min-h-[300px] flex items-center justify-center text-gray-400">
        Khu vực dành cho Biểu đồ tăng trưởng (Sẽ phát triển sau)
      </div>
    </div>
  );
}