"use client";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Image from "next/image";
import { UserProductService } from "@/services/UserProductService";

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("vi-VN").format(amount) + " đ";
};

export default function Header() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  // --- STATE TÌM KIẾM ---
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const loadUser = () => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) setUser(JSON.parse(storedUser));
    };
    loadUser();

    // Tải sản phẩm để search nhanh
    const fetchProducts = async () => {
      try {
        const data = await UserProductService.getAllActive();
        setAllProducts(data);
      } catch (error) {
        console.error("Search error:", error);
      }
    };
    fetchProducts();

    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };

    window.addEventListener("userUpdated", loadUser);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("userUpdated", loadUser);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.trim().length > 0) {
      const filtered = allProducts
        .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 5);
      setSearchResults(filtered);
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    toast.dismiss();
    toast.success("Đăng xuất thành công", { id: "logout-success" });
    setTimeout(() => router.push("/login"), 300);
  };

  const getRankStyle = (spent = 0) => {
    if (spent >= 10000000)
      return {
        border: "border-yellow-400",
        iconColor: "text-yellow-500",
        hasCrown: true,
      };
    if (spent >= 5000000)
      return {
        border: "border-gray-400",
        iconColor: "text-gray-500",
        hasCrown: true,
      };
    return { border: "border-transparent", iconColor: "", hasCrown: false };
  };

  const rankStyle = getRankStyle(user?.total_spent);

  return (
    <header className="sticky top-0 z-[100] bg-white border-b border-gray-100 font-sans shadow-sm">
      <div className="container mx-auto px-4 h-24 flex items-center justify-between gap-6">
        {/* 1. LOGO & BRANDING */}
        <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
          <div className="relative w-12 h-12 overflow-hidden border border-black rounded-full p-1 group-hover:bg-black transition-all flex items-center justify-center">
            <span className="text-xs font-serif font-black group-hover:text-white transition-colors">
              TN
            </span>
          </div>
          <div className="hidden xl:flex flex-col">
            <h1 className="text-xl font-serif font-bold tracking-[0.1em] uppercase leading-none">
              Thúy Nghiệm
            </h1>
            <span className="text-[8px] text-gray-400 font-medium tracking-[0.3em] uppercase mt-1">
              Đẳng cấp thời trang
            </span>
          </div>
        </Link>

        {/* 2. THANH TÌM KIẾM & MENU CHÍNH (GỘP CHUNG GIỮA) */}
        <div className="flex-grow flex items-center gap-8">
          {/* SEARCH BAR */}
          <div className="flex-grow max-w-md relative" ref={searchRef}>
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm sản phẩm..."
                className="w-full bg-gray-50 border border-gray-100 rounded-full px-5 py-2 pl-10 text-[11px] focus:outline-none focus:bg-white focus:border-black transition-all"
                value={searchQuery}
                onChange={handleSearch}
                onFocus={() => searchQuery.trim() && setShowDropdown(true)}
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-3.5 h-3.5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
              </svg>
            </div>

            {/* DROPDOWN KẾT QUẢ */}
            {showDropdown && (
              <div className="absolute top-full left-0 w-full bg-white mt-2 rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                {searchResults.length > 0 ? (
                  <div className="py-2">
                    {searchResults.map((p) => (
                      <Link
                        key={p.id}
                        href={`/products/${p.id}`}
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                      >
                        <div className="relative w-8 h-10 bg-gray-100 rounded flex-shrink-0">
                          <Image
                            src={p.image || "/placeholder.png"}
                            alt={p.name}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        <div className="flex-grow">
                          <h4 className="text-[10px] font-bold text-gray-900 line-clamp-1 uppercase">
                            {p.name}
                          </h4>
                          <div className="flex justify-between items-center mt-0.5">
                            <span className="text-[10px] font-black text-red-600">
                              {formatCurrency(p.sale_price || p.price)}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-gray-400 text-[10px] italic">
                    Không tìm thấy sản phẩm...
                  </div>
                )}
                <Link
                  href="/products"
                  className="block text-center py-2 bg-black text-white text-[9px] font-bold uppercase tracking-widest"
                >
                  Xem tất cả
                </Link>
              </div>
            )}
          </div>

          {/* MENU CHÍNH (GIỮ NGUYÊN) */}
          <nav className="hidden lg:flex gap-6 text-[10px] font-bold uppercase tracking-[0.2em] flex-shrink-0">
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
        </div>

        {/* 3. KHU VỰC CÁ NHÂN & GIỎ HÀNG (GIỮ NGUYÊN) */}
        <div className="flex items-center gap-4 flex-shrink-0">
          {user && user.role === "admin" && (
            <Link
              href="/admin/dashboard"
              className="bg-black text-white px-3 py-1 rounded text-[9px] uppercase font-bold hover:bg-gray-800 transition"
            >
              Quản trị
            </Link>
          )}

          {user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/profile"
                className="flex items-center gap-2 hover:bg-gray-50 p-1.5 rounded-full pr-3 transition border border-transparent hover:border-gray-200"
              >
                <div
                  className={`relative w-8 h-8 rounded-full border-2 ${rankStyle.border} p-[1px]`}
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
                </div>
                <div className="flex flex-col hidden lg:flex">
                  <span className="font-bold text-black text-[10px] leading-tight">
                    {user.name}
                  </span>
                  {rankStyle.hasCrown && (
                    <span
                      className={`text-[8px] font-bold uppercase ${rankStyle.iconColor}`}
                    >
                      {user.total_spent >= 10000000 ? "VIP" : "Loyal"}
                    </span>
                  )}
                </div>
              </Link>
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-red-500 text-[9px] font-bold uppercase ml-2 hidden sm:block tracking-tighter"
              >
                Thoát
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="text-black font-bold hover:text-red-500 uppercase text-[10px] tracking-widest border-b border-black"
            >
              Đăng nhập
            </Link>
          )}

          <button className="text-gray-600 hover:text-black relative group p-1">
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
            <span className="absolute top-0 -right-1 bg-black text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
              0
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
