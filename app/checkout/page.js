"use client";
import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import Header from "@/components/Header";
import { OrderService } from "@/services/OrderService";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Image from "next/image";

// --- Components nội bộ (Icons mới) ---
const BankIcon = ({ className = "w-6 h-6" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" />
  </svg>
);

const CODIcon = ({ className = "w-6 h-6" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.25 18.75a60.07 60.07 0 0 1 15.795 2.104c.803.179 1.614-.386 1.884-1.173A12.451 12.451 0 0 0 21.75 14.25c0-1.05-.165-2.052-.465-2.983m-11.666 1.876a39.801 39.801 0 0 1-2.686-.34c-.76-.145-1.488.087-1.748.758-.383 1.05-.983 2.112-1.8 3.102M12.75 18.75H9.75m3.75-9H7.5M12 10.5h.008v.008H12V10.5ZM12 18.75V10.5"
    />
  </svg>
);

export default function CheckoutPage() {
  const { cartItems, totalPrice, clearCart } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // States cho địa chỉ
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [addressData, setAddressData] = useState({
    province: "",
    district: "",
    ward: "",
    detail: "",
  });

  // States cho thông tin khách hàng
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
      .catch(() => toast.error("Không thể tải danh sách tỉnh thành"));
  }, [router]);

  const handleProvinceChange = async (e) => {
    const pCode = e.target.value;
    const pName = provinces.find((p) => p.code == pCode)?.name || "";
    setAddressData({ ...addressData, province: pName, district: "", ward: "" });
    setDistricts([]);
    setWards([]);

    if (pCode) {
      const res = await fetch(
        `https://provinces.open-api.vn/api/p/${pCode}?depth=2`
      );
      const data = await res.json();
      setDistricts(data.districts || []);
    }
  };

  const handleDistrictChange = async (e) => {
    const dCode = e.target.value;
    const dName = districts.find((d) => d.code == dCode)?.name || "";
    setAddressData({ ...addressData, district: dName, ward: "" });
    setWards([]);

    if (dCode) {
      const res = await fetch(
        `https://provinces.open-api.vn/api/d/${dCode}?depth=2`
      );
      const data = await res.json();
      setWards(data.wards || []);
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    if (!addressData.province || !addressData.district || !addressData.ward) {
      return toast.error("Vui lòng chọn đầy đủ địa chỉ giao hàng!");
    }
    if (cartItems.length === 0) {
      return toast.error("Giỏ hàng đang trống!");
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
          price: item.price,
          variant: item.attributes ? JSON.stringify(item.attributes) : null,
        })),
      };

      const res = await OrderService.createOrder(orderPayload);
      const orderId = res?.order_id;

      if (orderId) {
        clearCart();

        if (formData.payment_method === "BANKING") {
          // CHỈNH SỬA: Chuyển hướng sang payment/banking
          toast.success(
            "Đơn hàng đã tạo. Đang chuyển sang thanh toán ngân hàng..."
          );
          router.push(
            `/payment/banking?orderId=${orderId}&amount=${totalPrice}`
          );
        } else {
          toast.success("Đặt hàng thành công!");
          router.push("/checkout/success");
        }
      } else {
        throw new Error("Không nhận được mã đơn hàng từ hệ thống.");
      }
    } catch (error) {
      console.error("Lỗi đặt hàng:", error);
      toast.error(error.message || "Đã xảy ra lỗi khi xử lý đơn hàng!");
    } finally {
      setLoading(false);
    }
  };

  if (!isReady) return null;

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <Header />
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="bg-white p-10 rounded-[3rem] border shadow-sm">
            <h2 className="text-2xl font-serif font-bold mb-8 uppercase italic">
              Thông tin giao hàng
            </h2>
            <form onSubmit={handlePlaceOrder} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <input
                  required
                  placeholder="Họ tên *"
                  className="border-b py-3 outline-none focus:border-black transition-colors"
                  value={formData.customer_name}
                  onChange={(e) =>
                    setFormData({ ...formData, customer_name: e.target.value })
                  }
                />
                <input
                  required
                  type="tel"
                  placeholder="Số điện thoại *"
                  className="border-b py-3 outline-none focus:border-black transition-colors"
                  value={formData.customer_phone}
                  onChange={(e) =>
                    setFormData({ ...formData, customer_phone: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-3 gap-4 text-xs font-bold">
                <select
                  className="border-b py-3 outline-none bg-transparent cursor-pointer"
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
                  className="border-b py-3 outline-none bg-transparent cursor-pointer"
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
                  className="border-b py-3 outline-none bg-transparent cursor-pointer"
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
                placeholder="Địa chỉ cụ thể (Số nhà, tên đường...) *"
                className="w-full border-b py-3 outline-none focus:border-black transition-colors"
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
                  {[
                    { id: "COD", label: "Tiền mặt (COD)", icon: <CODIcon /> },
                    {
                      id: "BANKING",
                      label: "Chuyển khoản Ngân hàng",
                      icon: <BankIcon />,
                    }, // CẬP NHẬT LABEL & ICON
                  ].map((method) => (
                    <label
                      key={method.id}
                      className={`flex-1 border p-5 rounded-3xl cursor-pointer flex flex-col items-center gap-3 transition-all ${
                        formData.payment_method === method.id
                          ? "border-black bg-slate-50 ring-1 ring-black shadow-md"
                          : "border-gray-100 hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="radio"
                        className="hidden"
                        name="payment_method"
                        checked={formData.payment_method === method.id}
                        onChange={() =>
                          setFormData({
                            ...formData,
                            payment_method: method.id,
                          })
                        }
                      />
                      {method.icon}
                      <span
                        className={`text-[10px] font-bold uppercase ${
                          formData.payment_method === method.id
                            ? "text-black"
                            : "text-slate-400"
                        }`}
                      >
                        {method.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                disabled={loading || cartItems.length === 0}
                className="w-full bg-black text-white py-6 rounded-3xl font-bold uppercase text-[10px] tracking-widest hover:bg-slate-800 disabled:bg-slate-300 transition-all active:scale-[0.98] shadow-xl"
              >
                {loading ? "ĐANG XỬ LÝ..." : "XÁC NHẬN ĐẶT HÀNG"}
              </button>
            </form>
          </div>

          <div className="bg-slate-900 rounded-[3rem] p-10 text-white h-fit sticky top-24 shadow-2xl">
            <h3 className="text-[10px] font-bold uppercase text-indigo-400 mb-8 border-l-4 pl-4 italic tracking-widest">
              Đơn hàng của bạn
            </h3>
            <div className="space-y-6 max-h-[350px] overflow-y-auto mb-8 pr-2 custom-scrollbar">
              {cartItems.map((item) => (
                <div
                  key={item.uniqueId}
                  className="flex gap-4 items-center border-b border-white/5 pb-4 last:border-0"
                >
                  <div className="w-14 h-20 relative rounded-xl overflow-hidden bg-white/10 flex-shrink-0">
                    <Image
                      src={item.image || "/placeholder.png"}
                      alt={item.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="flex-grow">
                    <p className="text-xs font-bold italic uppercase line-clamp-1">
                      {item.name}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Số lượng: {item.quantity}
                    </p>
                  </div>
                  <p className="font-bold text-sm">
                    {new Intl.NumberFormat("vi-VN").format(
                      item.price * item.quantity
                    )}{" "}
                    đ
                  </p>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-end border-t border-white/10 pt-8">
              <span className="text-[10px] font-bold uppercase text-indigo-400 tracking-widest">
                Tổng cộng
              </span>
              <span className="text-3xl font-bold italic text-white">
                {new Intl.NumberFormat("vi-VN").format(totalPrice)} đ
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
