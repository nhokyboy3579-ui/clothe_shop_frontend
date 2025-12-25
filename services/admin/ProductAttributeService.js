import axios from 'axios';

const API_URL = 'http://localhost:8000/api/admin';

/**
 * 1. Lấy danh sách các loại thuộc tính (Màu, Size...)
 * Tương ứng với import { getAttributeDefinitions }
 */
export const getAttributeDefinitions = async () => {
    // Gọi API lấy danh sách definitions
    const response = await axios.get(`${API_URL}/attributes-list`);
    // Xử lý dữ liệu trả về (Laravel thường bọc trong data)
    return response.data.data || response.data;
};

/**
 * 2. Lấy danh sách thuộc tính của 1 sản phẩm cụ thể
 * Tương ứng với import { getProductAttributes }
 */
export const getProductAttributes = async (productId) => {
    const response = await axios.get(`${API_URL}/product-attributes/${productId}`);
    return response.data.data || response.data;
};

/**
 * 3. Thêm thuộc tính mới cho sản phẩm
 * Tương ứng với import { addProductAttribute }
 */
export const addProductAttribute = async (productId, data) => {
    // data ở đây gồm { attribute_id, value }
    // Backend cần thêm product_id
    return await axios.post(`${API_URL}/product-attributes`, {
        product_id: productId,
        attribute_id: data.attribute_id,
        value: data.value
    });
};

/**
 * 4. Xóa thuộc tính
 * Tương ứng với import { deleteProductAttribute }
 */
export const deleteProductAttribute = async (id) => {
    return await axios.delete(`${API_URL}/product-attributes/${id}`);
};