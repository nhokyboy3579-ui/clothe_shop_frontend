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

  // --- STATE ---
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [allImages, setAllImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedAttributes, setSelectedAttributes] = useState({});

  // 1. TẢI DỮ LIỆU
  useEffect(() => {
    const fetchProductData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const [productData, galleryData] = await Promise.all([
            UserProductService.getById(id),
            UserProductService.getGallery(id)
        ]);
        
        setProduct(productData);

        const mainImg = productData.image; 
        const galleryImgs = galleryData.map(item => item.image_url);
        const combinedImages = [mainImg, ...galleryImgs].filter(Boolean);
        
        setAllImages(combinedImages.length > 0 ? combinedImages : ['https://placehold.co/500x500']);

      } catch (error) {
        console.error("Lỗi tải chi tiết sản phẩm:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, [id]);

  // --- LOGIC SLIDESHOW ---
  const handleNextImage = () => {
      setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const handlePrevImage = () => {
      setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const handleSelectImage = (index) => {
      setCurrentImageIndex(index);
  };

  // --- LOGIC CART ---
  const handleSelectAttribute = (attributeName, value) => {
      setSelectedAttributes(prev => ({ ...prev, [attributeName]: value }));
  };

  const isAddToCartDisabled = useMemo(() => {
      if (!product) return true;
      if (!product.attributes || Object.keys(product.attributes).length === 0) return false;
      const requiredKeys = Object.keys(product.attributes); 
      const selectedKeys = Object.keys(selectedAttributes);
      return selectedKeys.length < requiredKeys.length;
  }, [product, selectedAttributes]);

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

  // --- RENDER ---
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

  const hasSale = product.sale_price && product.sale_price < product.price;
  const discountPercent = product.discount_percent || (hasSale ? Math.round(((product.price - product.sale_price) / product.price) * 100) : 0);

  return (
    <main className="min-h-screen bg-white font-sans text-gray-800 pb-20">
      <Header />
      <Toaster position="top-center" />

      {/* --- CSS ANIMATION CUSTOM --- */}
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
        {/* THAY ĐỔI TẠI ĐÂY: 
            Dùng grid-cols-12. 
            Ảnh chiếm 5 phần (lg:col-span-5) ~ 41%.
            Nội dung chiếm 7 phần (lg:col-span-7) ~ 59%.
            Thêm gap-12 để thoáng hơn.
        */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
            
            {/* === CỘT 1: SLIDESHOW HÌNH ẢNH (Nhỏ lại) === */}
            <div className="lg:col-span-5 flex flex-col gap-6 sticky top-4 h-fit">
                
                {/* ẢNH CHÍNH */}
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
                                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/60 backdrop-blur-md hover:bg-white text-black w-10 h-10 flex items-center justify-center rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 transform hover:scale-110"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
                            </button>
                            <button 
                                onClick={handleNextImage}
                                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/60 backdrop-blur-md hover:bg-white text-black w-10 h-10 flex items-center justify-center rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 transform hover:scale-110"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
                            </button>
                        </>
                    )}
                </div>

                {/* THUMBNAIL LIST */}
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

            {/* === CỘT 2: THÔNG TIN SẢN PHẨM (Rộng hơn) === */}
            <div className="lg:col-span-7 flex flex-col h-full py-2">
                {product.category_name && (
                    <div className="text-sm text-gray-500 uppercase tracking-widest mb-3 font-semibold">
                        {product.category_name}
                    </div>
                )}

                <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-6 leading-tight">
                    {product.name}
                </h1>

                {/* GIÁ */}
                <div className="mb-8 border-b border-gray-100 pb-6">
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

                {/* NÚT MUA */}
                <div className="flex gap-4 mt-auto pt-6 border-t border-gray-100">
                    <button 
                        onClick={handleAddToCart}
                        disabled={isAddToCartDisabled}
                        className={`
                            flex-1 font-bold py-4 rounded-full uppercase tracking-wider transition-all duration-300 shadow-xl
                            ${isAddToCartDisabled 
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                                : 'bg-black text-white hover:bg-gray-800 hover:shadow-2xl hover:-translate-y-1 active:scale-95 cursor-pointer'
                            }
                        `}
                    >
                        {isAddToCartDisabled 
                            ? `Chọn ${Object.keys(product.attributes || {}).length > 0 ? 'phân loại' : ''}` 
                            : 'Thêm vào giỏ'
                        }
                    </button>
                </div>

                {/* MÔ TẢ */}
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