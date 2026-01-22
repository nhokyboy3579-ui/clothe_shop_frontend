const API_URL = process.env.NEXT_PUBLIC_API_URL;

const getHeaders = () => {
  // Ưu tiên token thường dùng, nếu không có lấy access_token
  const token =
    localStorage.getItem("token") || localStorage.getItem("access_token");

  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    // Nếu có token thì mới gắn Authorization
    ...(token && { Authorization: `Bearer ${token}` }),
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
      // Laravel trả về lỗi validation thường có status 422
      if (!response.ok) throw { response: { data, status: response.status } };
      return data;
    } catch (error) {
      throw error;
    }
  },

  // Lấy chi tiết đơn hàng
  getOrderById: async (orderId) => {
    // Chặn request nếu ID không hợp lệ (Tránh lỗi console khi orderId = undefined)
    if (!orderId || orderId === "undefined") {
      console.warn("OrderService: orderId không hợp lệ");
      return null;
    }

    try {
      const response = await fetch(`${API_URL}/orders/${orderId}`, {
        method: "GET",
        headers: getHeaders(),
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Không thể tải chi tiết đơn hàng");
      return data;
    } catch (error) {
      console.error("Lỗi OrderService (getOrderById):", error);
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

  // Hủy đơn hàng
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
