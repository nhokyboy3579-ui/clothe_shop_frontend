"use client";

import { useEffect, useState, useMemo } from "react";
import Header from "@/components/Header";
import Link from "next/link";
import Image from "next/image";
import Pagination from "@/components/Pagination";
import { UserProductService } from "@/services/UserProductService";

// --- 1. IMPORT SLIDER ---
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

// --- CẤU HÌNH GIÁ (ĐÃ SỬA THÀNH 10 TRIỆU) ---
const MIN_PRICE = 0;
const MAX_PRICE = 5000000; // 10 triệu

// --- HELPER FORMAT ---
const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return '0 đ';
  return new Intl.NumberFormat("vi-VN").format(amount) + " đ";
};

const calculateDiscount = (original, sale) => {
  if (!original || !sale || original <= 0) return 0;
  return Math.round(((original - sale) / original) * 100);
};

export default function ShopPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- BỘ LỌC ---
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortOption, setSortOption] = useState("newest");
  
  // --- STATE GIÁ ---
  const [priceRange, setPriceRange] = useState([MIN_PRICE, MAX_PRICE]); // Giá trị dùng để LỌC
  const [tempPrice, setTempPrice] = useState([MIN_PRICE, MAX_PRICE]);   // Giá trị HIỂN THỊ

  // --- PHÂN TRANG ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; 

  // 1. Tải dữ liệu
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await UserProductService.getAllActive();
        setProducts(data);
        const uniqueCats = [...new Set(data.map(p => p.category_name))].filter(Boolean);
        setCategories(uniqueCats);
      } catch (error) {
        console.error("Lỗi tải trang Shop:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 2. Logic Lọc & Sắp xếp
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(lowerTerm));
    }

    // Category
    if (selectedCategory !== "all") {
      result = result.filter(p => p.category_name === selectedCategory);
    }

    // --- LỌC GIÁ ---
    result = result.filter(p => {
         const realPrice = (p.sale_price && p.sale_price < p.price) ? p.sale_price : p.price;
         return realPrice >= priceRange[0] && realPrice <= priceRange[1];
    });

    // Sort
    switch (sortOption) {
      case "newest": result.sort((a, b) => b.id - a.id); break;
      case "oldest": result.sort((a, b) => a.id - b.id); break;
      case "price_asc": 
        result.sort((a, b) => {
            const pA = (a.sale_price && a.sale_price < a.price) ? a.sale_price : a.price;
            const pB = (b.sale_price && b.sale_price < b.price) ? b.sale_price : b.price;
            return pA - pB;
        });
        break;
      case "price_desc":
        result.sort((a, b) => {
            const pA = (a.sale_price && a.sale_price < a.price) ? a.sale_price : a.price;
            const pB = (b.sale_price && b.sale_price < b.price) ? b.sale_price : b.price;
            return pB - pA;
        });
        break;
    }
    return result;
  }, [products, searchTerm, selectedCategory, priceRange, sortOption]);

  // 3. Phân trang
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedItems = useMemo(() => {
      const start = (currentPage - 1) * itemsPerPage;
      return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage]);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, selectedCategory, priceRange, sortOption]);

  // Xử lý sự kiện Slider
  const handleSliderChange = (value) => {
      setTempPrice(value); 
  };
  
  // FIX LỖI: Đổi tên hàm prop thành onChangeComplete
  const handleSliderChangeComplete = (value) => {
      setPriceRange(value); 
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
    </div>
  );

  return (
    <main className="min-h-screen bg-gray-50 text-gray-800 pb-20">
      <Header />

      {/* BANNER */}
      <div className="bg-white shadow-sm py-12 mb-8 border-b border-gray-100">
        <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-5xl font-serif font-bold text-gray-900 mb-3 tracking-tight">Sản Phẩm Hiện Có</h1>
            <p className="text-gray-500 max-w-lg mx-auto">Tìm kiếm phong cách riêng của bạn.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 flex flex-col lg:flex-row gap-8 items-start">
        
        {/* === SIDEBAR === */}
        <aside className="w-full lg:w-1/4 lg:sticky lg:top-24 z-10 space-y-6 h-fit">
            
            {/* Box 1: Tìm kiếm & Danh mục */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="mb-6">
                    <h3 className="font-bold text-gray-900 mb-3 uppercase text-xs tracking-wider">Tìm kiếm</h3>
                    <div className="relative group">
                        <input 
                            type="text" placeholder="Tên sản phẩm..." 
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 pl-10 text-sm focus:outline-none focus:bg-white focus:border-black transition-colors"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                        </svg>
                    </div>
                </div>

                <div>
                    <h3 className="font-bold text-gray-900 mb-3 uppercase text-xs tracking-wider">Danh mục</h3>
                    <ul className="space-y-1">
                        <li>
                            <button onClick={() => setSelectedCategory("all")} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${selectedCategory === "all" ? "bg-black text-white font-medium" : "text-gray-600 hover:bg-gray-100"}`}>Tất cả</button>
                        </li>
                        {categories.map((cat, index) => (
                            <li key={index}>
                                <button onClick={() => setSelectedCategory(cat)} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${selectedCategory === cat ? "bg-black text-white font-medium" : "text-gray-600 hover:bg-gray-100"}`}>{cat}</button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Box 2: Lọc giá (SLIDER ĐÃ SỬA) */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                     <h3 className="font-bold text-gray-900 uppercase text-xs tracking-wider">Khoảng giá</h3>
                     <button 
                        onClick={() => {
                            setPriceRange([MIN_PRICE, MAX_PRICE]);
                            setTempPrice([MIN_PRICE, MAX_PRICE]);
                        }} 
                        className="text-[10px] text-gray-400 hover:text-red-500 uppercase font-bold"
                     >
                        Reset
                     </button>
                </div>
                
                <div className="px-2 mb-4">
                    <Slider
                        range
                        min={MIN_PRICE}
                        max={MAX_PRICE}
                        step={50000} // Bước nhảy 50k
                        value={tempPrice}
                        onChange={handleSliderChange}
                        onChangeComplete={handleSliderChangeComplete} // FIX WARNING TẠI ĐÂY
                        trackStyle={[{ backgroundColor: 'black', height: 4 }]} 
                        handleStyle={[
                            { borderColor: 'black', backgroundColor: 'white', opacity: 1, width: 18, height: 18, marginTop: -7 },
                            { borderColor: 'black', backgroundColor: 'white', opacity: 1, width: 18, height: 18, marginTop: -7 }
                        ]} 
                        railStyle={{ backgroundColor: '#e5e7eb', height: 4 }} 
                    />
                </div>

                <div className="flex justify-between items-center text-sm font-medium text-gray-700">
                    <span>{formatCurrency(tempPrice[0])}</span>
                    <span>{formatCurrency(tempPrice[1])}</span>
                </div>
            </div>
        </aside>

        {/* === DANH SÁCH SẢN PHẨM === */}
        <div className="w-full lg:w-3/4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 sticky top-0 lg:static z-[5]">
                <p className="text-sm text-gray-500">
                    Tìm thấy <span className="font-bold text-black">{filteredProducts.length}</span> sản phẩm
                </p>
                
                <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600 whitespace-nowrap">Sắp xếp:</label>
                    <div className="relative">
                        <select 
                            className="appearance-none bg-gray-50 border border-gray-200 rounded-lg pl-3 pr-8 py-1.5 text-sm focus:outline-none focus:border-black cursor-pointer font-medium"
                            value={sortOption}
                            onChange={(e) => setSortOption(e.target.value)}
                        >
                            <option value="newest">Mới nhất</option>
                            <option value="oldest">Cũ nhất</option>
                            <option value="price_asc">Giá tăng dần</option>
                            <option value="price_desc">Giá giảm dần</option>
                        </select>
                         <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                    </div>
                </div>
            </div>

            {paginatedItems.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                    {paginatedItems.map((product) => (
                        <ShopProductCard key={product.id} product={product} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                    <div className="text-4xl mb-3">🔍</div>
                    <p className="text-gray-500 italic mb-4">Không tìm thấy sản phẩm nào trong khoảng giá này.</p>
                    <button 
                        onClick={() => {
                            setSearchTerm("");
                            setSelectedCategory("all");
                            setPriceRange([MIN_PRICE, MAX_PRICE]); 
                            setTempPrice([MIN_PRICE, MAX_PRICE]);
                        }}
                        className="text-sm bg-black text-white px-6 py-2 rounded-full hover:bg-gray-800 transition"
                    >
                        Xóa bộ lọc
                    </button>
                </div>
            )}

            {totalPages > 1 && (
                <div className="mt-12 flex justify-center">
                     <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                </div>
            )}
        </div>
      </div>
    </main>
  );
}

// --- CARD SẢN PHẨM ---
function ShopProductCard({ product }) {
    const hasSale = product.sale_price && product.sale_price < product.price;
    const discount = hasSale ? calculateDiscount(product.price, product.sale_price) : 0;
    const imageUrl = product.image || 'https://placehold.co/300x400';

    return (
        <Link href={`/products/${product.id}`} className="group bg-white rounded-xl overflow-hidden border border-transparent hover:border-gray-200 hover:shadow-xl transition-all duration-300 flex flex-col h-full">
            <div className="relative aspect-[3/4] w-full bg-gray-100 overflow-hidden">
                <Image
                    src={imageUrl} alt={product.name} fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized
                />
                {hasSale && (
                    <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm tracking-wide">-{discount}%</div>
                )}
            </div>
            
            <div className="p-4 flex flex-col flex-grow">
                {product.category_name && (
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">{product.category_name}</span>
                )}
                <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-2 group-hover:text-red-600 transition-colors">{product.name}</h3>
                <div className="mt-auto pt-2 flex items-center gap-2">
                    {hasSale ? (
                        <>
                            <span className="font-bold text-red-600 text-base">{formatCurrency(product.sale_price)}</span>
                            <span className="text-gray-300 text-xs line-through">{formatCurrency(product.price)}</span>
                        </>
                    ) : (
                        <span className="font-bold text-gray-900 text-base">{formatCurrency(product.price)}</span>
                    )}
                </div>
            </div>
        </Link>
    );
}