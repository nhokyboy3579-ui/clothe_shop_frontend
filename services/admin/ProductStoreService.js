import axios from "axios";

const API_URL = "http://localhost:8000/api/admin";

export const ProductStoreService = {
  // Lấy danh sách kho (có phân trang & lọc)
  getAll: async (params = {}) => {
    // 1. Loại bỏ các tham số rỗng hoặc null để URL sạch hơn
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(
        ([_, v]) => v !== "" && v !== null && v !== undefined
      )
    );

    console.log("Service Calling API with params:", cleanParams);

    const response = await axios.get(`${API_URL}/product-store`, {
      params: cleanParams,
    });

    // Đảm bảo trả về đúng format data cho Component
    return response.data;
  },

  // Lấy chi tiết 1 phiếu nhập
  getById: async (id) => {
    const response = await axios.get(`${API_URL}/product-store/${id}`);
    return response.data;
  },

  // Thêm mới (Nhập hàng)
  add: async (data) => {
    // Nên trả về trực tiếp response.data để component dễ xử lý nếu cần lấy ID mới tạo
    const response = await axios.post(`${API_URL}/product-store`, data);
    return response.data;
  },

  // Cập nhật
  update: async (id, data) => {
    const response = await axios.put(`${API_URL}/product-store/${id}`, data);
    return response.data;
  },

  // Xóa
  delete: async (id) => {
    const response = await axios.delete(`${API_URL}/product-store/${id}`);
    return response.data;
  },

  // Lấy danh sách sản phẩm để chọn (Dropdown)
  getProductsForSelect: async () => {
    // Có thể truyền thêm params nếu backend hỗ trợ lọc sản phẩm chưa có trong kho
    const response = await axios.get(`${API_URL}/products?limit=200`);
    return response.data;
  },
};
