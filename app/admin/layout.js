'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Bảo vệ route Admin: Chỉ cho phép role 'admin' truy cập
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!storedUser || !token) {
      router.push('/login');
      return;
    }

    const user = JSON.parse(storedUser);
    if (user.role !== 'admin') {
      alert('Bạn không có quyền truy cập!');
      router.push('/');
      return;
    }

    setIsAuthorized(true);
  }, []);

  if (!isAuthorized) return null;

  // Cập nhật Menu: Đã thêm mục "Nhập kho"
  const menuItems = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: '📊' },
    { name: 'Sản phẩm', href: '/admin/products', icon: '👗' },
    { name: 'Bài viết', href: '/admin/posts', icon: '📝' },
    // --- MỤC MỚI THÊM ---
    { name: 'Nhập kho', href: '/admin/product-store', icon: '📥' }, 
    // --------------------

    { name: 'Thuộc tính', href: '/admin/attributes', icon:'🏷️'},
    { name: 'Danh mục', href: '/admin/categories', icon: '📂' },
    { name: 'Banner', href: '/admin/banners', icon: '🖼️' },
    { name: 'Sale', href: '/admin/product-sales', icon: '🔥' },
    { name: 'Đơn hàng', href: '/admin/orders', icon: '📦' },
    { name: 'Account', href: '/admin/users', icon: '🛡️' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100 font-sans">
      {/* SIDEBAR CỐ ĐỊNH */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col fixed h-full shadow-xl z-10">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-2xl font-serif font-bold tracking-widest text-center">ADMIN</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive 
                    ? 'bg-red-600 text-white shadow-md' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>{item.icon}</span>
                <span className="font-medium text-sm uppercase tracking-wide">{item.name}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-700">
          <Link href="/" className="block text-center text-xs text-slate-400 hover:text-white">
            ← Quay về trang chủ
          </Link>
        </div>
      </aside>

      {/* NỘI DUNG CHÍNH */}
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}