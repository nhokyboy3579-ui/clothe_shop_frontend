"use client";

import { useEffect, useState, useMemo } from "react";
import ProductCard from "@/components/ProductCard";
import Header from "@/components/Header";
import HomeFooter from "@/components/HomeFooter";
import Link from "next/link";
import Image from "next/image";
import axios from "axios";
import { HomepageService } from "@/services/HomepageService";

const AUTO_PLAY_DELAY = 5000;
const API_URL = "http://localhost:8000/api";

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return "0 đ";
  return new Intl.NumberFormat("vi-VN").format(amount) + " đ";
};

// Hàm bổ trợ tính thời gian cho từng Item
const calculateTimeLeft = (endDateString) => {
  const difference = +new Date(endDateString) - +new Date();
  if (difference <= 0) return null;
  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
};

export default function Home() {
  const [allProducts, setAllProducts] = useState([]);
  const [allBanners, setAllBanners] = useState([]);
  const [flashSales, setFlashSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [homeData, resSales] = await Promise.all([
          HomepageService.getAllData(),
          axios.get(`${API_URL}/products/sale`),
        ]);
        setAllBanners(homeData.banners || []);
        setAllProducts(homeData.products || []);
        const salesData = resSales.data.data || resSales.data || [];
        if (Array.isArray(salesData)) {
          const now = new Date();
          setFlashSales(
            salesData.filter(
              (item) =>
                new Date(item.sale_info?.date_end || item.date_end) > now
            )
          );
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const { latestProducts, slideshows, categoriesWithProducts } = useMemo(() => {
    const slideshows = allBanners.filter((b) => b.position === "slideshow");
    const latestProducts = [...allProducts]
      .sort((a, b) => b.id - a.id)
      .slice(0, 10);
    const categoryMap = {};
    allProducts.forEach((p) => {
      const cat = p.category_name || "Khác";
      if (!categoryMap[cat]) categoryMap[cat] = [];
      if (categoryMap[cat].length < 5) categoryMap[cat].push(p);
    });
    return {
      latestProducts,
      slideshows,
      categoriesWithProducts: Object.keys(categoryMap).map((name) => ({
        name,
        products: categoryMap[name],
      })),
    };
  }, [allProducts, allBanners]);

  if (loading)
    return (
      <div className="min-h-screen bg-white flex items-center justify-center font-bold uppercase tracking-widest text-[10px]">
        TN Clothes Loading...
      </div>
    );

  return (
    <main className="min-h-screen bg-white flex flex-col font-sans">
      <Header />

      {/* 1. HERO SLIDER */}
      <section className="relative w-full h-[60vh] md:h-[80vh] overflow-hidden">
        {slideshows.map((banner, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentBannerIndex ? "opacity-100 z-10" : "opacity-0"
            }`}
          >
            <Image
              src={banner.image}
              alt={banner.name}
              fill
              className="object-cover"
              unoptimized
            />
            <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
              <Link
                href="/products"
                className="bg-white text-black px-12 py-4 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-black hover:text-white transition-all shadow-2xl"
              >
                Discovery
              </Link>
            </div>
          </div>
        ))}
      </section>

      {/* 2. LIMITED OFFERS - NỀN ĐỎ CHUYÊN NGHIỆP */}
      {flashSales.length > 0 && (
        <section className="py-20 bg-[#991b1b]">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-white text-3xl md:text-5xl font-serif italic mb-4 uppercase tracking-tighter">
                Limited Offers
              </h2>
              <p className="text-red-200 text-[10px] uppercase tracking-[0.4em]">
                Đừng bỏ lỡ những thiết kế cuối cùng
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {flashSales.map((item) => (
                <FlashSaleCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 3. NEW ARRIVALS */}
      <section className="py-24 container mx-auto px-4">
        <div className="flex flex-col items-center mb-16">
          <h2 className="text-2xl font-serif uppercase tracking-[0.2em] font-bold mb-3">
            New Arrivals
          </h2>
          <div className="w-12 h-[2px] bg-black"></div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-8">
          {latestProducts.map((product) => (
            <div key={product.id} className="relative">
              <div className="absolute top-4 left-4 z-20 bg-red-600 text-white text-[8px] font-black px-3 py-1 uppercase tracking-widest">
                New
              </div>
              <ProductCard product={product} formatCurrency={formatCurrency} />
            </div>
          ))}
        </div>
      </section>

      {/* 4. CATEGORIES */}
      {categoriesWithProducts.map((cat, idx) => (
        <section key={idx} className="py-20 border-t border-gray-50">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-end mb-12">
              <div>
                <h2 className="text-xl font-serif uppercase tracking-widest font-black">
                  {cat.name}
                </h2>
                <div className="w-8 h-[1px] bg-gray-300 mt-2"></div>
              </div>
              <Link
                href={`/products?category=${encodeURIComponent(cat.name)}`}
                className="text-[10px] font-bold uppercase border-b border-black pb-1 hover:tracking-widest transition-all"
              >
                View All
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-8">
              {cat.products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  formatCurrency={formatCurrency}
                />
              ))}
            </div>
          </div>
        </section>
      ))}

      <HomeFooter />
    </main>
  );
}

// --- COMPONENT CON: CARD FLASH SALE CÓ ĐỒNG HỒ RIÊNG ---
function FlashSaleCard({ item }) {
  const endDate = item.sale_info?.date_end || item.date_end;
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(endDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(endDate));
    }, 1000);
    return () => clearInterval(timer);
  }, [endDate]);

  if (!timeLeft) return null;

  return (
    <div className="bg-white group rounded-sm overflow-hidden flex flex-col h-full shadow-lg hover:shadow-2xl transition-all duration-500 border border-red-900/10">
      {/* Ảnh sản phẩm */}
      <Link
        href={`/products/${item.id}`}
        className="relative aspect-[3/4] overflow-hidden block"
      >
        <Image
          src={item.image || "/placeholder.png"}
          alt={item.name}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-1000"
          unoptimized
        />
        <div className="absolute top-0 right-0 bg-black text-white text-[10px] font-black px-4 py-2 uppercase tracking-tighter">
          -
          {Math.round(
            (((item.price_original || item.price) - item.price_sale) /
              (item.price_original || item.price)) *
              100
          )}
          %
        </div>
      </Link>

      {/* Nội dung và Đồng hồ đếm ngược */}
      <div className="p-5 flex flex-col flex-grow bg-white">
        <h3 className="text-[11px] font-black uppercase text-gray-900 mb-3 tracking-tight line-clamp-1 italic">
          {item.name}
        </h3>

        <div className="flex items-center gap-3 mb-5">
          <span className="text-red-600 font-black text-lg">
            {formatCurrency(item.price_sale)}
          </span>
          <span className="text-gray-400 text-[11px] line-through">
            {formatCurrency(item.price_original || item.price)}
          </span>
        </div>

        {/* Đồng hồ đếm ngược riêng cho từng sản phẩm */}
        <div className="mt-auto pt-4 border-t border-dashed border-gray-100">
          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.2em] mb-3 text-center">
            Kết thúc sau
          </p>
          <div className="grid grid-cols-4 gap-2">
            <TimeBox value={timeLeft.days} unit="D" />
            <TimeBox value={timeLeft.hours} unit="H" />
            <TimeBox value={timeLeft.minutes} unit="M" />
            <TimeBox value={timeLeft.seconds} unit="S" />
          </div>
        </div>
      </div>
    </div>
  );
}

// --- COMPONENT CON: Ô THỜI GIAN ---
function TimeBox({ value, unit }) {
  return (
    <div className="flex flex-col items-center bg-gray-50 rounded py-2 border border-gray-100">
      <span className="text-sm font-black text-gray-900">
        {value < 10 ? `0${value}` : value}
      </span>
      <span className="text-[8px] font-bold text-gray-400">{unit}</span>
    </div>
  );
}
