// services/admin/UserService.js

import api from '@/services/axios'; // Import instance Axios chung

const USER_ENDPOINT = '/admin/users';

/**
 * 1. Tải danh sách người dùng, hỗ trợ tìm kiếm.
 * @param {object} params - Tham số truy vấn (search, page, limit)
 * @returns {Promise<Array>}
 */
export const fetchUsersData = async (params = {}) => {
    try {
        // Xây dựng query string an toàn từ tham số (params)
        const queryString = new URLSearchParams(params).toString();
        
        // Gửi query string cho Backend (GET /admin/users?search=...)
        const res = await api.get(`${USER_ENDPOINT}?${queryString}`); 
        
        return res.data; // Trả về mảng users
    } catch (error) {
        console.error("Lỗi khi tải dữ liệu người dùng:", error);
        throw new Error(error.response?.data?.message || 'Không thể tải dữ liệu người dùng.');
    }
};

/**
 * 2. Thêm mới hoặc Cập nhật Người dùng.
 * @param {FormData} formData - Dữ liệu form bao gồm file ảnh
 * @param {number|null} id - ID người dùng (null nếu là thêm mới)
 * @returns {Promise<any>}
 */
export const saveUser = async (formData, id) => {
    const url = id ? `${USER_ENDPOINT}/${id}` : USER_ENDPOINT;
    
    if (id) {
        // Gắn method PUT vào FormData để Laravel nhận dạng
        formData.append('_method', 'PUT');
    }

    // Gửi request POST với Content-Type: multipart/form-data
    const res = await api.post(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' } 
    });
    
    return res.data;
};


/**
 * 3. Xóa một người dùng
 * @param {number} id - ID người dùng cần xóa
 * @returns {Promise<any>}
 */
export const deleteUser = async (id) => {
    const res = await api.delete(`${USER_ENDPOINT}/${id}`);
    return res.data;
};