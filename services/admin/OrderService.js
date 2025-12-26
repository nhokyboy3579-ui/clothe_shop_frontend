import api from '@/services/axios';

const ORDER_ENDPOINT = '/admin/orders';
const ORDER_STATUS_ENDPOINT = '/admin/orders/update';

/**
 * 1. Tải danh sách đơn hàng
 */
export const fetchOrders = async () => {
    try {
        const res = await api.get(ORDER_ENDPOINT);
        return res.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Không thể tải danh sách đơn hàng.');
    }
};

/**
 * 2. Tải chi tiết đơn hàng
 */
export const fetchOrderDetail = async (orderId) => {
    try {
        const res = await api.get(`${ORDER_ENDPOINT}/${orderId}`);
        return res.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Không tìm thấy chi tiết đơn hàng.');
    }
};

/**
 * 3. Tạo mới đơn hàng từ Admin
 */
export const createOrder = async (payload) => {
    const res = await api.post(ORDER_ENDPOINT, payload);
    return res.data;
};

/**
 * 4. Cập nhật trạng thái đơn hàng
 */
export const updateOrderStatus = async (orderId, newStatus) => {
    const res = await api.put(`${ORDER_STATUS_ENDPOINT}/${orderId}`, { status: newStatus });
    return res.data;
};

/**
 * 5. Xóa đơn hàng (Soft Delete)
 */
export const deleteOrder = async (orderId) => {
    const res = await api.delete(`${ORDER_ENDPOINT}/${orderId}`);
    return res.data;
};