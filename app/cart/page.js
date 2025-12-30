"use client";

import { useCart } from "@/context/CartContext";
import Header from "@/components/Header";
import Link from "next/link";
import Image from "next/image";
import toast, { Toaster } from "react-hot-toast";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

export default function CartPage() {
  const { cartItems, removeFromCart, updateQuantity, totalPrice } = useCart();

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN").format(amount) + " đ";
  };

  /**
   * Logic xử lý khi nhấn nút giảm số lượng
   * Nếu giảm xuống 0, hiển thị thông báo xác nhận với màu sắc nút tùy chỉnh
   */
  const handleDecrease = (item) => {
    const newQty = item.quantity - 1;

    if (newQty === 0) {
      MySwal.fire({
        title: <span className="text-xl font-serif font-bold uppercase tracking-tight">Xóa sản phẩm?</span>,
        html: (
          <p className="text-gray-500 text-sm font-sans">
            Bạn có chắc muốn loại bỏ <b>{item.name}</b> khỏi giỏ hàng không?
          </p>
        ),
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444', // Màu Đỏ cho nút Xóa ngay
        cancelButtonColor: '#22c55e',  // Màu Xanh lá cho nút Quay lại
        confirmButtonText: 'XÓA NGAY',
        cancelButtonText: 'QUAY LẠI',
        reverseButtons: true,
        customClass: {
          popup: 'rounded-[2rem] border-none shadow-2xl font-sans',
          confirmButton: 'rounded-xl px-6 py-3 font-bold text-xs tracking-widest text-white shadow-lg shadow-red-200',
          cancelButton: 'rounded-xl px-6 py-3 font-bold text-xs tracking-widest text-white shadow-lg shadow-green-200'
        }
      }).then((result) => {
        if (result.isConfirmed) {
          removeFromCart(item.uniqueId);
          toast.success("Đã xóa sản phẩm khỏi giỏ hàng");
        }
      });
    } else {
      updateQuantity(item.uniqueId, newQty);
    }
  };

  const safeCartItems = cartItems || [];

  return (
    <main className="min-h-screen bg-gray-50 pb-20 font-sans selection:bg-black selection:text-white">
      <Header />
      <Toaster position="top-center" />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-10 text-center">
            {/* Đổi font tiêu đề chính sang font có chân sang trọng */}
            <h1 className="text-4xl font-serif font-medium text-slate-900 uppercase italic tracking-tighter">Giỏ hàng</h1>
            <p className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-[0.3em] mt-2">Shopping Cart Experience</p>
        </div>

        {safeCartItems.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-[3rem] shadow-sm border border-slate-100 animate-fadeIn font-sans">
            <div className="text-8xl mb-6 opacity-20">🛒</div>
            <h2 className="text-xl font-serif font-bold text-slate-800 mb-2 uppercase tracking-tight">Trống không!</h2>
            <p className="text-slate-400 mb-8 text-sm italic">Có vẻ như bạn chưa chọn được món đồ nào ưng ý.</p>
            <Link href="/products" className="bg-black text-white px-10 py-4 rounded-full font-bold text-xs uppercase tracking-widest hover:scale-105 transition-transform inline-block shadow-xl">
              Khám phá ngay
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-10">
            {/* DANH SÁCH SẢN PHẨM */}
            <div className="lg:w-2/3 space-y-4">
              {safeCartItems.map((item) => (
                <div key={item.uniqueId} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-6 hover:shadow-md transition-shadow font-sans">
                  
                  {/* Ảnh sản phẩm */}
                  <div className="relative w-28 h-36 flex-shrink-0 overflow-hidden rounded-2xl bg-slate-50 border border-slate-100">
                    <Image
                      src={item.image || "https://placehold.co/100"}
                      alt={item.name}
                      fill
                      className="object-cover hover:scale-110 transition-transform duration-700"
                      unoptimized
                    />
                  </div>

                  {/* Thông tin sản phẩm */}
                  <div className="flex-grow w-full">
                    {/* Tên sản phẩm dùng font có chân để tạo cảm giác cao cấp */}
                    <Link href={`/products/${item.id}`} className="text-lg font-serif font-bold text-slate-800 hover:text-indigo-600 transition-colors line-clamp-1 italic tracking-tight">
                      {item.name}
                    </Link>
                    
                    <div className="flex flex-wrap gap-2 mt-2 font-sans">
                       {item.attributes && Object.entries(item.attributes).map(([key, val]) => (
                          <span key={key} className="bg-slate-50 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest text-slate-400 border border-slate-100">
                              {key}: {val}
                          </span>
                       ))}
                    </div>

                    <div className="mt-4 flex items-center justify-between font-sans">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Đơn giá</span>
                            <span className="font-bold text-slate-800">{formatCurrency(item.price)}</span>
                        </div>
                        
                        {/* Bộ tăng giảm số lượng */}
                        <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
                          <button 
                            onClick={() => handleDecrease(item)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg transition-all font-bold text-slate-500 hover:text-red-500"
                          >
                            &minus;
                          </button>
                          <span className="px-4 font-bold text-sm w-10 text-center text-slate-800">
                            {item.quantity}
                          </span>
                          <button 
                            onClick={() => updateQuantity(item.uniqueId, item.quantity + 1)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg transition-all font-bold text-slate-500 hover:text-emerald-500"
                          >
                            +
                          </button>
                        </div>
                    </div>
                  </div>

                  {/* Thành tiền */}
                  <div className="md:border-l md:pl-8 text-center md:text-right min-w-[140px] font-sans">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Thành tiền</span>
                      <span className="text-xl font-bold text-red-600 tracking-tighter">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                  </div>
                </div>
              ))}
            </div>

            {/* SIDEBAR TỔNG KẾT */}
            <div className="lg:w-1/3 font-sans">
               <div className="bg-slate-900 p-8 rounded-[3rem] shadow-2xl sticky top-24 text-white overflow-hidden relative group">
                  <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl"></div>
                  
                  <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-indigo-400 mb-8 border-l-4 border-indigo-400 pl-4 italic font-serif">Hóa đơn dự kiến</h3>
                  
                  <div className="space-y-4 mb-8 font-sans">
                    <div className="flex justify-between text-sm text-slate-400 font-bold uppercase tracking-tighter">
                        <span>Tạm tính</span>
                        <span className="text-white">{formatCurrency(totalPrice)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-400 font-bold uppercase tracking-tighter">
                        <span>Phí vận chuyển</span>
                        <span className="text-emerald-400 italic">Miễn phí</span>
                    </div>
                  </div>

                  <div className="border-t border-white/10 pt-6 mb-8">
                      <div className="flex justify-between items-end font-sans">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Tổng cộng</span>
                          <span className="text-3xl font-bold text-white tracking-tighter">{formatCurrency(totalPrice)}</span>
                      </div>
                  </div>

                  <Link href="/checkout" className="block w-full text-center bg-white text-black font-bold py-5 rounded-[1.5rem] uppercase tracking-[0.2em] text-xs hover:bg-indigo-400 hover:text-white transition-all shadow-xl active:scale-95">
                      Thanh toán ngay &rarr;
                  </Link>
                  
                  <p className="mt-6 text-[9px] text-center text-slate-500 font-bold uppercase tracking-widest italic font-sans">
                    Cam kết bảo mật & an toàn giao dịch
                  </p>
               </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}