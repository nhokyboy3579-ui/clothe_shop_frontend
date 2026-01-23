// services/admin/CategoryService.js

import api from "@/services/axios";

const CATEGORY_ENDPOINT = "/admin/categories";

/**
 * 1. Tải danh sách danh mục, hỗ trợ tìm kiếm, phân trang, lọc và sắp xếp.
 * @param {object} params - Tham số truy vấn
 */
export const fetchCategoryData = async (params = {}) => {
  try {
    // Tạo object chứa các tham số mặc định và tham số từ component
    const queryParams = {
      page: params.page || 1,
      limit: params.limit || 10,
      search: params.search || "",
      status: params.status !== undefined ? params.status : "",
      sort_column: params.sort_column || "sort_order",
      sort_direction: params.sort_direction || "asc",
    };

    // Loại bỏ các tham số rỗng để URL gọn hơn (search="" hoặc status="")
    const cleanParams = Object.fromEntries(
      Object.entries(queryParams).filter(([_, v]) => v !== "" && v !== null)
    );

    // Axios có thể tự xử lý object params, không cần URLSearchParams thủ công
    const res = await api.get(CATEGORY_ENDPOINT, {
      params: cleanParams,
    });

    return res.data;
  } catch (error) {
    console.error("Lỗi khi tải dữ liệu danh mục:", error);
    throw new Error(
      error.response?.data?.message || "Lỗi tải danh sách danh mục."
    );
  }
};

/**
 * 2. Thêm mới hoặc Cập nhật Danh mục.
 * Dùng POST + _method=PUT để xử lý được cả Multipart (File) và Method Spoofing của Laravel
 */
export const saveCategory = async (formData, id) => {
  const url = id ? `${CATEGORY_ENDPOINT}/${id}` : CATEGORY_ENDPOINT;

  // Bản chất Axios + Laravel: Khi có File, dùng POST là ổn định nhất
  if (id && !formData.has("_method")) {
    formData.append("_method", "PUT");
  }

  const res = await api.post(url, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data;
};

/**
 * 3. Xóa một danh mục
 */
export const deleteCategory = async (id) => {
  const res = await api.delete(`${CATEGORY_ENDPOINT}/${id}`);
  return res.data;
};
