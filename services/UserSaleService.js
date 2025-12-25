import axios from 'axios';

// Cấu hình URL API (Đổi port nếu backend chạy khác port 8000)
const API_URL = 'http://localhost:8000/api';

export const UserSaleService = {
    /**
     * Lấy tất cả sản phẩm đang có trong chương trình Sale
     * (Đã xử lý lọc ngày tháng để chỉ lấy sale còn hạn)
     */
    getActiveSales: async () => {
        try {
            const response = await axios.get(`${API_URL}/products/sale`);
            
            // Xử lý dữ liệu trả về từ API (tránh lỗi null/undefined)
            const rawData = response.data.data || response.data || [];

            if (!Array.isArray(rawData)) return [];

            // Lọc logic ngày tháng ngay tại Service
            const now = new Date();
            const validSales = rawData.filter(item => {
                // Lấy ngày kết thúc (ưu tiên sale_info nếu có, hoặc date_end trực tiếp)
                const endDate = item.sale_info?.date_end || item.date_end;
                
                // Chỉ lấy sản phẩm chưa hết hạn
                return endDate && new Date(endDate) > now;
            });

            return validSales;

        } catch (error) {
            console.error("Lỗi gọi API UserSaleService:", error);
            return []; // Trả về mảng rỗng nếu lỗi để không sập web
        }
    }
};