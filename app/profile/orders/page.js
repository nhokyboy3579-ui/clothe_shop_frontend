"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { OrderService } from "@/services/OrderService";
import Image from "next/image";
import { toast } from "react-hot-toast";

const STATUS_OPTIONS = [
  {
    code: 1,
    name: "Mới / Chờ xác nhận",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
  },
  {
    code: 2,
    name: "Đang xử lý",
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-100",
  },
  {
    code: 3,
    name: "Đang giao hàng",
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    border: "border-indigo-100",
  },
  {
    code: 4,
    name: "Hoàn thành",
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-100",
  },
  {
    code: 5,
    name: "Đã hủy",
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-100",
  },
];

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("vi-VN").format(amount) + " đ";
};

export default function ProfileOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // State mới cho Modal xác nhận hủy
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await OrderService.getMyOrders();
      if (response.status) setOrders(response.data);
    } catch (error) {
      console.error("Lỗi tải đơn hàng:", error);
      toast.error("Không thể tải danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!selectedOrder) return;

    try {
      setIsCancelling(true);
      const response = await OrderService.cancelOrder(selectedOrder.id);

      if (response.status) {
        toast.success("Đã hủy đơn hàng thành công", {
          style: {
            borderRadius: "15px",
            background: "#333",
            color: "#fff",
            fontSize: "12px",
          },
        });
        setShowConfirmCancel(false);
        setSelectedOrder(null);
        fetchOrders();
      }
    } catch (error) {
      toast.error(error.message || "Không thể hủy đơn hàng");
    } finally {
      setIsCancelling(false);
    }
  };

  const getStatus = (statusValue) => {
    return (
      STATUS_OPTIONS.find(
        (s) => s.code === statusValue || s.name === statusValue
      ) || STATUS_OPTIONS[0]
    );
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-black"></div>
      </div>
    );

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <Header />
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-8 font-serif">
          Đơn hàng của tôi
        </h1>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100 text-[10px] uppercase font-bold text-gray-400 tracking-widest">
              <tr>
                <th className="p-6">Mã đơn</th>
                <th className="p-6">Ngày đặt</th>
                <th className="p-6">Trạng thái</th>
                <th className="p-6 text-right">Tổng cộng</th>
                <th className="p-6 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map((order) => {
                const statusInfo = getStatus(order.status);
                return (
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50/30 transition-colors"
                  >
                    <td className="p-6 font-bold">#{order.id}</td>
                    <td className="p-6 text-sm text-gray-400">
                      {new Date(order.created_at).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="p-6">
                      <span
                        className={`text-[10px] font-bold px-3 py-1 rounded-full border shadow-sm ${statusInfo.bg} ${statusInfo.color} ${statusInfo.border}`}
                      >
                        {statusInfo.name}
                      </span>
                    </td>
                    <td className="p-6 text-right font-bold">
                      {formatCurrency(order.total_amount)}
                    </td>
                    <td className="p-6 text-right">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-[10px] font-black uppercase tracking-widest border-b-2 border-black hover:opacity-50 transition-all"
                      >
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CHI TIẾT ĐƠN HÀNG */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-md"
            onClick={() => setSelectedOrder(null)}
          ></div>
          <div className="relative bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b flex justify-between items-center bg-white">
              <div>
                <h2 className="font-bold text-xl tracking-tight">
                  Chi tiết đơn hàng
                </h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                  Mã số: #{selectedOrder.id}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-black hover:text-white transition-all"
              >
                ✕
              </button>
            </div>

            <div className="p-8 overflow-y-auto max-h-[60vh] space-y-8">
              {/* TRẠNG THÁI */}
              <div className="px-2">
                {getStatus(selectedOrder.status).code === 5 ? (
                  <div className="bg-red-50 text-red-500 p-5 rounded-2xl text-center text-[10px] font-black border border-red-100 tracking-[0.2em] uppercase">
                    Đơn hàng đã bị hủy bỏ
                  </div>
                ) : (
                  <div className="flex justify-between relative">
                    <div className="absolute top-4 left-0 w-full h-[1px] bg-gray-100 z-0"></div>
                    {STATUS_OPTIONS.filter((s) => s.code <= 4).map(
                      (step, index) => {
                        const currentCode = getStatus(
                          selectedOrder.status
                        ).code;
                        const isCompleted = currentCode >= step.code;
                        return (
                          <div
                            key={step.code}
                            className="relative z-10 flex flex-col items-center flex-1"
                          >
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border-4 border-white shadow-md transition-all duration-700 ${
                                isCompleted
                                  ? "bg-black text-white scale-110"
                                  : "bg-gray-100 text-gray-300"
                              }`}
                            >
                              {isCompleted ? "✓" : index + 1}
                            </div>
                            <span
                              className={`text-[8px] mt-3 font-bold uppercase tracking-tighter text-center max-w-[60px] ${
                                currentCode === step.code
                                  ? "text-black"
                                  : "text-gray-300"
                              }`}
                            >
                              {step.name.split(" / ")[0]}
                            </span>
                          </div>
                        );
                      }
                    )}
                  </div>
                )}
              </div>

              {/* SẢN PHẨM */}
              <div className="space-y-4">
                <div className="divide-y divide-gray-50 border border-gray-100 rounded-3xl px-6 bg-white shadow-sm">
                  {selectedOrder.details.map((item, idx) => (
                    <div key={idx} className="py-5 flex gap-5 items-center">
                      <div className="relative w-14 h-20 bg-gray-50 rounded-xl overflow-hidden border flex-shrink-0">
                        <Image
                          src={item.product_image}
                          alt={item.product_name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <div className="flex-grow">
                        <h4 className="text-xs font-bold text-gray-900">
                          {item.product_name}
                        </h4>
                        <p className="text-[9px] text-gray-400 mt-1 font-medium uppercase tracking-wider">
                          {item.variant || "Standard"} • Qty: {item.quantity}
                        </p>
                        <p className="text-xs font-black mt-2 text-black">
                          {formatCurrency(item.price)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* NÚT HỦY ĐƠN */}
              {getStatus(selectedOrder.status).code === 1 && (
                <button
                  onClick={() => setShowConfirmCancel(true)}
                  className="w-full py-4 bg-white border-2 border-red-50 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-500 hover:text-white hover:border-red-500 transition-all shadow-sm"
                >
                  Hủy đơn hàng
                </button>
              )}
            </div>

            <div className="p-8 bg-gray-50 border-t flex justify-between items-center">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Tổng cộng
              </span>
              <span className="text-2xl font-black text-black">
                {formatCurrency(selectedOrder.total_amount)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRM MODAL - PHẦN THÔNG BÁO HỦY ĐẸP HƠN */}
      {showConfirmCancel && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !isCancelling && setShowConfirmCancel(false)}
          ></div>
          <div className="relative bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl text-center scale-in-center">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-8 h-8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Xác nhận hủy đơn?
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed mb-8 px-4">
              Bạn có chắc chắn muốn hủy đơn hàng này không? Hành động này không
              thể hoàn tác sau khi thực hiện.
            </p>
            <div className="space-y-3">
              <button
                onClick={handleCancelOrder}
                disabled={isCancelling}
                className="w-full py-4 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all disabled:bg-gray-200"
              >
                {isCancelling ? "Đang xử lý..." : "Xác nhận hủy ngay"}
              </button>
              <button
                onClick={() => setShowConfirmCancel(false)}
                disabled={isCancelling}
                className="w-full py-4 bg-white text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-black transition-all"
              >
                Quay lại
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
