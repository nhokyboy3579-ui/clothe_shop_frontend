import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

export const UserPostService = {
    // Lấy danh sách bài viết (có lọc theo topicSlug)
    getByTopic: async (topicSlug = null, page = 1) => {
        try {
            const params = { page };
            if (topicSlug) {
                params.topic_slug = topicSlug;
            }
            const response = await axios.get(`${API_URL}/posts`, { params });
            // API trả về: { status: true, data: { current_page, data: [...] }, topic: {...} }
            return response.data; 
        } catch (error) {
            console.error("Lỗi lấy danh sách bài viết:", error);
            return null;
        }
    },

    // Lấy chi tiết bài viết theo Slug
    getDetail: async (slug) => {
        try {
            const response = await axios.get(`${API_URL}/posts/${slug}`);
            return response.data.data;
        } catch (error) {
            console.error("Lỗi lấy chi tiết bài viết:", error);
            return null;
        }
    }
};