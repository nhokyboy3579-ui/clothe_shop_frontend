"use client";
import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import Header from "@/components/Header";
import { OrderService } from "@/services/OrderService";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import Image from "next/image";

export default function CheckoutPage() {
  const { cartItems, totalPrice, clearCart } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [addressData, setAddressData] = useState({
    province: "",
    district: "",
    ward: "",
    detail: "",
  });

  const [formData, setFormData] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    note: "",
    payment_method: "COD",
  });

  useEffect(() => {
    const token =
      localStorage.getItem("token") || localStorage.getItem("access_token");
    const savedUser = JSON.parse(localStorage.getItem("user") || "null");

    if (!token) {
      toast.error("Vui lòng đăng nhập để thanh toán!");
      router.push("/login");
      return;
    }

    if (savedUser) {
      setFormData((prev) => ({
        ...prev,
        customer_name: savedUser.name || "",
        customer_email: savedUser.email || "",
        customer_phone: savedUser.phone || "",
      }));
    }

    setIsReady(true);

    fetch("https://provinces.open-api.vn/api/p/")
      .then((res) => res.json())
      .then((data) => setProvinces(data))
      .catch(() => console.error("Lỗi tải tỉnh thành"));
  }, [router]);

  const handleProvinceChange = async (e) => {
    const pCode = e.target.value;
    if (!pCode) return;
    const pName = provinces.find((p) => p.code == pCode)?.name || "";
    setAddressData({ ...addressData, province: pName, district: "", ward: "" });

    try {
      const res = await fetch(
        `https://provinces.open-api.vn/api/p/${pCode}?depth=2`
      );
      const data = await res.json();
      setDistricts(data.districts || []);
      setWards([]);
    } catch (err) {
      toast.error("Lỗi kết nối địa chỉ");
    }
  };

  const handleDistrictChange = async (e) => {
    const dCode = e.target.value;
    if (!dCode) return;
    const dName = districts.find((d) => d.code == dCode)?.name || "";
    setAddressData({ ...addressData, district: dName, ward: "" });

    try {
      const res = await fetch(
        `https://provinces.open-api.vn/api/d/${dCode}?depth=2`
      );
      const data = await res.json();
      setWards(data.wards || []);
    } catch (err) {
      toast.error("Lỗi kết nối địa chỉ");
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!addressData.province || !addressData.district || !addressData.ward) {
      return toast.error("Vui lòng chọn đầy đủ địa chỉ!");
    }

    try {
      setLoading(true);
      const fullAddress = `${addressData.detail}, ${addressData.ward}, ${addressData.district}, ${addressData.province}`;

      const orderPayload = {
        ...formData,
        shipping_address: fullAddress,
        cart_items: cartItems.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
          price: item.price, // Gửi giá để làm phương án dự phòng cho backend
          variant: item.attributes ? JSON.stringify(item.attributes) : null,
        })),
      };

      const res = await OrderService.createOrder(orderPayload);

      if (res) {
        toast.success("Đặt hàng thành công!");
        clearCart();
        router.push("/checkout/success");
      }
    } catch (error) {
      const msg = error.response?.data?.message || "Lỗi khi đặt hàng";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isReady) return null;

  return (
    <main className="min-h-screen bg-gray-50 pb-20 font-sans">
      <Header />
      <Toaster position="top-center" />
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* PHẦN FORM NHẬP LIỆU */}
          <div className="bg-white p-10 rounded-[3rem] border shadow-sm">
            <h2 className="text-2xl font-serif font-bold mb-8 italic uppercase tracking-tighter text-slate-800">
              Thông tin giao hàng
            </h2>
            <form onSubmit={handlePlaceOrder} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <input
                  required
                  placeholder="Họ tên *"
                  className="border-b py-3 focus:border-black outline-none transition-all"
                  value={formData.customer_name}
                  onChange={(e) =>
                    setFormData({ ...formData, customer_name: e.target.value })
                  }
                />
                <input
                  required
                  placeholder="Số điện thoại *"
                  className="border-b py-3 focus:border-black outline-none transition-all"
                  value={formData.customer_phone}
                  onChange={(e) =>
                    setFormData({ ...formData, customer_phone: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <select
                  required
                  className="border-b py-3 text-[11px] font-bold outline-none bg-transparent"
                  onChange={handleProvinceChange}
                >
                  <option value="">Tỉnh/Thành</option>
                  {provinces.map((p) => (
                    <option key={p.code} value={p.code}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <select
                  required
                  className="border-b py-3 text-[11px] font-bold outline-none bg-transparent"
                  onChange={handleDistrictChange}
                  disabled={!districts.length}
                >
                  <option value="">Quận/Huyện</option>
                  {districts.map((d) => (
                    <option key={d.code} value={d.code}>
                      {d.name}
                    </option>
                  ))}
                </select>
                <select
                  required
                  className="border-b py-3 text-[11px] font-bold outline-none bg-transparent"
                  disabled={!wards.length}
                  onChange={(e) =>
                    setAddressData({
                      ...addressData,
                      ward: wards.find((w) => w.code == e.target.value)?.name,
                    })
                  }
                >
                  <option value="">Phường/Xã</option>
                  {wards.map((w) => (
                    <option key={w.code} value={w.code}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <input
                required
                placeholder="Địa chỉ cụ thể (Số nhà, đường...) *"
                className="w-full border-b py-3 outline-none focus:border-black transition-all"
                value={addressData.detail}
                onChange={(e) =>
                  setAddressData({ ...addressData, detail: e.target.value })
                }
              />

              <div className="py-4">
                <p className="text-[10px] font-bold uppercase text-slate-400 mb-4 tracking-widest">
                  Phương thức thanh toán
                </p>
                <div className="flex gap-4">
                  {["COD", "BANKING"].map((method) => (
                    <label
                      key={method}
                      className={`flex-1 border p-4 rounded-2xl cursor-pointer transition-all ${
                        formData.payment_method === method
                          ? "border-black bg-slate-50"
                          : "border-gray-100"
                      }`}
                    >
                      <input
                        type="radio"
                        className="hidden"
                        name="payment_method"
                        checked={formData.payment_method === method}
                        onChange={() =>
                          setFormData({ ...formData, payment_method: method })
                        }
                      />
                      <span className="text-[11px] font-bold uppercase block text-center">
                        {method === "COD"
                          ? "Thanh toán khi nhận hàng"
                          : "Chuyển khoản"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                disabled={loading || cartItems.length === 0}
                className="w-full bg-black text-white py-6 rounded-3xl font-bold uppercase text-[10px] tracking-widest hover:bg-indigo-600 transition-all disabled:bg-slate-300 shadow-xl active:scale-[0.98]"
              >
                {loading ? "ĐANG XỬ LÝ..." : "XÁC NHẬN ĐẶT HÀNG"}
              </button>
            </form>
          </div>

          {/* PHẦN TÓM TẮT ĐƠN HÀNG */}
          <div className="bg-slate-900 rounded-[3rem] p-10 text-white h-fit sticky top-24 shadow-2xl">
            <h3 className="text-[10px] font-bold uppercase text-indigo-400 mb-8 border-l-4 pl-4 italic tracking-widest">
              Đơn hàng của bạn
            </h3>
            <div className="space-y-6 max-h-[350px] overflow-y-auto pr-2 mb-8 custom-scrollbar">
              {cartItems.map((item) => (
                <div
                  key={item.uniqueId}
                  className="flex gap-4 items-center border-b border-white/5 pb-4 last:border-0"
                >
                  <div className="w-14 h-20 relative rounded-xl overflow-hidden bg-white/10 flex-shrink-0 border border-white/10">
                    <Image
                      src={item.image || "/placeholder.png"}
                      alt={item.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="flex-grow">
                    <p className="text-xs font-bold italic line-clamp-1 uppercase tracking-tight">
                      {item.name}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Số lượng: {item.quantity}
                    </p>
                    {item.attributes && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {Object.entries(item.attributes).map(([k, v]) => (
                          <span
                            key={k}
                            className="text-[8px] px-2 py-0.5 bg-indigo-500/20 text-indigo-300 font-bold uppercase rounded-full"
                          >
                            {k}: {v}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="font-bold text-sm whitespace-nowrap">
                    {new Intl.NumberFormat("vi-VN").format(
                      item.price * item.quantity
                    )}{" "}
                    đ
                  </p>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-end border-t border-white/10 pt-8">
              <span className="text-[10px] font-bold uppercase text-indigo-400">
                Tổng cộng
              </span>
              <span className="text-3xl font-bold italic tracking-tighter text-white">
                {new Intl.NumberFormat("vi-VN").format(totalPrice)} đ
              </span>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
        }
      `}</style>
    </main>
  );
}
