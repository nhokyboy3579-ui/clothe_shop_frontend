import api from '@/services/axios';

const ENDPOINT = '/admin/posts';

export const fetchPosts = async ({ page = 1, limit = 10, search = '' }) => {
    const params = { page, limit, search };
    const res = await api.get(ENDPOINT, { params });
    return res.data;
};

export const savePost = async (data, id = null) => {
    if (id) {
        return await api.put(`${ENDPOINT}/${id}`, data);
    }
    return await api.post(ENDPOINT, data);
};

export const deletePost = async (id) => {
    return await api.delete(`${ENDPOINT}/${id}`);
};