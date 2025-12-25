// services/admin/AttributeService.js

import api from '@/services/axios'; 

const ATTRIBUTE_ENDPOINT = '/admin/attributes';

/**
 * 1. Tải danh sách thuộc tính, hỗ trợ tìm kiếm và phân trang.
 * @param {object} params - { search, page, limit }
 */
export const fetchAttributeData = async (params = {}) => {
    try {
        const defaultParams = { 
            page: params.page || 1, 
            limit: params.limit || 10,
            search: params.search || ''
        };
        const queryString = new URLSearchParams(defaultParams).toString();
        
        const res = await api.get(`${ATTRIBUTE_ENDPOINT}?${queryString}`); 
        
        return res.data; // Trả về object paginate từ Laravel

    } catch (error) {
        console.error("Lỗi khi tải dữ liệu thuộc tính:", error);
        throw new Error(error.response?.data?.message || 'Lỗi tải danh sách thuộc tính.');
    }
};

/**
 * 2. Thêm mới hoặc Cập nhật Thuộc tính.
 */
export const saveAttribute = async (payload, id) => {
    const url = id ? `${ATTRIBUTE_ENDPOINT}/${id}` : ATTRIBUTE_ENDPOINT;
    
    if (id) {
        payload._method = 'PUT';
    }

    const res = await api.post(url, payload); 
    
    return res.data;
};


/**
 * 3. Xóa một thuộc tính
 */
export const deleteAttribute = async (id) => {
    const res = await api.delete(`${ATTRIBUTE_ENDPOINT}/${id}`);
    return res.data;
};