"use client";
import { useEffect, useState } from "react";
import api from "@/services/axios";
import Header from "@/components/Header";
import toast from "react-hot-toast";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingBagIcon,
  CameraIcon,
  CheckBadgeIcon,
} from "@heroicons/react/24/outline";

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/profile");
        setUser(res.data);
        setFormData({
          name: res.data.name,
          email: res.data.email,
          phone: res.data.phone || "",
          password: "",
        });
        setPreviewUrl(res.data.full_avatar_url);
      } catch (error) {
        toast.error("Vui lòng đăng nhập");
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [router]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const details = [];
    if (formData.name !== user.name) {
      details.push({ label: "Họ tên", old: user.name, new: formData.name });
    }
    if (formData.phone !== (user.phone || "")) {
      details.push({
        label: "Số điện thoại",
        old: user.phone || "Trống",
        new: formData.phone,
      });
    }
    if (avatarFile) {
      details.push({ label: "Ảnh đại diện", old: "Ảnh cũ", new: "Ảnh mới" });
    }

    const isChangingPassword = formData.password.length > 0;

    if (details.length === 0 && !isChangingPassword) {
      toast("Bạn chưa thay đổi thông tin nào!", { icon: "ℹ️" });
      return;
    }

    const data = new FormData();
    data.append("_method", "PUT");
    data.append("name", formData.name);
    data.append("email", formData.email);
    if (formData.phone) data.append("phone", formData.phone);
    if (formData.password) data.append("password", formData.password);
    if (avatarFile) data.append("avatar", avatarFile);

    try {
      setLoading(true);
      const res = await api.post("/profile", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast(
        (t) => (
          <div className="relative flex flex-col w-full font-sans tracking-tight leading-relaxed">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="absolute -top-5 -right-5 bg-white/10 hover:bg-white/30 text-white w-9 h-9 rounded-full flex items-center justify-center transition-all border border-white/20 backdrop-blur-md"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <div className="flex items-center gap-3 mb-5 border-b border-white/20 pb-4">
              <span className="text-3xl text-emerald-300">✓</span>
              <p className="text-xl font-black uppercase text-white">
                Cập nhật thành công
              </p>
            </div>

            <div className="space-y-4">
              {details.map((item, index) => (
                <div
                  key={index}
                  className="bg-black/20 p-4 rounded-2xl border border-white/10"
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.1em] text-emerald-300/80 mb-2">
                    {item.label}
                  </p>
                  <div className="flex items-center justify-between text-[15px]">
                    <span className="line-through opacity-40 italic">
                      {item.old}
                    </span>
                    <span className="text-white/30 px-2 font-light">→</span>
                    <span className="font-bold text-white bg-white/5 px-3 py-1 rounded-lg">
                      {item.new}
                    </span>
                  </div>
                </div>
              ))}
              {isChangingPassword && (
                <div className="mt-4 p-5 bg-slate-900/60 rounded-3xl border border-yellow-500/30 text-center ring-1 ring-yellow-500/20">
                  <p className="text-[10px] font-black uppercase text-yellow-400 mb-2">
                    Mật khẩu mới đã đổi thành
                  </p>
                  <p className="text-2xl font-mono font-bold tracking-[0.15em] text-white">
                    {formData.password}
                  </p>
                </div>
              )}
            </div>
          </div>
        ),
        {
          duration: 10000,
          position: "top-center",
          style: {
            minWidth: "500px",
            background: "linear-gradient(to bottom right, #064e3b, #065f46)",
            color: "#fff",
            borderRadius: "32px",
            padding: "28px",
            marginTop: "40px",
            boxShadow: "0 20px 40px -10px rgba(0,0,0,0.4)",
            border: "1px solid rgba(255,255,255,0.1)",
          },
        }
      );

      const updatedUser = res.data.user;
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      window.dispatchEvent(new Event("userUpdated"));
      setFormData((prev) => ({ ...prev, password: "" }));
      setAvatarFile(null);
    } catch (error) {
      const msg = error.response?.data?.errors
        ? Object.values(error.response.data.errors)[0][0]
        : error.response?.data?.message || "Cập nhật thất bại";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const getRankStyle = (spent = 0) => {
    if (spent >= 10000000)
      return {
        borderColor: "border-yellow-400",
        bgBadge: "bg-yellow-400",
        label: "VIP Member",
        hasCrown: true,
      };
    if (spent >= 5000000)
      return {
        borderColor: "border-gray-400",
        bgBadge: "bg-gray-400",
        label: "Loyal Member",
        hasCrown: true,
      };
    return {
      borderColor: "border-white",
      bgBadge: "hidden",
      label: "Member",
      hasCrown: false,
    };
  };

  if (loading && !user)
    return (
      <div className="flex h-screen items-center justify-center font-sans text-lg font-medium">
        Đang tải hồ sơ...
      </div>
    );

  const rankStyle = getRankStyle(user?.total_spent);

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans selection:bg-black selection:text-white">
      <Header />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
          {/* Cover Photo */}
          <div className="bg-slate-900 h-44 relative overflow-hidden">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_2px_2px,_#fff_1px,_transparent_0)] bg-[length:24px_24px]"></div>
          </div>

          <div className="px-10 relative">
            {/* Avatar Section */}
            <div className="absolute -top-20 left-10">
              <div className="relative group">
                <div
                  className={`relative w-40 h-40 rounded-[3.5rem] border-8 border-white bg-white shadow-2xl overflow-hidden transition-all duration-500 group-hover:scale-105`}
                >
                  <Image
                    src={previewUrl || "/default-avatar.png"}
                    alt="Profile"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <div
                    className={`absolute inset-0 border-2 rounded-[3.5rem] ${rankStyle.borderColor} opacity-50`}
                  ></div>
                </div>
                <label className="absolute bottom-1 right-1 bg-black text-white p-3 rounded-2xl cursor-pointer hover:bg-indigo-600 transition-all shadow-xl border-4 border-white active:scale-90">
                  <CameraIcon className="w-5 h-5" />
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            </div>

            {/* User Info Header & Orders Button */}
            <div className="pt-24 pb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-50">
              <div className="ml-4">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                    {user?.name}
                  </h1>
                  {rankStyle.hasCrown && (
                    <CheckBadgeIcon className="w-6 h-6 text-indigo-500" />
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 font-bold tracking-wide">
                    @{user?.username || "user"}
                  </span>
                  <span
                    className={`${rankStyle.bgBadge} text-white text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest shadow-sm`}
                  >
                    {rankStyle.label}
                  </span>
                </div>
              </div>

              {/* NÚT XEM ĐƠN HÀNG MỚI */}
              <Link
                href="/profile/orders"
                className="group flex items-center gap-4 bg-slate-50 hover:bg-black p-2 pr-6 rounded-[2rem] transition-all duration-500 hover:shadow-2xl hover:-translate-y-1"
              >
                <div className="bg-white group-hover:bg-zinc-800 p-3 rounded-full shadow-sm transition-colors">
                  <ShoppingBagIcon className="w-6 h-6 text-black group-hover:text-white" />
                </div>
                <div className="text-left">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-slate-500 transition-colors leading-none mb-1">
                    My Orders
                  </p>
                  <p className="text-xs font-bold text-slate-900 group-hover:text-white transition-colors">
                    Xem đơn hàng
                  </p>
                </div>
              </Link>
            </div>
          </div>

          {/* Form Section */}
          <div className="px-12 py-12">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[11px] font-[800] uppercase tracking-[0.15em] text-slate-400">
                    Họ và Tên
                  </label>
                  <input
                    type="text"
                    className="w-full border-2 border-slate-100 p-5 rounded-3xl focus:border-black transition-all outline-none font-semibold text-slate-800 bg-slate-50/50"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-[800] uppercase tracking-[0.15em] text-slate-400">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    className="w-full border-2 border-slate-100 p-5 rounded-3xl focus:border-black transition-all outline-none font-semibold text-slate-800 bg-slate-50/50"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-[800] uppercase tracking-[0.15em] text-slate-400">
                  Địa chỉ Email
                </label>
                <input
                  type="email"
                  className="w-full border-2 border-slate-50 p-5 rounded-3xl bg-slate-100 text-slate-400 cursor-not-allowed font-semibold shadow-inner"
                  value={formData.email}
                  disabled
                />
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-[800] uppercase tracking-[0.15em] text-slate-900">
                  Mật khẩu mới
                </label>
                <input
                  type="password"
                  className="w-full border-2 border-slate-100 p-5 rounded-3xl focus:border-black transition-all outline-none font-semibold text-slate-800 bg-slate-50/50 placeholder:text-slate-300 placeholder:font-normal"
                  placeholder="Để trống nếu không muốn đổi"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
              </div>

              <div className="flex justify-end pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className={`${
                    loading
                      ? "bg-slate-300"
                      : "bg-black hover:bg-zinc-800 hover:-translate-y-1 hover:shadow-2xl active:scale-95"
                  } text-white px-14 py-6 rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] transition-all`}
                >
                  {loading ? "Đang xử lý..." : "Xác nhận thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
