"use client";

import { useCart } from "@/context/CartContext";
import Header from "@/components/Header";
import Link from "next/link";
import Image from "next/image";
import toast, { Toaster } from "react-hot-toast";

export default function CartPage() {
  // Lấy đúng tên biến cartItems từ Context
  const { cartItems, removeFromCart, updateQuantity, totalPrice } = useCart();

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN").format(amount) + " đ";
  };

  // Nếu chưa load xong hoặc mảng rỗng (Tránh lỗi undefined)
  const safeCartItems = cartItems || [];

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <Header />
      <Toaster position="top-center" />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center uppercase tracking-wide">Giỏ hàng của bạn</h1>

        {safeCartItems.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-lg shadow-sm">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Giỏ hàng đang trống</h2>
            <p className="text-gray-500 mb-6">Hãy chọn thêm sản phẩm để mua sắm nhé</p>
            <Link href="/products" className="bg-black text-white px-8 py-3 rounded-full hover:bg-gray-800 transition">
              Tiếp tục mua sắm
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* DANH SÁCH SẢN PHẨM */}
            <div className="lg:w-2/3">
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {/* Header Table (Ẩn trên mobile) */}
                <div className="hidden md:grid grid-cols-12 gap-4 bg-gray-100 p-4 text-sm font-bold text-gray-600 uppercase">
                  <div className="col-span-6">Sản phẩm</div>
                  <div className="col-span-2 text-center">Đơn giá</div>
                  <div className="col-span-2 text-center">Số lượng</div>
                  <div className="col-span-2 text-right">Thành tiền</div>
                </div>

                {/* Items */}
                <div className="divide-y divide-gray-100">
                  {safeCartItems.map((item) => (
                    <div key={item.uniqueId} className="p-4 flex flex-col md:grid md:grid-cols-12 gap-4 items-center">
                      
                      {/* Cột 1: Ảnh & Tên */}
                      <div className="col-span-6 w-full flex gap-4 items-center">
                        <div className="relative w-20 h-24 flex-shrink-0 border rounded bg-gray-50">
                          <Image
                            src={item.image || "https://placehold.co/100"}
                            alt={item.name}
                            fill
                            className="object-cover rounded"
                            unoptimized
                          />
                        </div>
                        <div>
                          <Link href={`/products/${item.id}`} className="font-bold text-gray-800 hover:text-blue-600 line-clamp-1">
                            {item.name}
                          </Link>
                          {/* Hiển thị thuộc tính (Size, Màu) */}
                          <div className="text-sm text-gray-500 mt-1 flex flex-wrap gap-2">
                             {item.attributes && Object.entries(item.attributes).map(([key, val]) => (
                                <span key={key} className="bg-gray-100 px-2 py-0.5 rounded text-xs border">
                                    {key}: {val}
                                </span>
                             ))}
                          </div>
                          <button 
                            onClick={() => removeFromCart(item.uniqueId)}
                            className="text-red-500 text-sm mt-2 hover:underline flex items-center gap-1"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                            Xóa
                          </button>
                        </div>
                      </div>

                      {/* Cột 2: Đơn giá */}
                      <div className="col-span-2 text-center font-medium text-gray-600">
                        {formatCurrency(item.price)}
                      </div>

                      {/* Cột 3: Số lượng */}
                      <div className="col-span-2 flex justify-center">
                        <div className="flex items-center border border-gray-300 rounded-lg">
                          <button 
                            onClick={() => updateQuantity(item.uniqueId, item.quantity - 1)}
                            className="px-3 py-1 hover:bg-gray-100 disabled:opacity-50"
                            disabled={item.quantity <= 1}
                          >
                            -
                          </button>
                          <span className="px-3 py-1 font-bold w-10 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.uniqueId, item.quantity + 1)}
                            className="px-3 py-1 hover:bg-gray-100"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Cột 4: Thành tiền */}
                      <div className="col-span-2 text-right font-bold text-red-600 text-lg">
                        {formatCurrency(item.price * item.quantity)}
                      </div>

                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CỘT TỔNG TIỀN (SIDEBAR) */}
            <div className="lg:w-1/3">
               <div className="bg-white p-6 rounded-xl shadow-sm sticky top-24 border border-gray-100">
                  <h3 className="text-lg font-bold border-b pb-4 mb-4 uppercase">Thông tin đơn hàng</h3>
                  
                  <div className="flex justify-between mb-2 text-gray-600">
                     <span>Tạm tính:</span>
                     <span>{formatCurrency(totalPrice)}</span>
                  </div>
                  <div className="flex justify-between mb-4 text-gray-600">
                     <span>Giảm giá:</span>
                     <span>0 đ</span>
                  </div>
                  
                  <div className="flex justify-between text-xl font-bold text-red-600 border-t pt-4 mb-6">
                     <span>Tổng cộng:</span>
                     <span>{formatCurrency(totalPrice)}</span>
                  </div>

                  <Link href="/checkout" className="block w-full text-center bg-red-600 text-white font-bold py-4 rounded-lg uppercase hover:bg-red-700 shadow-lg hover:shadow-red-500/30 transition-all">
                      Tiến hành thanh toán
                  </Link>

                  <div className="mt-4 text-xs text-center text-gray-400">
                      Phí vận chuyển sẽ được tính tại trang thanh toán.
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}