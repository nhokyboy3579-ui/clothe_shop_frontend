"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Toaster } from 'react-hot-toast'; 

// --- COMPONENTS & SERVICES ---
import Header from "@/components/Header";
import { UserProductService } from "@/services/UserProductService"; 
import { useCart } from "@/context/CartContext"; 

// --- HELPER FORMAT TIỀN ---
const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return '0 đ';
  return new Intl.NumberFormat("vi-VN").format(amount) + " đ";
};

export default function ProductDetailPage() {
  const { id } = useParams();
  const { addToCart } = useCart(); 

  // --- STATE DỮ LIỆU ---
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // State quản lý ảnh (Slideshow)
  const [allImages, setAllImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // State quản lý lựa chọn thuộc tính
  const [selectedAttributes, setSelectedAttributes] = useState({});

  // State Tồn kho (Mặc định total_import = -1 để biết đang tải)
  // status_text sẽ nhận giá trị từ Backend: 'Sắp ra mắt' | 'Ngừng kinh doanh' | 'Hết hàng' | 'Còn hàng'
  const [stockInfo, setStockInfo] = useState({ 
      stock: 0, 
      total_import: -1, 
      status_text: 'Đang tải...' 
  });

  // 1. TẢI DỮ LIỆU (Chạy 1 lần khi có ID)
  useEffect(() => {
    const fetchProductData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        
        // Gọi song song 3 API để tối ưu tốc độ
        const [productData, galleryData, stockData] = await Promise.all([
            UserProductService.getById(id),       // 1. Thông tin chi tiết SP
            UserProductService.getGallery(id),    // 2. Album ảnh
            UserProductService.getInventory(id)   // 3. Tồn kho & Trạng thái nhập hàng
        ]);
        
        setProduct(productData);
        setStockInfo(stockData); 

        // Xử lý gộp ảnh: Ảnh đại diện + Ảnh gallery
        const mainImg = productData.image; 
        const galleryImgs = galleryData.map(item => item.image_url);
        const combinedImages = [mainImg, ...galleryImgs].filter(Boolean); // Loại bỏ null/undefined
        
        setAllImages(combinedImages.length > 0 ? combinedImages : ['https://placehold.co/500x500']);

      } catch (error) {
        console.error("Lỗi tải trang chi tiết:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, [id]);

  // --- LOGIC SLIDESHOW ---
  const handleNextImage = () => setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  const handlePrevImage = () => setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  const handleSelectImage = (index) => setCurrentImageIndex(index);

  // --- LOGIC CHỌN THUỘC TÍNH ---
  const handleSelectAttribute = (attributeName, value) => {
      setSelectedAttributes(prev => ({ ...prev, [attributeName]: value }));
  };

  // --- LOGIC KIỂM TRA ĐIỀU KIỆN MUA HÀNG (QUAN TRỌNG) ---
  const isAddToCartDisabled = useMemo(() => {
      if (!product) return true;
      
      // 1. Nếu trạng thái đặc biệt từ Backend -> Chặn mua
      if (stockInfo.status_text === 'Sắp ra mắt' || stockInfo.status_text === 'Ngừng kinh doanh') {
          return true;
      }

      // 2. Nếu hết hàng thực tế -> Chặn mua
      if (stockInfo.stock <= 0) return true;

      // 3. Nếu chưa chọn đủ thuộc tính (nếu sản phẩm có thuộc tính) -> Chặn mua
      if (!product.attributes || Object.keys(product.attributes).length === 0) return false;
      const requiredKeys = Object.keys(product.attributes); 
      const selectedKeys = Object.keys(selectedAttributes);
      
      // Phải chọn đủ số lượng thuộc tính yêu cầu
      return selectedKeys.length < requiredKeys.length;
  }, [product, selectedAttributes, stockInfo]);

  const handleAddToCart = () => {
      if (isAddToCartDisabled) return;
      
      const productToAdd = {
          id: product.id,
          name: product.name,
          price: product.sale_price || product.price,
          image: product.image,
          slug: product.slug
      };
      
      addToCart(productToAdd, 1, selectedAttributes);
  };

  // --- RENDER GIAO DIỆN ---
  
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
    </div>
  );

  if (!product) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <h2 className="text-2xl font-bold text-gray-800">Không tìm thấy sản phẩm</h2>
        <Link href="/" className="mt-4 text-blue-600 underline">Quay về trang chủ</Link>
    </div>
  );

  // Tính toán hiển thị giá giảm
  const hasSale = product.sale_price && product.sale_price < product.price;
  const discountPercent = product.discount_percent || (hasSale ? Math.round(((product.price - product.sale_price) / product.price) * 100) : 0);

  return (
    <main className="min-h-screen bg-white font-sans text-gray-800 pb-20">
      <Header />
      <Toaster position="top-center" />

      {/* Style animation cho slideshow */}
      <style jsx global>{`
        @keyframes fadeInScale {
          from { opacity: 0.8; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-gallery {
          animation: fadeInScale 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
      `}</style>

      {/* BREADCRUMB */}
      <div className="container mx-auto px-4 py-4 text-sm text-gray-500 border-b border-gray-100 mb-6">
        <Link href="/" className="hover:text-black transition">Trang chủ</Link> / 
        <Link href="/products" className="mx-2 hover:text-black transition">Sản phẩm</Link> / 
        <span className="ml-2 text-black font-medium">{product.name}</span>
      </div>

      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
            
            {/* === CỘT 1: ẢNH SẢN PHẨM === */}
            <div className="lg:col-span-5 flex flex-col gap-6 sticky top-4 h-fit">
                
                {/* Ảnh chính */}
                <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-gray-50 group shadow-sm border border-gray-100">
                    <div key={currentImageIndex} className="relative w-full h-full animate-gallery">
                        <Image 
                            src={allImages[currentImageIndex]} 
                            alt={product.name} 
                            fill 
                            className="object-cover"
                            unoptimized
                            priority
                        />
                    </div>
                    
                    {/* Tem Sale */}
                    {hasSale && (
                        <div className="absolute top-4 left-4 bg-red-600 text-white font-bold text-sm px-3 py-1 rounded-full shadow-lg z-10">
                            -{discountPercent}%
                        </div>
                    )}

                    {/* Nút Next/Prev */}
                    {allImages.length > 1 && (
                        <>
                            <button 
                                onClick={handlePrevImage}
                                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/60 backdrop-blur-md hover:bg-white text-black w-10 h-10 flex items-center justify-center rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all transform hover:scale-110"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
                            </button>
                            <button 
                                onClick={handleNextImage}
                                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/60 backdrop-blur-md hover:bg-white text-black w-10 h-10 flex items-center justify-center rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all transform hover:scale-110"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
                            </button>
                        </>
                    )}
                </div>

                {/* Danh sách Thumbnail */}
                {allImages.length > 1 && (
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide px-1">
                        {allImages.map((img, index) => (
                             <div 
                                key={index}
                                onClick={() => handleSelectImage(index)}
                                className={`
                                    relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 cursor-pointer rounded-lg overflow-hidden transition-all duration-300
                                    ${currentImageIndex === index 
                                        ? 'ring-2 ring-black ring-offset-2 opacity-100 scale-105' 
                                        : 'opacity-60 hover:opacity-100 hover:scale-105'
                                    }
                                `}
                            >
                                <Image src={img} alt={`thumb-${index}`} fill className="object-cover" unoptimized />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* === CỘT 2: THÔNG TIN SẢN PHẨM === */}
            <div className="lg:col-span-7 flex flex-col h-full py-2">
                {product.category_name && (
                    <div className="text-sm text-gray-500 uppercase tracking-widest mb-3 font-semibold">
                        {product.category_name}
                    </div>
                )}

                <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-6 leading-tight">
                    {product.name}
                </h1>

                {/* KHU VỰC GIÁ & TÌNH TRẠNG KHO */}
                <div className="mb-8 border-b border-gray-100 pb-6">
                    <div className="flex justify-between items-end">
                        {/* Giá tiền */}
                        <div>
                            {hasSale ? (
                                <div className="flex items-end gap-4">
                                    <div>
                                        <span className="text-sm text-red-600 font-bold block mb-1">🔥 Đang khuyến mãi</span>
                                        <span className="text-4xl font-bold text-red-600 tracking-tight">
                                            {formatCurrency(product.sale_price)}
                                        </span>
                                    </div>
                                    <div className="pb-1">
                                        <span className="text-sm text-gray-400 block">Giá gốc</span>
                                        <span className="text-xl text-gray-400 line-through font-medium">
                                            {formatCurrency(product.price)}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <span className="text-3xl font-bold text-gray-900">
                                    {formatCurrency(product.price)}
                                </span>
                            )}
                        </div>

                        {/* --- HIỂN THỊ TRẠNG THÁI KHO (CẬP NHẬT MỚI) --- */}
                        <div className="text-right">
                            <p className="text-sm text-gray-500 mb-1">Tình trạng:</p>
                            
                            {/* CASE 1: SẮP RA MẮT (Chưa nhập kho lần nào) */}
                            {stockInfo.status_text === 'Sắp ra mắt' ? (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">
                                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
                                    Sắp ra mắt
                                </span>
                            ) : 
                            /* CASE 2: NGỪNG KINH DOANH (Tất cả phiếu nhập bị ẩn) */
                            stockInfo.status_text === 'Ngừng kinh doanh' ? (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">
                                    <span className="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
                                    Ngừng kinh doanh
                                </span>
                            ) :
                            /* CASE 3: HẾT HÀNG (Đã nhập nhưng bán hết) */
                            stockInfo.stock <= 0 ? (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                                    Hết hàng
                                </span>
                            ) : 
                            /* CASE 4: CÒN HÀNG */
                            (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                    Còn {stockInfo.stock} sản phẩm
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* CHỌN THUỘC TÍNH */}
                {product.attributes && Object.keys(product.attributes).length > 0 && (
                    <div className="space-y-6 mb-8">
                        {Object.entries(product.attributes).map(([attrName, values]) => (
                            <div key={attrName}>
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-bold text-gray-900 text-sm uppercase">{attrName}:</h3>
                                    <span className="text-sm text-gray-500 font-medium bg-gray-100 px-3 py-0.5 rounded-full">
                                        {selectedAttributes[attrName] || 'Chưa chọn'}
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {values.map((val, idx) => {
                                        const isSelected = selectedAttributes[attrName] === val;
                                        return (
                                            <button 
                                                key={idx}
                                                onClick={() => handleSelectAttribute(attrName, val)}
                                                className={`
                                                    min-w-[3.5rem] px-5 py-2.5 border rounded-lg text-sm font-medium transition-all duration-200
                                                    ${isSelected 
                                                        ? 'bg-black text-white border-black shadow-lg transform -translate-y-0.5' 
                                                        : 'bg-white text-gray-700 border-gray-200 hover:border-black hover:text-black'
                                                    }
                                                `}
                                            >
                                                {val}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* NÚT MUA (CẬP NHẬT LOGIC TEXT & DISABLE) */}
                <div className="flex gap-4 mt-auto pt-6 border-t border-gray-100">
                    <button 
                        onClick={handleAddToCart}
                        disabled={isAddToCartDisabled}
                        className={`
                            flex-1 font-bold py-4 rounded-full uppercase tracking-wider transition-all duration-300 shadow-xl
                            ${isAddToCartDisabled 
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200 shadow-none' // Style Disable
                                : 'bg-black text-white hover:bg-gray-800 hover:shadow-2xl hover:-translate-y-1 active:scale-95 cursor-pointer' // Style Active
                            }
                        `}
                    >
                        {/* --- LOGIC HIỂN THỊ CHỮ TRÊN NÚT --- */}
                        {stockInfo.status_text === 'Sắp ra mắt' 
                            ? 'Sắp ra mắt' 
                            : stockInfo.status_text === 'Ngừng kinh doanh' 
                                ? 'Ngừng kinh doanh'
                                : stockInfo.stock <= 0 
                                    ? 'Tạm thời hết hàng' 
                                    : isAddToCartDisabled 
                                        ? `Chọn ${Object.keys(product.attributes || {}).length > 0 ? 'phân loại' : ''}` 
                                        : 'Thêm vào giỏ hàng'
                        }
                    </button>
                </div>

                {/* MÔ TẢ & CHÍNH SÁCH */}
                <div className="mt-10">
                    <h3 className="font-bold text-lg mb-4 border-b pb-2">Mô tả chi tiết</h3>
                    <div 
                        className="prose prose-sm text-gray-600 leading-relaxed max-w-none" 
                        dangerouslySetInnerHTML={{ __html: product.description || "Đang cập nhật..." }} 
                    />
                </div>
            </div>
        </div>
      </div>
    </main>
  );
}