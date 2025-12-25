// services/admin/CategoryService.js

import api from '@/services/axios'; // Import instance Axios chung

const CATEGORY_ENDPOINT = '/admin/categories';

/**
 * 1. Tải danh sách thuộc tính, hỗ trợ tìm kiếm và phân trang.
 * @param {object} params - Tham số truy vấn (search, page, limit)
 */
export const fetchCategoryData = async (params = {}) => {
    try {
        const defaultParams = { 
            page: params.page || 1, 
            limit: params.limit || 10,
            search: params.search || ''
        };
        const queryString = new URLSearchParams(defaultParams).toString();
        
        const res = await api.get(`${CATEGORY_ENDPOINT}?${queryString}`); 
        
        return res.data; 

    } catch (error) {
        console.error("Lỗi khi tải dữ liệu danh mục:", error);
        throw new Error(error.response?.data?.message || 'Lỗi tải danh sách danh mục.');
    }
};

/**
 * 2. Thêm mới hoặc Cập nhật Danh mục.
 * @param {FormData} formData - Dữ liệu form bao gồm file ảnh
 * @param {number|null} id - ID danh mục (null nếu là thêm mới)
 */
export const saveCategory = async (formData, id) => {
    const url = id ? `${CATEGORY_ENDPOINT}/${id}` : CATEGORY_ENDPOINT;
    
    if (id) {
        // Cần POST với _method=PUT để upload file
        formData.append('_method', 'PUT'); 
    }

    const res = await api.post(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' } 
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