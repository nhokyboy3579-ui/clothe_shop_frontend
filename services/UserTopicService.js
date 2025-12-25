import axios from 'axios';

const API_URL = 'http://localhost:8000/api'; 

export const UserTopicService = {
    getAll: async () => {
        try {
            const response = await axios.get(`${API_URL}/topics`);
            return response.data.data || [];
        } catch (error) {
            console.error("Lỗi lấy danh sách chủ đề:", error);
            return [];
        }
    }
};