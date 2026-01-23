"use client";
import { useEffect, useState, useRef } from "react"; // Thêm useRef
import { useSearchParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import { OrderService } from "@/services/OrderService";
import toast from "react-hot-toast";

export default function MomoPaymentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const orderId = searchParams.get("orderId");
  const amount = searchParams.get("amount");
  const memo = `DH${orderId}`;

  const [isPaid, setIsPaid] = useState(false);
  const isPaidRef = useRef(false); // Sử dụng Ref để theo dõi trạng thái thanh toán trong event listener

  const qrUrl = `https://img.vietqr.io/image/970436-1026789702-compact.jpg?amount=${amount}&addInfo=${encodeURIComponent(
    memo
  )}&accountName=THUY%20NGHIEM`;

  // Cập nhật ref mỗi khi isPaid thay đổi
  useEffect(() => {
    isPaidRef.current = isPaid;
  }, [isPaid]);

  useEffect(() => {
    if (!orderId) return;

    const handleCancelOrder = async () => {
      if (!isPaidRef.current) {
        // Đảm bảo URL này khớp với route Laravel của bạn
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/orders/${orderId}/cancel-unpaid`,
          {
            method: "POST",
            keepalive: true, // Giúp request vẫn gửi đi thành công kể cả khi tab đã đóng
          }
        );
      }
    };

    window.addEventListener("beforeunload", handleCancelOrder);

    // --- LOGIC 2: KIỂM TRA TRẠNG THÁI THANH TOÁN (Giữ nguyên cũ) ---
    const interval = setInterval(async () => {
      try {
        const order = await OrderService.getOrderById(orderId);
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

    return () => {
      window.removeEventListener("beforeunload", handleCancelOrder);
      clearInterval(interval);
    };
  }, [orderId, router]);

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-20 flex flex-col items-center">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl max-w-md w-full text-center border">
          <h2 className="text-xl font-bold mb-2 uppercase tracking-tight">
            Thanh toán Chuyển khoản
          </h2>
          <p className="text-gray-500 text-[12px] mb-6 italic text-red-500 font-medium">
            * Lưu ý: Không thoát trang này cho đến khi nhận được thông báo thành
            công. Thoát trang đơn hàng sẽ bị hủy tự động.
          </p>

          <div className="relative w-72 h-72 mx-auto mb-6 border-4 border-slate-50 rounded-2xl overflow-hidden bg-white">
            <img
              src={qrUrl}
              alt="VietQR Code"
              className="w-full h-full object-contain p-2"
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
              Đang chờ xác nhận từ ứng dụng ngân hàng...
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
