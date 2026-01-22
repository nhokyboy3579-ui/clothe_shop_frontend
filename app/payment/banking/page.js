"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import { OrderService } from "@/services/OrderService";
import toast from "react-hot-toast";

export default function MomoPaymentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const orderId = searchParams.get("orderId");
  const amount = searchParams.get("amount");
  const myPhone = "9704229201697779848";
  const memo = `DH${orderId}`;

  const [isPaid, setIsPaid] = useState(false);

  // SỬA TẠI ĐÂY: Sử dụng endpoint img.vietqr.io để đảm bảo hiển thị ảnh 100%
  // Thay đổi dòng qrUrl cũ bằng dòng này:
  const qrUrl = `https://img.vietqr.io/image/970422-${myPhone}-compact.jpg?amount=${amount}&addInfo=${encodeURIComponent(memo)}&accountName=THUY%20NGHIEM`;

  useEffect(() => {
    if (!orderId) return;

    const interval = setInterval(async () => {
      try {
        const order = await OrderService.getOrderById(orderId);
        // Kiểm tra trạng thái từ model Order: Mới (1), Đang xử lý (2)
        if (order && (order.payment_status === "Paid" || order.status === 2)) {
          setIsPaid(true);
          toast.success("Hệ thống đã nhận được tiền!");
          clearInterval(interval);
          setTimeout(() => {
            router.push("/checkout/success");
          }, 2000);
        }
      } catch (error) {
        console.error("Đang đợi thanh toán...");
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [orderId, router]);

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-20 flex flex-col items-center">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl max-w-md w-full text-center border">
          <h2 className="text-xl font-bold mb-2 uppercase tracking-tight">
            Thanh toán qua MoMo
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            Quét mã QR dưới đây để hoàn tất đơn hàng
          </p>

          <div className="relative w-72 h-72 mx-auto mb-6 border-4 border-slate-50 rounded-2xl overflow-hidden bg-white">
            {/* Thêm unoptimized hoặc dùng thẻ img thuần để tránh lỗi loading ảnh */}
            <img
              src={qrUrl}
              alt="Momo QR Code"
              className="w-full h-full object-contain p-2"
              onError={(e) => {
                e.target.src = `https://quickchart.io/qr?text=momo://pay?phone=${myPhone}&amount=${amount}&note=${memo}`;
              }}
            />
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl mb-6 text-left space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Số tiền:</span>
              <span className="font-bold text-red-600">
                {new Intl.NumberFormat("vi-VN").format(amount)} đ
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Nội dung:</span>
              <span className="font-bold text-blue-600 uppercase">{memo}</span>
            </div>
          </div>

          {isPaid ? (
            <div className="flex items-center justify-center gap-2 text-green-600 font-bold">
              <span className="animate-bounce">
                ✅ ĐÃ THANH TOÁN THÀNH CÔNG
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 text-slate-400 text-sm italic">
              <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
              Đang chờ xác nhận từ ứng dụng...
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
