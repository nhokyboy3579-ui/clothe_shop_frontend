"use client";

import { useEffect, useState, useMemo } from "react";
import ProductCard from "@/components/ProductCard";
import Header from "@/components/Header";
import HomeFooter from "@/components/HomeFooter"; // <--- ĐÃ IMPORT FOOTER
import Link from "next/link";
import Image from "next/image";
import axios from "axios"; 
import { HomepageService } from "@/services/HomepageService";

// --- CẤU HÌNH ---
const AUTO_PLAY_DELAY = 5000;
const API_URL = 'http://localhost:8000/api';

// --- CÁC HÀM HELPER ---
const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return '0 đ';
  return new Intl.NumberFormat("vi-VN").format(amount) + " đ";
};

const calculateDiscount = (original, sale) => {
  if (!original || !sale || original <= 0) return 0;
  return Math.round(((original - sale) / original) * 100);
};

// Hàm tính thời gian còn lại cho đếm ngược
const calculateTimeLeft = (endDateString) => {
    const difference = +new Date(endDateString) - +new Date();
    let timeLeft = {};

    if (difference > 0) {
        timeLeft = {
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((difference / 1000 / 60) % 60),
            seconds: Math.floor((difference / 1000) % 60),
        };
    } else {
        return null; 
    }
    const pad = (n) => (n < 10 ? '0' + n : n);
    return {
        days: pad(timeLeft.days),
        hours: pad(timeLeft.hours),
        minutes: pad(timeLeft.minutes),
        seconds: pad(timeLeft.seconds),
    };
};

// ================= COMPONENT CHÍNH =================
export default function Home() {
  // --- STATE ---
  const [allProducts, setAllProducts] = useState([]);
  const [allBanners, setAllBanners] = useState([]);
  const [flashSales, setFlashSales] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // --- UI STATE ---
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  // --- 1. GỌI API DỮ LIỆU ---
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        const [homeData, resSales] = await Promise.all([
             HomepageService.getAllData(),
             axios.get(`${API_URL}/products/sale`)
        ]);

        setAllBanners(homeData.banners || []);
        setAllProducts(homeData.products || []);

        const salesData = resSales.data.data || resSales.data || [];
        
        if (Array.isArray(salesData)) {
            const now = new Date();
            const validSales = salesData.filter(item => new Date(item.sale_info?.date_end || item.date_end) > now);
            setFlashSales(validSales);
        } else {
             setFlashSales([]);
        }

      } catch (err) {
        console.error("Lỗi tải trang chủ:", err);
        setError("Không thể tải dữ liệu. Vui lòng kiểm tra kết nối.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // --- LOGIC XỬ LÝ (Banner, Sản phẩm mới) ---
  const { latestProducts, slideshows } = useMemo(() => {
      const slideshows = allBanners.filter((b) => b.position === "slideshow");
      const sortedProducts = [...allProducts].sort((a, b) => b.id - a.id);

      // --- Lấy 10 sản phẩm mới nhất ---
      const latestProducts = sortedProducts.slice(0, 10);

      return { latestProducts, slideshows };
    }, [allProducts, allBanners]);

  // Auto-play Banner
  useEffect(() => {
    if (slideshows.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % slideshows.length);
    }, AUTO_PLAY_DELAY);
    return () => clearInterval(interval);
  }, [slideshows.length]);

  const handleNextBanner = () => slideshows.length > 0 && setCurrentBannerIndex((prev) => (prev + 1) % slideshows.length);
  const handlePrevBanner = () => slideshows.length > 0 && setCurrentBannerIndex((prev) => (prev - 1 + slideshows.length) % slideshows.length);

  // --- RENDER GIAO DIỆN ---
  if (loading) return (
      <div className="min-h-screen bg-white flex items-center justify-center container mx-auto">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
  );

  if (error) return (
      <div className="min-h-screen bg-white flex items-center justify-center container mx-auto text-red-500 font-bold">{error}</div>
  );

  return (
    <main className="min-h-screen bg-white flex flex-col">
      <Header />

      {/* ================= 1. BANNER SLIDER ================= */}
      <section className="relative w-full h-[400px] md:h-[600px] flex items-center justify-center mb-10 overflow-hidden group">
        {slideshows.length > 0 ? (
          <div className="relative w-full h-full">
            <div
              className="absolute inset-0 flex transition-transform duration-700 ease-in-out"
              style={{
                transform: `translateX(-${currentBannerIndex * (100 / slideshows.length)}%)`,
                width: `${slideshows.length * 100}%`,
              }}
            >
              {slideshows.map((banner, index) => (
                <div key={index} className="relative flex-shrink-0 w-full h-full" style={{ width: `${100 / slideshows.length}%` }}>
                    <Image 
                        src={banner.image} alt={banner.name} fill 
                        className="object-cover" priority={index === 0} unoptimized
                    />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <div className="text-center p-8">
                      <h2 className="text-4xl md:text-6xl font-serif mb-6 text-white uppercase drop-shadow-lg opacity-0 animate-[fadeInUp_1s_ease-out_forwards]">
                        {banner.name}
                      </h2>
                      <Link
                        href={banner.link || "/products"}
                        className="bg-white text-black px-8 py-3 text-sm uppercase tracking-widest hover:bg-black hover:text-white transition duration-300 transform hover:scale-105 inline-block shadow-lg"
                      >
                        Xem ngay
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Nút điều hướng */}
            {slideshows.length > 1 && (
                <>
                  <button onClick={handlePrevBanner} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/30 hover:bg-white text-black rounded-full transition opacity-0 group-hover:opacity-100">&#10094;</button>
                  <button onClick={handleNextBanner} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/30 hover:bg-white text-black rounded-full transition opacity-0 group-hover:opacity-100">&#10095;</button>
                </>
            )}
          </div>
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">Loading Banner...</div>
        )}
      </section>

      {/* ================= 2. FLASH SALE SECTION ================= */}
      {flashSales.length > 0 && (
        <section className="container mx-auto px-4 mb-16">
            <div className="bg-gradient-to-r from-red-600 to-orange-500 rounded-t-lg p-4 flex flex-col md:flex-row items-center justify-between shadow-lg text-white gap-2">
                <div className="flex items-center gap-2">
                    <span className="text-3xl animate-pulse">⚡</span>
                    <h2 className="text-xl md:text-2xl font-bold uppercase italic tracking-wider">FLASH SALE</h2>
                </div>
                <div className="text-sm font-bold bg-white/20 px-4 py-1.5 rounded-full flex items-center gap-1">
                    Nhanh tay kẻo lỡ!
                </div>
            </div>

            <div className="border border-red-200 border-t-0 bg-red-50 p-4 md:p-6 rounded-b-lg shadow-sm">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {flashSales.map((item) => (
                        <FlashSaleItemWithTimer key={item.id} item={item} />
                    ))}
                </div>
            </div>
        </section>
      )}

      {/* ================= 3. SẢN PHẨM MỚI (Hiện 10 sản phẩm) ================= */}
      <section className="container mx-auto px-4 mb-10 flex-grow">
        <div className="flex items-center justify-between mb-8 border-b pb-4">
             <div className="flex flex-col">
                <h2 className="text-2xl font-serif uppercase tracking-widest text-gray-900">Sản Phẩm Mới</h2>
                <span className="text-gray-500 text-sm mt-1">Cập nhật xu hướng mới nhất</span>
             </div>
             <Link href="/products" className="text-sm font-bold border-b border-black pb-0.5 hover:text-gray-600 transition">
                Xem tất cả
             </Link>
        </div>

        {latestProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {latestProducts.map((product) => (
              <ProductCard key={product.id} product={product} formatCurrency={formatCurrency} />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 italic py-10">Không có sản phẩm mới.</p>
        )}
      </section>

      {/* ================= 4. FOOTER RIÊNG CHO HOME ================= */}
      <HomeFooter /> 
      
    </main>
  );
}

// ================= COMPONENT CON: ITEM FLASH SALE =================
function FlashSaleItemWithTimer({ item }) {
    const endDate = item.sale_info?.date_end || item.date_end;
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(endDate));

    useEffect(() => {
        const timer = setInterval(() => {
            const newTime = calculateTimeLeft(endDate);
            setTimeLeft(newTime);
            if (!newTime) clearInterval(timer);
        }, 1000);
        return () => clearInterval(timer);
    }, [endDate]);

    if (!timeLeft) return null; 

    const imageUrl = item.image || item.thumbnail || 'https://placehold.co/300x400';
    const discount = item.discount_percent || calculateDiscount(item.price_original || item.price, item.price_sale);
    const priceSale = item.price_sale;
    const priceOriginal = item.price_original || item.price;

    return (
        <Link href={`/products/${item.id}`} className="group bg-white rounded-lg shadow-sm hover:shadow-xl transition-all overflow-hidden border border-transparent hover:border-red-500 flex flex-col h-full">
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-gray-100">
                <Image
                    src={imageUrl} alt={item.name} fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                    unoptimized
                />
                {discount > 0 && (
                    <div className="absolute top-2 right-2 bg-yellow-400 text-red-800 text-xs font-bold px-2 py-1 rounded shadow-md z-10">
                        -{discount}%
                    </div>
                )}
            </div>
            
            <div className="p-3 flex flex-col flex-grow justify-between">
                <div>
                    <h3 className="text-sm text-gray-800 font-medium line-clamp-2 min-h-[40px] group-hover:text-red-600 transition-colors mb-2">
                        {item.name}
                    </h3>
                    <div className="flex flex-wrap items-end gap-2">
                        <span className="text-red-600 font-bold text-lg">{formatCurrency(priceSale)}</span>
                        <span className="text-gray-400 text-xs line-through mb-1">{formatCurrency(priceOriginal)}</span>
                    </div>
                </div>

                {/* ĐỒNG HỒ ĐẾM NGƯỢC */}
                <div className="mt-3 pt-3 border-t border-dashed border-gray-200">
                    <div className="text-[10px] text-center text-gray-500 uppercase font-semibold mb-1">Kết thúc trong</div>
                    <div className="flex justify-center gap-1 text-xs font-bold text-white">
                        {parseInt(timeLeft.days) > 0 && (
                            <span className="bg-gray-800 rounded px-1.5 py-0.5 min-w-[22px] text-center">{timeLeft.days}d</span>
                        )}
                        <span className="bg-red-600 rounded px-1.5 py-0.5 min-w-[22px] text-center">{timeLeft.hours}</span>
                        <span className="text-red-600 font-bold">:</span>
                        <span className="bg-red-600 rounded px-1.5 py-0.5 min-w-[22px] text-center">{timeLeft.minutes}</span>
                        <span className="text-red-600 font-bold">:</span>
                        <span className="bg-red-600 rounded px-1.5 py-0.5 min-w-[22px] text-center">{timeLeft.seconds}</span>
                    </div>
                    <div className="mt-2 w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-red-500 to-orange-400 w-[75%]"></div>
                    </div>
                </div>
            </div>
        </Link>
    );
}