"use client";

import { useEffect, useState, useMemo } from "react";
import Header from "@/components/Header";
import Link from "next/link";
import Image from "next/image";
// --- THAY ĐỔI IMPORT Ở ĐÂY ---
import { UserSaleService } from "@/services/UserSaleService"; 

// --- CÁC HÀM HELPER ---
const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return '0 đ';
  return new Intl.NumberFormat("vi-VN").format(amount) + " đ";
};

const calculateDiscount = (original, sale) => {
  if (!original || !sale || original <= 0) return 0;
  return Math.round(((original - sale) / original) * 100);
};

// ================= COMPONENT CHÍNH =================
export default function SalePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState("default");

  // Gọi API thông qua UserSaleService
  useEffect(() => {
    const fetchSales = async () => {
      try {
        setLoading(true);
        // --- SỬ DỤNG SERVICE MỚI ---
        const data = await UserSaleService.getActiveSales();
        setProducts(data);
      } catch (error) {
        console.error("Lỗi tải trang Sale:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, []);

  // Logic Sắp xếp (Giữ nguyên)
  const sortedProducts = useMemo(() => {
    let sorted = [...products];
    if (sortOption === "price_asc") {
        sorted.sort((a, b) => a.price_sale - b.price_sale);
    } else if (sortOption === "price_desc") {
        sorted.sort((a, b) => b.price_sale - a.price_sale);
    }
    return sorted;
  }, [products, sortOption]);

  // UI Loading
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
    </div>
  );

  return (
    <main className="min-h-screen bg-gray-50 font-sans text-gray-800">
      <Header />

      {/* --- HEADER BANNER --- */}
      <div className="bg-gray-900 py-12 text-white text-center shadow-md mb-8">
         <h1 className="text-3xl md:text-4xl font-serif font-bold uppercase tracking-widest mb-3">
            Sản Phẩm Khuyến Mãi
         </h1>
         <p className="text-gray-400 text-sm md:text-base">Cơ hội mua sắm giá tốt nhất</p>
      </div>

      {/* --- THANH ĐIỀU HƯỚNG & LỌC --- */}
      <div className="container mx-auto px-4 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <div className="text-sm text-gray-500">
                <Link href="/" className="hover:text-black">Trang chủ</Link> 
                <span className="mx-2">/</span> 
                <span className="text-black font-semibold">Sale</span>
                <span className="ml-2 text-gray-400">({products.length} sản phẩm)</span>
            </div>

            <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">Sắp xếp:</label>
                <select 
                    className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-black bg-white cursor-pointer"
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                >
                    <option value="default">Mới nhất</option>
                    <option value="price_asc">Giá: Thấp đến Cao</option>
                    <option value="price_desc">Giá: Cao đến Thấp</option>
                </select>
            </div>
        </div>
      </div>

      {/* --- DANH SÁCH SẢN PHẨM --- */}
      <section className="container mx-auto px-4 pb-20">
        {sortedProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {sortedProducts.map((item) => (
                    <SaleCard key={item.id} item={item} />
                ))}
            </div>
        ) : (
            <div className="text-center py-20">
                <p className="text-gray-500 italic">Hiện tại chưa có chương trình khuyến mãi nào.</p>
                <Link href="/" className="mt-4 inline-block text-black border-b border-black pb-0.5 hover:text-gray-600 transition">
                    Về trang chủ
                </Link>
            </div>
        )}
      </section>

      <footer className="bg-white py-10 border-t text-center text-sm text-gray-500 mt-auto">
        &copy; 2025 THỜI TRANG THÚY NGHIỆM. All rights reserved.
      </footer>
    </main>
  );
}

// ================= COMPONENT ITEM =================
function SaleCard({ item }) {
    const imageUrl = item.image || item.thumbnail || 'https://placehold.co/300x400';
    const discount = item.discount_percent || calculateDiscount(item.price_original || item.price, item.price_sale);
    const priceSale = item.price_sale;
    const priceOriginal = item.price_original || item.price;

    return (
        <Link href={`/products/${item.id}`} className="group bg-white rounded-lg overflow-hidden border border-transparent hover:border-gray-200 hover:shadow-lg transition-all duration-300 flex flex-col h-full">
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-gray-100">
                <Image
                    src={imageUrl} alt={item.name} fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    unoptimized
                />
                {discount > 0 && (
                    <div className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2 py-1">
                        -{discount}%
                    </div>
                )}
            </div>
            
            <div className="p-4 flex flex-col flex-grow">
                {item.category_name && (
                    <span className="text-xs text-gray-400 uppercase mb-1 block">{item.category_name}</span>
                )}
                <h3 className="text-base text-gray-900 font-medium line-clamp-2 mb-2 group-hover:text-red-600 transition-colors">
                    {item.name}
                </h3>
                
                <div className="mt-auto pt-2 border-t border-gray-50">
                    <div className="flex items-center gap-3">
                        <span className="text-red-600 font-bold text-lg">{formatCurrency(priceSale)}</span>
                        <span className="text-gray-400 text-sm line-through">{formatCurrency(priceOriginal)}</span>
                    </div>
                </div>
            </div>
        </Link>
    );
}