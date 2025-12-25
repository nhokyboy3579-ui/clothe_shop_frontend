import api from '@/services/axios';

export const fetchTopics = async (params) => {
    const response = await api.get('/admin/topics', { params });
    return response.data;
};

export const saveTopic = async (data, id = null) => {
    if (id) {
        return await api.put(`/admin/topics/${id}`, data);
    } else {
        return await api.post('/admin/topics', data);
    }
};

export const deleteTopic = async (id) => {
    return await api.delete(`/admin/topics/${id}`);
};