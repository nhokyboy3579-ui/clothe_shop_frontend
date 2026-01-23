"use client";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 pt-16 pb-8 font-sans">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          {/* CỘT 1: THƯƠNG HIỆU */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 border-2 border-black rounded-full flex items-center justify-center bg-black text-white">
                <span className="text-[10px] font-black">TN</span>
              </div>
              <span className="text-xl font-serif font-bold tracking-widest uppercase">TN Clothes</span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed">
              Tự hào mang đến những sản phẩm thời trang cao cấp, giúp bạn tự tin và tỏa sáng trong mọi khoảnh khắc.
            </p>
          </div>

          {/* CỘT 2: LIÊN HỆ */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-widest text-black border-b border-gray-100 pb-2">Liên hệ</h4>
            <ul className="text-gray-600 text-sm space-y-3">
              <li className="flex gap-2">
                <span className="font-bold text-black min-w-[70px]">Địa chỉ:</span>
                <span>Số 2, đường 11, phường Hiệp Bình Chánh, Thủ Đức, TP.HCM</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-black min-w-[70px]">Hotline:</span>
                <a href="tel:0813103885" className="hover:text-red-600 transition">0813103885</a>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-black min-w-[70px]">Email:</span>
                <a href="mailto:tnghim910@gmail.com" className="hover:text-red-600 transition">tnghim910@gmail.com</a>
              </li>
            </ul>
          </div>

          {/* CỘT 3: HỖ TRỢ */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-widest text-black border-b border-gray-100 pb-2">Hỗ trợ</h4>
            <ul className="text-gray-600 text-sm space-y-2">
              <li><Link href="/products" className="hover:text-black transition italic">Sản phẩm mới nhất</Link></li>
              <li><Link href="/sale" className="hover:text-red-600 transition italic">Chương trình khuyến mãi</Link></li>
              <li><Link href="/profile" className="hover:text-black transition italic">Theo dõi đơn hàng</Link></li>
              <li><Link href="#" className="hover:text-black transition italic">Chính sách đổi trả</Link></li>
            </ul>
          </div>

          {/* CỘT 4: GIỜ MỞ CỬA */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-widest text-black border-b border-gray-100 pb-2">Giờ mở cửa</h4>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 border-dashed">
              <p className="text-gray-500 text-xs mb-1 uppercase tracking-tighter">Thứ 2 - Chủ Nhật</p>
              <p className="text-xl font-serif font-bold text-black italic">08:00 - 22:00</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
          <p>© 2026 TN CLOTHES. DESIGNED FOR FASHION.</p>
          <div className="flex gap-6">
             <span className="hover:text-black cursor-pointer transition">Facebook</span>
             <span className="hover:text-black cursor-pointer transition">Instagram</span>
             <span className="hover:text-black cursor-pointer transition">TikTok</span>
          </div>
        </div>
      </div>
    </footer>
  );
}