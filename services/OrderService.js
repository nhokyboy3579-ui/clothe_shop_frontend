// services/OrderService.js
const API_URL = process.env.NEXT_PUBLIC_API_URL;

const getHeaders = () => {
  const token =
    localStorage.getItem("token") || localStorage.getItem("access_token");
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export const OrderService = {
  // Tạo đơn hàng mới
  createOrder: async (orderPayload) => {
    try {
      const response = await fetch(`${API_URL}/checkout`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(orderPayload),
      });

      const data = await response.json();
      if (!response.ok) throw { response: { data, status: response.status } };
      return data;
    } catch (error) {
      throw error;
    }
  },

  // Lấy danh sách đơn hàng của User
  getMyOrders: async () => {
    try {
      const response = await fetch(`${API_URL}/my-orders`, {
        method: "GET",
        headers: getHeaders(),
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Không thể tải đơn hàng");
      return data;
    } catch (error) {
      console.error("Lỗi OrderService (getMyOrders):", error);
      throw error;
    }
  },

  // --- THÊM PHƯƠNG THỨC HỦY ĐƠN HÀNG ---
  cancelOrder: async (orderId) => {
    try {
      const response = await fetch(`${API_URL}/orders/${orderId}/cancel`, {
        method: "POST",
        headers: getHeaders(),
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Không thể hủy đơn hàng");
      return data;
    } catch (error) {
      console.error("Lỗi OrderService (cancelOrder):", error);
      throw error;
    }
  },
};
