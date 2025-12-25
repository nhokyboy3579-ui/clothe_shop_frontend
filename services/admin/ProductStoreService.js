import axios from "axios";

const API_URL = "http://localhost:8000/api/admin";

export const ProductStoreService = {
  // Lấy danh sách kho (có phân trang)
  getAll: async (params = {}) => {
    // params sẽ chứa { page: 2, per_page: 10, ... }
    
    // Debug: Kiểm tra xem param có được truyền vào không
    console.log("Service Calling API with params:", params);

    const response = await axios.get(`${API_URL}/product-store`, {
      params: params, 
    });
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

  // Lấy danh sách sản phẩm để chọn
  getProductsForSelect: async () => {
    const response = await axios.get(`${API_URL}/products?limit=100`);
    return response.data;
  }
};