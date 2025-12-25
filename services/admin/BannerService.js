// services/admin/BannerService.js

import api from "@/services/axios";

const BANNER_ENDPOINT = "/admin/banners";

/**
 * 1. Tải danh sách Banner, hỗ trợ tìm kiếm và phân trang.
 */
export const fetchBannerData = async (params = {}) => {
  try {
    const queryString = new URLSearchParams(params).toString();
    const res = await api.get(`${BANNER_ENDPOINT}?${queryString}`);
    return res.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Không thể tải dữ liệu banner."
    );
  }
};

/**
 * 2. Thêm mới hoặc Cập nhật Banner.
 * @param {FormData} formData - Dữ liệu form bao gồm file ảnh
 * @param {number|null} id - ID banner (null nếu là thêm mới)
 */
export const saveBanner = async (formData, id) => {
  const url = id ? `${BANNER_ENDPOINT}/${id}` : BANNER_ENDPOINT;

  let res;

  if (id) {
    formData.append("_method", "PUT");
    res = await api.post(url, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  } else {
    // Thêm mới (POST)
    res = await api.post(url, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }

  return res.data;
};

/**
 * 3. Xóa một banner
 */
export const deleteBanner = async (id) => {
  const res = await api.delete(`${BANNER_ENDPOINT}/${id}`);
  return res.data;
};
