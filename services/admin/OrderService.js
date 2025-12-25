// services/admin/OrderService.js

import api from '@/services/axios'; // Import instance Axios chung

const ORDER_ENDPOINT = '/admin/orders';
const ORDER_STATUS_ENDPOINT = '/admin/orders/update'; // Endpoint riêng cho PUT status

/**
 * 1. Tải danh sách đơn hàng (Index)
 * @returns {Promise<Array>}
 */
export const fetchOrders = async () => {
    try {
        const res = await api.get(ORDER_ENDPOINT); 
        return res.data;
    } catch (error) {
        console.error("Lỗi khi tải danh sách đơn hàng:", error);
        throw new Error(error.response?.data?.message || 'Không thể tải danh sách đơn hàng.');
    }
};

/**
 * 2. Tải chi tiết đơn hàng (Show)
 * @param {number} orderId - ID đơn hàng
 * @returns {Promise<object>}
 */
export const fetchOrderDetail = async (orderId) => {
    try {
        const res = await api.get(`${ORDER_ENDPOINT}/${orderId}`);
        return res.data;
    } catch (error) {
        console.error(`Lỗi khi tải chi tiết đơn hàng ${orderId}:`, error);
        throw new Error(error.response?.data?.message || 'Không tìm thấy chi tiết đơn hàng.');
    }
};


/**
 * 3. Tạo mới đơn hàng từ Admin
 * @param {object} payload - Dữ liệu đầy đủ (customer info, totals, details)
 * @returns {Promise<any>}
 */
export const createOrder = async (payload) => {
    // Controller Backend sẽ tự tính toán lại subtotal/total_amount dựa trên details và shipping_fee
    const res = await api.post(ORDER_ENDPOINT, payload);
    return res.data;
};


/**
 * 4. Cập nhật trạng thái đơn hàng
 * @param {number} orderId - ID đơn hàng
 * @param {string|number} newStatus - Mã trạng thái mới
 * @returns {Promise<any>}
 */
export const updateOrderStatus = async (orderId, newStatus) => {
    const res = await api.put(`${ORDER_STATUS_ENDPOINT}/${orderId}`, { status: newStatus });
    return res.data;
};


/**
 * 5. Xóa mềm đơn hàng
 * @param {number} orderId - ID đơn hàng
 * @returns {Promise<any>}
 */
export const deleteOrder = async (orderId) => {
    const res = await api.delete(`${ORDER_ENDPOINT}/${orderId}`);
    return res.data;
};