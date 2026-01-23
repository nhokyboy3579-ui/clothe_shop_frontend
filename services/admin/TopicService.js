import api from "@/services/axios";

/**
 * 1. Lấy danh sách Chủ đề
 * @param {Object} params - Bao gồm { page, limit, search, status }
 */
export const fetchTopics = async (params) => {
  // Laravel Paginate sẽ trả về Object chứa { data, last_page, total, ... }
  const response = await api.get("/admin/topics", { params });
  return response.data;
};

/**
 * 2. Lưu Chủ đề (Thêm mới hoặc Cập nhật)
 * @param {Object} data - Dữ liệu từ form
 * @param {Number|null} id - ID nếu là cập nhật
 */
export const saveTopic = async (data, id = null) => {
  if (id) {
    // Cập nhật (Update) - Sử dụng PUT
    // Lưu ý: Topic thường không có upload file nên dùng PUT trực tiếp với JSON là tốt nhất
    return await api.put(`/admin/topics/${id}`, data);
  } else {
    // Thêm mới (Create) - Sử dụng POST
    return await api.post("/admin/topics", data);
  }
};

/**
 * 3. Xóa Chủ đề
 * @param {Number} id
 */
export const deleteTopic = async (id) => {
  return await api.delete(`/admin/topics/${id}`);
};

/**
 * 4. Lấy chi tiết một chủ đề (Nếu cần dùng cho trang edit riêng biệt)
 * @param {Number} id
 */
export const fetchTopicDetail = async (id) => {
  const response = await api.get(`/admin/topics/${id}`);
  return response.data.data;
};
