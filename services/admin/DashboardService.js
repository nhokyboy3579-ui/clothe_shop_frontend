import api from '@/services/axios';

const DASHBOARD_ENDPOINT = '/admin/dashboard';

export const DashboardService = {
  /**
   * Lấy toàn bộ dữ liệu thống kê tổng hợp cho Dashboard
   * Bao gồm: Stats dòng tiền, Dữ liệu biểu đồ ngày/tháng, Đơn hàng mới nhất
   */
  getDashboardStats: async () => {
    try {
      const response = await api.get(DASHBOARD_ENDPOINT);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi gọi API Dashboard:", error);
      throw error;
    }
  }
};