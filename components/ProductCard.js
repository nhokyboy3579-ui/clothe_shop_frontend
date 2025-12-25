'use client';
import Image from 'next/image';
import Link from 'next/link';

export default function ProductCard({ product }) {
  // 1. Helper Format tiền tệ
  const formatPrice = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  // 2. Logic Kiểm tra trạng thái Sale
  const sale = product.sale;
  const now = new Date();
  
  let isSaleActive = false; // Đang diễn ra
  let isUpcoming = false;   // Sắp diễn ra

  if (sale && String(sale.status) === '1') { // Đảm bảo so sánh đúng kiểu dữ liệu status
    const start = new Date(sale.date_begin);
    const end = new Date(sale.date_end);

    if (now >= start && now <= end) {
      isSaleActive = true;
    } else if (now < start) {
      isUpcoming = true;
    }
  }

  // 3. Tính toán giá hiển thị
  // Ưu tiên lấy price_buy từ DB, fallback về price nếu không có
  const originalPrice = product.price_buy || product.price || 0;
  const finalPrice = isSaleActive ? sale.price_sale : originalPrice;
  
  // Tính % giảm giá
  const discountPercent = isSaleActive 
    ? Math.round(((originalPrice - finalPrice) / originalPrice) * 100) 
    : 0;

  return (
    <Link 
        href={`/products/${product.slug || product.id}`} // Ưu tiên slug cho SEO
        className="group block h-full bg-white cursor-pointer border border-transparent hover:border-gray-200 rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg"
    >
        {/* --- KHUNG ẢNH --- */}
        <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden w-full">
             
             {/* Tag Giảm Giá (Góc phải) */}
             {isSaleActive && discountPercent > 0 && (
                <div className="absolute top-0 right-0 bg-red-600 text-white text-xs font-bold px-2 py-1 z-10 rounded-bl-lg shadow-md">
                    -{discountPercent}%
                </div>
             )}

             {/* Tag Sắp Mở Bán (Góc trái) */}
             {isUpcoming && (
                <div className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] uppercase font-bold px-2 py-1 z-10 rounded shadow-md tracking-wider">
                    Sắp diễn ra
                </div>
             )}

             <Image 
                src={product.thumbnail || product.image || 'https://via.placeholder.com/400'} 
                alt={product.name} 
                fill 
                className="object-cover transition-transform duration-700 group-hover:scale-110" 
                unoptimized // Bỏ nếu bạn đã cấu hình next.config.js
             />
             
             {/* Overlay mờ khi hover */}
             <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 pointer-events-none" />
             
             {/* Nút xem nhanh (Option thêm cho đẹp) */}
             <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-center py-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300 text-sm font-medium">
                Xem chi tiết
             </div>
        </div>
        
        {/* --- THÔNG TIN SẢN PHẨM --- */}
        <div className="p-3 text-center flex flex-col gap-1">
            {/* Tên sản phẩm */}
            <h3 className="text-sm text-gray-700 font-medium uppercase tracking-wide truncate group-hover:text-red-600 transition-colors" title={product.name}>
                {product.name}
            </h3>

            {/* Khu vực hiển thị giá */}
            <div className="mt-1 min-h-[44px] flex flex-col justify-center items-center">
                {isSaleActive ? (
                    <>
                        {/* Giá Sale */}
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-red-600 font-sans">
                                {formatPrice(finalPrice)}
                            </span>
                        </div>
                        {/* Giá gốc gạch ngang */}
                        <span className="text-xs text-gray-400 line-through font-sans">
                            {formatPrice(originalPrice)}
                        </span>
                    </>
                ) : (
                    // Giá thường (hoặc giá gốc khi chưa đến giờ sale)
                    <span className={`text-lg font-bold font-sans ${isUpcoming ? 'text-blue-600' : 'text-gray-900'}`}>
                        {formatPrice(originalPrice)}
                    </span>
                )}
            </div>
            
            {/* Nếu sắp sale, hiện ngày bắt đầu */}
            {isUpcoming && (
                <p className="text-[10px] text-blue-500 font-semibold mt-1">
                    Mở bán: {new Date(sale.date_begin).toLocaleDateString('vi-VN')}
                </p>
            )}
        </div>
    </Link>
  )
}