// services/admin/ProductService.js

import api from '@/services/axios'; // Import instance Axios chung

/**
 * Định nghĩa endpoint
 */
const PRODUCT_ENDPOINT = '/admin/products';
const CATEGORY_ENDPOINT = '/admin/categories';

/**
 * 1. Tải toàn bộ dữ liệu cần thiết cho trang Admin Products (Sản phẩm và Danh mục).
 * FIX: Đảm bảo Categories được trích xuất là một mảng.
 */
export const fetchProductData = async (params = {}) => {
    try {
        // Xây dựng query string an toàn từ tham số (params)
        const queryString = new URLSearchParams(params).toString();
        
        const [productsRes, categoriesRes] = await Promise.all([
            // Tải Products
            api.get(`${PRODUCT_ENDPOINT}?${queryString}`), 
            // Tải Categories
            api.get(CATEGORY_ENDPOINT) 
        ]);
        
        // FIX CỐT LÕI: Kiểm tra và trích xuất mảng categories từ object Paginator
        // Nếu categoriesRes.data là đối tượng Paginator, nó sẽ nằm trong key 'data'.
        const categoriesData = categoriesRes.data.data || categoriesRes.data; 
        
        return {
            // Giả định productsRes.data đã là mảng sản phẩm (hoặc Paginator có thể xử lý)
            products: productsRes.data,
            categories: categoriesData // FIX: Luôn trả về MẢNG Categories cho dropdown
        };
    } catch (error) {
        console.error("Lỗi khi tải dữ liệu sản phẩm:", error);
        throw new Error(error.response?.data?.message || 'Không thể tải dữ liệu từ server.');
    }
};

/**
 * 2. Thêm mới hoặc Cập nhật Sản phẩm.
 */
export const saveProduct = async (formData, id) => {
    const url = id ? `${PRODUCT_ENDPOINT}/${id}` : PRODUCT_ENDPOINT;
    
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
 * 3. Xóa một sản phẩm
 */
export const deleteProduct = async (id) => {
    const res = await api.delete(`${PRODUCT_ENDPOINT}/${id}`);
    return res.data;
};