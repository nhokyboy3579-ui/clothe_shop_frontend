import axios from "axios";

const API_URL = "http://localhost:8000/api";

export const UserProductService = {
  // ... (Giữ nguyên các hàm getAllActive, getById cũ) ...

  getAllActive: async () => {
    try {
      const response = await axios.get(`${API_URL}/products/active`);
      return response.data.data || response.data || [];
    } catch (error) {
      return [];
    }
  },

  getById: async (id) => {
    // ... (Giữ nguyên code cũ)
    const response = await axios.get(`${API_URL}/products/${id}`);
    return response.data.data || response.data;
  },

  // --- THÊM HÀM NÀY ---
  /**
   * Lấy danh sách sản phẩm mới nhất (có giới hạn limit)
   */
  getNewest: async (limit = 10) => {
    try {
      const response = await axios.get(`${API_URL}/products/active`);
      let data = response.data.data || response.data || [];

      // Sắp xếp ID giảm dần (Mới nhất lên đầu)
      data.sort((a, b) => b.id - a.id);

      // Cắt lấy số lượng giới hạn
      return data.slice(0, limit);
    } catch (error) {
      console.error("Lỗi lấy sản phẩm mới:", error);
      return [];
    }
  },

  getAllActive: async () => {
    try {
      const response = await axios.get(`${API_URL}/products/active`);
      return response.data.data || response.data || [];
    } catch (error) {
      return [];
    }
  },

  getById: async (id) => {
    const response = await axios.get(`${API_URL}/products/${id}`);
    return response.data.data || response.data;
  },

  getNewest: async (limit = 10) => {
    try {
      const response = await axios.get(`${API_URL}/products/active`);
      let data = response.data.data || response.data || [];
      data.sort((a, b) => b.id - a.id);
      return data.slice(0, limit);
    } catch (error) {
      return [];
    }
  },

  // --- HÀM MỚI THÊM ---
  /**
   * Lấy danh sách ảnh phụ (Gallery) của sản phẩm
   */
  getGallery: async (productId) => {
    try {
      const response = await axios.get(
        `${API_URL}/products/${productId}/images`
      );
      return response.data.data || response.data || [];
    } catch (error) {
      console.error("Lỗi lấy gallery:", error);
      return [];
    }
  },

  getInventory: async (productId) => {
    try {
      const response = await axios.get(
        `${API_URL}/products/${productId}/inventory`
      );
      // Trả về object: { stock: 10, total_import: 100, ... }
      return response.data.data;
    } catch (error) {
      console.error("Lỗi lấy tồn kho:", error);
      // Giá trị mặc định an toàn
      return { stock: 0, total_import: 0, status_text: "Kiểm tra lỗi" };
    }
  },
  getRelated: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/related-products/${id}`);
      return response.data.data; // Trả về mảng sản phẩm liên quan
    } catch (error) {
      console.error("Lỗi lấy sản phẩm liên quan:", error);
      return [];
    }
  },
};
