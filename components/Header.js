"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Image from "next/image";

export default function Header() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  // Load user từ localStorage và lắng nghe thay đổi
  useEffect(() => {
    const loadUser = () => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    };
    loadUser();

    // Lắng nghe sự kiện custom để cập nhật Header khi profile hoặc login thay đổi
    window.addEventListener("userUpdated", loadUser);
    return () => window.removeEventListener("userUpdated", loadUser);
  }, []);

  const handleLogout = () => {
    // 1. Xóa dữ liệu phiên làm việc
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);

    // 2. Xóa sạch các thông báo cũ để tránh bị treo giao diện
    toast.dismiss();

    // 3. Hiển thị thông báo thành công với ID cố định
    toast.success("Đăng xuất thành công", {
      id: "logout-success",
      duration: 3000,
    });

    // 4. Chuyển hướng với độ trễ nhỏ để Toast kịp render ổn định
    setTimeout(() => {
      router.push("/login");
    }, 300);
  };

  // --- HÀM TÍNH RANK CHO HEADER ---
  const getRankStyle = (spent = 0) => {
    if (spent >= 10000000) {
      return {
        border: "border-yellow-400",
        iconColor: "text-yellow-500",
        hasCrown: true,
      };
    } else if (spent >= 5000000) {
      return {
        border: "border-gray-400",
        iconColor: "text-gray-500",
        hasCrown: true,
      };
    }
    return {
      border: "border-transparent",
      iconColor: "",
      hasCrown: false,
    };
  };

  const rankStyle = getRankStyle(user?.total_spent);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 font-sans shadow-sm">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        {/* LOGO */}
        <Link
          href="/"
          className="text-2xl md:text-3xl font-serif font-bold tracking-widest uppercase hover:opacity-80 transition"
        >
          Thời Trang Thúy Nghiệm
        </Link>

        {/* MENU CHÍNH */}
        <nav className="hidden md:flex gap-8 text-sm font-medium uppercase tracking-wide">
          <Link href="/" className="hover:text-red-500 transition-colors">
            New Arrival
          </Link>
          <Link
            href="/products"
            className="hover:text-red-500 transition-colors"
          >
            Sản Phẩm
          </Link>
          <Link
            href="/sale"
            className="text-red-600 hover:text-red-800 transition-colors"
          >
            Sale
          </Link>
        </nav>

        {/* KHU VỰC CÁ NHÂN (USER) */}
        <div className="flex items-center gap-4 text-sm">
          {/* NÚT ADMIN (Nếu có quyền) */}
          {user && user.role === "admin" && (
            <Link
              href="/admin/dashboard"
              className="bg-red-600 text-white px-3 py-1 rounded text-xs uppercase font-bold hover:bg-red-800 transition"
            >
              Quản trị
            </Link>
          )}

          {user ? (
            <div className="flex items-center gap-3">
              {/* LINK TỚI PROFILE */}
              <Link
                href="/profile"
                className="flex items-center gap-2 hover:bg-gray-50 p-1.5 rounded-full pr-3 transition border border-transparent hover:border-gray-200"
              >
                {/* AVATAR CONTAINER */}
                <div
                  className={`relative w-9 h-9 rounded-full border-[2px] ${rankStyle.border} p-[1px]`}
                >
                  <Image
                    src={
                      user.full_avatar_url || "https://via.placeholder.com/150"
                    }
                    alt="Avatar"
                    fill
                    className="rounded-full object-cover"
                    unoptimized
                  />

                  {/* VƯƠNG MIỆN RANK */}
                  {rankStyle.hasCrown && (
                    <div
                      className={`absolute -top-1.5 -right-1 bg-white rounded-full p-[1px] shadow-sm ${rankStyle.iconColor}`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-3 h-3"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                <div className="flex flex-col">
                  <span className="font-bold text-black text-xs hidden md:block leading-tight">
                    {user.name || user.username}
                  </span>
                  {rankStyle.hasCrown && (
                    <span
                      className={`text-[9px] font-bold uppercase leading-tight ${rankStyle.iconColor}`}
                    >
                      {user.total_spent >= 10000000 ? "VIP" : "Loyal"}
                    </span>
                  )}
                </div>
              </Link>

              <div className="h-6 w-px bg-gray-300 mx-1 hidden md:block"></div>

              <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-red-500 text-[10px] font-bold uppercase tracking-wider transition-colors"
              >
                Đăng Xuất
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="text-black font-bold hover:text-red-500 uppercase tracking-wider text-xs md:text-sm"
            >
              Đăng nhập
            </Link>
          )}

          {/* GIỎ HÀNG */}
          <button className="text-gray-600 hover:text-black ml-2 relative group">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6 group-hover:scale-110 transition"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 5c.07.286-.06.582-.326.706-1.168.523-2.673.996-4.133 1.259-.94.17-1.906.276-2.882.327-.923.048-1.85.048-2.772 0-.916-.048-1.832-.148-2.732-.303-1.423-.245-2.894-.688-4.045-1.18-.275-.118-.42-.423-.346-.713l1.198-4.99c.144-.602.662-1.026 1.278-1.026H19.5c.66 0 1.19.462 1.306 1.077Z"
              />
            </svg>
            <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
              0
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
