// services/admin/ProductSaleService.js

import api from '@/services/axios'; 
const API_ENDPOINT = '/admin/product-sales';
const SALE_ENDPOINT = '/admin/product-sales';
const PRODUCT_LIST_ENDPOINT = '/admin/products'; // Endpoint lấy danh sách sản phẩm
export const getSales = async () => {
    const res = await api.get(API_ENDPOINT);
    return res.data;
};

export const createSale = async (data) => {
    const res = await api.post(API_ENDPOINT, data);
    return res.data;
};

export const deleteSale = async (id) => {
    const res = await api.delete(`${API_ENDPOINT}/${id}`);
    return res.data;
};
/**
 * 1. Tải danh sách chương trình giảm giá, hỗ trợ tìm kiếm và phân trang.
 * @param {object} params - Tham số truy vấn (search, page, limit)
 * @returns {Promise<any>}
 */
export const fetchSaleData = async (params = {}) => {
    try {
        const queryString = new URLSearchParams(params).toString();
        // Backend trả về Paginator Object
        const res = await api.get(`${SALE_ENDPOINT}?${queryString}`); 
        
        return res.data; 

    } catch (error) {
        throw new Error(error.response?.data?.message || 'Không thể tải dữ liệu giảm giá.');
    }
};

/**
 * 2. Tải danh sách TẤT CẢ sản phẩm cho dropdown chọn sản phẩm
 * FIX CHÍNH: Đặt tên hàm chính xác là fetchProductsForDropdown để khớp với import bên page.js
 */
export const fetchProductsForDropdown = async () => {
     try {
        // Gọi endpoint Products, thêm tham số limit lớn để lấy toàn bộ danh sách cho dropdown
        const res = await api.get(`${PRODUCT_LIST_ENDPOINT}?limit=9999`); 
        
        // Xử lý trường hợp có Paginator (lấy .data) hoặc mảng trực tiếp
        // API Products của bạn trả về { data: [...] } (paginator) hoặc [...] (array)
        const productsData = res.data.data || res.data;
        
        return productsData;
    } catch (error) {
        console.error("Lỗi khi tải danh sách sản phẩm cho dropdown:", error);
        return []; 
    }
};

/**
 * 3. Thêm mới hoặc Cập nhật Chương trình giảm giá.
 * @param {object} payload - Dữ liệu giảm giá
 * @param {number|null} id - ID chương trình giảm giá (null nếu là thêm mới)
 * @returns {Promise<any>}
 */
export const saveSale = async (payload, id) => {
    const url = id ? `${SALE_ENDPOINT}/${id}` : SALE_ENDPOINT;
    
    // Nếu là cập nhật, thêm _method PUT (cho Laravel xử lý nếu cần)
    if (id) {
        payload._method = 'PUT';
    }

    // Gửi request POST (Laravel cập nhật qua POST + _method: PUT thường ổn định hơn với FormData, 
    // tuy nhiên payload JSON cũng hoạt động tốt với PUT trực tiếp nếu Backend hỗ trợ)
    const res = await api.post(url, payload); 
    
    return res.data;
};


/**
 * 4. Xóa một chương trình giảm giá
 * @param {number} id - ID chương trình giảm giá
 * @returns {Promise<any>}
 */
// export const deleteSale = async (id) => {
//     const res = await api.delete(`${SALE_ENDPOINT}/${id}`);
//     return res.data;
// };