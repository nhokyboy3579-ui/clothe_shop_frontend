'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  
  // State quản lý mở/đóng menu
  const [expandedMenus, setExpandedMenus] = useState({});

  // --- 1. LOGIC AUTH ---
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
  }, [router]);

  // --- 2. CẤU TRÚC MENU ---
  const menuStructure = [
    {
      type: 'link',
      name: 'Dashboard',
      href: '/admin/dashboard',
      icon: '📊'
    },
    {
      type: 'group',
      id: 'store',
      name: 'Cửa Hàng',
      icon: '🏪',
      children: [
        { name: 'Sản phẩm', href: '/admin/products' },
        { name: 'Thuộc tính', href: '/admin/attributes' },
        { name: 'Danh mục', href: '/admin/categories' },
        { name: 'Khuyến Mại', href: '/admin/product-sales' },
      ]
    },
    {
      type: 'group',
      id: 'finance',
      name: 'Thu / Chi',
      icon: '💰',
      children: [
        { name: 'Đơn hàng', href: '/admin/orders' },
        { name: 'Nhập kho', href: '/admin/product-store' },
      ]
    },
    {
      type: 'group',
      id: 'media',
      name: 'Truyền thông',
      icon: '📢',
      children: [
        { name: 'Bài viết (Post)', href: '/admin/posts' },
        { name: 'Chủ đề (Topic)', href: '/admin/topics' },
        { name: 'Banner', href: '/admin/banners' },
      ]
    },
    {
      type: 'link',
      name: 'Quản lý Account',
      href: '/admin/users',
      icon: '🛡️'
    }
  ];

  // --- 3. TỰ ĐỘNG MỞ MENU KHI RELOAD ---
  useEffect(() => {
    const newExpanded = {};
    menuStructure.forEach(item => {
      if (item.type === 'group' && item.children) {
        const hasActiveChild = item.children.some(child => pathname === child.href);
        if (hasActiveChild) {
          newExpanded[item.id] = true;
        }
      }
    });
    // FIX: Thay thế hoàn toàn state cũ bằng state mới
    // Điều này đảm bảo khi chuyển trang, chỉ menu chứa trang đó mở, các menu khác đóng
    setExpandedMenus(newExpanded);
  }, [pathname]);

  // --- 4. HÀM TOGGLE (SỬA LẠI LOGIC) ---
  const toggleGroup = (id) => {
    setExpandedMenus(prev => {
      // Nếu menu này đang mở -> Bấm vào để đóng lại (trả về object rỗng hoặc đóng hết)
      if (prev[id]) {
        return {};
      }
      
      // Nếu menu này đang đóng -> Bấm vào để mở
      // FIX: Trả về object chỉ chứa key [id]: true. 
      // Các key khác sẽ bị mất (đồng nghĩa với việc đóng các menu khác).
      return { [id]: true };
    });
  };

  if (!isAuthorized) return null;

  return (
    <div className="flex min-h-screen bg-gray-100 font-sans">
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col fixed h-full shadow-xl z-50 overflow-y-auto custom-scrollbar">
        <div className="p-6 border-b border-slate-700 bg-slate-900 sticky top-0 z-10">
          <h1 className="text-2xl font-serif font-bold tracking-widest text-center">ADMIN</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {menuStructure.map((item, index) => {
            // MỤC ĐƠN (LINK)
            if (item.type === 'link') {
              const isActive = pathname === item.href;
              return (
                <Link 
                  key={index}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-medium text-sm uppercase tracking-wide ${
                    isActive 
                      ? 'bg-red-600 text-white shadow-md' 
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              );
            }

            // MỤC NHÓM (GROUP)
            if (item.type === 'group') {
              const isOpen = expandedMenus[item.id]; // Kiểm tra xem có đang mở không
              const hasActiveChild = item.children.some(child => pathname === child.href);

              return (
                <div key={item.id} className="space-y-1">
                  <button
                    onClick={() => toggleGroup(item.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 font-medium text-sm uppercase tracking-wide ${
                        hasActiveChild ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{item.icon}</span>
                      <span>{item.name}</span>
                    </div>
                    <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" 
                        className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>

                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="pl-4 space-y-1 mt-1 border-l-2 border-slate-700 ml-4">
                        {item.children.map((subItem, subIndex) => {
                            const isSubActive = pathname === subItem.href;
                            return (
                                <Link 
                                    key={subIndex}
                                    href={subItem.href}
                                    className={`block px-4 py-2 rounded-md text-sm transition-colors ${
                                        isSubActive 
                                            ? 'text-red-400 font-bold bg-slate-800/50' 
                                            : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
                                    }`}
                                >
                                    {subItem.name}
                                </Link>
                            )
                        })}
                    </div>
                  </div>
                </div>
              );
            }
          })}
        </nav>

        <div className="p-4 border-t border-slate-700 bg-slate-900 sticky bottom-0">
          <Link href="/" className="block text-center text-xs text-slate-400 hover:text-white transition-colors">
            ← Quay về trang chủ
          </Link>
        </div>
      </aside>

      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}