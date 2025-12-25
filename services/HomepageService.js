import api from '@/services/axios';
import { fetchSlideshowBanners } from '@/services/UserBannerService';

export const HomepageService = {
    /**
     * Lấy toàn bộ dữ liệu cần thiết cho trang chủ (Banners + Products)
     * Sử dụng Promise.all để gọi song song giúp tối ưu tốc độ.
     */
    getAllData: async () => {
        try {
            const [banners, productsResponse] = await Promise.all([
                fetchSlideshowBanners(),      // Gọi API Banner
                api.get('/products/active')   // Gọi API Sản phẩm
            ]);

            return {
                banners: banners,
                products: productsResponse.data
            };
        } catch (error) {
            console.error("HomepageService Error:", error);
            throw error; // Ném lỗi để Component xử lý hiển thị
        }
    }
};