"use client";

import { useCart } from "@/context/CartContext";
import Header from "@/components/Header";
import Link from "next/link";
import Image from "next/image";
import toast, { Toaster } from "react-hot-toast";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { useRouter } from "next/navigation";

const MySwal = withReactContent(Swal);

export default function CartPage() {
  const { cartItems, removeFromCart, updateQuantity, totalPrice } = useCart();
  const router = useRouter();

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN").format(amount) + " đ";
  };

  const handleGoToCheckout = () => {
    if (!cartItems || cartItems.length === 0) {
      toast.error("Giỏ hàng của bạn đang trống!");
      return;
    }
    router.push("/checkout");
  };

  const handleDecrease = (item) => {
    const newQty = item.quantity - 1;
    if (newQty === 0) {
      MySwal.fire({
        title: (
          <span className="text-xl font-serif font-bold uppercase tracking-tight">
            Xóa sản phẩm?
          </span>
        ),
        html: (
          <p className="text-gray-500 text-sm font-sans">
            Bạn có chắc muốn loại bỏ <b>{item.name}</b>?
          </p>
        ),
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#22c55e",
        confirmButtonText: "XÓA NGAY",
        cancelButtonText: "QUAY LẠI",
        reverseButtons: true,
      }).then((result) => {
        if (result.isConfirmed) {
          removeFromCart(item.uniqueId);
          toast.success("Đã xóa sản phẩm");
        }
      });
    } else {
      updateQuantity(item.uniqueId, newQty);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 pb-20 font-sans selection:bg-black selection:text-white">
      <Header />
      <Toaster position="top-center" />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-serif font-medium text-slate-900 uppercase italic tracking-tighter">
            Giỏ hàng
          </h1>
          <p className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-[0.3em] mt-2">
            Shopping Cart Experience
          </p>
        </div>

        {!cartItems || cartItems.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-[3rem] shadow-sm border border-slate-100 font-sans">
            <div className="text-8xl mb-6 opacity-20">🛒</div>
            <h2 className="text-xl font-serif font-bold text-slate-800 mb-2 uppercase tracking-tight">
              Trống không!
            </h2>
            <Link
              href="/products"
              className="bg-black text-white px-10 py-4 rounded-full font-bold text-xs uppercase tracking-widest hover:scale-105 transition-transform inline-block shadow-xl"
            >
              Khám phá ngay
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-10">
            <div className="lg:w-2/3 space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item.uniqueId}
                  className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-6 hover:shadow-md transition-shadow font-sans"
                >
                  <div className="relative w-28 h-36 flex-shrink-0 overflow-hidden rounded-2xl bg-slate-50 border border-slate-100">
                    <Image
                      src={item.image || "https://placehold.co/100"}
                      alt={item.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="flex-grow w-full">
                    <Link
                      href={`/products/${item.id}`}
                      className="text-lg font-serif font-bold text-slate-800 hover:text-indigo-600 transition-colors line-clamp-1 italic tracking-tight"
                    >
                      {item.name}
                    </Link>

                    {/* HIỂN THỊ THUỘC TÍNH (SIZE, MÀU...) */}
                    {item.attributes &&
                      Object.keys(item.attributes).length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {Object.entries(item.attributes).map(
                            ([key, value]) => (
                              <span
                                key={key}
                                className="text-[9px] bg-slate-100 text-slate-500 px-2 py-1 rounded-md font-bold uppercase border border-slate-200"
                              >
                                {key}: {value}
                              </span>
                            )
                          )}
                        </div>
                      )}

                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Đơn giá
                        </span>
                        <span className="font-bold text-slate-800">
                          {formatCurrency(item.price)}
                        </span>
                      </div>
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
                          onClick={() =>
                            updateQuantity(item.uniqueId, item.quantity + 1)
                          }
                          className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg transition-all font-bold text-slate-500 hover:text-emerald-500"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="md:border-l md:pl-8 text-center md:text-right min-w-[140px]">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                      Thành tiền
                    </span>
                    <span className="text-xl font-bold text-red-600 tracking-tighter">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="lg:w-1/3 font-sans">
              <div className="bg-slate-900 p-8 rounded-[3rem] shadow-2xl sticky top-24 text-white overflow-hidden relative">
                <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-indigo-400 mb-8 border-l-4 border-indigo-400 pl-4 italic font-serif">
                  Hóa đơn dự kiến
                </h3>
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-sm text-slate-400 font-bold uppercase tracking-tighter">
                    <span>Tạm tính</span>
                    <span className="text-white">
                      {formatCurrency(totalPrice)}
                    </span>
                  </div>
                </div>
                <div className="border-t border-white/10 pt-6 mb-8">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      Tổng cộng
                    </span>
                    <span className="text-3xl font-bold text-white tracking-tighter">
                      {formatCurrency(totalPrice)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleGoToCheckout}
                  className="block w-full text-center bg-white text-black font-bold py-5 rounded-[1.5rem] uppercase tracking-[0.2em] text-xs hover:bg-indigo-400 hover:text-white transition-all shadow-xl active:scale-95"
                >
                  Thanh toán ngay &rarr;
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
