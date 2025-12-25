import axios from '@/services/axios'; 

// SỬA LỖI TẠI ĐÂY:
// Đã xóa bỏ chữ '/api' ở đầu.
// Lý do: Axios của bạn đã có sẵn base URL là '.../api', nên chỉ cần để '/admin/...' là đủ.
const API_ENDPOINT = '/admin/product-images'; 

/**
 * Lấy danh sách ảnh gallery của sản phẩm
 * @param {number|string} productId 
 */
export const getProductImages = async (productId) => {
    const res = await axios.get(`${API_ENDPOINT}/${productId}`);
    return res.data;
};

/**
 * Upload nhiều ảnh vào gallery
 * @param {number|string} productId 
 * @param {FormData} formData - Chứa key 'images[]'
 */
export const uploadProductImages = async (productId, formData) => {
    const res = await axios.post(`${API_ENDPOINT}/${productId}`, formData, {
        headers: { 
            'Content-Type': 'multipart/form-data' 
        }
    });
    return res.data; 
};

/**
 * Xóa một ảnh khỏi gallery
 * @param {number|string} imageId 
 */
export const deleteProductImage = async (imageId) => {
    const res = await axios.delete(`${API_ENDPOINT}/${imageId}`);
    return res.data;
};