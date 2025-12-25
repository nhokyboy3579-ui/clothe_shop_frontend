"use client";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useEffect, useState } from "react";

export default function FloatingCartBtn() {
  const { totalItems } = useCart();
  const [isVisible, setIsVisible] = useState(false);

  // Chỉ hiển thị khi client đã load xong (tránh lỗi hydration)
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Logic: Nếu chưa load xong hoặc Giỏ hàng trống -> Ẩn
  if (!isVisible || totalItems === 0) return null;

  return (
    <Link
      href="/cart" // Đường dẫn đến trang giỏ hàng (bạn sẽ tạo sau)
      className="fixed bottom-6 right-6 z-50 group animate-[bounceIn_0.5s_ease-out]"
    >
      {/* Nút tròn chính */}
      <div className="bg-black text-white w-16 h-16 rounded-full flex items-center justify-center shadow-2xl border-2 border-white hover:bg-red-600 transition-colors duration-300 relative">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-8 h-8 group-hover:scale-110 transition-transform"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
          />
        </svg>

        {/* Badge số lượng (Màu đỏ góc trên) */}
        <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-white animate-pulse">
          {totalItems > 99 ? "99+" : totalItems}
        </span>
      </div>
      
      {/* Tooltip chữ "Giỏ hàng" */}
      <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        Xem giỏ hàng
      </div>
    </Link>
  );
}