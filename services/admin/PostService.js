import api from '@/services/axios'; // Đảm bảo bạn đã cấu hình axios instance

// 1. Lấy danh sách (có search, pagination)
export const fetchPosts = async (params) => {
    // params = { page: 1, limit: 10, search: '...' }
    const response = await api.get('/admin/posts', { params });
    return response.data;
};

// 2. Lấy danh sách Chủ đề (Topic)
export const fetchTopicsForPost = async () => {
    const response = await api.get('/admin/posts/topics');
    return response.data.data; 
};

// 3. Thêm hoặc Sửa
export const savePost = async (formData, id = null) => {
    if (id) {
        // --- CẬP NHẬT (Update) ---
        // Lưu ý: Khi dùng FormData để upload file trong Laravel qua method PUT,
        // ta phải dùng POST và thêm field "_method": "PUT"
        formData.append('_method', 'PUT');
        return await api.post(`/admin/posts/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    } else {
        // --- THÊM MỚI (Create) ---
        return await api.post('/admin/posts', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    }
};

// 4. Xóa
export const deletePost = async (id) => {
    return await api.delete(`/admin/posts/${id}`);
};