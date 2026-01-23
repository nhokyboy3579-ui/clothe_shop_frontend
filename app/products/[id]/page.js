"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Toaster } from "react-hot-toast";

// --- COMPONENTS & SERVICES ---
import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import { UserProductService } from "@/services/UserProductService";
import { useCart } from "@/context/CartContext";

// --- HELPER FORMAT TIỀN ---
const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return "0 đ";
  return new Intl.NumberFormat("vi-VN").format(amount) + " đ";
};

export default function ProductDetailPage() {
  const { id } = useParams();
  const { addToCart } = useCart();

  // --- STATE DỮ LIỆU ---
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]); // State cho sản phẩm liên quan
  const [loading, setLoading] = useState(true);

  // State quản lý ảnh
  const [allImages, setAllImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // State quản lý lựa chọn thuộc tính
  const [selectedAttributes, setSelectedAttributes] = useState({});

  // State Tồn kho
  const [stockInfo, setStockInfo] = useState({
    stock: 0,
    status_text: "Đang tải...",
  });

  // 1. TẢI DỮ LIỆU
  useEffect(() => {
    const fetchProductData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        // Tự động cuộn lên đầu trang khi ID thay đổi (Người dùng click SP liên quan)
        window.scrollTo({ top: 0, behavior: "smooth" });

        // Gọi song song 4 API (Bao gồm API Related Products mới)
        const [productData, galleryData, stockData, relatedData] =
          await Promise.all([
            UserProductService.getById(id),
            UserProductService.getGallery(id),
            UserProductService.getInventory(id),
            UserProductService.getRelated(id), // API từ RelatedProductController mới
          ]);

        setProduct(productData);
        setStockInfo(stockData);
        setRelatedProducts(relatedData || []);

        // Xử lý gộp ảnh: Ảnh đại diện + Ảnh gallery
        const mainImg = productData.image;
        const galleryImgs = galleryData.map((item) => item.image_url);
        const combinedImages = [mainImg, ...galleryImgs].filter(Boolean);

        setAllImages(
          combinedImages.length > 0
            ? combinedImages
            : ["https://placehold.co/500x500"]
        );
        setCurrentImageIndex(0); // Reset ảnh về tấm đầu tiên khi đổi SP
        setSelectedAttributes({}); // Reset thuộc tính khi đổi SP
      } catch (error) {
        console.error("Lỗi tải trang chi tiết:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, [id]);

  // --- LOGIC EVENT ---
  const handleNextImage = () =>
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  const handlePrevImage = () =>
    setCurrentImageIndex(
      (prev) => (prev - 1 + allImages.length) % allImages.length
    );
  const handleSelectImage = (index) => setCurrentImageIndex(index);
  const handleSelectAttribute = (attributeName, value) =>
    setSelectedAttributes((prev) => ({ ...prev, [attributeName]: value }));

  // --- LOGIC KIỂM TRA ĐIỀU KIỆN MUA HÀNG ---
  const isAddToCartDisabled = useMemo(() => {
    if (!product) return true;
    if (
      stockInfo.status_text === "Sắp ra mắt" ||
      stockInfo.status_text === "Ngừng kinh doanh" ||
      stockInfo.stock <= 0
    )
      return true;
    if (!product.attributes || Object.keys(product.attributes).length === 0)
      return false;

    const requiredKeys = Object.keys(product.attributes);
    const selectedKeys = Object.keys(selectedAttributes);
    return selectedKeys.length < requiredKeys.length;
  }, [product, selectedAttributes, stockInfo]);

  const handleAddToCart = () => {
    if (isAddToCartDisabled) return;
    addToCart(product, 1, selectedAttributes);
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );

  if (!product)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white font-sans">
        <h2 className="text-xl font-bold uppercase tracking-widest">
          Sản phẩm không tồn tại
        </h2>
        <Link
          href="/"
          className="mt-4 text-[10px] uppercase border-b border-black pb-1"
        >
          Quay về trang chủ
        </Link>
      </div>
    );

  const hasSale = product.sale_price && product.sale_price < product.price;

  return (
    <main className="min-h-screen bg-white font-sans text-gray-800 pb-20">
      <Header />
      <Toaster position="top-center" />

      {/* BREADCRUMB */}
      <div className="container mx-auto px-4 py-6 text-[10px] uppercase tracking-[0.2em] text-gray-400">
        <Link href="/" className="hover:text-black">
          Trang chủ
        </Link>{" "}
        /
        <Link href="/products" className="mx-2 hover:text-black">
          Sản phẩm
        </Link>{" "}
        /<span className="text-black font-bold">{product.name}</span>
      </div>

      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* === CỘT 1: ẢNH SẢN PHẨM === */}
          <div className="lg:col-span-6 space-y-4">
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-gray-50 border border-gray-100">
              <Image
                src={allImages[currentImageIndex]}
                alt={product.name}
                fill
                className="object-cover"
                unoptimized
                priority
              />
              {hasSale && (
                <div className="absolute top-6 left-6 bg-red-600 text-white font-black text-[10px] px-4 py-1 uppercase tracking-widest">
                  -{product.discount_percent}%
                </div>
              )}
            </div>
            {/* Thumbnails */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {allImages.map((img, index) => (
                <div
                  key={index}
                  onClick={() => handleSelectImage(index)}
                  className={`relative w-20 h-28 flex-shrink-0 cursor-pointer border ${
                    currentImageIndex === index
                      ? "border-black"
                      : "border-transparent"
                  }`}
                >
                  <Image
                    src={img}
                    alt="thumb"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ))}
            </div>
          </div>

          {/* === CỘT 2: THÔNG TIN === */}
          <div className="lg:col-span-6 flex flex-col py-4">
            <h1 className="text-3xl font-serif font-black uppercase tracking-tighter mb-4">
              {product.name}
            </h1>

            <div className="flex items-center gap-6 mb-10 pb-10 border-b border-gray-50">
              {hasSale ? (
                <>
                  <span className="text-3xl font-black text-red-600">
                    {formatCurrency(product.sale_price)}
                  </span>
                  <span className="text-xl text-gray-300 line-through italic">
                    {formatCurrency(product.price)}
                  </span>
                </>
              ) : (
                <span className="text-3xl font-black">
                  {formatCurrency(product.price)}
                </span>
              )}
            </div>

            {/* Attributes */}
            {product.attributes &&
              Object.entries(product.attributes).map(([attrName, values]) => (
                <div key={attrName} className="mb-8">
                  <h3 className="text-[10px] font-black uppercase tracking-widest mb-4">
                    {attrName}
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {values.map((val) => (
                      <button
                        key={val}
                        onClick={() => handleSelectAttribute(attrName, val)}
                        className={`px-6 py-2 text-xs font-bold uppercase tracking-widest border transition-all ${
                          selectedAttributes[attrName] === val
                            ? "bg-black text-white border-black"
                            : "bg-white text-gray-400 border-gray-100 hover:border-black"
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

            {/* Nút mua */}
            <button
              onClick={handleAddToCart}
              disabled={isAddToCartDisabled}
              className={`w-full py-5 font-black uppercase tracking-[0.3em] text-[11px] transition-all shadow-xl mt-8 ${
                isAddToCartDisabled
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-black text-white hover:bg-[#1a1a1a]"
              }`}
            >
              {stockInfo.stock <= 0
                ? "Tạm hết hàng"
                : isAddToCartDisabled
                ? "Vui lòng chọn phân loại"
                : "Thêm vào giỏ hàng"}
            </button>

            {/* Mô tả */}
            <div className="mt-16 pt-10 border-t border-gray-100">
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] mb-6">
                Thông tin chi tiết
              </h4>
              <div
                className="prose prose-sm text-gray-500 leading-relaxed italic"
                dangerouslySetInnerHTML={{
                  __html: product.description || "Đang cập nhật...",
                }}
              />
            </div>
          </div>
        </div>

        {/* === PHẦN SẢN PHẨM LIÊN QUAN === */}
        {relatedProducts.length > 0 && (
          <section className="mt-32 pt-20 border-t border-gray-100">
            <div className="flex flex-col items-center mb-16">
              <h2 className="text-2xl font-serif font-black uppercase tracking-[0.2em]">
                Sản phẩm tương tự
              </h2>
              <div className="w-10 h-[2px] bg-red-600 mt-4"></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
              {relatedProducts.map((item) => (
                <ProductCard
                  key={item.id}
                  product={item}
                  formatCurrency={formatCurrency}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
