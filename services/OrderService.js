import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api";

export const OrderService = {
  createOrder: async (orderData) => {
    const token =
      localStorage.getItem("token") || localStorage.getItem("access_token");
    const response = await axios.post(`${API_URL}/checkout`, orderData, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
    return response.data;
  },
};
