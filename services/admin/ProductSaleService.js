// services/admin/ProductSaleService.js

import api from "@/services/axios";

const SALE_ENDPOINT = "/admin/product-sales";
const PRODUCT_LIST_ENDPOINT = "/admin/products";

/**
 * 1. Tải danh sách chương trình giảm giá.
 * Hỗ trợ các tham số mới: status_filter, sort_price
 * @param {object} params - { search, page, limit, status_filter, sort_price }
 */
export const fetchSaleData = async (params = {}) => {
  try {
    // Sử dụng axios params thay vì tự tạo queryString để an toàn và sạch sẽ hơn
    const res = await api.get(SALE_ENDPOINT, { params });

    // Trả về toàn bộ data (bao gồm cả pagination info: data, last_page, current_page...)
    return res.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Không thể tải dữ liệu giảm giá."
    );
  }
};

/**
 * 2. Tải danh sách sản phẩm cho dropdown
 */
export const fetchProductsForDropdown = async () => {
  try {
    const res = await api.get(`${PRODUCT_LIST_ENDPOINT}`, {
      params: { limit: 9999 },
    });

    // Trả về mảng data bên trong paginator
    return res.data.data || res.data;
  } catch (error) {
    console.error("Lỗi khi tải danh sách sản phẩm cho dropdown:", error);
    return [];
  }
};

/**
 * 3. Thêm mới hoặc Cập nhật.
 * Lưu ý: Nếu gửi JSON thuần, PUT/PATCH là tốt nhất.
 * Nếu gửi kèm Ảnh (FormData), POST + _method: PUT là bắt buộc cho Laravel.
 */
export const saveSale = async (payload, id = null) => {
  try {
    if (id) {
      // Cập nhật
      const res = await api.put(`${SALE_ENDPOINT}/${id}`, payload);
      return res.data;
    } else {
      // Thêm mới
      const res = await api.post(SALE_ENDPOINT, payload);
      return res.data;
    }
  } catch (error) {
    // Ném lỗi về component để handle validation
    throw error;
  }
};

/**
 * 4. Xóa một chương trình giảm giá
 */
export const deleteSale = async (id) => {
  try {
    const res = await api.delete(`${SALE_ENDPOINT}/${id}`);
    return res.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Lỗi khi xóa chương trình."
    );
  }
};

// Giữ lại alias nếu code cũ của bạn vẫn dùng getSales
export const getSales = fetchSaleData;
