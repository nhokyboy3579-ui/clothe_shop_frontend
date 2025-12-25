import axios from "axios";

const API_URL = "http://localhost:8000/api/admin";

export const ProductStoreService = {
  // Lấy danh sách kho
  getAll: async () => {
    const response = await axios.get(`${API_URL}/product-store`);
    return response.data;
  },

  // Lấy chi tiết 1 phiếu nhập
  getById: async (id) => {
    const response = await axios.get(`${API_URL}/product-store/${id}`);
    return response.data;
  },

  // Thêm mới (Nhập hàng)
  add: async (data) => {
    return await axios.post(`${API_URL}/product-store`, data);
  },

  // Cập nhật
  update: async (id, data) => {
    return await axios.put(`${API_URL}/product-store/${id}`, data);
  },

  // Xóa
  delete: async (id) => {
    return await axios.delete(`${API_URL}/product-store/${id}`);
  },

  // Lấy danh sách sản phẩm để chọn khi nhập kho (Cần API Products)
  getProductsForSelect: async () => {
    // Gọi API lấy tất cả sản phẩm (bạn có thể dùng API products existing)
    // Lưu ý: Nếu sản phẩm nhiều cần làm search, ở đây mình lấy list đơn giản
    const response = await axios.get(`${API_URL}/products?limit=100`); 
    return response.data;
  }
};