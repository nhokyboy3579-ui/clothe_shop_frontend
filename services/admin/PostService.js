import api from "@/services/axios";

// 1. Lấy danh sách (Có search, filter topic, status, pagination)
export const fetchPosts = async (params) => {
  // params có thể bao gồm: { page, limit, search, topic_id, status, type }
  const response = await api.get("/admin/posts", { params });
  return response.data;
};

// 2. Lấy danh sách Chủ đề cho dropdown
export const fetchTopicsForPost = async () => {
  const response = await api.get("/admin/posts/topics");
  // Kiểm tra và trả về mảng dữ liệu
  return Array.isArray(response.data)
    ? response.data
    : response.data.data || [];
};

// 3. Lưu bài viết (Thêm/Sửa)
export const savePost = async (formData, id = null) => {
  const config = {
    headers: { "Content-Type": "multipart/form-data" },
  };

  if (id) {
    // Trick cho Laravel khi Update có kèm File
    // Chỉ append nếu formData là instance của FormData
    if (formData instanceof FormData) {
      formData.append("_method", "PUT");
    }
    return await api.post(`/admin/posts/${id}`, formData, config);
  }

  return await api.post("/admin/posts", formData, config);
};

// 4. Xóa bài viết
export const deletePost = async (id) => {
  return await api.delete(`/admin/posts/${id}`);
};
