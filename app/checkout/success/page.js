"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import { CheckCircleIcon, ShoppingBagIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import confetti from "canvas-confetti";

export default function SuccessPage() {
  const [orderId, setOrderId] = useState(null);

  useEffect(() => {
    // Hiệu ứng pháo hoa chúc mừng
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-white font-sans">
      <Header />
      
      <div className="container mx-auto px-4 pt-20 pb-32 flex flex-col items-center">
        {/* Biểu tượng thành công */}
        <div className="relative mb-10">
          <div className="absolute inset-0 bg-green-100 scale-150 rounded-full blur-3xl opacity-50 animate-pulse"></div>
          <div className="relative bg-black text-white p-6 rounded-full shadow-2xl">
            <CheckCircleIcon className="w-16 h-16 stroke-[1.5]" />
          </div>
        </div>

        {/* Nội dung thông báo */}
        <div className="text-center max-w-2xl space-y-6">
          <h1 className="text-5xl md:text-6xl font-serif font-bold italic tracking-tighter uppercase">
            Cảm ơn bạn đã <br />
            <span className="text-indigo-600">đặt hàng!</span>
          </h1>
          
          <p className="text-zinc-500 text-lg leading-relaxed px-10">
            Đơn hàng của bạn đã được tiếp nhận và đang trong trạng thái 
            <span className="font-bold text-black"> Chờ xử lý</span>. 
            Chúng tôi sẽ sớm liên hệ với bạn để xác nhận thông tin giao hàng.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4 pt-8">
            <Link 
              href="/account/orders"
              className="group flex items-center gap-3 bg-black text-white px-8 py-5 rounded-full font-bold uppercase text-[10px] tracking-[0.2em] hover:bg-zinc-800 transition-all active:scale-95"
            >
              <ShoppingBagIcon className="w-5 h-5" />
              Xem đơn hàng của tôi
            </Link>
            
            <Link 
              href="/products"
              className="group flex items-center gap-3 bg-zinc-100 text-black px-8 py-5 rounded-full font-bold uppercase text-[10px] tracking-[0.2em] hover:bg-zinc-200 transition-all active:scale-95"
            >
              Tiếp tục mua sắm
              <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Thông tin hỗ trợ */}
        <div className="mt-20 pt-10 border-t border-zinc-100 w-full max-w-md text-center">
          <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest mb-4">
            Bạn cần hỗ trợ nhanh?
          </p>
          <div className="flex justify-center gap-8">
            <a href="tel:0123456789" className="text-sm font-bold hover:text-indigo-600 transition-colors">
              Hotline: 1900xxxx
            </a>
            <a href="mailto:support@store.com" className="text-sm font-bold hover:text-indigo-600 transition-colors">
              Email: support@domain.com
            </a>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .container {
          animation: fade-in-up 0.8s ease-out forwards;
        }
      `}</style>
    </main>
  );
}